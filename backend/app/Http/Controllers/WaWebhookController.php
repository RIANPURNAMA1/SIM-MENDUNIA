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

        $message = $request->input('message') ?? $request->input('body') ?? $request->input('text') ?? '';
        $from = $request->input('from') ?? $request->input('sender') ?? $request->input('phone') ?? '';

        $from = $this->formatPhone($from);
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
