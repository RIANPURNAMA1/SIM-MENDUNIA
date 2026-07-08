<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    protected $table = 'lms_courses';

    protected $fillable = [
        'batch_id',
        'level',
        'title',
        'description',
        'image',
        'sort',
        'status',
    ];

    public function lessons()
    {
        return $this->hasMany(Lesson::class, 'course_id')->orderBy('sort');
    }

    public function files()
    {
        return $this->hasMany(CourseFile::class, 'course_id');
    }

    public function batch()
    {
        return $this->belongsTo(Batch::class);
    }

    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }
}
