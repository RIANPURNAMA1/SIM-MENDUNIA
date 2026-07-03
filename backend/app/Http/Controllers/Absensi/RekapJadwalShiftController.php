<?php

namespace App\Http\Controllers\Absensi;

use App\Models\Absensi;
use App\Models\ShiftJadwal;
use App\Models\Shift;
use App\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Carbon\Carbon;

class RekapJadwalShiftController extends Controller
{
    public function index()
    {
        $karyawan = User::where('role', 'KARYAWAN')->where('status', 'AKTIF')->get();
        $shifts = Shift::where('status', 'AKTIF')->get();

        return view('admin.rekap-jadwal-shift', compact('karyawan', 'shifts'));
    }

    public function getData(Request $request, $userId)
    {
        $bulan = $request->get('bulan', Carbon::now()->month);
        $tahun = $request->get('tahun', Carbon::now()->year);

        $daysInMonth = Carbon::create($tahun, $bulan, 1)->daysInMonth;

        $user = User::with('shift')->findOrFail($userId);
        $defaultShift = $user->shift;

        $jadwals = ShiftJadwal::where('user_id', $userId)
            ->whereMonth('tanggal', $bulan)
            ->whereYear('tanggal', $tahun)
            ->with('shift')
            ->get()
            ->groupBy(function ($item) {
                return $item->tanggal->toDateString();
            });

        $absensis = Absensi::where('user_id', $userId)
            ->whereMonth('tanggal', $bulan)
            ->whereYear('tanggal', $tahun)
            ->get()
            ->groupBy(function ($item) {
                return $item->tanggal->toDateString();
            });

        $data = [];
        for ($day = 1; $day <= $daysInMonth; $day++) {
            $dateStr = sprintf('%s-%02s-%02s', $tahun, $bulan, $day);
            $dayOfWeek = Carbon::create($tahun, $bulan, $day)->dayOfWeek;

            $jadwalArr = $jadwals->get($dateStr);
            $absensiArr = $absensis->get($dateStr);
            $rowData = [];
            $isLiburDate = false;

            if ($jadwalArr && $jadwalArr->isNotEmpty()) {
                foreach ($jadwalArr as $jadwal) {
                    if ($jadwal->is_libur) {
                        $isLiburDate = true;
                        $matchingAbsensi = $absensiArr ? $absensiArr->first() : null;
                        $status = $matchingAbsensi ? $matchingAbsensi->status : 'LIBUR';

                    $rowData[] = [
                        'initial' => 'L',
                        'shift_nama' => 'Libur',
                        'shift_id' => null,
                        'status' => $status,
                        'color' => 'bg-secondary',
                        'text_color' => 'text-white',
                        'absensi_id' => $matchingAbsensi?->id,
                    ];
                        continue;
                    }

                    if (!$jadwal->shift) continue;

                    $shift = $jadwal->shift;
                    $initial = strtoupper(substr($shift->nama_shift, 0, 1));

                    $matchingAbsensi = $absensiArr ? $absensiArr->firstWhere('shift_id', $shift->id) : null;

                    $status = $matchingAbsensi ? $matchingAbsensi->status : 'BELUM ABSEN';

                    $color = match ($status) {
                        'HADIR' => 'bg-success',
                        'TERLAMBAT' => 'bg-warning',
                        'ALPA', 'TIDAK ABSEN PULANG' => 'bg-danger',
                        'IZIN' => 'bg-info',
                        'LIBUR' => 'bg-secondary',
                        default => 'bg-light border',
                    };
                    $textColor = in_array($status, ['HADIR', 'TERLAMBAT', 'ALPA', 'TIDAK ABSEN PULANG', 'IZIN', 'LIBUR']) ? 'text-white' : 'text-dark';

                    $rowData[] = [
                        'initial' => $initial,
                        'shift_nama' => $shift->nama_shift,
                        'shift_id' => $shift->id,
                        'status' => $status,
                        'color' => $color,
                        'text_color' => $textColor,
                        'absensi_id' => $matchingAbsensi?->id,
                    ];
                }
            } elseif ($defaultShift) {
                if ($dayOfWeek === 0 || $dayOfWeek === 6) {
                    continue;
                }

                $initial = strtoupper(substr($defaultShift->nama_shift, 0, 1));

                $matchingAbsensi = $absensiArr ? $absensiArr->firstWhere('shift_id', $defaultShift->id) : null;

                $status = $matchingAbsensi ? $matchingAbsensi->status : 'BELUM ABSEN';

                $color = match ($status) {
                    'HADIR' => 'bg-success',
                    'TERLAMBAT' => 'bg-warning',
                    'ALPA', 'TIDAK ABSEN PULANG' => 'bg-danger',
                    'IZIN' => 'bg-info',
                    'LIBUR' => 'bg-secondary',
                    default => 'bg-light border',
                };
                $textColor = in_array($status, ['HADIR', 'TERLAMBAT', 'ALPA', 'TIDAK ABSEN PULANG', 'IZIN', 'LIBUR']) ? 'text-white' : 'text-dark';

                $rowData[] = [
                    'initial' => $initial,
                    'shift_nama' => $defaultShift->nama_shift,
                    'shift_id' => $defaultShift->id,
                    'status' => $status,
                    'color' => $color,
                    'text_color' => $textColor,
                    'absensi_id' => $matchingAbsensi?->id,
                ];
            } else {
                continue;
            }

            if (empty($rowData)) {
                continue;
            }

            $data[$dateStr] = [
                'day' => $day,
                'day_of_week' => $dayOfWeek,
                'shifts' => $rowData,
                'is_libur' => $isLiburDate,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function updateStatus(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'tanggal' => 'required|date',
            'shift_id' => 'required|exists:shifts,id',
            'status' => 'required|in:HADIR,TERLAMBAT,IZIN,ALPA,PULANG LEBIH AWAL,TIDAK ABSEN PULANG,LIBUR',
            'jam_masuk' => 'nullable',
            'jam_keluar' => 'nullable',
        ]);

        $updateData = ['status' => $request->status];

        if ($request->status === 'HADIR') {
            $shift = Shift::find($request->shift_id);
            if ($shift) {
                $updateData['jam_masuk'] = $shift->jam_masuk;
                $updateData['jam_keluar'] = $shift->jam_pulang;
            }
        }

        $absensi = Absensi::updateOrCreate(
            [
                'user_id' => $request->user_id,
                'tanggal' => $request->tanggal,
                'shift_id' => $request->shift_id,
            ],
            $updateData
        );

        return response()->json([
            'success' => true,
            'message' => 'Status kehadiran berhasil diperbarui',
            'absensi_id' => $absensi->id,
        ]);
    }
}
