<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentAssessment extends Model
{
    protected $fillable = [
        'component_id',
        'siswa_id',
        'batch_id',
        'user_id',
        'tanggal',
        'nilai',
    ];

    protected $casts = [
        'nilai' => 'decimal:2',
    ];

    public function component()
    {
        return $this->belongsTo(AssessmentComponent::class, 'component_id');
    }

    public function siswa()
    {
        return $this->belongsTo(Siswa::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
