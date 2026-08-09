<?php

namespace App\Http\Controllers;

use App\Models\Blog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BlogController extends Controller
{
    // ========== Public endpoints ==========

    public function index(Request $request)
    {
        $query = Blog::where('status', 'publish');

        if ($request->filled('category') && $request->input('category') !== 'Semua') {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('search')) {
            $q = $request->input('search');
            $query->where(function ($sub) use ($q) {
                $sub->where('title', 'like', "%{$q}%")
                    ->orWhere('excerpt', 'like', "%{$q}%")
                    ->orWhere('content', 'like', "%{$q}%");
            });
        }

        $posts = $query->orderByDesc('created_at')->get();

        $categories = Blog::where('status', 'publish')
            ->whereNotNull('category')
            ->where('category', '!=', '')
            ->distinct()
            ->pluck('category')
            ->values();

        return response()->json([
            'success' => true,
            'data' => $posts,
            'categories' => ['Semua', ...$categories->toArray()],
        ]);
    }

    public function show($slugOrId)
    {
        $blog = is_numeric($slugOrId)
            ? Blog::where('status', 'publish')->find($slugOrId)
            : Blog::where('status', 'publish')->where('slug', $slugOrId)->first();

        if (!$blog) {
            return response()->json(['message' => 'Artikel tidak ditemukan'], 404);
        }

        // Related posts (same category, exclude current)
        $related = Blog::where('status', 'publish')
            ->where('id', '!=', $blog->id)
            ->where('category', $blog->category)
            ->orderByDesc('created_at')
            ->limit(3)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $blog,
            'related' => $related,
        ]);
    }

    // ========== Admin endpoints ==========

    public function uploadImage(Request $request)
    {
        $request->validate([
            'file' => 'required|image|mimes:jpeg,png,jpg,webp,gif|max:10240',
        ]);

        $path = $request->file('file')->store('blogs/uploads', 'public');

        return response()->json([
            'url' => asset('storage/' . $path),
        ]);
    }

    public function adminIndex(Request $request)
    {
        $query = Blog::query();

        if ($request->filled('search')) {
            $q = $request->input('search');
            $query->where('title', 'like', "%{$q}%");
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $posts = $query->orderByDesc('created_at')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $posts->items(),
            'pagination' => [
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'total' => $posts->total(),
                'per_page' => $posts->perPage(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateRequest($request);
        $data['slug'] = Blog::generateSlug($data['title']);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('blogs', 'public');
        }

        $blog = Blog::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Artikel berhasil dibuat',
            'data' => $blog,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $blog = Blog::findOrFail($id);

        $data = $this->validateRequest($request, $id);

        if ($request->has('slug') && $request->input('slug') !== $blog->slug) {
            $data['slug'] = Blog::generateSlug($data['title']);
        }

        if ($request->hasFile('image')) {
            if ($blog->image) {
                Storage::disk('public')->delete($blog->image);
            }
            $data['image'] = $request->file('image')->store('blogs', 'public');
        } elseif ($request->input('hapus_image') === '1') {
            if ($blog->image) {
                Storage::disk('public')->delete($blog->image);
            }
            $data['image'] = null;
        }

        $blog->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Artikel berhasil diperbarui',
            'data' => $blog->fresh(),
        ]);
    }

    public function destroy($id)
    {
        $blog = Blog::findOrFail($id);

        if ($blog->image) {
            Storage::disk('public')->delete($blog->image);
        }

        $blog->delete();

        return response()->json([
            'success' => true,
            'message' => 'Artikel berhasil dihapus',
        ]);
    }

    private function validateRequest(Request $request, $exceptId = null)
    {
        return $request->validate([
            'title' => 'required|string|max:255',
            'excerpt' => 'nullable|string',
            'content' => 'nullable|string',
            'category' => 'nullable|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:4096',
            'read_time' => 'nullable|integer|min:1',
            'status' => 'nullable|in:publish,draft',
        ]);
    }
}
