<?php

namespace App\Http\Controllers;

use App\Models\Batch;
use App\Models\Course;
use App\Models\Guru;
use App\Models\KelasSensei;
use App\Models\Lesson;
use App\Models\LessonSlide;
use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use App\Models\QuizCategory;
use App\Models\QuizPaket;
use App\Models\QuizQuestion;
use App\Models\QuizSection;
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
        $global = $this->isGlobal();

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

        $paketScope = function ($q) use ($batchIds, $global) {
            if (!$global) {
                $q->where(function ($sub) use ($batchIds) {
                    $sub->whereIn('batch_id', $batchIds)->orWhereNull('batch_id');
                });
            }
        };

        $totalPaketsQuery = QuizPaket::query();
        $paketScope($totalPaketsQuery);

        return response()->json([
            'batches' => $batches,
            'batch_levels' => $batchLevels,
            'courses' => $courses,
            'gurus' => $gurus,
            'total_pakets' => $totalPaketsQuery->count(),
            'categories' => QuizCategory::orderBy('name')->get(['id', 'name'])->map(function ($c) use ($paketScope) {
                $countQuery = QuizPaket::where('category', $c->name);
                $paketScope($countQuery);
                $c->paket_count = $countQuery->count();
                return $c;
            }),
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

        if ($request->search && !empty($request->search)) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        if ($request->category && !empty($request->category)) {
            $query->where('category', $request->category);
        }

        $guruNames = \App\Models\Guru::query()->pluck('nama', 'user_id');

        $decorate = function ($p) use ($guruNames) {
            $p->participants = QuizAttempt::where('quiz_paket_id', $p->id)->distinct('siswa_id')->count('siswa_id');
            $p->best_score = (int) QuizAttempt::where('quiz_paket_id', $p->id)
                ->where('status', 'submitted')
                ->max('score');
            $p->guru_name = $guruNames[$p->user_id] ?? $p->user?->name ?? '-';
            return $p;
        };

        if ($request->filled('per_page')) {
            $perPage = (int) $request->per_page;
            $paginated = $query->orderByDesc('created_at')->paginate($perPage)->through($decorate);
            return response()->json([
                'pakets' => $paginated->items(),
                'pagination' => [
                    'current_page' => $paginated->currentPage(),
                    'last_page' => $paginated->lastPage(),
                    'per_page' => $paginated->perPage(),
                    'total' => $paginated->total(),
                ],
            ]);
        }

        $pakets = $query->orderByDesc('created_at')->get()->map($decorate);

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
            'max_attempts' => 'required|integer|min:0|max:10',
            'max_warnings' => 'required|integer|min:1|max:10',
            'passing_score' => 'nullable|integer|min:0|max:200',
            'shuffle_questions' => 'nullable|boolean',
            'quiz_template' => 'nullable|in:basic,jft',
            'camera_enabled' => 'nullable|boolean',
            'block_exit' => 'nullable|boolean',
            'status' => 'nullable|in:aktif,nonaktif',
            'user_id' => 'nullable|exists:users,id',
        ]);

        $adminId = $this->adminUser()->id;
        $data['user_id'] = $data['user_id'] ?? $adminId;
        $data['shuffle_questions'] = $request->boolean('shuffle_questions');
        $data['camera_enabled'] = $request->boolean('camera_enabled', true);
        $data['block_exit'] = $request->boolean('block_exit', true);
        $data['passing_score'] = (int) ($data['passing_score'] ?? 0);
        $data['cover_image'] = $data['cover_image'] ?? null;
        $data['template'] = $data['quiz_template'] ?? 'basic';
        unset($data['quiz_template']);

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
            'max_attempts' => 'sometimes|integer|min:0|max:10',
            'max_warnings' => 'sometimes|integer|min:1|max:10',
            'passing_score' => 'nullable|integer|min:0|max:200',
            'shuffle_questions' => 'nullable|boolean',
            'quiz_template' => 'nullable|in:basic,jft',
            'camera_enabled' => 'nullable|boolean',
            'block_exit' => 'nullable|boolean',
            'status' => 'nullable|in:aktif,nonaktif',
            'user_id' => 'nullable|exists:users,id',
        ]);

        if ($request->has('shuffle_questions')) {
            $data['shuffle_questions'] = $request->boolean('shuffle_questions');
        }
        if ($request->has('camera_enabled')) {
            $data['camera_enabled'] = $request->boolean('camera_enabled');
        }
        if ($request->has('block_exit')) {
            $data['block_exit'] = $request->boolean('block_exit');
        }
        if (array_key_exists('passing_score', $data)) {
            $data['passing_score'] = (int) ($data['passing_score'] ?? 0);
        }
        if (isset($data['quiz_template'])) {
            $data['template'] = $data['quiz_template'];
        }
        unset($data['quiz_template']);

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
            'file' => 'required|file',
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
            'questions' => $paket->questions->load('section:id,name'),
        ]);
    }

    public function sections($paketId)
    {
        $paket = QuizPaket::findOrFail($paketId);
        return response()->json([
            'sections' => $paket->sections()->withCount('questions')->get(),
        ]);
    }

    public function storeSection(Request $request, $paketId)
    {
        $paket = QuizPaket::findOrFail($paketId);

        $data = $request->validate([
            'name' => 'required|string|max:100',
            'sort' => 'nullable|integer|min:0',
        ]);

        $sort = $data['sort'] ?? ((int) $paket->sections()->max('sort')) + 1;

        $section = QuizSection::create([
            'quiz_paket_id' => $paketId,
            'name' => trim($data['name']),
            'sort' => $sort,
        ]);

        return response()->json(['section' => $section->loadCount('questions')], 201);
    }

    public function updateSection(Request $request, $id)
    {
        $section = QuizSection::findOrFail($id);

        $data = $request->validate([
            'name' => 'required|string|max:100',
            'sort' => 'nullable|integer|min:0',
        ]);

        $section->update([
            'name' => trim($data['name']),
            'sort' => $data['sort'] ?? $section->sort,
        ]);

        return response()->json(['section' => $section->fresh()->loadCount('questions')]);
    }

    public function deleteSection($id)
    {
        $section = QuizSection::findOrFail($id);
        $section->delete();

        return response()->json(['message' => 'Bagian dihapus']);
    }

    public function storeQuestion(Request $request, $paketId)
    {
        QuizPaket::findOrFail($paketId);

$data = $request->validate([
            'question' => 'nullable|string',
            'section_id' => 'nullable|integer|exists:quiz_sections,id',
            'question_type' => 'sometimes|string|in:choice,rating,essay',
            'rating_max' => 'nullable|integer|min:2|max:10',
            'options' => 'sometimes|array',
            'options.*' => 'required',
            'correct_index' => 'nullable|integer|min:0',

            'image_path' => 'nullable|string',
            'audio_path' => 'nullable|string',
            'points' => 'nullable|numeric',
            'keyword' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);

        $data['question'] = !empty(trim((string) ($data['question'] ?? ''))) ? trim((string) $data['question']) : null;

        if (!empty($data['section_id']) && !QuizSection::where('id', $data['section_id'])->where('quiz_paket_id', $paketId)->exists()) {
            return response()->json(['message' => 'Bagian tidak valid untuk paket ini'], 422);
        }

        $type = $data['question_type'] ?? 'choice';
        $options = $this->normalizeOptions($data['options'] ?? []);

        if ($type === 'essay') {
            $options = [];
            $data['correct_index'] = null;
            $data['rating_max'] = null;
            $data['keyword'] = !empty(trim((string) ($data['keyword'] ?? ''))) ? trim((string) $data['keyword']) : null;
        } elseif ($type === 'rating') {
            $ratingMax = (int) ($data['rating_max'] ?? count($options) ?: 9);
            $options = array_map('strval', range(1, $ratingMax));
            $data['correct_index'] = null;
            $data['rating_max'] = $ratingMax;
        } else {
            if (count($options) < 2 || count($options) > 6) {
                return response()->json(['message' => 'Opsi jawaban minimal 2 dan maksimal 6'], 422);
            }
            $searchable = array_map(fn ($o) => $o['text'] . '|' . ($o['image_path'] ?? ''), $options);
            if (count(array_unique($searchable)) !== count($searchable)) {
                return response()->json(['message' => 'Opsi jawaban tidak boleh duplikat'], 422);
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

    public function storeQuestionsBulk(Request $request, $paketId)
    {
        QuizPaket::findOrFail($paketId);

        $request->validate([
            'questions' => 'required|array|min:1|max:500',
            'questions.*.question' => 'nullable|string',
            'questions.*.section' => 'nullable|string|max:100',
            'questions.*.section_id' => 'nullable|integer',
            'questions.*.question_type' => 'nullable|in:choice,rating,essay',
            'questions.*.rating_max' => 'nullable|integer|min:2|max:10',
            'questions.*.options' => 'nullable|array',
            'questions.*.correct_index' => 'nullable|integer|min:0',
            'questions.*.keyword' => 'nullable|string',
            'questions.*.points' => 'nullable|numeric',
            'questions.*.image_path' => 'nullable|string',
            'questions.*.audio_path' => 'nullable|string',
            'questions.*.audio_max_plays' => 'nullable|integer|min:1|max:99',
        ]);

        $sort = (int) QuizQuestion::where('quiz_paket_id', $paketId)->max('sort') + 1;
        $created = 0;
        $errors = [];

        foreach ($request->questions as $q) {
            try {
                $type = $q['question_type'] ?? 'choice';
                $questionText = !empty(trim((string) ($q['question'] ?? ''))) ? trim((string) $q['question']) : null;

                $sectionId = null;
                if (!empty($q['section_id'])) {
                    $sectionId = (int) $q['section_id'];
                    if (!QuizSection::where('id', $sectionId)->where('quiz_paket_id', $paketId)->exists()) {
                        $sectionId = null;
                    }
                }
                if ($sectionId === null && !empty(trim((string) ($q['section'] ?? '')))) {
                    $name = trim((string) $q['section']);
                    $section = QuizSection::where('quiz_paket_id', $paketId)->where('name', $name)->first();
                    if (!$section) {
                        $section = QuizSection::create([
                            'quiz_paket_id' => $paketId,
                            'name' => $name,
                            'sort' => ((int) QuizSection::where('quiz_paket_id', $paketId)->max('sort')) + 1,
                        ]);
                    }
                    $sectionId = $section->id;
                }

                $options = $this->normalizeOptions($q['options'] ?? []);
                $data = [
                    'quiz_paket_id' => $paketId,
                    'question_type' => $type,
                    'section_id' => $sectionId,
                    'image_path' => !empty($q['image_path']) ? $q['image_path'] : null,
                    'audio_path' => !empty($q['audio_path']) ? $q['audio_path'] : null,
                    'audio_max_plays' => !empty($q['audio_path']) && !empty($q['audio_max_plays']) ? (int) $q['audio_max_plays'] : null,
                    'sort' => $sort++,
                ];

                if ($type === 'essay') {
                    $data['options'] = [];
                    $data['correct_index'] = null;
                    $data['rating_max'] = null;
                    $data['keyword'] = !empty(trim((string) ($q['keyword'] ?? ''))) ? trim((string) $q['keyword']) : null;
                } elseif ($type === 'rating') {
                    $ratingMax = (int) ($q['rating_max'] ?? 9);
                    $ratingMax = max(2, min(10, $ratingMax));
                    $data['options'] = array_map('strval', range(1, $ratingMax));
                    $data['correct_index'] = null;
                    $data['rating_max'] = $ratingMax;
                } else {
                    $options = array_values(array_filter($options, fn ($o) => $o['text'] !== '' || $o['image_path'] !== null));
                    if (count($options) < 2) {
                        $errors[] = 'Soal "' . mb_substr((string) ($questionText ?? '(tanpa teks)'), 0, 40) . '": minimal 2 opsi jawaban (dilewati)';
                        continue;
                    }
                    $data['options'] = array_slice($options, 0, 6);
                    $data['correct_index'] = isset($q['correct_index']) && (int) $q['correct_index'] < count($data['options']) ? (int) $q['correct_index'] : null;
                    $data['rating_max'] = null;
                }

                $data['question'] = $questionText;
                $data['points'] = max(0, (int) ($q['points'] ?? 1));

                QuizQuestion::create($data);
                $created++;
            } catch (\Throwable $e) {
                $errors[] = 'Gagal menyimpan: ' . $e->getMessage();
            }
        }

        return response()->json([
            'message' => $created . ' soal berhasil ditambahkan',
            'created' => $created,
            'errors' => $errors,
        ], 200);
    }

    public function updateQuestion(Request $request, $id)
    {
        $question = QuizQuestion::findOrFail($id);

        $data = $request->validate([
            'question' => 'sometimes|nullable|string',
            'section_id' => 'nullable|integer|exists:quiz_sections,id',
            'question_type' => 'sometimes|string|in:choice,rating,essay',
            'rating_max' => 'nullable|integer|min:2|max:10',
            'options' => 'sometimes|array',
            'options.*' => 'required',
            'correct_index' => 'nullable|integer|min:0',
            'keyword' => 'nullable|string|max:2000',
            'points' => 'nullable|integer|min:1',
            'sort' => 'nullable|integer|min:0',
            'image_path' => 'nullable|string',
            'audio_path' => 'nullable|string',
            'audio_max_plays' => 'nullable|integer|min:1|max:99',
        ]);

        if (isset($data['question'])) {
            $data['question'] = !empty(trim((string) $data['question'])) ? trim((string) $data['question']) : null;
        }

        if (!empty($data['section_id']) && !QuizSection::where('id', $data['section_id'])->where('quiz_paket_id', $question->quiz_paket_id)->exists()) {
            return response()->json(['message' => 'Bagian tidak valid untuk paket ini'], 422);
        }

        if (isset($data['question_type'])) {
            $type = $data['question_type'];
            if ($type === 'essay') {
                $data['options'] = [];
                $data['correct_index'] = null;
                $data['rating_max'] = null;
                $data['keyword'] = !empty(trim((string) ($data['keyword'] ?? ''))) ? trim((string) $data['keyword']) : null;
            } elseif ($type === 'rating') {
                $ratingMax = (int) ($data['rating_max'] ?? $question->rating_max ?? count($question->options ?? []));
                $data['options'] = array_map('strval', range(1, $ratingMax));
                $data['correct_index'] = null;
                $data['rating_max'] = $ratingMax;
            } else {
                $data['rating_max'] = null;
                if (isset($data['options'])) {
                    $options = $this->normalizeOptions($data['options']);
                    if (count($options) < 2 || count($options) > 6) {
                        return response()->json(['message' => 'Opsi jawaban minimal 2 dan maksimal 6'], 422);
                    }
                    $searchable = array_map(fn ($o) => $o['text'] . '|' . ($o['image_path'] ?? ''), $options);
                    if (count(array_unique($searchable)) !== count($searchable)) {
                        return response()->json(['message' => 'Opsi jawaban tidak boleh duplikat'], 422);
                    }
                    if (isset($data['correct_index']) && $data['correct_index'] !== null && (int) $data['correct_index'] >= count($options)) {
                        return response()->json(['message' => 'correct_index melebihi jumlah opsi'], 422);
                    }
                    $data['options'] = $options;
                }
            }
        } elseif (isset($data['options'])) {
            $options = $this->normalizeOptions($data['options']);
            if (count($options) < 2 || count($options) > 6) {
                return response()->json(['message' => 'Opsi jawaban minimal 2 dan maksimal 6'], 422);
            }
            $searchable = array_map(fn ($o) => $o['text'] . '|' . ($o['image_path'] ?? ''), $options);
            if (count(array_unique($searchable)) !== count($searchable)) {
                return response()->json(['message' => 'Opsi jawaban tidak boleh duplikat'], 422);
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

        $attempts = QuizAttempt::with(['siswa:id,nama,batch,level,batch_id', 'siswa.batchRelasi.cabang'])
            ->where('quiz_paket_id', $paket->id)
            ->orderByDesc('created_at')
            ->get();

        $participants = $attempts->groupBy('siswa_id')->map(function ($rows) {
            $siswa = $rows->first()->siswa;
            return [
                'siswa_id' => (int) $rows->first()->siswa_id,
                'nama' => $siswa?->nama ?? 'Tanpa nama',
                'cabang' => $siswa?->batchRelasi?->cabang?->nama_cabang,
                'batch' => $siswa?->batchRelasi?->nama_batch,
                'level' => $siswa?->levelRekap(),
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

    // Live proctoring monitor untuk SATU KURSUS LMS, mencakup SEMUA batch.
    // Mirip GuruQuizController::monitor tetapi tidak dibatasi kelas sensei:
    // untuk ADMIN/MANAGER/HR global (semua cabang), untuk ADMIN_CABANG
    // dibatasi batch cabangnya. Dibangun untuk polling ~3s.
    public function courseMonitor(Request $request, $courseId)
    {
        $user = $this->adminUser();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $course = Course::with('batch:id,nama_batch')->findOrFail($courseId);

        $date = $request->query('date');
        $date = $date && preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) ? $date : now()->toDateString();

        $batchIds = null;
        if (!$this->isGlobal()) {
            $ids = $this->getBranchBatchIds();
            $batchIds = empty($ids) ? null : $ids;
        }

        $pakets = QuizPaket::where('course_id', $course->id)
            ->withCount('questions')
            ->orderBy('id')
            ->get();

        $selectedId = (int) $request->query('paket_id');
        $paket = $pakets->firstWhere('id', $selectedId) ?? $pakets->first();

        if (!$paket) {
            return response()->json([
                'course' => [
                    'id' => $course->id,
                    'title' => $course->title,
                    'level' => $course->level,
                    'batch_name' => $course->batch?->nama_batch,
                ],
                'pakets' => [],
                'paket' => null,
                'server_time' => now()->toIso8601String(),
                'date' => $date,
                'dates' => [],
                'attempts' => [],
            ]);
        }

        $paket->load('questions');

        $scope = fn ($q) => $q->whereHas('siswa', fn ($sq) => $sq->whereIn('batch_id', $batchIds));

        $attempts = QuizAttempt::with(['siswa:id,nama,batch,level,batch_id', 'siswa.batchRelasi.cabang', 'answers:id,quiz_attempt_id,quiz_question_id,selected_index,answer_text,is_correct,earned_points,updated_at'])
            ->where('quiz_paket_id', $paket->id)
            ->when($batchIds !== null, $scope)
            ->where(function ($q) use ($date) {
                $q->where(function ($q2) use ($date) {
                    $q2->where('status', 'in_progress')->whereDate('created_at', $date);
                })->orWhere(function ($q2) use ($date) {
                    $q2->whereNotNull('submitted_at')->whereDate('submitted_at', $date);
                });
            })
            ->orderByDesc('created_at')
            ->get();

        $dates = QuizAttempt::where('quiz_paket_id', $paket->id)
            ->when($batchIds !== null, $scope)
            ->selectRaw('DATE(COALESCE(submitted_at, created_at)) as day, COUNT(*) as cnt')
            ->groupBy('day')
            ->orderByDesc('day')
            ->get()
            ->map(fn ($r) => [
                'date' => (string) $r->day,
                'count' => (int) $r->cnt,
                'is_today' => (string) $r->day === now()->toDateString(),
            ]);

        $rows = $attempts->map(function ($a) use ($paket) {
            $siswa = $a->siswa;

            $statuses = $paket->questions->map(function ($q) use ($a) {
                $ans = $a->answers->firstWhere('quiz_question_id', $q->id);
                if (($q->question_type ?? 'choice') === 'essay') {
                    $text = trim((string) ($ans?->answer_text ?? ''));
                    if ($text === '') return 'kosong';
                    if ($ans?->is_correct === true) return 'benar';
                    if ($ans?->is_correct === false) return 'salah';
                    return 'pending';
                }
                if (($q->question_type ?? 'choice') === 'rating') {
                    return $ans?->selected_index !== null ? 'benar' : 'kosong';
                }
                $sel = $ans?->selected_index;
                if ($sel === null) return 'kosong';
                return (int) $sel === (int) $q->correct_index ? 'benar' : 'salah';
            })->values();

            $answered = $a->answers->filter(function ($ans) {
                return ($ans->selected_index !== null && (int) $ans->selected_index >= 0)
                    || ($ans->answer_text !== null && trim($ans->answer_text) !== '');
            })->count();

            $remaining = null;
            if ($a->status === 'in_progress' && $a->started_at) {
                $end = $a->started_at->getTimestamp() + $a->time_limit_seconds;
                $remaining = max(0, $end - now()->getTimestamp());
            }

            $last = $a->answers->max('updated_at') ?? $a->updated_at;

            return [
                'attempt_id' => $a->id,
                'attempt_number' => $a->attempt_number,
                'status' => $a->status,
                'auto_submitted' => (bool) $a->auto_submitted,
                'score' => $a->score,
                'warnings' => $a->warnings,
                'max_warnings' => (int) $paket->max_warnings,
                'time_limit_seconds' => $a->time_limit_seconds,
                'remaining_seconds' => $remaining,
                'started_at' => $a->started_at?->toIso8601String(),
                'submitted_at' => $a->submitted_at?->toIso8601String(),
                'answered_count' => $answered,
                'total_count' => (int) $paket->questions_count,
                'correct_count' => $statuses->filter(fn ($s) => $s === 'benar')->count(),
                'answers_status' => $statuses->all(),
                'last_activity' => $last?->toIso8601String(),
                'paket_id' => (int) $paket->id,
                'siswa' => [
                    'id' => (int) $a->siswa_id,
                    'nama' => $siswa?->nama ?? 'Tanpa nama',
                    'cabang' => $siswa?->batchRelasi?->cabang?->nama_cabang,
                    'batch' => $siswa?->batchRelasi?->nama_batch,
                    'level' => $siswa?->levelRekap(),
                ],
            ];
        })->values();

        // Ringkasan live / kumpul hari ini per paket, untuk chip pemilih paket.
        $paketSummary = $pakets->map(function ($p) use ($batchIds, $scope) {
            return [
                'id' => $p->id,
                'title' => $p->title,
                'template' => $p->template,
                'questions_count' => (int) $p->questions_count,
                'live_today' => (int) QuizAttempt::where('quiz_paket_id', $p->id)
                    ->where('status', 'in_progress')
                    ->whereDate('created_at', now()->toDateString())
                    ->when($batchIds !== null, $scope)
                    ->count(),
                'submitted_today' => (int) QuizAttempt::where('quiz_paket_id', $p->id)
                    ->whereNotNull('submitted_at')
                    ->whereDate('submitted_at', now()->toDateString())
                    ->when($batchIds !== null, $scope)
                    ->count(),
            ];
        })->values();

        return response()->json([
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'level' => $course->level,
                'batch_name' => $course->batch?->nama_batch,
            ],
            'pakets' => $paketSummary,
            'paket' => [
                'id' => $paket->id,
                'title' => $paket->title,
                'template' => $paket->template,
                'time_limit_minutes' => $paket->time_limit_minutes,
                'max_warnings' => (int) $paket->max_warnings,
                'questions_count' => (int) $paket->questions_count,
            ],
            'server_time' => now()->toIso8601String(),
            'date' => $date,
            'dates' => $dates,
            'attempts' => $rows,
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
            'attempt' => $attempt,
            'questions' => $rows,
            'siswa' => $attempt->siswa,
        ]);
    }

    public function gradeAttempt(Request $request, $attemptId)
    {
        $attempt = QuizAttempt::with('paket')->where('id', $attemptId)->firstOrFail();

        if ($attempt->status !== 'submitted') {
            return response()->json(['message' => 'Percobaan belum selesai, tidak bisa dinilai'], 422);
        }

        $data = $request->validate([
            'grades' => 'required|array',
            'grades.*.question_id' => 'required|integer',
            'grades.*.earned_points' => 'nullable|integer|min:0',
        ]);

        $questions = $attempt->paket->questions->keyBy('id');

        foreach ($data['grades'] as $g) {
            $question = $questions->get($g['question_id']);
            if (!$question || $question->question_type !== 'essay') {
                continue;
            }

            $answer = QuizAnswer::where('quiz_attempt_id', $attempt->id)
                ->where('quiz_question_id', $question->id)
                ->first();
            if (!$answer || trim((string) $answer->answer_text) === '') {
                continue;
            }

            $earned = max(0, (int) ($g['earned_points'] ?? 0));
            $points = (int) $question->points;

            $answer->update([
                'earned_points' => $earned,
                'is_correct' => $earned >= $points ? true : ($earned > 0 ? null : false),
            ]);
        }

        $attempt->recomputeScore();
        $attempt->refresh();

        try {
            app(\App\Services\QuizAssessmentSync::class)->syncAttempt($attempt);
        } catch (\Throwable $e) {
            // Sinkronisasi nilai opsional: penyimpanan nilai esai tetap berhasil.
        }

        return response()->json([
            'attempt' => $attempt,
            'message' => 'Nilai esai tersimpan',
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

    private function normalizeOptions($options)
    {
        if (!is_array($options)) return [];
        $result = [];
        foreach ($options as $o) {
            if (is_array($o)) {
                $text = trim((string) ($o['text'] ?? ''));
                $imagePath = trim((string) ($o['image_path'] ?? ''));
                $result[] = ['text' => $text, 'image_path' => $imagePath ?: null];
            } else {
                $result[] = ['text' => (string) $o, 'image_path' => null];
            }
        }
        return $result;
    }
}