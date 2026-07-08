<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    protected $table = 'lms_lessons';

    protected $fillable = [
        'course_id',
        'title',
        'content',
        'video_url',
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

    public function progress()
    {
        return $this->hasMany(LmsProgress::class, 'lesson_id');
    }

    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }
}
