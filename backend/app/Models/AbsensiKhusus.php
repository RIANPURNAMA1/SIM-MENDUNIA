<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AbsensiKhusus extends Model
{
    protected $table = 'absensi_khusus';

    protected $fillable = [
        'user_id',
        'tanggal',
        'jam_masuk',
        'jam_keluar',
        'total_detik',
        'status',
        'foto_masuk',
        'foto_keluar',
        'latitude_masuk',
        'longitude_masuk',
        'latitude_keluar',
        'longitude_keluar',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'jam_masuk' => 'datetime',
        'jam_keluar' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
