<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizAnswer extends Model
{
    protected $fillable = [
        'quiz_attempt_id',
        'quiz_question_id',
        'selected_index',
        'selected_indexes',
        'answer_text',
        'earned_points',
        'is_correct',
        'audio_plays',
    ];

    protected $casts = [
        'selected_index' => 'integer',
        'selected_indexes' => 'array',
        'earned_points' => 'integer',
        'is_correct' => 'boolean',
        'audio_plays' => 'integer',
    ];

    public function selectedIndexList(): array
    {
        return QuizQuestion::normalizeIndexes($this->selected_indexes);
    }

    public function attempt()
    {
        return $this->belongsTo(QuizAttempt::class, 'quiz_attempt_id');
    }

    public function question()
    {
        return $this->belongsTo(QuizQuestion::class, 'quiz_question_id');
    }
}