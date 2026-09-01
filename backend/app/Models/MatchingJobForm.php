<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MatchingJobForm extends Model
{
    protected $table = 'matching_job_forms';

    protected $fillable = [
        'user_id',
        'pendaftar_id',
        'penempatan_kandidat_id',
        'status_formulir',
        'nama',
        'email',
        'data',
    ];

    protected $casts = [
        'data' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function pendaftar()
    {
        return $this->belongsTo(Pendaftar::class);
    }
}
