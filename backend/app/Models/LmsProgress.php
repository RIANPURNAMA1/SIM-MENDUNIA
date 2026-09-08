<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LmsProgress extends Model
{
    protected $table = 'lms_progress';

    protected $fillable = [
        'lesson_id',
        'siswa_id',
        'completed_at',
        'video_duration_seconds',
        'video_watched_seconds',
        'video_percent',
        'read_seconds',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
        'video_duration_seconds' => 'integer',
        'video_watched_seconds' => 'integer',
        'video_percent' => 'integer',
        'read_seconds' => 'integer',
    ];

    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }

    public function siswa()
    {
        return $this->belongsTo(Siswa::class);
    }
}
