<?php

namespace App\Http\Controllers\Absensi;

use App\Models\AbsensiSensei;
use App\Models\KelasSensei;
use App\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Carbon\Carbon;

class RekapKehadiranSenseiController extends Controller
{
    public function index()
    {
        $sensei = User::whereIn('role', ['KARYAWAN', 'GURU'])
            ->whereHas('kelasSensei')
            ->orderBy('name', 'asc')
            ->get();

        return view('admin.rekap-kehadiran-sensei', compact('sensei'));
    }

    public function apiIndex()
    {
        $sensei = User::whereIn('role', ['KARYAWAN', 'GURU'])
            ->whereHas('kelasSensei')
            ->with('divisi')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $sensei,
        ]);
    }

    public function getData(Request $request, $userId)
    {
        $bulan = $request->get('bulan', Carbon::now()->month);
        $tahun = $request->get('tahun', Carbon::now()->year);

        $daysInMonth = Carbon::create($tahun, $bulan, 1)->daysInMonth;

        $user = User::findOrFail($userId);

        $kelasList = KelasSensei::with('batchRelasi.cabang')->where('user_id', $userId)
            ->where('status', 'aktif')
            ->orderBy('nama_kelas', 'asc')
            ->get()
            ->map(function ($kelas) {
                $tglMulai = Carbon::parse($kelas->tanggal_mulai);
                $tglSelesai = Carbon::parse($kelas->tanggal_selesai);
                $totalPertemuan = $tglMulai->copy()->diffInDaysFiltered(function ($date) {
                    if ($date->dayOfWeek === 0 || $date->dayOfWeek === 6) return false;
                    if (\App\Models\HariLibur::apakahLibur($date->toDateString())) return false;
                    return true;
                }, $tglSelesai->copy()->addSecond());
                $jumlahAbsen = AbsensiSensei::where('kelas_sensei_id', $kelas->id)->count();

                return [
                    'id' => $kelas->id,
                    'nama_kelas' => $kelas->nama_kelas,
                    'level' => $kelas->level,
                    'tanggal_mulai' => $tglMulai->toDateString(),
                    'tanggal_selesai' => $tglSelesai->toDateString(),
                    'total_pertemuan' => $totalPertemuan,
                    'jumlah_absen' => $jumlahAbsen,
                    'sensei' => $kelas->user->name ?? '-',
                    'batch_id' => $kelas->batch_id,
                    'batch_nama' => $kelas->batchRelasi->nama_batch ?? '-',
                    'batch_cabang_id' => $kelas->batchRelasi->cabang_id ?? null,
                    'batch_cabang_nama' => $kelas->batchRelasi->cabang->nama_cabang ?? null,
                    'batch_warna' => $kelas->batchRelasi->warna ?? null,
                ];
            });

        $uniqueBatches = $kelasList->filter(fn($k) => $k['batch_id'])->unique('batch_id')
            ->map(fn($k) => ['id' => $k['batch_id'], 'nama_batch' => $k['batch_nama'], 'warna' => $k['batch_warna']])->values();
        $uniqueCabangs = $kelasList->filter(fn($k) => $k['batch_cabang_id'])->unique('batch_cabang_id')
            ->map(fn($k) => ['id' => $k['batch_cabang_id'], 'nama_cabang' => $k['batch_cabang_nama']])->values();

        $absensis = AbsensiSensei::where('user_id', $userId)
            ->whereMonth('tanggal', $bulan)
            ->whereYear('tanggal', $tahun)
            ->with('kelasSensei')
            ->get()
            ->groupBy(function ($item) {
                return $item->tanggal->toDateString();
            });

        $data = [];
        for ($day = 1; $day <= $daysInMonth; $day++) {
            $dateStr = sprintf('%s-%02s-%02s', $tahun, $bulan, $day);
            $dayOfWeek = Carbon::create($tahun, $bulan, $day)->dayOfWeek;

            $inClassRange = false;
            foreach ($kelasList as $kelas) {
                if ($dateStr >= $kelas['tanggal_mulai'] && $dateStr <= $kelas['tanggal_selesai']) {
                    $inClassRange = true;
                    break;
                }
            }

            $absensiArr = $absensis->get($dateStr);
            $rowData = [];

            if ($absensiArr && $absensiArr->isNotEmpty()) {
                foreach ($absensiArr as $absen) {
                    $kelas = $absen->kelasSensei;
                    if (!$kelas) continue;

                    $status = $absen->status ?: 'BELUM ABSEN';
                    $initial = strtoupper(substr($status, 0, 1));

                    $color = match ($status) {
                        'HADIR' => 'bg-success',
                        'TERLAMBAT' => 'bg-warning',
                        'ALPA', 'TIDAK ABSEN PULANG' => 'bg-danger',
                        'PULANG LEBIH AWAL' => 'bg-info',
                        'LIBUR' => 'bg-secondary',
                        default => 'bg-light border',
                    };
                    $textColor = in_array($status, ['HADIR', 'TERLAMBAT', 'ALPA', 'TIDAK ABSEN PULANG', 'PULANG LEBIH AWAL', 'LIBUR']) ? 'text-white' : 'text-dark';

                    $rowData[] = [
                        'initial' => $initial,
                        'kelas_nama' => $kelas->nama_kelas,
                        'kelas_id' => $kelas->id,
                        'status' => $status,
                        'color' => $color,
                        'text_color' => $textColor,
                        'absensi_id' => $absen->id,
                        'jam_masuk' => $absen->jam_masuk,
                        'jam_pulang' => $absen->jam_keluar,
                        'foto_masuk' => $absen->foto_masuk,
                        'foto_pulang' => $absen->foto_pulang,
                    ];
                }
            }

            if (empty($rowData) && !$inClassRange) {
                continue;
            }

            $data[$dateStr] = [
                'day' => $day,
                'day_of_week' => $dayOfWeek,
                'in_class_range' => $inClassRange,
                'entries' => $rowData,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $data,
            'kelas_list' => $kelasList,
            'batch_list' => $uniqueBatches,
            'cabang_list' => $uniqueCabangs,
        ]);
    }

    public function updateStatus(Request $request)
    {
        $request->validate([
            'kelas_sensei_id' => 'required|exists:kelas_sensei,id',
            'user_id' => 'required|exists:users,id',
            'tanggal' => 'required|date',
            'status' => 'required|in:HADIR,TERLAMBAT,PULANG LEBIH AWAL,TIDAK ABSEN PULANG,ALPA,LIBUR',
            'jam_masuk' => 'nullable|date_format:H:i',
            'jam_pulang' => 'nullable|date_format:H:i',
            'foto_masuk' => 'nullable|image|max:5120',
            'foto_pulang' => 'nullable|image|max:5120',
        ]);

        $absen = AbsensiSensei::where([
            'kelas_sensei_id' => $request->kelas_sensei_id,
            'user_id' => $request->user_id,
            'tanggal' => $request->tanggal,
        ])->first();

        if (!$absen) {
            $absen = new AbsensiSensei([
                'kelas_sensei_id' => $request->kelas_sensei_id,
                'user_id' => $request->user_id,
                'tanggal' => $request->tanggal,
            ]);
        }

        $absen->status = $request->status;

        if ($request->filled('jam_masuk')) {
            $absen->jam_masuk = $request->jam_masuk;
        }
        if ($request->filled('jam_pulang')) {
            $absen->jam_keluar = $request->jam_pulang;
        }
        if ($request->hasFile('foto_masuk')) {
            if ($absen->foto_masuk) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($absen->foto_masuk);
            }
            $absen->foto_masuk = $request->file('foto_masuk')->store('absensi-sensei', 'public');
        }
        if ($request->hasFile('foto_pulang')) {
            if ($absen->foto_pulang) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($absen->foto_pulang);
            }
            $absen->foto_pulang = $request->file('foto_pulang')->store('absensi-sensei', 'public');
        }

        $absen->save();

        return response()->json([
            'success' => true,
            'message' => $absen->wasRecentlyCreated
                ? 'Status kehadiran sensei berhasil ditambahkan'
                : 'Status kehadiran sensei berhasil diperbarui',
            'data' => [
                'jam_masuk' => $absen->jam_masuk,
                'jam_pulang' => $absen->jam_keluar,
                'foto_masuk' => $absen->foto_masuk,
                'foto_pulang' => $absen->foto_pulang,
            ],
        ]);
    }

    public function tableData(Request $request)
    {
        $liburDates = \App\Models\HariLibur::pluck('tanggal')->flip();

        $kelasList = KelasSensei::with('batchRelasi', 'user')
            ->where('status', 'aktif')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($kelas) use ($liburDates) {
                $tglMulai = Carbon::parse($kelas->tanggal_mulai);
                $tglSelesai = Carbon::parse($kelas->tanggal_selesai);
                $totalPertemuan = $tglMulai->copy()->diffInDaysFiltered(function ($date) {
                    if ($date->dayOfWeek === 0 || $date->dayOfWeek === 6) return false;
                    if (\App\Models\HariLibur::apakahLibur($date->toDateString())) return false;
                    return true;
                }, $tglSelesai->copy()->addSecond());

                $absensi = AbsensiSensei::where('kelas_sensei_id', $kelas->id)->get();
                $harKerja = $absensi->filter(function ($a) use ($liburDates) {
                    $d = Carbon::parse($a->tanggal);
                    if ($d->isWeekend()) return false;
                    if (isset($liburDates[$d->toDateString()])) return false;
                    return true;
                });
                $absenTerisi = $harKerja->count();
                $alpa = $harKerja->whereIn('status', ['ALPA', 'TIDAK ABSEN PULANG'])->count();
                $izin = $harKerja->whereIn('status', ['LIBUR'])->count();

                return [
                    'id' => $kelas->id,
                    'nama_kelas' => $kelas->nama_kelas,
                    'level' => $kelas->level,
                    'batch_id' => $kelas->batch_id,
                    'sensei_id' => $kelas->user_id,
                    'tanggal_mulai' => $tglMulai->toDateString(),
                    'tanggal_selesai' => $tglSelesai->toDateString(),
                    'total_pertemuan' => $totalPertemuan,
                    'absen_terisi' => $absenTerisi,
                    'alpa' => $alpa,
                    'izin' => $izin,
                    'sensei' => $kelas->user->name ?? '-',
                    'batch_nama' => $kelas->batchRelasi->nama_batch ?? '-',
                    'status' => Carbon::now()->toDateString() > $tglSelesai->toDateString() ? 'selesai' : $kelas->status,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $kelasList,
        ]);
    }
}
