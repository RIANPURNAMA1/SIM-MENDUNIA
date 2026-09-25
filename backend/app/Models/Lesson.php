<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    protected $table = 'lms_lessons';

    protected $fillable = [
        'course_id',
        'paket_id',
        'title',
        'content',
        'video_url',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
        'sort',
        'status',
    ];

    protected $casts = [
        'content' => 'string',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function slides()
    {
        return $this->hasMany(LessonSlide::class, 'lesson_id')->orderBy('sort');
    }

    public function paket()
    {
        return $this->belongsTo(QuizPaket::class, 'paket_id');
    }

    public function linkPakets()
    {
        return $this->belongsToMany(QuizPaket::class, 'lms_lesson_quiz_pakets', 'lesson_id', 'quiz_paket_id')->withPivot('status', 'penilaian_ulangan', 'is_pembahasan');
    }

    public function linkMateris()
    {
        return $this->belongsToMany(LmsMaterial::class, 'lms_lesson_materials', 'lesson_id', 'lms_material_id')->orderBy('lms_lesson_materials.sort')->orderBy('lms_lesson_materials.id');
    }

    public function recap()
    {
        return $this->hasOne(LessonRecap::class, 'lesson_id');
    }

    public function progress()
    {
        return $this->hasMany(LmsProgress::class, 'lesson_id');
    }

    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }

    /**
     * Tanggal pertemuan lesson ini — diambil dari jadwal kelas
     * (daftarPertemuan kelas_sensei kursus) sesuai urutan lesson.
     */
    public function pertemuanTanggal(): ?string
    {
        $course = $this->course;
        if (!$course?->kelas_sensei_id) {
            return null;
        }

        $kelas = KelasSensei::find($course->kelas_sensei_id);
        if (!$kelas) {
            return null;
        }

        $dates = $kelas->daftarPertemuan();
        if (empty($dates)) {
            return null;
        }

        $ids = $course->lessons()->orderBy('sort')->pluck('id');
        $index = $ids->search($this->id);

        return $index !== false && isset($dates[$index]) ? $dates[$index] : null;
    }
}
