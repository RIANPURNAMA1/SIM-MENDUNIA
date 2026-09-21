<?php

namespace App\Http\Controllers;

use App\Models\AbsensiSiswa;
use App\Models\Batch;
use App\Models\Course;
use App\Models\CourseFile;
use App\Models\KelasSensei;
use App\Models\Lesson;
use App\Models\LessonRecap;
use App\Models\LessonSlide;
use App\Models\LmsAssignment;
use App\Models\LmsCategory;
use App\Models\LmsSubmission;
use App\Models\LmsProgress;
use App\Models\LmsSetting;
use App\Models\Pendaftar;
use App\Models\QuizAttempt;
use App\Models\Siswa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class LmsController extends Controller
{
    private const VIDEO_PERCENT_DONE = 95;
    private const MODUL_MIN_SECONDS = 30;

    private function getSiswa()
    {
        $user = Auth::guard('sanctum')->user();
        $siswa = Siswa::where('user_id', $user->id)->first();
        if ($siswa) {
            return $siswa;
        }

        // Kandidat yang pendaftarannya disetujui otomatis dibuatkan record
        // siswa saat pertama kali mengakses LMS (sinkron dari data pendaftaran).
        $pendaftar = Pendaftar::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$pendaftar || $pendaftar->status_pendaftaran !== 'disetujui') {
            return null;
        }

        return Siswa::firstOrCreate(
            ['user_id' => $user->id],
            [
                'nama' => $pendaftar->nama,
                'no_registrasi' => $pendaftar->no_registrasi,
                'batch_id' => $pendaftar->batch_id,
                'batch' => $pendaftar->batch?->nama_batch,
            ]
        );
    }

    private function lessonFallsOnWeekend(Lesson $lesson): bool
    {
        $text = preg_replace('/<[^>]+>/', ' ', (string) $lesson->content);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        if (!preg_match('/(?<!\d)(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(?!\d)/', $text, $m)) {
            return false;
        }

        $months = [
            'jan' => 1, 'feb' => 2, 'mar' => 3, 'apr' => 4, 'mei' => 5, 'may' => 5,
            'jun' => 6, 'jul' => 7, 'agu' => 8, 'aug' => 8, 'ags' => 8,
            'sep' => 9, 'okt' => 10, 'oct' => 10, 'nov' => 11, 'des' => 12, 'dec' => 12,
        ];
        $month = $months[strtolower(substr($m[2], 0, 3))] ?? null;
        if (!$month) {
            return false;
        }

        try {
            return \Carbon\Carbon::create((int) $m[3], $month, (int) $m[1])->isWeekend();
        } catch (\Throwable $e) {
            return false;
        }
    }

    private function progressPayload(Lesson $lesson, ?LmsProgress $progress)
    {
        $videoRequired = !empty($lesson->video_url);
        $readRequired = !empty($lesson->content);
        $videoPercent = (int) ($progress?->video_percent ?? 0);
        $readSeconds = (int) ($progress?->read_seconds ?? 0);

        return [
            'lesson_id' => $lesson->id,
            'video_required' => $videoRequired,
            'read_required' => $readRequired,
            'video_watched_seconds' => (int) ($progress?->video_watched_seconds ?? 0),
            'video_duration_seconds' => (int) ($progress?->video_duration_seconds ?? 0),
            'video_percent' => $videoPercent,
            'read_seconds' => $readSeconds,
            'video_green' => !$videoRequired || $videoPercent >= self::VIDEO_PERCENT_DONE,
            'read_green' => !$readRequired || $readSeconds >= self::MODUL_MIN_SECONDS,
            'video_green_percent' => self::VIDEO_PERCENT_DONE,
            'modul_min_seconds' => self::MODUL_MIN_SECONDS,
        ];
    }

    // ========== Student-facing ==========

    public function courses()
    {
        $siswa = $this->getSiswa();
        if (!$siswa) {
            return response()->json(['courses' => []]);
        }

        $query = Course::withCount(['lessons' => function ($q) {
            $q->where('status', 'aktif');
        }])->orderBy('sort');

        if ($siswa->batch_id) {
            $query->where(function ($q) use ($siswa) {
                $q->where('batch_id', $siswa->batch_id)
                  ->orWhereNull('batch_id');
            });
        }

        if ($siswa->level) {
            $query->where(function ($q) use ($siswa) {
                $q->where('level', $siswa->level)
                  ->orWhereNull('level');
            });
        }

        $courses = $query->with(['category', 'batch:id,nama_batch'])->get();

        // Periode (tanggal mulai & selesai) per (batch, level) dari jadwal_levels
        // agar bisa ditampilkan di header LMS siswa bersama statusnya.
        $jadwalLevels = \App\Models\JadwalLevel::whereIn('batch_id', $courses->pluck('batch_id')->filter()->unique())
            ->get(['batch_id', 'level', 'tanggal_mulai', 'tanggal_selesai'])
            ->mapWithKeys(fn ($j) => [$j->batch_id . '-' . (string) $j->level => $j]);

        $courses->each(function ($course) use ($jadwalLevels) {
            $course->has_password = !empty($course->password_course);
            $course->tanggal_mulai = null;
            $course->tanggal_selesai = null;
            if ($course->batch_id && $course->level !== null) {
                $jadwal = $jadwalLevels[$course->batch_id . '-' . (string) $course->level] ?? null;
                if ($jadwal) {
                    $course->tanggal_mulai = $jadwal->tanggal_mulai ? $jadwal->tanggal_mulai->format('Y-m-d') : null;
                    $course->tanggal_selesai = $jadwal->tanggal_selesai ? $jadwal->tanggal_selesai->format('Y-m-d') : null;
                }
            }
        });

        return response()->json(['courses' => $courses]);
    }

    public function courseDetail(Request $request, $id)
    {
        $siswa = $this->getSiswa();
        if (!$siswa) {
            return response()->json(['message' => 'Siswa not found'], 404);
        }

        $course = Course::aktif()->with(['lessons' => function ($q) {
            $q->aktif()->orderBy('sort')->with('slides');
        }])->findOrFail($id);

        if (!empty($course->password_course)) {
            $password = (string) $request->header('X-Password-Course', $request->query('password_course', ''));
            if (!hash_equals((string) $course->password_course, $password)) {
                return response()->json(['message' => 'Password kursus salah atau belum dimasukkan.'], 403);
            }
        }

        $course->setRelation(
            'lessons',
            $course->lessons->reject(fn ($lesson) => $this->lessonFallsOnWeekend($lesson))->values()
        );

        $progresses = LmsProgress::where('siswa_id', $siswa->id)
            ->whereIn('lesson_id', $course->lessons->pluck('id'))
            ->get()
            ->keyBy('lesson_id');

        $completedLessonIds = $progresses->filter(fn ($p) => $p->completed_at !== null)
            ->keys()
            ->toArray();

        $lessonProgress = $course->lessons->mapWithKeys(function ($l) use ($progresses) {
            $p = $progresses->get($l->id);
            $payload = $this->progressPayload($l, $p);
            $payload['completed'] = $p && $p->completed_at !== null;
            return [$l->id => $payload];
        });

        $meetingDates = [];
        $kelas = null;
        if ($course->kelas_sensei_id) {
            $kelas = KelasSensei::find($course->kelas_sensei_id);
            if ($kelas) {
                $meetingDates = $kelas->daftarPertemuan();
            }
        }

        // Jumlah pertemuan yang benar-benar dihadiri siswa (hadir / masuk).
        // Absensi via QR/face scan umumnya TIDAK mengisi kolom kelas_sensei_id,
        // jadi agar tidak salah terkunci, kita cocokkan berdasar TANGGAL pertemuan
        // dalam rentang kelas, bukan mencocokkan kelas_sensei_id.
        $attendedCount = 0;
        if (count($meetingDates) > 0 && $kelas) {
            $presentDates = AbsensiSiswa::where('siswa_id', $siswa->id)
                ->whereRaw("LOWER(status) IN ('hadir', 'terlambat', 'pulang lebih awal', 'tidak absen pulang')")
                ->whereBetween('tanggal', [$kelas->tanggal_mulai, $kelas->tanggal_selesai])
                ->pluck('tanggal')
                ->map(fn ($d) => \Carbon\Carbon::parse($d)->toDateString());

            foreach ($meetingDates as $i => $date) {
                if ($presentDates->contains($date)) {
                    $attendedCount = $i + 1; // pertemuan terakhir yang dihadiri
                }
            }
        } else {
            // Kursus tanpa kelas/pertemuan terjadwal: pakai total absensi hadir sebagai indikator progres.
            $attendedCount = AbsensiSiswa::where('siswa_id', $siswa->id)
                ->whereRaw("LOWER(status) IN ('hadir', 'terlambat', 'pulang lebih awal', 'tidak absen pulang')")
                ->count();
        }

        $lessonAttendance = $course->lessons->values()->map(function ($l, $i) use ($attendedCount, $progresses, $meetingDates) {
            $idx = $i + 1;
            $completed = $progresses->get($l->id)?->completed_at !== null;
            $date = $meetingDates[$i] ?? null;
            return [
                'lesson_id' => $l->id,
                'attended' => $idx <= $attendedCount,
                'is_current' => $idx === $attendedCount + 1,
                'is_unlocked' => $completed || $idx <= $attendedCount + 1,
                'attended_count' => $attendedCount,
                'date' => $date,
                'date_label' => $date ? \Carbon\Carbon::parse($date)->locale('id')->translatedFormat('d M Y') : null,
                'day_label' => $date ? \Carbon\Carbon::parse($date)->locale('id')->translatedFormat('l') : null,
            ];
        })->keyBy('lesson_id');

        return response()->json([
            'course' => $course,
            'completed_lesson_ids' => $completedLessonIds,
            'lesson_progress' => $lessonProgress,
            'lesson_attendance' => $lessonAttendance,
        ]);
    }

    public function lessonDetail($id)
    {
        $siswa = $this->getSiswa();
        if (!$siswa) {
            return response()->json(['message' => 'Siswa not found'], 404);
        }

        $lesson = Lesson::aktif()->with('course', 'slides', 'paket.course:id,title', 'linkPakets.course:id,title', 'linkMateris.course:id,title')->findOrFail($id);

        $progress = LmsProgress::where('lesson_id', $lesson->id)
            ->where('siswa_id', $siswa->id)
            ->first();

        $materis = $lesson->linkMateris
            ->filter(fn ($m) => $m->status === 'aktif')
            ->load('slides')
            ->values()
            ->map(fn ($m) => [
                'id' => $m->id,
                'title' => $m->title,
                'content' => $m->content,
                'video_url' => $m->video_url,
                'file_path' => $m->file_path,
                'file_name' => $m->file_name,
                'file_type' => $m->file_type,
                'file_size' => $m->file_size,
                'file_url' => $m->file_url,
                'slides' => $m->slides->map(fn ($s) => [
                    'id' => $s->id,
                    'file_path' => $s->file_path,
                    'file_name' => $s->file_name,
                    'url' => asset('storage/' . $s->file_path),
                ]),
            ]);

        $recap = LessonRecap::where('lesson_id', $lesson->id)->first();
        $recapPayload = null;
        if ($recap) {
            $recapPayload = [
                'id' => $recap->id,
                'file_path' => $recap->file_path,
                'file_name' => $recap->file_name,
                'file_size' => $recap->file_size,
                'file_type' => $recap->file_type,
                'kind' => $recap->kind,
                'description' => $recap->description,
                'created_at' => $recap->created_at,
                'url' => $recap->file_path ? asset('storage/' . $recap->file_path) : null,
            ];
        }

        $paketMap = collect();
        if ($lesson->paket) {
            $paketMap[$lesson->paket->id] = ['paket' => $lesson->paket, 'link_locked' => false, 'linked' => false];
        }
        foreach ($lesson->linkPakets as $lp) {
            if (isset($paketMap[$lp->id])) {
                continue;
            }
            $paketMap[$lp->id] = ['paket' => $lp, 'link_locked' => ($lp->pivot->status ?? 'aktif') !== 'aktif', 'linked' => true];
        }

        $quizzes = $paketMap
            ->map(function ($entry) use ($siswa) {
            $p = $entry['paket'];
            $linkLocked = $entry['link_locked'];
            $senseiLocked = !$p->diAjarSensei($siswa);
            // Paket yang ditautkan ke pertemuan ini (pivot) cukup bergantung pada
            // status pivot per pertemuan agar status sensei lain tidak membawa-bawa.
            $unlocked = !$linkLocked
                && !$senseiLocked
                && ($entry['linked'] ? true : $p->status === 'aktif');
            $attempts = QuizAttempt::where('quiz_paket_id', $p->id)
                ->where('siswa_id', $siswa->id)
                ->where('source', 'paket')
                ->orderBy('attempt_number')
                ->get();
            $used = $attempts->count();
            $best = $attempts->where('status', 'submitted')->max('score');
            $inProgress = $attempts->firstWhere('status', 'in_progress');

            return [
                'id' => $p->id,
                'title' => $p->title,
                'description' => $p->description,
                'category' => $p->category,
                'cover_url' => $p->cover_url,
                'course_id' => $p->course_id,
                'course_title' => optional($p->course)->title,
                'questions_count' => $p->questions()->count(),
                'time_limit_minutes' => $p->time_limit_minutes,
                'max_attempts' => $p->max_attempts,
                'passing_score' => (int) $p->passing_score,
                'attempts_used' => $used,
                'best_score' => $best === null ? null : (int) $best,
                'can_start' => $unlocked && $used < $p->max_attempts,
                'is_unlocked' => $unlocked,
                'is_link_locked' => $linkLocked,
                'locked' => $senseiLocked,
                'quiz_template' => $p->quiz_template,
                'in_progress_attempt_id' => $inProgress?->id,
            ];
        })->values();

        return response()->json([
            'lesson' => $lesson,
            'materis' => $materis,
            'slides' => $lesson->slides->map(fn ($s) => [
                'id' => $s->id,
                'file_path' => $s->file_path,
                'file_name' => $s->file_name,
                'url' => asset('storage/' . $s->file_path),
            ]),
            'recap' => $recapPayload,
            'quizzes' => $quizzes,
            'completed' => $progress && $progress->completed_at !== null,
            'completed_at' => $progress?->completed_at,
            'progress' => $this->progressPayload($lesson, $progress),
        ]);
    }

    public function lessonVideoProgress(Request $request, $id)
    {
        $siswa = $this->getSiswa();
        if (!$siswa) {
            return response()->json(['message' => 'Siswa not found'], 404);
        }

        $lesson = Lesson::aktif()->findOrFail($id);

        $data = $request->validate([
            'current_time' => 'nullable|numeric|min:0',
            'duration' => 'nullable|numeric|min:0',
        ]);

        $currentTime = max(0, (float) ($data['current_time'] ?? 0));
        $duration = max(0, (float) ($data['duration'] ?? 0));

        $progress = LmsProgress::firstOrNew([
            'lesson_id' => $lesson->id,
            'siswa_id' => $siswa->id,
        ]);

        $progress->video_duration_seconds = max((int) $progress->video_duration_seconds, (int) $duration);
        $progress->video_watched_seconds = max((int) $progress->video_watched_seconds, (int) $currentTime);

        $dur = (int) $progress->video_duration_seconds;
        $watched = (int) $progress->video_watched_seconds;
        $progress->video_percent = $dur > 0 ? (int) round(min(100, $watched * 100 / $dur)) : 0;
        $progress->save();

        return response()->json([
            'message' => 'Video progress saved',
            'progress' => $this->progressPayload($lesson, $progress),
        ]);
    }

    public function lessonReadProgress(Request $request, $id)
    {
        $siswa = $this->getSiswa();
        if (!$siswa) {
            return response()->json(['message' => 'Siswa not found'], 404);
        }

        $lesson = Lesson::aktif()->findOrFail($id);

        $data = $request->validate([
            'seconds' => 'required|integer|min:1|max:120',
        ]);

        $progress = LmsProgress::firstOrNew([
            'lesson_id' => $lesson->id,
            'siswa_id' => $siswa->id,
        ]);

        $progress->read_seconds = (int) $progress->read_seconds + (int) $data['seconds'];
        $progress->save();

        return response()->json([
            'message' => 'Read progress saved',
            'progress' => $this->progressPayload($lesson, $progress),
        ]);
    }

    public function lessonReadComplete(Request $request, $id)
    {
        $siswa = $this->getSiswa();
        if (!$siswa) {
            return response()->json(['message' => 'Siswa not found'], 404);
        }

        $lesson = Lesson::aktif()->findOrFail($id);

        $progress = LmsProgress::firstOrNew([
            'lesson_id' => $lesson->id,
            'siswa_id' => $siswa->id,
        ]);

        $progress->read_seconds = max((int) $progress->read_seconds, self::MODUL_MIN_SECONDS);
        $progress->save();

        return response()->json([
            'message' => 'Read progress marked as done',
            'progress' => $this->progressPayload($lesson, $progress),
        ]);
    }

    public function completeLesson(Request $request, $id)
    {
        $siswa = $this->getSiswa();
        if (!$siswa) {
            return response()->json(['message' => 'Siswa not found'], 404);
        }

        $lesson = Lesson::aktif()->findOrFail($id);

        $progress = LmsProgress::firstOrNew([
            'lesson_id' => $lesson->id,
            'siswa_id' => $siswa->id,
        ]);

        $payload = $this->progressPayload($lesson, $progress);

        if (!$progress->completed_at) {
            $progress->completed_at = now();
            $progress->save();
        }

        return response()->json([
            'message' => 'Lesson marked as complete',
            'completed_at' => $progress->completed_at,
        ]);
    }

    public function uncompleteLesson($id)
    {
        $siswa = $this->getSiswa();
        if (!$siswa) {
            return response()->json(['message' => 'Siswa not found'], 404);
        }

        LmsProgress::where('lesson_id', $id)
            ->where('siswa_id', $siswa->id)
            ->delete();

        return response()->json(['message' => 'Progress removed']);
    }

    // ========== Student Assignments ==========

    public function courseAssignments(Request $request, $courseId)
    {
        $siswa = $this->getSiswa();
        if (!$siswa) return response()->json(['message' => 'Siswa not found'], 404);

        $assignments = LmsAssignment::withCount('submissions')
            ->where('course_id', $courseId)
            ->when($request->filled('lesson_id'), fn ($q) => $q->where('lesson_id', $request->integer('lesson_id')))
            ->aktif()
            ->orderBy('created_at', 'desc')
            ->get();

        $assignmentIds = $assignments->pluck('id');
        $pakets = LmsAssignment::whereIn('id', $assignmentIds)->with('pakets')->get()
            ->mapWithKeys(function ($a) {
                return [$a->id => $a->pakets->map(fn ($p) => [
                    'id' => $p->id,
                    'title' => $p->title,
                    'questions_count' => $p->questions()->count(),
                    'time_limit_minutes' => $p->time_limit_minutes,
                    'max_attempts' => $p->max_attempts,
                    'passing_score' => (int) $p->passing_score,
                ])->values()];
            });

        $submittedIds = LmsSubmission::whereIn('assignment_id', $assignments->pluck('id'))
            ->where('siswa_id', $siswa->id)
            ->get()
            ->keyBy('assignment_id');

        $result = $assignments->map(function ($a) use ($submittedIds, $pakets) {
            $sub = $submittedIds->get($a->id);
            return [
                'id' => $a->id,
                'course_id' => $a->course_id,
                'lesson_id' => $a->lesson_id,
                'title' => $a->title,
                'description' => $a->description,
                'file_path' => $a->file_path,
                'file_name' => $a->file_name,
                'due_date' => $a->due_date?->format('Y-m-d'),
                'max_score' => $a->max_score,
                'pakets' => $pakets->get($a->id, []),
                'submission' => $sub ? [
                    'id' => $sub->id,
                    'file_path' => $sub->file_path,
                    'file_name' => $sub->file_name,
                    'notes' => $sub->notes,
                    'score' => $sub->score,
                    'feedback' => $sub->feedback,
                    'submitted_at' => $sub->submitted_at?->format('Y-m-d H:i'),
                    'graded_at' => $sub->graded_at?->format('Y-m-d H:i'),
                ] : null,
            ];
        });

        return response()->json(['assignments' => $result]);
    }

    public function submitAssignment(Request $request, $assignmentId)
    {
        $siswa = $this->getSiswa();
        if (!$siswa) return response()->json(['message' => 'Siswa not found'], 404);

        $assignment = LmsAssignment::aktif()->findOrFail($assignmentId);

        if ($assignment->due_date && $assignment->due_date->isPast()) {
            return response()->json(['message' => 'Tenggat waktu pengumpulan tugas telah berakhir.'], 422);
        }

        $data = $request->validate([
            'notes' => 'nullable|string|max:1000',
            'file' => 'required|file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt,jpg,jpeg,png,zip,rar|max:51200',
        ]);

        $existing = LmsSubmission::where('assignment_id', $assignmentId)
            ->where('siswa_id', $siswa->id)
            ->first();

        if ($existing) {
            Storage::disk('public')->delete($existing->file_path);
            $existing->delete();
        }

        $file = $request->file('file');
        $path = $file->store('lms/submissions', 'public');

        $submission = LmsSubmission::create([
            'assignment_id' => $assignmentId,
            'siswa_id' => $siswa->id,
            'notes' => $data['notes'] ?? null,
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'file_size' => $file->getSize(),
            'submitted_at' => now(),
        ]);

        return response()->json(['submission' => $submission], 201);
    }

    // ========== Admin CRUD ==========

    private function syncLessonSlides(Lesson $lesson, Request $request)
    {
        if ($request->has('remove_slides')) {
            $removeIds = array_filter(array_map('intval', (array) $request->input('remove_slides')));
            $removes = $lesson->slides()->whereIn('id', $removeIds)->get();
            foreach ($removes as $slide) {
                Storage::disk('public')->delete($slide->file_path);
                $slide->delete();
            }
        }

        if ($request->hasFile('slides')) {
            $sort = $lesson->slides()->max('sort') ?? 0;
            foreach ($request->file('slides') as $file) {
                $sort++;
                LessonSlide::create([
                    'lesson_id' => $lesson->id,
                    'file_path' => $file->store('lms/lesson-slides', 'public'),
                    'file_name' => $file->getClientOriginalName(),
                    'file_type' => $file->getMimeType(),
                    'file_size' => $file->getSize(),
                    'sort' => $sort,
                ]);
            }
        }
    }

    private function applyLessonFile(?Lesson $lesson, Request $request, array &$data)
    {
        if ($request->hasFile('file')) {
            if ($lesson->file_path) {
                Storage::disk('public')->delete($lesson->file_path);
            }
            $file = $request->file('file');
            $data['file_path'] = $file->store('lms/lesson-files', 'public');
            $data['file_name'] = $file->getClientOriginalName();
            $data['file_type'] = $file->getMimeType();
            $data['file_size'] = $file->getSize();
        } elseif ($request->input('remove_file') === '1' && $lesson->file_path) {
            Storage::disk('public')->delete($lesson->file_path);
            $data['file_path'] = null;
            $data['file_name'] = null;
            $data['file_type'] = null;
            $data['file_size'] = null;
        }
    }

    private function destroyLessonFiles(Lesson $lesson)
    {
        if ($lesson->file_path) {
            Storage::disk('public')->delete($lesson->file_path);
        }
        foreach ($lesson->slides()->get() as $slide) {
            Storage::disk('public')->delete($slide->file_path);
        }
    }

    public function adminCourses(Request $request)
    {
        $perPage = $request->filled('per_page') ? (int) $request->per_page : null;

        $query = Course::withCount(['lessons', 'files'])->with('category');

        if ($request->search && !empty($request->search)) {
            $q = $request->search;
            $query->where(function ($qq) use ($q) {
                $qq->where('title', 'like', '%' . $q . '%')
                    ->orWhere('level', 'like', '%' . $q . '%');
            });
        }

        if ($request->level && !empty($request->level)) {
            $query->where('level', $request->level);
        }

        if ($request->batch_id && !empty($request->batch_id)) {
            $query->where('batch_id', $request->batch_id);
        }

        $query->orderBy('sort')->orderBy('id');
        $batches = Batch::aktif()->orderBy('nama_batch')->get(['id', 'nama_batch', 'warna']);
        $levels = Course::query()->distinct()->pluck('level')->filter()->values();

        if ($perPage) {
            $courses = $query->paginate($perPage);
            $courses->getCollection()->each(fn ($c) => $c->makeVisible('password_course'));
            return response()->json([
                'courses' => $courses->items(),
                'batches' => $batches,
                'levels' => $levels,
                'pagination' => [
                    'current_page' => $courses->currentPage(),
                    'last_page' => $courses->lastPage(),
                    'per_page' => $courses->perPage(),
                    'total' => $courses->total(),
                ],
            ]);
        }

        $courses = $query->get();
        $courses->each(fn ($c) => $c->makeVisible('password_course'));
        return response()->json(['courses' => $courses, 'batches' => $batches, 'levels' => $levels]);
    }

    public function storeCourse(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'level' => 'nullable|string|max:50',
            'category_id' => 'nullable|exists:lms_categories,id',
            'batch_id' => 'nullable|exists:batches,id',
            'sort' => 'nullable|integer|min:0',
            'status' => 'nullable|in:aktif,nonaktif',
            'alert' => 'nullable|string|max:1000',
            'alert_active' => 'nullable|boolean',
            'password_course' => 'nullable|string|max:255',
            'image' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('lms/courses', 'public');
        }

        $data['user_id'] = Auth::guard('sanctum')->id();

        $course = Course::create($data)->makeVisible('password_course');
        return response()->json(['course' => $course->loadCount('lessons')], 201);
    }

    public function updateCourse(Request $request, $id)
    {
        $course = Course::findOrFail($id);

        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'level' => 'nullable|string|max:50',
            'category_id' => 'nullable|exists:lms_categories,id',
            'batch_id' => 'nullable|exists:batches,id',
            'sort' => 'nullable|integer|min:0',
            'status' => 'nullable|in:aktif,nonaktif',
            'alert' => 'nullable|string|max:1000',
            'alert_active' => 'nullable|boolean',
            'password_course' => 'nullable|string|max:255',
            'image' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        if ($request->hasFile('image')) {
            if ($course->image) {
                Storage::disk('public')->delete($course->image);
            }
            $data['image'] = $request->file('image')->store('lms/courses', 'public');
        }

        $course->update($data);
        return response()->json(['course' => $course->fresh()->makeVisible('password_course')->loadCount('lessons')]);
    }

    public function deleteCourse($id)
    {
        $course = Course::findOrFail($id);
        if ($course->image) {
            Storage::disk('public')->delete($course->image);
        }
        $course->delete();
        return response()->json(['message' => 'Course deleted']);
    }

    public function categories()
    {
        $categories = LmsCategory::withCount('courses')->orderBy('sort')->get();
        return response()->json(['categories' => $categories]);
    }

    public function storeCategory(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'sort' => 'nullable|integer|min:0',
        ]);
        $data['sort'] = $data['sort'] ?? 0;
        $category = LmsCategory::create($data);
        return response()->json(['category' => $category], 201);
    }

    public function updateCategory(Request $request, $id)
    {
        $category = LmsCategory::findOrFail($id);
        $data = $request->validate([
            'name' => 'sometimes|string|max:100',
            'sort' => 'nullable|integer|min:0',
        ]);
        $category->update($data);
        return response()->json(['category' => $category->fresh()]);
    }

    public function destroyCategory($id)
    {
        $category = LmsCategory::findOrFail($id);
        $category->delete();
        return response()->json(['message' => 'Category deleted']);
    }

    public function adminLessons($courseId)
    {
        $course = Course::findOrFail($courseId);
        $lessons = $course->lessons()->with('slides')->orderBy('sort')->get();
        return response()->json(['course' => $course, 'lessons' => $lessons]);
    }

    public function storeLesson(Request $request)
    {
        $data = $request->validate([
            'course_id' => 'required|exists:lms_courses,id',
            'title' => 'required|string|max:255',
            'content' => 'nullable|string',
            'video_url' => 'nullable|string|max:500',
            'file' => 'nullable|file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt|max:51200',
            'slides' => 'nullable|array|max:30',
            'slides.*' => 'file|image|mimes:jpg,jpeg,png,webp|max:10240',
            'sort' => 'nullable|integer|min:0',
            'status' => 'nullable|in:aktif,nonaktif',
        ]);

        $this->applyLessonFile(null, $request, $data);
        unset($data['file']);
        $lesson = Lesson::create($data);
        if ($request->hasFile('slides')) {
            $this->syncLessonSlides($lesson, $request);
        }
        return response()->json(['lesson' => $lesson->fresh()->load('slides')], 201);
    }

    public function updateLesson(Request $request, $id)
    {
        $lesson = Lesson::findOrFail($id);

        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'content' => 'nullable|string',
            'video_url' => 'nullable|string|max:500',
            'file' => 'nullable|file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt|max:51200',
            'slides' => 'nullable|array|max:30',
            'slides.*' => 'file|image|mimes:jpg,jpeg,png,webp|max:10240',
            'remove_slides' => 'nullable|array',
            'remove_slides.*' => 'integer|exists:lms_lesson_slides,id',
            'remove_file' => 'nullable|in:0,1',
            'sort' => 'nullable|integer|min:0',
            'status' => 'nullable|in:aktif,nonaktif',
        ]);

        $this->applyLessonFile($lesson, $request, $data);
        unset($data['file']);

        $this->syncLessonSlides($lesson, $request);

        $lesson->update($data);
        return response()->json(['lesson' => $lesson->fresh()->load('slides')]);
    }

    public function deleteLesson($id)
    {
        $lesson = Lesson::findOrFail($id);
        $this->destroyLessonFiles($lesson);
        $lesson->delete();
        return response()->json(['message' => 'Lesson deleted']);
    }

    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png,gif,webp,svg,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,mp4,webm|max:51200',
        ]);

        $path = $request->file('file')->store('lms/uploads', 'public');

        return response()->json([
            'url' => asset('storage/' . $path),
        ]);
    }

    // ========== Course Files ==========

    public function adminCourseFiles($courseId)
    {
        $files = CourseFile::where('course_id', $courseId)->orderBy('created_at', 'desc')->get();
        return response()->json(['files' => $files]);
    }

    public function storeCourseFile(Request $request)
    {
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

    public function deleteCourseFile($id)
    {
        $courseFile = CourseFile::findOrFail($id);
        Storage::disk('public')->delete($courseFile->file_path);
        $courseFile->delete();
        return response()->json(['message' => 'File deleted']);
    }

    // ========== Welcome Video Setting ==========

    public function welcome()
    {
        $path = LmsSetting::getWelcomeVideo();
        $url = LmsSetting::getWelcomeVideoUrl();
        return response()->json([
            'welcome_video' => empty($path) ? null : $path,
            'welcome_video_url' => empty($url) ? null : $url,
        ]);
    }

    public function updateWelcomeVideo(Request $request)
    {
        $data = $request->validate([
            'file' => 'required|file|mimes:mp4,webm,mov,m4v|max:204800',
        ]);

        $old = LmsSetting::getWelcomeVideo();
        if (!empty($old) && !filter_var($old, FILTER_VALIDATE_URL)) {
            Storage::disk('public')->delete($old);
        }

        $file = $request->file('file');
        $path = $file->store('lms/welcome', 'public');

        LmsSetting::setValue('welcome_video', $path);
        LmsSetting::setValue('welcome_video_url', null);

        return response()->json(['welcome_video' => $path, 'welcome_video_url' => null]);
    }

    public function updateWelcomeVideoUrl(Request $request)
    {
        $data = $request->validate([
            'url' => 'required|url|starts_with:https://,http://|max:2048',
        ]);

        $old = LmsSetting::getWelcomeVideo();
        if (!empty($old) && !filter_var($old, FILTER_VALIDATE_URL)) {
            Storage::disk('public')->delete($old);
        }

        LmsSetting::setValue('welcome_video', null);
        LmsSetting::setValue('welcome_video_url', $data['url']);

        return response()->json(['welcome_video' => null, 'welcome_video_url' => $data['url']]);
    }

    public function deleteWelcomeVideo()
    {
        $old = LmsSetting::getWelcomeVideo();
        if (!empty($old) && !filter_var($old, FILTER_VALIDATE_URL)) {
            Storage::disk('public')->delete($old);
        }
        LmsSetting::setValue('welcome_video', null);
        LmsSetting::setValue('welcome_video_url', null);

        return response()->json(['welcome_video' => null, 'welcome_video_url' => null]);
    }
}
