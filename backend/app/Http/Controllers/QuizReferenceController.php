<?php

namespace App\Http\Controllers;

use App\Models\QuizCategory;
use App\Models\QuizReference;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class QuizReferenceController extends Controller
{
    private const FILE_RULES = 'nullable|file|mimes:pdf,jpg,jpeg,png,webp,doc,docx,xls,xlsx,ppt,pptx,txt|max:10240';

    private function guruUser()
    {
        return Auth::guard('sanctum')->user();
    }

    // ==================== SENSEI (GURU) ====================

    public function guruMeta()
    {
        $user = $this->guruUser();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return response()->json([
            'categories' => QuizCategory::orderBy('name')->get(['id', 'name']),
            'statuses' => QuizReference::STATUSES,
        ]);
    }

    public function guruIndex()
    {
        $user = $this->guruUser();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $refs = QuizReference::where('user_id', $user->id)
            ->with('category:id,name')
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['references' => $refs]);
    }

    public function guruStore(Request $request)
    {
        $user = $this->guruUser();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'category_id' => 'required|exists:quiz_categories,id',
            'description' => 'nullable|string|max:65535',
            'link' => 'nullable|url|max:500',
            'file' => self::FILE_RULES,
        ]);

        if (!$request->hasFile('file') && empty($data['link']) && empty($data['description'])) {
            return response()->json(['message' => 'Lampirkan file (PDF), isi link, atau tulis soal di kolom teks referensi terlebih dahulu'], 422);
        }

        $payload = [
            'user_id' => $user->id,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'category_id' => $data['category_id'] ?? null,
            'link' => $data['link'] ?? null,
            'status' => 'pending',
        ];

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->store('quiz-references', 'public');
            $payload['file_path'] = $path;
            $payload['file_name'] = $file->getClientOriginalName();
            $payload['file_type'] = $file->getMimeType();
            $payload['file_size'] = $file->getSize();
        }

        $ref = QuizReference::create($payload);

        return response()->json(['reference' => $ref->load('category:id,name')], 201);
    }

    public function guruDestroy($id)
    {
        $user = $this->guruUser();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $ref = QuizReference::where('user_id', $user->id)->findOrFail($id);
        if ($ref->status !== 'pending') {
            return response()->json(['message' => 'Referensi yang sudah diproses tidak bisa dihapus'], 422);
        }

        $this->deleteFile($ref);
        $ref->delete();

        return response()->json(['message' => 'Referensi dihapus']);
    }

    // ==================== MANAGER (ADMIN) ====================

    public function adminIndex(Request $request)
    {
        $perPage = (int) $request->per_page ?: 10;

        $query = QuizReference::with(['user:id,name', 'category:id,name']);

        if ($request->status && in_array($request->status, QuizReference::STATUSES, true)) {
            $query->where('status', $request->status);
        }

        if ($request->search && !empty($request->search)) {
            $q = $request->search;
            $query->where(function ($qq) use ($q) {
                $qq->where('title', 'like', '%' . $q . '%')
                    ->orWhere('description', 'like', '%' . $q . '%')
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', '%' . $q . '%'))
                    ->orWhereHas('category', fn ($c) => $c->where('name', 'like', '%' . $q . '%'));
            });
        }

        $refs = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'references' => $refs->items(),
            'categories' => QuizCategory::orderBy('name')->get(['id', 'name']),
            'counts' => [
                'pending' => QuizReference::where('status', 'pending')->count(),
                'diproses' => QuizReference::where('status', 'diproses')->count(),
                'selesai' => QuizReference::where('status', 'selesai')->count(),
                'ditolak' => QuizReference::where('status', 'ditolak')->count(),
            ],
            'pagination' => [
                'current_page' => $refs->currentPage(),
                'last_page' => $refs->lastPage(),
                'per_page' => $refs->perPage(),
                'total' => $refs->total(),
            ],
        ]);
    }

    public function adminPendingCount()
    {
        return response()->json(['pending' => QuizReference::where('status', 'pending')->count()]);
    }

    public function adminUpdateStatus(Request $request, $id)
    {
        $data = $request->validate([
            'status' => 'required|in:pending,diproses,selesai,ditolak',
            'note' => 'nullable|string|max:2000',
        ]);

        $ref = QuizReference::findOrFail($id);
        $ref->status = $data['status'];
        if (array_key_exists('note', $data)) {
            $ref->note = $data['note'] ?? null;
        }
        $ref->save();

        return response()->json(['reference' => $ref->load(['user:id,name', 'category:id,name'])]);
    }

    public function adminDestroy($id)
    {
        $ref = QuizReference::findOrFail($id);
        $this->deleteFile($ref);
        $ref->delete();

        return response()->json(['message' => 'Referensi dihapus']);
    }

    // ==================== KATEGORI ====================

    public function adminCategoryStore(Request $request)
    {
        $data = $request->validate(['name' => 'required|string|max:100']);
        $category = QuizCategory::firstOrCreate(['name' => $data['name']]);
        return response()->json(['category' => $category]);
    }

    public function adminCategoryUpdate(Request $request, $id)
    {
        $data = $request->validate(['name' => 'required|string|max:100']);
        $category = QuizCategory::findOrFail($id);
        $category->update(['name' => $data['name']]);
        return response()->json(['category' => $category]);
    }

    public function adminCategoryDestroy($id)
    {
        QuizCategory::findOrFail($id)->delete();
        return response()->json(['message' => 'Kategori dihapus']);
    }

    private function deleteFile(QuizReference $ref): void
    {
        if ($ref->file_path) {
            Storage::disk('public')->delete($ref->file_path);
        }
    }
}