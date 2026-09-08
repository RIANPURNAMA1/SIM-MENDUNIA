<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LessonSlide extends Model
{
    protected $table = 'lms_lesson_slides';

    protected $fillable = [
        'lesson_id',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
        'sort',
    ];

    public function lesson()
    {
        return $this->belongsTo(Lesson::class, 'lesson_id');
    }
}