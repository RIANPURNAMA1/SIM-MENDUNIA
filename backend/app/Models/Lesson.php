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
        return $this->belongsToMany(QuizPaket::class, 'lms_lesson_quiz_pakets', 'lesson_id', 'quiz_paket_id');
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
}
