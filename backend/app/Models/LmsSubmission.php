<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LmsSubmission extends Model
{
    protected $table = 'lms_submissions';

    protected $fillable = [
        'assignment_id',
        'siswa_id',
        'notes',
        'file_path',
        'file_name',
        'file_size',
        'score',
        'feedback',
        'submitted_at',
        'graded_at',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'graded_at' => 'datetime',
    ];

    public function assignment()
    {
        return $this->belongsTo(LmsAssignment::class, 'assignment_id');
    }

    public function siswa()
    {
        return $this->belongsTo(Siswa::class);
    }
}
