<?php

namespace App\Http\Controllers;

use App\Models\KelasSensei;
use App\Models\Pendaftar;
use App\Models\Batch;

use App\Models\BiayaKategori;
use App\Models\PembayaranItem;
use App\Models\Siswa;
use App\Models\Guru;
use App\Models\JadwalLevel;
use App\Models\User;
use App\Models\AssessmentCategory;
use App\Models\StudentAssessment;
use App\Models\StudentEvaluation;
use App\Models\PenilaianSetting;
use App\Models\Course;
use App\Models\CourseLesson;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

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

        $allBayar = \App\Models\Pembayaran::whereIn('pendaftar_id', $pendaftarIds)
            ->where('status', 'verified')
            ->get()
            ->groupBy('pendaftar_id');

        $uniqueCodeOperation = \App\Models\PaymentSetting::getValue('unique_code_operation', 'add');

        $result = $data->map(function ($p) use ($kategoris, $allPembayaran, $allBayar, $uniqueCodeOperation) {
            $pembayaranItems = $allPembayaran->get($p->id, collect())->keyBy('kategori_id');
            $pembayaranList = $allBayar->get($p->id, collect());
            $product = $p->product;

            $nameToKategori = [];
            $kodeToKategori = [];
            if ($product && $product->relationLoaded('biayaKategoris')) {
                foreach ($product->biayaKategoris as $k) {
                    $nameToKategori[strtolower($k->nama)] = $k;
                    $kodeToKategori[strtolower($k->kode)] = $k;
                }
            }

            $aggregated = [];
            if ($product && is_array($product->kategori_items)) {
                $walkAgg = function ($items, $depth) use (&$walkAgg, $nameToKategori, $kodeToKategori, &$aggregated) {
                    foreach ($items as $item) {
                        $name = strtolower(trim($item['name'] ?? ''));
                        if ($name === '') continue;
                        $kategori = $nameToKategori[$name] ?? $kodeToKategori[$name] ?? null;
                        if (!$kategori) continue;

                        $children = $item['children'] ?? [];
                        $childHarga = 0;
                        foreach ($children as $c) {
                            $cn = strtolower(trim($c['name'] ?? ''));
                            $ck = $nameToKategori[$cn] ?? $kodeToKategori[$cn] ?? null;
                            if ($ck) $childHarga += (float) ($ck->pivot->harga ?? 0);
                        }

                        if ($depth === 0) {
                            $aggregated[] = [
                                'id' => $kategori->id,
                                'kode' => $kategori->kode,
                                'nama' => $kategori->nama,
                                'biaya' => (float) ($kategori->pivot->harga ?? 0) + $childHarga,
                            ];
                        }

                        if (!empty($children)) {
                            $walkAgg($children, $depth + 1);
                        }
                    }
                };
                $walkAgg($product->kategori_items, 0);
            }

            $detail = [];
            foreach ($aggregated as $item) {
                $pi = $pembayaranItems->get($item['id']);
                $dibayar = $pi ? (int) $pi->jumlah : 0;
                $pembayaran = $pembayaranList->firstWhere('kategori_id', $item['id']);
                $biaya = $item['biaya'];
                $kodeUnik = $pi ? ($pi->kode_unik ?? 0) : 0;
                if ($pi) {
                    $totalTransfer = $pi->total_transfer ?? $biaya;
                } else {
                    $totalTransfer = $uniqueCodeOperation === 'subtract'
                        ? max(0, $biaya - $kodeUnik)
                        : $biaya + $kodeUnik;
                }
                $detail[] = [
                    'kategori_id' => $item['id'],
                    'kode' => $item['kode'],
                    'nama' => $item['nama'],
                    'biaya' => $biaya,
                    'dibayar' => $dibayar,
                    'kode_unik' => $kodeUnik,
                    'total_transfer' => $totalTransfer,
                    'tanggal_bayar' => $pembayaran ? $pembayaran->created_at : null,
                ];
            }
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

        $allBayar = \App\Models\Pembayaran::whereIn('pendaftar_id', $pendaftarIds)
            ->where('status', 'verified')
            ->get()
            ->groupBy('pendaftar_id');

        // Preload PaymentSetting once to avoid N+1 queries inside the loop
        $uniqueCodeOperation = \App\Models\PaymentSetting::getValue('unique_code_operation', 'add');

        $result = $data->map(function ($p) use ($kategoris, $allPembayaran, $allBayar, $uniqueCodeOperation) {
            $pembayaranItems = $allPembayaran->get($p->id, collect())->keyBy('kategori_id');
            $pembayaranList = $allBayar->get($p->id, collect());
            $product = $p->product;

            // Build indexed lookup maps for O(1) kategori matching
            $nameToKategori = [];
            $kodeToKategori = [];
            if ($product && $product->relationLoaded('biayaKategoris')) {
                foreach ($product->biayaKategoris as $k) {
                    $nameToKategori[strtolower($k->nama)] = $k;
                    $kodeToKategori[strtolower($k->kode)] = $k;
                }
            }

            // Build aggregated kategori items from product's kategori_items JSON (same as bayarInfo)
            $aggregated = [];
            if ($product && is_array($product->kategori_items)) {
                $walkAgg = function ($items, $depth) use (&$walkAgg, $nameToKategori, $kodeToKategori, &$aggregated) {
                    foreach ($items as $item) {
                        $name = strtolower(trim($item['name'] ?? ''));
                        if ($name === '') continue;
                        $kategori = $nameToKategori[$name] ?? $kodeToKategori[$name] ?? null;
                        if (!$kategori) continue;

                        $children = $item['children'] ?? [];
                        $childHarga = 0;
                        foreach ($children as $c) {
                            $cn = strtolower(trim($c['name'] ?? ''));
                            $ck = $nameToKategori[$cn] ?? $kodeToKategori[$cn] ?? null;
                            if ($ck) $childHarga += (float) ($ck->pivot->harga ?? 0);
                        }

                        if ($depth === 0) {
                            $aggregated[] = [
                                'id' => $kategori->id,
                                'kode' => $kategori->kode,
                                'nama' => $kategori->nama,
                                'biaya' => (float) ($kategori->pivot->harga ?? 0) + $childHarga,
                            ];
                        }

                        if (!empty($children)) {
                            $walkAgg($children, $depth + 1);
                        }
                    }
                };
                $walkAgg($product->kategori_items, 0);
            }

            $detail = [];
            foreach ($aggregated as $item) {
                $pi = $pembayaranItems->get($item['id']);
                $dibayar = $pi ? (int) $pi->jumlah : 0;
                $pembayaran = $pembayaranList->firstWhere('kategori_id', $item['id']);
                $biaya = $item['biaya'];
                $kodeUnik = $pi ? ($pi->kode_unik ?? 0) : 0;
                if ($pi) {
                    $totalTransfer = $pi->total_transfer ?? $biaya;
                } else {
                    $totalTransfer = $uniqueCodeOperation === 'subtract'
                        ? max(0, $biaya - $kodeUnik)
                        : $biaya + $kodeUnik;
                }
                $detail[] = [
                    'kategori_id' => $item['id'],
                    'kode' => $item['kode'],
                    'nama' => $item['nama'],
                    'biaya' => $biaya,
                    'dibayar' => $dibayar,
                    'kode_unik' => $kodeUnik,
                    'total_transfer' => $totalTransfer,
                    'tanggal_bayar' => $pembayaran ? $pembayaran->created_at : null,
                ];
            }
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

    private function applyTagihanFilters($q, Request $request)
    {
        if ($request->search) {
            $s = $request->search;
            $q->where(function ($qq) use ($s) {
                $qq->where('nama', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%")
                  ->orWhere('no_registrasi', 'like', "%{$s}%");
            });
        }

        if ($request->status) {
            $q->where('status_pembayaran', $request->status);
        }

        if ($request->batch_id) {
            $q->where('batch_id', $request->batch_id);
        }

        if ($request->product_id) {
            $q->where('product_id', $request->product_id);
        }

        if ($request->date_from) {
            $q->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $q->whereDate('created_at', '<=', $request->date_to);
        }
    }

    private function hydrateTagihanData($pendaftars)
    {
        $pendaftarIds = $pendaftars->pluck('id');
        $allPembayaran = PembayaranItem::whereIn('pendaftar_id', $pendaftarIds)
            ->get()
            ->groupBy('pendaftar_id');

        $allBayar = \App\Models\Pembayaran::whereIn('pendaftar_id', $pendaftarIds)
            ->where('status', 'verified')
            ->get()
            ->groupBy('pendaftar_id');

        $uniqueCodeOperation = \App\Models\PaymentSetting::getValue('unique_code_operation', 'add');

        return $pendaftars->map(function ($p) use ($allPembayaran, $allBayar, $uniqueCodeOperation) {
            $pembayaranItems = $allPembayaran->get($p->id, collect())->keyBy('kategori_id');
            $pembayaranList = $allBayar->get($p->id, collect());
            $product = $p->product;

            $nameToKategori = [];
            $kodeToKategori = [];
            if ($product && $product->relationLoaded('biayaKategoris')) {
                foreach ($product->biayaKategoris as $k) {
                    $nameToKategori[strtolower($k->nama)] = $k;
                    $kodeToKategori[strtolower($k->kode)] = $k;
                }
            }

            $aggregated = [];
            if ($product && is_array($product->kategori_items)) {
                $walkAgg = function ($items, $depth) use (&$walkAgg, $nameToKategori, $kodeToKategori, &$aggregated) {
                    foreach ($items as $item) {
                        $name = strtolower(trim($item['name'] ?? ''));
                        if ($name === '') continue;
                        $kategori = $nameToKategori[$name] ?? $kodeToKategori[$name] ?? null;
                        if (!$kategori) continue;

                        $aggregated[] = [
                            'id' => $kategori->id,
                            'kode' => $kategori->kode,
                            'nama' => $kategori->nama,
                            'biaya' => (float) ($kategori->pivot->harga ?? 0),
                        ];

                        $children = $item['children'] ?? [];
                        if (!empty($children)) {
                            $walkAgg($children, $depth + 1);
                        }
                    }
                };
                $walkAgg($product->kategori_items, 0);
            }

            $detail = [];
            foreach ($aggregated as $item) {
                $pi = $pembayaranItems->get($item['id']);
                $dibayar = $pi ? (int) $pi->jumlah : 0;
                $pembayaran = $pembayaranList->firstWhere('kategori_id', $item['id']);
                $biaya = $item['biaya'];
                $kodeUnik = $pi ? ($pi->kode_unik ?? 0) : 0;
                if ($pi) {
                    $totalTransfer = $pi->total_transfer ?? $biaya;
                } else {
                    $totalTransfer = $uniqueCodeOperation === 'subtract'
                        ? max(0, $biaya - $kodeUnik)
                        : $biaya + $kodeUnik;
                }
                $detail[] = [
                    'kategori_id' => $item['id'],
                    'kode' => $item['kode'],
                    'nama' => $item['nama'],
                    'biaya' => $biaya,
                    'dibayar' => $dibayar,
                    'kode_unik' => $kodeUnik,
                    'total_transfer' => $totalTransfer,
                    'tanggal_bayar' => $pembayaran ? $pembayaran->created_at : null,
                ];
            }
            return array_merge($p->toArray(), [
                'detail' => $detail,
                'status_kandidat' => $p->siswa?->status_kandidat,
                'is_cuti' => $p->siswa?->is_cuti ?? false,
            ]);
        });
    }

    /**
     * Ringkasan per batch + statistik (server-side pagination), dibatasi ke cabang admin.
     */
    public function tagihanGroups(Request $request)
    {
        $batchIds = $this->getBranchBatchIds();

        $base = Pendaftar::with(['product.biayaKategoris', 'batch', 'siswa'])
            ->whereIn('batch_id', $batchIds)
            ->orderBy('created_at', 'desc');
        $this->applyTagihanFilters($base, $request);

        $all = $base->get();
        $hydrated = $this->hydrateTagihanData($all);

        $total = 0;
        $paid = 0;
        foreach ($hydrated as $p) {
            if (!empty($p['detail'])) {
                foreach ($p['detail'] as $d) {
                    $biaya = (float) $d['biaya'];
                    if ($biaya <= 0) continue;
                    $total += $biaya;
                    $paid += (float) $d['dibayar'];
                }
            } else {
                $total += (float) ($p['product']['harga'] ?? 0) - (float) ($p['diskon'] ?? 0);
                $paid += (float) ($p['nominal'] ?? 0);
            }
        }
        $stats = [
            'total' => $total,
            'paid' => $paid,
            'outstanding' => max(0, $total - $paid),
            'count' => $all->count(),
        ];

        $pendingPids = \App\Models\Pembayaran::where('status', 'processing')
            ->whereIn('pendaftar_id', $all->pluck('id'))
            ->pluck('pendaftar_id')
            ->unique()
            ->flip();

        $groupMap = [];
        foreach ($hydrated as $p) {
            $bid = $p['batch']['id'] ?? 0;
            if (!isset($groupMap[$bid])) {
                $groupMap[$bid] = [
                    'batch_id' => (int) $bid,
                    'nama_batch' => $p['batch']['nama_batch'] ?? 'Tanpa Batch',
                    'warna' => $p['batch']['warna'] ?? null,
                    'total_pendaftar' => 0,
                    'total_tagihan' => 0,
                    'total_dibayar' => 0,
                    'total_sisa' => 0,
                    'kategori_ids' => [],
                    'has_pending' => false,
                ];
            }
            $groupMap[$bid]['total_pendaftar']++;

            if (!empty($p['detail'])) {
                foreach ($p['detail'] as $d) {
                    $biaya = (float) $d['biaya'];
                    if ($biaya <= 0) continue;
                    $groupMap[$bid]['total_tagihan'] += $biaya;
                    $groupMap[$bid]['total_dibayar'] += (float) $d['dibayar'];
                    $groupMap[$bid]['kategori_ids'][] = $d['kategori_id'];
                }
            } else {
                $groupMap[$bid]['total_tagihan'] += (float) ($p['product']['harga'] ?? 0) - (float) ($p['diskon'] ?? 0);
                $groupMap[$bid]['total_dibayar'] += (float) ($p['nominal'] ?? 0);
            }

            if (isset($pendingPids[$p['id']])) {
                $groupMap[$bid]['has_pending'] = true;
            }
        }

        foreach ($groupMap as &$g) {
            $g['total_sisa'] = max(0, $g['total_tagihan'] - $g['total_dibayar']);
            $g['kategori_ids'] = array_values(array_unique($g['kategori_ids']));
        }
        unset($g);

        $groups = collect($groupMap)->values()
            ->sort(function ($a, $b) {
                if ($a['has_pending'] !== $b['has_pending']) {
                    return $a['has_pending'] ? -1 : 1;
                }
                return $b['batch_id'] <=> $a['batch_id'];
            })
            ->values();

        $page = max(1, (int) $request->get('page', 1));
        $perPage = min(50, max(1, (int) $request->get('per_page', 5)));
        $totalBatches = $groups->count();
        $totalPages = max(1, (int) ceil($totalBatches / $perPage));
        $paged = $groups->slice(($page - 1) * $perPage, $perPage)->values();

        return response()->json([
            'stats' => $stats,
            'batches' => $paged,
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => $totalPages,
            'total' => $totalBatches,
        ]);
    }

    /**
     * Baris kandidat per batch (server-side pagination), dibatasi ke cabang admin.
     */
    public function tagihanBatch(Request $request, $batchId)
    {
        $batchIds = $this->getBranchBatchIds();

        $base = Pendaftar::with(['product.biayaKategoris', 'batch', 'siswa'])
            ->whereIn('batch_id', $batchIds)
            ->orderBy('created_at', 'desc');
        $this->applyTagihanFilters($base, $request);

        if ((int) $batchId === 0) {
            $base->whereNull('batch_id');
        } else {
            $base->where('batch_id', (int) $batchId);
        }

        $page = max(1, (int) $request->get('page', 1));
        $perPage = min(50, max(1, (int) $request->get('per_page', 5)));
        $total = $base->count();
        $rows = $this->hydrateTagihanData($base->skip(($page - 1) * $perPage)->take($perPage)->get());

        return response()->json([
            'batch_id' => (int) $batchId,
            'kandidat' => $rows->values(),
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => max(1, (int) ceil($total / $perPage)),
            'total' => $total,
        ]);
    }

    private static function batchLearningStarted($batchId): bool
    {
        if (!$batchId) return false;

        return \App\Models\JadwalLevel::where('batch_id', $batchId)
            ->where('status', '!=', 'ditolak')
            ->whereDate('tanggal_mulai', '<=', now()->toDateString())
            ->exists();
    }

    public function kandidat(Request $request)
    {
        $batchIds = $this->getBranchBatchIds();

        $query = Pendaftar::with(['product', 'batch.cabang.kontraks', 'kontrakTandaTangans', 'user', 'siswa', 'pembayaranItems.kategori'])
            ->whereIn('batch_id', $batchIds)
            ->where('status_pendaftaran', 'disetujui');

        if ($request->search) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('nama', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%")
                  ->orWhere('no_registrasi', 'like', "%{$s}%")
                  ->orWhereHas('siswa', function ($sq) use ($s) {
                      $sq->where('nik', 'like', "%{$s}%");
                  })
                  ->orWhereHas('user', function ($qq) use ($s) {
                      $qq->where('nik', 'like', "%{$s}%");
                  });
            });
        }

        if ($request->batch_id) {
            $query->where('batch_id', $request->batch_id);
        }

        $pendaftar = $query->orderBy('created_at', 'desc')->get();

        $grouped = $pendaftar->groupBy(function ($p) {
            return $p->batch_id ?? 0;
        });

        $batches = [];
        $ungrouped = $grouped->pull(0);

        $mapKandidat = function ($p) {
            $siswa = $p->siswa;
            $user = $p->user;

            // Compute status_kandidat: use stored value if set, otherwise compute from payment data
            $statusKandidat = $siswa->status_kandidat ?? null;
            if (!$statusKandidat) {
                $statusKandidat = 'Calon Kandidat';
                if ($siswa && $siswa->level_status && in_array('Keluar', $siswa->level_status)) {
                    $statusKandidat = 'Mengundurkan Diri';
                } elseif (self::batchLearningStarted($p->batch_id)) {
                    $statusKandidat = 'Proses Belajar';
                } else {
                    $kategoriItems = $p->product?->kategori_items ?? [];
                    $pembayaranItems = $p->pembayaranItems ?? collect();
                    $paidKategoris = [];
                    foreach ($kategoriItems as $ki) {
                        $biaya = (int) ($ki['harga'] ?? 0);
                        if ($biaya <= 0) continue;
                        $name = strtolower(trim($ki['name'] ?? ''));
                        $pi = $pembayaranItems->first(function ($item) use ($name) {
                            $katNama = strtolower(trim($item->kategori?->nama ?? ''));
                            $katKode = strtolower(trim($item->kategori?->kode ?? ''));
                            return $katNama === $name || $katKode === $name;
                        });
                        $paid = $pi ? (int) $pi->jumlah : 0;
                        $paidKategoris[] = ['name' => $ki['name'], 'biaya' => $biaya, 'paid' => $paid, 'lunas' => $paid >= $biaya];
                    }
                    $totalKategoris = count($paidKategoris);
                    $lunasCount = count(array_filter($paidKategoris, fn($k) => $k['lunas']));
                    if ($totalKategoris > 0 && $lunasCount === $totalKategoris) {
                        $statusKandidat = 'Kandidat Aktif';
                    } elseif ($lunasCount > 0) {
                        $statusKandidat = 'Calon Kandidat';
                    }
                }
            }

            return [
                'id' => $p->id,
                'nama' => $p->nama,
                'email' => $p->email,
                'telepon' => $p->telepon,
                'nik' => $siswa?->nik ?? $user?->nik ?? '-',
                'no_registrasi' => $p->no_registrasi ?? $siswa?->no_registrasi ?? '-',
                'batch_id' => $p->batch_id ?? $siswa?->batch_id,
                'batch_nama' => $p->batch?->nama_batch ?? $siswa?->batchRelasi?->nama_batch ?? '-',
                'batch_warna' => $p->batch?->warna ?? $siswa?->batchRelasi?->warna ?? null,
                'cabang_nama' => $p->batch?->cabang?->nama_cabang ?? '-',
                'real_batch' => $siswa?->real_batch ?? '-',
                'jenis_kelamin' => $siswa?->jenis_kelamin ?? '-',
                'tempat_lahir' => $siswa?->tempat_lahir ?? '-',
                'tanggal_lahir' => $siswa?->tanggal_lahir ? Carbon::parse($siswa->tanggal_lahir)->format('d M Y') : '-',
                'alamat' => $siswa?->alamat ?? $p->alamat ?? '-',
                'desa' => $siswa?->desa ?? $p->desa ?? '-',
                'kecamatan' => $siswa?->kecamatan ?? $p->kecamatan ?? '-',
                'kabupaten' => $siswa?->kabupaten ?? $p->kabupaten ?? '-',
                'provinsi' => $siswa?->provinsi ?? $p->provinsi ?? '-',
                'pendidikan_terakhir' => $siswa?->pendidikan_terakhir ?? $user?->pendidikan_terakhir ?? '-',
                'tahun_lulus' => $siswa?->tahun_lulus ?? '-',
                'tinggi_badan' => $siswa?->tinggi_badan ?? '-',
                'berat_badan' => $siswa?->berat_badan ?? '-',
                'goldar' => $siswa?->goldar ?? '-',
                'ukuran_baju' => $siswa?->ukuran_baju ?? '-',
                'status_pernikahan' => $siswa?->status_pernikahan ?? '-',
                'no_hp' => $siswa?->no_hp ?? $p->telepon ?? '-',
                'nama_ortu' => $siswa?->nama_ortu ?? '-',
                'no_hp_ortu' => $siswa?->no_hp_ortu ?? '-',
                'status_pendaftaran' => $p->status_pendaftaran,
                'status' => $p->status_pendaftaran === 'pending' ? 'Pending'
                    : ($p->status_pendaftaran === 'disetujui' ? 'Disetujui'
                    : ($p->status_pendaftaran === 'ditolak' ? 'Ditolak' : $p->status_pendaftaran)),
                'status_kandidat' => $statusKandidat,
                'tanggalDaftar' => $p->created_at->format('d F Y'),
                'user_id' => $p->user_id,
                'keterangan' => $siswa?->keterangan ?? '-',
                'posisi' => $p->product?->nama ?? '-',
                'status_akademik' => $siswa?->status ?? 'AKTIF',
                'is_cuti' => $siswa?->is_cuti ?? false,
                'cuti_sejak' => $siswa?->cuti_sejak,
                'level_status_keluar' => ($siswa && $siswa->status_kandidat === 'Mengundurkan Diri')
                    || ($siswa && $siswa->level_status && collect($siswa->level_status)->contains('Keluar')),
                'password_plain' => $user?->password_plain ?? null,
                'kontrak' => (function () use ($p) {
                    $k = $p->batch?->cabang?->kontraks?->sortByDesc('created_at')->first();
                    $ttd = $p->kontrakTandaTangans->first();
                    if (!$k && !$ttd) return null;
                    return [
                        'id' => $k?->id,
                        'judul' => $k?->judul,
                        'file_kontrak' => $k?->file_kontrak,
                        'file_kontrak_ttd' => $ttd?->file_ttd,
                        'ttd_uploaded_at' => $ttd?->created_at,
                    ];
                })(),
            ];
        };

        foreach ($grouped as $batchId => $items) {
            $batch = $items->first()->batch;
            $batches[] = [
                'id' => $batchId,
                'nama' => $batch?->nama_batch ?? 'Batch #' . $batchId,
                'warna' => $batch?->warna ?? null,
                'jumlahKandidat' => $items->count(),
                'kandidat' => $items->map($mapKandidat),
            ];
        }

        if ($ungrouped) {
            $batches[] = [
                'id' => 0,
                'nama' => 'Tanpa Batch',
                'warna' => null,
                'jumlahKandidat' => $ungrouped->count(),
                'kandidat' => $ungrouped->map($mapKandidat),
            ];
        }

        $branchIds = $this->getBranchIds();
        $allBatches = Batch::whereIn('cabang_id', $branchIds)->aktif()->orderBy('nama_batch')
            ->get()
            ->map(fn($b) => ['id' => $b->id, 'nama' => $b->nama_batch, 'warna' => $b->warna]);

        $batchOptions = (clone $query)->get()
            ->groupBy('batch_id')
            ->map(fn($items, $batchId) => [
                'id' => $batchId,
                'nama' => $items->first()->batch?->nama_batch ?? 'Batch #' . $batchId,
            ])
            ->values();

        $cabangs = \App\Models\Cabang::whereIn('id', $branchIds)
            ->orderBy('nama_cabang')
            ->get()
            ->map(fn($c) => ['id' => $c->id, 'nama' => $c->nama_cabang]);

        return response()->json([
            'batches' => $batches,
            'allBatches' => $allBatches,
            'totalBatch' => collect($batches)->where('id', '!=', 0)->count(),
            'totalKandidat' => $pendaftar->count(),
            'kandidatAktif' => collect($batches)->flatMap(fn($b) => $b['kandidat'] ?? [])
                ->filter(fn($k) => !($k['is_cuti'] ?? false)
                    && ($k['status_kandidat'] ?? null) !== 'Mengundurkan Diri'
                    && ($k['status_kandidat'] ?? null) !== 'Lulus Pendidikan'
                    && ($k['status_akademik'] ?? 'AKTIF') !== 'NONAKTIF')
                ->count(),
            'cabangs' => $cabangs,
            'batchOptions' => $batchOptions,
        ]);
    }

    public function siswa(Request $request)
    {
        $batchIds = $this->getBranchBatchIds();

        $query = Siswa::with(['shift', 'kelasRelasi', 'batchRelasi'])
            ->whereIn('batch_id', $batchIds);

        if ($request->filled('batch_id')) $query->where('batch_id', $request->batch_id);
        if ($request->filled('status')) $query->where('status', $request->status);
        if ($request->filled('status_kandidat')) $query->where('status_kandidat', $request->status_kandidat);
        if ($request->filled('search')) $query->where('nama', 'like', '%' . $request->search . '%');

        $perPage = $request->per_page ?? 25;
        $siswaPaginator = $query->latest()->paginate($perPage);
        $siswa = $siswaPaginator->getCollection();

        $senseiByBatch = KelasSensei::select('batch_id', 'level')
            ->distinct()
            ->get()
            ->groupBy('batch_id');

        $siswa->each(function ($s) use ($senseiByBatch) {
            $levels = [];
            for ($i = 1; $i <= 4; $i++) {
                $levels["level_{$i}"] = '-';
            }
            $batchSensei = $senseiByBatch->get($s->batch_id);
            if ($batchSensei) {
                $available = $batchSensei->pluck('level')->toArray();
                for ($i = 1; $i <= 4; $i++) {
                    if (in_array($i, $available)) {
                        $levels["level_{$i}"] = 'Active';
                    }
                }
            }
            $stored = $s->level_status ?? [];
            foreach ($stored as $key => $val) {
                if (in_array($key, ['level_1','level_2','level_3','level_4'])) {
                    $levels[$key] = $val;
                }
            }
            $s->level_status = $levels;
        });

        $kelasList = \App\Models\Kelas::aktif()->get();
        $batchList = Batch::whereIn('id', $batchIds)->aktif()->get();
        $shifts = \App\Models\Shift::aktif()->get();

        return response()->json([
            'success' => true,
            'data' => $siswa,
            'kelas_list' => $kelasList,
            'batch_list' => $batchList,
            'shifts' => $shifts,
            'pagination' => [
                'current_page' => $siswaPaginator->currentPage(),
                'last_page' => $siswaPaginator->lastPage(),
                'per_page' => $siswaPaginator->perPage(),
                'total' => $siswaPaginator->total(),
            ],
        ]);
    }

    public function batches(Request $request)
    {
        $batchIds = $this->getBranchBatchIds();
        $perPage = $request->input('per_page');

        $query = Batch::withCount('siswas')->with('cabang')
            ->whereIn('id', $batchIds)
            ->when($request->cabang_id, fn($q) => $q->where('cabang_id', $request->cabang_id))
            ->orderByDesc('id');

        if ($perPage) {
            $batches = $query->paginate($perPage);
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

        $batches = $query->get()->map(function ($b) {
            $b->is_penuh = ($b->kuota !== null && $b->siswas_count >= $b->kuota) || $b->is_penuh_manual;
            return $b;
        });

        return response()->json([
            'success' => true,
            'data' => $batches,
        ]);
    }

    private function assertBranchBatch($batch)
    {
        $branchIds = $this->getBranchIds();
        if (!in_array($batch->cabang_id, $branchIds)) {
            abort(403, 'Batch tidak berada di cabang Anda.');
        }
    }

    public function batchStore(Request $request)
    {
        $branchIds = $this->getBranchIds();
        if (empty($branchIds)) {
            return response()->json(['status' => 'error', 'message' => 'Anda belum memiliki cabang.'], 403);
        }

        $request->validate([
            'nama_batch' => 'required|string|max:100|unique:batches,nama_batch,NULL,id,cabang_id,' . ($request->cabang_id ?? 'NULL'),
            'cabang_id' => 'nullable|integer',
            'kuota' => 'nullable|integer|min:1',
            'warna' => 'nullable|string|max:20',
            'link_grup' => 'nullable|string|max:255',
        ]);

        $cabangId = $request->cabang_id ?: $branchIds[0];
        if (!in_array($cabangId, $branchIds)) {
            return response()->json(['status' => 'error', 'message' => 'Cabang tidak valid.'], 422);
        }

        Batch::create([
            'nama_batch' => $request->nama_batch,
            'cabang_id' => $cabangId,
            'kuota' => $request->kuota,
            'warna' => $request->warna,
            'link_grup' => $request->link_grup,
        ]);

        return response()->json(['status' => 'success', 'message' => 'Batch berhasil ditambahkan']);
    }

    public function batchBulkStore(Request $request)
    {
        $branchIds = $this->getBranchIds();
        if (empty($branchIds)) {
            return response()->json(['status' => 'error', 'message' => 'Anda belum memiliki cabang.'], 403);
        }

        $request->validate([
            'batches' => 'required|array|min:1|max:50',
            'batches.*.nama_batch' => 'required|string|max:100',
            'batches.*.cabang_id' => 'nullable|integer',
            'batches.*.kuota' => 'nullable|integer|min:1',
            'batches.*.warna' => 'nullable|string|max:20',
            'batches.*.link_grup' => 'nullable|string|max:255',
        ]);

        $created = [];
        foreach ($request->batches as $batchData) {
            $cabangId = $batchData['cabang_id'] ?? $branchIds[0];
            if (!in_array($cabangId, $branchIds)) continue;
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
            'message' => count($created) . ' batch berhasil dibuat',
        ]);
    }

    public function batchUpdate(Request $request, $id)
    {
        $batch = Batch::findOrFail($id);
        $this->assertBranchBatch($batch);

        $branchIds = $this->getBranchIds();
        $request->validate([
            'nama_batch' => 'required|string|max:100|unique:batches,nama_batch,' . $id . ',id,cabang_id,' . ($request->cabang_id ?? 'NULL'),
            'cabang_id' => 'nullable|integer',
            'kuota' => 'nullable|integer|min:1',
            'warna' => 'nullable|string|max:20',
            'link_grup' => 'nullable|string|max:255',
        ]);

        $cabangId = $request->cabang_id ?: $batch->cabang_id;
        if (!in_array($cabangId, $branchIds)) {
            return response()->json(['status' => 'error', 'message' => 'Cabang tidak valid.'], 422);
        }

        $batch->update([
            'nama_batch' => $request->nama_batch,
            'cabang_id' => $cabangId,
            'kuota' => $request->kuota,
            'warna' => $request->warna,
            'link_grup' => $request->link_grup,
        ]);

        return response()->json(['status' => 'success', 'message' => 'Batch berhasil diperbarui']);
    }

    public function batchDestroy($id)
    {
        $batch = Batch::findOrFail($id);
        $this->assertBranchBatch($batch);

        if ($batch->siswas()->count() > 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'Batch tidak bisa dihapus karena masih memiliki ' . $batch->siswas()->count() . ' siswa',
            ], 422);
        }

        $batch->delete();
        return response()->json(['status' => 'success', 'message' => 'Batch berhasil dihapus']);
    }

    public function batchToggleStatus($id)
    {
        $batch = Batch::findOrFail($id);
        $this->assertBranchBatch($batch);

        $batch->status = $batch->status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
        $batch->save();

        return response()->json(['status' => 'success', 'message' => 'Status batch berhasil diubah menjadi ' . $batch->status]);
    }

    public function batchTogglePenuh($id)
    {
        $batch = Batch::findOrFail($id);
        $this->assertBranchBatch($batch);

        $batch->is_penuh_manual = !$batch->is_penuh_manual;
        $batch->save();

        return response()->json(['status' => 'success', 'message' => 'Status penuh batch berhasil diubah']);
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

        $allKategoris = BiayaKategori::orderBy('urutan')->get();
        $result = [];

        foreach ($batches as $batch) {
            $pendaftar = Pendaftar::with(['product.biayaKategoris'])
                ->where('batch_id', $batch->id)
                ->orderBy('nama')
                ->get();

            if ($pendaftar->isEmpty()) continue;

            $allPendaftarIds = $pendaftar->pluck('id');
            $allPembayaran = PembayaranItem::whereIn('pendaftar_id', $allPendaftarIds)
                ->get()
                ->groupBy('pendaftar_id');

            $allBayar = \App\Models\Pembayaran::whereIn('pendaftar_id', $allPendaftarIds)
                ->where('status', 'verified')
                ->get()
                ->groupBy('pendaftar_id');

            $batchKategoriUsedIds = new \Illuminate\Support\Collection();

            $uniqueCodeOperation = \App\Models\PaymentSetting::getValue('unique_code_operation', 'add');

            $items = $pendaftar->map(function ($p) use ($allKategoris, $allPembayaran, $allBayar, &$batchKategoriUsedIds, $uniqueCodeOperation) {
                $pembayaranItems = $allPembayaran->get($p->id, collect())->keyBy('kategori_id');
                $pembayaranList = $allBayar->get($p->id, collect());
                $product = $p->product;

                $nameToKategori = [];
                $kodeToKategori = [];
                if ($product && $product->relationLoaded('biayaKategoris')) {
                    foreach ($product->biayaKategoris as $k) {
                        $nameToKategori[strtolower($k->nama)] = $k;
                        $kodeToKategori[strtolower($k->kode)] = $k;
                    }
                }

                $aggregated = [];
                if ($product && is_array($product->kategori_items)) {
                    $walkAgg = function ($items, $depth) use (&$walkAgg, $nameToKategori, $kodeToKategori, &$aggregated) {
                        foreach ($items as $item) {
                            $name = strtolower(trim($item['name'] ?? ''));
                            if ($name === '') continue;
                            $kategori = $nameToKategori[$name] ?? $kodeToKategori[$name] ?? null;
                            if (!$kategori) continue;

                            $children = $item['children'] ?? [];
                            $childHarga = 0;
                            foreach ($children as $c) {
                                $cn = strtolower(trim($c['name'] ?? ''));
                                $ck = $nameToKategori[$cn] ?? $kodeToKategori[$cn] ?? null;
                                if ($ck) $childHarga += (float) ($ck->pivot->harga ?? 0);
                            }

                            if ($depth === 0) {
                                $aggregated[] = [
                                    'id' => $kategori->id,
                                    'kode' => $kategori->kode,
                                    'nama' => $kategori->nama,
                                    'biaya' => (float) ($kategori->pivot->harga ?? 0) + $childHarga,
                                ];
                            }

                            if (!empty($children)) {
                                $walkAgg($children, $depth + 1);
                            }
                        }
                    };
                    $walkAgg($product->kategori_items, 0);
                }

                $detail = [];
                foreach ($aggregated as $item) {
                    $pi = $pembayaranItems->get($item['id']);
                    $dibayar = $pi ? (int) $pi->jumlah : 0;
                    $pembayaran = $pembayaranList->firstWhere('kategori_id', $item['id']);
                    $biaya = $item['biaya'];
                    $kodeUnik = $pi ? ($pi->kode_unik ?? 0) : 0;
                    if ($pi) {
                        $totalTransfer = $pi->total_transfer ?? $biaya;
                    } else {
                        $totalTransfer = $uniqueCodeOperation === 'subtract'
                            ? max(0, $biaya - $kodeUnik)
                            : $biaya + $kodeUnik;
                    }
                    $detail[] = [
                        'kategori_id' => $item['id'],
                        'kode' => $item['kode'],
                        'nama' => $item['nama'],
                        'biaya' => $biaya,
                        'dibayar' => $dibayar,
                        'kode_unik' => $kodeUnik,
                        'total_transfer' => $totalTransfer,
                    ];
                }
                $detail = collect($detail);

                $detail->filter(fn($d) => $d['biaya'] > 0)->each(fn($d) => $batchKategoriUsedIds->push($d['kategori_id']));

                $totalBiaya = $detail->sum('biaya');
                $totalDibayar = $detail->sum('dibayar');

                return [
                    'id' => $p->id,
                    'nama' => $p->nama,
                    'email' => $p->email,
                    'batch' => $p->batch?->nama_batch ?? '-',
                    'product' => $p->product ? [
                        'id' => $p->product->id,
                        'nama' => $p->product->nama,
                        'kategori_items' => $p->product->kategori_items ?? [],
                    ] : null,
                    'total_biaya' => $totalBiaya,
                    'total_dibayar' => $totalDibayar,
                    'total_sisa' => max(0, $totalBiaya - $totalDibayar),
                    'status_pembayaran' => $p->status_pembayaran,
                    'status_pendaftaran' => $p->status_pendaftaran,
                    'detail' => $detail,
                ];
            });

            $usedKats = $allKategoris->filter(fn($k) => $batchKategoriUsedIds->contains($k->id));
            $grandBiaya = $items->sum('total_biaya');
            $grandDibayar = $items->sum('total_dibayar');

            $result[] = [
                'batch_id' => $batch->id,
                'batch' => $batch->nama_batch,
                'warna' => $batch->warna,
                'kuota' => $batch->kuota,
                'siswas_count' => $pendaftar->count(),
                'total_biaya' => $grandBiaya,
                'total_dibayar' => $grandDibayar,
                'total_sisa' => $grandBiaya - $grandDibayar,
                'kategoris' => $usedKats->map(fn($k) => ['id' => $k->id, 'kode' => $k->kode, 'nama' => $k->nama])->values(),
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
        ]);
    }

    public function myBranches()
    {
        $user = Auth::user();
        $branchIds = $user->cabang_ids ?? [];
        $branches = \App\Models\Cabang::whereIn('id', $branchIds)->get();
        return response()->json($branches);
    }

    public function guru()
    {
        $batchIds = $this->getBranchBatchIds();

        $guruUserIds = KelasSensei::whereIn('batch_id', $batchIds)
            ->select('user_id')
            ->distinct()
            ->pluck('user_id');

        $gurus = Guru::with('user')
            ->whereIn('user_id', $guruUserIds)
            ->latest()
            ->get();

        $users = User::where('status', 'AKTIF')
            ->where('role', '!=', 'KANDIDAT')
            ->orderBy('name')
            ->get();

        $guruUserIdsExisting = $gurus->pluck('user_id');

        return response()->json([
            'success' => true,
            'data' => $gurus,
            'available_users' => $users->map(function ($u) use ($guruUserIdsExisting) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'role' => $u->role,
                    'foto_profil' => $u->foto_profil,
                    'already_guru' => $guruUserIdsExisting->contains($u->id),
                ];
            }),
        ]);
    }

    public function kelasSensei(Request $request)
    {
        $batchIds = $this->getBranchBatchIds();

        $query = KelasSensei::with('user', 'batchRelasi.cabang')
            ->whereIn('batch_id', $batchIds);

        if ($request->user_id) $query->where('user_id', $request->user_id);
        if ($request->status) $query->where('status', $request->status);
        if ($request->batch_id && in_array($request->batch_id, $batchIds)) {
            $query->where('batch_id', $request->batch_id);
        }
        if ($request->start_date) $query->whereDate('tanggal_selesai', '>=', $request->start_date);
        if ($request->end_date) $query->whereDate('tanggal_mulai', '<=', $request->end_date);

        $kelas = $query->orderBy('tanggal_mulai', 'desc')->get();

        $kelas = $kelas->map(function ($kelasItem) {
            $tglMulai = \Carbon\Carbon::parse($kelasItem->tanggal_mulai);
            $tglSelesai = \Carbon\Carbon::parse($kelasItem->tanggal_selesai);

            $kelasItem->total_pertemuan = $tglMulai->copy()->diffInDaysFiltered(function ($date) {
                if ($date->dayOfWeek === 0 || $date->dayOfWeek === 6) return false;
                if (\App\Models\HariLibur::apakahLibur($date->toDateString())) return false;
                return true;
            }, $tglSelesai->copy()->addSecond());

            $absenQuery = \App\Models\AbsensiSensei::where('kelas_sensei_id', $kelasItem->id)
                ->whereDate('tanggal', '>=', $tglMulai)
                ->whereDate('tanggal', '<=', $tglSelesai)
                ->whereRaw('DAYOFWEEK(tanggal) NOT IN (1, 7)')
                ->get()
                ->reject(fn($a) => \App\Models\HariLibur::apakahLibur($a->tanggal));

            $kelasItem->jumlah_absen = $absenQuery->count();
            $kelasItem->jumlah_alpa = $absenQuery->where('status', 'ALPA')->count();

            $izinSensei = \App\Models\Izin::where('user_id', $kelasItem->user_id)
                ->where('status', 'DISETUJUI')
                ->whereBetween('tanggal_mulai', [$tglMulai, $tglSelesai])
                ->count();

            $kelasItem->jumlah_izin = $izinSensei;
            $kelasItem->persentase_kehadiran = $kelasItem->total_pertemuan > 0
                ? round((($kelasItem->total_pertemuan - $kelasItem->jumlah_alpa - $izinSensei) / $kelasItem->total_pertemuan) * 100, 1)
                : 0;

            return $kelasItem;
        });

        $batches = Batch::with('cabang')->whereIn('id', $batchIds)->orderBy('nama_batch')->get(['id', 'nama_batch', 'warna']);

        return response()->json([
            'success' => true,
            'data' => $kelas,
            'batches' => $batches,
        ]);
    }

    public function jadwalLevel()
    {
        $branchIds = $this->getBranchIds();
        $batchIds = $this->getBranchBatchIds();

        $batches = Batch::whereIn('id', $batchIds)
            ->aktif()
            ->orderBy('nama_batch')
            ->get();

        $levels = [1, 2, 3, 4];
        $jadwal = JadwalLevel::whereIn('batch_id', $batchIds)
            ->with('batch', 'submittedBy', 'approvedBy')
            ->get()
            ->keyBy(fn($item) => $item->batch_id . '-' . $item->level);

        $jadwalMap = $jadwal->map(function ($item) {
            return [
                'id' => $item->id,
                'batch_id' => $item->batch_id,
                'level' => $item->level,
                'status' => $item->status,
                'tanggal_mulai' => $item->tanggal_mulai->format('Y-m-d'),
                'tanggal_selesai' => $item->tanggal_selesai->format('Y-m-d'),
                'batch_nama' => $item->batch?->nama_batch ?? '-',
                'submitted_by' => $item->submittedBy->name ?? null,
                'approved_by' => $item->approvedBy->name ?? null,
                'approved_at' => $item->approved_at?->format('Y-m-d H:i:s'),
                'rejection_reason' => $item->rejection_reason,
            ];
        });

        $cabangs = \App\Models\Cabang::whereIn('id', $branchIds)
            ->orderBy('nama_cabang')
            ->get(['id', 'nama_cabang']);

        return response()->json([
            'success' => true,
            'batches' => $batches,
            'cabangs' => $cabangs,
            'levels' => $levels,
            'jadwal' => $jadwalMap,
        ]);
    }

    public function rekapSiswa(Request $request)
    {
        $batchIds = $this->getBranchBatchIds();

        $kelasList = KelasSensei::with('user', 'batchRelasi')
            ->whereIn('batch_id', $batchIds)
            ->where('status', 'aktif')
            ->orderBy('nama_kelas')
            ->get(['id', 'nama_kelas', 'batch_id', 'level']);

        $cabangList = \App\Models\Cabang::whereIn('id', $this->getBranchIds())
            ->orderBy('nama_cabang')
            ->get(['id', 'nama_cabang']);

        $batchList = Batch::whereIn('id', $batchIds)
            ->when($request->filled('cabang_id'), fn ($q) => $q->where('cabang_id', $request->cabang_id))
            ->orderBy('nama_batch')
            ->get(['id', 'nama_batch', 'warna']);

        $levels = KelasSensei::whereIn('batch_id', $batchIds)
            ->where('status', 'aktif')
            ->when($request->filled('cabang_id'), fn ($q) => $q->whereHas('batchRelasi', fn ($q2) => $q2->where('cabang_id', $request->cabang_id)))
            ->when($request->filled('batch_id'), fn ($q) => $q->where('batch_id', $request->batch_id))
            ->select('level')
            ->distinct()
            ->orderBy('level')
            ->pluck('level')
            ->map(fn ($l) => (int) $l)
            ->values();

        $selectedKelasSensei = null;
        if ($request->filled('kelas_sensei_id')) {
            $selectedKelasSensei = KelasSensei::with('user', 'batchRelasi')
                ->whereIn('batch_id', $batchIds)
                ->find($request->kelas_sensei_id);
            if ($selectedKelasSensei && !$request->filled('start_date') && !$request->filled('end_date')) {
                $request->merge([
                    'start_date' => $selectedKelasSensei->tanggal_mulai->toDateString(),
                    'end_date' => $selectedKelasSensei->tanggal_selesai->toDateString(),
                ]);
            }
        }

        $start_date = $request->start_date ?? now()->startOfMonth()->toDateString();
        $end_date = $request->end_date ?? now()->endOfMonth()->toDateString();

        $query = Siswa::where('status', 'AKTIF')
            ->whereIn('batch_id', $batchIds);

        if ($request->filled('cabang_id') && in_array($request->cabang_id, $this->getBranchIds())) {
            $query->whereHas('batchRelasi', function ($q) use ($request) {
                $q->where('cabang_id', $request->cabang_id);
            });
        }

        $selectedNamaKelas = null;
        if ($request->filled('kelas_sensei_id')) {
            $ks = KelasSensei::find($request->kelas_sensei_id);
            if ($ks) {
                $query->where('batch_id', $ks->batch_id);
                $selectedNamaKelas = $ks->nama_kelas;
            }
        } else {
            if ($request->filled('batch_id') && in_array($request->batch_id, $batchIds)) {
                $query->where('batch_id', $request->batch_id);
            }
        }

        $kelasByBatchLevel = KelasSensei::orderByDesc('tanggal_mulai')
            ->get()
            ->groupBy(fn ($k) => $k->batch_id.'-'.$k->level);

        $rekap = $query->with(['kelasRelasi', 'absensi.kelasSensei', 'absensi' => function ($q) use ($start_date, $end_date) {
            $q->whereBetween('tanggal', [$start_date, $end_date]);
        }])->get()->map(function ($siswa) use ($selectedNamaKelas, $start_date, $end_date, $kelasByBatchLevel) {
            $hadir = $siswa->absensi->where('status', 'HADIR')->count();
            $terlambat = $siswa->absensi->where('status', 'TERLAMBAT')->count();
            $izin = $siswa->absensi->where('status', 'IZIN')->count();
            $sakit = $siswa->absensi->where('status', 'SAKIT')->count();
            $alpa = $siswa->absensi->where('status', 'ALPA')->count();
            $totalHadir = $hadir + $terlambat;
            $total = $siswa->absensi->count();
            $level = $siswa->levelRekap($start_date, $end_date);
            $kelas = $level !== null ? ($kelasByBatchLevel[$siswa->batch_id.'-'.$level][0] ?? null) : null;

            return [
                'id' => $siswa->id,
                'nama' => $siswa->nama,
                'level' => $level,
                'kelas_tanggal_mulai' => $kelas?->tanggal_mulai?->toDateString(),
                'kelas_tanggal_selesai' => $kelas?->tanggal_selesai?->toDateString(),
                'total_pertemuan' => $kelas ? $kelas->totalPertemuan() : null,
                'kelas' => $selectedNamaKelas ?? $siswa->kelasRelasi->nama_kelas ?? $siswa->kelas,
                'batch' => $siswa->batchRelasi->nama_batch ?? '-',
                'hadir' => $hadir,
                'terlambat' => $terlambat,
                'izin' => $izin,
                'sakit' => $sakit,
                'alpa' => $alpa,
                'total_hadir' => $totalHadir,
                'total' => $total,
                'persentase' => $total > 0 ? round(($totalHadir / $total) * 100, 1) : 0,
            ];
        })->toArray();

        if ($request->filled('level')) {
            $levelFilter = (int) $request->level;
            $rekap = array_values(array_filter($rekap, fn ($r) => isset($r['level']) && (int) $r['level'] === $levelFilter));
        }

        return response()->json([
            'rekap' => $rekap,
            'kelas_list' => $kelasList,
            'batch_list' => $batchList,
            'cabang_list' => $cabangList,
            'levels' => $levels,
            'start_date' => $start_date,
            'end_date' => $end_date,
            'selected_kelas_sensei' => $selectedKelasSensei,
        ]);
    }

    public function penilaian(Request $request)
    {
        $batchIds = $this->getBranchBatchIds();

        $levels = KelasSensei::whereIn('batch_id', $batchIds)
            ->select('level')
            ->distinct()
            ->orderBy('level')
            ->pluck('level');

        $cabangId = $request->cabang_id;
        $guruId = $request->guru_id;
        $batchId = $request->batch_id;
        $level = $request->level;
        $kelasSenseiId = $request->kelas_sensei_id;

        // Basis kelas yang masuk filter (cabang/batch/guru/level)
        $ks = KelasSensei::query()->whereIn('batch_id', $batchIds)->whereNotNull('batch_id');
        if ($batchId) {
            $ks->where('batch_id', $batchId);
        } elseif ($cabangId) {
            $ks->whereHas('batchRelasi', fn ($q) => $q->where('cabang_id', $cabangId));
        }
        if ($guruId) {
            $ks->where('user_id', $guruId);
        }
        if ($level) {
            $ks->where('level', $level);
        }

        $levels = (clone $ks)->select('level')->distinct()->orderBy('level')->pluck('level');

        $guruUserIds = (clone $ks)->select('user_id')->distinct()->pluck('user_id');
        $gurus = User::whereIn('id', $guruUserIds)
            ->orderBy('name')
            ->get(['id', 'name']);

        $batchQuery = Batch::whereIn('id', $batchIds)->orderBy('nama_batch');
        if ($cabangId) {
            $batchQuery->where('cabang_id', $cabangId);
        }
        if ($guruId || $level) {
            $batchKs = KelasSensei::query()->whereIn('batch_id', $batchIds)->whereNotNull('batch_id');
            if ($cabangId) {
                $batchKs->whereHas('batchRelasi', fn ($q) => $q->where('cabang_id', $cabangId));
            }
            if ($guruId) {
                $batchKs->where('user_id', $guruId);
            }
            if ($level) {
                $batchKs->where('level', $level);
            }
            $batchQuery->whereIn('id', $batchKs->pluck('batch_id'));
        }
        $batchList = $batchQuery->get(['id', 'nama_batch']);

        $cabangs = \App\Models\Cabang::whereIn('id', $this->getBranchIds())
            ->orderBy('nama_cabang')
            ->get(['id', 'nama_cabang']);

        $kelas = null;
        if ($kelasSenseiId) {
            $kelas = KelasSensei::with('batchRelasi')
                ->whereIn('batch_id', $batchIds)
                ->find($kelasSenseiId);
            if ($kelas) {
                $batchId = $kelas->batch_id;
                $level = $kelas->level;
                $guruId = $kelas->user_id;
            }
        } elseif ($batchId && $level && $guruId) {
            $kelas = KelasSensei::whereIn('batch_id', $batchIds)
                ->where('batch_id', $batchId)
                ->where('level', $level)
                ->where('user_id', $guruId)
                ->first();
        }

        $students = collect();
        $categories = collect();
        $days = [];
        $assessmentCheck = collect();

        $weekStart = $request->week
            ? Carbon::parse($request->week)->startOfWeek(Carbon::MONDAY)
            : Carbon::now()->startOfWeek(Carbon::MONDAY);

        $prevWeek = $weekStart->copy()->subWeek()->toDateString();
        $nextWeek = $weekStart->copy()->addWeek()->toDateString();

        for ($i = 0; $i < 5; $i++) {
            $days[] = $weekStart->copy()->addDays($i)->toDateString();
        }

        if ($kelas) {
            $students = Siswa::with('kelasRelasi')
                ->where('batch_id', $batchId)
                ->where('status', 'AKTIF')
                ->orderBy('nama')
                ->get(['id', 'nama', 'kelas', 'kelas_id']);

            $categories = AssessmentCategory::with('components')
                ->where('level', $kelas->level)
                ->orderBy('urutan')
                ->get();

            $studentIds = $students->pluck('id');
            $componentIds = $categories->pluck('components')->flatten()->pluck('id');

            $existing = StudentAssessment::whereIn('siswa_id', $studentIds)
                ->whereIn('component_id', $componentIds)
                ->where('batch_id', $batchId)
                ->whereBetween('tanggal', [$days[0], $days[4]])
                ->select('siswa_id', 'tanggal')
                ->distinct()
                ->get();

            foreach ($students as $s) {
                foreach ($days as $d) {
                    $key = $s->id . '_' . $d;
                    $assessmentCheck[$key] = $existing->contains(fn($a) =>
                        $a->siswa_id === $s->id && $a->tanggal === $d
                    );
                }
            }
        }

        return response()->json([
            'success' => true,
            'levels' => $levels,
            'gurus' => $gurus,
            'cabangs' => $cabangs,
            'level' => $level,
            'guru_id' => $guruId,
            'batch_id' => $batchId,
            'cabang_id' => $cabangId,
            'batch_list' => $batchList,
            'kelas' => $kelas,
            'students' => $students,
            'categories' => $categories,
            'days' => $days,
            'assessment_check' => $assessmentCheck,
            'week_start' => $weekStart->toDateString(),
            'prev_week' => $prevWeek,
            'next_week' => $nextWeek,
        ]);
    }

    public function lms(Request $request)
    {
        $batchIds = $this->getBranchBatchIds();

        $batches = Batch::whereIn('id', $batchIds)
            ->orderBy('nama_batch')
            ->get(['id', 'nama_batch', 'warna']);

        $levels = KelasSensei::whereIn('batch_id', $batchIds)
            ->select('level')
            ->distinct()
            ->orderBy('level')
            ->pluck('level');

        $query = Course::withCount(['lessons' => function ($q) {
            $q->where('status', 'aktif');
        }]);

        if ($request->batch_id && in_array($request->batch_id, $batchIds)) {
            $query->where(function ($q) use ($request) {
                $q->where('batch_id', $request->batch_id)
                  ->orWhereNull('batch_id');
            });
        } else {
            $query->where(function ($q) use ($batchIds) {
                $q->whereIn('batch_id', $batchIds)
                  ->orWhereNull('batch_id');
            });
        }

        if ($request->level) {
            $query->where(function ($q) use ($request) {
                $q->where('level', $request->level)
                  ->orWhereNull('level');
            });
        }

        if ($request->search) {
            $query->where('nama', 'like', '%' . $request->search . '%');
        }

        $courses = $query->orderBy('sort')->get();

        return response()->json([
            'success' => true,
            'courses' => $courses,
            'batches' => $batches,
            'levels' => $levels,
        ]);
    }

    public function evaluasiInstruktur(Request $request)
    {
        $user = Auth::user();
        $branchIds = $this->getBranchIds();
        $batchIds = $this->getBranchBatchIds();

        return $this->evaluasiInstrukturData($request, $batchIds);
    }

    public function evaluasiInstrukturAll(Request $request)
    {
        return $this->evaluasiInstrukturData($request, null);
    }

    private function evaluasiInstrukturData(Request $request, ?array $batchIds)
    {
        // Filter options
        $filterBatchId = $request->query('batch_id');
        $filterLevel = $request->query('level');
        $filterGuruId = $request->query('guru_id');

        // Get all kelas sensei for this branch's batches
        $query = KelasSensei::with(['batchRelasi', 'user']);
        if ($batchIds !== null) {
            $query->whereIn('batch_id', $batchIds);
        }

        if ($filterBatchId) {
            $query->where('batch_id', $filterBatchId);
        }
        if ($filterLevel) {
            $query->where('level', $filterLevel);
        }
        if ($filterGuruId) {
            $query->where('user_id', $filterGuruId);
        }

        $kelasSenseiList = $query->get();

        // Build instructor summary
        $instructorMap = [];
        foreach ($kelasSenseiList as $ks) {
            $guruUserId = $ks->user_id;
            $guruName = $ks->user->name ?? '-';
            $batchName = $ks->batchRelasi->nama_batch ?? '-';
            $level = $ks->level;

            if (!isset($instructorMap[$guruUserId])) {
                $instructorMap[$guruUserId] = [
                    'user_id' => $guruUserId,
                    'nama' => $guruName,
                    'total_kelas' => 0,
                    'batches' => [],
                    'evaluations' => [],
                ];
            }

            $instructorMap[$guruUserId]['total_kelas']++;
            $instructorMap[$guruUserId]['batches'][] = [
                'batch_id' => $ks->batch_id,
                'nama_batch' => $batchName,
                'level' => $level,
                'kelas_sensei_id' => $ks->id,
            ];

            // Get evaluations for this kelas sensei's batch and level
            $evals = StudentEvaluation::with(['siswa.user'])
                ->where('batch_id', $ks->batch_id)
                ->where('level', $level)
                ->get();

            foreach ($evals as $eval) {
                $studentName = $eval->siswa->nama ?? '-';
                $instructorMap[$guruUserId]['evaluations'][] = [
                    'id' => $eval->id,
                    'siswa_nama' => $studentName,
                    'batch_nama' => $batchName,
                    'level' => $eval->level,
                    'rating' => $eval->rating,
                    'komentar' => $eval->komentar,
                    'scores' => $eval->scores,
                    'text_responses' => $eval->text_responses,
                    'created_at' => $eval->created_at,
                ];
            }
        }

        // Calculate averages per instructor
        $result = [];
        foreach ($instructorMap as $instruktur) {
            $ratings = array_column($instruktur['evaluations'], 'rating');
            $avgRating = count($ratings) > 0 ? round(array_sum($ratings) / count($ratings), 2) : null;

            // Per-level breakdown
            $levelBreakdown = [];
            foreach ($instruktur['evaluations'] as $eval) {
                $lv = $eval['level'];
                if (!isset($levelBreakdown[$lv])) {
                    $levelBreakdown[$lv] = ['level' => $lv, 'ratings' => [], 'count' => 0];
                }
                $levelBreakdown[$lv]['ratings'][] = $eval['rating'];
                $levelBreakdown[$lv]['count']++;
            }
            foreach ($levelBreakdown as &$lb) {
                $lb['avg_rating'] = count($lb['ratings']) > 0
                    ? round(array_sum($lb['ratings']) / count($lb['ratings']), 2)
                    : null;
                unset($lb['ratings']);
            }

            $result[] = [
                'user_id' => $instruktur['user_id'],
                'nama' => $instruktur['nama'],
                'total_kelas' => $instruktur['total_kelas'],
                'total_evaluasi' => count($instruktur['evaluations']),
                'avg_rating' => $avgRating,
                'batches' => array_values($instruktur['batches']),
                'evaluations' => $instruktur['evaluations'],
                'level_breakdown' => array_values($levelBreakdown),
            ];
        }

        // Sort by avg_rating desc
        usort($result, fn($a, $b) => ($b['avg_rating'] ?? 0) <=> ($a['avg_rating'] ?? 0));

        // Filter options for UI
        $batchQuery = Batch::query();
        if ($batchIds !== null) $batchQuery->whereIn('id', $batchIds);
        $batches = $batchQuery->orderBy('nama_batch')->get(['id', 'nama_batch']);

        $levelQuery = KelasSensei::query();
        if ($batchIds !== null) $levelQuery->whereIn('batch_id', $batchIds);
        $levels = $levelQuery->select('level')->distinct()->orderBy('level')->pluck('level');

        $guruQuery = KelasSensei::query();
        if ($batchIds !== null) $guruQuery->whereIn('batch_id', $batchIds);
        $guruUsers = User::whereIn('id', $guruQuery->select('user_id')->distinct()->pluck('user_id'))
            ->orderBy('name')->get(['id', 'name']);

        return response()->json([
            'data' => $result,
            'filters' => [
                'batches' => $batches,
                'levels' => $levels,
                'gurus' => $guruUsers,
            ],
        ]);
    }
}
