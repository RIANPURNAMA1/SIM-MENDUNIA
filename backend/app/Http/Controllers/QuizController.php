<?php

namespace App\Http\Controllers;

use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use App\Models\QuizPaket;
use App\Models\QuizQuestion;
use App\Models\Siswa;
use App\Models\Lesson;
use App\Models\LmsProgress;
use App\Events\WebcamSnapshotUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class QuizController extends Controller
{
    private function courseLessonsForSiswa(QuizPaket $paket, ?Siswa $siswa)
    {
        if (!$siswa) {
            return collect();
        }
        $lessons = Lesson::where(function ($q) use ($paket) {
            $q->where('paket_id', $paket->id)
                ->orWhereHas('linkPakets', fn ($sub) => $sub->where('quiz_paket_id', $paket->id)->where('lms_lesson_quiz_pakets.status', 'aktif'));
        })
            ->aktif()
            ->orderBy('sort')
            ->get();
        if ($lessons->count() > 0 || !$paket->course_id) {
            return $lessons;
        }
        // Course-level paket: it is shown inside "Quiz Pertemuan Ini" (first pertemuan).
        // Unlock must only depend on that hosting pertemuan, not on every pertemuan
        // of the course, so the quiz is workable right after that pertemuan's materi
        // turns green.
        return Lesson::where('course_id', $paket->course_id)
            ->aktif()
            ->orderBy('sort')
            ->limit(1)
            ->get();
    }

    private function paketUnlocked(QuizPaket $paket, ?Siswa $siswa): bool
    {
        // Paket yang statusnya bukan 'aktif' (mis. "Ditutup") tidak boleh dikerjakan.
        if ($paket->status !== 'aktif') {
            return false;
        }
        return true;
    }

    private function siswaUser()
    {        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return null;
        }
        return Siswa::where('user_id', $user->id)->first();
    }

    private function paketVisible(QuizPaket $paket, ?Siswa $siswa)
    {
        if (!$siswa) {
            return false;
        }
        if ($paket->batch_id && $paket->batch_id != $siswa->batch_id) {
            return false;
        }
        if ($paket->level && $siswa->level !== null && (string) $paket->level !== (string) $siswa->level) {
            return false;
        }
        return $paket->diAjarSensei($siswa);
    }

    private function ownAttempt($id, $siswaId)
    {
        $attempt = QuizAttempt::with('paket')
            ->where('id', $id)
            ->where('siswa_id', $siswaId)
            ->firstOrFail();
        return $attempt;
    }

    private function isExpired(QuizAttempt $attempt)
    {
        return $attempt->started_at->addSeconds((int) $attempt->time_limit_seconds)->addSeconds(5)->isPast();
    }

    private function finalize(QuizAttempt $attempt, bool $auto = false)
    {
        if ($attempt->status === 'submitted') {
            return;
        }

        $answers = $attempt->answers()->get()->keyBy('quiz_question_id');

        foreach ($attempt->paket->questions as $q) {
            $a = $answers->get($q->id);

            if ($q->question_type === 'essay') {
                $text = trim((string) ($a?->answer_text ?? ''));
                $keyword = trim((string) ($q->keyword ?? ''));
                if ($text === '') {
                    continue;
                }
                if ($keyword !== '' && mb_stripos($text, $keyword) !== false) {
                    $a?->update(['is_correct' => true, 'earned_points' => (int) $q->points]);
                } else {
                    $a?->update(['is_correct' => null, 'earned_points' => null]);
                }
                continue;
            }

            $sel = $a?->selected_index;
            $isRating = $q->question_type === 'rating';
            if ($sel !== null && ($isRating || (int) $sel === (int) $q->correct_index)) {
                $a?->update(['is_correct' => true, 'earned_points' => (int) $q->points]);
            } elseif ($a) {
                $a->update(['is_correct' => false, 'earned_points' => 0]);
            }
        }

        $attempt->recomputeScore();

        $attempt->update([
            'status' => 'submitted',
            'submitted_at' => now(),
            'total_count' => $attempt->paket->questions->count(),
            'auto_submitted' => $auto ? true : $attempt->auto_submitted,
        ]);

        try {
            WebcamSnapshotUpdated::dispatch((int) $attempt->quiz_paket_id, (int) $attempt->id);
        } catch (\Throwable $e) {
            // Realtime push bersifat opsional: hasil tetap tersimpan walau server websocket mati.
        }

        try {
            app(\App\Services\QuizAssessmentSync::class)->syncAttempt($attempt);
        } catch (\Throwable $e) {
            // Sinkronisasi nilai ke penilaian tidak boleh menggagalkan submit quiz.
        }
    }

    private function expireIfTimeUp(QuizAttempt $attempt)
    {
        if ($attempt->status === 'in_progress' && $this->isExpired($attempt)) {
            $this->finalize($attempt, true);
        }
    }

    private function resultPayload(QuizAttempt $attempt)
    {
        $answered = $attempt->answers()
            ->where(fn ($q) => $q->whereNotNull('selected_index')->orWhereNotNull('answer_text'))
            ->count();
        return [
            'attempt_id' => $attempt->id,
            'attempt_number' => $attempt->attempt_number,
            'status' => $attempt->status,
            'score' => $attempt->score,
            'correct_count' => $attempt->correct_count,
            'total_count' => $attempt->total_count,
            'answered_count' => $answered,
            'warnings' => $attempt->warnings,
            'max_warnings' => (int) $attempt->paket->max_warnings,
            'auto_submitted' => $attempt->auto_submitted,
            'started_at' => $attempt->started_at?->toIso8601String(),
            'submitted_at' => $attempt->submitted_at?->toIso8601String(),
            'time_limit_seconds' => (int) $attempt->time_limit_seconds,
            'passing_score' => (int) $attempt->paket->passing_score,
        ];
    }

    // ========== Paket ==========

    /**
     * Resolve konteks percobaan ('paket' = quiz dari bank/pertemuan,
     * 'tugas' = quiz yang ditautkan lewat tugas) dari request.
     */
    private function attemptContext(Request $request): array
    {
        $source = $request->input('source', 'paket');
        if (!in_array($source, ['paket', 'tugas'], true)) {
            $source = 'paket';
        }
        $sourceId = $request->input('source_id');
        return [$source, ($sourceId !== null && $sourceId !== '') ? (int) $sourceId : null];
    }

    private function scopeAttemptsByContext($query, string $source, ?int $sourceId)
    {
        $query->where('source', $source);
        if ($source === 'tugas') {
            $query->where('source_id', $sourceId);
        }
        return $query;
    }

    public function index()
    {
        $siswa = $this->siswaUser();
        if (!$siswa) {
            return response()->json(['pakets' => []]);
        }

        $query = QuizPaket::aktif()
            ->withCount('questions')
            ->with(['course:id,title', 'batch:id,nama_batch']);

        $query->where(function ($q) use ($siswa) {
            $q->whereNull('batch_id')->orWhere('batch_id', $siswa->batch_id);
        });

        if ($siswa->level !== null) {
            $query->where(function ($q) use ($siswa) {
                $q->whereNull('level')->orWhere('level', (string) $siswa->level);
            });
        }

        $pakets = $query->orderByDesc('created_at')->get();

        $result = $pakets->map(function ($p) use ($siswa) {
            $locked = !$p->diAjarSensei($siswa);
            $attempts = QuizAttempt::where('quiz_paket_id', $p->id)
                ->where('siswa_id', $siswa->id)
                ->where('source', 'paket')
                ->orderBy('attempt_number')
                ->get();
            $used = $attempts->count();
            $best = $attempts->where('status', 'submitted')->max('score');

            return [
                'id' => $p->id,
                'title' => $p->title,
                'description' => $p->description,
                'category' => $p->category,
                'cover_url' => $p->cover_url,
                'course_id' => $p->course_id,
                'course_title' => optional($p->course)->title,
                'batch_name' => optional($p->batch)->nama_batch,
                'questions_count' => $p->questions_count,
                'time_limit_minutes' => $p->time_limit_minutes,
                'max_attempts' => $p->max_attempts,
                'passing_score' => (int) $p->passing_score,
                'attempts_used' => $used,
                'best_score' => $best === null ? null : (int) $best,
                'can_start' => !$locked && $used < $p->max_attempts,
                'quiz_template' => $p->quiz_template,
                'camera_enabled' => (bool) $p->camera_enabled,
                'block_exit' => (bool) $p->block_exit,
                'is_unlocked' => !$locked && $this->paketUnlocked($p, $siswa),
                'locked' => $locked,
            ];
        });

        return response()->json(['pakets' => $result]);
    }

    public function paketDetail(Request $request, $id)
    {
        $siswa = $this->siswaUser();
        if (!$siswa) {
            return response()->json(['message' => 'Silakan login sebagai siswa terlebih dahulu.'], 404);
        }

        [$source, $sourceId] = $this->attemptContext($request);

        $paket = QuizPaket::aktif()->withCount('questions')->find($id);
        if (!$paket) {
            return response()->json(['message' => 'Paket soal tidak ditemukan atau sudah ditutup.'], 404);
        }
        if (!$this->paketVisible($paket, $siswa)) {
            $reason = [];
            if ($paket->batch_id && $paket->batch_id != $siswa->batch_id) {
                $reason[] = 'paket ini khusus batch ' . $paket->batch_id;
            }
            if ($paket->level && (string) $paket->level !== (string) $siswa->level) {
                $reason[] = 'paket ini khusus level ' . $paket->level;
            }
            return response()->json([
                'message' => 'Paket soal tidak tersedia untuk Anda (' . implode(', ', $reason) . '). Hubungi pengajar bila seharusnya bisa diakses.',
            ], 404);
        }

        $attempts = $this->scopeAttemptsByContext(
            QuizAttempt::where('quiz_paket_id', $paket->id)
                ->where('siswa_id', $siswa->id),
            $source,
            $sourceId
        )
            ->orderBy('attempt_number')
            ->get()
            ->map(fn ($a) => [
                'attempt_id' => $a->id,
                'attempt_number' => $a->attempt_number,
                'status' => $a->status,
                'score' => $a->score,
                'correct_count' => $a->correct_count,
                'total_count' => $a->total_count,
                'warnings' => $a->warnings,
                'auto_submitted' => $a->auto_submitted,
                'started_at' => $a->started_at?->toIso8601String(),
                'submitted_at' => $a->submitted_at?->toIso8601String(),
                'source' => $a->source,
            ]);

        // Lesson prerequisites: if paket linked to a course, include its active
        // lessons + the siswa's completion state + whether the quiz is unlocked.
        $lessons = [];
        $completedLessonIds = [];
        $hasPrerequisiteCourse = false;

        $courseLessons = $this->courseLessonsForSiswa($paket, $siswa);
        if ($courseLessons->count() > 0) {
            $hasPrerequisiteCourse = true;
            $courseLessons->load('slides');
            $progresses = LmsProgress::where('siswa_id', $siswa->id)
                ->whereIn('lesson_id', $courseLessons->pluck('id'))
                ->get()
                ->keyBy('lesson_id');

            $completedLessonIds = $progresses->filter(fn ($p) => $p->completed_at !== null)
                ->keys()
                ->map(fn ($id) => (int) $id)
                ->values()
                ->toArray();

            $completedSet = array_fill_keys($completedLessonIds, true);

            $lessons = $courseLessons->map(function ($l) use ($progresses, $completedSet) {
                $p = $progresses->get($l->id);
                return [
                    'id' => $l->id,
                    'title' => $l->title,
                    'sort' => $l->sort,
                    'video_url' => $l->video_url,
                    'content' => $l->content,
                    'has_video' => !empty($l->video_url),
                    'has_content' => !empty($l->content),
                    'file_name' => $l->file_name,
                    'file_url' => $l->file_path ? asset('storage/' . $l->file_path) : null,
                    'slides' => $l->slides->map(fn ($s) => [
                        'id' => $s->id,
                        'file_name' => $s->file_name,
                        'url' => asset('storage/' . $s->file_path),
                    ])->values(),
                    'completed' => isset($completedSet[$l->id]),
                ];
            })->values()->toArray();
        }

        return response()->json([
            'paket' => [
                'id' => $paket->id,
                'title' => $paket->title,
                'description' => $paket->description,
                'cover_url' => $paket->cover_url,
                'course_id' => $paket->course_id,
                'course_title' => optional($paket->course)->title,
                'questions_count' => $paket->questions_count,
                'time_limit_minutes' => $paket->time_limit_minutes,
                'max_attempts' => $paket->max_attempts,
                'passing_score' => (int) $paket->passing_score,
                'max_warnings' => (int) $paket->max_warnings,
                'quiz_template' => $paket->quiz_template,
                'camera_enabled' => (bool) $paket->camera_enabled,
                'block_exit' => (bool) $paket->block_exit,
                'has_prerequisite_course' => $hasPrerequisiteCourse,
            ],
            'lessons' => $lessons,
            'completed_lesson_ids' => $completedLessonIds,
            'is_unlocked' => $this->paketUnlocked($paket, $siswa),
            'attempts' => $attempts,
        ]);
    }

    public function start(Request $request, $id)
    {
        $siswa = $this->siswaUser();
        if (!$siswa) {
            return response()->json(['message' => 'Siswa tidak ditemukan'], 401);
        }

        [$source, $sourceId] = $this->attemptContext($request);

        $paket = QuizPaket::aktif()->findOrFail($id);
        if (!$this->paketVisible($paket, $siswa)) {
            return response()->json(['message' => 'Paket soal tidak tersedia'], 404);
        }

        if (!$this->paketUnlocked($paket, $siswa)) {
            return response()->json(['message' => 'Selesaikan seluruh materi terlebih dahulu untuk membuka kuis ini'], 422);
        }

        $used = $this->scopeAttemptsByContext(
            QuizAttempt::where('quiz_paket_id', $paket->id)
                ->where('siswa_id', $siswa->id),
            $source,
            $sourceId
        )->count();

        $inProgress = $this->scopeAttemptsByContext(
            QuizAttempt::where('quiz_paket_id', $paket->id)
                ->where('siswa_id', $siswa->id)
                ->where('status', 'in_progress'),
            $source,
            $sourceId
        )->first();

        if ($inProgress) {
            $this->expireIfTimeUp($inProgress);
            $inProgress->refresh();
            if ($inProgress->status === 'in_progress') {
                return response()->json([
                    'message' => 'Anda masih memiliki percobaan yang berjalan',
                    'attempt_id' => $inProgress->id,
                ], 422);
            }
        }

        if ($used >= $paket->max_attempts) {
            return response()->json(['message' => 'Batas percobaan telah tercapai'], 422);
        }

        $attempt = QuizAttempt::create([
            'quiz_paket_id' => $paket->id,
            'siswa_id' => $siswa->id,
            'source' => $source,
            'source_id' => $source === 'tugas' ? $sourceId : null,
            'attempt_number' => $used + 1,
            'started_at' => now(),
            'time_limit_seconds' => $paket->time_limit_minutes * 60,
            'status' => 'in_progress',
        ]);

        $questions = $paket->questions->map(fn ($q) => [
            'id' => $q->id,
            'question' => $q->question,
            'section' => $q->section->name ?? null,
            'options' => $this->optionList($q->options),
            'points' => $q->points,
            'image_url' => $q->image_url,
            'audio_url' => $q->audio_url,
            'audio_max_plays' => $q->audio_max_plays,
        ]);

        if ($paket->shuffle_questions) {
            $questions = $questions->shuffle()->values();
        }

        return response()->json([
            'attempt' => [
                'id' => $attempt->id,
                'attempt_number' => $attempt->attempt_number,
                'started_at' => $attempt->started_at->toIso8601String(),
                'time_limit_seconds' => (int) $attempt->time_limit_seconds,
                'max_warnings' => (int) $paket->max_warnings,
            ],
            'template' => $paket->quiz_template,
            'camera_enabled' => (bool) $paket->camera_enabled,
            'block_exit' => (bool) $paket->block_exit,
            'questions' => $questions,
        ], 201);
    }

    public function uploadWebcam(Request $request, $attemptId)
    {
        $siswa = $this->siswaUser();
        if (!$siswa) {
            return response()->json(['message' => 'Siswa tidak ditemukan'], 401);
        }

        $attempt = $this->ownAttempt($attemptId, $siswa->id);
        if ($attempt->status !== 'in_progress') {
            return response()->json(['message' => 'Percobaan sudah berakhir'], 422);
        }

        $this->expireIfTimeUp($attempt);
        if ($attempt->status !== 'in_progress') {
            return response()->json(['message' => 'Waktu quiz telah habis'], 422);
        }

        $data = $request->validate([
            'photo' => 'required|image|mimes:jpg,jpeg,png,webp|max:3072',
        ]);

        $old = $attempt->webcam_photo;
        $path = $request->file('photo')->store('quiz/webcam', 'public');
        $attempt->update(['webcam_photo' => $path]);

        if ($old && $old !== $path) {
            Storage::disk('public')->delete($old);
        }

        try {
            WebcamSnapshotUpdated::dispatch((int) $attempt->quiz_paket_id, (int) $attempt->id);
        } catch (\Throwable $e) {
            // Realtime push bersifat opsional: snapshot tetap tersimpan walau server websocket mati.
        }

        return response()->json([
            'message' => 'Foto tersimpan',
            'webcam_photo' => asset('storage/' . $path),
        ]);
    }

    public function show($attemptId)
    {
        $siswa = $this->siswaUser();
        if (!$siswa) {
            return response()->json(['message' => 'Siswa tidak ditemukan'], 401);
        }

        $attempt = $this->ownAttempt($attemptId, $siswa->id);

        if ($attempt->status === 'in_progress') {
            $this->expireIfTimeUp($attempt);
            $attempt->refresh();
        }

        if ($attempt->status === 'submitted') {
            return response()->json([
                'attempt' => $this->resultPayload($attempt),
            ]);
        }

        $answers = $attempt->answers()->get()->keyBy('quiz_question_id');
        $questions = $attempt->paket->questions->values();

        $remaining = max(0, (int) $attempt->time_limit_seconds - (int) $attempt->started_at->diffInSeconds(now(), true));

        return response()->json([
            'attempt' => [
                'id' => $attempt->id,
                'attempt_number' => $attempt->attempt_number,
                'started_at' => $attempt->started_at->toIso8601String(),
                'time_limit_seconds' => (int) $attempt->time_limit_seconds,
                'remaining_seconds' => $remaining,
                'max_warnings' => (int) $attempt->paket->max_warnings,
                'warnings' => $attempt->warnings,
            ],
            'template' => $attempt->paket->quiz_template,
            'camera_enabled' => (bool) $attempt->paket->camera_enabled,
            'block_exit' => (bool) $attempt->paket->block_exit,
            'questions' => $questions->map(function ($q) use ($answers) {
                $a = $answers->get($q->id);
                return [
                    'id' => $q->id,
                    'question' => $q->question,
                    'section' => $q->section->name ?? null,
                    'question_type' => $q->question_type ?? 'choice',
                    'rating_max' => $q->rating_max,
                    'options' => $this->optionList($q->options),
                    'points' => $q->points,
                    'image_url' => $q->image_url,
                    'audio_url' => $q->audio_url,
                    'audio_max_plays' => $q->audio_max_plays,
                    'audio_plays' => $a?->audio_plays ?? 0,
                    'selected_index' => $a?->selected_index,
                    'answer_text' => $a?->answer_text,
                ];
            }),
        ]);
    }

    public function review($attemptId)
    {
        $siswa = $this->siswaUser();
        if (!$siswa) {
            return response()->json(['message' => 'Silakan login sebagai siswa terlebih dahulu.'], 401);
        }

        $attempt = $this->ownAttempt($attemptId, $siswa->id);

        // Pembahasan (kunci jawaban) baru boleh dibuka setelah quiz dikumpulkan.
        if ($attempt->status !== 'submitted') {
            return response()->json(['message' => 'Pembahasan hanya tersedia setelah quiz dikumpulkan.'], 422);
        }

        $answers = $attempt->answers()->get()->keyBy('quiz_question_id');
        $questions = $attempt->paket->questions->values()->map(function ($q) use ($answers) {
            $a = $answers->get($q->id);
            return [
                'id' => $q->id,
                'question' => $q->question,
                'section' => $q->section->name ?? null,
                'question_type' => $q->question_type ?? 'choice',
                'rating_max' => $q->rating_max,
                'options' => $this->optionList($q->options),
                'correct_index' => $q->correct_index,
                'keyword' => $q->keyword,
                'points' => $q->points,
                'sort' => $q->sort,
                'image_url' => $q->image_url,
                'audio_url' => $q->audio_url,
                'audio_max_plays' => $q->audio_max_plays,
                'selected_index' => $a?->selected_index,
                'answer_text' => $a?->answer_text,
                'earned_points' => $a?->earned_points,
                'is_correct' => $a?->is_correct,
            ];
        });

        return response()->json([
            'attempt' => $this->resultPayload($attempt),
            'paket' => [
                'id' => $attempt->paket->id,
                'title' => $attempt->paket->title,
            ],
            'questions' => $questions,
        ]);
    }

    public function answer(Request $request, $attemptId)
    {
        $siswa = $this->siswaUser();
        if (!$siswa) {
            return response()->json(['message' => 'Siswa tidak ditemukan'], 401);
        }

        $attempt = $this->ownAttempt($attemptId, $siswa->id);
        if ($attempt->status !== 'in_progress') {
            return response()->json(['message' => 'Percobaan sudah berakhir'], 422);
        }

        $this->expireIfTimeUp($attempt);
        if ($attempt->status !== 'in_progress') {
            return response()->json(['message' => 'Waktu quiz telah habis'], 422);
        }

        $data = $request->validate([
            'question_id' => 'required|integer',
            'selected_index' => 'nullable|integer|min:-1',
            'answer_text' => 'nullable|string|max:5000',
        ]);

        $question = QuizQuestion::where('quiz_paket_id', $attempt->quiz_paket_id)
            ->find($data['question_id']);

        if (!$question) {
            return response()->json(['message' => 'Soal tidak ditemukan pada paket ini'], 422);
        }

        $isEssay = $question->question_type === 'essay';

        if ($isEssay) {
            $text = trim((string) ($data['answer_text'] ?? ''));
            $answer = QuizAnswer::updateOrCreate(
                ['quiz_attempt_id' => $attempt->id, 'quiz_question_id' => $question->id],
                ['answer_text' => $text !== '' ? $text : null, 'selected_index' => null]
            );
            try {
                WebcamSnapshotUpdated::dispatch((int) $attempt->quiz_paket_id, (int) $attempt->id);
            } catch (\Throwable $e) {
                // Realtime push bersifat opsional: jawaban tetap tersimpan walau server websocket mati.
            }
            return response()->json([
                'question_id' => $question->id,
                'answer_text' => $answer->answer_text,
            ]);
        }

        $index = (int) ($data['selected_index'] ?? -1);
        if ($index >= 0 && $index >= count($question->options)) {
            return response()->json(['message' => 'Opsi tidak valid'], 422);
        }

        $savedIndex = $index >= 0 ? $index : null;

        $answer = QuizAnswer::updateOrCreate(
            ['quiz_attempt_id' => $attempt->id, 'quiz_question_id' => $question->id],
            ['selected_index' => $savedIndex, 'answer_text' => null]
        );

        try {
            WebcamSnapshotUpdated::dispatch((int) $attempt->quiz_paket_id, (int) $attempt->id);
        } catch (\Throwable $e) {
            // Realtime push bersifat opsional: jawaban tetap tersimpan walau server websocket mati.
        }

        return response()->json([
            'question_id' => $question->id,
            'selected_index' => $answer->selected_index,
        ]);
    }

    public function warn($attemptId)
    {
        $siswa = $this->siswaUser();
        if (!$siswa) {
            return response()->json(['message' => 'Siswa tidak ditemukan'], 401);
        }

        $attempt = $this->ownAttempt($attemptId, $siswa->id);
        if ($attempt->status !== 'in_progress') {
            return response()->json(['message' => 'Percobaan sudah berakhir'], 422);
        }

        $this->expireIfTimeUp($attempt);
        if ($attempt->status !== 'in_progress') {
            return response()->json(['message' => 'Waktu quiz telah habis'], 422);
        }

        $maxWarnings = (int) $attempt->paket->max_warnings;
        $warnings = min($attempt->warnings + 1, $maxWarnings);
        $auto = $warnings >= $maxWarnings;

        $attempt->update(['warnings' => $warnings]);
        $attempt->refresh();

        if ($auto) {
            $this->finalize($attempt, true);
            $attempt->refresh();
        }

        return response()->json([
            'warnings' => $attempt->warnings,
            'max_warnings' => $maxWarnings,
            'auto_submitted' => $attempt->status === 'submitted',
            'status' => $attempt->status,
        ]);
    }

    public function submit($attemptId)
    {
        $siswa = $this->siswaUser();
        if (!$siswa) {
            return response()->json(['message' => 'Siswa tidak ditemukan'], 401);
        }

        $attempt = $this->ownAttempt($attemptId, $siswa->id);

        if ($attempt->status === 'in_progress') {
            $auto = $this->isExpired($attempt);
            $this->finalize($attempt, $auto);
        }

        return response()->json([
            'attempt' => $this->resultPayload($attempt),
            'message' => 'Quiz diselesaikan',
        ]);
    }

    public function recordAudioPlay(Request $request, $id, $questionId)
    {
        $siswa = $this->siswaUser();
        if (!$siswa) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $attempt = $this->ownAttempt($id, $siswa->id);

        if ($attempt->status !== 'in_progress') {
            return response()->json(['message' => 'Percobaan sudah berakhir'], 422);
        }

        if ($this->isExpired($attempt)) {
            $this->finalize($attempt, true);
            return response()->json(['message' => 'Waktu habis'], 422);
        }

        $question = $attempt->paket->questions()->where('quiz_questions.id', $questionId)->firstOrFail();

        if (!$question->audio_url) {
            return response()->json(['message' => 'Soal ini bukan soal audio'], 422);
        }

        $answer = QuizAnswer::firstOrCreate(
            ['quiz_attempt_id' => $attempt->id, 'quiz_question_id' => $questionId]
        );

        $answer->increment('audio_plays');

        $maxPlays = $question->audio_max_plays;
        $plays = $answer->audio_plays;

        return response()->json([
            'audio_plays' => $plays,
            'audio_max_plays' => $maxPlays,
            'locked' => $maxPlays !== null && $plays >= $maxPlays,
        ]);
    }

    private function optionList($options)
    {
        if (!is_array($options)) return [];
        return array_map(function ($o) {
            if (is_array($o)) {
                $path = $o['image_path'] ?? null;
                return [
                    'text' => (string) ($o['text'] ?? ''),
                    'image_path' => $path,
                    'image_url' => $path ? asset('storage/' . $path) : null,
                ];
            }
            return ['text' => (string) $o, 'image_path' => null, 'image_url' => null];
        }, $options);
    }
}