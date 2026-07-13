<?php

namespace App\Http\Controllers;

use App\Models\Pendaftar;
use App\Models\Batch;
use App\Models\BatchBiaya;
use App\Models\BiayaKategori;
use App\Models\PembayaranItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminCabangController extends Controller
{
    private function getBranchIds()
    {
        $user = Auth::user();
        return $user->cabang_ids ?? [];
    }

    private function getBranchBatchIds()
    {
        $branchIds = $this->getBranchIds();
        if (empty($branchIds)) {
            return [];
        }
        return Batch::whereIn('cabang_id', $branchIds)
            ->pluck('id')
            ->toArray();
    }

    public function dashboard()
    {
        $user = Auth::user();
        $branchIds = $this->getBranchIds();
        $batchIds = $this->getBranchBatchIds();

        $totalPendaftar = Pendaftar::whereIn('batch_id', $batchIds)->count();
        $pendaftarDisetujui = Pendaftar::whereIn('batch_id', $batchIds)
            ->where('status_pendaftaran', 'disetujui')
            ->count();
        $pendaftarPending = Pendaftar::whereIn('batch_id', $batchIds)
            ->where('status_pendaftaran', 'pending')
            ->count();

        $totalTagihan = 0;
        $totalTerkumpul = 0;
        $kategoris = BiayaKategori::orderBy('urutan')->get();
        $pendaftarIds = Pendaftar::whereIn('batch_id', $batchIds)->pluck('id');
        $allPembayaran = PembayaranItem::whereIn('pendaftar_id', $pendaftarIds)
            ->get()
            ->groupBy('pendaftar_id');

        $pendaftars = Pendaftar::with(['product.biayaKategoris'])
            ->whereIn('batch_id', $batchIds)
            ->get();

        foreach ($pendaftars as $p) {
            $product = $p->product;
            if ($product && $product->relationLoaded('biayaKategoris')) {
                $totalTagihan += $product->biayaKategoris->sum(fn($k) => (int) $k->pivot->harga);
            } else {
                $totalTagihan += (float) ($product->harga ?? 0);
            }
            $pembayaranItems = $allPembayaran->get($p->id, collect());
            $totalTerkumpul += $pembayaranItems->sum('jumlah');
        }

        $batches = Batch::whereIn('id', $batchIds)
            ->withCount(['siswas' => function ($q) {
                $q->where('status', 'AKTIF');
            }])
            ->get();

        return response()->json([
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'branches' => $branchIds,
            'stats' => [
                'total_pendaftar' => $totalPendaftar,
                'pendaftar_disetujui' => $pendaftarDisetujui,
                'pendaftar_pending' => $pendaftarPending,
                'total_tagihan' => $totalTagihan,
                'total_terkumpul' => $totalTerkumpul,
                'total_outstanding' => $totalTagihan - $totalTerkumpul,
            ],
            'batches' => $batches,
        ]);
    }

    public function pendaftar(Request $request)
    {
        $batchIds = $this->getBranchBatchIds();

        $query = Pendaftar::with(['affiliateLink.affiliate', 'product.biayaKategoris', 'user', 'coupon', 'batch'])
            ->whereIn('batch_id', $batchIds)
            ->orderBy('created_at', 'desc');

        if ($request->status_pendaftaran) {
            $query->where('status_pendaftaran', $request->status_pendaftaran);
        }

        if ($request->status_pembayaran) {
            $query->where('status_pembayaran', $request->status_pembayaran);
        }

        if ($request->search) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('nama', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%");
            });
        }

        if ($request->batch_id) {
            $query->where('batch_id', $request->batch_id);
        }

        if ($request->product_id) {
            $query->where('product_id', $request->product_id);
        }

        $data = $query->get();

        $kategoris = BiayaKategori::orderBy('urutan')->get();
        $pendaftarIds = $data->pluck('id');
        $allPembayaran = PembayaranItem::whereIn('pendaftar_id', $pendaftarIds)
            ->get()
            ->groupBy('pendaftar_id');

        $result = $data->map(function ($p) use ($kategoris, $allPembayaran) {
            $pembayaranItems = $allPembayaran->get($p->id, collect())->keyBy('kategori_id');
            $product = $p->product;
            $pivotPrices = collect();
            if ($product && $product->relationLoaded('biayaKategoris')) {
                $pivotPrices = $product->biayaKategoris->keyBy('id')->map(fn($k) => (int) $k->pivot->harga);
            }
            $detail = $kategoris->map(function ($k) use ($pembayaranItems, $pivotPrices) {
                $pi = $pembayaranItems->get($k->id);
                $default = $pivotPrices->get($k->id, 0);
                return [
                    'kategori_id' => $k->id,
                    'kode' => $k->kode,
                    'nama' => $k->nama,
                    'biaya' => $default,
                    'dibayar' => $pi ? (int) $pi->jumlah : 0,
                ];
            });
            return array_merge($p->toArray(), ['detail' => $detail]);
        });

        return response()->json($result);
    }

    public function tagihan(Request $request)
    {
        $batchIds = $this->getBranchBatchIds();

        $query = Pendaftar::with(['product.biayaKategoris', 'batch', 'user'])
            ->whereIn('batch_id', $batchIds)
            ->orderBy('created_at', 'desc');

        if ($request->search) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('nama', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%");
            });
        }

        if ($request->batch_id) {
            $query->where('batch_id', $request->batch_id);
        }

        if ($request->product_id) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->status) {
            $query->where('status_pembayaran', $request->status);
        }

        $data = $query->get();

        $kategoris = BiayaKategori::orderBy('urutan')->get();
        $pendaftarIds = $data->pluck('id');
        $allPembayaran = PembayaranItem::whereIn('pendaftar_id', $pendaftarIds)
            ->get()
            ->groupBy('pendaftar_id');

        $result = $data->map(function ($p) use ($kategoris, $allPembayaran) {
            $pembayaranItems = $allPembayaran->get($p->id, collect())->keyBy('kategori_id');
            $product = $p->product;
            $pivotPrices = collect();
            if ($product && $product->relationLoaded('biayaKategoris')) {
                $pivotPrices = $product->biayaKategoris->keyBy('id')->map(fn($k) => (int) $k->pivot->harga);
            }
            $detail = $kategoris->map(function ($k) use ($pembayaranItems, $pivotPrices) {
                $pi = $pembayaranItems->get($k->id);
                $default = $pivotPrices->get($k->id, 0);
                return [
                    'kategori_id' => $k->id,
                    'kode' => $k->kode,
                    'nama' => $k->nama,
                    'biaya' => $default,
                    'dibayar' => $pi ? (int) $pi->jumlah : 0,
                ];
            });
            return array_merge($p->toArray(), ['detail' => $detail]);
        });

        $totalTagihan = 0;
        $totalTerkumpul = 0;
        foreach ($result as $p) {
            $biayaTotal = collect($p['detail'])->sum('biaya');
            $totalTagihan += $biayaTotal > 0 ? $biayaTotal : ($p['product']['harga'] ?? 0);
            $totalTerkumpul += collect($p['detail'])->sum('dibayar');
        }

        return response()->json([
            'data' => $result,
            'stats' => [
                'total_tagihan' => $totalTagihan,
                'terkumpul' => $totalTerkumpul,
                'outstanding' => $totalTagihan - $totalTerkumpul,
                'total_pendaftar' => $result->count(),
            ],
        ]);
    }

    public function kandidat(Request $request)
    {
        $batchIds = $this->getBranchBatchIds();

        $query = Pendaftar::with(['product', 'batch', 'user'])
            ->whereIn('batch_id', $batchIds);

        if ($request->search) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('nama', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%");
            });
        }

        $pendaftar = $query->orderBy('created_at', 'desc')->get();

        $grouped = $pendaftar->groupBy(fn($p) => $p->batch_id ?? 0);

        $batches = [];
        $ungrouped = $grouped->pull(0);

        foreach ($grouped as $batchId => $items) {
            $batch = $items->first()->batch;
            $batches[] = [
                'id' => $batchId,
                'nama' => $batch?->nama_batch ?? 'Batch #' . $batchId,
                'jumlahKandidat' => $items->count(),
                'kandidat' => $items->map(fn($p) => [
                    'id' => $p->id,
                    'nama' => $p->nama,
                    'email' => $p->email,
                    'telepon' => $p->telepon,
                    'posisi' => $p->product?->nama ?? '-',
                    'status' => $p->status_pendaftaran === 'pending' ? 'Pending'
                        : ($p->status_pendaftaran === 'disetujui' ? 'Disetujui'
                        : ($p->status_pendaftaran === 'ditolak' ? 'Ditolak' : $p->status_pendaftaran)),
                    'tanggalDaftar' => $p->created_at->format('d F Y'),
                    'user_id' => $p->user_id,
                ]),
            ];
        }

        if ($ungrouped) {
            $batches[] = [
                'id' => 0,
                'nama' => 'Tanpa Batch',
                'jumlahKandidat' => $ungrouped->count(),
                'kandidat' => $ungrouped->map(fn($p) => [
                    'id' => $p->id,
                    'nama' => $p->nama,
                    'email' => $p->email,
                    'telepon' => $p->telepon,
                    'posisi' => $p->product?->nama ?? '-',
                    'status' => $p->status_pendaftaran === 'pending' ? 'Pending'
                        : ($p->status_pendaftaran === 'disetujui' ? 'Disetujui'
                        : ($p->status_pendaftaran === 'ditolak' ? 'Ditolak' : $p->status_pendaftaran)),
                    'tanggalDaftar' => $p->created_at->format('d F Y'),
                    'user_id' => $p->user_id,
                ]),
            ];
        }

        return response()->json([
            'batches' => $batches,
            'totalBatch' => count($batches),
            'totalKandidat' => $pendaftar->count(),
            'kandidatAktif' => $pendaftar->where('status_pendaftaran', 'disetujui')->count(),
        ]);
    }

    public function batches()
    {
        $batchIds = $this->getBranchBatchIds();
        $batches = Batch::whereIn('id', $batchIds)
            ->with('cabang')
            ->orderBy('nama_batch')
            ->get();

        return response()->json($batches);
    }

    public function pendingPembayaran()
    {
        $batchIds = $this->getBranchBatchIds();
        $pendaftarIds = Pendaftar::whereIn('batch_id', $batchIds)->pluck('id');

        $pembayaran = \App\Models\Pembayaran::with(['pendaftar.product', 'kategori'])
            ->where('status', 'pending')
            ->whereNotNull('kategori_id')
            ->whereIn('pendaftar_id', $pendaftarIds)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'total' => $pembayaran->count(),
            'data' => $pembayaran,
        ]);
    }

    public function pendingCount()
    {
        $batchIds = $this->getBranchBatchIds();
        $pendaftaran = Pendaftar::whereIn('batch_id', $batchIds)
            ->where('status_pendaftaran', 'pending')
            ->count();
        $tagihan = Pendaftar::whereIn('batch_id', $batchIds)
            ->where('status_pembayaran', 'processing')
            ->count();
        return response()->json(['count' => $pendaftaran, 'tagihan' => $tagihan]);
    }

    public function rekapPerBatch()
    {
        $batchIds = $this->getBranchBatchIds();
        $batches = Batch::whereIn('id', $batchIds)
            ->aktif()
            ->orderBy('nama_batch')
            ->get();

        $kategoris = BiayaKategori::orderBy('urutan')->get();
        $result = [];

        foreach ($batches as $batch) {
            $pendaftar = Pendaftar::with(['product'])
                ->where('batch_id', $batch->id)
                ->orderBy('nama')
                ->get();

            if ($pendaftar->isEmpty()) continue;

            $biayaBatch = BatchBiaya::where('batch_id', $batch->id)
                ->get()
                ->keyBy('kategori_id');

            $pembayaranBatch = PembayaranItem::whereIn('pendaftar_id', $pendaftar->pluck('id'))
                ->get()
                ->groupBy('pendaftar_id');

            $items = $pendaftar->map(function ($p) use ($kategoris, $biayaBatch, $pembayaranBatch) {
                $pembayaranItems = $pembayaranBatch->get($p->id, collect())->keyBy('kategori_id');

                $detail = $kategoris->map(function ($k) use ($biayaBatch, $pembayaranItems) {
                    $bb = $biayaBatch->get($k->id);
                    $pi = $pembayaranItems->get($k->id);
                    $biaya = $bb ? (int) $bb->biaya : 0;
                    $dibayar = $pi ? (int) $pi->jumlah : 0;
                    return [
                        'kategori_id' => $k->id,
                        'kode' => $k->kode,
                        'nama' => $k->nama,
                        'biaya' => $biaya,
                        'dibayar' => $dibayar,
                        'sisa' => max(0, $biaya - $dibayar),
                    ];
                });

                $totalBiaya = $detail->sum('biaya');
                $totalDibayar = $detail->sum('dibayar');

                return [
                    'id' => $p->id,
                    'nama' => $p->nama,
                    'email' => $p->email,
                    'program' => $p->product?->nama ?? '-',
                    'total_biaya' => $totalBiaya,
                    'total_dibayar' => $totalDibayar,
                    'total_sisa' => max(0, $totalBiaya - $totalDibayar),
                    'status_pembayaran' => $p->status_pembayaran,
                    'status_pendaftaran' => $p->status_pendaftaran,
                    'detail' => $detail,
                ];
            });

            $grandBiaya = $items->sum('total_biaya');
            $grandDibayar = $items->sum('total_dibayar');

            $result[] = [
                'batch_id' => $batch->id,
                'batch' => $batch->nama_batch,
                'kuota' => $batch->kuota,
                'siswas_count' => $pendaftar->count(),
                'total_biaya' => $grandBiaya,
                'total_dibayar' => $grandDibayar,
                'total_sisa' => $grandBiaya - $grandDibayar,
                'items' => $items,
            ];
        }

        $grandBiaya = collect($result)->sum('total_biaya');
        $grandDibayar = collect($result)->sum('total_dibayar');

        return response()->json([
            'data' => $result,
            'grand_total_biaya' => $grandBiaya,
            'grand_total_dibayar' => $grandDibayar,
            'grand_total_sisa' => $grandBiaya - $grandDibayar,
            'kategoris' => $kategoris->map(fn($k) => ['id' => $k->id, 'kode' => $k->kode, 'nama' => $k->nama]),
        ]);
    }

    public function myBranches()
    {
        $user = Auth::user();
        $branchIds = $user->cabang_ids ?? [];
        $branches = \App\Models\Cabang::whereIn('id', $branchIds)->get();
        return response()->json($branches);
    }
}
