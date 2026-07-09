<?php

namespace App\Http\Controllers;

use App\Models\Batch;
use Illuminate\Http\Request;

class BatchController extends Controller
{
    public function index()
    {
        $batches = Batch::latest()->get();
        return view('batches.index', compact('batches'));
    }

    public function apiIndex()
    {
        $batches = Batch::withCount('siswas')->with('cabang')->latest()->get()->map(function ($b) {
            $b->is_penuh = ($b->kuota !== null && $b->siswas_count >= $b->kuota) || $b->is_penuh_manual;
            return $b;
        });

        return response()->json([
            'success' => true,
            'data' => $batches,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_batch' => 'required|string|max:100|unique:batches,nama_batch',
            'cabang_id' => 'nullable|exists:cabangs,id',
            'kuota' => 'nullable|integer|min:1',
        ]);

        Batch::create($request->only('nama_batch', 'cabang_id', 'kuota'));

        return response()->json([
            'status' => 'success',
            'message' => 'Batch berhasil ditambahkan',
        ]);
    }

    public function update(Request $request, $id)
    {
        $batch = Batch::findOrFail($id);

        $request->validate([
            'nama_batch' => 'required|string|max:100|unique:batches,nama_batch,' . $id,
            'cabang_id' => 'nullable|exists:cabangs,id',
            'kuota' => 'nullable|integer|min:1',
        ]);

        $batch->update($request->only('nama_batch', 'cabang_id', 'kuota'));

        return response()->json([
            'status' => 'success',
            'message' => 'Batch berhasil diperbarui',
        ]);
    }

    public function destroy($id)
    {
        $batch = Batch::findOrFail($id);

        if ($batch->siswas()->count() > 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'Batch tidak bisa dihapus karena masih memiliki ' . $batch->siswas()->count() . ' siswa',
            ], 422);
        }

        $batch->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Batch berhasil dihapus',
        ]);
    }

    public function toggleStatus($id)
    {
        $batch = Batch::findOrFail($id);
        $batch->status = $batch->status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
        $batch->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Status batch berhasil diubah menjadi ' . $batch->status,
        ]);
    }

    public function togglePenuh($id)
    {
        $batch = Batch::findOrFail($id);
        $batch->is_penuh_manual = !$batch->is_penuh_manual;
        $batch->save();

        $label = $batch->is_penuh_manual ? 'Penuh' : 'Tidak Penuh';

        return response()->json([
            'status' => 'success',
            'message' => 'Batch ditandai sebagai ' . $label,
            'is_penuh_manual' => $batch->is_penuh_manual,
        ]);
    }
}
