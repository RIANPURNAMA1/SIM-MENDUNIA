<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LevelEvaluation extends Model
{
    protected $table = 'level_evaluations';

    protected $fillable = [
        'siswa_id',
        'batch_id',
        'level',
        'user_id',
        'evaluasi',
    ];

    public function siswa()
    {
        return $this->belongsTo(Siswa::class);
    }

    public function batch()
    {
        return $this->belongsTo(Batch::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
