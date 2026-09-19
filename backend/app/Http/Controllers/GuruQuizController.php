<?php

namespace App\Http\Controllers;

use App\Models\Batch;
use App\Models\Course;
use App\Models\KelasSensei;
use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use App\Models\QuizCategory;
use App\Models\QuizPaket;
use App\Models\QuizQuestion;
use App\Models\QuizSection;
use App\Models\Siswa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class GuruQuizController extends Controller
{
    private function guruUser()
    {
        return Auth::guard('sanctum')->user();
    }

    private function ownPaket($id, $userId)
    {
        return QuizPaket::where('user_id', $userId)->findOrFail($id);
    }

    private function accessiblePaket($id, $userId)
    {
        $paket = QuizPaket::findOrFail($id);
        if ((int) $paket->user_id === (int) $userId) {
            return $paket;
        }
        $linked = \App\Models\Lesson::whereHas('course', fn ($q) => $q->where('user_id', $userId))
            ->where(function ($q) use ($paket) {
                $q->where('paket_id', $paket->id)
                    ->orWhereHas('linkPakets', fn ($sq) => $sq->where('quiz_pakets.id', $paket->id));
            })
            ->exists();
        if ($linked) {
            return $paket;
        }
        abort(404);
    }

    private function ownQuestion($id, $userId)
    {
        $question = QuizQuestion::with('paket')->findOrFail($id);
        if ($question->paket->user_id !== $userId) {
            abort(404);
        }
        return $question;
    }

    public function leaderboard()
    {
        $user = $this->guruUser();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $packets = QuizPaket::with('course:id,title')
            ->where('user_id', $user->id)
            ->where('status', 'aktif')
            ->orderByDesc('id')
            ->take(20)
            ->get();

        $result = [];
        foreach ($packets as $paket) {
            $bestRows = QuizAttempt::query()
                ->where('quiz_paket_id', $paket->id)
                ->where('status', 'submitted')
                ->whereNotNull('score')
                ->selectRaw('siswa_id, MAX(score) as best_score, MIN(COALESCE(submitted_at, started_at)) as first_best_at')
                ->groupBy('siswa_id')
                ->orderByDesc('best_score')
                ->orderBy('first_best_at')
                ->take(5)
                ->get();

            $siswaMap = collect();
            if ($bestRows->isNotEmpty()) {
                $siswaMap = Siswa::with('batchRelasi.cabang:id,nama_cabang')
                    ->whereIn('id', $bestRows->pluck('siswa_id'))
                    ->get(['id', 'nama', 'batch_id', 'level'])
                    ->keyBy('id');
            }

            $entries = $bestRows->values()->map(function ($r, $i) use ($siswaMap) {
                $s = $siswaMap->get($r->siswa_id);
                return [
                    'rank' => $i + 1,
                    'siswa_id' => (int) $r->siswa_id,
                    'nama' => $s?->nama ?? 'Tanpa nama',
                    'batch' => $s?->batchRelasi?->nama_batch,
                    'cabang' => $s?->batchRelasi?->cabang?->nama_cabang,
                    'level' => $s?->level,
                    'best_score' => (int) $r->best_score,
                ];
            });

            $result[] = [
                'paket_id' => (int) $paket->id,
                'title' => $paket->title,
                'course' => $paket->course?->title,
                'level' => $paket->level,
                'max_score' => (int) $paket->questions()->sum('points') ?: null,
                'participants' => (int) QuizAttempt::where('quiz_paket_id', $paket->id)
                    ->where('status', 'submitted')
                    ->distinct()
                    ->count('siswa_id'),
                'entries' => $entries,
            ];
        }

        return response()->json(['leaderboard' => $result]);
    }

    public function meta()
    {
        $user = $this->guruUser();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $kelasList = KelasSensei::where('user_id', $user->id)->get();
        $batchIds = $kelasList->pluck('batch_id')->unique()->filter()->values();

        $batches = Batch::whereIn('id', $batchIds)->get(['id', 'nama_batch']);

        $batchLevels = [];
        foreach ($kelasList as $k) {
            if (!$k->batch_id || !$k->level) continue;
            $batchId = $k->batch_id;
            if (!isset($batchLevels[$batchId])) $batchLevels[$batchId] = [];
            if (!in_array($k->level, $batchLevels[$batchId])) $batchLevels[$batchId][] = $k->level;
        }

        $courses = collect();
        if ($batchIds->isNotEmpty()) {
            $courses = Course::withCount(['lessons' => function ($q) {
                $q->where('status', 'aktif');
            }])
                ->whereIn('batch_id', $batchIds)
                ->orWhereNull('batch_id')
                ->orderBy('sort')
                ->get(['id', 'title', 'batch_id', 'level']);
        }

        return response()->json([
            'batches' => $batches,
            'batch_levels' => $batchLevels,
            'courses' => $courses,
            'categories' => QuizCategory::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function index()
    {
        $user = $this->guruUser();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $pakets = QuizPaket::with(['batch:id,nama_batch', 'course:id,title'])
            ->withCount(['questions', 'attempts'])
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($p) {
                $p->participants = QuizAttempt::where('quiz_paket_id', $p->id)
                    ->distinct('siswa_id')
                    ->count('siswa_id');
                $p->best_score = (int) QuizAttempt::where('quiz_paket_id', $p->id)
                    ->where('status', 'submitted')
                    ->max('score');
                return $p;
            });

        return response()->json(['pakets' => $pakets]);
    }

    public function bank()
    {
        $user = $this->guruUser();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $pakets = QuizPaket::with('course:id,title')
            ->withCount('questions')
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['pakets' => $pakets]);
    }

    public function store(Request $request)
    {
        $user = $this->guruUser();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

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
            'quiz_template' => 'nullable|in:basic,jft',
            'status' => 'nullable|in:aktif,nonaktif',
        ]);

        $data['user_id'] = $user->id;
        $data['shuffle_questions'] = $request->boolean('shuffle_questions');
        $data['passing_score'] = (int) ($data['passing_score'] ?? 0);
        $data['cover_image'] = $data['cover_image'] ?? null;
        $data['template'] = $data['quiz_template'] ?? 'basic';
        unset($data['quiz_template']);

        $paket = QuizPaket::create($data);

        return response()->json(['paket' => $paket->fresh()->load('batch:id,nama_batch', 'course:id,title')], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $this->guruUser();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $paket = $this->ownPaket($id, $user->id);

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
            'quiz_template' => 'nullable|in:basic,jft',
            'status' => 'nullable|in:aktif,nonaktif',
        ]);

        if ($request->has('shuffle_questions')) {
            $data['shuffle_questions'] = $request->boolean('shuffle_questions');
        }
        if (array_key_exists('passing_score', $data)) {
            $data['passing_score'] = (int) ($data['passing_score'] ?? 0);
        }
        if (isset($data['quiz_template'])) {
            $data['template'] = $data['quiz_template'];
        }
        unset($data['quiz_template']);

        $paket->update($data);

        return response()->json(['paket' => $paket->fresh()->load('batch:id,nama_batch', 'course:id,title')]);
    }

    public function destroy($id)
    {
        $user = $this->guruUser();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $this->ownPaket($id, $user->id)->delete();

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
        $user = $this->guruUser();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $paket = QuizPaket::findOrFail($id);
        $paket->status = $paket->status === 'aktif' ? 'nonaktif' : 'aktif';
        $paket->save();

        return response()->json(['paket' => $paket->fresh(), 'status' => $paket->status]);
    }

    public function questions($paketId)
    {
        $user = $this->guruUser();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $paket = $this->ownPaket($paketId, $user->id);

        return response()->json([
            'paket' => $paket->load('batch:id,nama_batch', 'course:id,title'),
            'questions' => $paket->questions->load('section:id,name'),
        ]);
    }

    public function sections($paketId)
    {
        $user = $this->guruUser();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $paket = $this->ownPaket($paketId, $user->id);

        return response()->json([
            'sections' => $paket->sections()->withCount('questions')->get(),
        ]);
    }

    public function storeSection(Request $request, $paketId)
    {
        $user = $this->guruUser();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $paket = $this->ownPaket($paketId, $user->id);

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
        $user = $this->guruUser();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $section = $this->ownSection($id, $user->id);

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
        $user = $this->guruUser();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $section = $this->ownSection($id, $user->id);
        $section->delete();

        return response()->json(['message' => 'Bagian dihapus']);
    }

    private function ownSection($id, $userId)
    {
        $section = QuizSection::with('paket')->findOrFail($id);
        if ($section->paket->user_id !== $userId) {
            abort(404);
        }
        return $section;
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

    public function storeQuestion(Request $request, $paketId)
    {
        $user = $this->guruUser();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $this->ownPaket($paketId, $user->id);

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
        $data['sort'] = (int) ($data['sort'] ?? $this->nextSort($paketId));

        $question = QuizQuestion::create($data);

        return response()->json(['question' => $question], 201);
    }

    private function nextSort($paketId)
    {
        return (int) QuizQuestion::where('quiz_paket_id', $paketId)->max('sort') + 1;
    }

    public function updateQuestion(Request $request, $id)
    {
        $user = $this->guruUser();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $question = $this->ownQuestion($id, $user->id);

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
        $user = $this->guruUser();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $this->ownQuestion($id, $user->id)->delete();

        return response()->json(['message' => 'Soal dihapus']);
    }

    public function results($paketId)
    {
        $user = $this->guruUser();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $paket = $this->accessiblePaket($paketId, $user->id);

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
                'attempts' => $rows->map(function ($a) {
                    return [
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
                    ];
                }),
            ];
        })->values();

        return response()->json([
            'paket' => $paket->loadCount('questions'),
            'participants' => $participants,
        ]);
    }

    // Live proctoring monitor: ongoing attempts (or submitted within the last 2 hours)
    // with the latest webcam snapshot and answer progress. Built for polling (~3s).
    public function monitor($paketId)
    {
        $user = $this->guruUser();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $paket = $this->accessiblePaket($paketId, $user->id)->loadCount('questions');
        $paket->load('questions');

        $attempts = QuizAttempt::with(['siswa:id,nama,batch,level,batch_id', 'siswa.batchRelasi.cabang', 'answers:id,quiz_attempt_id,quiz_question_id,selected_index,answer_text,is_correct,earned_points,updated_at'])
            ->where('quiz_paket_id', $paket->id)
            ->where(function ($q) {
                $q->where('status', 'in_progress')
                    ->orWhere('submitted_at', '>', now()->subHours(2));
            })
            ->orderByDesc('created_at')
            ->get();

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
                'siswa' => [
                    'id' => (int) $a->siswa_id,
                    'nama' => $siswa?->nama ?? 'Tanpa nama',
                    'cabang' => $siswa?->batchRelasi?->cabang?->nama_cabang,
                    'batch' => $siswa?->batchRelasi?->nama_batch,
                    'level' => $siswa?->levelRekap(),
                ],
            ];
        })->values();

        return response()->json([
            'paket' => [
                'id' => $paket->id,
                'title' => $paket->title,
                'template' => $paket->template,
                'time_limit_minutes' => $paket->time_limit_minutes,
                'max_warnings' => (int) $paket->max_warnings,
                'questions_count' => (int) $paket->questions_count,
            ],
            'server_time' => now()->toIso8601String(),
            'attempts' => $rows,
        ]);
    }

    public function resetAttempts(Request $request, $paketId)
    {
        $user = $this->guruUser();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $paket = $this->ownPaket($paketId, $user->id);

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
        $user = $this->guruUser();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $attempt = QuizAttempt::with(['paket.user', 'siswa:id,nama'])
            ->where('id', $attemptId)
            ->firstOrFail();

        $this->accessiblePaket($attempt->quiz_paket_id, $user->id);

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
        $user = $this->guruUser();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $attempt = QuizAttempt::with('paket')->where('id', $attemptId)->firstOrFail();

        $this->accessiblePaket($attempt->quiz_paket_id, $user->id);

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

        return response()->json([
            'attempt' => $attempt,
            'message' => 'Nilai esai tersimpan',
        ]);
    }
}