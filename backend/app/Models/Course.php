<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    protected $table = 'lms_courses';

    protected $fillable = [
        'user_id',
        'batch_id',
        'level',
        'title',
        'description',
        'image',
        'category_id',
        'kelas_sensei_id',
        'sort',
        'status',
        'alert',
        'alert_active',
        'password_course',
    ];

    protected $hidden = [
        'password_course',
    ];

    public function category()
    {
        return $this->belongsTo(LmsCategory::class, 'category_id');
    }

    public function kelasSensei()
    {
        return $this->belongsTo(KelasSensei::class, 'kelas_sensei_id');
    }

    public function lessons()
    {
        return $this->hasMany(Lesson::class, 'course_id')->orderBy('sort');
    }

    public function files()
    {
        return $this->hasMany(CourseFile::class, 'course_id');
    }

    public function pakets()
    {
        return $this->hasMany(QuizPaket::class, 'course_id');
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
