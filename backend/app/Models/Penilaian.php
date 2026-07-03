<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Penilaian extends Model
{
    protected $fillable = [
        'user_id',
        'nama_siswa',
        'kelas',
        'mata_pelajaran',
        'nilai',
        'keterangan',
        'tanggal_penilaian',
    ];

    protected $casts = [
        'tanggal_penilaian' => 'date',
        'nilai' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
