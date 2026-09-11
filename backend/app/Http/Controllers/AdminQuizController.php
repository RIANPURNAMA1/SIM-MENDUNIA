<?php

namespace App\Http\Controllers;

use App\Models\Batch;
use App\Models\Course;
use App\Models\Guru;
use App\Models\KelasSensei;
use App\Models\Lesson;
use App\Models\LessonSlide;
use App\Models\QuizAttempt;
use App\Models\QuizCategory;
use App\Models\QuizPaket;
use App\Models\QuizQuestion;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class AdminQuizController extends Controller
{
    private function adminUser()
    {
        return Auth::guard('sanctum')->user();
    }

    private function isGlobal(): bool
    {
        $user = $this->adminUser();
        if (!$user) return false;
        return !in_array($user->role, ['ADMIN_CABANG'], true);
    }

    private function getBranchBatchIds(): array
    {
        $user = $this->adminUser();
        if (!$user) return [];

        if ($this->isGlobal()) {
            return Batch::pluck('id')->filter()->values()->all();
        }

        $branchIds = $user->cabang_ids ?? [];
        if (empty($branchIds)) return [];

        return Batch::whereIn('cabang_id', $branchIds)->pluck('id')->filter()->values()->all();
    }

    public function meta()
    {
        $batchIds = $this->getBranchBatchIds();

        if ($this->isGlobal()) {
            $batches = Batch::orderBy('nama_batch')->get(['id', 'nama_batch']);
            $batchLevelsAll = KelasSensei::get(['batch_id', 'level']);
        } else {
            $batches = Batch::whereIn('id', $batchIds)->orderBy('nama_batch')->get(['id', 'nama_batch']);
            $batchLevelsAll = KelasSensei::whereIn('batch_id', $batchIds)->get(['batch_id', 'level']);
        }

        $batchLevels = [];
        foreach ($batchLevelsAll as $k) {
            if (!$k->batch_id || !$k->level) continue;
            if (!isset($batchLevels[$k->batch_id])) $batchLevels[$k->batch_id] = [];
            if (!in_array($k->level, $batchLevels[$k->batch_id])) $batchLevels[$k->batch_id][] = $k->level;
        }

        $courses = Course::orderBy('title')
            ->get(['id', 'title', 'batch_id', 'level']);

        $guruNama = Guru::query()->pluck('nama', 'user_id');

        $gurus = User::where('role', 'GURU')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn ($u) => ['id' => $u->id, 'name' => $guruNama[$u->id] ?? $u->name]);

        return response()->json([
            'batches' => $batches,
            'batch_levels' => $batchLevels,
            'courses' => $courses,
            'gurus' => $gurus,
            'categories' => QuizCategory::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function index(Request $request)
    {
        $batchIds = $this->getBranchBatchIds();
        $global = $this->isGlobal();

        $query = QuizPaket::with(['batch:id,nama_batch', 'course:id,title', 'user:id,name'])
            ->withCount(['questions', 'attempts']);

        if (!$global) {
            $query->where(function ($q) use ($batchIds) {
                $q->whereIn('batch_id', $batchIds)->orWhereNull('batch_id');
            });
        }

        if ($request->batch_id && ($global || in_array($request->batch_id, $batchIds))) {
            $query->where(function ($q) use ($request) {
                $q->where('batch_id', $request->batch_id)->orWhereNull('batch_id');
            });
        }

        if ($request->search) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        $guruNames = \App\Models\Guru::query()->pluck('nama', 'user_id');
        $pakets = $query->orderByDesc('created_at')->get()->map(function ($p) use ($guruNames) {
            $p->participants = QuizAttempt::where('quiz_paket_id', $p->id)->distinct('siswa_id')->count('siswa_id');
            $p->best_score = (int) QuizAttempt::where('quiz_paket_id', $p->id)
                ->where('status', 'submitted')
                ->max('score');
            $p->guru_name = $guruNames[$p->user_id] ?? $p->user?->name ?? '-';
            return $p;
        });

        return response()->json(['pakets' => $pakets]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'cover_image' => 'nullable|string|max:255',
            'course_id' => 'nullable|exists:lms_courses,id',
            'batch_id' => 'nullable|exists:batches,id',
            'level' => 'nullable|string|max:10',
            'category' => 'nullable|string|max:50',
            'time_limit_minutes' => 'required|integer|min:1|max:180',
            'max_attempts' => 'required|integer|min:1|max:10',
            'max_warnings' => 'required|integer|min:1|max:10',
            'passing_score' => 'nullable|integer|min:0|max:100',
            'shuffle_questions' => 'nullable|boolean',
            'status' => 'nullable|in:aktif,nonaktif',
            'user_id' => 'nullable|exists:users,id',
        ]);

        $adminId = $this->adminUser()->id;
        $data['user_id'] = $data['user_id'] ?? $adminId;
        $data['shuffle_questions'] = $request->boolean('shuffle_questions');
        $data['passing_score'] = (int) ($data['passing_score'] ?? 0);
        $data['cover_image'] = $data['cover_image'] ?? null;

        $paket = QuizPaket::create($data);

        return response()->json(['paket' => $paket->fresh()->load('batch:id,nama_batch', 'course:id,title', 'user:id,name')], 201);
    }

    public function update(Request $request, $id)
    {
        $paket = QuizPaket::findOrFail($id);

        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'cover_image' => 'nullable|string|max:255',
            'course_id' => 'nullable|exists:lms_courses,id',
            'batch_id' => 'nullable|exists:batches,id',
            'level' => 'nullable|string|max:10',
            'category' => 'nullable|string|max:50',
            'time_limit_minutes' => 'sometimes|integer|min:1|max:180',
            'max_attempts' => 'sometimes|integer|min:1|max:10',
            'max_warnings' => 'sometimes|integer|min:1|max:10',
            'passing_score' => 'nullable|integer|min:0|max:100',
            'shuffle_questions' => 'nullable|boolean',
            'status' => 'nullable|in:aktif,nonaktif',
            'user_id' => 'nullable|exists:users,id',
        ]);

        if ($request->has('shuffle_questions')) {
            $data['shuffle_questions'] = $request->boolean('shuffle_questions');
        }
        if (array_key_exists('passing_score', $data)) {
            $data['passing_score'] = (int) ($data['passing_score'] ?? 0);
        }

        $paket->update($data);

        return response()->json(['paket' => $paket->fresh()->load('batch:id,nama_batch', 'course:id,title', 'user:id,name')]);
    }

    public function destroy($id)
    {
        QuizPaket::findOrFail($id)->delete();
        return response()->json(['message' => 'Paket soal dihapus']);
    }

    public function uploadCover(Request $request)
    {
        $request->validate([
            'cover' => 'required|image|mimes:jpeg,png,jpg,webp,gif|max:2048',
        ]);

        $path = $request->file('cover')->store('quiz/covers', 'public');

        return response()->json([
            'cover_image' => $path,
            'url' => asset('storage/' . $path),
        ]);
    }

    public function uploadMedia(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:10240',
        ]);

        $file = $request->file('file');
        if ($file->isValid() && in_array($file->getMimeType(), ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp4', 'audio/m4a', 'audio/x-m4a'])) {
            $path = $file->store('quiz/media', 'public');
        } else {
            return response()->json(['message' => 'File harus berupa gambar atau audio'], 422);
        }

        return response()->json([
            'path' => $path,
            'url' => asset('storage/' . $path),
        ], 201);
    }

    public function storeCategory(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:50',
        ]);

        $category = QuizCategory::firstOrCreate(
            ['name' => trim($data['name'])],
            ['name' => trim($data['name'])]
        );

        return response()->json(['category' => $category], $category->wasRecentlyCreated ? 201 : 200);
    }

    public function updateCategory(Request $request, $id)
    {
        $category = QuizCategory::findOrFail($id);

        $data = $request->validate([
            'name' => 'required|string|max:50',
        ]);

        $category->update(['name' => trim($data['name'])]);

        return response()->json(['category' => $category]);
    }

    public function destroyCategory($id)
    {
        QuizCategory::findOrFail($id)->delete();

        return response()->json(['message' => 'Kategori dihapus']);
    }

    public function toggle($id)
    {
        $paket = QuizPaket::findOrFail($id);
        $paket->status = $paket->status === 'aktif' ? 'nonaktif' : 'aktif';
        $paket->save();
        return response()->json(['paket' => $paket->fresh(), 'status' => $paket->status]);
    }

    public function questions($paketId)
    {
        $paket = QuizPaket::findOrFail($paketId);
        return response()->json([
            'paket' => $paket->load('batch:id,nama_batch', 'course:id,title', 'user:id,name'),
            'questions' => $paket->questions,
        ]);
    }

    public function storeQuestion(Request $request, $paketId)
    {
        QuizPaket::findOrFail($paketId);

        $data = $request->validate([
            'question' => 'required|string',
            'question_type' => 'sometimes|string|in:choice,rating',
            'rating_max' => 'nullable|integer|min:2|max:10',
            'options' => 'sometimes|array',
            'options.*' => 'required|string|distinct',
            'correct_index' => 'nullable|integer|min:0',
            'points' => 'nullable|integer|min:1',
            'sort' => 'nullable|integer|min:0',
            'image_path' => 'nullable|string',
            'audio_path' => 'nullable|string',
            'audio_max_plays' => 'nullable|integer|min:1|max:99',
        ]);

        $type = $data['question_type'] ?? 'choice';
        $options = array_values($data['options'] ?? []);

        if ($type === 'rating') {
            $ratingMax = (int) ($data['rating_max'] ?? count($options) ?: 9);
            $options = array_map('strval', range(1, $ratingMax));
            $data['correct_index'] = null;
            $data['rating_max'] = $ratingMax;
        } else {
            if (count($options) < 2 || count($options) > 6) {
                return response()->json(['message' => 'Opsi jawaban minimal 2 dan maksimal 6'], 422);
            }
            if ((int) ($data['correct_index'] ?? -1) >= count($options)) {
                return response()->json(['message' => 'correct_index melebihi jumlah opsi'], 422);
            }
            $data['rating_max'] = null;
        }

        $data['quiz_paket_id'] = $paketId;
        $data['question_type'] = $type;
        $data['options'] = $options;
        $data['points'] = (int) ($data['points'] ?? 1);
        $data['sort'] = (int) ($data['sort'] ?? (QuizQuestion::where('quiz_paket_id', $paketId)->max('sort') + 1));

        $question = QuizQuestion::create($data);

        return response()->json(['question' => $question], 201);
    }

    public function updateQuestion(Request $request, $id)
    {
        $question = QuizQuestion::findOrFail($id);

        $data = $request->validate([
            'question' => 'sometimes|string',
            'question_type' => 'sometimes|string|in:choice,rating',
            'rating_max' => 'nullable|integer|min:2|max:10',
            'options' => 'sometimes|array',
            'options.*' => 'required|string|distinct',
            'correct_index' => 'nullable|integer|min:0',
            'points' => 'nullable|integer|min:1',
            'sort' => 'nullable|integer|min:0',
            'image_path' => 'nullable|string',
            'audio_path' => 'nullable|string',
            'audio_max_plays' => 'nullable|integer|min:1|max:99',
        ]);

        if (isset($data['question_type'])) {
            $type = $data['question_type'];
            if ($type === 'rating') {
                $ratingMax = (int) ($data['rating_max'] ?? $question->rating_max ?? count($question->options ?? []));
                $data['options'] = array_map('strval', range(1, $ratingMax));
                $data['correct_index'] = null;
                $data['rating_max'] = $ratingMax;
            } else {
                $data['rating_max'] = null;
                if (isset($data['options'])) {
                    $options = array_values($data['options']);
                    if (count($options) < 2 || count($options) > 6) {
                        return response()->json(['message' => 'Opsi jawaban minimal 2 dan maksimal 6'], 422);
                    }
                    if (isset($data['correct_index']) && $data['correct_index'] !== null && (int) $data['correct_index'] >= count($options)) {
                        return response()->json(['message' => 'correct_index melebihi jumlah opsi'], 422);
                    }
                    $data['options'] = $options;
                }
            }
        } elseif (isset($data['options'])) {
            $options = array_values($data['options']);
            if (count($options) < 2 || count($options) > 6) {
                return response()->json(['message' => 'Opsi jawaban minimal 2 dan maksimal 6'], 422);
            }
            if (isset($data['correct_index']) && $data['correct_index'] !== null && (int) $data['correct_index'] >= count($options)) {
                return response()->json(['message' => 'correct_index melebihi jumlah opsi'], 422);
            }
            $data['options'] = $options;
        }

        $question->update($data);
        return response()->json(['question' => $question->fresh()]);
    }

    public function deleteQuestion($id)
    {
        QuizQuestion::findOrFail($id)->delete();
        return response()->json(['message' => 'Soal dihapus']);
    }

    // ==================== MATERI (per-paket) ====================

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
            if ($lesson && $lesson->file_path) {
                Storage::disk('public')->delete($lesson->file_path);
            }
            $file = $request->file('file');
            $data['file_path'] = $file->store('lms/lesson-files', 'public');
            $data['file_name'] = $file->getClientOriginalName();
            $data['file_type'] = $file->getMimeType();
            $data['file_size'] = $file->getSize();
        } elseif ($request->input('remove_file') === '1' && $lesson && $lesson->file_path) {
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

    public function materi($paketId)
    {
        $paket = QuizPaket::findOrFail($paketId);
        $lessons = Lesson::where('paket_id', $paket->id)
            ->with('slides')
            ->orderBy('sort')
            ->get();
        return response()->json(['paket' => $paket, 'lessons' => $lessons]);
    }

    public function storeMateri(Request $request, $paketId)
    {
        $paket = QuizPaket::findOrFail($paketId);

        $data = $request->validate([
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

        $data['paket_id'] = $paket->id;
        $data['course_id'] = $paket->course_id;
        $data['sort'] = (int) ($data['sort'] ?? (Lesson::where('paket_id', $paket->id)->max('sort') + 1));

        $lesson = Lesson::create($data);
        if ($request->hasFile('slides')) {
            $this->syncLessonSlides($lesson, $request);
        }
        return response()->json(['lesson' => $lesson->fresh()->load('slides')], 201);
    }

    public function updateMateri(Request $request, $id)
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

    public function deleteMateri($id)
    {
        $lesson = Lesson::findOrFail($id);
        $this->destroyLessonFiles($lesson);
        $lesson->delete();
        return response()->json(['message' => 'Materi dihapus']);
    }

    public function results($paketId)
    {
        $paket = QuizPaket::findOrFail($paketId);

        $attempts = QuizAttempt::with('siswa:id,nama,batch,level')
            ->where('quiz_paket_id', $paket->id)
            ->orderByDesc('created_at')
            ->get();

        $participants = $attempts->groupBy('siswa_id')->map(function ($rows) {
            $siswa = $rows->first()->siswa;
            return [
                'siswa_id' => (int) $rows->first()->siswa_id,
                'nama' => $siswa?->nama ?? 'Tanpa nama',
                'batch' => $siswa?->batch,
                'level' => $siswa?->level,
                'attempts_count' => $rows->count(),
                'best_score' => (int) $rows->where('status', 'submitted')->max('score'),
                'attempts' => $rows->map(fn ($a) => [
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
                    'webcam_photo' => $a->webcam_photo ? asset('storage/' . $a->webcam_photo) : null,
                ]),
            ];
        })->values();

        return response()->json([
            'paket' => $paket->loadCount('questions'),
            'participants' => $participants,
        ]);
    }

    public function resetAttempts(Request $request, $paketId)
    {
        $paket = QuizPaket::findOrFail($paketId);

        $data = $request->validate([
            'siswa_id' => 'nullable|integer',
        ]);

        $query = QuizAttempt::where('quiz_paket_id', $paket->id);
        if (!empty($data['siswa_id'])) {
            $query->where('siswa_id', (int) $data['siswa_id']);
        }

        $count = $query->count();
        $siswaNames = $query->get()->map(fn ($a) => $a->siswa?->nama)->unique()->values();

        $query->delete();

        return response()->json([
            'message' => "Berhasil mereset {$count} percobaan",
            'deleted' => $count,
            'siswa' => $siswaNames,
        ]);
    }

    public function attemptDetail($attemptId)
    {
        $attempt = QuizAttempt::with(['paket.user', 'siswa:id,nama'])
            ->where('id', $attemptId)
            ->firstOrFail();

        $answers = $attempt->answers->keyBy('quiz_question_id');
        $rows = $attempt->paket->questions->map(function ($q) use ($answers) {
            $a = $answers->get($q->id);
            return [
                'id' => $q->id,
                'question' => $q->question,
                'question_type' => $q->question_type ?? 'choice',
                'rating_max' => $q->rating_max,
                'options' => $q->options,
                'correct_index' => $q->correct_index,
                'points' => $q->points,
                'sort' => $q->sort,
                'image_url' => $q->image_url,
                'audio_url' => $q->audio_url,
                'audio_max_plays' => $q->audio_max_plays,
                'selected_index' => $a?->selected_index,
                'is_correct' => $a?->is_correct,
            ];
        });

        return response()->json([
            'attempt' => $attempt,
            'questions' => $rows,
            'siswa' => $attempt->siswa,
        ]);
    }

    public function assignBank(Request $request)
    {
        $data = $request->validate([
            'course_id' => 'required|exists:lms_courses,id',
            'paket_ids' => 'required|array|min:1',
            'paket_ids.*' => 'integer|exists:quiz_pakets,id',
        ]);

        $attached = QuizPaket::whereIn('id', $data['paket_ids'])
            ->whereNull('course_id')
            ->update(['course_id' => $data['course_id']]);

        return response()->json([
            'attached' => $attached,
            'course_id' => $data['course_id'],
        ]);
    }
}