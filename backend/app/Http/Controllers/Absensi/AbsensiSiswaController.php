<?php

namespace App\Http\Controllers\Absensi;

use App\Models\Kelas;
use App\Models\KelasSensei;
use App\Models\Siswa;
use App\Models\AbsensiSiswa;
use App\Models\Batch;
use Carbon\Carbon;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AbsensiSiswaController extends Controller
{
    public function index(Request $request)
    {
        $kelasList = KelasSensei::with('user', 'batchRelasi')->where('status', 'aktif')->get();

        $query = AbsensiSiswa::with('siswa.kelasRelasi');

        if ($request->filled('tanggal')) {
            $query->where('tanggal', $request->tanggal);
        } else {
            $query->where('tanggal', now()->toDateString());
        }

        if ($request->filled('kelas_sensei_id')) {
            $ks = KelasSensei::find($request->kelas_sensei_id);
            if ($ks) {
                $query->whereHas('siswa', function ($q) use ($ks) {
                    $q->where('batch_id', $ks->batch_id);
                });
            }
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $absensi = $query->orderBy('jam_masuk', 'desc')->get();

        return view('absensi_siswa.index', compact('absensi', 'kelasList'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'siswa_id' => 'required|exists:siswas,id',
            'tanggal' => 'required|date',
            'jam_masuk' => 'nullable',
            'jam_keluar' => 'nullable',
            'status' => 'required|in:HADIR,TERLAMBAT,IZIN,SAKIT,ALPA,LIBUR',
            'keterangan' => 'nullable|string',
            'kelas_sensei_id' => 'nullable|exists:kelas_sensei,id',
        ]);

        $absensi = AbsensiSiswa::updateOrCreate(
            [
                'siswa_id' => $request->siswa_id,
                'tanggal' => $request->tanggal,
                'kelas_sensei_id' => $request->kelas_sensei_id,
            ],
            [
                'jam_masuk' => $request->jam_masuk,
                'jam_keluar' => $request->jam_keluar,
                'status' => $request->status,
                'keterangan' => $request->keterangan,
                'kelas_sensei_id' => $request->kelas_sensei_id,
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Absensi siswa berhasil disimpan',
            'data' => $absensi,
        ]);
    }

    public function massStore(Request $request)
    {
        $request->validate([
            'tanggal' => 'required|date',
            'jam_masuk' => 'nullable',
            'kelas_sensei_id' => 'nullable|exists:kelas_sensei,id',
            'data' => 'required|array',
            'data.*.siswa_id' => 'required|exists:siswas,id',
            'data.*.status' => 'required|in:HADIR,TERLAMBAT,IZIN,SAKIT,ALPA,LIBUR',
            'data.*.keterangan' => 'nullable|string',
        ]);

        $tanggal = $request->tanggal;
        $jamMasuk = $request->jam_masuk;
        $kelasSenseiId = $request->kelas_sensei_id;
        $results = [];

        foreach ($request->data as $item) {
            $absensi = AbsensiSiswa::updateOrCreate(
                [
                    'siswa_id' => $item['siswa_id'],
                    'tanggal' => $tanggal,
                    'kelas_sensei_id' => $kelasSenseiId,
                ],
                [
                    'jam_masuk' => $jamMasuk,
                    'status' => $item['status'],
                    'keterangan' => $item['keterangan'] ?? null,
                    'kelas_sensei_id' => $kelasSenseiId,
                ]
            );
            $results[] = $absensi;
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Absensi massal berhasil disimpan',
            'data' => $results,
        ]);
    }

    public function update(Request $request, $id)
    {
        $absensi = AbsensiSiswa::findOrFail($id);

        $request->validate([
            'jam_masuk' => 'nullable',
            'jam_keluar' => 'nullable',
            'status' => 'required|in:HADIR,TERLAMBAT,IZIN,SAKIT,ALPA,LIBUR',
            'keterangan' => 'nullable|string',
        ]);

        $absensi->update($request->only(['jam_masuk', 'jam_keluar', 'status', 'keterangan']));

        return response()->json([
            'status' => 'success',
            'message' => 'Absensi siswa berhasil diperbarui',
            'data' => $absensi,
        ]);
    }

    public function apiRekap(Request $request)
    {
        $kelasList = KelasSensei::with('user', 'batchRelasi')
            ->where('status', 'aktif')
            ->orderBy('nama_kelas')
            ->get(['id', 'nama_kelas', 'batch_id', 'level']);

        $batchList = Batch::orderBy('nama_batch')->get(['id', 'nama_batch']);
        $levels = [1, 2, 3, 4];

        $selectedKelasSensei = null;
        if ($request->filled('kelas_sensei_id')) {
            $selectedKelasSensei = KelasSensei::with('user', 'batchRelasi')->find($request->kelas_sensei_id);
            if ($selectedKelasSensei && !$request->filled('start_date') && !$request->filled('end_date')) {
                $request->merge([
                    'start_date' => $selectedKelasSensei->tanggal_mulai->toDateString(),
                    'end_date' => $selectedKelasSensei->tanggal_selesai->toDateString(),
                ]);
            }
        }

        $data = $this->getRekapData($request);

        return response()->json([
            'rekap' => $data['rekap'],
            'kelas_list' => $kelasList,
            'batch_list' => $batchList,
            'levels' => $levels,
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'selected_kelas_sensei' => $selectedKelasSensei,
        ]);
    }

    private function getRekapData(Request $request): array
    {
        $start_date = $request->start_date ?? now()->startOfMonth()->toDateString();
        $end_date = $request->end_date ?? now()->endOfMonth()->toDateString();

        $query = Siswa::where('status', 'AKTIF');

        $selectedNamaKelas = null;
        if ($request->filled('kelas_sensei_id')) {
            $ks = KelasSensei::find($request->kelas_sensei_id);
            if ($ks) {
                $query->where('batch_id', $ks->batch_id);
                $selectedNamaKelas = $ks->nama_kelas;
            }
        } else {
            if ($request->filled('batch_id')) {
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

        return compact('rekap', 'start_date', 'end_date');
    }

    public function rekap(Request $request)
    {
        $kelasList = KelasSensei::with('user', 'batchRelasi')->where('status', 'aktif')->get();
        $batchList = Batch::orderBy('nama_batch')->get();
        $levels = [1, 2, 3, 4];
        $selectedKelasSensei = null;
        if ($request->filled('kelas_sensei_id')) {
            $selectedKelasSensei = KelasSensei::with('user', 'batchRelasi')->find($request->kelas_sensei_id);
            if ($selectedKelasSensei && !$request->filled('start_date') && !$request->filled('end_date')) {
                $request->merge([
                    'start_date' => $selectedKelasSensei->tanggal_mulai->toDateString(),
                    'end_date' => $selectedKelasSensei->tanggal_selesai->toDateString(),
                ]);
            }
        }
        $data = $this->getRekapData($request);
        $rekap = array_map(fn($r) => (object) $r, $data['rekap']);
        $start_date = $data['start_date'];
        $end_date = $data['end_date'];

        return view('rekap_siswa.index', compact('rekap', 'kelasList', 'batchList', 'levels', 'selectedKelasSensei', 'start_date', 'end_date'));
    }

    public function exportExcel(Request $request)
    {
        $data = $this->getRekapData($request);
        $rekap = $data['rekap'];
        $start_date = $data['start_date'];
        $end_date = $data['end_date'];

        $rows = '';
        $no = 1;
        foreach ($rekap as $r) {
            $rows .= '<tr>
                <td style="border:1px solid #000;padding:6px;text-align:center;font-size:11px;">'.$no++.'</td>
                <td style="border:1px solid #000;padding:6px;font-size:11px;">'.($r['nama'] ?? '-').'</td>
                <td style="border:1px solid #000;padding:6px;text-align:center;font-size:11px;">'.($r['kelas'] ?? '-').'</td>
                <td style="border:1px solid #000;padding:6px;text-align:center;font-size:11px;">'.$r['hadir'].'</td>
                <td style="border:1px solid #000;padding:6px;text-align:center;font-size:11px;">'.$r['terlambat'].'</td>
                <td style="border:1px solid #000;padding:6px;text-align:center;font-size:11px;">'.$r['izin'].'</td>
                <td style="border:1px solid #000;padding:6px;text-align:center;font-size:11px;">'.$r['sakit'].'</td>
                <td style="border:1px solid #000;padding:6px;text-align:center;font-size:11px;">'.$r['alpa'].'</td>
                <td style="border:1px solid #000;padding:6px;text-align:center;font-weight:bold;font-size:11px;">'.$r['total_hadir'].'</td>
                <td style="border:1px solid #000;padding:6px;text-align:center;font-weight:bold;font-size:11px;">'.$r['persentase'].'%</td>
                <td style="border:1px solid #000;padding:6px;text-align:center;font-size:11px;">'.$r['total'].'</td>
            </tr>';
        }

        $html = '
        <html>
        <head><meta charset="UTF-8">
        <style>
            @page { margin: 1cm; }
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
            th { background-color: #FFD966; color: #000; font-weight: bold; font-size: 11px; padding: 8px 6px; border: 1px solid #000; text-align: center; }
            .title { font-size: 16px; font-weight: bold; font-family: Arial, sans-serif; margin-bottom: 4px; }
            .subtitle { font-size: 11px; color: #555; font-family: Arial, sans-serif; margin-bottom: 16px; }
        </style>
        </head>
        <body>
        <div class="title">Rekapitulasi Absensi Siswa</div>
        <div class="subtitle">Periode: '.\Carbon\Carbon::parse($start_date)->format('d/m/Y').' s/d '.\Carbon\Carbon::parse($end_date)->format('d/m/Y').'</div>
        <table>
            <thead>
                <tr>
                    <th style="width:40px">No</th>
                    <th style="text-align:left">Nama</th>
                    <th>Kelas</th>
                    <th>HADIR</th>
                    <th>TERLAMBAT</th>
                    <th>IZIN</th>
                    <th>SAKIT</th>
                    <th>ALPA</th>
                    <th>Total Hadir</th>
                    <th>%</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                '.$rows.'
            </tbody>
        </table>
        </body>
        </html>';

        return response($html)
            ->header('Content-Type', 'application/vnd.ms-excel')
            ->header('Content-Disposition', 'attachment; filename="rekap-absensi-siswa.xls"');
    }

    public function exportPdf(Request $request)
    {
        $data = $this->getRekapData($request);
        $rekap = $data['rekap'];
        $start_date = $data['start_date'];
        $end_date = $data['end_date'];

        $rows = '';
        $no = 1;
        foreach ($rekap as $r) {
            $rows .= '<tr>
                <td style="border:1px solid #000;padding:5px;text-align:center;font-size:10px;">'.$no++.'</td>
                <td style="border:1px solid #000;padding:5px;font-size:10px;">'.($r['nama'] ?? '-').'</td>
                <td style="border:1px solid #000;padding:5px;text-align:center;font-size:10px;">'.($r['kelas'] ?? '-').'</td>
                <td style="border:1px solid #000;padding:5px;text-align:center;font-size:10px;">'.$r['hadir'].'</td>
                <td style="border:1px solid #000;padding:5px;text-align:center;font-size:10px;">'.$r['terlambat'].'</td>
                <td style="border:1px solid #000;padding:5px;text-align:center;font-size:10px;">'.$r['izin'].'</td>
                <td style="border:1px solid #000;padding:5px;text-align:center;font-size:10px;">'.$r['sakit'].'</td>
                <td style="border:1px solid #000;padding:5px;text-align:center;font-size:10px;">'.$r['alpa'].'</td>
                <td style="border:1px solid #000;padding:5px;text-align:center;font-weight:bold;font-size:10px;">'.$r['total_hadir'].'</td>
                <td style="border:1px solid #000;padding:5px;text-align:center;font-weight:bold;font-size:10px;">'.$r['persentase'].'%</td>
                <td style="border:1px solid #000;padding:5px;text-align:center;font-size:10px;">'.$r['total'].'</td>
            </tr>';
        }

        return view('rekap_siswa.export_pdf', compact('rows', 'start_date', 'end_date'));
    }

    public function apiIndex(Request $request)
    {
        $kelasList = KelasSensei::with('user', 'batchRelasi')
            ->where('status', 'aktif')
            ->orderBy('nama_kelas')
            ->get(['id', 'nama_kelas', 'batch_id', 'level', 'tanggal_mulai', 'tanggal_selesai']);

        $query = AbsensiSiswa::with([
            'siswa.kelasRelasi',
            'siswa.batchRelasi',
            'kelasSensei',
        ]);

        if ($request->filled('tanggal')) {
            $query->where('tanggal', $request->tanggal);
        } else {
            $query->where('tanggal', now()->toDateString());
        }

        if ($request->filled('kelas_sensei_id')) {
            $query->where('kelas_sensei_id', $request->kelas_sensei_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $absensi = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $absensi,
            'kelas_list' => $kelasList,
        ]);
    }

    public function kalenderJson($siswa, Request $request)
    {
        $siswa = Siswa::with('kelasRelasi')->findOrFail($siswa);
        $month = $request->month ?? now()->month;
        $year = $request->year ?? now()->year;

        $startOfMonth = \Carbon\Carbon::create($year, $month, 1);
        $endOfMonth = $startOfMonth->copy()->endOfMonth();

        $absensi = \App\Models\AbsensiSiswa::where('siswa_id', $siswa->id)
            ->whereBetween('tanggal', [$startOfMonth, $endOfMonth])
            ->get()
            ->map(function ($a) {
                return [
                    'hari' => \Carbon\Carbon::parse($a->tanggal)->day,
                    'status' => $a->status,
                    'jam_masuk' => $a->jam_masuk,
                    'jam_keluar' => $a->jam_keluar,
                ];
            });

        return response()->json([
            'siswa' => ['nama' => $siswa->nama, 'kelas' => $siswa->kelasRelasi->nama_kelas ?? $siswa->kelas],
            'absensi' => $absensi,
            'month' => $month,
            'year' => $year,
            'daysInMonth' => $startOfMonth->daysInMonth,
            'startDayOfWeek' => $startOfMonth->startOfMonth()->dayOfWeek,
            'monthName' => $startOfMonth->format('F Y'),
        ]);
    }

    public function dataSiswaByKelas(Request $request)
    {
        $ks = KelasSensei::with('batchRelasi')->findOrFail($request->kelas_id);

        $siswa = Siswa::where('batch_id', $ks->batch_id)
            ->where('status', 'AKTIF')
            ->orderBy('nama')
            ->get(['id', 'nama', 'kelas']);

        return response()->json($siswa);
    }

    public function cekAbsensiSiswa(Request $request)
    {
        $request->validate([
            'siswa_id' => 'required|exists:siswas,id',
            'tanggal' => 'required|date',
        ]);

        $absensi = AbsensiSiswa::where('siswa_id', $request->siswa_id)
            ->where('tanggal', $request->tanggal)
            ->first();

        return response()->json($absensi);
    }
}
