<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizAttempt extends Model
{
    protected $fillable = [
        'quiz_paket_id',
        'siswa_id',
        'source',
        'source_id',
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

    /**
     * Hitung ulang score & correct_count berdasarkan semua jawaban pada attempt.
     * Esai: dihitung dari earned_points (null = belum dinilai, tidak dimasukkan).
     */
    public function recomputeScore(): void
    {
        if (!$this->relationLoaded('paket')) {
            $this->load('paket');
        }

        $answers = $this->answers()->get()->keyBy('quiz_question_id');
        $correct = 0;
        $pointsEarned = 0;
        $totalPoints = 0;

        foreach ($this->paket->questions as $q) {
            $totalPoints += (int) $q->points;
            $a = $answers->get($q->id);
            $earned = null;

            if ($q->question_type === 'essay') {
                $earned = $a && $a->earned_points !== null ? (int) $a->earned_points : null;
            } else {
                $sel = $a?->selected_index;
                $isRating = $q->question_type === 'rating';
                $earned = ($sel !== null && ($isRating || (int) $sel === (int) $q->correct_index))
                    ? (int) $q->points
                    : 0;
            }

            if ($earned !== null) {
                $pointsEarned += $earned;
            }
            if ($earned !== null && $earned > 0 && $earned >= (int) $q->points) {
                $correct++;
            }
        }

        $score = $totalPoints > 0 ? round($pointsEarned * 100 / $totalPoints) : 0;
        $this->update(['score' => (int) $score, 'correct_count' => $correct]);
    }
}