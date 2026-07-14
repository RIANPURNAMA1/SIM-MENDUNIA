<?php

namespace App\Http\Controllers;

use App\Models\KategoriPengeluaran;
use App\Models\Pengeluaran;
use App\Models\Pendaftar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PengeluaranController extends Controller
{
    private function isCabangScoped()
    {
        $role = request()->user()->role;
        return $role === 'ADMIN_CABANG';
    }

    private function getCabangIds()
    {
        $user = request()->user();
        return $user->cabang_ids ?? [];
    }

    private function scopeQuery($query)
    {
        if ($this->isCabangScoped()) {
            $cabangIds = $this->getCabangIds();
            if (!empty($cabangIds)) {
                $query->whereIn('pengeluaran.cabang_id', $cabangIds);
            } else {
                $query->whereRaw('1 = 0');
            }
        }
        return $query;
    }

    // ========== Kategori Pengeluaran ==========

    public function kategoriIndex()
    {
        return response()->json(KategoriPengeluaran::orderBy('urutan')->get());
    }

    public function kategoriStore(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:100',
            'kode' => 'required|string|max:50|unique:kategori_pengeluaran,kode',
            'urutan' => 'nullable|integer|min:0',
        ]);

        $kategori = KategoriPengeluaran::create([
            'nama' => $request->nama,
            'kode' => strtoupper($request->kode),
            'urutan' => $request->urutan ?? 0,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Kategori pengeluaran berhasil ditambahkan',
            'data' => $kategori,
        ], 201);
    }

    public function kategoriUpdate(Request $request, $id)
    {
        $kategori = KategoriPengeluaran::findOrFail($id);

        $request->validate([
            'nama' => 'required|string|max:100',
            'kode' => 'required|string|max:50|unique:kategori_pengeluaran,kode,' . $id,
            'urutan' => 'nullable|integer|min:0',
        ]);

        $kategori->update([
            'nama' => $request->nama,
            'kode' => strtoupper($request->kode),
            'urutan' => $request->urutan ?? $kategori->urutan,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Kategori pengeluaran berhasil diupdate',
            'data' => $kategori,
        ]);
    }

    public function kategoriDestroy($id)
    {
        $kategori = KategoriPengeluaran::findOrFail($id);

        if ($kategori->pengeluarans()->exists()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Kategori tidak bisa dihapus karena masih digunakan oleh data pengeluaran',
            ], 422);
        }

        $kategori->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Kategori pengeluaran berhasil dihapus',
        ]);
    }

    // ========== Pengeluaran ==========

    public function index(Request $request)
    {
        $query = Pengeluaran::with(['kategori', 'user', 'cabang'])
            ->orderBy('tanggal', 'desc')
            ->orderBy('id', 'desc');

        $this->scopeQuery($query);

        if ($request->filled('kategori_id')) {
            $query->where('kategori_id', $request->kategori_id);
        }

        if ($request->filled('cabang_id') && !$this->isCabangScoped()) {
            $query->where('pengeluaran.cabang_id', $request->cabang_id);
        }

        if ($request->filled('tanggal_mulai')) {
            $query->where('tanggal', '>=', $request->tanggal_mulai);
        }

        if ($request->filled('tanggal_sampai')) {
            $query->where('tanggal', '<=', $request->tanggal_sampai);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('keterangan', 'like', "%{$search}%")
                  ->orWhereHas('kategori', function ($q2) use ($search) {
                      $q2->where('nama', 'like', "%{$search}%")
                         ->orWhere('kode', 'like', "%{$search}%");
                  });
            });
        }

        $data = $query->paginate($request->get('per_page', 15));

        return response()->json($data);
    }

    public function store(Request $request)
    {
        $rules = [
            'kategori_id' => 'required|exists:kategori_pengeluaran,id',
            'tanggal' => 'required|date',
            'nominal' => 'required|numeric|min:1',
            'keterangan' => 'nullable|string|max:500',
            'bukti' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ];

        if ($this->isCabangScoped()) {
            $cabangIds = $this->getCabangIds();
            $rules['cabang_id'] = 'required|exists:cabangs,id';
        } else {
            $rules['cabang_id'] = 'nullable|exists:cabangs,id';
        }

        $request->validate($rules);

        $buktiPath = null;
        if ($request->hasFile('bukti')) {
            $buktiPath = $request->file('bukti')->store('bukti_pengeluaran', 'public');
        }

        $pengeluaran = Pengeluaran::create([
            'kategori_id' => $request->kategori_id,
            'tanggal' => $request->tanggal,
            'nominal' => $request->nominal,
            'keterangan' => $request->keterangan,
            'bukti' => $buktiPath,
            'user_id' => $request->user()->id,
            'cabang_id' => $request->cabang_id,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Pengeluaran berhasil dicatat',
            'data' => $pengeluaran->load(['kategori', 'user', 'cabang']),
        ], 201);
    }

    public function show($id)
    {
        $pengeluaran = Pengeluaran::with(['kategori', 'user', 'cabang'])->findOrFail($id);

        if ($this->isCabangScoped()) {
            $cabangIds = $this->getCabangIds();
            if (!in_array($pengeluaran->cabang_id, $cabangIds)) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        return response()->json($pengeluaran);
    }

    public function update(Request $request, $id)
    {
        $pengeluaran = Pengeluaran::findOrFail($id);

        if ($this->isCabangScoped()) {
            $cabangIds = $this->getCabangIds();
            if (!in_array($pengeluaran->cabang_id, $cabangIds)) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $request->validate([
            'kategori_id' => 'required|exists:kategori_pengeluaran,id',
            'tanggal' => 'required|date',
            'nominal' => 'required|numeric|min:1',
            'keterangan' => 'nullable|string|max:500',
            'bukti' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        if ($request->hasFile('bukti')) {
            if ($pengeluaran->bukti) {
                $oldPath = storage_path('app/public/' . $pengeluaran->bukti);
                if (file_exists($oldPath)) {
                    unlink($oldPath);
                }
            }
            $pengeluaran->bukti = $request->file('bukti')->store('bukti_pengeluaran', 'public');
        }

        $pengeluaran->update([
            'kategori_id' => $request->kategori_id,
            'tanggal' => $request->tanggal,
            'nominal' => $request->nominal,
            'keterangan' => $request->keterangan,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Pengeluaran berhasil diupdate',
            'data' => $pengeluaran->load(['kategori', 'user', 'cabang']),
        ]);
    }

    public function destroy($id)
    {
        $pengeluaran = Pengeluaran::findOrFail($id);

        if ($this->isCabangScoped()) {
            $cabangIds = $this->getCabangIds();
            if (!in_array($pengeluaran->cabang_id, $cabangIds)) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        if ($pengeluaran->bukti) {
            $path = storage_path('app/public/' . $pengeluaran->bukti);
            if (file_exists($path)) {
                unlink($path);
            }
        }

        $pengeluaran->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Pengeluaran berhasil dihapus',
        ]);
    }

    public function rekap(Request $request)
    {
        $tahun = $request->get('tahun', date('Y'));

        $query = Pengeluaran::select(
            'pengeluaran.cabang_id',
            DB::raw('MONTH(tanggal) as bulan'),
            DB::raw('SUM(nominal) as total'),
            DB::raw('COUNT(*) as jumlah')
        )
        ->whereYear('tanggal', $tahun);

        $this->scopeQuery($query);

        $rekap = $query->groupBy('pengeluaran.cabang_id', DB::raw('MONTH(tanggal)'))
        ->orderBy('bulan')
        ->get()
        ->map(function ($item) use ($tahun) {
            $namaBulan = [
                1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
                5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
                9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
            ];
            return [
                'cabang_id' => $item->cabang_id,
                'bulan' => $item->bulan,
                'nama_bulan' => $namaBulan[$item->bulan],
                'total' => (float) $item->total,
                'jumlah' => (int) $item->jumlah,
            ];
        });

        $totalQuery = Pengeluaran::whereYear('tanggal', $tahun);
        $this->scopeQuery($totalQuery);
        $totalTahun = (float) $totalQuery->sum('nominal');

        $totalAllQuery = Pengeluaran::query();
        $this->scopeQuery($totalAllQuery);
        $totalAll = (float) $totalAllQuery->sum('nominal');

        return response()->json([
            'tahun' => (int) $tahun,
            'total_tahun' => $totalTahun,
            'total_semua' => $totalAll,
            'rekap' => $rekap,
        ]);
    }

    public function dashboard()
    {
        $now = now();
        $bulanIni = $now->copy()->startOfMonth();
        $bulanLalu = $now->copy()->subMonth()->startOfMonth();

        $baseQuery = function ($q) {
            $this->scopeQuery($q);
        };

        $totalBulanIni = (float) Pengeluaran::whereBetween('tanggal', [$bulanIni, $now])->when(true, $baseQuery)->sum('nominal');
        $totalBulanLalu = (float) Pengeluaran::whereBetween('tanggal', [$bulanLalu, $bulanIni->copy()->subDay()])->when(true, $baseQuery)->sum('nominal');
        $totalSemua = (float) Pengeluaran::query()->when(true, $baseQuery)->sum('nominal');
        $jumlahTransaksi = (int) Pengeluaran::whereBetween('tanggal', [$bulanIni, $now])->when(true, $baseQuery)->count();

        $persentase = $totalBulanLalu > 0
            ? round(($totalBulanIni - $totalBulanLalu) / $totalBulanLalu * 100, 1)
            : 0;

        $rekapBulanan = Pengeluaran::select(
            DB::raw('MONTH(tanggal) as bulan'),
            DB::raw('SUM(nominal) as total'),
            DB::raw('COUNT(*) as jumlah')
        )
        ->whereYear('tanggal', $now->year)
        ->when(true, $baseQuery)
        ->groupBy(DB::raw('MONTH(tanggal)'))
        ->orderBy('bulan')
        ->get()
        ->map(function ($item) {
            $namaBulan = [
                1 => 'Jan', 2 => 'Feb', 3 => 'Mar', 4 => 'Apr',
                5 => 'Mei', 6 => 'Jun', 7 => 'Jul', 8 => 'Agu',
                9 => 'Sep', 10 => 'Okt', 11 => 'Nov', 12 => 'Des',
            ];
            return [
                'bulan' => (int) $item->bulan,
                'label' => $namaBulan[$item->bulan],
                'total' => (float) $item->total,
                'jumlah' => (int) $item->jumlah,
            ];
        });

        $perKategori = Pengeluaran::select(
            'kategori_pengeluaran.nama',
            'kategori_pengeluaran.kode',
            DB::raw('SUM(pengeluaran.nominal) as total'),
            DB::raw('COUNT(*) as jumlah')
        )
        ->join('kategori_pengeluaran', 'pengeluaran.kategori_id', '=', 'kategori_pengeluaran.id')
        ->whereBetween('pengeluaran.tanggal', [$bulanIni, $now])
        ->when(true, $baseQuery)
        ->groupBy('kategori_pengeluaran.id', 'kategori_pengeluaran.nama', 'kategori_pengeluaran.kode')
        ->orderByDesc('total')
        ->get();

        $recentQuery = Pengeluaran::with(['kategori', 'user', 'cabang'])
            ->latest('tanggal')
            ->latest('id')
            ->limit(5);
        $this->scopeQuery($recentQuery);
        $recentPengeluaran = $recentQuery->get();

        $pendapatanQuery = Pendaftar::where('status_pembayaran', 'verified')
            ->whereMonth('created_at', $now->month)
            ->whereYear('created_at', $now->year);

        if ($this->isCabangScoped()) {
            $cabangIds = $this->getCabangIds();
            $batchIds = \App\Models\Batch::whereIn('cabang_id', $cabangIds)->pluck('id');
            $pendapatanQuery->whereIn('batch_id', $batchIds);
        }

        $pendapatanBulanIni = (float) $pendapatanQuery->sum('nominal');

        return response()->json([
            'total_bulan_ini' => $totalBulanIni,
            'total_bulan_lalu' => $totalBulanLalu,
            'total_semua' => $totalSemua,
            'jumlah_transaksi_bulan_ini' => $jumlahTransaksi,
            'persentase_bulan_lalu' => $persentase,
            'pendapatan_bulan_ini' => $pendapatanBulanIni,
            'laba_bulan_ini' => $pendapatanBulanIni - $totalBulanIni,
            'rekap_bulanan' => $rekapBulanan,
            'per_kategori' => $perKategori,
            'recent' => $recentPengeluaran,
        ]);
    }
}
