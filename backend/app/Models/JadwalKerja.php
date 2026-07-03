<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JadwalKerja extends Model
{
    protected $fillable = [
        'karyawan_id',
        'hari',
        'jam_masuk',
        'jam_keluar',
    ];

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class);
    }
}
