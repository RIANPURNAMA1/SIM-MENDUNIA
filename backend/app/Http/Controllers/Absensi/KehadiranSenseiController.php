<?php

namespace App\Http\Controllers\Absensi;

use App\Models\AbsensiSensei;
use App\Models\Izin;
use App\Models\KelasSensei;
use App\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class KehadiranSenseiController extends Controller
{
    public function index(Request $request)
    {
        $list_cabang = \App\Models\Cabang::all();
        $list_divisi = \App\Models\Divisi::all();

        $list_sensei = User::whereIn('role', ['KARYAWAN', 'GURU'])
            ->whereHas('kelasSensei')
            ->with(['kelasSensei' => function ($q) {
                $q->orderBy('nama_kelas', 'asc');
            }])
            ->orderBy('name', 'asc')
            ->get();

        // Get all kelas sensei grouped by user (creator)
        $kelasByUser = User::whereIn('role', ['KARYAWAN', 'GURU'])
            ->whereHas('kelasSensei')
            ->with(['kelasSensei' => function ($q) {
                $q->orderBy('tanggal_mulai', 'desc');
            }])
            ->get()
            ->map(function ($user) {
                foreach ($user->kelasSensei as $kelas) {
                    $tglMulai = \Carbon\Carbon::parse($kelas->tanggal_mulai);
                    $tglSelesai = \Carbon\Carbon::parse($kelas->tanggal_selesai);
                    $kelas->total_pertemuan = $tglMulai->copy()->diffInDaysFiltered(function ($date) {
                        if ($date->dayOfWeek === 0 || $date->dayOfWeek === 6) {
                            return false;
                        }
                        if (\App\Models\HariLibur::apakahLibur($date->toDateString())) {
                            return false;
                        }
                        return true;
                    }, $tglSelesai->copy()->addSecond());
                    $absenQuery = \App\Models\AbsensiSensei::where('kelas_sensei_id', $kelas->id)
                        ->whereDate('tanggal', '>=', $tglMulai)
                        ->whereDate('tanggal', '<=', $tglSelesai)
                        ->whereRaw('DAYOFWEEK(tanggal) NOT IN (1, 7)')
                        ->get()
                        ->reject(function ($absen) {
                            return \App\Models\HariLibur::apakahLibur($absen->tanggal);
                        });
                    $kelas->jumlah_absen = $absenQuery->count();
                    $kelas->jumlah_alpa = $absenQuery->where('status', 'ALPA')->count();
                    $izinSensei = \App\Models\Izin::where('user_id', $kelas->user_id)
                        ->where('status', 'DISETUJUI')
                        ->whereDate('tgl_mulai', '<=', $tglSelesai)
                        ->whereDate('tgl_selesai', '>=', $tglMulai)
                        ->get();
                    $kelas->jumlah_izin = $izinSensei->sum(function ($izin) use ($tglMulai, $tglSelesai) {
                        $overlapMulai = $tglMulai->copy()->max(\Carbon\Carbon::parse($izin->tgl_mulai));
                        $overlapSelesai = $tglSelesai->copy()->min(\Carbon\Carbon::parse($izin->tgl_selesai));
                        return $overlapMulai->diffInDaysFiltered(function ($date) {
                            if ($date->dayOfWeek === 0 || $date->dayOfWeek === 6) return false;
                            if (\App\Models\HariLibur::apakahLibur($date->toDateString())) return false;
                            return true;
                        }, $overlapSelesai->copy()->addSecond());
                    });
                }

                return $user;
            });

        $start_date = $request->start_date ?? now('Asia/Jakarta')->startOfMonth()->toDateString();
        $end_date = $request->end_date ?? now('Asia/Jakarta')->toDateString();
        $user_id = $request->user_id;
        $kelas_id = $request->kelas_id;
        $batch_id = $request->batch_id;
        $level = $request->level;
        $status = $request->status;

        $query = AbsensiSensei::with(['user', 'kelasSensei'])
            ->whereBetween('tanggal', [$start_date, $end_date]);

        if ($user_id) {
            $query->where('user_id', $user_id);
        }

        if ($kelas_id) {
            $query->where('kelas_sensei_id', $kelas_id);
        }

        if ($batch_id) {
            $query->whereHas('kelasSensei', fn($q) => $q->where('batch_id', $batch_id));
        }

        if ($level) {
            $query->whereHas('kelasSensei', fn($q) => $q->where('level', $level));
        }

        if ($status) {
            $query->where('status', $status);
        }

        $absensis = $query->orderBy('kelas_sensei_id', 'asc')
            ->orderBy('tanggal', 'desc')
            ->orderBy('jam_masuk', 'asc')
            ->get();

        $this->generateAlphaForRange($start_date, $end_date);

        $absensis = AbsensiSensei::with(['user', 'kelasSensei'])
            ->whereBetween('tanggal', [$start_date, $end_date]);

        if ($user_id) {
            $absensis->where('user_id', $user_id);
        }

        if ($kelas_id) {
            $absensis->where('kelas_sensei_id', $kelas_id);
        }

        if ($batch_id) {
            $absensis->whereHas('kelasSensei', fn($q) => $q->where('batch_id', $batch_id));
        }

        if ($level) {
            $absensis->whereHas('kelasSensei', fn($q) => $q->where('level', $level));
        }

        if ($status) {
            $absensis->where('status', $status);
        }

        $absensis = $absensis->orderBy('kelas_sensei_id', 'asc')
            ->orderBy('tanggal', 'desc')
            ->orderBy('jam_masuk', 'asc')
            ->get();

        // Group by kelas
        $groupedAbsensis = $absensis->groupBy('kelas_sensei_id')->map(function ($items) {
            $firstItem = $items->first();
            $kelas = $firstItem->kelasSensei;
            $tanggalMulai = \Carbon\Carbon::parse($kelas->tanggal_mulai);
            $tanggalSelesai = \Carbon\Carbon::parse($kelas->tanggal_selesai);

            // Hitung total pertemuan (hanya hari Senin-Jumat, exclude hari libur)
            $totalPertemuan = $tanggalMulai->copy()->diffInDaysFiltered(function ($date) {
                if ($date->dayOfWeek === 0 || $date->dayOfWeek === 6) {
                    return false;
                }
                if (\App\Models\HariLibur::apakahLibur($date->toDateString())) {
                    return false;
                }
                return true;
            }, $tanggalSelesai->copy()->addSecond());

            // Filter items to exclude holidays
            $itemsFiltered = $items->filter(fn ($a) => !\App\Models\HariLibur::apakahLibur($a->tanggal));

            // Hitung pertemuan ke- untuk setiap absensi
            $itemsFiltered = $itemsFiltered->map(function ($absen) use ($tanggalMulai) {
                $tanggalAbsen = \Carbon\Carbon::parse($absen->tanggal);

                // Hitung pertemuan ke dengan skip weekend dan hari libur
                $pertemuanKe = 1;
                $checkDate = $tanggalMulai->copy();
                while ($checkDate->lt($tanggalAbsen)) {
                    if ($checkDate->dayOfWeek !== 0 && $checkDate->dayOfWeek !== 6 && !\App\Models\HariLibur::apakahLibur($checkDate->toDateString())) {
                        $pertemuanKe++;
                    }
                    $checkDate->addDay();
                }
                $absen->pertemuan_ke = $pertemuanKe;

                return $absen;
            });

            return [
                'kelas' => $kelas,
                'absensis' => $itemsFiltered,
                'total' => $totalPertemuan,
                'total_absen' => $itemsFiltered->count(),
                'hadir' => $itemsFiltered->where('status', 'HADIR')->count(),
                'terlambat' => $itemsFiltered->where('status', 'TERLAMBAT')->count(),
                'pulang_cepat' => $itemsFiltered->where('status', 'PULANG LEBIH AWAL')->count(),
                'tidak_pulang' => $itemsFiltered->where('status', 'TIDAK ABSEN PULANG')->count(),
                'alpa' => $itemsFiltered->whereIn('status', ['ALPA', 'TIDAK ABSEN PULANG'])->count(),
                'libur' => $items->where('status', 'LIBUR')->count(),
            ];
        });

        $rekap = $this->generateRekap($absensis->filter(fn ($a) => !\App\Models\HariLibur::apakahLibur($a->tanggal)));

        $list_batch = \App\Models\Batch::orderBy('nama_batch', 'asc')->get();

        return view('admin.kehadiran_sensei.index', [
            'groupedAbsensis' => $groupedAbsensis,
            'absensis' => $absensis,
            'rekap' => $rekap,
            'start_date' => $start_date,
            'end_date' => $end_date,
            'list_cabang' => $list_cabang,
            'list_divisi' => $list_divisi,
            'list_sensei' => $list_sensei,
            'list_batch' => $list_batch,
            'kelasByUser' => $kelasByUser,
            'user_id_selected' => $user_id,
            'kelas_id_selected' => $kelas_id,
            'batch_id_selected' => $batch_id,
            'level_selected' => $level,
            'status_selected' => $status,
        ]);
    }

    private function generateRekap($absensis)
    {
        $total = $absensis->count();
        $hadir = $absensis->where('status', 'HADIR')->count();
        $terlambat = $absensis->where('status', 'TERLAMBAT')->count();
        $pulangCepat = $absensis->where('status', 'PULANG LEBIH AWAL')->count();
        $tidakAbsen = $absensis->where('status', 'TIDAK ABSEN PULANG')->count();

        return [
            'total' => $total,
            'hadir' => $hadir,
            'terlambat' => $terlambat,
            'pulang_cepat' => $pulangCepat,
            'tidak_absen_pulang' => $tidakAbsen,
        ];
    }

    private function generateAlphaForRange($startDate, $endDate)
    {
        $start = \Carbon\Carbon::parse($startDate, 'Asia/Jakarta');
        $end = \Carbon\Carbon::parse($endDate, 'Asia/Jakarta');
        $now = \Carbon\Carbon::now('Asia/Jakarta');

        $kelasAktif = KelasSensei::where('status', 'aktif')
            ->with('user')
            ->get();

        foreach ($kelasAktif as $kelas) {
            $sensei = $kelas->user;
            if (! $sensei) {
                continue;
            }

            $tanggalMulai = \Carbon\Carbon::parse($kelas->tanggal_mulai, 'Asia/Jakarta');
            $tanggalSelesai = \Carbon\Carbon::parse($kelas->tanggal_selesai, 'Asia/Jakarta');

            if ($tanggalSelesai->lt($start) || $tanggalMulai->gt($end)) {
                continue;
            }

            $shift = $sensei->shift;
            $jamMasukShift = $shift
                ? \Carbon\Carbon::parse($shift->jam_masuk, 'Asia/Jakarta')
                : \Carbon\Carbon::parse('09:00:00', 'Asia/Jakarta');
            $toleransi = $shift ? ($shift->toleransi ?? 0) : 0;
            $batasJamMasuk = $jamMasukShift->copy()->addMinutes(30 + $toleransi);

            $current = $start->copy();
            while ($current->lte($end)) {
                $tanggalStr = $current->toDateString();

                if ($current->gt($now)) {
                    $current->addDay();

                    continue;
                }

                if ($current->lt($tanggalMulai) || $current->gt($tanggalSelesai)) {
                    $current->addDay();

                    continue;
                }

                $hariLibur = \App\Models\HariLibur::apakahLibur($tanggalStr);
                if ($hariLibur) {
                    $current->addDay();

                    continue;
                }

                // Skip hari Sabtu (6) dan Minggu (0)
                if ($current->dayOfWeek === 0 || $current->dayOfWeek === 6) {
                    $current->addDay();

                    continue;
                }

                $existingAbsensi = AbsensiSensei::where('kelas_sensei_id', $kelas->id)
                    ->where('user_id', $sensei->id)
                    ->where('tanggal', $tanggalStr)
                    ->first();

                if (! $existingAbsensi) {
                    $jamMasukBatas = $batasJamMasuk->copy()->setTimeFromTimeString($current->format('H:i:s'));
                    if ($jamMasukBatas->lt($jamMasukShift)) {
                        $jamMasukBatas->addDay();
                    }

                    if ($now->gte($jamMasukBatas)) {
                        AbsensiSensei::create([
                            'kelas_sensei_id' => $kelas->id,
                            'user_id' => $sensei->id,
                            'tanggal' => $tanggalStr,
                            'status' => 'ALPA',
                            'catatan' => 'Sistem otomatis: Tidak melakukan absensi setelah melewati batas jam masuk shift.',
                        ]);
                    }
                }

                $current->addDay();
            }
        }
    }

    public function apiIndex(Request $request)
    {
        $start_date = $request->start_date ?? now('Asia/Jakarta')->startOfMonth()->toDateString();
        $end_date = $request->end_date ?? now('Asia/Jakarta')->toDateString();
        $user_id = $request->user_id;
        $kelas_id = $request->kelas_id;
        $batch_id = $request->batch_id;
        $level = $request->level;
        $status = $request->status;

        $query = AbsensiSensei::with(['user', 'kelasSensei.user', 'kelasSensei.batchRelasi'])
            ->whereBetween('tanggal', [$start_date, $end_date]);

        if ($user_id) $query->where('user_id', $user_id);
        if ($kelas_id) $query->where('kelas_sensei_id', $kelas_id);
        if ($batch_id) $query->whereHas('kelasSensei', fn($q) => $q->where('batch_id', $batch_id));
        if ($level) $query->whereHas('kelasSensei', fn($q) => $q->where('level', $level));
        if ($status) $query->where('status', $status);

        $absensis = $query->orderBy('kelas_sensei_id', 'asc')
            ->orderBy('tanggal', 'desc')
            ->orderBy('jam_masuk', 'asc')
            ->get();

        $grouped = $absensis->groupBy('kelas_sensei_id')->map(function ($items) {
            $firstItem = $items->first();
            $kelas = $firstItem->kelasSensei;
            $tanggalMulai = \Carbon\Carbon::parse($kelas->tanggal_mulai);
            $tanggalSelesai = \Carbon\Carbon::parse($kelas->tanggal_selesai);

            $totalPertemuan = $tanggalMulai->copy()->diffInDaysFiltered(function ($date) {
                if ($date->dayOfWeek === 0 || $date->dayOfWeek === 6) return false;
                if (\App\Models\HariLibur::apakahLibur($date->toDateString())) return false;
                return true;
            }, $tanggalSelesai->copy()->addSecond());

            $itemsFiltered = $items->filter(fn ($a) => !\App\Models\HariLibur::apakahLibur($a->tanggal));

            $itemsFiltered = $itemsFiltered->map(function ($absen) use ($tanggalMulai) {
                $tanggalAbsen = \Carbon\Carbon::parse($absen->tanggal);
                $pertemuanKe = 1;
                $checkDate = $tanggalMulai->copy();
                while ($checkDate->lt($tanggalAbsen)) {
                    if ($checkDate->dayOfWeek !== 0 && $checkDate->dayOfWeek !== 6 && !\App\Models\HariLibur::apakahLibur($checkDate->toDateString())) {
                        $pertemuanKe++;
                    }
                    $checkDate->addDay();
                }
                $absen->pertemuan_ke = $pertemuanKe;
                return $absen;
            });

            return [
                'kelas' => $kelas,
                'absensis' => $itemsFiltered->values(),
                'total' => $totalPertemuan,
                'stats' => [
                    'total_absen' => $itemsFiltered->count(),
                    'hadir' => $itemsFiltered->where('status', 'HADIR')->count(),
                    'terlambat' => $itemsFiltered->where('status', 'TERLAMBAT')->count(),
                    'pulang_cepat' => $itemsFiltered->where('status', 'PULANG LEBIH AWAL')->count(),
                    'tidak_pulang' => $itemsFiltered->where('status', 'TIDAK ABSEN PULANG')->count(),
                    'alpa' => $itemsFiltered->whereIn('status', ['ALPA', 'TIDAK ABSEN PULANG'])->count(),
                    'libur' => $items->where('status', 'LIBUR')->count(),
                ],
            ];
        })->values();

        $rekap = [
            'total' => $absensis->count(),
            'hadir' => $absensis->where('status', 'HADIR')->count(),
            'terlambat' => $absensis->where('status', 'TERLAMBAT')->count(),
            'pulang_cepat' => $absensis->where('status', 'PULANG LEBIH AWAL')->count(),
            'tidak_absen_pulang' => $absensis->where('status', 'TIDAK ABSEN PULANG')->count(),
        ];

        $list_sensei = User::whereIn('role', ['KARYAWAN', 'GURU'])
            ->whereHas('kelasSensei')
            ->with(['kelasSensei' => fn($q) => $q->orderBy('nama_kelas', 'asc')])
            ->orderBy('name', 'asc')
            ->get();

        $list_batch = \App\Models\Batch::orderBy('nama_batch', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $grouped,
            'rekap' => $rekap,
            'list_sensei' => $list_sensei,
            'list_batch' => $list_batch,
        ]);
    }

    public function apiUpdateStatus(Request $request)
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

    public function getKelasByUser($userId)
    {
        $kelas = KelasSensei::where('user_id', $userId)
            ->where('status', 'aktif')
            ->get();

        return response()->json($kelas);
    }

    public function updateStatus(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:absensi_sensei,id',
            'status' => 'required|in:HADIR,TERLAMBAT,PULANG LEBIH AWAL,TIDAK ABSEN PULANG,ALPA,LIBUR',
        ]);

        $absen = AbsensiSensei::findOrFail($request->id);
        $absen->update(['status' => $request->status]);

        return redirect()->back()->with('success', 'Status berhasil diupdate');
    }

    public function getRiwayat($userId, $kelasId)
    {
        $kelas = KelasSensei::with('user')->findOrFail($kelasId);

        $tanggalMulai = \Carbon\Carbon::parse($kelas->tanggal_mulai);
        $tanggalSelesai = \Carbon\Carbon::parse($kelas->tanggal_selesai);

        // Hitung total pertemuan (hanya hari Senin-Jumat, exclude hari libur)
        $totalPertemuan = $tanggalMulai->copy()->diffInDaysFiltered(function ($date) {
            if ($date->dayOfWeek === 0 || $date->dayOfWeek === 6) {
                return false;
            }
            if (\App\Models\HariLibur::apakahLibur($date->toDateString())) {
                return false;
            }
            return true;
        }, $tanggalSelesai->copy()->addSecond());

        $absensis = AbsensiSensei::where('user_id', $userId)
            ->where('kelas_sensei_id', $kelasId)
            ->orderBy('tanggal', 'asc')
            ->get()
            ->map(function ($absen) use ($tanggalMulai) {
                $tanggalAbsen = \Carbon\Carbon::parse($absen->tanggal);

                // Hitung pertemuan ke dengan skip weekend dan hari libur
                $pertemuanKe = 1;
                $checkDate = $tanggalMulai->copy();
                while ($checkDate->lt($tanggalAbsen)) {
                    if ($checkDate->dayOfWeek !== 0 && $checkDate->dayOfWeek !== 6 && !\App\Models\HariLibur::apakahLibur($checkDate->toDateString())) {
                        $pertemuanKe++;
                    }
                    $checkDate->addDay();
                }
                $absen->pertemuan_ke = $pertemuanKe;

                return $absen;
            });

        $stats = [
            'hadir' => $absensis->where('status', 'HADIR')->count(),
            'terlambat' => $absensis->where('status', 'TERLAMBAT')->count(),
            'pulang_cepat' => $absensis->where('status', 'PULANG LEBIH AWAL')->count(),
            'tidak_pulang' => $absensis->where('status', 'TIDAK ABSEN PULANG')->count(),
            'alpa' => $absensis->where('status', 'ALPA')->count(),
            'libur' => $absensis->where('status', 'LIBUR')->count(),
        ];

        return response()->json([
            'kelas' => [
                'nama_kelas' => $kelas->nama_kelas,
                'level' => $kelas->level,
                'tanggal_mulai' => \Carbon\Carbon::parse($kelas->tanggal_mulai)->format('d M Y'),
                'tanggal_selesai' => \Carbon\Carbon::parse($kelas->tanggal_selesai)->format('d M Y'),
                'sensei' => $kelas->user->name ?? '-',
            ],
            'total_pertemuan' => $totalPertemuan,
            'absensis' => $absensis,
            'stats' => $stats,
        ]);
    }

    public function kelasIndex(Request $request)
    {
        $user_id = $request->user_id;
        $status = $request->status;
        $start_date = $request->start_date;
        $end_date = $request->end_date;
        $batch_id = $request->batch_id;

        $query = KelasSensei::with('user', 'batchRelasi');

        if ($user_id) {
            $query->where('user_id', $user_id);
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($batch_id) {
            $query->where('batch_id', $batch_id);
        }

        if ($start_date) {
            $query->whereDate('tanggal_selesai', '>=', $start_date);
        }

        if ($end_date) {
            $query->whereDate('tanggal_mulai', '<=', $end_date);
        }

        $kelas = $query->orderBy('tanggal_mulai', 'desc')->get();

        $kelas = $kelas->map(function ($kelasItem) {
            $tglMulai = \Carbon\Carbon::parse($kelasItem->tanggal_mulai);
            $tglSelesai = \Carbon\Carbon::parse($kelasItem->tanggal_selesai);
            $kelasItem->total_pertemuan = $tglMulai->copy()->diffInDaysFiltered(function ($date) {
                if ($date->dayOfWeek === 0 || $date->dayOfWeek === 6) {
                    return false;
                }
                if (\App\Models\HariLibur::apakahLibur($date->toDateString())) {
                    return false;
                }
                return true;
            }, $tglSelesai->copy()->addSecond());
            $absenQuery = \App\Models\AbsensiSensei::where('kelas_sensei_id', $kelasItem->id)
                ->whereDate('tanggal', '>=', $tglMulai)
                ->whereDate('tanggal', '<=', $tglSelesai)
                ->whereRaw('DAYOFWEEK(tanggal) NOT IN (1, 7)')
                ->get()
                ->reject(function ($absen) {
                    return \App\Models\HariLibur::apakahLibur($absen->tanggal);
                });

            $kelasItem->jumlah_absen = $absenQuery->count();
            $kelasItem->jumlah_alpa = $absenQuery->where('status', 'ALPA')->count();

            $izinSensei = \App\Models\Izin::where('user_id', $kelasItem->user_id)
                ->where('status', 'DISETUJUI')
                ->whereDate('tgl_mulai', '<=', $tglSelesai)
                ->whereDate('tgl_selesai', '>=', $tglMulai)
                ->get();

            $kelasItem->jumlah_izin = $izinSensei->sum(function ($izin) use ($tglMulai, $tglSelesai) {
                $overlapMulai = $tglMulai->copy()->max(\Carbon\Carbon::parse($izin->tgl_mulai));
                $overlapSelesai = $tglSelesai->copy()->min(\Carbon\Carbon::parse($izin->tgl_selesai));
                return $overlapMulai->diffInDaysFiltered(function ($date) {
                    if ($date->dayOfWeek === 0 || $date->dayOfWeek === 6) return false;
                    if (\App\Models\HariLibur::apakahLibur($date->toDateString())) return false;
                    return true;
                }, $overlapSelesai->copy()->addSecond());
            });

            return $kelasItem;
        });

        $list_sensei = User::whereIn('role', ['KARYAWAN', 'GURU'])
            ->whereHas('kelasSensei')
            ->orderBy('name', 'asc')
            ->get();

        $list_batch = \App\Models\Batch::orderBy('nama_batch', 'asc')->get();

        return view('admin.kelas_sensei.index', [
            'kelas' => $kelas,
            'list_sensei' => $list_sensei,
            'list_batch' => $list_batch,
            'user_id_selected' => $user_id,
            'status_selected' => $status,
            'start_date' => $start_date,
            'end_date' => $end_date,
            'batch_id_selected' => $batch_id,
        ]);
    }

    public function apiKelasIndex(Request $request)
    {
        $user_id = $request->user_id;
        $status = $request->status;
        $start_date = $request->start_date;
        $end_date = $request->end_date;
        $batch_id = $request->batch_id;

        $query = KelasSensei::with('user', 'batchRelasi');

        if ($user_id) $query->where('user_id', $user_id);
        if ($status) $query->where('status', $status);
        if ($batch_id) $query->where('batch_id', $batch_id);
        if ($start_date) $query->whereDate('tanggal_selesai', '>=', $start_date);
        if ($end_date) $query->whereDate('tanggal_mulai', '<=', $end_date);

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
                ->whereDate('tgl_mulai', '<=', $tglSelesai)
                ->whereDate('tgl_selesai', '>=', $tglMulai)
                ->get();

            $kelasItem->jumlah_izin = $izinSensei->sum(function ($izin) use ($tglMulai, $tglSelesai) {
                $overlapMulai = $tglMulai->copy()->max(\Carbon\Carbon::parse($izin->tgl_mulai));
                $overlapSelesai = $tglSelesai->copy()->min(\Carbon\Carbon::parse($izin->tgl_selesai));
                return $overlapMulai->diffInDaysFiltered(function ($date) {
                    if ($date->dayOfWeek === 0 || $date->dayOfWeek === 6) return false;
                    if (\App\Models\HariLibur::apakahLibur($date->toDateString())) return false;
                    return true;
                }, $overlapSelesai->copy()->addSecond());
            });

            return $kelasItem;
        });

        $list_sensei = User::whereIn('role', ['KARYAWAN', 'GURU'])
            ->whereHas('kelasSensei')
            ->orderBy('name', 'asc')
            ->get();

        $list_batch = \App\Models\Batch::orderBy('nama_batch', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $kelas,
            'list_sensei' => $list_sensei,
            'list_batch' => $list_batch,
        ]);
    }

    public function apiKelasStore(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'batch_id' => 'nullable|exists:batches,id',
            'nama_kelas' => 'required|string|max:255',
            'level' => 'nullable|string|max:255',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'catatan' => 'nullable|string',
        ]);

        $kelas = KelasSensei::create([
            'user_id' => $request->user_id,
            'batch_id' => $request->batch_id,
            'nama_kelas' => $request->nama_kelas,
            'level' => $request->level,
            'tanggal_mulai' => $request->tanggal_mulai,
            'tanggal_selesai' => $request->tanggal_selesai,
            'catatan' => $request->catatan,
            'status' => 'aktif',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kelas berhasil ditambahkan',
            'data' => $kelas,
        ]);
    }

    public function apiKelasDestroy($id)
    {
        $kelas = KelasSensei::findOrFail($id);
        $kelas->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kelas berhasil dihapus',
        ]);
    }

    public function destroy($id)
    {
        $kelas = KelasSensei::findOrFail($id);
        $kelas->delete();

        return redirect()->back()->with('success', 'Kelas berhasil dihapus');
    }
}
