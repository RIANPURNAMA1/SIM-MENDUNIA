<?php

namespace App\Http\Controllers;

use App\Models\AbsensiSensei;
use App\Models\AbsensiSiswa;
use App\Models\Batch;
use App\Models\Cabang;
use App\Models\Course;
use App\Models\CourseFile;
use App\Models\Lesson;
use Illuminate\Support\Facades\Storage;
use App\Models\DailyAssessmentStatus;
use App\Models\LmsAssignment;
use App\Models\LmsSubmission;
use App\Models\Siswa;
use App\Models\Guru;
use App\Models\HariLibur;
use App\Models\KelasSensei;
use App\Models\Shift;
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
            'tanggal_mulai' => 'nullable|date',
            'tanggal_selesai' => 'nullable|date|after_or_equal:tanggal_mulai',
            'catatan' => 'nullable|string',
        ]);

        $tanggalMulai = $request->tanggal_mulai;
        $tanggalSelesai = $request->tanggal_selesai;

        if (!$tanggalMulai && $request->batch_id && $request->level) {
            $jadwal = \App\Models\JadwalLevel::where('batch_id', $request->batch_id)
                ->where('level', $request->level)
                ->first();
            if ($jadwal) {
                $tanggalMulai = $jadwal->tanggal_mulai->format('Y-m-d');
                $tanggalSelesai = $jadwal->tanggal_selesai->format('Y-m-d');
            }
        }

        if (!$tanggalMulai || !$tanggalSelesai) {
            return response()->json(['message' => 'Tanggal mulai dan selesai wajib diisi atau atur di Jadwal Level'], 422);
        }

        $kelas = KelasSensei::create([
            'user_id' => $user->id,
            'batch_id' => $request->batch_id,
            'nama_kelas' => $request->nama_kelas,
            'level' => $request->level,
            'tanggal_mulai' => $tanggalMulai,
            'tanggal_selesai' => $tanggalSelesai,
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

    // ========== Guru LMS ==========

    public function lmsCourses()
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $kelasList = KelasSensei::where('user_id', $user->id)
            ->with('batchRelasi')
            ->get();

        $batchIds = $kelasList->pluck('batch_id')->unique()->filter()->values();

        $courses = collect();
        if ($batchIds->isNotEmpty()) {
            $courses = Course::withCount(['lessons' => function ($q) {
                $q->where('status', 'aktif');
            }])
                ->withCount('files')
                ->whereIn('batch_id', $batchIds)
                ->orWhereNull('batch_id')
                ->orderBy('sort')
                ->get();
        }

        $batches = Batch::whereIn('id', $batchIds)->get(['id', 'nama_batch']);

        $batchLevels = [];
        foreach ($kelasList as $k) {
            if (!$k->batch_id) continue;
            $lvl = $k->level;
            $batchId = $k->batch_id;
            if ($lvl && !isset($batchLevels[$batchId])) {
                $batchLevels[$batchId] = [];
            }
            if ($lvl && !in_array($lvl, $batchLevels[$batchId])) {
                $batchLevels[$batchId][] = $lvl;
            }
        }

        return response()->json([
            'courses' => $courses,
            'batches' => $batches,
            'batch_levels' => $batchLevels,
        ]);
    }

    public function lmsCourseDetail($id)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $course = Course::with(['lessons' => function ($q) {
            $q->aktif()->orderBy('sort');
        }, 'files'])->findOrFail($id);

        return response()->json([
            'course' => $course,
        ]);
    }

    public function lmsStoreCourse(Request $request)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'level' => 'nullable|string|max:50',
            'batch_id' => 'required|exists:batches,id',
            'sort' => 'nullable|integer|min:0',
            'status' => 'nullable|in:aktif,nonaktif',
            'image' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('lms/courses', 'public');
        }

        $course = Course::create($data);

        return response()->json(['course' => $course->loadCount('lessons')->loadCount('files')], 201);
    }

    public function lmsUpdateCourse(Request $request, $id)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $course = Course::findOrFail($id);

        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'level' => 'nullable|string|max:50',
            'batch_id' => 'nullable|exists:batches,id',
            'sort' => 'nullable|integer|min:0',
            'status' => 'nullable|in:aktif,nonaktif',
            'image' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        if ($request->hasFile('image')) {
            if ($course->image) {
                Storage::disk('public')->delete($course->image);
            }
            $data['image'] = $request->file('image')->store('lms/courses', 'public');
        }

        $course->update($data);

        return response()->json(['course' => $course->fresh()->loadCount('lessons')->loadCount('files')]);
    }

    public function lmsDeleteCourse($id)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $course = Course::findOrFail($id);
        if ($course->image) {
            Storage::disk('public')->delete($course->image);
        }
        $course->delete();

        return response()->json(['message' => 'Course deleted']);
    }

    public function lmsCourseFiles($courseId)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $files = CourseFile::where('course_id', $courseId)->orderBy('created_at', 'desc')->get();

        return response()->json(['files' => $files]);
    }

    public function lmsStoreCourseFile(Request $request)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $data = $request->validate([
            'course_id' => 'required|exists:lms_courses,id',
            'file' => 'required|file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt,jpg,jpeg,png|max:51200',
        ]);

        $file = $request->file('file');
        $path = $file->store('lms/course-files', 'public');

        $courseFile = CourseFile::create([
            'course_id' => $data['course_id'],
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'file_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
        ]);

        return response()->json(['file' => $courseFile], 201);
    }

    public function lmsDeleteCourseFile($id)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $courseFile = CourseFile::findOrFail($id);
        Storage::disk('public')->delete($courseFile->file_path);
        $courseFile->delete();

        return response()->json(['message' => 'File deleted']);
    }

    // ========== Guru Lesson Management ==========

    public function guruLessons($courseId)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $course = Course::withCount('lessons')->findOrFail($courseId);
        $lessons = $course->lessons()->orderBy('sort')->get();

        return response()->json(['course' => $course, 'lessons' => $lessons]);
    }

    public function guruStoreLesson(Request $request)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $data = $request->validate([
            'course_id' => 'required|exists:lms_courses,id',
            'title' => 'required|string|max:255',
            'content' => 'nullable|string',
            'video_url' => 'nullable|string|max:500',
            'file' => 'nullable|file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt|max:51200',
            'sort' => 'nullable|integer|min:0',
            'status' => 'nullable|in:aktif,nonaktif',
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $data['file_path'] = $file->store('lms/lesson-files', 'public');
            $data['file_name'] = $file->getClientOriginalName();
            $data['file_type'] = $file->getMimeType();
            $data['file_size'] = $file->getSize();
        }

        unset($data['file']);
        $lesson = Lesson::create($data);

        return response()->json(['lesson' => $lesson], 201);
    }

    public function guruUpdateLesson(Request $request, $id)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $lesson = Lesson::findOrFail($id);

        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'content' => 'nullable|string',
            'video_url' => 'nullable|string|max:500',
            'file' => 'nullable|file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt|max:51200',
            'sort' => 'nullable|integer|min:0',
            'status' => 'nullable|in:aktif,nonaktif',
        ]);

        if ($request->hasFile('file')) {
            if ($lesson->file_path) {
                Storage::disk('public')->delete($lesson->file_path);
            }
            $file = $request->file('file');
            $data['file_path'] = $file->store('lms/lesson-files', 'public');
            $data['file_name'] = $file->getClientOriginalName();
            $data['file_type'] = $file->getMimeType();
            $data['file_size'] = $file->getSize();
        }

        unset($data['file']);
        $lesson->update($data);

        return response()->json(['lesson' => $lesson->fresh()]);
    }

    public function guruDeleteLesson($id)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        Lesson::findOrFail($id)->delete();

        return response()->json(['message' => 'Lesson deleted']);
    }

    // ========== Guru Assignment Management ==========

    public function lmsAssignments($courseId)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);

        $course = Course::findOrFail($courseId);
        $assignments = LmsAssignment::where('course_id', $courseId)
            ->withCount('submissions')
            ->orderBy('created_at', 'desc')
            ->get();

        $siswaList = collect();
        if ($course->batch_id) {
            $siswaList = Siswa::where('batch_id', $course->batch_id)
                ->where('status', 'AKTIF')
                ->get(['id', 'nama']);
        }

        // format due_date to date only
        $assignments->transform(function ($a) {
            if ($a->due_date) {
                $a->due_date = $a->due_date->format('Y-m-d');
            }
            return $a;
        });
        return response()->json([
            'course' => $course,
            'assignments' => $assignments,
            'siswa_list' => $siswaList,
        ]);
    }

    public function lmsStoreAssignment(Request $request)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);

        $data = $request->validate([
            'course_id' => 'required|exists:lms_courses,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
            'max_score' => 'nullable|integer|min:1|max:999',
            'status' => 'nullable|in:aktif,nonaktif',
            'file' => 'nullable|file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt,jpg,jpeg,png,zip,rar|max:51200',
        ]);

        if ($request->hasFile('file')) {
            $data['file_path'] = $request->file('file')->store('lms/assignments', 'public');
            $data['file_name'] = $request->file('file')->getClientOriginalName();
        }

        $assignment = LmsAssignment::create($data);
        return response()->json(['assignment' => $assignment], 201);
    }

    public function lmsUpdateAssignment(Request $request, $id)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);

        $assignment = LmsAssignment::findOrFail($id);

        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
            'max_score' => 'nullable|integer|min:1|max:999',
            'status' => 'nullable|in:aktif,nonaktif',
            'file' => 'nullable|file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt,jpg,jpeg,png,zip,rar|max:51200',
        ]);

        if ($request->hasFile('file')) {
            if ($assignment->file_path) {
                Storage::disk('public')->delete($assignment->file_path);
            }
            $data['file_path'] = $request->file('file')->store('lms/assignments', 'public');
            $data['file_name'] = $request->file('file')->getClientOriginalName();
        }

        $assignment->update($data);
        return response()->json(['assignment' => $assignment->fresh()]);
    }

    public function lmsDeleteAssignment($id)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);

        $assignment = LmsAssignment::findOrFail($id);
        if ($assignment->file_path) {
            Storage::disk('public')->delete($assignment->file_path);
        }
        $assignment->delete();

        return response()->json(['message' => 'Assignment deleted']);
    }

    public function lmsAssignmentSubmissions($id)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);

        $assignment = LmsAssignment::with('course')->findOrFail($id);
        $submissions = LmsSubmission::where('assignment_id', $id)
            ->with('siswa')
            ->orderBy('created_at', 'desc')
            ->get();

        $siswaList = collect();
        if ($assignment->course->batch_id) {
            $siswaList = Siswa::where('batch_id', $assignment->course->batch_id)
                ->where('status', 'AKTIF')
                ->get(['id', 'nama']);
        }

        return response()->json([
            'assignment' => $assignment,
            'submissions' => $submissions,
            'siswa_list' => $siswaList,
        ]);
    }

    public function lmsGradeSubmission(Request $request, $id)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);

        $data = $request->validate([
            'score' => 'required|numeric|min:0|max:999',
            'feedback' => 'nullable|string',
        ]);

        $submission = LmsSubmission::findOrFail($id);
        $submission->update([
            'score' => $data['score'],
            'feedback' => $data['feedback'] ?? null,
            'graded_at' => now(),
        ]);

        return response()->json(['submission' => $submission->fresh()->load('siswa')]);
    }

    // ========== Student Assignment (via Guru endpoint for now, or in LmsController) ==========

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

    public function batchDanNilai()
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $today = now()->toDateString();

        $kelasList = KelasSensei::where('user_id', $user->id)
            ->with('batchRelasi')
            ->orderBy('created_at', 'desc')
            ->get();

        $batchMap = [];
        foreach ($kelasList as $k) {
            if (!$k->batch_id) continue;
            if (!isset($batchMap[$k->batch_id])) {
                $batchMap[$k->batch_id] = [
                    'id' => $k->batchRelasi->id ?? $k->batch_id,
                    'nama_batch' => $k->batchRelasi->nama_batch ?? 'Batch #' . $k->batch_id,
                    'levels' => [],
                ];
            }
            $lvl = $k->level;
            if ($lvl && !in_array($lvl, $batchMap[$k->batch_id]['levels'])) {
                $batchMap[$k->batch_id]['levels'][] = $lvl;
            }
        }

        $batchIds = array_keys($batchMap);
        $siswaPerBatch = Siswa::whereIn('batch_id', $batchIds)->count();

        $totalSiswaPerBatch = Siswa::whereIn('batch_id', $batchIds)
            ->selectRaw('batch_id, COUNT(*) as total')
            ->groupBy('batch_id')
            ->pluck('total', 'batch_id');

        $allLevels = ['1', '2', '3', '4'];

        $categoriesByLevel = \App\Models\AssessmentCategory::with('components')->get()->groupBy('level');

        $assessmentsByBatch = \App\Models\StudentAssessment::where('user_id', $user->id)
            ->whereIn('batch_id', $batchIds)
            ->whereNotNull('nilai')
            ->get()
            ->groupBy('batch_id');

        $results = [];
        foreach ($batchMap as $batchId => $batch) {
            $batchAssessments = $assessmentsByBatch[$batchId] ?? collect();
            $levelsData = [];

            foreach ($batch['levels'] as $lvl) {
                $categories = $categoriesByLevel[$lvl] ?? collect();
                $categoriesData = [];

                foreach ($categories as $cat) {
                    $componentIds = $cat->components->pluck('id');
                    $catAssessments = $batchAssessments->whereIn('component_id', $componentIds);

                    $componentsData = [];
                    foreach ($cat->components as $comp) {
                        $compScores = $catAssessments->where('component_id', $comp->id)->pluck('nilai')->filter()->values();
                        $componentsData[] = [
                            'nama' => $comp->sub_komponen,
                            'avg' => $compScores->isNotEmpty() ? round($compScores->avg(), 1) : null,
                            'total_penilaian' => $compScores->count(),
                        ];
                    }

                    $catScores = $catAssessments->pluck('nilai')->filter()->values();
                    $categoriesData[] = [
                        'nama' => $cat->nama_kategori,
                        'avg' => $catScores->isNotEmpty() ? round($catScores->avg(), 1) : null,
                        'total_penilaian' => $catScores->count(),
                        'components' => $componentsData,
                    ];
                }

                $levelScores = $batchAssessments->filter(function ($a) use ($lvl, $categoriesByLevel) {
                    $catIds = ($categoriesByLevel[$lvl] ?? collect())->pluck('components')->flatten()->pluck('id');
                    return $catIds->contains($a->component_id);
                })->pluck('nilai')->filter()->values();

                $levelsData[] = [
                    'level' => $lvl,
                    'avg' => $levelScores->isNotEmpty() ? round($levelScores->avg(), 1) : null,
                    'total_penilaian' => $levelScores->count(),
                    'categories' => $categoriesData,
                ];
            }

            $results[] = [
                'id' => $batch['id'],
                'nama_batch' => $batch['nama_batch'],
                'total_siswa' => $totalSiswaPerBatch[$batchId] ?? 0,
                'levels' => $levelsData,
            ];
        }

        return response()->json([
            'batches' => $results,
        ]);
    }

    public function rankingBatch($batchId)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $batch = \App\Models\Batch::find($batchId);
        if (!$batch) {
            return response()->json(['message' => 'Batch not found'], 404);
        }

        $siswaList = Siswa::where('batch_id', $batchId)
            ->where('status', 'AKTIF')
            ->orderBy('nama')
            ->get(['id', 'nama', 'level']);

        $siswaIds = $siswaList->pluck('id');

        $assessments = \App\Models\StudentAssessment::where('batch_id', $batchId)
            ->whereIn('siswa_id', $siswaIds)
            ->whereNotNull('nilai')
            ->with('component.category')
            ->get();

        $rankings = [];
        foreach ($siswaList as $siswa) {
            $siswaAssessments = $assessments->where('siswa_id', $siswa->id);
            $scores = $siswaAssessments->pluck('nilai')->map(fn($v) => (float) $v);
            $avg = $scores->isNotEmpty() ? round($scores->avg(), 1) : null;

            $levelGroups = $siswaAssessments->groupBy(fn($a) => $a->component->category->level ?? 'Umum');
            $levelScores = [];
            foreach ($levelGroups as $lvl => $items) {
                $lvlScores = $items->pluck('nilai')->map(fn($v) => (float) $v);
                $levelScores[] = [
                    'level' => $lvl,
                    'avg' => $lvlScores->isNotEmpty() ? round($lvlScores->avg(), 1) : null,
                    'total' => $lvlScores->count(),
                ];
            }

            $rankings[] = [
                'siswa_id' => $siswa->id,
                'nama' => $siswa->nama,
                'level' => $siswa->level,
                'rata_rata' => $avg,
                'total_nilai' => $scores->count(),
                'levels' => $levelScores,
            ];
        }

        usort($rankings, function ($a, $b) {
            if ($a['rata_rata'] === null && $b['rata_rata'] === null) return 0;
            if ($a['rata_rata'] === null) return 1;
            if ($b['rata_rata'] === null) return -1;
            return $b['rata_rata'] <=> $a['rata_rata'];
        });

        foreach ($rankings as $i => &$r) {
            $r['rank'] = $r['rata_rata'] !== null ? $i + 1 : null;
        }

        return response()->json([
            'batch' => [
                'id' => $batch->id,
                'nama_batch' => $batch->nama_batch,
            ],
            'rankings' => $rankings,
        ]);
    }

    public function storeLevelEvaluation(Request $request)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);

        $data = $request->validate([
            'siswa_id' => 'required|exists:siswas,id',
            'batch_id' => 'required|exists:batches,id',
            'level' => 'required|string',
            'evaluasi' => 'nullable|string|max:2000',
        ]);

        $evaluation = \App\Models\LevelEvaluation::updateOrCreate(
            [
                'siswa_id' => $data['siswa_id'],
                'batch_id' => $data['batch_id'],
                'level' => $data['level'],
            ],
            [
                'user_id' => $user->id,
                'evaluasi' => $data['evaluasi'],
            ]
        );

        return response()->json(['evaluation' => $evaluation], 201);
    }

    public function getLevelEvaluations(Request $request, $batchId, $level)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);

        $evaluations = \App\Models\LevelEvaluation::where('batch_id', $batchId)
            ->where('level', $level)
            ->get()
            ->keyBy('siswa_id');

        $result = [];
        foreach ($evaluations as $siswaId => $ev) {
            $result[$siswaId] = [
                'evaluasi' => $ev->evaluasi,
                'updated_at' => $ev->updated_at,
            ];
        }

        return response()->json(['evaluations' => $result]);
    }
}
