<?php

namespace App\Http\Controllers;

use App\Models\Batch;
use App\Models\Course;
use App\Models\CourseFile;
use App\Models\Lesson;
use App\Models\LmsProgress;
use App\Models\Siswa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class LmsController extends Controller
{
    private function getSiswa()
    {
        $user = Auth::guard('sanctum')->user();
        return Siswa::where('user_id', $user->id)->first();
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
        }])->aktif()->orderBy('sort');

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

        $courses = $query->get();

        return response()->json(['courses' => $courses]);
    }

    public function courseDetail($id)
    {
        $siswa = $this->getSiswa();
        if (!$siswa) {
            return response()->json(['message' => 'Siswa not found'], 404);
        }

        $course = Course::aktif()->with(['lessons' => function ($q) {
            $q->aktif()->orderBy('sort');
        }])->findOrFail($id);

        $completedLessonIds = LmsProgress::where('siswa_id', $siswa->id)
            ->whereIn('lesson_id', $course->lessons->pluck('id'))
            ->whereNotNull('completed_at')
            ->pluck('lesson_id')
            ->toArray();

        return response()->json([
            'course' => $course,
            'completed_lesson_ids' => $completedLessonIds,
        ]);
    }

    public function lessonDetail($id)
    {
        $siswa = $this->getSiswa();
        if (!$siswa) {
            return response()->json(['message' => 'Siswa not found'], 404);
        }

        $lesson = Lesson::aktif()->with('course')->findOrFail($id);

        $progress = LmsProgress::where('lesson_id', $lesson->id)
            ->where('siswa_id', $siswa->id)
            ->first();

        return response()->json([
            'lesson' => $lesson,
            'completed' => $progress && $progress->completed_at !== null,
            'completed_at' => $progress?->completed_at,
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

    // ========== Admin CRUD ==========

    public function adminCourses()
    {
        $courses = Course::withCount(['lessons', 'files'])->orderBy('sort')->get();
        $batches = Batch::aktif()->orderBy('nama_batch')->get(['id', 'nama_batch']);
        return response()->json(['courses' => $courses, 'batches' => $batches]);
    }

    public function storeCourse(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'level' => 'nullable|string|max:50',
            'batch_id' => 'nullable|exists:batches,id',
            'sort' => 'nullable|integer|min:0',
            'status' => 'nullable|in:aktif,nonaktif',
            'image' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('lms/courses', 'public');
        }

        $course = Course::create($data);
        return response()->json(['course' => $course->loadCount('lessons')], 201);
    }

    public function updateCourse(Request $request, $id)
    {
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
        return response()->json(['course' => $course->fresh()->loadCount('lessons')]);
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

    public function adminLessons($courseId)
    {
        $course = Course::findOrFail($courseId);
        $lessons = $course->lessons()->orderBy('sort')->get();
        return response()->json(['course' => $course, 'lessons' => $lessons]);
    }

    public function storeLesson(Request $request)
    {
        $data = $request->validate([
            'course_id' => 'required|exists:lms_courses,id',
            'title' => 'required|string|max:255',
            'content' => 'nullable|string',
            'video_url' => 'nullable|string|max:500',
            'sort' => 'nullable|integer|min:0',
            'status' => 'nullable|in:aktif,nonaktif',
        ]);

        $lesson = Lesson::create($data);
        return response()->json(['lesson' => $lesson], 201);
    }

    public function updateLesson(Request $request, $id)
    {
        $lesson = Lesson::findOrFail($id);

        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'content' => 'nullable|string',
            'video_url' => 'nullable|string|max:500',
            'sort' => 'nullable|integer|min:0',
            'status' => 'nullable|in:aktif,nonaktif',
        ]);

        $lesson->update($data);
        return response()->json(['lesson' => $lesson->fresh()]);
    }

    public function deleteLesson($id)
    {
        Lesson::findOrFail($id)->delete();
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
}
