<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizQuestion extends Model
{
    protected $fillable = [
        'quiz_paket_id',
        'question',
        'section_id',
        'question_type',
        'rating_max',
        'options',
        'correct_index',
        'points',
        'sort',
        'image_path',
        'audio_path',
        'audio_max_plays',
    ];

    protected $casts = [
        'question_type' => 'string',
        'rating_max' => 'integer',
        'options' => 'array',
        'correct_index' => 'integer',
        'points' => 'integer',
        'sort' => 'integer',
        'audio_max_plays' => 'integer',
    ];

    protected $appends = ['image_url', 'audio_url'];

    public function paket()
    {
        return $this->belongsTo(QuizPaket::class, 'quiz_paket_id');
    }

    public function section()
    {
        return $this->belongsTo(QuizSection::class, 'section_id');
    }

    public function getImageUrlAttribute()
    {
        if (!$this->image_path) return null;
        if (str_starts_with($this->image_path, 'http')) return $this->image_path;
        return asset('storage/' . $this->image_path);
    }

    public function getAudioUrlAttribute()
    {
        if (!$this->audio_path) return null;
        if (str_starts_with($this->audio_path, 'http')) return $this->audio_path;
        return asset('storage/' . $this->audio_path);
    }
}