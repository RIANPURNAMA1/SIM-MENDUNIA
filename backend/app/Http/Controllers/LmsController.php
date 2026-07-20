<?php

namespace App\Http\Controllers;

use App\Models\Batch;
use App\Models\Course;
use App\Models\CourseFile;
use App\Models\Lesson;
use App\Models\LmsAssignment;
use App\Models\LmsSubmission;
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

    // ========== Student Assignments ==========

    public function courseAssignments($courseId)
    {
        $siswa = $this->getSiswa();
        if (!$siswa) return response()->json(['message' => 'Siswa not found'], 404);

        $assignments = LmsAssignment::withCount('submissions')
            ->where('course_id', $courseId)
            ->aktif()
            ->orderBy('created_at', 'desc')
            ->get();

        $submittedIds = LmsSubmission::whereIn('assignment_id', $assignments->pluck('id'))
            ->where('siswa_id', $siswa->id)
            ->get()
            ->keyBy('assignment_id');

        $result = $assignments->map(function ($a) use ($submittedIds) {
            $sub = $submittedIds->get($a->id);
            return [
                'id' => $a->id,
                'course_id' => $a->course_id,
                'title' => $a->title,
                'description' => $a->description,
                'file_path' => $a->file_path,
                'file_name' => $a->file_name,
                'due_date' => $a->due_date?->format('Y-m-d'),
                'max_score' => $a->max_score,
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

    public function updateLesson(Request $request, $id)
    {
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
