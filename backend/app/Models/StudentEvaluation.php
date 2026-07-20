<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentEvaluation extends Model
{
    protected $table = 'student_evaluations';

    protected $fillable = [
        'siswa_id',
        'batch_id',
        'level',
        'rating',
        'komentar',
    ];

    public function siswa()
    {
        return $this->belongsTo(Siswa::class);
    }

    public function batch()
    {
        return $this->belongsTo(Batch::class);
    }
}
