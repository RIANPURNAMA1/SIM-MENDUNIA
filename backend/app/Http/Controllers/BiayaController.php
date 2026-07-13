<?php

namespace App\Http\Controllers;

use App\Models\Batch;
use App\Models\BatchBiaya;
use App\Models\BiayaKategori;
use App\Models\PembayaranItem;
use App\Models\Pendaftar;
use Illuminate\Http\Request;

class BiayaController extends Controller
{
    public function kategoriIndex()
    {
        $all = BiayaKategori::orderBy('urutan')->get();
        $parents = $all->filter(fn($k) => !$k->parent_id)->values();
        foreach ($parents as $parent) {
            $parent->children = $all->filter(fn($k) => $k->parent_id === $parent->id)->values();
        }
        return response()->json($parents);
    }

    public function kategoriIndexFlat()
    {
        return response()->json(BiayaKategori::orderBy('urutan')->get());
    }

    public function kategoriStore(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:100',
            'kode' => 'required|string|max:50|unique:biaya_kategoris,kode',
            'urutan' => 'nullable|integer|min:0',
            'deskripsi' => 'nullable|string',
            'parent_id' => 'nullable|integer|exists:biaya_kategoris,id',
        ]);

        $kategori = BiayaKategori::create([
            'nama' => $request->nama,
            'kode' => strtoupper($request->kode),
            'urutan' => $request->urutan ?? 0,
            'deskripsi' => $request->deskripsi,
            'parent_id' => $request->parent_id,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Kategori berhasil ditambahkan',
            'data' => $kategori,
        ]);
    }

    public function kategoriUpdate(Request $request, $id)
    {
        $kategori = BiayaKategori::findOrFail($id);

        $request->validate([
            'nama' => 'required|string|max:100',
            'kode' => 'required|string|max:50|unique:biaya_kategoris,kode,' . $id,
            'urutan' => 'nullable|integer|min:0',
            'deskripsi' => 'nullable|string',
            'parent_id' => 'nullable|integer|exists:biaya_kategoris,id',
        ]);

        $kategori->update([
            'nama' => $request->nama,
            'kode' => strtoupper($request->kode),
            'urutan' => $request->urutan ?? $kategori->urutan,
            'deskripsi' => $request->deskripsi,
            'parent_id' => $request->parent_id,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Kategori berhasil diupdate',
            'data' => $kategori,
        ]);
    }

    public function kategoriDestroy($id)
    {
        $kategori = BiayaKategori::findOrFail($id);
        $kategori->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Kategori berhasil dihapus',
        ]);
    }

    public function batchBiayaIndex($batchId)
    {
        $batch = Batch::findOrFail($batchId);
        $data = BatchBiaya::where('batch_id', $batchId)
            ->with('kategori')
            ->get()
            ->keyBy('kategori_id');

        $kategoris = BiayaKategori::orderBy('urutan')->get();
        $result = $kategoris->map(function ($k) use ($data) {
            $bb = $data->get($k->id);
            return [
                'kategori_id' => $k->id,
                'kode' => $k->kode,
                'nama' => $k->nama,
                'biaya' => $bb ? (int) $bb->biaya : 0,
            ];
        });

        return response()->json([
            'batch_id' => $batchId,
            'items' => $result,
            'total_biaya' => $result->sum('biaya'),
        ]);
    }

    public function batchBiayaStore(Request $request, $batchId)
    {
        $batch = Batch::findOrFail($batchId);

        $request->validate([
            'items' => 'required|array',
            'items.*.kategori_id' => 'required|exists:biaya_kategoris,id',
            'items.*.biaya' => 'required|numeric|min:0',
        ]);

        foreach ($request->items as $item) {
            BatchBiaya::updateOrCreate(
                [
                    'batch_id' => $batchId,
                    'kategori_id' => $item['kategori_id'],
                ],
                ['biaya' => $item['biaya']]
            );
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Biaya batch berhasil disimpan',
        ]);
    }

    public function pembayaranItemIndex($pendaftarId)
    {
        $pendaftar = Pendaftar::with('product.biayaKategoris')->findOrFail($pendaftarId);
        $batchId = $pendaftar->batch_id;

        $data = PembayaranItem::where('pendaftar_id', $pendaftarId)
            ->get()
            ->keyBy('kategori_id');

        $biayaBatch = $batchId
            ? BatchBiaya::where('batch_id', $batchId)->get()->keyBy('kategori_id')
            : collect();

        $pivotPrices = collect();
        if ($pendaftar->product && $pendaftar->product->relationLoaded('biayaKategoris')) {
            $pivotPrices = $pendaftar->product->biayaKategoris->keyBy('id')
                ->map(fn($k) => (int) $k->pivot->harga);
        }

        $kategoris = BiayaKategori::orderBy('urutan')->get();
        $result = $kategoris->map(function ($k) use ($data, $biayaBatch, $pivotPrices) {
            $bb = $biayaBatch->get($k->id);
            $pi = $data->get($k->id);
            $biaya = $bb ? (int) $bb->biaya : $pivotPrices->get($k->id, 0);
            return [
                'kategori_id' => $k->id,
                'kode' => $k->kode,
                'nama' => $k->nama,
                'biaya' => $biaya,
                'dibayar' => $pi ? (int) $pi->jumlah : 0,
            ];
        });

        return response()->json([
            'pendaftar_id' => $pendaftarId,
            'items' => $result,
            'total_biaya' => $result->sum('biaya'),
            'total_dibayar' => $result->sum('dibayar'),
        ]);
    }

    public function pembayaranItemStore(Request $request, $pendaftarId)
    {
        $pendaftar = Pendaftar::findOrFail($pendaftarId);

        $request->validate([
            'items' => 'required|array',
            'items.*.kategori_id' => 'required|exists:biaya_kategoris,id',
            'items.*.jumlah' => 'required|numeric|min:0',
        ]);

        foreach ($request->items as $item) {
            PembayaranItem::updateOrCreate(
                [
                    'pendaftar_id' => $pendaftarId,
                    'kategori_id' => $item['kategori_id'],
                ],
                ['jumlah' => $item['jumlah']]
            );
        }

        // Sync total nominal on pendaftar
        $totalDibayar = PembayaranItem::where('pendaftar_id', $pendaftarId)->sum('jumlah');
        $pendaftar->nominal = $totalDibayar;
        $pendaftar->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Pembayaran berhasil disimpan',
        ]);
    }
}
