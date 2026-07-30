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

    public function apiIndex(Request $request)
    {
        $perPage = $request->input('per_page');

        if ($perPage) {
            $batches = Batch::withCount('siswas')->with('cabang')
                ->when($request->cabang_id, fn($q) => $q->where('cabang_id', $request->cabang_id))
                ->latest()->paginate($perPage);

            $batches->getCollection()->transform(function ($b) {
                $b->is_penuh = ($b->kuota !== null && $b->siswas_count >= $b->kuota) || $b->is_penuh_manual;
                return $b;
            });

            return response()->json([
                'success' => true,
                'data' => $batches->items(),
                'pagination' => [
                    'current_page' => $batches->currentPage(),
                    'last_page' => $batches->lastPage(),
                    'per_page' => $batches->perPage(),
                    'total' => $batches->total(),
                ],
            ]);
        }

        // Without per_page param, return all (backward compat for filter dropdowns)
        $batches = Batch::withCount('siswas')->with('cabang')
            ->when($request->cabang_id, fn($q) => $q->where('cabang_id', $request->cabang_id))
            ->latest()->get()->map(function ($b) {
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
            'nama_batch' => 'required|string|max:100|unique:batches,nama_batch,NULL,id,cabang_id,' . ($request->cabang_id ?? 'NULL'),
            'cabang_id' => 'nullable|exists:cabangs,id',
            'kuota' => 'nullable|integer|min:1',
            'warna' => 'nullable|string|max:20',
            'link_grup' => 'nullable|string|max:255',
        ]);

        Batch::create($request->only('nama_batch', 'cabang_id', 'kuota', 'warna', 'link_grup'));

        return response()->json([
            'status' => 'success',
            'message' => 'Batch berhasil ditambahkan',
        ]);
    }

    public function update(Request $request, $id)
    {
        $batch = Batch::findOrFail($id);

        $request->validate([
            'nama_batch' => 'required|string|max:100|unique:batches,nama_batch,' . $id . ',id,cabang_id,' . ($request->cabang_id ?? 'NULL'),
            'cabang_id' => 'nullable|exists:cabangs,id',
            'kuota' => 'nullable|integer|min:1',
            'warna' => 'nullable|string|max:20',
            'link_grup' => 'nullable|string|max:255',
        ]);

        $batch->update($request->only('nama_batch', 'cabang_id', 'kuota', 'warna', 'link_grup'));

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

    public function bulkStore(Request $request)
    {
        $request->validate([
            'batches' => 'required|array|min:1|max:50',
            'batches.*.nama_batch' => 'required|string|max:100',
            'batches.*.cabang_id' => 'nullable|exists:cabangs,id',
            'batches.*.kuota' => 'nullable|integer|min:1',
            'batches.*.warna' => 'nullable|string|max:20',
            'batches.*.link_grup' => 'nullable|string|max:255',
        ]);

        $created = [];
        $errors = [];
        $existingNames = [];
        foreach ($request->batches as $batchData) {
            $cabangId = $batchData['cabang_id'] ?? null;
            $exists = Batch::where('nama_batch', $batchData['nama_batch'])
                ->where('cabang_id', $cabangId)
                ->exists();
            if ($exists) {
                $errors[] = $batchData['nama_batch'] . ' sudah ada di cabang ini';
                continue;
            }
            if (in_array($batchData['nama_batch'] . '|' . $cabangId, $existingNames)) {
                $errors[] = $batchData['nama_batch'] . ' duplikat dalam satu permintaan';
                continue;
            }
            $existingNames[] = $batchData['nama_batch'] . '|' . $cabangId;
            $batch = Batch::create([
                'nama_batch' => $batchData['nama_batch'],
                'cabang_id' => $cabangId,
                'kuota' => $batchData['kuota'] ?? null,
                'warna' => $batchData['warna'] ?? null,
                'link_grup' => $batchData['link_grup'] ?? null,
            ]);
            $created[] = $batch;
        }

        return response()->json([
            'status' => 'success',
            'message' => count($created) . ' batch berhasil ditambahkan' . (count($errors) ? ', ' . count($errors) . ' gagal' : ''),
            'data' => $created,
            'errors' => $errors,
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
