<?php

namespace App\Http\Controllers\Absensi;

use App\Models\AbsensiSensei;
use App\Models\IzinSensei;
use App\Models\KelasSensei;
use App\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Carbon\Carbon;

class RekapKehadiranSenseiController extends Controller
{
    /**
     * Daftar tanggal yang terdampak izin sensei. Data tersimpan pada kolom
     * jadwal_tertentu; kalau kosong, hitung ulang hari kerja pada rentang izin.
     */
    private function tanggalIzin(IzinSensei $izin): array
    {
        $dates = is_array($izin->jadwal_tertentu) ? $izin->jadwal_tertentu : [];
        $dates = array_values(array_filter($dates, fn ($tanggal) => is_string($tanggal) && $tanggal !== ''));

        if (count($dates) === 0) {
            $cursor = Carbon::parse($izin->tgl_mulai)->startOfDay();
            $akhir = Carbon::parse($izin->tgl_selesai)->startOfDay();

            while ($cursor->lte($akhir)) {
                if ($cursor->dayOfWeek !== Carbon::SATURDAY
                    && $cursor->dayOfWeek !== Carbon::SUNDAY
                    && !\App\Models\HariLibur::apakahLibur($cursor->toDateString())) {
                    $dates[] = $cursor->toDateString();
                }
                $cursor->addDay();
            }
        }

        return array_values(array_unique($dates));
    }

    private function namaPengganti(IzinSensei $izin): ?string
    {
        $nama = $izin->pengganti?->name ?: $izin->nama_pengganti;

        return $nama ?: null;
    }

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
                $jumlahAbsen = AbsensiSensei::where('kelas_sensei_id', $kelas->id)
                    ->whereIn('status', ['HADIR', 'TERLAMBAT', 'ALPA', 'PULANG LEBIH AWAL', 'TIDAK ABSEN PULANG'])
                    ->count();

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

        $awalBulan = Carbon::create($tahun, $bulan, 1)->toDateString();
        $akhirBulan = Carbon::create($tahun, $bulan, 1)->endOfMonth()->toDateString();

        $izinMap = [];
        $izinList = IzinSensei::with('pengganti:id,name')
            ->where('user_id', $userId)
            ->where('status', 'APPROVED')
            ->whereDate('tgl_mulai', '<=', $akhirBulan)
            ->whereDate('tgl_selesai', '>=', $awalBulan)
            ->get();

        foreach ($izinList as $izin) {
            if (!$izin->kelas_sensei_id) continue;

            $info = [
                'pengganti' => $this->namaPengganti($izin),
                'jenis_izin' => $izin->jenis_izin,
                'alasan' => $izin->alasan,
            ];

            foreach ($this->tanggalIzin($izin) as $tanggal) {
                $izinMap[$tanggal][(int) $izin->kelas_sensei_id] = $info;
            }
        }

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
                    $izinInfo = $izinMap[$dateStr][(int) $kelas->id] ?? null;

                    // Izin yang sudah disetujui menjadi acuan saat absensi masih
                    // kosong atau terlanjur ditandai ALPA oleh generate otomatis.
                    if ($izinInfo && in_array($status, ['ALPA', 'BELUM ABSEN'], true)) {
                        $status = 'IZIN';
                    }

                    $initial = strtoupper(substr($status, 0, 1));

