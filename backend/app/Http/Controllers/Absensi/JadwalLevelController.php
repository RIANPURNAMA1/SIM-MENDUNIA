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
        $batches = Batch::aktif()->get();
        $levels = [1, 2, 3, 4];
        $jadwal = JadwalLevel::with('batch')->get()->keyBy(function ($item) {
            return $item->batch_id . '-' . $item->level;
        });

        $jadwalMap = $jadwal->map(function ($item) {
            return [
                'id' => $item->id,
                'batch_id' => $item->batch_id,
                'level' => $item->level,
                'tanggal_mulai' => $item->tanggal_mulai->format('Y-m-d'),
                'tanggal_selesai' => $item->tanggal_selesai->format('Y-m-d'),
                'batch_nama' => $item->batch->nama_batch ?? '-',
            ];
        });

        return response()->json([
            'success' => true,
            'batches' => $batches,
            'levels' => $levels,
            'jadwal' => $jadwalMap,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'batch_id' => 'required|exists:batches,id',
            'level' => 'required|integer|min:-4|max:4',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
        ]);

        JadwalLevel::updateOrCreate(
            ['batch_id' => $request->batch_id, 'level' => $request->level],
            ['tanggal_mulai' => $request->tanggal_mulai, 'tanggal_selesai' => $request->tanggal_selesai]
        );

        // Sync tanggal_mulai / tanggal_selesai ke kelas_sensei hanya untuk level 1-4
        if ($request->level >= 1 && $request->level <= 4) {
            KelasSensei::where('batch_id', $request->batch_id)
                ->where('level', $request->level)
                ->update([
                    'tanggal_mulai' => $request->tanggal_mulai,
                    'tanggal_selesai' => $request->tanggal_selesai,
                ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Jadwal level berhasil disimpan',
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
