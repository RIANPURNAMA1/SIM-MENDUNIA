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

        $kelasList = KelasSensei::where('user_id', $userId)
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
                ];
            });

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

                    $initial = strtoupper(substr($kelas->nama_kelas, 0, 1));
                    $status = $absen->status ?: 'BELUM ABSEN';

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
        ]);
    }

    public function updateStatus(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:absensi_sensei,id',
            'status' => 'required|in:HADIR,TERLAMBAT,PULANG LEBIH AWAL,TIDAK ABSEN PULANG,ALPA,LIBUR',
        ]);

        $absen = AbsensiSensei::findOrFail($request->id);
        $absen->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'message' => 'Status kehadiran sensei berhasil diperbarui',
        ]);
    }
}
