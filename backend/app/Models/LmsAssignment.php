<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LmsAssignment extends Model
{
    protected $table = 'lms_assignments';

    protected $fillable = [
        'course_id',
        'title',
        'description',
        'file_path',
        'file_name',
        'due_date',
        'max_score',
        'status',
    ];

    protected $casts = [
        'due_date' => 'date:Y-m-d',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    public function submissions()
    {
        return $this->hasMany(LmsSubmission::class, 'assignment_id');
    }

    public function pakets()
    {
        return $this->belongsToMany(QuizPaket::class, 'lms_assignment_pakets', 'assignment_id', 'quiz_paket_id');
    }

    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }
}
