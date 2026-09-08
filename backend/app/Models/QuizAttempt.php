<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizAttempt extends Model
{
    protected $fillable = [
        'quiz_paket_id',
        'siswa_id',
        'attempt_number',
        'started_at',
        'submitted_at',
        'time_limit_seconds',
        'score',
        'correct_count',
        'total_count',
        'warnings',
        'auto_submitted',
        'webcam_photo',
        'status',
    ];

    protected $casts = [
        'attempt_number' => 'integer',
        'started_at' => 'datetime',
        'submitted_at' => 'datetime',
        'time_limit_seconds' => 'integer',
        'score' => 'integer',
        'correct_count' => 'integer',
        'total_count' => 'integer',
        'warnings' => 'integer',
        'auto_submitted' => 'boolean',
    ];

    public function paket()
    {
        return $this->belongsTo(QuizPaket::class, 'quiz_paket_id');
    }

    public function siswa()
    {
        return $this->belongsTo(Siswa::class, 'siswa_id');
    }

    public function answers()
    {
        return $this->hasMany(QuizAnswer::class);
    }
}