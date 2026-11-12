<?php

namespace App\Http\Controllers;

use App\Models\AbsensiSensei;
use App\Models\AbsensiSiswa;
use App\Models\Batch;
use App\Models\Cabang;
use App\Models\KelasSensei;
use App\Models\PembayaranItem;
use App\Models\Pendaftar;
use App\Models\Pengeluaran;
use App\Models\Siswa;
use App\Models\StudentEvaluation;
use Illuminate\Support\Facades\Auth;

class ManagerCabangController extends Controller
{
    private function branchIds(): array
    {
        return Auth::user()->cabang_ids ?? [];
    }

    private function batchIds(array $branchIds): array
    {
        if (empty($branchIds)) {
            return [];
        }

        return Batch::whereIn('cabang_id', $branchIds)
            ->pluck('id')
            ->toArray();
    }

    private function financeSummary(array $pendaftarIds): array
    {
        $pendaftars = Pendaftar::with(['product.biayaKategoris'])
            ->whereIn('id', $pendaftarIds)
            ->get();

        $totalTagihan = 0;
        foreach ($pendaftars as $pendaftar) {
            $product = $pendaftar->product;
            if ($product && $product->relationLoaded('biayaKategoris')) {
                $totalTagihan += $product->biayaKategoris->sum(fn ($k) => (int) $k->pivot->harga);
            } else {
                $totalTagihan += (float) ($product->harga ?? 0);
            }
        }

        $totalTerkumpul = (float) PembayaranItem::whereIn('pendaftar_id', $pendaftarIds)->sum('jumlah');

        return [
            'total_tagihan' => $totalTagihan,
            'total_terkumpul' => $totalTerkumpul,
            'total_outstanding' => $totalTagihan - $totalTerkumpul,
        ];
    }

    public function dashboard()
    {
        $user = Auth::user();
        $branchIds = $this->branchIds();
        $batchIds = $this->batchIds($branchIds);

        $branches = Cabang::whereIn('id', $branchIds)
            ->orderBy('nama_cabang')
            ->get(['id', 'nama_cabang', 'kode_cabang']);

        $pendaftarQuery = Pendaftar::whereIn('batch_id', $batchIds);
        $totalPendaftar = (clone $pendaftarQuery)->count();
        $pendaftarDisetujui = (clone $pendaftarQuery)->where('status_pendaftaran', 'disetujui')->count();
        $pendaftarPending = (clone $pendaftarQuery)->where('status_pendaftaran', 'pending')->count();
        $pendaftarDitolak = (clone $pendaftarQuery)->where('status_pendaftaran', 'ditolak')->count();

        $pendaftarIds = (clone $pendaftarQuery)
            ->where('status_pendaftaran', '!=', 'ditolak')
            ->pluck('id')
            ->toArray();

        $finance = $this->financeSummary($pendaftarIds);

        $totalSiswaAktif = Siswa::whereIn('batch_id', $batchIds)
            ->where('status', 'AKTIF')
            ->count();

        $kelasQuery = KelasSensei::whereIn('batch_id', $batchIds);
        $totalKelas = (clone $kelasQuery)->count();
        $totalKelasAktif = (clone $kelasQuery)->where('status', 'aktif')->count();
        $totalSensei = (clone $kelasQuery)->distinct()->count('user_id');

        $evaluasiQuery = StudentEvaluation::whereIn('batch_id', $batchIds);
        $totalEvaluasi = (clone $evaluasiQuery)->count();
        $avgRating = (clone $evaluasiQuery)->avg('rating');

        $now = now();
        $kelasIds = KelasSensei::whereIn('batch_id', $batchIds)->pluck('id');

        $absensiSenseiQuery = AbsensiSensei::whereIn('kelas_sensei_id', $kelasIds)
            ->whereMonth('tanggal', $now->month)
            ->whereYear('tanggal', $now->year);
        $totalAbsensiSensei = (clone $absensiSenseiQuery)->count();
        $hadirSensei = (clone $absensiSenseiQuery)->whereIn('status', ['HADIR', 'TERLAMBAT'])->count();

        $absensiKandidatQuery = AbsensiSiswa::whereHas('siswa', function ($q) use ($batchIds) {
            $q->whereIn('batch_id', $batchIds);
        })
            ->whereMonth('tanggal', $now->month)
            ->whereYear('tanggal', $now->year);
        $totalAbsensiKandidat = (clone $absensiKandidatQuery)->count();
        $hadirKandidat = (clone $absensiKandidatQuery)->whereIn('status', ['HADIR', 'TERLAMBAT'])->count();

        $totalPengeluaranBulanIni = (float) Pengeluaran::whereIn('cabang_id', $branchIds)
            ->whereMonth('tanggal', $now->month)
            ->whereYear('tanggal', $now->year)
            ->sum('nominal');

        $totalPendapatanBulanIni = (float) PembayaranItem::whereIn('pendaftar_id', $pendaftarIds)
            ->whereMonth('created_at', $now->month)
            ->whereYear('created_at', $now->year)
            ->sum('jumlah');

        // Rekap 6 bulan terakhir
        $months = collect();
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $months->push([
                'label' => $date->format('M Y'),
                'month' => (int) $date->format('m'),
                'year' => (int) $date->format('Y'),
            ]);
        }

