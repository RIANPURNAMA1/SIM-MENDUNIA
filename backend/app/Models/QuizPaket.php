<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizPaket extends Model
{
    protected $fillable = [
        'user_id',
        'course_id',
        'batch_id',
        'level',
        'category',
        'title',
        'description',
        'cover_image',
        'time_limit_minutes',
        'max_attempts',
        'max_warnings',
        'passing_score',
        'shuffle_questions',
        'status',
    ];

    protected $casts = [
        'time_limit_minutes' => 'integer',
        'max_attempts' => 'integer',
        'max_warnings' => 'integer',
        'passing_score' => 'integer',
        'shuffle_questions' => 'boolean',
    ];

    protected $appends = ['cover_url'];

    public function getCoverUrlAttribute()
    {
        if (!$this->cover_image) return null;
        // Store absolute URL if already full
        if (str_starts_with($this->cover_image, 'http')) return $this->cover_image;
        return asset('storage/' . $this->cover_image);
    }

    public function scopeAktif($q)
    {
        return $q->where('status', 'aktif');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    public function batch()
    {
        return $this->belongsTo(Batch::class, 'batch_id');
    }

    public function questions()
    {
        return $this->hasMany(QuizQuestion::class)->orderBy('sort')->orderBy('id');
    }

    public function attempts()
    {
        return $this->hasMany(QuizAttempt::class);
    }
}