                    $color = match ($status) {
                        'HADIR' => 'bg-success',
                        'TERLAMBAT' => 'bg-warning',
                        'ALPA', 'TIDAK ABSEN PULANG' => 'bg-danger',
                        'PULANG LEBIH AWAL', 'IZIN' => 'bg-info',
                        'LIBUR' => 'bg-secondary',
                        default => 'bg-light border',
                    };
                    $textColor = in_array($status, ['HADIR', 'TERLAMBAT', 'ALPA', 'TIDAK ABSEN PULANG', 'PULANG LEBIH AWAL', 'LIBUR', 'IZIN']) ? 'text-white' : 'text-dark';

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
                        'pengganti' => $status === 'IZIN' ? ($izinInfo['pengganti'] ?? null) : null,
                        'jenis_izin' => $status === 'IZIN' ? ($izinInfo['jenis_izin'] ?? null) : null,
                        'keterangan_izin' => $status === 'IZIN' ? ($izinInfo['alasan'] ?? null) : null,
                    ];
                }
            }

            // Pastikan izin yang sudah disetujui tetap tampil walau baris absensinya belum dibuat.
            $kelasSudahAda = array_map(fn ($row) => (int) $row['kelas_id'], $rowData);
            foreach ($kelasList as $kelas) {
                $kelasId = (int) $kelas['id'];
                $izinInfo = $izinMap[$dateStr][$kelasId] ?? null;
                if (!$izinInfo || in_array($kelasId, $kelasSudahAda, true)) continue;

                $rowData[] = [
                    'initial' => 'I',
                    'kelas_nama' => $kelas['nama_kelas'],
                    'kelas_id' => $kelasId,
                    'status' => 'IZIN',
                    'color' => 'bg-info',
                    'text_color' => 'text-white',
                    'absensi_id' => null,
                    'jam_masuk' => null,
                    'jam_pulang' => null,
                    'foto_masuk' => null,
                    'foto_pulang' => null,
                    'pengganti' => $izinInfo['pengganti'],
                    'jenis_izin' => $izinInfo['jenis_izin'],
                    'keterangan_izin' => $izinInfo['alasan'],
                ];
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
            'status' => 'required|in:HADIR,TERLAMBAT,PULANG LEBIH AWAL,TIDAK ABSEN PULANG,ALPA,IZIN,LIBUR',
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

    public function riwayatKelas($userId)
    {
        $user = User::findOrFail($userId);
        $today = Carbon::now()->toDateString();

        $riwayat = KelasSensei::with('batchRelasi.cabang')
            ->where('user_id', $userId)
            ->orderBy('tanggal_mulai', 'desc')
            ->get()
            ->map(function ($kelas) use ($today) {
                $tglMulai = Carbon::parse($kelas->tanggal_mulai);
                $tglSelesai = Carbon::parse($kelas->tanggal_selesai);

                $status = 'selesai';
                if ($kelas->status !== 'aktif') {
                    $status = $kelas->status;
                } elseif ($today >= $tglMulai->toDateString() && $today <= $tglSelesai->toDateString()) {
                    $status = 'berjalan';
                } elseif ($today < $tglMulai->toDateString()) {
                    $status = 'akan_datang';
                }

                $absensi = AbsensiSensei::where('kelas_sensei_id', $kelas->id)->get();
                $totalPertemuan = $kelas->totalPertemuan();
                $hadir = $absensi->where('status', 'HADIR')->count();
                $terlambat = $absensi->where('status', 'TERLAMBAT')->count();
                $alpa = $absensi->where('status', 'ALPA')->count();
                $pulangAwal = $absensi->where('status', 'PULANG LEBIH AWAL')->count();
                $tidakAbsenPulang = $absensi->where('status', 'TIDAK ABSEN PULANG')->count();
                $jumlahLibur = $absensi->where('status', 'LIBUR')->count();
                $jumlahAbsen = $hadir + $terlambat + $alpa + $pulangAwal + $tidakAbsenPulang;

                return [
                    'id' => $kelas->id,
                    'nama_kelas' => $kelas->nama_kelas,
                    'level' => $kelas->level,
                    'tanggal_mulai' => $tglMulai->toDateString(),
                    'tanggal_selesai' => $tglSelesai->toDateString(),
                    'total_pertemuan' => $totalPertemuan,
                    'jumlah_absen' => $jumlahAbsen,
                    'hadir' => $hadir,
                    'terlambat' => $terlambat,
                    'alpa' => $alpa,
                    'pulang_awal' => $pulangAwal,
                    'tidak_absen_pulang' => $tidakAbsenPulang,
                    'libur' => $jumlahLibur,
                    'belum_absen' => max(0, $totalPertemuan - $jumlahAbsen - $jumlahLibur),
                    'batch_id' => $kelas->batch_id,
                    'batch_nama' => $kelas->batchRelasi->nama_batch ?? '-',
                    'batch_warna' => $kelas->batchRelasi->warna ?? null,
                    'batch_cabang_nama' => $kelas->batchRelasi->cabang->nama_cabang ?? null,
                    'status' => $status,
                ];
            });

        return response()->json([
            'success' => true,
            'sensei' => $user->name,
            'data' => $riwayat,
        ]);
    }

    public function tableData(Request $request)
    {
        $kelasCollection = KelasSensei::with('batchRelasi', 'user')
            ->where('status', 'aktif')
            ->orderBy('created_at', 'desc')
            ->get();

        $izinByKelas = IzinSensei::with('pengganti:id,name')
            ->whereIn('kelas_sensei_id', $kelasCollection->pluck('id'))
            ->where('status', 'APPROVED')
            ->get()
            ->groupBy('kelas_sensei_id');

        $kelasList = $kelasCollection
            ->map(function ($kelas) use ($izinByKelas) {
                $tglMulai = Carbon::parse($kelas->tanggal_mulai);
                $tglSelesai = Carbon::parse($kelas->tanggal_selesai);
                $tglMulaiStr = $tglMulai->toDateString();
                $tglSelesaiStr = $tglSelesai->toDateString();
                $totalPertemuan = $tglMulai->copy()->diffInDaysFiltered(function ($date) {
                    if ($date->dayOfWeek === 0 || $date->dayOfWeek === 6) return false;
                    if (\App\Models\HariLibur::apakahLibur($date->toDateString())) return false;
                    return true;
                }, $tglSelesai->copy()->addSecond());

                $tanggalIzin = [];
                $pengganti = [];
                foreach ($izinByKelas->get($kelas->id, collect()) as $izin) {
                    foreach ($this->tanggalIzin($izin) as $tanggal) {
                        if ($tanggal >= $tglMulaiStr && $tanggal <= $tglSelesaiStr) {
                            $tanggalIzin[$tanggal] = true;
                        }
                    }

                    $namaPengganti = $this->namaPengganti($izin);
                    if ($namaPengganti) {
                        $pengganti[$namaPengganti] = true;
                    }
                }

                $absensi = AbsensiSensei::where('kelas_sensei_id', $kelas->id)->get();
                $hadir = $absensi->where('status', 'HADIR')->count();
                $terlambat = $absensi->where('status', 'TERLAMBAT')->count();
                $alpa = $absensi->where('status', 'ALPA')
                    ->reject(fn ($absen) => isset($tanggalIzin[$absen->tanggal->toDateString()]))
                    ->count();
                $libur = $absensi->where('status', 'LIBUR')->count();
                $tidakAbsenPulang = $absensi->where('status', 'TIDAK ABSEN PULANG')->count();
                $pulangLebihAwal = $absensi->where('status', 'PULANG LEBIH AWAL')->count();
                $absenTerisi = $hadir + $terlambat + $alpa + $pulangLebihAwal + $tidakAbsenPulang;

                $jumlahIzin = count($tanggalIzin);
                $belumAbsen = max(0, $totalPertemuan - $absenTerisi - $libur - $jumlahIzin);

                return [
                    'id' => $kelas->id,
                    'nama_kelas' => $kelas->nama_kelas,
                    'level' => $kelas->level,
                    'batch_id' => $kelas->batch_id,
                    'sensei_id' => $kelas->user_id,
                    'tanggal_mulai' => $tglMulaiStr,
                    'tanggal_selesai' => $tglSelesaiStr,
                    'total_pertemuan' => $totalPertemuan,
                    'absen_terisi' => $absenTerisi,
                    'hadir' => $hadir,
                    'terlambat' => $terlambat,
                    'alpa' => $alpa,
                    'pulang_lebih_awal' => $pulangLebihAwal,
                    'tidak_absen_pulang' => $tidakAbsenPulang,
                    'libur' => $libur,
                    'izin' => $jumlahIzin,
                    'pengganti' => count($pengganti) ? implode(', ', array_keys($pengganti)) : null,
                    'pengganti_list' => array_keys($pengganti),
                    'belum_absen' => $belumAbsen,
                    'sensei' => $kelas->user->name ?? '-',
                    'batch_nama' => $kelas->batchRelasi->nama_batch ?? '-',
                    'status' => Carbon::now()->toDateString() > $tglSelesaiStr ? 'selesai' : $kelas->status,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $kelasList,
        ]);
    }
}
