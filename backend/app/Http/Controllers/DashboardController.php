<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Shift; // <--- TAMBAHKAN BARIS INI
use App\Models\Absensi;
use App\Models\Cabang;
use App\Models\Divisi;
use App\Models\Izin;
use App\Models\AbsensiSensei;
use App\Models\KelasSensei;
use Carbon\Carbon;

class DashboardController extends Controller
{


public function index(Request $request)
{
    $bulanIni = Carbon::now()->month;
    $tahunIni = Carbon::now()->year;

    // Filter date range
    $startDate = $request->input('start_date');
    $endDate   = $request->input('end_date');

    $dateFilter = function ($query, $column = 'tanggal') use ($startDate, $endDate) {
        if ($startDate && $endDate) {
            $query->whereBetween($column, [$startDate, $endDate]);
        }
    };

    // Filter cabang & divisi
    $cabangId = $request->input('cabang_id');
    $divisiId = $request->input('divisi_id');

    $cabangFilter = function ($query) use ($cabangId) {
        if ($cabangId) {
            $query->where('cabang_id', $cabangId);
        }
    };

    $divisiFilter = function ($query) use ($divisiId) {
        if ($divisiId) {
            $query->whereHas('user', fn($q) => $q->where('divisi_id', $divisiId));
        }
    };

    $senseiCabangFilter = function ($query) use ($cabangId) {
        if ($cabangId) {
            $query->whereHas('user', fn($q) => $q->whereJsonContains('cabang_ids', $cabangId));
        }
    };

    $senseiDivisiFilter = function ($query) use ($divisiId) {
        if ($divisiId) {
            $query->whereHas('user', fn($q) => $q->where('divisi_id', $divisiId));
        }
    };

    // Dropdown data
    $cabangs = Cabang::orderBy('nama_cabang')->get();
    $divisis = Divisi::orderBy('nama_divisi')->get();

    // -------------------------------------------------------
    // 1. RINGKASAN CARD ATAS
    // -------------------------------------------------------
    $userFilter = function ($query) use ($cabangId, $divisiId) {
        if ($cabangId) {
            $query->whereJsonContains('cabang_ids', $cabangId);
        }
        if ($divisiId) {
            $query->where('divisi_id', $divisiId);
        }
    };
    $totalKaryawanQ = User::where('role', 'KARYAWAN')->where('status', 'AKTIF');
    $userFilter($totalKaryawanQ);
    $totalKaryawan = $totalKaryawanQ->count();

    $karyawanAktifQ = User::where('role', 'KARYAWAN')->where('status', 'AKTIF');
    $userFilter($karyawanAktifQ);
    $karyawanAktif = $karyawanAktifQ->count();
    $izinPendingQ = Izin::where('status', 'PENDING')->whereHas('user', fn($q) => $q->where('status', 'AKTIF'));
    if ($cabangId) {
        $izinPendingQ->whereHas('user', fn($q) => $q->whereJsonContains('cabang_ids', $cabangId));
    }
    if ($divisiId) {
        $izinPendingQ->whereHas('user', fn($q) => $q->where('divisi_id', $divisiId));
    }
    $izinPendingCount = $izinPendingQ->count();

    // Statistik absensi (filtered)
    $statsQ = Absensi::selectRaw("
        COUNT(CASE WHEN status = 'HADIR'     THEN 1 END) AS tepatWaktu,
        COUNT(CASE WHEN status = 'TERLAMBAT' THEN 1 END) AS terlambat,
        COUNT(CASE WHEN status = 'ALPA'      THEN 1 END) AS alpa,
        COUNT(CASE WHEN status = 'IZIN'      THEN 1 END) AS izinCuti,
        COUNT(CASE WHEN status = 'SAKIT'     THEN 1 END) AS sakit
    ");
    $dateFilter($statsQ);
    $cabangFilter($statsQ);
    $divisiFilter($statsQ);
    $statsQ->whereHas('user', fn($q) => $q->where('status', 'AKTIF'));
    $stats = $statsQ->first();

    $tepatWaktu   = (int) ($stats->tepatWaktu ?? 0);
    $terlambat    = (int) ($stats->terlambat  ?? 0);
    $alpa         = (int) ($stats->alpa       ?? 0);
    $izinCuti     = (int) ($stats->izinCuti   ?? 0) + (int) ($stats->sakit ?? 0);
    $totalHadirSemua = $tepatWaktu + $terlambat;
    $tidakHadir   = $alpa;
    $belumAbsen   = $alpa;

    // Statistik kehadiran untuk card "Hadir" (hari ini or date range)
    $hadirQ = Absensi::whereIn('status', ['HADIR', 'TERLAMBAT']);
    $cabangFilter($hadirQ);
    $divisiFilter($hadirQ);
    $hadirQ->whereHas('user', fn($q) => $q->where('status', 'AKTIF'));
    if ($startDate && $endDate) {
        $dateFilter($hadirQ);
        $hadirHariIni = $hadirQ->count();
    } else {
        $hadirHariIni = $hadirQ->whereDate('tanggal', Carbon::today())->count();
    }

    // Persentase terlambat (dari total kehadiran)
    $persenTerlambatGlobal = $totalHadirSemua > 0
        ? round(($terlambat / $totalHadirSemua) * 100, 1)
        : 0;

    // Project (opsional)
    $projectAktif   = 0;
    $projectSelesai = 0;

    // -------------------------------------------------------
    // 2. DONUT CHART — Komposisi (hari ini or date range)
    // -------------------------------------------------------
   $donutQ = Absensi::selectRaw("
    COUNT(CASE WHEN status = 'HADIR'     THEN 1 END) AS hadir,
    COUNT(CASE WHEN status = 'TERLAMBAT' THEN 1 END) AS terlambat,
    COUNT(CASE WHEN status = 'IZIN'      THEN 1 END) AS izin,
    COUNT(CASE WHEN status = 'ALPA'      THEN 1 END) AS alpa,
    COUNT(CASE WHEN status = 'LIBUR'     THEN 1 END) AS libur
");
   $cabangFilter($donutQ);
   $divisiFilter($donutQ);
   $donutQ->whereHas('user', fn($q) => $q->where('status', 'AKTIF'));
   if ($startDate && $endDate) {
       $dateFilter($donutQ);
   } else {
       $donutQ->whereDate('tanggal', Carbon::today());
   }
   $donutToday = $donutQ->first();

$donutData = [
    'hadir'     => (int) ($donutToday->hadir     ?? 0),
    'terlambat' => (int) ($donutToday->terlambat ?? 0),
    'izin'      => (int) ($donutToday->izin      ?? 0),
    'alpa'      => (int) ($donutToday->alpa      ?? 0),
    'libur'     => (int) ($donutToday->libur     ?? 0),
];

    // -------------------------------------------------------
    // 3. DATA IZIN/SAKIT TERBARU
    // -------------------------------------------------------
    $dataIzinSakitQ = \App\Models\Izin::with(['user']);
    if ($startDate && $endDate) {
        $dataIzinSakitQ->where(function ($q) use ($startDate, $endDate) {
            $q->whereBetween('tgl_mulai', [$startDate, $endDate])
              ->orWhereBetween('tgl_selesai', [$startDate, $endDate]);
        });
    }
    if ($cabangId) {
        $dataIzinSakitQ->whereHas('user', fn($q) => $q->whereJsonContains('cabang_ids', $cabangId));
    }
    if ($divisiId) {
        $dataIzinSakitQ->whereHas('user', fn($q) => $q->where('divisi_id', $divisiId));
    }
    $dataIzinSakitQ->whereHas('user', fn($q) => $q->where('status', 'AKTIF'));
    $dataIzinSakit = $dataIzinSakitQ->orderBy('created_at', 'desc')
        ->take(10)
        ->get();

    // -------------------------------------------------------
    // 4. DATA ABSENSI TERBARU (log)
    // -------------------------------------------------------
    $absensisQ = Absensi::with(['user', 'cabang', 'shift']);
    $dateFilter($absensisQ);
    $cabangFilter($absensisQ);
    $divisiFilter($absensisQ);
    $absensisQ->whereHas('user', fn($q) => $q->where('status', 'AKTIF'));
    $absensis = $absensisQ->orderBy('tanggal', 'desc')
        ->orderBy('created_at', 'desc')
        ->take(100)
        ->get();

    // -------------------------------------------------------
    // 5. RASIO KETERLAMBATAN PER DIVISI
    // -------------------------------------------------------
    $statistikDivisi = Divisi::with(['users' => fn($q) => $q->where('status', 'AKTIF')])->get()->map(function ($divisi) use ($startDate, $endDate, $cabangId) {
        $userIds = $divisi->users->pluck('id');
        $hadirQ  = Absensi::whereIn('user_id', $userIds)->where('status', 'HADIR');
        $terlambatQ = Absensi::whereIn('user_id', $userIds)->where('status', 'TERLAMBAT');
        if ($startDate && $endDate) {
            $hadirQ->whereBetween('tanggal', [$startDate, $endDate]);
            $terlambatQ->whereBetween('tanggal', [$startDate, $endDate]);
        }
        if ($cabangId) {
            $hadirQ->where('cabang_id', $cabangId);
            $terlambatQ->where('cabang_id', $cabangId);
        }
        $hadir     = $hadirQ->count();
        $terlambat = $terlambatQ->count();
        $total     = $hadir + $terlambat;

        return [
            'nama'             => $divisi->nama_divisi,
            'hadir'            => $hadir,
            'terlambat'        => $terlambat,
            'total'            => $total,
            'persen_hadir'     => $total > 0 ? round(($hadir     / $total) * 100, 1) : 0,
            'persen_terlambat' => $total > 0 ? round(($terlambat / $total) * 100, 1) : 0,
        ];
    })->filter(fn($d) => $d['total'] > 0)->values();

    $labelsRasio             = $statistikDivisi->pluck('nama')->toArray();
    $dataTotalKehadiran      = $statistikDivisi->pluck('total')->toArray();
    $dataHadir               = $statistikDivisi->pluck('hadir')->toArray();
    $dataTerlambat           = $statistikDivisi->pluck('terlambat')->toArray();
    $dataPersenHadir         = $statistikDivisi->pluck('persen_hadir')->toArray();
    $dataPersentaseTerlambat = $statistikDivisi->pluck('persen_terlambat')->toArray();

    // -------------------------------------------------------
    // 6. LEMBUR PENDING
    // -------------------------------------------------------
    $notifLembur = \App\Models\Lembur::with('user')
        ->where('status', 'PENDING')
        ->orderBy('created_at', 'desc')
        ->get();

    // -------------------------------------------------------
    // 7. TREN KEHADIRAN 6 BULAN
    // -------------------------------------------------------
    $labelsBar        = [];
    $dataHadirBar     = [];
    $dataTerlambatBar = [];
    $dataAlpaBar      = [];
    $dataLiburBar     = [];

    for ($m = 5; $m >= 0; $m--) {
        $date        = Carbon::now()->subMonths($m);
        $labelsBar[] = $date->translatedFormat('F Y');

        $hQ = Absensi::whereMonth('tanggal', $date->month)->whereYear('tanggal', $date->year)->where('status', 'HADIR');
        $tQ = Absensi::whereMonth('tanggal', $date->month)->whereYear('tanggal', $date->year)->where('status', 'TERLAMBAT');
        $aQ = Absensi::whereMonth('tanggal', $date->month)->whereYear('tanggal', $date->year)->where('status', 'ALPA');
        $lQ = Absensi::whereMonth('tanggal', $date->month)->whereYear('tanggal', $date->year)->where('status', 'LIBUR');
        $dateFilter($hQ); $dateFilter($tQ); $dateFilter($aQ); $dateFilter($lQ);
        $cabangFilter($hQ); $cabangFilter($tQ); $cabangFilter($aQ); $cabangFilter($lQ);
        $divisiFilter($hQ); $divisiFilter($tQ); $divisiFilter($aQ); $divisiFilter($lQ);
        $hQ->whereHas('user', fn($q) => $q->where('status', 'AKTIF'));
        $tQ->whereHas('user', fn($q) => $q->where('status', 'AKTIF'));
        $aQ->whereHas('user', fn($q) => $q->where('status', 'AKTIF'));
        $lQ->whereHas('user', fn($q) => $q->where('status', 'AKTIF'));
        $dataHadirBar[]     = $hQ->count();
        $dataTerlambatBar[] = $tQ->count();
        $dataAlpaBar[]      = $aQ->count();
        $dataLiburBar[]     = $lQ->count();
    }

    // -------------------------------------------------------
    // 8. SENSEI — Statistik Hari Ini (Donut)
    // -------------------------------------------------------
    $senseiDonutQ = AbsensiSensei::selectRaw("
        COUNT(CASE WHEN status = 'HADIR'              THEN 1 END) AS hadir,
        COUNT(CASE WHEN status = 'TERLAMBAT'          THEN 1 END) AS terlambat,
        COUNT(CASE WHEN status = 'ALPA'               THEN 1 END) AS alpa,
        COUNT(CASE WHEN status = 'IZIN'               THEN 1 END) AS izin
    ");
    $senseiCabangFilter($senseiDonutQ);
    $senseiDivisiFilter($senseiDonutQ);
    $senseiDonutQ->whereHas('user', fn($q) => $q->where('status', 'AKTIF'));
    if ($startDate && $endDate) {
        $senseiDonutQ->whereBetween('tanggal', [$startDate, $endDate]);
    } else {
        $senseiDonutQ->whereDate('tanggal', Carbon::today());
    }
    $senseiDonutToday = $senseiDonutQ->first();

    $senseiDonut = [
        'hadir'     => (int) ($senseiDonutToday->hadir     ?? 0),
        'terlambat' => (int) ($senseiDonutToday->terlambat ?? 0),
        'alpa'      => (int) ($senseiDonutToday->alpa      ?? 0),
        'izin'      => (int) ($senseiDonutToday->izin      ?? 0),
    ];

    // -------------------------------------------------------
    // 9. SENSEI — Tren 6 Bulan
    // -------------------------------------------------------
    $senseiLabelsBar    = [];
    $senseiHadirBar     = [];
    $senseiTerlambatBar = [];
    $senseiAlpaBar      = [];

    for ($m = 5; $m >= 0; $m--) {
        $date = Carbon::now()->subMonths($m);
        $senseiLabelsBar[] = $date->translatedFormat('F Y');

        $shQ = AbsensiSensei::whereMonth('tanggal', $date->month)->whereYear('tanggal', $date->year)->where('status', 'HADIR');
        $stQ = AbsensiSensei::whereMonth('tanggal', $date->month)->whereYear('tanggal', $date->year)->where('status', 'TERLAMBAT');
        $saQ = AbsensiSensei::whereMonth('tanggal', $date->month)->whereYear('tanggal', $date->year)->whereIn('status', ['ALPA', 'TIDAK ABSEN PULANG']);
        $dateFilter($shQ); $dateFilter($stQ); $dateFilter($saQ);
        $senseiCabangFilter($shQ); $senseiCabangFilter($stQ); $senseiCabangFilter($saQ);
        $senseiDivisiFilter($shQ); $senseiDivisiFilter($stQ); $senseiDivisiFilter($saQ);
        $shQ->whereHas('user', fn($q) => $q->where('status', 'AKTIF'));
        $stQ->whereHas('user', fn($q) => $q->where('status', 'AKTIF'));
        $saQ->whereHas('user', fn($q) => $q->where('status', 'AKTIF'));
        $senseiHadirBar[]     = $shQ->count();
        $senseiTerlambatBar[] = $stQ->count();
        $senseiAlpaBar[]      = $saQ->count();
    }

    // -------------------------------------------------------
    // 10. SENSEI — Ringkasan Card
    // -------------------------------------------------------
    $senseiKelasQ = KelasSensei::where('status', 'aktif')
        ->whereHas('user', fn($q) => $q->where('status', 'AKTIF'));
    if ($cabangId) {
        $senseiKelasQ->whereHas('user', fn($q) => $q->whereJsonContains('cabang_ids', $cabangId));
    }
    if ($divisiId) {
        $senseiKelasQ->whereHas('user', fn($q) => $q->where('divisi_id', $divisiId));
    }
    $totalSenseiAktif = (clone $senseiKelasQ)->distinct('user_id')->count('user_id');
    $kelasAktifCount  = $senseiKelasQ->count();

    // -------------------------------------------------------
    // 11. LOKASI MARKERS MAP
    // -------------------------------------------------------
    $lokasiMarkers = $absensis->filter(fn($a) => $a->user && $a->user->status === 'AKTIF' && $a->lat_masuk && $a->long_masuk)
        ->map(fn($a) => [
            'lat'     => $a->lat_masuk,
            'lng'     => $a->long_masuk,
            'nama'    => $a->user->name,
            'jam'     => $a->jam_masuk,
            'tanggal' => $a->tanggal,
            'tipe'    => 'Masuk',
        ])->values();

    // -------------------------------------------------------
    // COMPACT — semua variabel ke view
    // -------------------------------------------------------
    return view('admin.dashboard', compact(
        'startDate',
        'endDate',
        'cabangId',
        'divisiId',
        'cabangs',
        'divisis',
        // Card stats
        'totalKaryawan',
        'karyawanAktif',
        'hadirHariIni',
        'totalHadirSemua',
        'tepatWaktu',
        'terlambat',
        'tidakHadir',
        'alpa',
        'izinCuti',
        'izinPendingCount',
        'belumAbsen',
        'persenTerlambatGlobal',
        'projectAktif',
        'projectSelesai',
        // Charts
        'donutData',
        'labelsRasio',
        'dataTotalKehadiran',
        'dataHadir',
        'dataTerlambat',
        'dataPersenHadir',
        'dataPersentaseTerlambat',
        'labelsBar',
        'dataHadirBar',
        'dataTerlambatBar',
        'dataAlpaBar',
        'dataLiburBar',
        // Sensei
        'senseiDonut',
        'senseiLabelsBar',
        'senseiHadirBar',
        'senseiTerlambatBar',
        'senseiAlpaBar',
        'totalSenseiAktif',
        'kelasAktifCount',
        // Lists
        'absensis',
        'dataIzinSakit',
        'notifLembur',
        'lokasiMarkers',
    ));
}
    /**
     * Get filtered attendance data via AJAX
     */
    public function getFilteredData(Request $request)
    {
        $cabang = $request->input('cabang');
        $jamKerja = $request->input('jam_kerja');
        $tanggal = $request->input('tanggal', Carbon::today()->toDateString());

        $query = Absensi::with(['user', 'cabang', 'shift'])
            ->whereDate('tanggal', $tanggal);

        if ($cabang && $cabang !== 'all') {
            $query->where('cabang_id', $cabang);
        }

        if ($jamKerja && $jamKerja !== 'all') {
            $query->where('shift_id', $jamKerja);
        }

        $data = $query->get();

        $tepatWaktu = $data->where('status', 'HADIR')->count();
        $terlambat = $data->where('status', 'TERLAMBAT')->count();
        $alpa = $data->where('status', 'ALPA')->count();
        $izinCuti = $data->where('status', 'IZIN')->count();

        return response()->json([
            'tepatWaktu' => $tepatWaktu,
            'terlambat' => $terlambat,
            'alpa' => $alpa,
            'izinCuti' => $izinCuti,
            'belumAbsen' => User::where('role', 'KARYAWAN')->where('status', 'AKTIF')->count() - ($tepatWaktu + $terlambat + $izinCuti + $alpa)
        ]);
    }


    public function filter(Request $request)
    {
        $hariIni = Carbon::today()->toDateString();

        // Mulai query dasar
        $query = Absensi::whereDate('tanggal', $hariIni);

        // Filter berdasarkan cabang jika dipilih
        if ($request->cabang && $request->cabang != 'all') {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('cabang_id', $request->cabang);
            });
        }

        // Filter berdasarkan jam kerja/shift jika dipilih
        if ($request->jam_kerja && $request->jam_kerja != 'all') {
            $query->where('shift_id', $request->jam_kerja);
        }

        $tepatWaktu = (clone $query)->where('status', 'HADIR')->count();
        $terlambat = (clone $query)->where('status', 'TERLAMBAT')->count();
        $izinCuti = (clone $query)->where('status', 'IZIN')->count();
        $alpa = (clone $query)->where('status', 'ALPA')->count();

        // Hitung belum absen (sesuaikan logika dengan kebutuhan)
        $totalKaryawanFilter = User::where('role', 'KARYAWAN')->where('status', 'AKTIF');
        if ($request->cabang && $request->cabang != 'all') {
            $totalKaryawanFilter->where('cabang_id', $request->cabang);
        }
        $karyawanAktifCount = $totalKaryawanFilter->count();

        $belumAbsen = $karyawanAktifCount - ($tepatWaktu + $terlambat + $izinCuti + $alpa);

        return response()->json([
            'tepatWaktu' => $tepatWaktu,
            'terlambat' => $terlambat,
            'belumAbsen' => max(0, $belumAbsen),
            'izinCuti' => $izinCuti,
            'alpa' => $alpa
        ]);
    }

    /**
     * Approve or reject izin
     */
    public function updateIzinStatus(Request $request, $id)
    {
        $izin = Izin::findOrFail($id);

        $request->validate([
            'status' => 'required|in:APPROVED,REJECTED',
            'catatan' => 'nullable|string'
        ]);

        $izin->status = $request->status;
        $izin->approved_by = auth()->id();
        $izin->approved_at = Carbon::now();
        $izin->save();

        return response()->json([
            'success' => true,
            'message' => 'Status izin berhasil diperbarui'
        ]);
    }
}
