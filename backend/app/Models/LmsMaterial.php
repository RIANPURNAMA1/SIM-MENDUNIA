<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LmsMaterial extends Model
{
    protected $table = 'lms_materials';

    protected $fillable = [
        'user_id',
        'course_id',
        'title',
        'content',
        'video_url',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
        'sort',
        'status',
    ];

    protected $casts = [
        'content' => 'string',
        'file_size' => 'integer',
        'sort' => 'integer',
    ];

    protected $appends = ['file_url'];

    public function getFileUrlAttribute()
    {
        if (!$this->file_path) return null;
        if (str_starts_with($this->file_path, 'http')) return $this->file_path;
        return asset('storage/' . $this->file_path);
    }

    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    public function lessons()
    {
        return $this->belongsToMany(Lesson::class, 'lms_lesson_materials', 'lms_material_id', 'lesson_id');
    }

    public function slides()
    {
        return $this->hasMany(LmsMaterialSlide::class, 'lms_material_id')->orderBy('sort');
    }
}