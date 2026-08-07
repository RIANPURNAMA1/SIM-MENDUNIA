<?php

namespace App\Http\Controllers\Absensi;

use App\Models\Batch;
use App\Models\JadwalLevel;
use App\Models\KelasSensei;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class JadwalLevelController extends Controller
{
    public function index()
    {
        $batches = Batch::aktif()->get();
        $levels = [1, 2, 3, 4];
        $jadwal = JadwalLevel::with('batch')->get()->keyBy(function ($item) {
            return $item->batch_id . '-' . $item->level;
        });

        return view('jadwal-level.index', compact('batches', 'levels', 'jadwal'));
    }

    public function apiIndex()
    {
        $batches = Batch::aktif()->with('cabang')->get();
        $levels = [1, 2, 3, 4];
        $jadwal = JadwalLevel::with('batch', 'submittedBy', 'approvedBy')->get()->keyBy(function ($item) {
            return $item->batch_id . '-' . $item->level;
        });

        $jadwalMap = $jadwal->map(function ($item) {
            return [
                'id' => $item->id,
                'batch_id' => $item->batch_id,
                'level' => $item->level,
                'status' => $item->status,
                'tanggal_mulai' => $item->tanggal_mulai->format('Y-m-d'),
                'tanggal_selesai' => $item->tanggal_selesai->format('Y-m-d'),
                'batch_nama' => $item->batch->nama_batch ?? '-',
                'submitted_by' => $item->submittedBy->name ?? null,
                'approved_by' => $item->approvedBy->name ?? null,
                'approved_at' => $item->approved_at?->format('Y-m-d H:i:s'),
                'rejection_reason' => $item->rejection_reason,
            ];
        });

        $cabangs = \App\Models\Cabang::whereIn('id', $batches->pluck('cabang_id')->unique()->filter())->get();

        return response()->json([
            'success' => true,
            'batches' => $batches,
            'cabangs' => $cabangs,
            'levels' => $levels,
            'jadwal' => $jadwalMap,
        ]);
    }

    public function pendingCount()
    {
        $count = JadwalLevel::where('status', 'menunggu')->count();

        return response()->json(['count' => $count]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'batch_id' => 'required|exists:batches,id',
            'level' => 'required|integer|min:-4|max:4',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
        ]);

        $isUpdate = JadwalLevel::where('batch_id', $request->batch_id)
            ->where('level', $request->level)
            ->exists();

        $jadwal = JadwalLevel::updateOrCreate(
            ['batch_id' => $request->batch_id, 'level' => $request->level],
            [
                'tanggal_mulai' => $request->tanggal_mulai,
                'tanggal_selesai' => $request->tanggal_selesai,
                'status' => 'menunggu',
                'submitted_by' => $request->user()?->id,
                'approved_by' => null,
                'approved_at' => null,
                'rejection_reason' => null,
            ]
        );

        $user = $request->user();
        if ($user && $user->role === 'ADMIN_CABANG') {
            try {
                app(\App\Services\WhatsAppService::class)->sendJadwalLevelToAdmin($jadwal, $isUpdate);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Gagal kirim notifikasi jadwal level: ' . $e->getMessage());
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Jadwal level berhasil disimpan dan menunggu approval',
        ]);
    }

    public function approve($batchId, $level)
    {
        $jadwal = JadwalLevel::where('batch_id', $batchId)
            ->where('level', $level)
            ->firstOrFail();

        if ($jadwal->status === 'ditolak') {
            return response()->json([
                'status' => 'error',
                'message' => 'Jadwal yang ditolak tidak bisa disetujui. Silakan diatur ulang terlebih dahulu.',
            ], 422);
        }

        $jadwal->update([
            'status' => 'disetujui',
            'approved_by' => request()->user()?->id,
            'approved_at' => now(),
            'rejection_reason' => null,
        ]);

        // Sync tanggal ke kelas_sensei hanya untuk level 1-4 dan setelah disetujui
        if ($level >= 1 && $level <= 4) {
            KelasSensei::where('batch_id', $batchId)
                ->where('level', $level)
                ->update([
                    'tanggal_mulai' => $jadwal->tanggal_mulai,
                    'tanggal_selesai' => $jadwal->tanggal_selesai,
                ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Jadwal level berhasil disetujui',
        ]);
    }

    public function reject(Request $request, $batchId, $level)
    {
        $request->validate([
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        $jadwal = JadwalLevel::where('batch_id', $batchId)
            ->where('level', $level)
            ->firstOrFail();

        if ($jadwal->status === 'disetujui') {
            return response()->json([
                'status' => 'error',
                'message' => 'Jadwal yang sudah disetujui tidak bisa ditolak.',
            ], 422);
        }

        $jadwal->update([
            'status' => 'ditolak',
            'approved_by' => request()->user()?->id,
            'approved_at' => now(),
            'rejection_reason' => $request->rejection_reason,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Jadwal level ditolak',
        ]);
    }

    public function show($batchId, $level)
    {
        $jadwal = JadwalLevel::where('batch_id', $batchId)
            ->where('level', $level)
            ->first();

        return response()->json($jadwal);
    }

    public function destroy($batchId, $level)
    {
        JadwalLevel::where('batch_id', $batchId)
            ->where('level', $level)
            ->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Jadwal level berhasil dihapus',
        ]);
    }

    public function getJadwal(Request $request)
    {
        $request->validate([
            'batch_id' => 'required|exists:batches,id',
            'level' => 'required|integer|min:-4|max:4',
        ]);

        $jadwal = JadwalLevel::where('batch_id', $request->batch_id)
            ->where('level', $request->level)
            ->first();

        return response()->json($jadwal);
    }
}