        $rekapPendaftar = $months->map(function ($month) use ($batchIds) {
            return [
                'label' => $month['label'],
                'total' => Pendaftar::whereIn('batch_id', $batchIds)
                    ->whereMonth('created_at', $month['month'])
                    ->whereYear('created_at', $month['year'])
                    ->count(),
            ];
        })->toArray();

        $rekapPembayaran = $months->map(function ($month) use ($pendaftarIds) {
            return [
                'label' => $month['label'],
                'total' => (float) PembayaranItem::whereIn('pendaftar_id', $pendaftarIds)
                    ->whereMonth('created_at', $month['month'])
                    ->whereYear('created_at', $month['year'])
                    ->sum('jumlah'),
            ];
        })->toArray();

        $rekapPengeluaran = $months->map(function ($month) use ($branchIds) {
            return [
                'label' => $month['label'],
                'total' => (float) Pengeluaran::whereIn('cabang_id', $branchIds)
                    ->whereMonth('tanggal', $month['month'])
                    ->whereYear('tanggal', $month['year'])
                    ->sum('nominal'),
            ];
        })->toArray();

        $pengeluaranPerKategori = Pengeluaran::whereIn('cabang_id', $branchIds)
            ->whereMonth('tanggal', $now->month)
            ->whereYear('tanggal', $now->year)
            ->join('kategori_pengeluaran', 'pengeluaran.kategori_id', '=', 'kategori_pengeluaran.id')
            ->selectRaw('kategori_pengeluaran.nama as nama, kategori_pengeluaran.kode as kode, SUM(nominal) as total, COUNT(*) as jumlah')
            ->groupBy('kategori_pengeluaran.nama', 'kategori_pengeluaran.kode')
            ->orderByDesc('total')
            ->get();

        $batches = Batch::whereIn('id', $batchIds)
            ->withCount(['siswas' => fn ($q) => $q->where('status', 'AKTIF')])
            ->orderBy('nama_batch')
            ->get()
            ->map(function ($batch) {
                $batch->kelas_count = KelasSensei::where('batch_id', $batch->id)
                    ->where('status', 'aktif')
                    ->count();

                return $batch;
            });

        $recentPembayaran = PembayaranItem::whereIn('pendaftar_id', $pendaftarIds)
            ->with(['pendaftar.batch'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'jumlah' => (float) $item->jumlah,
                'pendaftar' => $item->pendaftar?->nama_lengkap ?? $item->pendaftar?->nama ?? '-',
                'batch' => $item->pendaftar?->batch?->nama_batch ?? '-',
                'created_at' => $item->created_at,
            ]);

