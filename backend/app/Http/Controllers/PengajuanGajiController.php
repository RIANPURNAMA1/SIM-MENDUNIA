<?php

namespace App\Http\Controllers;

use App\Models\PengajuanGaji;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PengajuanGajiController extends Controller
{
    private const BULAN = [
        1 => 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];

    public function index(Request $request)
    {
        $user = Auth::user();

        $query = PengajuanGaji::with('user:id,name,email')
            ->orderBy('created_at', 'desc');

        if ($request->boolean('my')) {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('keterangan', 'like', "%$s%")
                    ->orWhere('bulan', 'like', "%$s%")
                    ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%$s%"));
            });
        }

        $perPage = max(1, (int) $request->input('per_page', 15));

        return response()->json($query->paginate($perPage)->withQueryString());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'bulan' => 'nullable|string|max:20',
            'tahun' => 'nullable|integer|min:2000|max:2100',
            'jumlah' => 'nullable|numeric|min:0',
            'keterangan' => 'nullable|string|max:1000',
            'ringkasan_kehadiran' => 'nullable',
        ]);

        $ringkasan = null;
        if ($request->filled('ringkasan_kehadiran')) {
            $decoded = is_array($request->input('ringkasan_kehadiran'))
                ? $request->input('ringkasan_kehadiran')
                : json_decode($request->input('ringkasan_kehadiran'), true);
            $ringkasan = is_array($decoded) ? $decoded : null;
        }

        $pengajuan = PengajuanGaji::create([
            'user_id' => Auth::id(),
            'bulan' => $validated['bulan'] ?? self::BULAN[(int) now()->format('n')],
            'tahun' => $validated['tahun'] ?? (int) now()->format('Y'),
            'jumlah' => $validated['jumlah'] ?? null,
            'keterangan' => $validated['keterangan'] ?? null,
            'status' => 'pending',
            'ringkasan_kehadiran' => $ringkasan,
        ]);

        try {
            $waService = app(\App\Services\WhatsAppService::class);
            $waService->sendPengajuanGajiToAdmin($pengajuan);
        } catch (\Exception $e) {
            \Log::error('Gagal kirim notifikasi WA pengajuan gaji: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Pengajuan gaji terkirim, menunggu disetujui admin',
            'data' => $pengajuan->load('user:id,name,email'),
        ], 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,diproses,disetujui,ditolak',
            'catatan' => 'nullable|string|max:1000',
        ]);

        $pengajuan = PengajuanGaji::findOrFail($id);
        $pengajuan->update([
            'status' => $validated['status'],
            'catatan' => $validated['catatan'] ?? $pengajuan->catatan,
        ]);

        return response()->json([
            'message' => 'Status pengajuan gaji diperbarui',
            'data' => $pengajuan->load('user:id,name,email'),
        ]);
    }
}
