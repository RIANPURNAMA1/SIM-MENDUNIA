<?php

namespace App\Http\Controllers;

use App\Models\WaNotification;
use App\Models\Pendaftar;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;

class WaNotificationController extends Controller
{
    public function index(Request $request)
    {
        $query = WaNotification::with('pendaftar');

        if ($request->type) {
            $query->where('type', $request->type);
        }

        if ($request->pendaftar_id) {
            $query->where('pendaftar_id', $request->pendaftar_id);
        }

        if ($request->search) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('to_phone', 'like', "%{$s}%")
                  ->orWhereHas('pendaftar', fn($pq) => $pq->where('nama', 'like', "%{$s}%"));
            });
        }

        $data = $query->orderBy('created_at', 'desc')->paginate($request->per_page ?? 25);

        return response()->json($data);
    }

    public function stats()
    {
        $today = now()->startOfDay();

        $total = WaNotification::count();
        $berhasil = WaNotification::where('success', true)->count();
        $gagal = WaNotification::where('success', false)->count();
        $hariIni = WaNotification::where('created_at', '>=', $today)->count();

        $perType = WaNotification::selectRaw('type, count(*) as total, sum(case when success then 1 else 0 end) as berhasil')
            ->groupBy('type')
            ->get();

        return response()->json([
            'total' => $total,
            'berhasil' => $berhasil,
            'gagal' => $gagal,
            'hari_ini' => $hariIni,
            'per_type' => $perType,
        ]);
    }

    public function sendReminder($pendaftarId)
    {
        $pendaftar = Pendaftar::with(['product.biayaKategoris', 'user'])->findOrFail($pendaftarId);

        $waService = new WhatsAppService();
        $sent = $waService->sendPaymentReminder($pendaftar, 0);

        return response()->json([
            'message' => $sent ? 'Pengingat berhasil dikirim' : 'Gagal mengirim pengingat',
        ]);
    }
}
