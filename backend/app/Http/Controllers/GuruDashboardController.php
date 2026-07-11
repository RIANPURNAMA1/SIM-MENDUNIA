<?php

namespace App\Http\Controllers;

use App\Models\AbsensiSensei;
use App\Models\AbsensiSiswa;
use App\Models\Batch;
use App\Models\Cabang;
use App\Models\DailyAssessmentStatus;
use App\Models\Guru;
use App\Models\HariLibur;
use App\Models\KelasSensei;
use App\Models\Shift;
use App\Models\Siswa;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GuruDashboardController extends Controller
{
    public function index()
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $guru = Guru::where('user_id', $user->id)->first();
        $today = now()->toDateString();
        $bulanIni = now()->month;
        $tahunIni = now()->year;

        $kelasAktif = KelasSensei::where('user_id', $user->id)
            ->where('status', 'aktif')
            ->whereDate('tanggal_mulai', '<=', $today)
            ->whereDate('tanggal_selesai', '>=', $today)
            ->with(['absensi' => function ($q) use ($today) {
                $q->where('tanggal', $today);
            }, 'batchRelasi'])
            ->get()
            ->map(function ($k) {
                $k->tanggal_mulai_formatted = \Carbon\Carbon::parse($k->tanggal_mulai)->format('d M');
                $k->tanggal_selesai_formatted = \Carbon\Carbon::parse($k->tanggal_selesai)->format('d M');
                return $k;
            });

        $totalKelas = KelasSensei::where('user_id', $user->id)->count();

        $kehadiranBulanIni = AbsensiSensei::where('user_id', $user->id)
            ->whereMonth('tanggal', $bulanIni)
            ->whereYear('tanggal', $tahunIni)
            ->count();

        $riwayatSensei = AbsensiSensei::where('user_id', $user->id)
            ->with('kelasSensei.batchRelasi')
            ->orderBy('tanggal', 'desc')
            ->take(10)
            ->get();

        $shifts = $user->shifts;
        $cabangs = $user->cabang;

        return response()->json([
            'guru' => $guru,
            'user' => $user,
            'kelas_aktif' => $kelasAktif,
            'total_kelas' => $totalKelas,
            'kehadiran_bulan_ini' => $kehadiranBulanIni,
            'riwayat_sensei' => $riwayatSensei,
            'shifts' => $shifts,
            'cabangs' => $cabangs,
        ]);
    }

    public function kelasSaya()
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $kelas = KelasSensei::where('user_id', $user->id)
            ->with('batchRelasi')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($k) {
                $k->tanggal_mulai_formatted = \Carbon\Carbon::parse($k->tanggal_mulai)->format('d M');
                $k->tanggal_selesai_formatted = \Carbon\Carbon::parse($k->tanggal_selesai)->format('d M');
                return $k;
            });

        $batches = Batch::orderBy('nama_batch')->get();

        return response()->json([
            'kelas' => $kelas,
            'batches' => $batches,
        ]);
    }

    public function storeKelas(Request $request)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $request->validate([
            'batch_id' => 'nullable|exists:batches,id',
            'nama_kelas' => 'required|string|max:255',
            'level' => 'nullable|string|max:255',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'catatan' => 'nullable|string',
        ]);

        $kelas = KelasSensei::create([
            'user_id' => $user->id,
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

    public function cekAbsen(Request $request)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $request->validate(['kelas_id' => 'required|exists:kelas_sensei,id']);

        $today = now()->toDateString();

        $absen = AbsensiSensei::where('user_id', $user->id)
            ->where('kelas_sensei_id', $request->kelas_id)
            ->where('tanggal', $today)
            ->first();

        return response()->json([
            'absen' => $absen,
        ]);
    }

    public function absenMasuk(Request $request)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $request->validate([
            'kelas_id' => 'required|exists:kelas_sensei,id',
            'foto' => 'nullable|string',
            'lat' => 'nullable|numeric',
            'long' => 'nullable|numeric',
        ]);

        $today = now()->toDateString();
        $now = now();

        // Cek hari libur
        if (HariLibur::apakahLibur($today)) {
            return response()->json([
                'success' => false,
                'message' => 'Hari ini adalah hari libur. Absensi tidak dibuka.',
            ], 403);
        }

        // Validasi geolokasi jika ada koordinat
        if ($request->filled('lat') && $request->filled('long')) {
            $cabangs = $user->cabang;
            if ($cabangs && $cabangs->isNotEmpty()) {
                $inRadius = false;
                foreach ($cabangs as $cabang) {
                    $jarak = $this->calculateDistance(
                        $request->lat,
                        $request->long,
                        $cabang->latitude,
                        $cabang->longitude
                    );
                    if ($jarak <= $cabang->radius) {
                        $inRadius = true;
                        break;
                    }
                }
                if (!$inRadius) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Lokasi Anda di luar radius cabang yang ditentukan.',
                    ], 422);
                }
            }
        }

        $kelas = KelasSensei::findOrFail($request->kelas_id);
        if ($kelas->user_id !== $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $existing = AbsensiSensei::where('user_id', $user->id)
            ->where('kelas_sensei_id', $request->kelas_id)
            ->where('tanggal', $today)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Anda sudah absen masuk hari ini untuk kelas ini',
            ]);
        }

        // Tentukan status berdasarkan shift
        $shifts = $user->shifts;
        $jamMasukShift = '09:00:00';
        $toleransi = 0;
        if ($shifts && $shifts->isNotEmpty()) {
            $defaultShift = $shifts->first();
            $jamMasukShift = $defaultShift->jam_masuk;
            $toleransi = $defaultShift->toleransi ?? 0;
        }

        $jamMasukParse = \Carbon\Carbon::parse($jamMasukShift);
        $batasToleransi = $jamMasukParse->copy()->addMinutes($toleransi);
        $status = $now->gt($batasToleransi) ? 'TERLAMBAT' : 'HADIR';

        $fotoPath = null;
        if ($request->foto) {
            $fotoPath = AbsensiSensei::savePhoto($request->foto, 'masuk');
        }

        $absen = AbsensiSensei::create([
            'kelas_sensei_id' => $request->kelas_id,
            'user_id' => $user->id,
            'tanggal' => $today,
            'jam_masuk' => $now->toTimeString(),
            'status' => $status,
            'foto_masuk' => $fotoPath,
            'lat_masuk' => $request->lat,
            'long_masuk' => $request->long,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Absen masuk berhasil. Status: ' . $status,
            'data' => $absen,
            'status' => $status,
        ]);
    }

    public function absenPulang(Request $request)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $request->validate([
            'kelas_id' => 'required|exists:kelas_sensei,id',
            'foto' => 'nullable|string',
            'lat' => 'nullable|numeric',
            'long' => 'nullable|numeric',
        ]);

        $today = now()->toDateString();
        $now = now();

        // Validasi geolokasi jika ada koordinat
        if ($request->filled('lat') && $request->filled('long')) {
            $cabangs = $user->cabang;
            if ($cabangs && $cabangs->isNotEmpty()) {
                $inRadius = false;
                foreach ($cabangs as $cabang) {
                    $jarak = $this->calculateDistance(
                        $request->lat,
                        $request->long,
                        $cabang->latitude,
                        $cabang->longitude
                    );
                    if ($jarak <= $cabang->radius) {
                        $inRadius = true;
                        break;
                    }
                }
                if (!$inRadius) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Lokasi Anda di luar radius cabang yang ditentukan.',
                    ], 422);
                }
            }
        }

        $absen = AbsensiSensei::where('user_id', $user->id)
            ->where('kelas_sensei_id', $request->kelas_id)
            ->where('tanggal', $today)
            ->first();

        if (!$absen) {
            return response()->json([
                'success' => false,
                'message' => 'Anda belum absen masuk hari ini',
            ]);
        }

        if ($absen->jam_keluar) {
            return response()->json([
                'success' => false,
                'message' => 'Anda sudah absen pulang hari ini',
            ]);
        }

        // Tentukan jam pulang dari shift
        $shifts = $user->shifts;
        $jamPulangShift = '17:00:00';
        $jamMasukShift = '09:00:00';
        if ($shifts && $shifts->isNotEmpty()) {
            $defaultShift = $shifts->first();
            $jamPulangShift = $defaultShift->jam_pulang;
            $jamMasukShift = $defaultShift->jam_masuk;
        }

        $jamPulangParse = \Carbon\Carbon::parse($jamPulangShift);
        $jamMasukParse = \Carbon\Carbon::parse($jamMasukShift);

        // Handle shift malam
        if ($jamPulangParse->lt($jamMasukParse)) {
            $jamPulangParse->addDay();
        }

        // Batas akhir = jam pulang + 7 jam
        $batasAkhir = $jamPulangParse->copy()->addHours(7);

        $fotoPath = $absen->foto_pulang;
        if ($request->foto) {
            $fotoPath = AbsensiSensei::savePhoto($request->foto, 'pulang');
        }

        if ($now->greaterThan($batasAkhir)) {
            $absen->update([
                'jam_keluar' => $now->toTimeString(),
                'foto_pulang' => $fotoPath,
                'lat_pulang' => $request->lat,
                'long_pulang' => $request->long,
                'status' => 'TIDAK ABSEN PULANG',
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Waktu habis. Anda dianggap TIDAK ABSEN PULANG.',
            ], 400);
        }

        // Status: jika pulang sebelum jam shift dan bukan TERLAMBAT -> PULANG LEBIH AWAL
        $statusBaru = $absen->status;
        if ($now->lt($jamPulangParse) && $absen->status !== 'TERLAMBAT') {
            $statusBaru = 'PULANG LEBIH AWAL';
        }

        $absen->update([
            'jam_keluar' => $now->toTimeString(),
            'foto_pulang' => $fotoPath,
            'lat_pulang' => $request->lat,
            'long_pulang' => $request->long,
            'status' => $statusBaru,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Absen pulang berhasil. Status: ' . $statusBaru,
            'data' => $absen,
            'status' => $statusBaru,
        ]);
    }

    private function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) * sin($dLat / 2) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) * sin($dLon / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    public function dataSiswa($kelasId)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $kelas = KelasSensei::with('batchRelasi')
            ->where('user_id', $user->id)
            ->findOrFail($kelasId);

        $siswa = Siswa::where('batch_id', $kelas->batch_id)
            ->where('status', 'AKTIF')
            ->orderBy('nama')
            ->get(['id', 'nama', 'level']);

        $startDate = Carbon::parse($kelas->tanggal_mulai);
        $endDate = Carbon::parse($kelas->tanggal_selesai);

        $dates = [];
        $current = $startDate->copy();
        while ($current->lte($endDate)) {
            $dates[] = $current->format('Y-m-d');
            $current->addDay();
        }

        $siswaIds = $siswa->pluck('id');
        $absensiRecords = AbsensiSiswa::whereIn('siswa_id', $siswaIds)
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->get(['siswa_id', 'tanggal', 'status']);

        $absensiMap = [];
        foreach ($absensiRecords as $a) {
            $absensiMap[$a->siswa_id][$a->tanggal->format('Y-m-d')] = $a->status;
        }

        $result = $siswa->map(function ($s) use ($absensiMap, $kelas) {
            return [
                'id' => $s->id,
                'nama' => $s->nama,
                'level' => $s->level ?: $kelas->level,
                'absensi' => $absensiMap[$s->id] ?? [],
            ];
        });

        return response()->json([
            'kelas' => $kelas,
            'siswa' => $result,
            'dates' => $dates,
        ]);
    }

    public function penilaianHarian($kelasId)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $kelas = KelasSensei::with('batchRelasi')
            ->where('user_id', $user->id)
            ->findOrFail($kelasId);

        $siswaList = Siswa::where('batch_id', $kelas->batch_id)
            ->where('status', 'AKTIF')
            ->orderBy('nama')
            ->get(['id', 'nama', 'level']);

        $startDate = Carbon::parse($kelas->tanggal_mulai);
        $endDate = Carbon::parse($kelas->tanggal_selesai);

        $dates = [];
        $current = $startDate->copy();
        while ($current->lte($endDate)) {
            $dates[] = $current->format('Y-m-d');
            $current->addDay();
        }

        $siswaIds = $siswaList->pluck('id');
        $statusRecords = DailyAssessmentStatus::whereIn('siswa_id', $siswaIds)
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->get(['siswa_id', 'tanggal', 'is_terisi', 'user_id', 'catatan']);

        $statusMap = [];
        foreach ($statusRecords as $r) {
            $key = $r->siswa_id . '_' . $r->tanggal->format('Y-m-d');
            $statusMap[$key] = [
                'is_terisi' => $r->is_terisi,
                'catatan' => $r->catatan,
            ];
        }

        $siswaResult = $siswaList->map(function ($s) use ($statusMap, $dates, $kelas) {
            $dailyStatus = [];
            foreach ($dates as $d) {
                $key = $s->id . '_' . $d;
                $dailyStatus[$d] = $statusMap[$key] ?? ['is_terisi' => false, 'catatan' => null];
            }
            return [
                'id' => $s->id,
                'nama' => $s->nama,
                'level' => $s->level ?: $kelas->level,
                'daily_status' => $dailyStatus,
            ];
        });

        return response()->json([
            'kelas' => $kelas,
            'siswa' => $siswaResult,
            'dates' => $dates,
        ]);
    }

    public function simpanPenilaianHarian(Request $request)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $request->validate([
            'siswa_id' => 'required|exists:siswas,id',
            'kelas_sensei_id' => 'required|exists:kelas_sensei,id',
            'tanggal' => 'required|date',
            'is_terisi' => 'required|boolean',
            'catatan' => 'nullable|string',
        ]);

        $kelas = KelasSensei::findOrFail($request->kelas_sensei_id);
        if ($kelas->user_id !== $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $status = DailyAssessmentStatus::updateOrCreate(
            [
                'siswa_id' => $request->siswa_id,
                'tanggal' => $request->tanggal,
            ],
            [
                'kelas_sensei_id' => $request->kelas_sensei_id,
                'is_terisi' => $request->is_terisi,
                'user_id' => $user->id,
                'catatan' => $request->catatan,
            ]
        );

        $siswa = Siswa::find($request->siswa_id);

        // Also sync with student_assessments if needed
        if ($request->is_terisi && $request->filled('scores')) {
            $batchId = $kelas->batch_id;
            foreach ($request->scores as $score) {
                \App\Models\StudentAssessment::updateOrCreate(
                    [
                        'component_id' => $score['component_id'],
                        'siswa_id' => $request->siswa_id,
                        'batch_id' => $batchId,
                        'tanggal' => $request->tanggal,
                    ],
                    [
                        'user_id' => $user->id,
                        'nilai' => $score['nilai'] ?? null,
                    ]
                );
            }
        }

        return response()->json([
            'success' => true,
            'message' => $request->is_terisi ? 'Penilaian terisi' : 'Penilaian dikosongkan',
            'data' => $status,
        ]);
    }

    public function profile()
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $guru = Guru::where('user_id', $user->id)->first();

        $totalKelas = KelasSensei::where('user_id', $user->id)->count();

        return response()->json([
            'guru' => $guru,
            'user' => $user,
            'total_kelas' => $totalKelas,
        ]);
    }
}
