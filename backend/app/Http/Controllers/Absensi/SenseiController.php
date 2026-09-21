<?php

namespace App\Http\Controllers\Absensi;

use App\Models\AbsensiSensei;
use App\Models\HariLibur;
use App\Models\JadwalLevel;
use App\Models\KelasSensei;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SenseiController extends Controller
{
    public function index()
    {
        return redirect()->route('absensi.index');
    }

    public function storeKelas(Request $request)
    {
        $request->validate([
            'batch_id' => 'required|exists:batches,id',
            'level' => 'required|integer|min:1|max:4',
            'tanggal_mulai' => 'nullable|date',
            'tanggal_selesai' => 'nullable|date|after_or_equal:tanggal_mulai',
            'catatan' => 'nullable|string',
        ]);

        // Ambil tanggal dari admin (jadwal_level) jika ada
        $jadwal = JadwalLevel::where('batch_id', $request->batch_id)
            ->where('level', $request->level)
            ->first();

        $tanggalMulai = $request->tanggal_mulai ?: ($jadwal ? $jadwal->tanggal_mulai->toDateString() : now()->toDateString());
        $tanggalSelesai = $request->tanggal_selesai ?: ($jadwal ? $jadwal->tanggal_selesai->toDateString() : now()->toDateString());

        $batch = \App\Models\Batch::findOrFail($request->batch_id);
        $namaKelas = $batch->nama_batch;

        $kelas = KelasSensei::create([
            'user_id' => Auth::id(),
            'batch_id' => $request->batch_id,
            'nama_kelas' => $namaKelas,
            'level' => $request->level,
            'tanggal_mulai' => $tanggalMulai,
            'tanggal_selesai' => $tanggalSelesai,
            'catatan' => $request->catatan,
            'status' => 'aktif',
        ]);

        // Update kelas siswa yang cocok dengan batch + level ini
        $kelasModel = \App\Models\Kelas::firstOrCreate(
            ['nama_kelas' => $namaKelas],
            ['status' => 'AKTIF']
        );

        \App\Models\Siswa::where('batch_id', $request->batch_id)
            ->where('level', $request->level)
            ->update([
                'kelas_id' => $kelasModel->id,
                'kelas' => $kelasModel->nama_kelas,
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Kelas berhasil dibuat',
            'data' => $kelas,
        ]);
    }

    public function getKelasAktif()
    {
        $user = Auth::user();
        $today = now()->toDateString();

        $kelasAktif = KelasSensei::where('user_id', $user->id)
            ->where('status', 'aktif')
            ->whereDate('tanggal_mulai', '<=', $today)
            ->whereDate('tanggal_selesai', '>=', $today)
            ->with(['absensi' => function ($q) use ($today) {
                $q->where('tanggal', $today);
            }])
            ->get();

        return response()->json($kelasAktif)->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    public function absenMasuk(Request $request)
    {
        $request->validate([
            'kelas_sensei_id' => 'required|exists:kelas_sensei,id',
            'latitude' => 'required',
            'longitude' => 'required',
        ]);

        $user = Auth::user();
        $today = now()->toDateString();
        $now = now();

        // Cek apakah hari ini libur
        if (HariLibur::apakahLibur($today)) {
            return response()->json([
                'success' => false,
                'message' => 'Hari ini adalah hari libur. Absensi tidak dibuka.',
            ], 403);
        }

        // Validasi geolokasi - ambil cabang user
        $cabangs = $user->cabang;
        $cabang = $cabangs && $cabangs->isNotEmpty() ? $cabangs->first() : null;

        if (! $cabang) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki cabang penempatan.',
            ], 422);
        }

        // Hitung jarak
        $jarak = $this->calculateDistance(
            $request->latitude,
            $request->longitude,
            $cabang->latitude,
            $cabang->longitude
        );

        if ($jarak > $cabang->radius) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal! Jarak Anda '.round($jarak).'m. Di luar radius '.$cabang->radius.'m.',
            ], 422);
        }

        // Tentukan shift yang sedang aktif (harus sesuai jadwal shift user)
        $service = app(\App\Services\ShiftResolutionService::class);
        $shift = $service->resolveActiveShift($user, $now, $today);

        if ($shift && $shift->status === 'NONAKTIF') {
            return response()->json([
                'success' => false,
                'message' => 'Shift Anda sedang dinonaktifkan. Absensi tidak dapat dilakukan.',
            ], 403);
        }

        $jamMasukShift = '09:00:00';
        $toleransi = 0;
        $shiftId = $shift->id ?? null;

        if ($shift) {
            $jamMasukShift = $shift->jam_masuk;
            $toleransi = $shift->toleransi ?? 0;
        } elseif ($user->shifts->isEmpty()) {
            // Tanpa shift sama sekali → gunakan default lama
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada shift yang aktif pada jam ini. Absen masuk tidak dapat dilakukan.',
            ], 422);
        }

        // Logika status
        $jamMasukParse = \Carbon\Carbon::parse($jamMasukShift);
        $batasToleransi = $jamMasukParse->copy()->addMinutes($toleransi);
        $status = $now->gt($batasToleransi) ? 'TERLAMBAT' : 'HADIR';

        $kelas = KelasSensei::where('id', $request->kelas_sensei_id)
            ->where('user_id', $user->id)
            ->where('status', 'aktif')
            ->whereDate('tanggal_mulai', '<=', $today)
            ->whereDate('tanggal_selesai', '>=', $today)
            ->first();

        if (! $kelas) {
            return response()->json([
                'success' => false,
                'message' => 'Kelas tidak ditemukan atau sudah tidak aktif',
            ], 404);
        }

        $sudahAbsen = AbsensiSensei::where('kelas_sensei_id', $kelas->id)
            ->where('user_id', $user->id)
            ->where('tanggal', $today)
            ->exists();

        if ($sudahAbsen) {
            return response()->json([
                'success' => false,
                'message' => 'Anda sudah absen masuk untuk kelas ini hari ini',
            ], 400);
        }

        // Simpan foto jika ada
        $fotoPath = null;
        if ($request->has('photo') && $request->photo) {
            $fotoPath = AbsensiSensei::savePhoto($request->photo, 'masuk');
        }

        $absensi = AbsensiSensei::create([
            'kelas_sensei_id' => $kelas->id,
            'user_id' => $user->id,
            'shift_id' => $shiftId,
            'tanggal' => $today,
            'jam_masuk' => $now->toTimeString(),
            'lat_masuk' => $request->latitude,
            'long_masuk' => $request->longitude,
            'foto_masuk' => $fotoPath,
            'status' => $status,
            'catatan' => $request->keterangan,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Absen masuk berhasil. Status: '.$status,
            'data' => $absensi,
            'status' => $status,
        ]);
    }

    public function absenPulang(Request $request)
    {
        $request->validate([
            'kelas_sensei_id' => 'required|exists:kelas_sensei,id',
            'latitude' => 'required',
            'longitude' => 'required',
        ]);

        $user = Auth::user();
        $today = now()->toDateString();
        $now = now();

        // Validasi geolokasi - ambil cabang user
        $cabangs = $user->cabang;
        $cabang = $cabangs && $cabangs->isNotEmpty() ? $cabangs->first() : null;

        if (! $cabang) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki cabang penempatan.',
            ], 422);
        }

        // Hitung jarak
        $jarak = $this->calculateDistance(
            $request->latitude,
            $request->longitude,
            $cabang->latitude,
            $cabang->longitude
        );

        if ($jarak > $cabang->radius) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal! Jarak Anda '.round($jarak).'m. Di luar radius '.$cabang->radius.'m.',
            ], 422);
        }

        $absensi = AbsensiSensei::where('kelas_sensei_id', $request->kelas_sensei_id)
            ->where('user_id', $user->id)
            ->where('tanggal', $today)
            ->first();

        if (! $absensi) {
            return response()->json([
                'success' => false,
                'message' => 'Anda belum absen masuk untuk kelas ini',
            ], 400);
        }

        if ($absensi->jam_keluar) {
            return response()->json([
                'success' => false,
                'message' => 'Anda sudah absen pulang untuk kelas ini',
            ], 400);
        }

        // Tentukan jam pulang dari shift yang TERKUNCI saat absen masuk
        $jamPulangParse = null;
        $jamMasukParse = null;

        if ($absensi->shift) {
            [, $jamPulangParse] = app(\App\Services\ShiftResolutionService::class)
                ->window($absensi->shift, \Carbon\Carbon::parse($absensi->tanggal));
        } elseif ($user->shifts->isNotEmpty()) {
            $jamPulangParse = \Carbon\Carbon::parse($user->shifts->first()->jam_pulang);
            $jamMasukParse = \Carbon\Carbon::parse($user->shifts->first()->jam_masuk);

            // Handle shift malam
            if ($jamPulangParse->lt($jamMasukParse)) {
                $jamPulangParse->addDay();
            }
        }

        // Tanpa shift sama sekali → default lama
        if (! $jamPulangParse) {
            $jamPulangParse = \Carbon\Carbon::parse('17:00:00');
        }

        // Batas akhir = jam pulang + 7 jam
        $batasAkhir = $jamPulangParse->copy()->addHours(7);

        // Simpan foto jika ada
        $fotoPath = null;
        if ($request->has('photo') && $request->photo) {
            $fotoPath = AbsensiSensei::savePhoto($request->photo, 'pulang');
        }

        if ($now->greaterThan($batasAkhir)) {
            $absensi->update([
                'jam_keluar' => $now->toTimeString(),
                'lat_pulang' => $request->latitude,
                'long_pulang' => $request->longitude,
                'foto_pulang' => $fotoPath,
                'status' => 'TIDAK ABSEN PULANG',
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Waktu habis. Anda dianggap TIDAK ABSEN PULANG.',
            ], 400);
        }

        // Status: jika pulang sebelum jam shift dan bukan TERLAMBAT → PULANG LEBIH AWAL
        $statusBaru = $absensi->status;
        if ($now->lt($jamPulangParse) && $absensi->status !== 'TERLAMBAT') {
            $statusBaru = 'PULANG LEBIH AWAL';
        }

        $absensi->update([
            'jam_keluar' => $now->toTimeString(),
            'lat_pulang' => $request->latitude,
            'long_pulang' => $request->longitude,
            'foto_pulang' => $fotoPath,
            'status' => $statusBaru,
            'catatan' => $request->keterangan,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Absen pulang berhasil. Status: '.$statusBaru,
            'data' => $absensi,
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

    public function getJadwalLevel(Request $request)
    {
        $request->validate([
            'batch_id' => 'required|exists:batches,id',
            'level' => 'required|integer|min:1|max:4',
        ]);

        $jadwal = JadwalLevel::where('batch_id', $request->batch_id)
            ->where('level', $request->level)
            ->first();

        return response()->json($jadwal);
    }

    public function destroy($id)
    {
        $kelas = KelasSensei::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (! $kelas) {
            return response()->json([
                'success' => false,
                'message' => 'Kelas tidak ditemukan',
            ], 404);
        }

        $kelas->update(['status' => 'dibatalkan']);

        return response()->json([
            'success' => true,
            'message' => 'Kelas berhasil dibatalkan',
        ]);
    }
}
