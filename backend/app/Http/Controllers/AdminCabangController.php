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
        $pendaftarDitolak = Pendaftar::whereIn('batch_id', $batchIds)
            ->where('status_pendaftaran', 'ditolak')
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

        $totalSiswaAktif = \App\Models\Siswa::whereIn('batch_id', $batchIds)
            ->where('status', 'AKTIF')
            ->count();

        $now = now();
        $totalPengeluaran = (float) \App\Models\Pengeluaran::whereIn('cabang_id', $branchIds)
            ->whereMonth('tanggal', $now->month)
            ->whereYear('tanggal', $now->year)
            ->sum('nominal');

        $recentPendaftar = Pendaftar::with(['batch', 'product'])
            ->whereIn('batch_id', $batchIds)
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'nama' => $p->nama_lengkap ?? $p->name ?? '-',
                'batch' => $p->batch?->nama_batch ?? '-',
                'program' => $p->product?->nama_produk ?? '-',
                'status' => $p->status_pendaftaran,
                'created_at' => $p->created_at,
            ]);

        $recentPembayaran = \App\Models\PembayaranItem::whereIn('pendaftar_id', $pendaftarIds)
            ->with(['pendaftar.batch'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'jumlah' => $p->jumlah,
                'pendaftar' => $p->pendaftar?->nama_lengkap ?? $p->pendaftar?->name ?? '-',
                'batch' => $p->pendaftar?->batch?->nama_batch ?? '-',
                'created_at' => $p->created_at,
            ]);

        // === CHART DATA ===
        $months = collect();
        for ($i = 5; $i >= 0; $i--) {
            $d = now()->subMonths($i);
            $months->push([
                'label' => $d->format('M Y'),
                'month' => (int) $d->format('m'),
                'year'  => (int) $d->format('Y'),
            ]);
        }

        $rekapPendaftar = $months->map(function ($m) use ($batchIds) {
            $count = Pendaftar::whereIn('batch_id', $batchIds)
                ->whereMonth('created_at', $m['month'])
                ->whereYear('created_at', $m['year'])
                ->count();
            return ['label' => $m['label'], 'total' => $count];
        })->toArray();

        $rekapPembayaran = $months->map(function ($m) use ($pendaftarIds) {
            $total = \App\Models\PembayaranItem::whereIn('pendaftar_id', $pendaftarIds)
                ->whereMonth('created_at', $m['month'])
                ->whereYear('created_at', $m['year'])
                ->sum('jumlah');
            return ['label' => $m['label'], 'total' => (float) $total];
        })->toArray();

        $rekapPengeluaran = $months->map(function ($m) use ($branchIds) {
            $total = \App\Models\Pengeluaran::whereIn('cabang_id', $branchIds)
                ->whereMonth('tanggal', $m['month'])
                ->whereYear('tanggal', $m['year'])
                ->sum('nominal');
            return ['label' => $m['label'], 'total' => (float) $total];
        })->toArray();

        $pengeluaranPerKategori = \App\Models\Pengeluaran::whereIn('cabang_id', $branchIds)
            ->whereMonth('tanggal', $now->month)
            ->whereYear('tanggal', $now->year)
            ->join('kategori_pengeluaran', 'pengeluaran.kategori_id', '=', 'kategori_pengeluaran.id')
            ->selectRaw('kategori_pengeluaran.nama as nama, kategori_pengeluaran.kode as kode, SUM(nominal) as total, COUNT(*) as jumlah')
            ->groupBy('kategori_pengeluaran.nama', 'kategori_pengeluaran.kode')
            ->orderByDesc('total')
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
                'pendaftar_ditolak' => $pendaftarDitolak,
                'total_tagihan' => $totalTagihan,
                'total_terkumpul' => $totalTerkumpul,
                'total_outstanding' => $totalTagihan - $totalTerkumpul,
                'total_siswa_aktif' => $totalSiswaAktif,
                'total_pengeluaran_bulan_ini' => $totalPengeluaran,
            ],
            'batches' => $batches,
            'recent_pendaftar' => $recentPendaftar,
            'recent_pembayaran' => $recentPembayaran,
            'charts' => [
                'rekap_pendaftar' => $rekapPendaftar,
                'rekap_pembayaran' => $rekapPembayaran,
                'rekap_pengeluaran' => $rekapPengeluaran,
                'pengeluaran_per_kategori' => $pengeluaranPerKategori,
            ],
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

        // Build ordered kategori list from all products' kategori_items (hierarchical order)
        $orderedNames = [];
        foreach ($data as $p) {
            if ($p->product && is_array($p->product->kategori_items)) {
                $walk = function ($items) use (&$walk, &$orderedNames) {
                    foreach ($items as $item) {
                        $name = strtolower(trim($item['name'] ?? ''));
                        if ($name !== '' && !in_array($name, $orderedNames)) {
                            $orderedNames[] = $name;
                        }
                        if (!empty($item['children'])) {
                            $walk($item['children']);
                        }
                    }
                };
                $walk($p->product->kategori_items);
            }
        }

        // Get all kategoris from DB
        $allKategoris = BiayaKategori::orderBy('urutan')->get();

        // Sort: kategoris matching ordered names first (in hierarchical order), then remaining
        $kategoriByName = $allKategoris->keyBy(fn($k) => strtolower($k->nama));
        $kategoriByKode = $allKategoris->keyBy(fn($k) => strtolower($k->kode));
        $kategoris = collect();
        $usedIds = [];

        foreach ($orderedNames as $name) {
            $k = $kategoriByName->get($name) ?? $kategoriByKode->get($name);
            if ($k && !in_array($k->id, $usedIds)) {
                $kategoris->push($k);
                $usedIds[] = $k->id;
            }
        }
        // Append remaining kategoris not in any product's kategori_items
        foreach ($allKategoris as $k) {
            if (!in_array($k->id, $usedIds)) {
                $kategoris->push($k);
            }
        }

        $pendaftarIds = $data->pluck('id');
        $allPembayaran = PembayaranItem::whereIn('pendaftar_id', $pendaftarIds)
            ->get()
            ->groupBy('pendaftar_id');

        $result = $data->map(function ($p) use ($kategoris, $allPembayaran) {
            $pembayaranItems = $allPembayaran->get($p->id, collect())->keyBy('kategori_id');
            $product = $p->product;

            // Build price map from product_biaya_kategori pivot
            $pivotPrices = collect();
            if ($product && $product->relationLoaded('biayaKategoris')) {
                $pivotPrices = $product->biayaKategoris->keyBy('id')->map(fn($k) => (int) $k->pivot->harga);
            }

            // Also build a name-based price map from kategori_items JSON as fallback
            $namaPrices = collect();
            if ($product && is_array($product->kategori_items)) {
                $flatten = function ($items) use (&$flatten, &$namaPrices) {
                    foreach ($items as $item) {
                        $name = trim($item['name'] ?? '');
                        $harga = (int) ($item['harga'] ?? 0);
                        if ($name !== '' && $harga > 0) {
                            $namaPrices->put(strtolower($name), $harga);
                        }
                        if (!empty($item['children'])) {
                            $flatten($item['children']);
                        }
                    }
                };
                $flatten($product->kategori_items);
            }

            // Build a name-based dibayar map from pembayaran_items
            $namaDibayar = collect();
            $kategoriMap = $kategoris->keyBy('id');
            foreach ($pembayaranItems as $katId => $pi) {
                $katModel = $kategoriMap->get($katId);
                if ($katModel) {
                    $namaDibayar->put(strtolower($katModel->nama), (int) $pi->jumlah);
                }
            }

            $detail = $kategoris->map(function ($k) use ($pembayaranItems, $pivotPrices, $namaPrices, $namaDibayar) {
                $pi = $pembayaranItems->get($k->id);
                $biaya = $pivotPrices->get($k->id, 0);
                if ($biaya === 0) {
                    $biaya = $namaPrices->get(strtolower($k->nama), 0);
                }
                if ($biaya === 0) {
                    $biaya = $namaPrices->get(strtolower($k->kode), 0);
                }
                $dibayar = $pi ? (int) $pi->jumlah : 0;
                if ($dibayar === 0) {
                    $dibayar = $namaDibayar->get(strtolower($k->nama), 0);
                }
                if ($dibayar === 0) {
                    $dibayar = $namaDibayar->get(strtolower($k->kode), 0);
                }
                return [
                    'kategori_id' => $k->id,
                    'kode' => $k->kode,
                    'nama' => $k->nama,
                    'biaya' => $biaya,
                    'dibayar' => $dibayar,
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

        $query = Pendaftar::with(['product', 'batch', 'user', 'siswa'])
            ->whereIn('batch_id', $batchIds)
            ->where('status_pendaftaran', 'disetujui');

        if ($request->search) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('nama', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%")
                  ->orWhere('no_registrasi', 'like', "%{$s}%")
                  ->orWhereHas('siswa', fn($sq) => $sq->where('nik', 'like', "%{$s}%"));
            });
        }

        if ($request->batch_id) {
            $query->where('batch_id', $request->batch_id);
        }

        $pendaftar = $query->orderBy('created_at', 'desc')->get();

        $allKandidat = $pendaftar->map(function ($p) {
            $s = $p->siswa;
            $tempat = $s?->tempat_lahir ?? '-';
            $tgl = $s?->tanggal_lahir ?? '-';
            $ttl = ($tempat !== '-' && $tgl !== '-') ? $tempat . ', ' . $tgl : '-';

            return [
                'id' => $p->id,
                'nik' => $s?->nik ?? '-',
                'no_registrasi' => $p->no_registrasi ?? '-',
                'nama' => $p->nama,
                'batch_nama' => $p->batch?->nama_batch ?? '-',
                'real_batch' => $s?->real_batch ?? '-',
                'jenis_kelamin' => $s?->jenis_kelamin ?? '-',
                'ttl' => $ttl,
                'tempat_lahir' => $tempat,
                'tanggal_lahir' => $tgl,
                'alamat' => $s?->alamat ?? '-',
                'desa' => $s?->desa ?? '-',
                'kecamatan' => $s?->kecamatan ?? '-',
                'kabupaten' => $s?->kabupaten ?? '-',
                'provinsi' => $s?->provinsi ?? '-',
                'pendidikan_terakhir' => $s?->pendidikan_terakhir ?? '-',
                'tahun_lulus' => $s?->tahun_lulus ?? '-',
                'tinggi_badan' => $s?->tinggi_badan ?? '-',
                'berat_badan' => $s?->berat_badan ?? '-',
                'goldar' => $s?->goldar ?? '-',
                'ukuran_baju' => $s?->ukuran_baju ?? '-',
                'status_pernikahan' => $s?->status_pernikahan ?? '-',
                'email' => $p->email,
                'no_hp' => $s?->no_hp ?? $p->telepon ?? '-',
                'nama_ortu' => $s?->nama_ortu ?? '-',
                'no_hp_ortu' => $s?->no_hp_ortu ?? '-',
                'status' => $p->status_pendaftaran === 'pending' ? 'Pending'
                    : ($p->status_pendaftaran === 'disetujui' ? 'Disetujui'
                    : ($p->status_pendaftaran === 'ditolak' ? 'Ditolak' : $p->status_pendaftaran)),
                'keterangan' => $s?->keterangan ?? '-',
                'batch_id' => $p->batch_id,
                'user_id' => $p->user_id,
                'program' => $p->product?->nama ?? '-',
            ];
        });

        $batchOptions = $pendaftar->groupBy('batch_id')
            ->map(fn($items, $batchId) => [
                'id' => $batchId,
                'nama' => $items->first()->batch?->nama_batch ?? 'Batch #' . $batchId,
            ])
            ->values();

        return response()->json([
            'kandidat' => $allKandidat,
            'batchOptions' => $batchOptions,
            'totalBatch' => $batchOptions->count(),
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
