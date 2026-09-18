<?php

namespace App\Http\Controllers;

use App\Models\LmsMaterial;
use App\Models\LmsMaterialSlide;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class AdminMateriController extends Controller
{
    private function authUser()
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            abort(401, 'Unauthenticated');
        }
        return $user;
    }

    public function bank(Request $request)
    {
        $query = LmsMaterial::with(['course:id,title', 'slides'])
            ->withCount('lessons');

        if ($request->has('course_id') && $request->filled('course_id')) {
            $query->where('course_id', (int) $request->input('course_id'));
        }

        if ($request->has('search') && $request->filled('search')) {
            $s = $request->input('search');
            $query->where(function ($q) use ($s) {
                $q->where('title', 'like', "%{$s}%")
                    ->orWhereHas('course', function ($c) use ($s) {
                        $c->where('title', 'like', "%{$s}%");
                    });
            });
        }

        $materials = $query->orderBy('sort')->orderBy('id')->get();

        return response()->json([
            'materials' => $materials,
            'total' => $materials->count(),
        ]);
    }

    public function store(Request $request)
    {
        $user = $this->authUser();

        $data = $request->validate([
            'course_id' => 'nullable|exists:lms_courses,id',
            'title' => 'required|string|max:255',
            'content' => 'nullable|string',
            'video_url' => 'nullable|string|max:500',
            'file' => 'nullable|file|mimes:pdf|max:51200',
            'slides' => 'nullable|array|max:30',
            'slides.*' => 'file|image|mimes:jpg,jpeg,png,webp|max:10240',
            'sort' => 'nullable|integer|min:0',
            'status' => 'nullable|in:aktif,nonaktif',
        ]);

        if (array_key_exists('course_id', $data) && empty($data['course_id'])) {
            $data['course_id'] = null;
        }
        $data['user_id'] = $user->id;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $data['file_path'] = $file->store('lms/materials', 'public');
            $data['file_name'] = $file->getClientOriginalName();
            $data['file_type'] = $file->getMimeType();
            $data['file_size'] = $file->getSize();
        }

        unset($data['file'], $data['slides']);
        $material = LmsMaterial::create($data);
        if ($request->hasFile('slides')) {
            foreach ($request->file('slides') as $file) {
                LmsMaterialSlide::create([
                    'lms_material_id' => $material->id,
                    'file_path' => $file->store('lms/material-slides', 'public'),
                    'file_name' => $file->getClientOriginalName(),
                    'file_type' => $file->getMimeType(),
                    'file_size' => $file->getSize(),
                    'sort' => 0,
                ]);
            }
        }

        $material->load('course:id,title');
        $material->loadCount('lessons');

        return response()->json(['material' => $material], 201);
    }

    public function update(Request $request, $id)
    {
        $material = LmsMaterial::findOrFail($id);

        $data = $request->validate([
            'course_id' => 'nullable|exists:lms_courses,id',
            'title' => 'sometimes|string|max:255',
            'content' => 'nullable|string',
            'video_url' => 'nullable|string|max:500',
            'file' => 'nullable|file|mimes:pdf|max:51200',
            'remove_file' => 'nullable|in:0,1',
            'slides' => 'nullable|array|max:30',
            'slides.*' => 'file|image|mimes:jpg,jpeg,png,webp|max:10240',
            'remove_slides' => 'nullable|array',
            'remove_slides.*' => 'integer',
            'sort' => 'nullable|integer|min:0',
            'status' => 'nullable|in:aktif,nonaktif',
        ]);

        if (array_key_exists('course_id', $data) && empty($data['course_id'])) {
            $data['course_id'] = null;
        }

        if ($request->hasFile('file')) {
            if ($material->file_path) {
                Storage::disk('public')->delete($material->file_path);
            }
            $file = $request->file('file');
            $data['file_path'] = $file->store('lms/materials', 'public');
            $data['file_name'] = $file->getClientOriginalName();
            $data['file_type'] = $file->getMimeType();
            $data['file_size'] = $file->getSize();
        } elseif ($request->input('remove_file') === '1' && $material->file_path) {
            Storage::disk('public')->delete($material->file_path);
            $data['file_path'] = null;
            $data['file_name'] = null;
            $data['file_type'] = null;
            $data['file_size'] = null;
        }

        unset($data['file'], $data['slides'], $data['remove_slides']);
        $material->update($data);

        $this->syncMaterialSlides($material, $request);

        $material->load('course:id,title');
        $material->loadCount('lessons');
        $material->load('slides');

        return response()->json(['material' => $material->fresh()]);
    }

    private function syncMaterialSlides(LmsMaterial $material, Request $request)
    {
        if ($request->has('remove_slides')) {
            $removeIds = array_filter(array_map('intval', (array) $request->input('remove_slides')));
            $removes = $material->slides()->whereIn('id', $removeIds)->get();
            foreach ($removes as $slide) {
                Storage::disk('public')->delete($slide->file_path);
                $slide->delete();
            }
        }

        if ($request->hasFile('slides')) {
            $sort = (int) $material->slides()->max('sort');
            foreach ($request->file('slides') as $file) {
                $sort++;
                LmsMaterialSlide::create([
                    'lms_material_id' => $material->id,
                    'file_path' => $file->store('lms/material-slides', 'public'),
                    'file_name' => $file->getClientOriginalName(),
                    'file_type' => $file->getMimeType(),
                    'file_size' => $file->getSize(),
                    'sort' => $sort,
                ]);
            }
        }
    }

    public function destroy($id)
    {
        $material = LmsMaterial::findOrFail($id);
        if ($material->file_path) {
            Storage::disk('public')->delete($material->file_path);
        }
        foreach ($material->slides()->get() as $slide) {
            Storage::disk('public')->delete($slide->file_path);
        }
        $material->delete();

        return response()->json(['message' => 'Materi dihapus']);
    }
}