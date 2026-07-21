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

        $result = $data->map(function ($p) use ($kategoris, $allPembayaran, $allBayar) {
            $pembayaranItems = $allPembayaran->get($p->id, collect())->keyBy('kategori_id');
            $pembayaranList = $allBayar->get($p->id, collect());
            $product = $p->product;
            $pivotById = collect();
            if ($product && $product->relationLoaded('biayaKategoris')) {
                $pivotById = $product->biayaKategoris->keyBy('id');
            }

            // Build aggregated kategori items from product's kategori_items JSON (same as bayarInfo)
            $aggregated = collect();
            if ($product && is_array($product->kategori_items)) {
                $walkAgg = function ($items, $depth) use (&$walkAgg, $pivotById, &$aggregated) {
                    foreach ($items as $item) {
                        $name = strtolower(trim($item['name'] ?? ''));
                        if ($name === '') continue;
                        $kategori = $pivotById->first(fn($k) => strtolower($k->nama) === $name || strtolower($k->kode) === $name);
                        if (!$kategori) continue;

                        $children = $item['children'] ?? [];
                        $childHarga = 0;
                        foreach ($children as $c) {
                            $cn = strtolower(trim($c['name'] ?? ''));
                            $ck = $pivotById->first(fn($k) => strtolower($k->nama) === $cn || strtolower($k->kode) === $cn);
                            if ($ck) $childHarga += (float) ($ck->pivot->harga ?? 0);
                        }

                        if ($depth === 0) {
                            $aggregated->push([
                                'id' => $kategori->id,
                                'kode' => $kategori->kode,
                                'nama' => $kategori->nama,
                                'biaya' => (float) ($kategori->pivot->harga ?? 0) + $childHarga,
                            ]);
                        }

                        if (!empty($children)) {
                            $walkAgg($children, $depth + 1);
                        }
                    }
                };
                $walkAgg($product->kategori_items, 0);
            }

            // Add remaining kategoris not in JSON hierarchy
            foreach ($kategoris as $k) {
                if (!$aggregated->firstWhere('id', $k->id)) {
                    $aggregated->push([
                        'id' => $k->id,
                        'kode' => $k->kode,
                        'nama' => $k->nama,
                        'biaya' => (float) ($pivotById->get($k->id)?->pivot->harga ?? 0),
                    ]);
                }
            }

            $detail = $aggregated->map(function ($item) use ($pembayaranItems, $pembayaranList) {
                $pi = $pembayaranItems->get($item['id']);
                $dibayar = $pi ? (int) $pi->jumlah : 0;
                $pembayaran = $pembayaranList->firstWhere('kategori_id', $item['id']);
                return [
                    'kategori_id' => $item['id'],
                    'kode' => $item['kode'],
                    'nama' => $item['nama'],
                    'biaya' => $item['biaya'],
                    'dibayar' => $dibayar,
                    'kode_unik' => $pi ? ($pi->kode_unik ?? 0) : 0,
                    'total_transfer' => $pi ? ($pi->total_transfer ?? $item['biaya']) : 0,
                    'tanggal_bayar' => $pembayaran ? $pembayaran->created_at : null,
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

        $allBayar = \App\Models\Pembayaran::whereIn('pendaftar_id', $pendaftarIds)
            ->where('status', 'verified')
            ->get()
            ->groupBy('pendaftar_id');

        $result = $data->map(function ($p) use ($kategoris, $allPembayaran, $allBayar) {
            $pembayaranItems = $allPembayaran->get($p->id, collect())->keyBy('kategori_id');
            $pembayaranList = $allBayar->get($p->id, collect());
            $product = $p->product;

            // Build aggregated kategori items from product's kategori_items JSON (same as bayarInfo)
            $pivotById = collect();
            if ($product && $product->relationLoaded('biayaKategoris')) {
                $pivotById = $product->biayaKategoris->keyBy('id');
            }

            $aggregated = collect();
            if ($product && is_array($product->kategori_items)) {
                $walkAgg = function ($items, $depth) use (&$walkAgg, $pivotById, &$aggregated) {
                    foreach ($items as $item) {
                        $name = strtolower(trim($item['name'] ?? ''));
                        if ($name === '') continue;
                        $kategori = $pivotById->first(fn($k) => strtolower($k->nama) === $name || strtolower($k->kode) === $name);
                        if (!$kategori) continue;

                        $children = $item['children'] ?? [];
                        $childHarga = 0;
                        foreach ($children as $c) {
                            $cn = strtolower(trim($c['name'] ?? ''));
                            $ck = $pivotById->first(fn($k) => strtolower($k->nama) === $cn || strtolower($k->kode) === $cn);
                            if ($ck) $childHarga += (float) ($ck->pivot->harga ?? 0);
                        }

                        if ($depth === 0) {
                            $aggregated->push([
                                'id' => $kategori->id,
                                'kode' => $kategori->kode,
                                'nama' => $kategori->nama,
                                'biaya' => (float) ($kategori->pivot->harga ?? 0) + $childHarga,
                            ]);
                        }

                        if (!empty($children)) {
                            $walkAgg($children, $depth + 1);
                        }
                    }
                };
                $walkAgg($product->kategori_items, 0);
            }

            // Add remaining kategoris not in JSON hierarchy
            foreach ($kategoris as $k) {
                if (!$aggregated->firstWhere('id', $k->id)) {
                    $aggregated->push([
                        'id' => $k->id,
                        'kode' => $k->kode,
                        'nama' => $k->nama,
                        'biaya' => (float) ($pivotById->get($k->id)?->pivot->harga ?? 0),
                    ]);
                }
            }

            $detail = $aggregated->map(function ($item) use ($pembayaranItems, $pembayaranList) {
                $pi = $pembayaranItems->get($item['id']);
                $dibayar = $pi ? (int) $pi->jumlah : 0;
                $pembayaran = $pembayaranList->firstWhere('kategori_id', $item['id']);
                return [
                    'kategori_id' => $item['id'],
                    'kode' => $item['kode'],
                    'nama' => $item['nama'],
                    'biaya' => $item['biaya'],
                    'dibayar' => $dibayar,
                    'kode_unik' => $pi ? ($pi->kode_unik ?? 0) : 0,
                    'total_transfer' => $pi ? ($pi->total_transfer ?? $item['biaya']) : 0,
                    'tanggal_bayar' => $pembayaran ? $pembayaran->created_at : null,
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

    public function siswa(Request $request)
    {
        $batchIds = $this->getBranchBatchIds();

        $query = Siswa::with(['shift', 'kelasRelasi', 'batchRelasi'])
            ->whereIn('batch_id', $batchIds);

        if ($request->filled('batch_id')) $query->where('batch_id', $request->batch_id);
        if ($request->filled('status')) $query->where('status', $request->status);
        if ($request->filled('search')) $query->where('nama', 'like', '%' . $request->search . '%');

        $siswa = $query->latest()->get();

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

            $items = $pendaftar->map(function ($p) use ($allKategoris, $allPembayaran, $allBayar, &$batchKategoriUsedIds) {
                $pembayaranItems = $allPembayaran->get($p->id, collect())->keyBy('kategori_id');
                $pembayaranList = $allBayar->get($p->id, collect());
                $product = $p->product;

                $pivotById = collect();
                if ($product && $product->relationLoaded('biayaKategoris')) {
                    $pivotById = $product->biayaKategoris->keyBy('id');
                }

                $aggregated = collect();
                if ($product && is_array($product->kategori_items)) {
                    $walkAgg = function ($items, $depth) use (&$walkAgg, $pivotById, &$aggregated) {
                        foreach ($items as $item) {
                            $name = strtolower(trim($item['name'] ?? ''));
                            if ($name === '') continue;
                            $kategori = $pivotById->first(fn($k) => strtolower($k->nama) === $name || strtolower($k->kode) === $name);
                            if (!$kategori) continue;

                            $children = $item['children'] ?? [];
                            $childHarga = 0;
                            foreach ($children as $c) {
                                $cn = strtolower(trim($c['name'] ?? ''));
                                $ck = $pivotById->first(fn($k) => strtolower($k->nama) === $cn || strtolower($k->kode) === $cn);
                                if ($ck) $childHarga += (float) ($ck->pivot->harga ?? 0);
                            }

                            if ($depth === 0) {
                                $aggregated->push([
                                    'id' => $kategori->id,
                                    'kode' => $kategori->kode,
                                    'nama' => $kategori->nama,
                                    'biaya' => (float) ($kategori->pivot->harga ?? 0) + $childHarga,
                                ]);
                            }

                            if (!empty($children)) {
                                $walkAgg($children, $depth + 1);
                            }
                        }
                    };
                    $walkAgg($product->kategori_items, 0);
                }

                foreach ($allKategoris as $k) {
                    if (!$aggregated->firstWhere('id', $k->id)) {
                        $aggregated->push([
                            'id' => $k->id,
                            'kode' => $k->kode,
                            'nama' => $k->nama,
                            'biaya' => (float) ($pivotById->get($k->id)?->pivot->harga ?? 0),
                        ]);
                    }
                }

                $detail = $aggregated->map(function ($item) use ($pembayaranItems, $pembayaranList) {
                    $pi = $pembayaranItems->get($item['id']);
                    $dibayar = $pi ? (int) $pi->jumlah : 0;
                    $pembayaran = $pembayaranList->firstWhere('kategori_id', $item['id']);
                    return [
                        'kategori_id' => $item['id'],
                        'kode' => $item['kode'],
                        'nama' => $item['nama'],
                        'biaya' => $item['biaya'],
                        'dibayar' => $dibayar,
                        'kode_unik' => $pi ? ($pi->kode_unik ?? 0) : 0,
                        'total_transfer' => $pi ? ($pi->total_transfer ?? $item['biaya']) : $item['biaya'],
                    ];
                });

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

        $query = KelasSensei::with('user', 'batchRelasi')
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

        $batches = Batch::whereIn('id', $batchIds)->orderBy('nama_batch')->get(['id', 'nama_batch']);

        return response()->json([
            'success' => true,
            'data' => $kelas,
            'batches' => $batches,
        ]);
    }

    public function jadwalLevel()
    {
        $batchIds = $this->getBranchBatchIds();

        $batches = Batch::whereIn('id', $batchIds)
            ->aktif()
            ->orderBy('nama_batch')
            ->get();

        $levels = [1, 2, 3, 4];
        $jadwal = JadwalLevel::whereIn('batch_id', $batchIds)
            ->with('batch')
            ->get()
            ->keyBy(fn($item) => $item->batch_id . '-' . $item->level);

        $jadwalMap = $jadwal->map(function ($item) {
            return [
                'id' => $item->id,
                'batch_id' => $item->batch_id,
                'level' => $item->level,
                'tanggal_mulai' => $item->tanggal_mulai->format('Y-m-d'),
                'tanggal_selesai' => $item->tanggal_selesai->format('Y-m-d'),
                'batch_nama' => $item->batch?->nama_batch ?? '-',
            ];
        });

        return response()->json([
            'success' => true,
            'batches' => $batches,
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

        $batchList = Batch::whereIn('id', $batchIds)
            ->orderBy('nama_batch')
            ->get(['id', 'nama_batch']);

        $levels = [1, 2, 3, 4];

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
            if ($request->filled('level')) {
                $query->where('level', $request->level);
            }
        }

        $rekap = $query->with(['kelasRelasi', 'absensi' => function ($q) use ($start_date, $end_date) {
            $q->whereBetween('tanggal', [$start_date, $end_date]);
        }])->get()->map(function ($siswa) use ($selectedNamaKelas) {
            $hadir = $siswa->absensi->where('status', 'HADIR')->count();
            $terlambat = $siswa->absensi->where('status', 'TERLAMBAT')->count();
            $izin = $siswa->absensi->where('status', 'IZIN')->count();
            $sakit = $siswa->absensi->where('status', 'SAKIT')->count();
            $alpa = $siswa->absensi->where('status', 'ALPA')->count();
            $totalHadir = $hadir + $terlambat;
            $total = $siswa->absensi->count();

            return [
                'id' => $siswa->id,
                'nama' => $siswa->nama,
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

        return response()->json([
            'rekap' => $rekap,
            'kelas_list' => $kelasList,
            'batch_list' => $batchList,
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

        $guruUserIds = KelasSensei::whereIn('batch_id', $batchIds)
            ->select('user_id')
            ->distinct()
            ->pluck('user_id');

        $gurus = User::whereIn('id', $guruUserIds)
            ->orderBy('name')
            ->get(['id', 'name']);

        $level = $request->level;
        $guruId = $request->guru_id;
        $batchId = $request->batch_id;
        $kelasSenseiId = $request->kelas_sensei_id;

        $batchList = collect();
        if ($level && $guruId) {
            $filteredBatchIds = KelasSensei::whereIn('batch_id', $batchIds)
                ->where('level', $level)
                ->where('user_id', $guruId)
                ->whereNotNull('batch_id')
                ->pluck('batch_id');
            $batchList = Batch::whereIn('id', $filteredBatchIds)
                ->orderBy('nama_batch')
                ->get(['id', 'nama_batch']);
        }

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
            'level' => $level,
            'guruId' => $guruId,
            'batchId' => $batchId,
            'batchList' => $batchList,
            'kelas' => $kelas,
            'students' => $students,
            'categories' => $categories,
            'days' => $days,
            'assessmentCheck' => $assessmentCheck,
            'weekStart' => $weekStart->toDateString(),
            'prevWeek' => $prevWeek,
            'nextWeek' => $nextWeek,
        ]);
    }

    public function lms(Request $request)
    {
        $batchIds = $this->getBranchBatchIds();

        $batches = Batch::whereIn('id', $batchIds)
            ->orderBy('nama_batch')
            ->get(['id', 'nama_batch']);

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
}
