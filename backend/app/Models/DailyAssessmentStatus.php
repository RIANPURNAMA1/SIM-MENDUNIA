<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyAssessmentStatus extends Model
{
    protected $fillable = [
        'siswa_id',
        'kelas_sensei_id',
        'tanggal',
        'is_terisi',
        'user_id',
        'catatan',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'is_terisi' => 'boolean',
    ];

    public function siswa()
    {
        return $this->belongsTo(Siswa::class);
    }

    public function kelasSensei()
    {
        return $this->belongsTo(KelasSensei::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
