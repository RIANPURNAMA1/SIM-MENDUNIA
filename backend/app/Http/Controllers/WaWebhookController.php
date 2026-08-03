<?php

namespace App\Http\Controllers;

use App\Models\Izin;
use App\Models\IzinApproval;
use App\Models\WaIzinApproval;
use App\Services\IzinApprovalService;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WaWebhookController extends Controller
{
    protected WhatsAppService $wa;

    public function __construct(WhatsAppService $wa)
    {
        $this->wa = $wa;
    }

    public function handle(Request $request)
    {
        Log::info('WA Webhook received:', $request->all());

        $payload = $request->all();

        // Robust extraction: berbagai gateway WA (StarSender dkk) membungkus
        // pesan di level berbeda (data.*, message.*, senderPn/remoteJid, dll).
        $message = $this->digPayload($payload, ['message', 'body', 'text', 'content', 'conversation', 'messageBody', 'message_body', 'messageText', 'message_text']);
        $from = $this->digPayload($payload, ['from', 'sender', 'phone', 'sender_number', 'sender_phone', 'senderPhone', 'phoneNumber', 'phone_number', 'wa_id', 'remoteJid', 'senderPn', 'cleanedSenderPn']);

        $from = $this->formatPhone($from);

        // 1) Proses balasan konfirmasi pembayaran dari admin mutasi
        if ($this->isPaymentAdmin($from)) {
            $result = $this->handlePaymentReply($from, $message);
            if ($result) {
                return response()->json($result);
            }
        }

        $managerPhone = $this->formatPhone('085773141623');

        if ($from !== $managerPhone) {
            Log::info("WA Webhook: ignored from non-manager number: {$from}");
            return response()->json(['status' => 'ignored']);
        }

        $reply = strtoupper(trim($message));
        if (!in_array($reply, ['IYA', 'YA', 'YES', 'TIDAK', 'NO', 'GAK'])) {
            Log::info("WA Webhook: unrecognized reply: {$reply}");
            return response()->json(['status' => 'unrecognized']);
        }

        $pending = WaIzinApproval::where('manager_phone', $managerPhone)
            ->where('status', 'PENDING')
            ->latest()
            ->first();

        if (!$pending) {
            Log::info("WA Webhook: no pending approval found for manager");
            $this->wa->sendMessage($managerPhone, "Tidak ada pengajuan izin yang menunggu persetujuan.");
            return response()->json(['status' => 'no_pending']);
        }

        $izin = Izin::with('user')->find($pending->izin_id);
        if (!$izin || $izin->status !== 'PENDING') {
            $pending->update(['status' => 'REJECTED', 'replied_at' => now()]);
            Log::info("WA Webhook: izin not found or already processed");
            return response()->json(['status' => 'not_found']);
        }

        $isApprove = in_array($reply, ['IYA', 'YA', 'YES']);

        $adminId = \App\Models\User::whereIn('role', ['HR', 'MANAGER'])
            ->where('status', 'AKTIF')
            ->orderBy('id')
            ->value('id');

        DB::transaction(function () use ($izin, $pending, $isApprove, $adminId) {
            if ($isApprove) {
                $izin->update([
                    'status' => 'APPROVED',
                    'approved_by' => $adminId,
                    'approved_at' => now(),
                ]);
                IzinApproval::create([
                    'izin_id' => $izin->id,
                    'approved_by' => $adminId,
                    'status' => 'APPROVED',
                    'approved_at' => now(),
                ]);
                IzinApprovalService::generateAbsensi($izin);
            } else {
                $izin->update([
                    'status' => 'REJECTED',
                    'approved_by' => $adminId,
                    'approved_at' => now(),
                ]);
                IzinApproval::create([
                    'izin_id' => $izin->id,
                    'approved_by' => $adminId,
                    'status' => 'REJECTED',
                    'approved_at' => now(),
                ]);
            }

            $pending->update([
                'status' => $isApprove ? 'APPROVED' : 'REJECTED',
                'replied_at' => now(),
            ]);
        });

        $statusText = $isApprove ? 'DISETUJUI ✅' : 'DITOLAK ❌';
        $waMessage = "Pengajuan izin atas nama *{$izin->user->name}* ({$izin->jenis_izin}) telah *{$statusText}*.";
        $this->wa->sendMessage($managerPhone, $waMessage);

        Log::info("WA Webhook: izin #{$izin->id} {$statusText}");

        return response()->json([
            'status' => 'success',
            'action' => $isApprove ? 'approved' : 'rejected',
            'izin_id' => $izin->id,
        ]);
    }

    private function formatPhone($number)
    {
        if (!$number) return '';
        $number = preg_replace('/[^0-9]/', '', $number);
        if (substr($number, 0, 1) === '0') {
            $number = '62' . substr($number, 1);
        }
        if (substr($number, 0, 2) !== '62') {
            $number = '62' . $number;
        }
        return $number;
    }

    /**
     * Cari nilai scalar pertama dari salah satu key (case-insensitive) di
     * seluruh struktur payload (termasuk bersarang data.* / message.*).
     */
    private function digPayload($node, array $keys): string
    {
        if (!is_array($node) && !is_object($node)) {
            return '';
        }

        $arr = (array) $node;
        $lower = [];
        foreach ($arr as $k => $v) {
            $lower[strtolower((string) $k)] = $v;
        }

        // 1) Cari di level saat ini (prioritas urutan key)
        foreach ($keys as $key) {
            $lk = strtolower($key);
            if (array_key_exists($lk, $lower)) {
                $v = $lower[$lk];
                if (is_scalar($v)) {
                    return (string) $v;
                }
                // Nilainya object/array (mis. message.conversation) -> turun ke dalamnya
                $nested = $this->digPayload($v, $keys);
                if ($nested !== '') {
                    return $nested;
                }
            }
        }

        // 2) Turun ke semua anak
        foreach ($arr as $v) {
            $r = $this->digPayload($v, $keys);
            if ($r !== '') {
                return $r;
            }
        }

        return '';
    }

    /**
     * Cek apakah nomor termasuk daftar admin mutasi pembayaran
     */
    private function isPaymentAdmin(string $phone): bool
    {
        $phones = \App\Models\NotificationSetting::getValue('wa_pembayaran_admin_phones');
        if (!$phones) return false;
        foreach (array_map('trim', explode(',', $phones)) as $p) {
            if ($p !== '' && $this->formatPhone($p) === $phone) {
                return true;
            }
        }
        return false;
    }

    /**
     * Proses balasan admin: KONFIRMASI => verifikasi pembayaran, BATAL => tolak
     */
    private function handlePaymentReply(string $from, string $message): ?array
    {
        $reply = strtoupper(trim($message));

        $approveWords = ['KONFIRMASI', 'CONFIRM', 'SETUJU', 'VERIFIKASI', 'VERIFY', 'BAYAR'];
        $rejectWords = ['BATAL', 'TOLAK', 'REJECT'];

        $isApprove = in_array($reply, $approveWords);
        $isReject = in_array($reply, $rejectWords);

        if (!$isApprove && !$isReject) {
            Log::info("WA Webhook: unrecognized payment reply: {$reply}");
            return ['status' => 'unrecognized_payment'];
        }

        $approval = \App\Models\WaPaymentApproval::where('admin_phone', $from)
            ->where('status', 'PENDING')
            ->latest()
            ->first();

        if (!$approval) {
            $this->wa->sendMessage($from, "Tidak ada konfirmasi pembayaran yang menunggu balasan. Silakan kirim bukti pembayaran via panel admin.");
            return ['status' => 'no_pending_payment'];
        }

        $pendaftar = \App\Models\Pendaftar::with('product')->find($approval->pendaftar_id);
        if (!$pendaftar) {
            $approval->update(['status' => 'REJECTED', 'replied_at' => now()]);
            return ['status' => 'not_found'];
        }

        $nama = $pendaftar->nama;
        $noReg = $pendaftar->no_registrasi ?? '-';

        try {
            if ($isApprove) {
                $this->approvePayment($pendaftar);
            } else {
                $this->rejectPendingPayment($pendaftar);
            }

            $approval->update([
                'status' => $isApprove ? 'APPROVED' : 'REJECTED',
                'replied_at' => now(),
            ]);

            $statusText = $isApprove ? 'KONFIRMASI ✅' : 'BATAL ❌';
            $message = "Pembayaran atas nama *{$nama}* (No. Registrasi: {$noReg}) telah *{$statusText}*.";

            if ($isApprove) {
                $message .= "\n\nStatus kandidat sekarang: *Pembayaran Dikonfirmasi*.";
            } else {
                $message .= "\n\nStatus pembayaran dikembalikan ke *Menunggu Pembayaran*.";
            }

            $this->wa->sendMessage($from, $message);

            Log::info("WA Webhook: payment #{$pendaftar->id} {$statusText} by {$from}");

            return [
                'status' => 'success',
                'action' => $isApprove ? 'approved' : 'rejected',
                'pendaftar_id' => $pendaftar->id,
            ];
        } catch (\Exception $e) {
            Log::error('WA Webhook: gagal proses pembayaran: ' . $e->getMessage());
            $this->wa->sendMessage($from, "Terjadi kesalahan saat memproses pembayaran *{$nama}*. Silakan proses lewat panel admin.");
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    /**
     * Konfirmasi pembayaran: verifikasi semua pembayaran pending pendaftar
     */
    private function approvePayment($pendaftar)
    {
        $updateReq = Request::create(
            "/pendaftar/{$pendaftar->id}/update-status",
            'POST',
            ['status_pembayaran' => 'verified', 'status_pendaftaran' => 'disetujui']
        );

        (new PendaftaranController)->updateStatus($updateReq, $pendaftar->id);
    }

    /**
     * Batalkan pembayaran: tolak semua pembayaran pending pendaftar
     */
    private function rejectPendingPayment($pendaftar)
    {
        $pending = \App\Models\Pembayaran::where('pendaftar_id', $pendaftar->id)
            ->where('status', 'pending')
            ->get();

        foreach ($pending as $pembayaran) {
            try {
                (new PendaftaranController)->rejectPayment($pembayaran->id);
            } catch (\Exception $e) {
                Log::warning("WA Webhook: gagal tolak pembayaran #{$pembayaran->id}: " . $e->getMessage());
            }
        }

        $pendaftar->refresh();
        $sisaPending = \App\Models\Pembayaran::where('pendaftar_id', $pendaftar->id)
            ->where('status', 'pending')
            ->exists();

        if (!$sisaPending) {
            $pendaftar->status_pembayaran = 'unpaid';
            $pendaftar->save();
        }
    }

    public function sendTest(Request $request)
    {
        $request->validate([
            'izin_id' => 'required|exists:izins,id',
        ]);

        $izin = Izin::with('user')->findOrFail($request->izin_id);

        if ($izin->status !== 'PENDING') {
            return response()->json(['error' => 'Izin sudah diproses'], 400);
        }

        $result = $this->sendApprovalRequest($izin);

        return response()->json([
            'success' => $result,
            'message' => $result ? 'Pesan WA berhasil dikirim' : 'Gagal mengirim WA',
        ]);
    }

    public function sendApprovalRequest($izin)
    {
        $managerPhone = $this->formatPhone('085773141623');
        $userName = $izin->user->name;
        $tglMulai = \Carbon\Carbon::parse($izin->tgl_mulai)->translatedFormat('d F Y');
        $tglSelesai = \Carbon\Carbon::parse($izin->tgl_selesai)->translatedFormat('d F Y');
        $periode = $izin->tgl_mulai === $izin->tgl_selesai
            ? $tglMulai
            : "{$tglMulai} s/d {$tglSelesai}";

        WaIzinApproval::create([
            'izin_id' => $izin->id,
            'manager_phone' => $managerPhone,
            'status' => 'PENDING',
        ]);

        $message = "📋 *PENGAJUAN IZIN KARYAWAN*\n\n"
            . "Ada pengajuan izin baru:\n\n"
            . "👤 *Nama:* {$userName}\n"
            . "📋 *Jenis:* {$izin->jenis_izin}\n"
            . "📅 *Tanggal:* {$periode}\n"
            . "📝 *Alasan:* {$izin->alasan}\n\n"
            . "Apakah Anda menyetujui izin ini?\n\n"
            . "Balas: *IYA* untuk menyetujui ✅\n"
            . "Balas: *TIDAK* untuk menolak ❌";

        return $this->wa->sendMessage($managerPhone, $message);
    }
}
