<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LessonRecap extends Model
{
    protected $table = 'lesson_recaps';

    protected $fillable = [
        'lesson_id',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
        'kind',
        'description',
    ];

    public function lesson()
    {
        return $this->belongsTo(Lesson::class, 'lesson_id');
    }
}