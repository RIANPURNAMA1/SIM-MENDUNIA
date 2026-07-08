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
    ];

    protected $casts = [
        'completed_at' => 'datetime',
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
