<?php

namespace App\Http\Controllers;

use App\Models\Batch;
use App\Models\BatchBiaya;
use App\Models\BatchKategoriDeadline;
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

        // Resolve deadlines: prefer batch_kategori_deadlines (per-batch), fallback to wa_reminder_settings (global)
        $batchDeadlines = collect();
        if ($batchId) {
            $batchDeadlines = BatchKategoriDeadline::where('batch_id', $batchId)
                ->where('is_enabled', true)
                ->get()
                ->keyBy('kategori_id');
        }

        $reminderSettings = \App\Models\WaReminderSetting::where('is_enabled', true)
            ->pluck('jatuh_tempo_hari', 'kategori_id');

        $kategoris = BiayaKategori::orderBy('urutan')->get();
        $result = $kategoris->filter(function ($k) use ($data, $biayaBatch, $pivotPrices) {
            $bb = $biayaBatch->get($k->id);
            $pi = $data->get($k->id);
            $biaya = $bb ? (int) $bb->biaya : $pivotPrices->get($k->id, 0);
            return $biaya > 0;
        })->values()->map(function ($k) use ($data, $biayaBatch, $pivotPrices, $batchDeadlines, $reminderSettings, $pendaftar) {
            $bb = $biayaBatch->get($k->id);
            $pi = $data->get($k->id);
            $biaya = $bb ? (int) $bb->biaya : $pivotPrices->get($k->id, 0);

            // Prefer batch deadline (tanggal_akhir is absolute date)
            $batchDl = $batchDeadlines->get($k->id);
            $tanggal_akhir = null;
            $jatuh_tempo_hari = null;

            if ($batchDl && $batchDl->tanggal_akhir) {
                $tanggal_akhir = $batchDl->tanggal_akhir->format('Y-m-d');
                // Also compute days remaining from tanggal_persetujuan for fallback
                if ($pendaftar->tanggal_persetujuan) {
                    $jatuh_tempo_hari = \Carbon\Carbon::parse($pendaftar->tanggal_persetujuan)
                        ->diffInDays($batchDl->tanggal_akhir);
                }
            } else {
                // Fallback to global reminder settings
                $jatuh_tempo_hari = (int) ($reminderSettings[$k->id] ?? 30);
                if ($pendaftar->tanggal_persetujuan) {
                    $tanggal_akhir = \Carbon\Carbon::parse($pendaftar->tanggal_persetujuan)
                        ->addDays($jatuh_tempo_hari)
                        ->format('Y-m-d');
                }
            }

            return [
                'kategori_id' => $k->id,
                'kode' => $k->kode,
                'nama' => $k->nama,
                'biaya' => $biaya,
                'dibayar' => $pi ? (int) $pi->jumlah : 0,
                'jatuh_tempo_hari' => $jatuh_tempo_hari ?? 30,
                'tanggal_akhir' => $tanggal_akhir,
            ];
        });

        return response()->json([
            'pendaftar_id' => $pendaftarId,
            'tanggal_persetujuan' => $pendaftar->tanggal_persetujuan,
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

        return response()->json([
            'status' => 'success',
            'message' => 'Pembayaran berhasil disimpan',
        ]);
    }
}