        $recentPengeluaran = Pengeluaran::with('kategori')
            ->whereIn('cabang_id', $branchIds)
            ->latest('tanggal')
            ->latest('id')
            ->limit(5)
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'nominal' => (float) $item->nominal,
                'kategori' => $item->kategori?->nama ?? '-',
                'keterangan' => $item->keterangan,
                'tanggal' => $item->tanggal,
            ]);

        $recentEvaluasi = StudentEvaluation::with('siswa')
            ->whereIn('batch_id', $batchIds)
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'siswa' => $item->siswa?->nama ?? '-',
                'level' => $item->level,
                'rating' => (float) $item->rating,
                'komentar' => $item->komentar,
                'created_at' => $item->created_at,
            ]);

        return response()->json([
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'branches' => $branches,
            'stats' => [
                'total_pendaftar' => $totalPendaftar,
                'pendaftar_disetujui' => $pendaftarDisetujui,
                'pendaftar_pending' => $pendaftarPending,
                'pendaftar_ditolak' => $pendaftarDitolak,
                'total_siswa_aktif' => $totalSiswaAktif,
                'total_tagihan' => $finance['total_tagihan'],
                'total_terkumpul' => $finance['total_terkumpul'],
                'total_outstanding' => $finance['total_outstanding'],
                'total_pengeluaran_bulan_ini' => $totalPengeluaranBulanIni,
                'total_pendapatan_bulan_ini' => $totalPendapatanBulanIni,
                'total_sensei' => $totalSensei,
                'total_kelas' => $totalKelas,
                'total_kelas_aktif' => $totalKelasAktif,
                'total_evaluasi' => $totalEvaluasi,
                'avg_rating' => $avgRating ? round((float) $avgRating, 2) : null,
                'total_absensi_sensei' => $totalAbsensiSensei,
                'hadir_sensei' => $hadirSensei,
                'persentase_kehadiran_sensei' => $totalAbsensiSensei > 0
                    ? round(($hadirSensei / $totalAbsensiSensei) * 100, 1)
                    : 0,
                'total_absensi_kandidat' => $totalAbsensiKandidat,
                'hadir_kandidat' => $hadirKandidat,
                'persentase_kehadiran_kandidat' => $totalAbsensiKandidat > 0
                    ? round(($hadirKandidat / $totalAbsensiKandidat) * 100, 1)
                    : 0,
            ],
            'batches' => $batches,
            'recent_pembayaran' => $recentPembayaran,
            'recent_pengeluaran' => $recentPengeluaran,
            'recent_evaluasi' => $recentEvaluasi,
            'charts' => [
                'rekap_pendaftar' => $rekapPendaftar,
                'rekap_pembayaran' => $rekapPembayaran,
                'rekap_pengeluaran' => $rekapPengeluaran,
                'pengeluaran_per_kategori' => $pengeluaranPerKategori,
            ],
        ]);
    }

    public function keuangan()
    {
        $user = Auth::user();
        $branchIds = $this->branchIds();
        $batchIds = $this->batchIds($branchIds);
        $now = now();

        $branches = Cabang::whereIn('id', $branchIds)
            ->orderBy('nama_cabang')
            ->get(['id', 'nama_cabang', 'kode_cabang']);

        $pendaftarIds = Pendaftar::whereIn('batch_id', $batchIds)
            ->where('status_pendaftaran', '!=', 'ditolak')
            ->pluck('id')
            ->toArray();

        $finance = $this->financeSummary($pendaftarIds);

        $pengeluaranBulanIni = (float) Pengeluaran::whereIn('cabang_id', $branchIds)
            ->whereMonth('tanggal', $now->month)
            ->whereYear('tanggal', $now->year)
            ->sum('nominal');

        $pengeluaranSemua = (float) Pengeluaran::whereIn('cabang_id', $branchIds)->sum('nominal');

        $pendapatanBulanIni = (float) PembayaranItem::whereIn('pendaftar_id', $pendaftarIds)
            ->whereMonth('created_at', $now->month)
            ->whereYear('created_at', $now->year)
            ->sum('jumlah');

        $pendapatanSemua = (float) PembayaranItem::whereIn('pendaftar_id', $pendaftarIds)->sum('jumlah');

        $months = collect();
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $months->push([
                'label' => $date->format('M Y'),
                'month' => (int) $date->format('m'),
                'year' => (int) $date->format('Y'),
            ]);
        }

        $rekapBulanan = $months->map(function ($month) use ($pendaftarIds, $branchIds) {
            $pendapatan = (float) PembayaranItem::whereIn('pendaftar_id', $pendaftarIds)
                ->whereMonth('created_at', $month['month'])
                ->whereYear('created_at', $month['year'])
                ->sum('jumlah');

            $pengeluaran = (float) Pengeluaran::whereIn('cabang_id', $branchIds)
                ->whereMonth('tanggal', $month['month'])
                ->whereYear('tanggal', $month['year'])
                ->sum('nominal');

            return [
                'label' => $month['label'],
                'pendapatan' => $pendapatan,
                'pengeluaran' => $pengeluaran,
                'laba' => $pendapatan - $pengeluaran,
            ];
        })->toArray();

        $perKategori = Pengeluaran::whereIn('cabang_id', $branchIds)
            ->whereMonth('tanggal', $now->month)
            ->whereYear('tanggal', $now->year)
            ->join('kategori_pengeluaran', 'pengeluaran.kategori_id', '=', 'kategori_pengeluaran.id')
            ->selectRaw('kategori_pengeluaran.nama as nama, kategori_pengeluaran.kode as kode, SUM(nominal) as total, COUNT(*) as jumlah')
            ->groupBy('kategori_pengeluaran.nama', 'kategori_pengeluaran.kode')
            ->orderByDesc('total')
            ->get();

        $perBatch = Batch::whereIn('id', $batchIds)
            ->orderBy('nama_batch')
            ->get()
            ->map(function ($batch) {
                $ids = Pendaftar::where('batch_id', $batch->id)
                    ->where('status_pendaftaran', '!=', 'ditolak')
                    ->pluck('id')
                    ->toArray();
                $summary = $this->financeSummary($ids);

                return [
                    'id' => $batch->id,
                    'nama_batch' => $batch->nama_batch,
                    'total_pendaftar' => count($ids),
                    'total_tagihan' => $summary['total_tagihan'],
                    'total_terkumpul' => $summary['total_terkumpul'],
                    'total_outstanding' => $summary['total_outstanding'],
                ];
            });

        $recentPembayaran = PembayaranItem::whereIn('pendaftar_id', $pendaftarIds)
            ->with(['pendaftar.batch'])
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'jumlah' => (float) $item->jumlah,
                'pendaftar' => $item->pendaftar?->nama_lengkap ?? $item->pendaftar?->nama ?? '-',
                'batch' => $item->pendaftar?->batch?->nama_batch ?? '-',
                'created_at' => $item->created_at,
            ]);

        $recentPengeluaran = Pengeluaran::with('kategori')
            ->whereIn('cabang_id', $branchIds)
            ->latest('tanggal')
            ->latest('id')
            ->limit(10)
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'nominal' => (float) $item->nominal,
                'kategori' => $item->kategori?->nama ?? '-',
                'keterangan' => $item->keterangan,
                'tanggal' => $item->tanggal,
            ]);

        return response()->json([
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'branches' => $branches,
            'summary' => [
                'total_tagihan' => $finance['total_tagihan'],
                'total_terkumpul' => $finance['total_terkumpul'],
                'total_outstanding' => $finance['total_outstanding'],
                'pendapatan_bulan_ini' => $pendapatanBulanIni,
                'pendapatan_semua' => $pendapatanSemua,
                'pengeluaran_bulan_ini' => $pengeluaranBulanIni,
                'pengeluaran_semua' => $pengeluaranSemua,
                'laba_bulan_ini' => $pendapatanBulanIni - $pengeluaranBulanIni,
                'laba_semua' => $pendapatanSemua - $pengeluaranSemua,
                'persentase_terkumpul' => $finance['total_tagihan'] > 0
                    ? round(($finance['total_terkumpul'] / $finance['total_tagihan']) * 100, 1)
                    : 0,
            ],
            'rekap_bulanan' => $rekapBulanan,
            'per_kategori' => $perKategori,
            'per_batch' => $perBatch,
            'recent_pembayaran' => $recentPembayaran,
            'recent_pengeluaran' => $recentPengeluaran,
        ]);
    }
}
