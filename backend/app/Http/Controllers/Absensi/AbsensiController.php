<?php

namespace App\Http\Controllers\Absensi;

use App\Models\Absensi;
use App\Models\AbsensiKhusus;
use App\Models\AbsensiSensei;
use App\Models\Agenda;
use App\Models\Cabang;
use App\Models\HariLibur;
use App\Models\Karyawan;
use App\Models\KelasSensei;
use App\Models\Shift;
use App\Models\ShiftJadwal;
use App\Models\User;
use App\Services\WhatsAppService;
use Carbon\Carbon;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class AbsensiController extends Controller
{
    // public function ayo(){
    //   return view('absensi.ayo');
    // }

    public function index()
    {
        $user = Auth::user();
        $isSiswa = $user->isSiswa();
        $isGuru = $user->isGuru();

        $user = $user->load(['shift', 'siswa.shift']);

        $cabangs = $user->cabang;

        $cabangTerpilih = null;
        $pesanErrorCabang = null;

        if ($cabangs && $cabangs->isNotEmpty()) {
            $cabangTerpilih = $cabangs->first();
        } else {
            $pesanErrorCabang = 'Anda belum terdaftar di cabang manapun. Fitur absensi dinonaktifkan.';
        }

        $riwayat = collect();
        $riwayatSensei = collect();
        $allShifts = collect();
        $showNotification = false;
        $notifMessage = '';

        if (!$isSiswa) {
            $riwayat = Absensi::with('shift')
                ->where('user_id', $user->id)
                ->orderBy('tanggal', 'desc')
                ->orderBy('shift_id', 'desc')
                ->take(10)
                ->get();

            $riwayatSensei = AbsensiSensei::where('user_id', $user->id)
                ->with('kelasSensei')
                ->orderBy('tanggal', 'desc')
                ->take(10)
                ->get();

            $allShifts = \App\Models\Shift::where('status', 'AKTIF')->get();

            if ($user->shift_id && $user->shift) {
                $now = \Illuminate\Support\Carbon::now();
                $today = \Illuminate\Support\Carbon::today()->toDateString();

                $jamHanya = \Illuminate\Support\Carbon::parse($user->shift->jam_masuk)->format('H:i:s');
                $jamMasuk = \Illuminate\Support\Carbon::parse($today.' '.$jamHanya);

                $sudahAbsen = Absensi::where('user_id', $user->id)
                    ->where('tanggal', $today)
                    ->exists();

                if (! $sudahAbsen) {
                    $selisihMenit = $now->diffInMinutes($jamMasuk, false);
                    if ($selisihMenit > 0 && $selisihMenit <= 30) {
                        $showNotification = true;
                        $notifMessage = 'Waktunya bersiap! Jam masuk Anda pukul '.$jamMasuk->format('H:i').' ('.$selisihMenit.' menit lagi).';
                    }
                }
            }
        }

        $currentTime = now()->format('H:i:s');
        $currentShift = \App\Models\Shift::where('status', 'AKTIF')
            ->where('jam_masuk', '<=', $currentTime)
            ->where('jam_pulang', '>=', $currentTime)
            ->first();

        $userShifts = collect();
        $shiftMode = \App\Models\PengaturanShift::getMode();

        if ($shiftMode === 'fixed') {
            if ($user->shift_ids && is_array($user->shift_ids) && count($user->shift_ids) > 0) {
                $userShifts = \App\Models\Shift::whereIn('id', $user->shift_ids)->get();
            } elseif ($user->shift) {
                $userShifts = collect([$user->shift]);
            }
        } else {
            $todayDate = now()->toDateString();
            $shiftJadwals = ShiftJadwal::where('user_id', $user->id)
                ->where('tanggal', $todayDate)
                ->with('shift')
                ->get();
            if ($shiftJadwals->isNotEmpty()) {
                $userShifts = $shiftJadwals->pluck('shift')->filter();
            }

            if ($userShifts->isEmpty()) {
                if ($user->shift_ids && is_array($user->shift_ids) && count($user->shift_ids) > 0) {
                    $userShifts = \App\Models\Shift::whereIn('id', $user->shift_ids)->get();
                } elseif ($user->shift) {
                    $userShifts = collect([$user->shift]);
                }
            }
        }

        $siswaKelasSensei = collect();
        $siswaRecord = null;
        $riwayatAbsensiSiswa = collect();
        if ($isSiswa) {
            $siswaRecord = \App\Models\Siswa::with('shift', 'kelasRelasi', 'batchRelasi')
                ->where('user_id', $user->id)
                ->first();
            if (!$siswaRecord) {
                $siswaRecord = \App\Models\Siswa::with('shift', 'kelasRelasi', 'batchRelasi')
                    ->where('nama', $user->name)
                    ->first();
            }
            if ($siswaRecord) {
                $batchId = $siswaRecord->batch_id;
                if (!$batchId && $siswaRecord->batch) {
                    $batch = \App\Models\Batch::where('nama_batch', $siswaRecord->batch)->first();
                    $batchId = $batch->id ?? null;
                }
                if ($batchId) {
                    $siswaKelasSensei = KelasSensei::with('user', 'batchRelasi')
                        ->where('batch_id', $batchId)
                        ->where('status', 'aktif')
                        ->get();
                }
                if ($siswaRecord->shift) {
                    $userShifts = collect([$siswaRecord->shift]);
                } elseif ($siswaRecord->shift_id) {
                    $shift = \App\Models\Shift::find($siswaRecord->shift_id);
                    if ($shift) {
                        $userShifts = collect([$shift]);
                    }
                }

                $riwayatAbsensiSiswa = \App\Models\AbsensiSiswa::with('cabang')
                    ->where('siswa_id', $siswaRecord->id)
                    ->orderBy('tanggal', 'desc')
                    ->take(10)
                    ->get();
            }
        }

        if (!$currentShift && $userShifts->count() > 0) {
            foreach ($userShifts as $shift) {
                $toleransi = $shift->toleransi ?? 0;
                $jamMulaiAbsen = Carbon::parse($shift->jam_masuk)->subMinutes($toleransi)->format('H:i:s');
                $jamPulang = $shift->jam_pulang instanceof Carbon
                    ? $shift->jam_pulang->format('H:i:s')
                    : Carbon::parse($shift->jam_pulang)->format('H:i:s');
                if ($jamMulaiAbsen <= $currentTime && $jamPulang >= $currentTime) {
                    $currentShift = $shift;
                    break;
                }
            }
        }

        $kelasSenseiAktif = collect();
        $hasUnabsensedSensei = false;
        $isLibur = false;
        $agendaHariIni = collect();
        $riwayatAgenda = collect();
        $shiftJadwalKalender = collect();

        if ($isGuru) {
            $today = now()->toDateString();
            $kelasSenseiAktif = KelasSensei::where('user_id', $user->id)
                ->where('status', 'aktif')
                ->whereDate('tanggal_mulai', '<=', $today)
                ->whereDate('tanggal_selesai', '>=', $today)
                ->with(['absensi' => function ($q) use ($today) {
                    $q->where('tanggal', $today);
                }])
                ->get();

            foreach ($kelasSenseiAktif as $kelas) {
                $absensiHariIni = $kelas->absensi->first();
                if (!$absensiHariIni || !$absensiHariIni->jam_masuk) {
                    $hasUnabsensedSensei = true;
                    break;
                }
            }

            $isLibur = HariLibur::apakahLibur($today);

            $agendaHariIni = \App\Models\Agenda::where('user_id', $user->id)
                ->where('tanggal', $today)
                ->orderBy('jam_mulai', 'asc')
                ->get();


            $bulanIni = now()->month;
            $tahunIni = now()->year;
            $shiftJadwalKalender = ShiftJadwal::where('user_id', $user->id)
                ->whereMonth('tanggal', $bulanIni)
                ->whereYear('tanggal', $tahunIni)
                ->with('shift')
                ->get()
                ->groupBy(function ($item) {
                    return $item->tanggal->toDateString();
                });
        }

        if (!$isSiswa) {
            $riwayatAgenda = \App\Models\Agenda::where('user_id', $user->id)
                ->whereNotNull('jam_absen_masuk')
                ->orderBy('tanggal', 'desc')
                ->limit(10)
                ->get();
        }

        return view('absensi.index', [
            'isSiswa' => $isSiswa,
            'isGuru' => $isGuru,
            'siswaKelasSensei' => $siswaKelasSensei,
            'siswaRecord' => $siswaRecord,
            'riwayatAbsensiSiswa' => $riwayatAbsensiSiswa,
            'riwayat' => $riwayat,
            'riwayatSensei' => $riwayatSensei,
            'shifts' => $allShifts,
            'userShifts' => $userShifts ?? collect(),
            'currentShift' => $currentShift,
            'kelasSenseiAktif' => $kelasSenseiAktif,
            'hasUnabsensedSensei' => $hasUnabsensedSensei,
            'isLibur' => $isLibur,
            'agendaHariIni' => $agendaHariIni,
            'riwayatAgenda' => $riwayatAgenda,
            'shiftJadwalKalender' => $shiftJadwalKalender,

            // Data Geofencing (Aman meski $cabangTerpilih null karena menggunakan null coalescing ??)
            'cabangLat' => $cabangTerpilih->latitude ?? 0,
            'cabangLong' => $cabangTerpilih->longitude ?? 0,
            'radiusMeter' => $cabangTerpilih->radius ?? 0, // Set 0 agar radius tidak terbentuk jika tak ada cabang
            'namaCabang' => $cabangTerpilih->nama_cabang ?? 'Belum Ditentukan',

            // Data Tambahan
            'showNotification' => $showNotification,
            'notifMessage' => $notifMessage,
            'pesanErrorCabang' => $pesanErrorCabang, // Lempar pesan ini ke view
            'batchList' => \App\Models\Batch::aktif()->get(),
            'levels' => [1, 2, 3, 4],
        ]);
    }

    // =============================================
    // ABSENSI KHUSUS (timer with pause/resume)
    // =============================================

    public function khususIndex()
    {
        $user = Auth::user();
        if (!$user->can_access_khusus) {
            return redirect()->route('absensi.index')->with('error', 'Anda tidak memiliki akses ke fitur absen khusus');
        }
        $riwayat = AbsensiKhusus::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get();

        return view('absensi.khusus.index', compact('riwayat'));
    }

    public function absenKhususStatus()
    {
        $user = Auth::user();
        if (!$user->can_access_khusus) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }
        $today = now()->toDateString();

        $session = AbsensiKhusus::where('user_id', $user->id)
            ->where('tanggal', $today)
            ->whereIn('status', ['BERJALAN', 'DITUNDA'])
            ->first();

        return response()->json([
            'success' => true,
            'data' => $session ? [
                'id' => $session->id,
                'status' => $session->status,
                'total_detik' => $session->total_detik,
                'jam_masuk' => $session->jam_masuk->format('H:i:s'),
            ] : null,
        ]);
    }

    public function absenKhususMulai(Request $request)
    {
        $user = Auth::user();
        if (!$user->can_access_khusus) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }
        $today = now()->toDateString();
        $now = now();

        $request->validate([
            'photo' => 'required',
            'latitude' => 'required',
            'longitude' => 'required',
        ]);

        $existing = AbsensiKhusus::where('user_id', $user->id)
            ->where('tanggal', $today)
            ->whereIn('status', ['BERJALAN', 'DITUNDA'])
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Anda masih memiliki sesi absen khusus yang aktif'], 422);
        }

        $photo = $this->saveBase64Photo($request->photo, 'khusus_masuk');

        $session = AbsensiKhusus::create([
            'user_id' => $user->id,
            'tanggal' => $today,
            'jam_masuk' => $now,
            'total_detik' => 0,
            'status' => 'BERJALAN',
            'foto_masuk' => $photo,
            'latitude_masuk' => $request->latitude,
            'longitude_masuk' => $request->longitude,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Absen khusus dimulai',
            'data' => [
                'id' => $session->id,
                'jam_masuk' => $session->jam_masuk->format('H:i:s'),
            ],
        ]);
    }

    public function absenKhususPause(Request $request)
    {
        $user = Auth::user();
        if (!$user->can_access_khusus) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }
        $today = now()->toDateString();
        $now = now();

        $session = AbsensiKhusus::where('user_id', $user->id)
            ->where('tanggal', $today)
            ->where('status', 'BERJALAN')
            ->first();

        if (!$session) {
            return response()->json(['message' => 'Tidak ada sesi berjalan'], 422);
        }

        if ($session->total_detik > 0) {
            return response()->json(['message' => 'Anda hanya bisa menjeda satu kali dalam satu sesi'], 422);
        }

        $elapsed = $session->jam_masuk->diffInSeconds($now);
        $session->total_detik += $elapsed;
        $session->status = 'DITUNDA';
        $session->save();

        return response()->json([
            'success' => true,
            'message' => 'Timer dijeda',
            'total_detik' => $session->total_detik,
        ]);
    }

    public function absenKhususLanjut(Request $request)
    {
        $user = Auth::user();
        if (!$user->can_access_khusus) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }
        $today = now()->toDateString();
        $now = now();

        $session = AbsensiKhusus::where('user_id', $user->id)
            ->where('tanggal', $today)
            ->whereIn('status', ['BERJALAN', 'DITUNDA'])
            ->first();

        if (!$session) {
            return response()->json(['message' => 'Tidak ada sesi aktif'], 422);
        }

        $session->jam_masuk = $now;
        $session->status = 'BERJALAN';
        $session->save();

        return response()->json([
            'success' => true,
            'message' => 'Timer dilanjutkan',
            'total_detik' => $session->total_detik,
            'jam_masuk' => $session->jam_masuk->format('H:i:s'),
        ]);
    }

    public function absenKhususSelesai(Request $request)
    {
        $user = Auth::user();
        if (!$user->can_access_khusus) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }
        $today = now()->toDateString();
        $now = now();

        $request->validate([
            'photo' => 'required',
            'latitude' => 'required',
            'longitude' => 'required',
        ]);

        $session = AbsensiKhusus::where('user_id', $user->id)
            ->where('tanggal', $today)
            ->where('status', 'BERJALAN')
            ->first();

        if (!$session) {
            return response()->json(['message' => 'Tidak ada sesi berjalan'], 422);
        }

        $elapsed = $session->jam_masuk->diffInSeconds($now);
        $session->total_detik += $elapsed;
        $session->jam_keluar = $now;
        $session->status = 'SELESAI';
        $session->foto_keluar = $this->saveBase64Photo($request->photo, 'khusus_keluar');
        $session->latitude_keluar = $request->latitude;
        $session->longitude_keluar = $request->longitude;
        $session->save();

        $hours = floor($session->total_detik / 3600);
        $minutes = floor(($session->total_detik % 3600) / 60);
        $detik = $session->total_detik % 60;

        return response()->json([
            'success' => true,
            'message' => "Absen khusus selesai! Total: {$hours} jam {$minutes} menit {$detik} detik",
            'total_detik' => $session->total_detik,
        ]);
    }

    public function riwayatTerbaru()
    {
        $riwayat = Absensi::where('user_id', Auth::id())
            ->orderBy('tanggal', 'desc')
            ->take(5)
            ->get();

        return response()->json($riwayat);
    }

    public function riwayatSemua()
    {
        // Ambil semua absensi beserta relasi karyawan
        $absensi = Absensi::with('user')->orderBy('tanggal', 'desc')->get();

        return view('absensi.riwayat', compact('absensi'));
    }

    public function profile()
    {
        $user = Auth::user()->load(['divisi']);
        $isSiswa = $user->isSiswa();

        if ($isSiswa && $user->siswa) {
            $siswa = $user->siswa;
            $siswaAbsensi = \App\Models\AbsensiSiswa::where('siswa_id', $siswa->id)
                ->whereMonth('tanggal', now()->month);
            $stats = [
                'hadir' => (clone $siswaAbsensi)->where('status', 'HADIR')->count(),
                'izin' => (clone $siswaAbsensi)->where('status', 'IZIN')->count(),
                'terlambat' => (clone $siswaAbsensi)->where('status', 'TERLAMBAT')->count(),
            ];
        } else {
            $stats = [
                'hadir' => \App\Models\Absensi::where('user_id', $user->id)->whereMonth('tanggal', now()->month)->where('status', 'HADIR')->count(),
                'izin' => \App\Models\Absensi::where('user_id', $user->id)->whereMonth('tanggal', now()->month)->where('status', 'IZIN')->count(),
                'terlambat' => \App\Models\Absensi::where('user_id', $user->id)->whereMonth('tanggal', now()->month)->where('status', 'TERLAMBAT')->count(),
            ];
        }

        return view('absensi.profile', compact('user', 'stats', 'isSiswa'));
    }

    public function scanQr()
    {
        return view('absensi.scan_qr');
    }

    public function prosesScan(Request $request)
    {
        $request->validate([
            'barcode' => 'required|string',
        ]);

        $user = Auth::user();

        if (!$user->isSiswa()) {
            return response()->json(['message' => 'Hanya siswa yang dapat absen via QR'], 403);
        }

        $cabang = Cabang::where('barcode', $request->barcode)->first();

        if (!$cabang) {
            return response()->json(['message' => 'QR Code tidak dikenal'], 404);
        }

        $siswa = $user->siswa;

        if (!$siswa) {
            return response()->json(['message' => 'Data siswa tidak ditemukan'], 404);
        }

        $today = now()->toDateString();
        $now = now()->format('H:i:s');

        $existing = \App\Models\AbsensiSiswa::where('siswa_id', $siswa->id)
            ->where('tanggal', $today)
            ->first();

        if ($existing) {
            if ($existing->jam_masuk && !$existing->jam_keluar) {
                $existing->update([
                    'jam_keluar' => $now,
                ]);

                return response()->json([
                    'message' => 'Absensi pulang berhasil',
                    'cabang' => $cabang->nama_cabang,
                    'jam' => 'Pulang: ' . $now,
                    'status' => 'pulang',
                ]);
            }

            return response()->json([
                'message' => 'Anda sudah absen hari ini',
                'cabang' => $cabang->nama_cabang,
                'jam' => 'Masuk: ' . $existing->jam_masuk . ' | Pulang: ' . ($existing->jam_keluar ?? '-'),
            ], 422);
        }

        $shiftSiswa = $siswa->shift;
        $status = 'HADIR';
        if ($shiftSiswa) {
            $batasTerlambat = Carbon::parse($shiftSiswa->jam_masuk)->addMinutes($shiftSiswa->toleransi ?? 15);
            $jamSekarang = Carbon::parse($now);
            if ($jamSekarang->gt($batasTerlambat)) {
                $status = 'TERLAMBAT';
            }
        }

        $absensi = \App\Models\AbsensiSiswa::create([
            'siswa_id' => $siswa->id,
            'cabang_id' => $cabang->id,
            'tanggal' => $today,
            'jam_masuk' => $now,
            'status' => $status,
        ]);

        return response()->json([
            'message' => 'Absensi berhasil',
            'cabang' => $cabang->nama_cabang,
            'jam' => 'Masuk: ' . $now,
            'status' => $status,
        ]);
    }

    public function absenMasuk(Request $request)
    {
        $today = Carbon::today()->toDateString();
        $now = Carbon::now();

        // --- VALIDASI HARI LIBUR ---
        if (HariLibur::apakahLibur($today)) {
            return response()->json([
                'message' => 'Hari ini adalah hari libur (Weekend/Nasional). Absensi tidak dibuka.',
            ], 403);
        }

        // 0. Validasi input embedding wajah
        if (! $request->has('face_embedding')) {
            return response()->json(['message' => 'Face embedding diperlukan untuk absen'], 422);
        }

        $faceEmbeddingInput = json_decode($request->face_embedding);

        // 1. Cocokkan wajah
        $user = $this->cocokkanFaceEmbedding($faceEmbeddingInput);
        if (! $user) {
            return response()->json(['message' => 'Wajah tidak terdaftar atau tidak dikenali'], 422);
        }

// 3. Ambil cabang & shift
        $cabang = null;
        if ($user->cabang_ids && is_array($user->cabang_ids) && count($user->cabang_ids) > 0) {
            $cabang = Campus::find($user->cabang_ids[0]);
        }
        
        if (!$cabang) {
            $cabang = Campus::find($user->cabang_id);
        }
        
        if (!$cabang) {
            return response()->json(['message' => 'Cabang tidak ditemukan'], 422);
        }

        $shift = $this->resolveShiftForUser($user, $now, $today);

        if (!$shift) {
            return response()->json(['message' => 'Tidak ada shift yang aktif saat ini'], 422);
        }

        if ($shift->status === 'NONAKTIF') {
            return response()->json(['message' => 'Shift Anda saat ini sedang dinonaktifkan. Tidak dapat melakukan absensi.'], 403);
        }

        // 4. Cek apakah sudah absen masuk untuk shift ini
        $sudahAbsen = Absensi::where('user_id', $user->id)
            ->where('tanggal', $today)
            ->where('shift_id', $shift->id)
            ->first();
        if ($sudahAbsen) {
            return response()->json(['message' => 'Anda sudah absen masuk untuk shift '.$shift->nama_shift.' hari ini'], 422);
        }

        // 5. Validasi jarak
        $jarak = $this->calculateDistance(
            $request->latitude,
            $request->longitude,
            $cabang->latitude,
            $cabang->longitude
        );

        if ($jarak > $cabang->radius) {
            return response()->json([
                'message' => 'Gagal! Jarak Anda '.round($jarak).'m. Di luar radius '.$cabang->radius.'m.',
            ], 422);
        }

        // 5. Logika terlambat
        $status = 'HADIR';
        $jamMasukShift = Carbon::parse($shift->jam_masuk);
        $batasToleransi = $jamMasukShift->copy()->addMinutes($shift->toleransi);

        if ($now->gt($batasToleransi)) {
            $status = 'TERLAMBAT';
        }

        // 6. Simpan absensi
        $absensi = Absensi::create([
            'user_id' => $user->id,
            'cabang_id' => $cabang->id,
            'shift_id' => $shift->id,
            'tanggal' => $today,
            'jam_masuk' => $now->toTimeString(),
            'lat_masuk' => $request->latitude,
            'long_masuk' => $request->longitude,
            'status' => $status,
        ]);

        // 7. Kirim notifikasi WhatsApp
        if ($user->no_hp) {
            $whatsapp = new WhatsAppService();
            $whatsapp->sendAbsensiNotification($user, $status, $absensi);
        }

        return response()->json([
            'message' => 'Absen masuk berhasil. Status: '.$status,
            'absensi' => $absensi,
        ]);
    }

    /**
     * Fungsi mencocokkan embedding wajah input dengan database
     */
    /**
     * Fungsi mencocokkan embedding wajah input dengan database
     * Diperketat dengan Euclidean Distance dan Threshold rendah
     */
    // --- HELPER METHODS ---

    private function cocokkanFaceEmbedding(array $embeddingInput)
    {
        $users = User::whereNotNull('face_embedding')->get();
        $bestMatch = null;
        $minDistance = 1.0;

        foreach ($users as $user) {
            $embeddingDb = json_decode($user->face_embedding, true);
            $distance = $this->euclideanDistance($embeddingInput, $embeddingDb);

            if ($distance < 0.40 && $distance < $minDistance) {
                $minDistance = $distance;
                $bestMatch = $user;
            }
        }

        return $bestMatch;
    }

    /**
     * Hitung cosine similarity antara dua array embedding
     */
    private function cosineSimilarity(array $vecA, array $vecB)
    {
        $dot = 0;
        $normA = 0;
        $normB = 0;

        for ($i = 0; $i < count($vecA); $i++) {
            $dot += $vecA[$i] * $vecB[$i];
            $normA += pow($vecA[$i], 2);
            $normB += pow($vecB[$i], 2);
        }

        $normA = sqrt($normA);
        $normB = sqrt($normB);

        if ($normA * $normB == 0) {
            return 0;
        }

        return $dot / ($normA * $normB);
    }

    public function absenPulang(Request $request)
    {
        $today = Carbon::today()->toDateString();
        $now = Carbon::now();

        // 0️⃣ Validasi wajah
        if (! $request->has('face_embedding')) {
            return response()->json(['message' => 'Face embedding diperlukan'], 422);
        }

        $faceEmbeddingInput = json_decode($request->face_embedding);

        // 1️⃣ Cocokkan wajah
        $user = $this->cocokkanFaceEmbedding($faceEmbeddingInput);
        if (! $user) {
            return response()->json(['message' => 'Wajah tidak dikenali'], 422);
        }

        // 2️⃣ Cari shift yang aktif sekarang
        $shift = $this->resolveShiftForUser($user, $now, $today);

        if (!$shift) {
            return response()->json(['message' => 'Tidak ada shift yang aktif saat ini'], 422);
        }

        // 3️⃣ Ambil absensi untuk shift ini
        $absensi = Absensi::with('shift')
            ->where('user_id', $user->id)
            ->where('tanggal', $today)
            ->where('shift_id', $shift->id)
            ->first();

        if (! $absensi) {
            return response()->json(['message' => 'Belum absen masuk untuk shift '.$shift->nama_shift], 422);
        }
        if ($absensi->jam_keluar) {
            return response()->json(['message' => 'Sudah absen pulang untuk shift '.$shift->nama_shift], 422);
        }
        if (! $absensi->shift) {
            return response()->json(['message' => 'Shift tidak ditemukan'], 422);
        }

        // 4️⃣ Validasi lokasi
        $cabang = Cabang::find($user->cabang_id);
        if (! $cabang) {
            return response()->json(['message' => 'Cabang tidak ditemukan'], 422);
        }

        $jarak = $this->calculateDistance(
            $request->latitude,
            $request->longitude,
            $cabang->latitude,
            $cabang->longitude
        );

        if ($jarak > $cabang->radius) {
            return response()->json([
                'message' => 'Di luar radius! Jarak: '.round($jarak).'m',
            ], 422);
        }

        // 5️⃣ Jam shift + tanggal
        $jamMasukShift = Carbon::parse($absensi->shift->jam_masuk);
        $jamPulangShift = Carbon::parse($absensi->shift->jam_pulang);

        if ($jamPulangShift->lt($jamMasukShift)) {
            $jamPulangShift->addDay(); // shift malam
        }

        // 🔥 Batas akhir
        $batasAkhir = $jamPulangShift->copy()->addHours(5);

        // ⛔ Sudah lewat batas → langsung tandai
        if ($now->greaterThan($batasAkhir)) {

            $absensi->update([
                'status' => 'TIDAK ABSEN PULANG',
                'keterangan' => 'Terlambat absen pulang',
            ]);

            return response()->json([
                'message' => 'Waktu habis. Anda dianggap TIDAK ABSEN PULANG.',
            ], 422);
        }

        // 6️⃣ Status normal
        $statusBaru = $absensi->status;

        if ($now->lt($jamPulangShift) && $absensi->status !== 'TERLAMBAT') {
            $statusBaru = 'PULANG LEBIH AWAL';
        }

        // 7️⃣ Simpan
        $absensi->update([
            'jam_keluar' => $now->toTimeString(),
            'lat_pulang' => $request->latitude,
            'long_pulang' => $request->longitude,
            'status' => $statusBaru,
        ]);

        // 8️⃣ Kirim notifikasi WhatsApp jika status PULANG LEBIH AWAL
        if ($user->no_hp && in_array($statusBaru, ['PULANG LEBIH AWAL'])) {
            $whatsapp = new WhatsAppService();
            $whatsapp->sendAbsensiNotification($user, $statusBaru, $absensi);
        }

        return response()->json([
            'message' => 'Absen pulang berhasil untuk shift '.$absensi->shift->nama_shift,
            'status' => $statusBaru,
        ]);
    }

    public function statusAbsensi(Request $request)
    {
        $today = Carbon::today()->toDateString();
        $now = Carbon::now();

        if (! $request->has('face_embedding')) {
            return response()->json(['message' => 'Face embedding diperlukan'], 422);
        }

        $faceEmbeddingInput = json_decode($request->face_embedding);
        $user = $this->cocokkanFaceEmbedding($faceEmbeddingInput);

        if (! $user) {
            return response()->json(['message' => 'Wajah tidak terdaftar', 'status' => 'TIDAK_TERDAFTAR'], 422);
        }

        // --- CEK JIKA HARI INI LIBUR ---
        if (HariLibur::apakahLibur($today)) {
            return response()->json([
                'status' => 'LIBUR',
                'user_id' => $user->id,
                'user_name' => $user->name,
                'message' => 'Hari ini libur. Selamat beristirahat!',
            ]);
        }

        // --- TENTUKAN SHIFT AKTIF ---
        $shift = $this->resolveShiftForUser($user, $now, $today);

        if (!$shift) {
            return response()->json([
                'status' => 'TIDAK_ADA_SHIFT',
                'user_id' => $user->id,
                'user_name' => $user->name,
                'message' => 'Tidak ada shift yang aktif saat ini',
            ]);
        }

        $absensi = Absensi::where('user_id', $user->id)
            ->where('tanggal', $today)
            ->where('shift_id', $shift->id)
            ->first();

        if (! $absensi) {
            return response()->json([
                'status' => 'BELUM_MASUK',
                'shift_id' => $shift->id,
                'shift_name' => $shift->nama_shift,
                'user_id' => $user->id,
                'user_name' => $user->name,
            ]);
        }

        if ($absensi->jam_keluar === null) {
            return response()->json([
                'status' => 'SUDAH_MASUK',
                'shift_id' => $shift->id,
                'shift_name' => $shift->nama_shift,
                'user_id' => $user->id,
                'user_name' => $user->name,
                'jam_masuk' => $absensi->jam_masuk,
            ]);
        }

        return response()->json([
            'status' => 'SUDAH_PULANG',
            'shift_id' => $shift->id,
            'shift_name' => $shift->nama_shift,
            'user_id' => $user->id,
            'user_name' => $user->name,
            'jam_masuk' => $absensi->jam_masuk,
            'jam_keluar' => $absensi->jam_keluar,
        ]);
    }

    private function resolveShiftForUser($user, $now, $today)
    {
        $userShifts = collect();
        $mode = \App\Models\PengaturanShift::getMode();

        if ($mode === 'fixed') {
            if ($user->shift_ids && is_array($user->shift_ids) && count($user->shift_ids) > 0) {
                $userShifts = \App\Models\Shift::whereIn('id', $user->shift_ids)->get();
            } elseif ($user->shift) {
                $userShifts = collect([$user->shift]);
            }
        } else {
            $shiftJadwals = ShiftJadwal::where('user_id', $user->id)
                ->where('tanggal', $today)
                ->with('shift')
                ->get();
            if ($shiftJadwals->isNotEmpty()) {
                $userShifts = $shiftJadwals->pluck('shift')->filter();
            }

            if ($userShifts->isEmpty()) {
                if ($user->shift_ids && is_array($user->shift_ids) && count($user->shift_ids) > 0) {
                    $userShifts = \App\Models\Shift::whereIn('id', $user->shift_ids)->get();
                } elseif ($user->shift) {
                    $userShifts = collect([$user->shift]);
                }
            }
        }

        $currentTime = $now->format('H:i');
        $shift = null;
        foreach ($userShifts as $s) {
            $toleransi = $s->toleransi ?? 0;
            $jamMasuk = Carbon::parse($s->jam_masuk);
            $jamMulaiAbsen = $jamMasuk->copy()->subMinutes($toleransi);
            $jamPulang = Carbon::parse($s->jam_pulang);

            $cekMasuk = $jamMulaiAbsen->format('H:i');
            $cekPulang = $jamPulang->format('H:i');

            if ($cekMasuk <= $currentTime && $cekPulang >= $currentTime) {
                $shift = $s;
                break;
            }
        }

        // Fallback: jika tidak ada shift yang cocok dengan waktu, pakai shift pertama yang dijadwalkan hari ini
        if (!$shift && $userShifts->isNotEmpty()) {
            $shift = $userShifts->first();
        }

        return $shift;
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

    private function resolveCabangForUser($user, $latitude, $longitude)
    {
        $cabangIds = $user->cabang_ids ?? [];

        if (!is_array($cabangIds) || count($cabangIds) === 0) {
            if ($user->cabang_id) {
                $cabangIds = [$user->cabang_id];
            } else {
                return null;
            }
        }

        $daftarCabang = \App\Models\Cabang::whereIn('id', $cabangIds)->get();

        foreach ($daftarCabang as $cabang) {
            if (!$cabang->latitude || !$cabang->longitude || !$cabang->radius) {
                continue;
            }
            $jarak = $this->calculateDistance(
                $latitude,
                $longitude,
                $cabang->latitude,
                $cabang->longitude
            );
            if ($jarak <= $cabang->radius) {
                return $cabang;
            }
        }

        return null;
    }

    private function saveBase64Photo($base64, $type)
    {
        $image = explode(',', $base64)[1];
        $image = base64_decode($image);
        $filename = $type.'_'.uniqid().'.jpg';
        $path = 'absensi/'.$filename;
        Storage::disk('public')->put($path, $image);

        return $path;
    }

    // Riwayat absensi user login
    public function riwayat()
    {
        $user = Auth::user();

        $absensi = Absensi::with('shift')
            ->where('user_id', $user->id)
            ->orderBy('tanggal', 'desc')
            ->orderBy('shift_id', 'desc')
            ->get();

        $absensiSensei = AbsensiSensei::where('user_id', $user->id)
            ->with('kelasSensei')
            ->orderBy('tanggal', 'desc')
            ->get();

        return view('absensi.riwayat', compact('absensi', 'absensiSensei'));
    }

    public function riwayatJson()
    {
        $riwayat = Absensi::with('shift')
            ->where('user_id', Auth::id())
            ->orderBy('tanggal', 'desc')
            ->orderBy('shift_id', 'desc')
            ->limit(10)
            ->get();

        $riwayatSensei = AbsensiSensei::where('user_id', Auth::id())
            ->with('kelasSensei')
            ->orderBy('tanggal', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'karyawan' => $riwayat,
            'sensei' => $riwayatSensei,
        ]);
    }

    public function detail($tanggal)
    {
        $user = Auth::user();

        $absensi = Absensi::with('shift')
            ->where('user_id', $user->id)
            ->where('tanggal', $tanggal)
            ->first();

        if (! $absensi) {
            abort(404, 'Data absensi tidak ditemukan');
        }

        return view('absensi.detail', compact('absensi'));
    }

    public function detailSensei($tanggal, $kelasId)
    {
        $user = Auth::user();

        $absensi = AbsensiSensei::where('user_id', $user->id)
            ->where('tanggal', $tanggal)
            ->where('kelas_sensei_id', $kelasId)
            ->with('kelasSensei')
            ->first();

        if (! $absensi) {
            abort(404, 'Data absensi sensei tidak ditemukan');
        }

        return view('absensi.detail_sensei', compact('absensi'));
    }

    // Riwayat absensi karyawan login
    public function history()
    {
        $user = Auth::user();

        if (! $user->karyawan) {
            return response()->json([], 404);
        }

        $karyawan_id = $user->karyawan->id;

        $absensi = Absensi::with('jadwal')
            ->where('karyawan_id', $karyawan_id)
            ->orderBy('tanggal', 'desc')
            ->get();

        return response()->json($absensi);
    }

    public function deteksiWajah(Request $request)
    {
        $request->validate([
            'image' => 'required',
            'jenis' => 'required|in:masuk,pulang',
        ]);

        /* Simpan foto */
        $img = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $request->image));
        $path = 'absensi/'.Auth::user().'_'.time().'.jpg';
        file_put_contents(public_path($path), $img);

        /**
         * DI SINI:
         * 🔥 Panggil Face Recognition Engine (Python / OpenCV / YOLO)
         * return false jika wajah tidak cocok
         */
        $today = Carbon::today()->toDateString();
        $absen = Absensi::firstOrCreate(
            ['user_id' => Auth::id(), 'tanggal' => $today],
            ['status' => 'Hadir']
        );

        if ($request->jenis === 'masuk') {
            if ($absen->jam_masuk) {
                return response()->json(['message' => 'Sudah absen masuk'], 422);
            }
            $absen->jam_masuk = now()->format('H:i:s');
        } else {
            if (! $absen->jam_masuk) {
                return response()->json(['message' => 'Belum absen masuk'], 422);
            }
            $absen->jam_pulang = now()->format('H:i:s');
        }

        $absen->save();

        return response()->json([
            'message' => 'Absensi berhasil diverifikasi wajah',
        ]);
    }

    public function updateFace(Request $request)
    {
        $newDescriptor = json_decode($request->face_embedding);

        if (! $newDescriptor) {
            return response()->json(['status' => 'error', 'message' => 'Data wajah tidak valid'], 400);
        }

        // Ambil user lain untuk pengecekan duplikasi wajah
        $otherUsers = User::whereNotNull('face_embedding')
            ->where('id', '!=', auth()->id())
            ->get();

        foreach ($otherUsers as $user) {
            $existingDescriptor = json_decode($user->face_embedding);
            $distance = $this->euclideanDistance($newDescriptor, $existingDescriptor);

            // Jika distance < 0.40, berarti wajah ini "terlalu mirip" dengan orang lain
            if ($distance < 0.40) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Gagal! Wajah ini terdeteksi mirip dengan: '.$user->name.'. Silakan ambil ulang dengan posisi lebih tegak.',
                ], 422);
            }
        }

        auth()->user()->update([
            'face_embedding' => $request->face_embedding,
        ]);

        return response()->json(['status' => 'success', 'message' => 'Wajah berhasil didaftarkan']);
    }

    /**
     * Fungsi menghitung jarak antara dua vektor wajah
     */
    private function euclideanDistance($arr1, $arr2)
    {
        $sum = 0;
        for ($i = 0; $i < count($arr1); $i++) {
            $sum += pow($arr1[$i] - $arr2[$i], 2);
        }
        $distance = sqrt($sum);

        // LOGIKA: Jika distance > 0.4, maka dianggap ORANG BERBEDA
        return $distance;
    }

    // Absen Foto (Multiple Branch & Multiple Shift Support)
    public function absenFoto(Request $request)
    {
        $user = Auth::user();
        $today = Carbon::today('Asia/Jakarta')->toDateString();
        $now = Carbon::now('Asia/Jakarta');

        // =====================================================
        // 0. TENTUKAN SHIFT YANG SEDANG AKTIF
        // =====================================================
        $shift = $this->resolveShiftForUser($user, $now, $today);

        if (!$shift) {
            return response()->json(['message' => 'Tidak ada shift yang aktif saat ini'], 422);
        }

        if ($shift->status === 'NONAKTIF') {
            return response()->json(['message' => 'Shift '.$shift->nama_shift.' sedang dinonaktifkan.'], 403);
        }

        // =====================================================
        // 0b. CEK ABSENSI UNTUK SHIFT INI
        // =====================================================
        $absensi = Absensi::where('user_id', $user->id)
            ->where('tanggal', $today)
            ->where('shift_id', $shift->id)
            ->first();

        // Jika sudah complete (masuk + pulang) untuk shift ini
        if ($absensi && $absensi->jam_masuk && $absensi->jam_keluar) {
            return response()->json([
                'message' => 'Anda sudah absen masuk dan pulang untuk shift '.$shift->nama_shift.'.',
            ], 422);
        }

        // =====================================================
        // 0c. VALIDASI JIKA USER MEMILIKI KELAS SENSEI AKTIF YANG BELUM DIABSEN
        // =====================================================
        $kelasSenseiAktif = KelasSensei::where('user_id', $user->id)
            ->where('status', 'aktif')
            ->whereDate('tanggal_mulai', '<=', $today)
            ->whereDate('tanggal_selesai', '>=', $today)
            ->with(['absensi' => function ($q) use ($today) {
                $q->where('tanggal', $today);
            }])
            ->get();

        foreach ($kelasSenseiAktif as $kelas) {
            $absensiHariIni = $kelas->absensi->first();
            if (!$absensiHariIni || !$absensiHariIni->jam_masuk) {
                return response()->json([
                    'message' => 'Maaf, absen reguler tidak bisa dilakukan. Anda dapat melakukan absen Sensei saja hari ini.',
                ], 403);
            }
        }

        // ===============================
        // 1. VALIDASI INPUT
        // ===============================
        $request->validate([
            'photo' => 'required',
            'latitude' => 'required',
            'longitude' => 'required',
        ]);

        // ===============================
        // 2. VALIDASI HARI LIBUR
        // ===============================
        if (HariLibur::apakahLibur($today)) {
            return response()->json([
                'message' => 'Hari ini adalah hari libur. Absensi tidak dibuka.',
            ], 403);
        }

        // ===========================================
        // 3. VALIDASI CABANG & RADIUS (LOGIKA MULTIPLE)
        // ===========================================
        $userCabangIds = $user->cabang_ids;

        if (! $userCabangIds || ! is_array($userCabangIds) || count($userCabangIds) == 0) {
            return response()->json(['message' => 'Anda tidak memiliki akses ke cabang manapun.'], 422);
        }

        $daftarCabang = \App\Models\Cabang::whereIn('id', $userCabangIds)->get();
        $cabangTerdeteksi = null;
        $logJarak = [];

        foreach ($daftarCabang as $cb) {
            $jarak = $this->calculateDistance(
                $request->latitude,
                $request->longitude,
                $cb->latitude,
                $cb->longitude
            );

            $jarakMeter = round($jarak);
            $logJarak[] = $cb->nama_cabang.' ('.$jarakMeter.'m)';

            if ($jarak <= $cb->radius) {
                $cabangTerdeteksi = $cb;
                break;
            }
        }

        if (! $cabangTerdeteksi) {
            $daftarJarak = implode(', ', $logJarak);

            return response()->json([
                'message' => 'Gagal! Anda berada di luar radius cabang penempatan. Jarak Anda saat ini: '.$daftarJarak,
            ], 422);
        }

        $cabang = $cabangTerdeteksi;

        // ===============================
        // 4. SIMPAN FOTO
        // ===============================
        $fotoPath = $this->saveBase64Photo($request->photo, 'absen_manual');

        // ---------------------------------------------------------------------
        // JIKA BELUM ABSEN MASUK UNTUK SHIFT INI → MODE MASUK
        // ---------------------------------------------------------------------
        if (! $absensi) {
            $jamMasukShift = Carbon::parse($shift->jam_masuk, 'Asia/Jakarta');
            $batasToleransi = $jamMasukShift->copy()->addMinutes($shift->toleransi);

            // Tentukan status berdasarkan jam sekarang (HADIR atau TERLAMBAT)
            $status = ($now->gt($batasToleransi)) ? 'TERLAMBAT' : 'HADIR';

            $absensi = Absensi::create([
                'user_id' => $user->id,
                'cabang_id' => $cabang->id,
                'shift_id' => $shift->id,
                'tanggal' => $today,
                'jam_masuk' => $now->toTimeString(),
                'lat_masuk' => $request->latitude,
                'long_masuk' => $request->longitude,
                'foto_masuk' => $fotoPath,
                'status' => $status,
            ]);

            // Kirim notifikasi WhatsApp masuk
            if ($user->no_hp) {
                $whatsapp = new WhatsAppService();
                $whatsapp->sendAbsensiNotification($user, $status, $absensi);
            }

            return response()->json([
                'message' => 'Absen masuk shift '.$shift->nama_shift.' berhasil di '.$cabang->nama_cabang.'. Status: '.$status,
                'status' => $status,
                'path' => $fotoPath,
                'shift_name' => $shift->nama_shift,
            ]);
        }

        // -----------------------------------------------------
        // JIKA SUDAH ADA JAM_MASUK TAPI BELUM JAM_KELUAR → MODE PULANG
        // -----------------------------------------------------
        $jamMasukShift = Carbon::parse($absensi->shift->jam_masuk, 'Asia/Jakarta');
        $jamPulangShift = Carbon::parse($absensi->shift->jam_pulang, 'Asia/Jakarta');

        if ($jamPulangShift->lt($jamMasukShift)) {
            $jamPulangShift->addDay();
        }

        // Batas akhir absen pulang (5 jam setelah shift selesai)
        $batasAkhir = $jamPulangShift->copy()->addHours(5);

        if ($now->gt($batasAkhir)) {
            $absensi->update([
                'status' => 'TIDAK ABSEN PULANG',
                'keterangan' => 'Terlambat absen pulang (melebihi batas 5 jam)',
            ]);

            return response()->json([
                'message' => 'Waktu absen pulang untuk shift '.$absensi->shift->nama_shift.' telah berakhir. Status Anda: TIDAK ABSEN PULANG.',
            ], 422);
        }

        // LOGIKA STATUS PULANG:
        $statusBaru = $absensi->status;

        if ($now->lt($jamPulangShift)) {
            if ($statusBaru !== 'TERLAMBAT') {
                $statusBaru = 'PULANG LEBIH AWAL';
            }
        }

        $absensi->update([
            'jam_keluar' => $now->toTimeString(),
            'lat_pulang' => $request->latitude,
            'long_pulang' => $request->longitude,
            'foto_pulang' => $fotoPath,
            'status' => $statusBaru,
        ]);

        // Kirim notifikasi WhatsApp jika PULANG LEBIH AWAL
        if ($user->no_hp && in_array($statusBaru, ['PULANG LEBIH AWAL'])) {
            $whatsapp = new WhatsAppService();
            $whatsapp->sendAbsensiNotification($user, $statusBaru, $absensi);
        }

        return response()->json([
            'message' => 'Absen pulang shift '.$absensi->shift->nama_shift.' berhasil di '.$cabang->nama_cabang.'. Status: '.$statusBaru,
            'status' => $statusBaru,
            'path' => $fotoPath,
            'shift_name' => $absensi->shift->nama_shift,
        ]        );
    }

    public function siswaIndex(Request $request)
    {
        $user = auth()->user();

        $kelasList = \App\Models\KelasSensei::with('user', 'batchRelasi')
            ->where('status', 'aktif')
            ->when($user->role === 'GURU', fn($q) => $q->where('user_id', $user->id))
            ->get()
            ->map(function ($k) {
                $k->siswa_count = \App\Models\Siswa::where('batch_id', $k->batch_id)->where('status', 'AKTIF')->count();
                return $k;
            });

        // Minggu ini (Senin-Jumat)
        $now = \Carbon\Carbon::now();
        $monday = $now->copy()->startOfWeek();
        $days = [];
        for ($i = 0; $i < 5; $i++) {
            $days[] = $monday->copy()->addDays($i)->toDateString();
        }

        return view('absensi.siswa', compact('kelasList', 'days'));
    }

    public function getSiswaAttendance($kelasSenseiId)
    {
        $ks = \App\Models\KelasSensei::with('batchRelasi')->findOrFail($kelasSenseiId);

        $siswa = \App\Models\Siswa::where('batch_id', $ks->batch_id)
            ->where('status', 'AKTIF')
            ->get();

        $now = \Carbon\Carbon::now();
        $monday = $now->copy()->startOfWeek();
        $days = [];
        for ($i = 0; $i < 5; $i++) {
            $days[] = $monday->copy()->addDays($i)->toDateString();
        }

        $absensiSiswa = \App\Models\AbsensiSiswa::where('kelas_sensei_id', $kelasSenseiId)
            ->whereBetween('tanggal', [$days[0], $days[4]])
            ->get()
            ->keyBy(function ($item) {
                return $item->siswa_id . '_' . \Carbon\Carbon::parse($item->tanggal)->toDateString();
            });

        $data = $siswa->map(function ($s) use ($days, $absensiSiswa) {
            $attendance = [];
            foreach ($days as $d) {
                $key = $s->id . '_' . $d;
                $attendance[] = isset($absensiSiswa[$key]) ? $absensiSiswa[$key]->status : null;
            }
            return [
                'id' => $s->id,
                'nama' => $s->nama,
                'level' => $s->level,
                'foto' => $s->foto && file_exists(public_path('uploads/siswa/' . $s->foto))
                    ? asset('uploads/siswa/' . $s->foto)
                    : 'https://ui-avatars.com/api/?name=' . urlencode($s->nama) . '&background=00c0ff&color=fff&size=32',
                'attendance' => $attendance,
            ];
        });

        return response()->json([
            'siswa' => $data,
            'days' => $days,
        ]);
    }

    public function updateSiswaStatus(Request $request)
    {
        $request->validate([
            'siswa_id' => 'required|exists:siswas,id',
            'tanggal' => 'required|date',
            'status' => 'required|in:HADIR,TERLAMBAT,IZIN,SAKIT,ALPA',
            'kelas_sensei_id' => 'nullable|exists:kelas_sensei,id',
        ]);

        $absensi = \App\Models\AbsensiSiswa::updateOrCreate(
            [
                'siswa_id' => $request->siswa_id,
                'tanggal' => $request->tanggal,
                'kelas_sensei_id' => $request->kelas_sensei_id,
            ],
            [
                'status' => $request->status,
                'cabang_id' => \App\Models\Siswa::find($request->siswa_id)->cabang_id ?? null,
                'kelas_sensei_id' => $request->kelas_sensei_id,
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Status berhasil diperbarui',
            'data' => $absensi,
        ]);
    }

    public function riwayatSiswaJson($siswa)
    {
        $siswaModel = \App\Models\Siswa::findOrFail($siswa);
        $bulan = request('bulan', now()->month);
        $tahun = request('tahun', now()->year);

        $start = \Carbon\Carbon::create($tahun, $bulan, 1)->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $absensi = \App\Models\AbsensiSiswa::where('siswa_id', $siswa)
            ->whereBetween('tanggal', [$start, $end])
            ->orderBy('tanggal')
            ->get()
            ->keyBy(function ($item) {
                return \Carbon\Carbon::parse($item->tanggal)->day;
            });

        $days = [];
        for ($d = 1; $d <= $start->daysInMonth; $d++) {
            $date = \Carbon\Carbon::create($tahun, $bulan, $d);
            $days[] = [
                'day' => $d,
                'dayName' => $date->translatedFormat('D'),
                'status' => isset($absensi[$d]) ? $absensi[$d]->status : null,
                'jam_masuk' => isset($absensi[$d]) ? $absensi[$d]->jam_masuk : null,
                'jam_keluar' => isset($absensi[$d]) ? $absensi[$d]->jam_keluar : null,
            ];
        }

        return response()->json([
            'nama' => $siswaModel->nama,
            'foto' => $siswaModel->foto && file_exists(public_path('uploads/siswa/' . $siswaModel->foto))
                ? asset('uploads/siswa/' . $siswaModel->foto)
                : 'https://ui-avatars.com/api/?name=' . urlencode($siswaModel->nama) . '&background=00c0ff&color=fff&size=64',
            'kelas' => $siswaModel->kelasRelasi->nama_kelas ?? $siswaModel->kelas ?? '-',
            'bulan' => $start->translatedFormat('F Y'),
            'bulan_angka' => $bulan,
            'tahun' => $tahun,
            'days' => $days,
            'startOfWeek' => $start->dayOfWeek,
        ]);
    }

    public function penilaianSiswaJson($batchId)
    {
        $user = Auth::user();
        $siswa = \App\Models\Siswa::where('batch_id', $batchId)->where('status', 'AKTIF')->get();
        $namaSiswa = $siswa->pluck('nama')->toArray();

        $penilaian = \App\Models\Penilaian::where('user_id', $user->id)
            ->whereIn('nama_siswa', $namaSiswa)
            ->orderBy('tanggal_penilaian', 'desc')
            ->get()
            ->groupBy('nama_siswa');

        $data = $siswa->map(function ($s) use ($penilaian) {
            $nilaiSiswa = $penilaian[$s->nama] ?? collect();
            return [
                'id' => $s->id,
                'nama' => $s->nama,
                'foto' => $s->foto && file_exists(public_path('uploads/siswa/' . $s->foto))
                    ? asset('uploads/siswa/' . $s->foto)
                    : 'https://ui-avatars.com/api/?name=' . urlencode($s->nama) . '&background=00c0ff&color=fff&size=32',
                'nilai_terakhir' => $nilaiSiswa->first()?->nilai,
                'total_penilaian' => $nilaiSiswa->count(),
            ];
        });

        return response()->json($data);
    }

    public function assessmentTemplate($kelasSenseiId)
    {
        $kelas = KelasSensei::findOrFail($kelasSenseiId);
        $level = $kelas->level;
        $batchId = $kelas->batch_id;

        $categories = \App\Models\AssessmentCategory::with('components')
            ->where('level', $level)
            ->orderBy('urutan')
            ->get();

        $siswa = \App\Models\Siswa::where('batch_id', $batchId)->where('status', 'AKTIF')->orderBy('nama')->get();
        $siswaData = $siswa->map(function ($s) {
            return [
                'id' => $s->id,
                'nama' => $s->nama,
                'foto' => $s->foto && file_exists(public_path('uploads/siswa/' . $s->foto))
                    ? asset('uploads/siswa/' . $s->foto)
                    : 'https://ui-avatars.com/api/?name=' . urlencode($s->nama) . '&background=00c0ff&color=fff&size=32',
            ];
        });

        return response()->json([
            'level' => $level,
            'batch_id' => $batchId,
            'categories' => $categories->map(function ($cat) {
                return [
                    'id' => $cat->id,
                    'nama_kategori' => $cat->nama_kategori,
                    'components' => $cat->components->sortBy('urutan')->values()->map(function ($c) {
                        return [
                            'id' => $c->id,
                            'sub_komponen' => $c->sub_komponen,
                        ];
                    }),
                ];
            }),
            'students' => $siswaData,
        ]);
    }

    public function getDayAssessments(Request $request)
    {
        $request->validate([
            'batch_id' => 'required|exists:batches,id',
            'tanggal' => 'required|date',
            'kelas_sensei_id' => 'nullable|exists:kelas_sensei,id',
        ]);

        $componentIds = collect();
        if ($request->kelas_sensei_id) {
            $kelas = \App\Models\KelasSensei::find($request->kelas_sensei_id);
            if ($kelas) {
                $categories = \App\Models\AssessmentCategory::with('components')
                    ->where('level', $kelas->level)
                    ->get();
                $componentIds = $categories->pluck('components')->flatten()->pluck('id');
            }
        } else {
            $kelas = \App\Models\KelasSensei::where('batch_id', $request->batch_id)->first();
            if ($kelas) {
                $categories = \App\Models\AssessmentCategory::with('components')
                    ->where('level', $kelas->level)
                    ->get();
                $componentIds = $categories->pluck('components')->flatten()->pluck('id');
            }
        }

        $assessments = \App\Models\StudentAssessment::with('component')
            ->where('batch_id', $request->batch_id)
            ->where('tanggal', $request->tanggal)
            ->when($componentIds->isNotEmpty(), fn($q) => $q->whereIn('component_id', $componentIds))
            ->get()
            ->keyBy(fn ($a) => $a->siswa_id . '_' . $a->component_id);

        return response()->json([
            'assessments' => $assessments->map(function ($a) {
                return [
                    'siswa_id' => $a->siswa_id,
                    'component_id' => $a->component_id,
                    'nilai' => (float) $a->nilai,
                ];
            })->values(),
        ]);
    }

    public function saveAssessments(Request $request)
    {
        $request->validate([
            'batch_id' => 'required|exists:batches,id',
            'tanggal' => 'required|date',
            'siswa_id' => 'required|exists:siswas,id',
            'nilai' => 'required|array',
            'nilai.*' => 'nullable|numeric|min:0|max:100',
        ]);

        $user = Auth::user();

        foreach ($request->nilai as $componentId => $nilai) {
            if ($nilai !== '' && $nilai !== null) {
                \App\Models\StudentAssessment::updateOrCreate(
                    [
                        'component_id' => $componentId,
                        'siswa_id' => $request->siswa_id,
                        'batch_id' => $request->batch_id,
                        'tanggal' => $request->tanggal,
                    ],
                    [
                        'user_id' => $user->id,
                        'nilai' => $nilai,
                    ]
                );
            } else {
                \App\Models\StudentAssessment::where([
                    'component_id' => $componentId,
                    'siswa_id' => $request->siswa_id,
                    'batch_id' => $request->batch_id,
                    'tanggal' => $request->tanggal,
                ])->delete();
            }
        }

        return response()->json(['status' => 'success', 'message' => 'Nilai berhasil disimpan']);
    }

    public function riwayatKelas($kelasSenseiId)
    {
        $user = Auth::user();
        $kelasSensei = \App\Models\KelasSensei::with('user', 'batchRelasi')->findOrFail($kelasSenseiId);

        $siswaRecord = \App\Models\Siswa::where('user_id', $user->id)->first();
        if (!$siswaRecord) {
            $siswaRecord = \App\Models\Siswa::where('nama', $user->name)->first();
        }
        if (!$siswaRecord) {
            return redirect()->back()->with('error', 'Data siswa tidak ditemukan');
        }

        $absensi = \App\Models\AbsensiSiswa::with('cabang')
            ->where('siswa_id', $siswaRecord->id)
            ->whereBetween('tanggal', [$kelasSensei->tanggal_mulai, $kelasSensei->tanggal_selesai])
            ->orderBy('tanggal', 'desc')
            ->get();

        return view('absensi.riwayat_kelas', compact('kelasSensei', 'absensi', 'siswaRecord'));
    }

    // =============================================
    // API: Absensi Karyawan (untuk mobile/dashboard karyawan)
    // =============================================

    /**
     * Cek status absensi hari ini
     */
    public function apiCek(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['data' => null]);
        }

        $today = Carbon::today('Asia/Jakarta')->toDateString();

        $absensi = Absensi::where('user_id', $user->id)
            ->where('tanggal', $today)
            ->first();

        if (!$absensi) {
            return response()->json(['data' => null]);
        }

        return response()->json([
            'data' => [
                'jam_masuk' => $absensi->jam_masuk,
                'jam_keluar' => $absensi->jam_keluar,
                'status' => $absensi->status,
            ],
        ]);
    }

    /**
     * Ambil shift aktif hari ini untuk user login
     */
    public function apiShiftSaya(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['data' => null]);
        }

        $today = Carbon::today()->toDateString();
        $now = Carbon::now();
        $shift = $this->resolveShiftForUser($user, $now, $today);

        if (!$shift) {
            return response()->json(['data' => null]);
        }

        return response()->json([
            'data' => [
                'nama' => $shift->nama_shift,
                'jam_mulai' => Carbon::parse($shift->jam_masuk)->format('H:i'),
                'jam_selesai' => Carbon::parse($shift->jam_pulang)->format('H:i'),
            ],
        ]);
    }

    /**
     * Absen masuk dengan foto
     */
    public function apiMasuk(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $today = Carbon::today('Asia/Jakarta')->toDateString();
        $now = Carbon::now('Asia/Jakarta');

        // Cek sudah absen masuk
        $existing = Absensi::where('user_id', $user->id)
            ->where('tanggal', $today)
            ->first();

        if ($existing && $existing->jam_masuk) {
            return response()->json(['message' => 'Anda sudah absen masuk hari ini'], 422);
        }

        // Validasi lokasi GPS
        $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        $cabang = $this->resolveCabangForUser($user, $request->latitude, $request->longitude);
        if (!$cabang) {
            return response()->json(['message' => 'Anda berada di luar radius cabang penempatan'], 422);
        }

        // Validasi & simpan foto
        $fotoPath = null;
        if ($request->hasFile('foto')) {
            $request->validate(['foto' => 'required|image|max:5120']);
            $fotoPath = $request->file('foto')->store('absensi-karyawan', 'public');
        } elseif ($request->has('foto')) {
            $fotoPath = $this->saveBase64Photo($request->foto, 'absen_masuk');
        } else {
            return response()->json(['message' => 'Foto diperlukan'], 422);
        }

        // Cari shift aktif
        $shift = $this->resolveShiftForUser($user, $now, $today);
        if (!$shift) {
            return response()->json(['message' => 'Tidak ada jadwal shift hari ini, absensi tidak dapat dilakukan'], 422);
        }

        // Tentukan status
        $status = 'HADIR';
        if ($shift) {
            $jamMasukShift = Carbon::parse($shift->jam_masuk);
            $batasToleransi = $jamMasukShift->copy()->addMinutes($shift->toleransi ?? 0);
            if ($now->gt($batasToleransi)) {
                $status = 'TERLAMBAT';
            }
        }

        $absensi = Absensi::create([
            'user_id' => $user->id,
            'cabang_id' => $cabang->id,
            'shift_id' => $shift->id ?? null,
            'tanggal' => $today,
            'jam_masuk' => $now->toTimeString(),
            'lat_masuk' => $request->latitude,
            'long_masuk' => $request->longitude,
            'foto_masuk' => $fotoPath,
            'status' => $status,
        ]);

        return response()->json([
            'message' => 'Absen masuk berhasil',
            'data' => [
                'jam_masuk' => $absensi->jam_masuk,
                'status' => $status,
            ],
        ]);
    }

    /**
     * Absen pulang dengan foto
     */
    public function apiPulang(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $today = Carbon::today('Asia/Jakarta')->toDateString();
        $now = Carbon::now('Asia/Jakarta');

        $absensi = Absensi::where('user_id', $user->id)
            ->where('tanggal', $today)
            ->first();

        if (!$absensi) {
            return response()->json(['message' => 'Belum absen masuk hari ini'], 422);
        }

        if ($absensi->jam_keluar) {
            return response()->json(['message' => 'Sudah absen pulang hari ini'], 422);
        }

        // Validasi lokasi GPS
        $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        $cabang = $this->resolveCabangForUser($user, $request->latitude, $request->longitude);
        if (!$cabang) {
            return response()->json(['message' => 'Anda berada di luar radius cabang penempatan'], 422);
        }

        // Validasi & simpan foto
        $fotoPath = null;
        if ($request->hasFile('foto')) {
            $request->validate(['foto' => 'required|image|max:5120']);
            $fotoPath = $request->file('foto')->store('absensi-karyawan', 'public');
        } elseif ($request->has('foto')) {
            $fotoPath = $this->saveBase64Photo($request->foto, 'absen_pulang');
        } else {
            return response()->json(['message' => 'Foto diperlukan'], 422);
        }

        $absensi->update([
            'jam_keluar' => $now->toTimeString(),
            'foto_pulang' => $fotoPath,
            'lat_pulang' => $request->latitude,
            'long_pulang' => $request->longitude,
        ]);

        return response()->json([
            'message' => 'Absen pulang berhasil',
            'data' => [
                'jam_masuk' => $absensi->jam_masuk,
                'jam_keluar' => $absensi->jam_keluar,
            ],
        ]);
    }

    /**
     * Riwayat absensi
     */
    public function apiRiwayat(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['data' => []]);
        }

        $limit = $request->get('limit', 10);
        $filter = $request->get('filter');

        $userRole = strtoupper($user->jabatan ?? 'KARYAWAN');

        $query = Absensi::with('shift')
            ->where('user_id', $user->id);

        if ($request->filled('bulan')) {
            $query->whereMonth('tanggal', $request->bulan);
        }

        if ($request->filled('tahun')) {
            $query->whereYear('tanggal', $request->tahun);
        }

        if ($filter && in_array($filter, ['Hadir', 'Terlambat', 'Alpa'])) {
            $statusMap = ['Hadir' => 'HADIR', 'Terlambat' => 'TERLAMBAT', 'Alpa' => 'ALPA'];
            $query->where('status', $statusMap[$filter]);
        }

        $riwayat = $query->orderBy('tanggal', 'desc')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($item) use ($userRole) {
                return [
                    'id' => $item->id,
                    'tanggal' => $item->tanggal,
                    'jam_masuk' => $item->jam_masuk,
                    'jam_keluar' => $item->jam_keluar,
                    'status' => $item->status ? strtolower($item->status) : 'hadir',
                    'role' => $userRole,
                    'shift' => $item->shift ? ['nama' => $item->shift->nama_shift] : null,
                ];
            });

        return response()->json(['data' => $riwayat]);
    }

    /**
     * Stats hari ini (jumlah hadir, terlambat, dll)
     */
    public function apiStatsHariIni()
    {
        $today = Carbon::today()->toDateString();

        $total = Absensi::where('tanggal', $today)->count();
        $hadir = Absensi::where('tanggal', $today)->where('status', 'HADIR')->count();
        $terlambat = Absensi::where('tanggal', $today)->where('status', 'TERLAMBAT')->count();

        return response()->json([
            'data' => [
                'total' => $total,
                'hadir' => $hadir,
                'terlambat' => $terlambat,
            ],
        ]);
    }
}
