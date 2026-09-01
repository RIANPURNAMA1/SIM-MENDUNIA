<?php

namespace App\Http\Controllers;

use App\Models\Batch;
use App\Models\JadwalLevel;
use App\Models\KelasSensei;
use App\Models\MatchingJobForm;
use App\Models\Pendaftar;
use App\Models\Siswa;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SiswaDashboardController extends Controller
{
    public function index()
    {
        $user = Auth::guard('sanctum')->user();

        $pendaftar = Pendaftar::with(['product'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->first();

        $siswa = Siswa::where('user_id', $user->id)->first();

        // Auto-sync address from pendaftar to siswa if siswa doesn't have it
        if ($siswa && $pendaftar) {
            $synced = false;
            foreach (['provinsi', 'kabupaten', 'kecamatan', 'desa', 'alamat'] as $field) {
                if (empty($siswa->$field) && !empty($pendaftar->$field)) {
                    $siswa->$field = $pendaftar->$field;
                    $synced = true;
                }
            }
            if (empty($siswa->no_hp) && !empty($pendaftar->telepon)) {
                $siswa->no_hp = $pendaftar->telepon;
                $synced = true;
            }
            if ($synced) $siswa->save();
        }

        $batches = Batch::aktif()->orderBy('nama_batch')->get(['id', 'nama_batch']);

        $hasClass = false;
        $jadwalLevels = [];
        $batchId = $siswa?->batch_id ?: $pendaftar?->batch_id;
        if ($batchId) {
            $hasClass = KelasSensei::where('batch_id', $batchId)
                ->where('status', 'aktif')
                ->exists();

            $jadwalData = JadwalLevel::where('batch_id', $batchId)->get();
            foreach ($jadwalData as $j) {
                $jadwalLevels[$j->level] = [
                    'tanggal_mulai' => $j->tanggal_mulai->format('Y-m-d'),
                    'tanggal_selesai' => $j->tanggal_selesai->format('Y-m-d'),
                ];
            }
        }

        return response()->json([
            'pendaftar' => $pendaftar,
            'user' => $user,
            'siswa' => $siswa,
            'batches' => $batches,
            'has_class' => $hasClass,
            'jadwal_levels' => $jadwalLevels,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = Auth::guard('sanctum')->user();

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'no_hp' => 'nullable|string|max:20',
            'alamat' => 'nullable|string',
            'tempat_lahir' => 'nullable|string|max:255',
            'tanggal_lahir' => 'nullable|date',
            'jenis_kelamin' => 'nullable|in:L,P',
            'agama' => 'nullable|string|max:100',
            'nik' => 'nullable|string|max:50',
            'pendidikan_terakhir' => 'nullable|string|max:100',
            'foto_profil' => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
            'foto_ktp' => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
            'foto_ijazah' => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
            'foto_kk' => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
            'foto' => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
            'batch_id' => 'nullable|exists:batches,id',
            'desa' => 'nullable|string|max:255',
            'kecamatan' => 'nullable|string|max:255',
            'kabupaten' => 'nullable|string|max:255',
            'provinsi' => 'nullable|string|max:255',
            'tahun_lulus' => 'nullable|string|max:4',
            'tinggi_badan' => 'nullable|numeric',
            'berat_badan' => 'nullable|numeric',
            'goldar' => 'nullable|in:A,B,AB,O',
            'ukuran_baju' => 'nullable|in:XS,S,M,L,XL,XXL',
            'status_pernikahan' => 'nullable|in:Belum Nikah,Nikah,Cerai',
            'no_hp_ortu' => 'nullable|string|max:20',
            'nama_ortu' => 'nullable|string|max:255',
            'keterangan' => 'nullable|string|max:500',
        ]);

        // Update User fields
        $userData = $request->only([
            'name', 'no_hp', 'alamat', 'tempat_lahir',
            'tanggal_lahir', 'jenis_kelamin', 'agama', 'nik', 'pendidikan_terakhir'
        ]);
        $user->fill(array_filter($userData, fn($v) => $v !== null));

        // Handle file uploads to User
        $fileFields = ['foto_profil', 'foto_ktp', 'foto_ijazah', 'foto_kk'];
        foreach ($fileFields as $field) {
            if ($request->hasFile($field)) {
                $file = $request->file($field);
                $filename = time() . '_' . $field . '.' . $file->extension();
                $file->move(public_path('uploads/' . $field), $filename);
                $user->$field = 'uploads/' . $field . '/' . $filename;
            }
        }

        $user->save();

        // Update or create Siswa record
        $siswa = Siswa::firstOrNew(['user_id' => $user->id]);
        $siswa->nama = $user->name;

        if ($request->has('no_hp')) $siswa->no_hp = $request->no_hp;
        if ($request->has('alamat')) $siswa->alamat = $request->alamat;
        if ($request->has('tempat_lahir')) $siswa->tempat_lahir = $request->tempat_lahir;
        if ($request->has('tanggal_lahir')) $siswa->tanggal_lahir = $request->tanggal_lahir;
        if ($request->has('jenis_kelamin')) $siswa->jenis_kelamin = $request->jenis_kelamin;
        if ($request->has('agama')) $siswa->agama = $request->agama;
        if ($request->has('batch_id')) $siswa->batch_id = $request->batch_id;
        if ($request->has('nik')) $siswa->nik = $request->nik;
        if ($request->has('pendidikan_terakhir')) $siswa->pendidikan_terakhir = $request->pendidikan_terakhir;
        if ($request->has('desa')) $siswa->desa = $request->desa;
        if ($request->has('kecamatan')) $siswa->kecamatan = $request->kecamatan;
        if ($request->has('kabupaten')) $siswa->kabupaten = $request->kabupaten;
        if ($request->has('provinsi')) $siswa->provinsi = $request->provinsi;
        if ($request->has('tahun_lulus')) $siswa->tahun_lulus = $request->tahun_lulus;
        if ($request->has('tinggi_badan')) $siswa->tinggi_badan = $request->tinggi_badan;
        if ($request->has('berat_badan')) $siswa->berat_badan = $request->berat_badan;
        if ($request->has('goldar')) $siswa->goldar = $request->goldar;
        if ($request->has('ukuran_baju')) $siswa->ukuran_baju = $request->ukuran_baju;
        if ($request->has('status_pernikahan')) $siswa->status_pernikahan = $request->status_pernikahan;
        if ($request->has('no_hp_ortu')) $siswa->no_hp_ortu = $request->no_hp_ortu;
        if ($request->has('nama_ortu')) $siswa->nama_ortu = $request->nama_ortu;
        if ($request->has('keterangan')) $siswa->keterangan = $request->keterangan;
        $siswa->status = $siswa->status ?? 'AKTIF';

        // Handle foto upload for Siswa
        if ($request->hasFile('foto')) {
            $file = $request->file('foto');
            $filename = time() . '_foto_siswa.' . $file->extension();
            $file->move(public_path('uploads/siswa'), $filename);
            $siswa->foto = 'uploads/siswa/' . $filename;
        }

        $siswa->save();

        return response()->json([
            'message' => 'Profil berhasil diperbarui',
            'user' => $user,
            'siswa' => $siswa,
        ]);
    }

    /**
     * POST /api/siswa/data-diri — simpan data matching job (Data Diri & Matching Job).
     * Menyimpan salinan lokal (tabel matching_job_forms) dan meneruskan ke Sistem
     * Penempatan agar data juga tampil di halaman admin /data-kandidat.
     */
    public function storeDataDiri(Request $request)
    {
        $user = Auth::guard('sanctum')->user();
        $payload = $request->json()->all();

        // IP pembatasan: hanya role siswa/kandidat yang boleh.
        if (!in_array($user->role, ['SISWA', 'KANDIDAT'])) {
            return response()->json(['success' => false, 'message' => 'Tidak diizinkan.'], 403);
        }

        $pendaftar = Pendaftar::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->first();

        // 1. Teruskan ke Sistem Penempatan (proxy) untuk menjaga perilaku lama.
        $proxy = new \App\Http\Controllers\PenempatanKandidatController();
        $isUpdate = !empty($payload['penempatan_kandidat_id']);
        $path = $isUpdate
            ? "/api/integrasi/kandidat/{$payload['penempatan_kandidat_id']}"
            : '/api/integrasi/kandidat';
        $method = $isUpdate ? 'PUT' : 'POST';

        $penempatanId = $isUpdate ? $payload['penempatan_kandidat_id'] : null;
        $proxyBody = null;
        $proxyError = null;
        try {
            $client = Http::timeout(30)->withHeaders([
                'x-api-key' => (string) config('services.penempatan.api_key'),
            ]);
            $response = $method === 'PUT'
                ? $client->put(rtrim((string) config('services.penempatan.base_url'), '/') . $path, $payload)
                : $client->post(rtrim((string) config('services.penempatan.base_url'), '/') . $path, $payload);
            $proxyBody = $response->json() ?: [];
            $proxyStatus = $response->status();
            $penempatanId = $proxyBody['data']['id'] ?? ($isUpdate ? $payload['penempatan_kandidat_id'] : null);
        } catch (\Exception $e) {
            Log::error('Siswa storeDataDiri penempatan failed: ' . $e->getMessage());
            $proxyError = 'Gagal terhubung ke Sistem Penempatan.';
        }

        // 2. Simpan salinan lokal (selalu, agar tampil di /data-kandidat).
        $data = collect($payload)->except(['penempatan_kandidat_id'])->all();
        $form = MatchingJobForm::updateOrCreate(
            ['user_id' => $user->id],
            [
                'pendaftar_id' => $pendaftar?->id,
                'penempatan_kandidat_id' => $penempatanId,
                'status_formulir' => $payload['status_formulir'] ?? 'draft',
                'nama' => $payload['nama_romaji'] ?? $user->name,
                'email' => $payload['email'] ?? $user->email,
                'data' => $data,
            ]
        );

        // 2b. Sinkronkan data diri ke tabel siswas & users agar tampil di /data-kandidat.
        if (!empty($payload['jenis_kelamin'])) {
            $payload['jenis_kelamin'] = match (mb_strtolower(trim($payload['jenis_kelamin']))) {
                'laki-laki', 'laki laki', 'l', 'male' => 'L',
                'perempuan', 'p', 'wanita', 'female' => 'P',
                default => $payload['jenis_kelamin'],
            };
        }

        $fieldMap = [
            'nik' => 'nik',
            'jenis_kelamin' => 'jenis_kelamin',
            'tempat_lahir' => 'tempat_lahir',
            'agama' => 'agama',
            'alamat_lengkap' => 'alamat',
            'pendidikan_terakhir' => 'pendidikan_terakhir',
            'tinggi_badan' => 'tinggi_badan',
            'berat_badan' => 'berat_badan',
            'golongan_darah' => 'goldar',
            'ukuran_baju' => 'ukuran_baju',
            'status_pernikahan' => 'status_pernikahan',
            'kontak_ortu_nama' => 'nama_ortu',
            'kontak_ortu_hp' => 'no_hp_ortu',
        ];

        $siswa = Siswa::firstOrNew(['user_id' => $user->id]);
        $dirty = false;
        foreach ($fieldMap as $src => $dst) {
            if (array_key_exists($src, $payload) && $payload[$src] !== null && $payload[$src] !== '') {
                $siswa->$dst = $payload[$src];
                $dirty = true;
            }
        }
        if (!empty($payload['tanggal_lahir'])) {
            try {
                $parsed = \Carbon\Carbon::parse($payload['tanggal_lahir'])->format('Y-m-d');
                $siswa->tanggal_lahir = $parsed;
                $dirty = true;
            } catch (\Throwable $e) {
                // abaikan jika format tanggal tidak bisa di-parse.
            }
        }
        if (!empty($payload['nomor_hp'])) {
            $siswa->no_hp = $payload['nomor_hp'];
            $dirty = true;
        }
        if (blank($siswa->nama)) {
            $siswa->nama = $payload['nama_romaji'] ?? $user->name;
            $dirty = true;
        }
        if ($dirty) {
            $siswa->save();
        }

        // NIK juga ke tabel users sebagai fallback.
        if (!empty($payload['nik'])) {
            $user->nik = $payload['nik'];
            $user->save();
        }

        // Jika proxy gagal terhubung, tetap laporkan sukses lokal + peringatan.
        if ($proxyError) {
            return response()->json([
                'success' => true,
                'partial' => true,
                'message' => 'Data tersimpan lokal, tetapi gagal terhubung ke Sistem Penempatan.',
                'data' => [
                    'id' => $penempatanId,
                    'matching_job_form_id' => $form->id,
                    'status_formulir' => $form->status_formulir,
                ],
            ], 200);
        }

        $responseData = $proxyBody ?: [];
        $responseData['data'] = array_merge($proxyBody['data'] ?? [], [
            'id' => $penempatanId,
            'matching_job_form_id' => $form->id,
            'status_formulir' => $form->status_formulir,
        ]);

        return response()->json(array_merge($responseData, ['success' => ($proxyStatus ?? 200) < 500]));
    }

    public function absensiSaya()
    {
        $user = Auth::guard('sanctum')->user();

        $siswa = Siswa::with(['shift', 'kelasRelasi', 'batchRelasi.cabang'])
            ->where('user_id', $user->id)
            ->first();

        if (!$siswa) {
            return response()->json([
                'message' => 'Data siswa tidak ditemukan',
            ], 404);
        }

        $riwayat = $siswa->absensi()
            ->whereBetween('tanggal', [Carbon::now()->subMonth(), Carbon::now()])
            ->orderBy('tanggal', 'desc')
            ->orderBy('jam_masuk', 'desc')
            ->get();

        // Generate LIBUR entries untuk weekend & hari libur nasional yang tidak ada di DB
        $liburEntries = [];
        $start = Carbon::now()->subMonth()->copy()->startOfDay();
        $end = Carbon::now()->copy()->endOfDay();
        $existingDates = $riwayat->pluck('tanggal')
            ->map(fn($d) => $d instanceof \DateTimeInterface ? $d->format('Y-m-d') : (string) $d)
            ->values();

        $cursor = $start->copy();
        while ($cursor->lte($end)) {
            $dateStr = $cursor->toDateString();
            if (($cursor->isWeekend() || \App\Models\HariLibur::where('tanggal', $dateStr)->exists())
                && !$existingDates->contains($dateStr)) {
                $liburEntries[] = [
                    'id' => 'libur-' . $dateStr,
                    'siswa_id' => $siswa->id,
                    'tanggal' => $dateStr,
                    'jam_masuk' => null,
                    'jam_keluar' => null,
                    'status' => 'LIBUR',
                    'keterangan' => $cursor->isWeekend() ? 'Weekend' : 'Hari Libur Nasional',
                ];
            }
            $cursor->addDay();
        }

        // Generate ALFA untuk hari aktif (weekday, bukan hari libur) yang tidak ada absensi
        $alfaEntries = [];
        $kelasPeriods = \App\Models\KelasSensei::where('batch_id', $siswa->batch_id)
            ->whereNotNull('tanggal_mulai')
            ->whereNotNull('tanggal_selesai')
            ->get(['tanggal_mulai', 'tanggal_selesai']);

        $cursor = $start->copy();
        while ($cursor->lte($end)) {
            $dateStr = $cursor->toDateString();
            $inClassPeriod = $kelasPeriods->contains(function ($k) use ($dateStr) {
                $from = $k->tanggal_mulai instanceof \DateTimeInterface ? $k->tanggal_mulai->toDateString() : substr((string) $k->tanggal_mulai, 0, 10);
                $to = $k->tanggal_selesai instanceof \DateTimeInterface ? $k->tanggal_selesai->toDateString() : substr((string) $k->tanggal_selesai, 0, 10);
                return $dateStr >= $from && $dateStr <= $to;
            });
            if ($inClassPeriod
                && !$cursor->isWeekend()
                && !\App\Models\HariLibur::where('tanggal', $dateStr)->exists()
                && !$existingDates->contains($dateStr)) {
                $alfaEntries[] = [
                    'id' => 'alfa-' . $dateStr,
                    'siswa_id' => $siswa->id,
                    'tanggal' => $dateStr,
                    'jam_masuk' => null,
                    'jam_keluar' => null,
                    'status' => 'ALPA',
                    'keterangan' => 'Tidak hadir tanpa keterangan',
                ];
            }
            $cursor->addDay();
        }

        $riwayat = collect($liburEntries)->merge($alfaEntries)->merge($riwayat)->sortByDesc('tanggal')->values();

        // Kelas aktif untuk siswa ini
        $batchId = $siswa->batch_id;
        $kelasList = [];
        if ($batchId) {
            $kelasSensei = KelasSensei::with(['user', 'batchRelasi'])
                ->where('batch_id', $batchId)
                ->orderBy('level')
                ->get();

            foreach ($kelasSensei as $ks) {
                $absensiQuery = \App\Models\AbsensiSiswa::where('siswa_id', $siswa->id)
                    ->where('kelas_sensei_id', $ks->id);

                $totalPertemuan = \App\Models\AbsensiSiswa::where('kelas_sensei_id', $ks->id)
                    ->distinct('tanggal')->count('tanggal');
                $absenTerisi = (clone $absensiQuery)->whereNotNull('jam_masuk')->count();
                $alpa = (clone $absensiQuery)->where('status', 'alpha')->count();
                $izin = (clone $absensiQuery)->where('status', 'izin')->count();

                $today = now()->toDateString();
                $mulai = $ks->tanggal_mulai?->toDateString();
                $selesai = $ks->tanggal_selesai?->toDateString();
                $status = 'selesai';
                if ($ks->status === 'aktif' && $mulai && $selesai && $today >= $mulai && $today <= $selesai) {
                    $status = 'aktif';
                } elseif ($ks->status === 'aktif' && $mulai && $today < $mulai) {
                    $status = 'belum_mulai';
                }

                $kelasList[] = [
                    'id' => $ks->id,
                    'batch_id' => $ks->batch_id,
                    'batch' => $ks->batchRelasi->nama_batch ?? '-',
                    'level' => $ks->level,
                    'nama_kelas' => $ks->nama_kelas,
                    'sensei' => $ks->user->name ?? '-',
                    'tanggal_mulai' => $mulai,
                    'tanggal_selesai' => $selesai,
                    'total_pertemuan' => $totalPertemuan,
                    'absen_terisi' => $absenTerisi,
                    'alpa' => $alpa,
                    'izin' => $izin,
                    'status' => $status,
                ];
            }
        }

        return response()->json([
            'siswa' => $siswa,
            'riwayat' => $riwayat,
            'kelas_aktif' => $kelasList,
        ]);
    }

    public function siswaBatches()
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $siswa = Siswa::where('user_id', $user->id)->first();
        if (!$siswa) {
            return response()->json(['message' => 'Data siswa tidak ditemukan'], 404);
        }

        $batchIds = \App\Models\StudentAssessment::where('siswa_id', $siswa->id)
            ->whereNotNull('nilai')
            ->distinct()
            ->pluck('batch_id');

        if ($batchIds->isEmpty() && $siswa->batch_id) {
            $batchIds->push($siswa->batch_id);
        }

        $batches = Batch::whereIn('id', $batchIds)
            ->orderByDesc('id')
            ->get()
            ->map(function ($b) {
                $jadwalLevels = \App\Models\JadwalLevel::where('batch_id', $b->id)
                    ->orderBy('level')
                    ->get(['level', 'tanggal_mulai', 'tanggal_selesai']);

                return [
                    'id' => $b->id,
                    'nama_batch' => $b->nama_batch,
                    'tanggal_mulai' => $b->tanggal_mulai?->format('Y-m-d'),
                    'tanggal_selesai' => $b->tanggal_selesai?->format('Y-m-d'),
                    'levels' => $jadwalLevels->map(fn($j) => [
                        'level' => $j->level,
                        'tanggal_mulai' => $j->tanggal_mulai?->format('Y-m-d'),
                        'tanggal_selesai' => $j->tanggal_selesai?->format('Y-m-d'),
                    ]),
                ];
            });

        return response()->json(['batches' => $batches]);
    }

    public function nilaiSaya(Request $request, $batchId)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $siswa = Siswa::where('user_id', $user->id)->first();
        if (!$siswa) {
            return response()->json(['message' => 'Data siswa tidak ditemukan'], 404);
        }

        $levelParam = $request->query('level');

        $componentQuery = \App\Models\AssessmentComponent::with('category')
            ->whereHas('category', function ($q) use ($levelParam) {
                if ($levelParam) {
                    $q->where('level', $levelParam);
                }
            });

        $components = $componentQuery->get();

        $assessments = \App\Models\StudentAssessment::where('siswa_id', $siswa->id)
            ->where('batch_id', $batchId)
            ->whereNotNull('nilai')
            ->with('component.category')
            ->get();

        $dailyGroups = $assessments->groupBy('tanggal')->sortKeysDesc();

        $daily = [];
        foreach ($dailyGroups as $tanggal => $items) {
            $componentScores = [];
            $totalAvg = 0;
            $countComponents = 0;

            foreach ($items as $item) {
                $compName = $item->component->sub_komponen ?? '-';
                $componentScores[] = [
                    'nama' => $compName,
                    'nilai' => (float) $item->nilai,
                ];
                $totalAvg += (float) $item->nilai;
                $countComponents++;
            }

            usort($componentScores, fn($a, $b) => strcmp($a['nama'], $b['nama']));

            $daily[] = [
                'tanggal' => $tanggal,
                'rata_rata' => $countComponents > 0 ? round($totalAvg / $countComponents, 1) : null,
                'komponen' => $componentScores,
            ];
        }

        $allNilai = $assessments->pluck('nilai')->map(fn($v) => (float) $v);
        $overallAvg = $allNilai->isNotEmpty() ? round($allNilai->avg(), 1) : null;

        return response()->json([
            'overall_avg' => $overallAvg,
            'total_penilaian' => $allNilai->count(),
            'total_hari' => $dailyGroups->count(),
            'daily' => array_values($daily),
        ]);
    }

    public function nilaiLms(Request $request)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $siswa = Siswa::where('user_id', $user->id)->first();
        if (!$siswa) {
            return response()->json(['message' => 'Data siswa tidak ditemukan'], 404);
        }

        $batchId = $request->query('batch_id') ?: $siswa->batch_id;
        if (!$batchId) {
            return response()->json([
                'batch' => null,
                'levels' => [],
                'summary' => ['overall_avg' => null, 'total_penilaian' => 0, 'total_hari' => 0],
            ]);
        }

        $batch = Batch::find($batchId);

        $assessments = \App\Models\StudentAssessment::where('siswa_id', $siswa->id)
            ->where('batch_id', $batchId)
            ->whereNotNull('nilai')
            ->with('component.category')
            ->get();

        $dailyGroups = $assessments->groupBy('tanggal')->sortKeysDesc();

        $daily = [];
        foreach ($dailyGroups as $tanggal => $items) {
            $componentScores = [];
            $totalAvg = 0;
            $countComponents = 0;

            foreach ($items as $item) {
                $compName = $item->component->sub_komponen ?? '-';
                $level = $item->component->category->level ?? '-';
                $componentScores[] = [
                    'nama' => $compName,
                    'nilai' => (float) $item->nilai,
                    'level' => $level,
                ];
                $totalAvg += (float) $item->nilai;
                $countComponents++;
            }

            $daily[] = [
                'tanggal' => $tanggal,
                'rata_rata' => $countComponents > 0 ? round($totalAvg / $countComponents, 1) : null,
                'komponen' => $componentScores,
            ];
        }

        $allNilai = $assessments->pluck('nilai')->map(fn($v) => (float) $v);
        $overallAvg = $allNilai->isNotEmpty() ? round($allNilai->avg(), 1) : null;

        $levelGroups = $assessments->groupBy(fn($a) => $a->component->category->level ?? 'Umum');
        $levels = [];
        foreach ($levelGroups as $levelName => $levelAssessments) {
            $levelDaily = $levelAssessments->groupBy('tanggal')->sortKeysDesc();
            $levelDailyArr = [];
            foreach ($levelDaily as $tanggal => $items) {
                $componentScores = [];
                $totalAvg = 0;
                $count = 0;
                foreach ($items as $item) {
                    $componentScores[] = [
                        'nama' => $item->component->sub_komponen ?? '-',
                        'nilai' => (float) $item->nilai,
                    ];
                    $totalAvg += (float) $item->nilai;
                    $count++;
                }
                $levelDailyArr[] = [
                    'tanggal' => $tanggal,
                    'rata_rata' => $count > 0 ? round($totalAvg / $count, 1) : null,
                    'komponen' => $componentScores,
                ];
            }
            $levelNilai = $levelAssessments->pluck('nilai')->map(fn($v) => (float) $v);
            $levels[] = [
                'level' => $levelName,
                'rata_rata' => $levelNilai->isNotEmpty() ? round($levelNilai->avg(), 1) : null,
                'total_pertemuan' => $levelDaily->count(),
                'total_nilai' => $levelNilai->count(),
                'daily' => $levelDailyArr,
            ];
        }
        usort($levels, fn($a, $b) => strcmp($a['level'], $b['level']));

        return response()->json([
            'batch' => $batch ? [
                'id' => $batch->id,
                'nama_batch' => $batch->nama_batch,
                'tanggal_mulai' => $batch->tanggal_mulai?->format('Y-m-d'),
                'tanggal_selesai' => $batch->tanggal_selesai?->format('Y-m-d'),
            ] : null,
            'levels' => $levels,
            'summary' => [
                'overall_avg' => $overallAvg,
                'total_penilaian' => $allNilai->count(),
                'total_hari' => $dailyGroups->count(),
            ],
            'daily' => $daily,
        ]);
    }

    public function evaluations(Request $request)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);

        $siswa = Siswa::where('user_id', $user->id)->first();
        if (!$siswa) return response()->json(['message' => 'Data siswa tidak ditemukan'], 404);

        $batchId = $request->query('batch_id') ?: $siswa->batch_id;

        $evaluations = \App\Models\LevelEvaluation::where('siswa_id', $siswa->id)
            ->where('batch_id', $batchId)
            ->with('user:name')
            ->get()
            ->keyBy('level');

        return response()->json(['evaluations' => $evaluations]);
    }

    public function storeStudentEvaluation(Request $request)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);

        $siswa = Siswa::where('user_id', $user->id)->first();
        if (!$siswa) return response()->json(['message' => 'Data siswa tidak ditemukan'], 404);

        $request->validate([
            'batch_id' => 'required|exists:batches,id',
            'level' => 'required|string',
            'rating' => 'nullable|integer|min:1|max:5',
            'komentar' => 'nullable|string|max:1000',
            'scores' => 'nullable|array',
            'scores.*' => 'nullable|integer|min:1|max:5',
            'text_responses' => 'nullable|array',
            'text_responses.*' => 'nullable|string|max:1000',
        ]);

        $eval = \App\Models\StudentEvaluation::updateOrCreate(
            ['siswa_id' => $siswa->id, 'batch_id' => $request->batch_id, 'level' => $request->level],
            [
                'rating' => $request->rating,
                'komentar' => $request->komentar,
                'scores' => $request->scores,
                'text_responses' => $request->text_responses,
            ]
        );

        return response()->json(['success' => true, 'data' => $eval], 201);
    }

    public function getStudentEvaluations(Request $request)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);

        $siswa = Siswa::where('user_id', $user->id)->first();
        if (!$siswa) return response()->json(['message' => 'Data siswa tidak ditemukan'], 404);

        $batchId = $request->query('batch_id') ?: $siswa->batch_id;

        $evaluations = \App\Models\StudentEvaluation::where('siswa_id', $siswa->id)
            ->where('batch_id', $batchId)
            ->get()
            ->keyBy('level');

        return response()->json(['evaluations' => $evaluations]);
    }
}
