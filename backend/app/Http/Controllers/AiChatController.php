<?php

namespace App\Http\Controllers;

use App\Services\AiAssistantService;
use App\Services\DatabaseInfoService;
use App\Services\IzinApprovalService;
use App\Models\Izin;
use App\Models\IzinApproval;
use App\Models\Lembur;
use App\Models\Absensi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AiChatController extends Controller
{
    protected AiAssistantService $ai;
    protected DatabaseInfoService $dbInfo;

    public function __construct(AiAssistantService $ai, DatabaseInfoService $dbInfo)
    {
        $this->ai = $ai;
        $this->dbInfo = $dbInfo;
    }

    public function index()
    {
        return view('ai-chat');
    }

    public function send(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        $userMessage = $request->input('message');
        $history = $request->input('history', []);

        $messages = [];

        $messages[] = [
            'role' => 'system',
            'content' => $this->dbInfo->getSystemPrompt(),
        ];

        foreach ($history as $msg) {
            if (isset($msg['role']) && isset($msg['content'])) {
                $messages[] = [
                    'role' => $msg['role'],
                    'content' => $msg['content'],
                ];
            }
        }

        $messages[] = [
            'role' => 'user',
            'content' => $userMessage,
        ];

        try {
            return $this->runConversation($messages);
        } catch (\Exception $e) {
            Log::error('AI Chat Error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Maaf, terjadi kesalahan. Silakan coba lagi.',
            ], 500);
        }
    }

    public function ask(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        $systemPrompt = $this->dbInfo->getSystemPrompt();

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $request->input('message')],
        ];

        try {
            return $this->runConversation($messages);
        } catch (\Exception $e) {
            Log::error('AI Chat Error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Maaf, terjadi kesalahan. Silakan coba lagi.',
            ], 500);
        }
    }

    /**
     * Percakapan multi-langkah: mengizinkan AI mengambil data lewat blok
     * [QUERY], lalu menyusun jawaban final. Maksimal 3 panggilan.
     */
    private function runConversation(array $messages)
    {
        $latestResponse = '';
        $actionResults = [];
        $lastQueryResults = [];

        for ($round = 0; $round < 3; $round++) {
            $latestResponse = $this->ai->chat($messages);

            preg_match_all('/\[QUERY\]([\s\S]*?)\[\/QUERY\]/', $latestResponse, $qMatches);

            if (empty($qMatches[1])) {
                break;
            }

            $results = [];
            foreach ($qMatches[1] as $jsonStr) {
                $query = json_decode(trim($jsonStr), true);
                $results[] = ($query && isset($query['sql']))
                    ? $this->executeQuery($query['sql'])
                    : '[Query tidak valid: format JSON salah.]';
            }

            $clean = trim(preg_replace('/\[QUERY\][\s\S]*?\[\/QUERY\]/', '', $latestResponse));

            if ($round === 2) {
                // Maksimal putaran tercapai, finalisasi dengan hasil query.
                $lastQueryResults = $results;
                $latestResponse = $clean;
                break;
            }

            $messages[] = ['role' => 'assistant', 'content' => $clean ?: '(Sedang mengambil data...)'];
            $messages[] = ['role' => 'system', 'content' => "HASIL QUERY:\n" . implode("\n", $results)];
            $messages[] = ['role' => 'user', 'content' => 'Gunakan hasil query di atas untuk menjawab pertanyaan saya secara final dalam bahasa Indonesia. Jika data benar-benar masih kurang, kirim [QUERY] baru sekali lagi.'];
        }

        $response = $latestResponse;

        preg_match_all('/\[ACTION\]([\s\S]*?)\[\/ACTION\]/', $response, $matches);

        if (!empty($matches[1])) {
            foreach ($matches[1] as $index => $jsonStr) {
                $action = json_decode(trim($jsonStr), true);
                if ($action && isset($action['action'])) {
                    $result = $this->executeAction($action);
                    $actionResults[] = $result;
                }
            }

            $response = preg_replace('/\[ACTION\][\s\S]*?\[\/ACTION\]/', '', $response);
            $response = trim($response);
        }

        if (!empty($lastQueryResults)) {
            $response .= "\n\n📊 **Hasil data yang diambil:**\n" . implode("\n", array_map(fn($r) => "> {$r}", $lastQueryResults));
        }

        if (!empty($actionResults)) {
            $response .= "\n\n✅ **Tindakan yang dilakukan:**\n" . implode("\n", array_map(fn($r) => "- {$r}", $actionResults));
        }

        return response()->json([
            'success' => true,
            'message' => $response,
            'actions' => $actionResults,
        ]);
    }

    private function canQuery(): bool
    {
        $user = auth()->user();
        if (!$user) return false;
        return in_array($user->role, ['HR', 'MANAGER', 'ACCOUNTING', 'ADMIN_CABANG']);
    }

    private function executeQuery(string $sql): string
    {
        if (!$this->canQuery()) {
            return '[Akses ditolak: Anda tidak memiliki izin membaca data sistem.]';
        }

        $sql = trim($sql);
        $sql = rtrim($sql, "; \t\n");

        if ($sql === '') {
            return '[Query kosong.]';
        }

        if (preg_match('/;/', $sql)) {
            return '[Query ditolak: hanya satu statement yang diizinkan.]';
        }

        if (preg_match('/^\s*(WITH|SHOW|DESCRIBE|EXPLAIN|CALL|SET)\b/i', $sql)) {
            return '[Query ditolak: gunakan pernyataan SELECT langsung.]';
        }

        if (!preg_match('/^\s*SELECT\b/i', $sql)) {
            return '[Query ditolak: hanya SELECT yang diizinkan.]';
        }

        $banned = [
            'insert', 'update', 'delete', 'drop', 'alter', 'truncate',
            'create', 'rename', 'grant', 'revoke', 'replace',
            'outfile', 'load_file', 'into outfile', 'sleep(', 'benchmark(',
            'mysql.', 'information_schema.',
        ];
        foreach ($banned as $word) {
            if (stripos($sql, $word) !== false) {
                return '[Query ditolak: mengandung kata terlarang "'.$word.'".]';
            }
        }

        if (!preg_match('/\bLIMIT\b/i', $sql)) {
            $sql .= ' LIMIT 50';
        }

        try {
            $rows = DB::select($sql);
        } catch (\Throwable $e) {
            return '[Query gagal: ' . $e->getMessage() . ']';
        }

        $total = count($rows);
        $displayRows = array_slice($rows, 0, 15);

        $lines = [];
        $lines[] = "Query menghasilkan {$total} baris.";
        foreach ($displayRows as $i => $row) {
            $obj = (array) $row;
            $pieces = [];
            foreach ($obj as $k => $v) {
                $lk = strtolower($k);
                if (in_array($lk, ['password', 'password_plain', 'remember_token', 'token', 'api_token'])) continue;
                $val = is_null($v) ? '-' : (string) $v;
                if (strlen($val) > 50) $val = substr($val, 0, 50) . '…';
                $pieces[] = "{$k}:{$val}";
            }
            $lines[] = ($i + 1) . '. ' . implode(', ', $pieces);
        }

        if ($total > count($displayRows)) {
            $lines[] = '... dan ' . ($total - count($displayRows)) . ' baris lainnya.';
        }

        return '[' . implode(' | ', $lines) . ']';
    }

    private function executeAction(array $action): string
    {
        $user = auth()->user();

        if (!$user->isHR() && !$user->isManager()) {
            return "Tidak punya akses untuk melakukan tindakan ini.";
        }

        try {
            switch ($action['action']) {
                case 'approve_izin':
                    return $this->approveIzin((int) ($action['izin_id'] ?? 0));

                case 'reject_izin':
                    return $this->rejectIzin(
                        (int) ($action['izin_id'] ?? 0),
                        $action['catatan'] ?? null
                    );

                case 'approve_lembur':
                    return $this->approveLembur((int) ($action['lembur_id'] ?? 0));

                case 'reject_lembur':
                    return $this->rejectLembur((int) ($action['lembur_id'] ?? 0));

                case 'update_status_absensi':
                    return $this->updateStatusAbsensi(
                        (int) ($action['absensi_id'] ?? 0),
                        $action['status'] ?? ''
                    );

                default:
                    return "Tindakan '{$action['action']}' tidak dikenal.";
            }
        } catch (\Exception $e) {
            Log::error('AI Action Error: ' . $e->getMessage());
            return "Gagal: {$e->getMessage()}";
        }
    }

    private function approveIzin(int $izinId): string
    {
        $izin = Izin::find($izinId);
        if (!$izin) return "Izin dengan ID {$izinId} tidak ditemukan.";
        if ($izin->status !== 'PENDING') return "Izin #{$izinId} sudah diproses (status: {$izin->status}).";

        DB::transaction(function () use ($izin) {
            $izin->update(['status' => 'APPROVED', 'approved_by' => auth()->id(), 'approved_at' => now()]);
            IzinApproval::create([
                'izin_id' => $izin->id,
                'approved_by' => auth()->id(),
                'status' => 'APPROVED',
                'approved_at' => now(),
            ]);
            IzinApprovalService::generateAbsensi($izin);
        });

        return "Izin #{$izinId} atas nama {$izin->user->name} berhasil disetujui. Absensi otomatis dibuat.";
    }

    private function rejectIzin(int $izinId, ?string $catatan = null): string
    {
        $izin = Izin::find($izinId);
        if (!$izin) return "Izin dengan ID {$izinId} tidak ditemukan.";
        if ($izin->status !== 'PENDING') return "Izin #{$izinId} sudah diproses (status: {$izin->status}).";

        DB::transaction(function () use ($izin, $catatan) {
            $izin->update(['status' => 'REJECTED', 'approved_by' => auth()->id(), 'approved_at' => now()]);
            IzinApproval::create([
                'izin_id' => $izin->id,
                'approved_by' => auth()->id(),
                'status' => 'REJECTED',
                'catatan' => $catatan,
                'approved_at' => now(),
            ]);
        });

        return "Izin #{$izinId} atas nama {$izin->user->name} berhasil ditolak.";
    }

    private function approveLembur(int $lemburId): string
    {
        $lembur = Lembur::find($lemburId);
        if (!$lembur) return "Lembur dengan ID {$lemburId} tidak ditemukan.";
        if ($lembur->status !== 'PENDING') return "Lembur #{$lemburId} sudah diproses (status: {$lembur->status}).";

        $lembur->update(['status' => 'APPROVED']);

        return "Lembur #{$lemburId} atas nama {$lembur->user->name} berhasil disetujui.";
    }

    private function rejectLembur(int $lemburId): string
    {
        $lembur = Lembur::find($lemburId);
        if (!$lembur) return "Lembur dengan ID {$lemburId} tidak ditemukan.";
        if ($lembur->status !== 'PENDING') return "Lembur #{$lemburId} sudah diproses (status: {$lembur->status}).";

        $lembur->update(['status' => 'REJECTED']);

        return "Lembur #{$lemburId} atas nama {$lembur->user->name} berhasil ditolak.";
    }

    private function updateStatusAbsensi(int $absensiId, string $status): string
    {
        $validStatuses = ['HADIR', 'TERLAMBAT', 'IZIN', 'ALPA', 'PULANG LEBIH AWAL', 'TIDAK ABSEN PULANG', 'LIBUR'];
        if (!in_array($status, $validStatuses)) {
            return "Status '{$status}' tidak valid. Pilihan: " . implode(', ', $validStatuses);
        }

        $absen = Absensi::find($absensiId);
        if (!$absen) return "Absensi dengan ID {$absensiId} tidak ditemukan.";

        $updateData = ['status' => $status];
        if ($status === 'HADIR' && $absen->shift) {
            $updateData['jam_masuk'] = $absen->shift->jam_masuk;
            $updateData['jam_keluar'] = $absen->shift->jam_pulang;
        }

        $absen->update($updateData);

        return "Absensi #{$absensiId} atas nama {$absen->user->name} berhasil diubah ke status {$status}.";
    }
}
