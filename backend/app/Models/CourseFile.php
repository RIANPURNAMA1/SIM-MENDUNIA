<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CourseFile extends Model
{
    protected $table = 'lms_course_files';

    protected $fillable = [
        'course_id',
        'file_name',
        'file_path',
        'file_type',
        'file_size',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}
