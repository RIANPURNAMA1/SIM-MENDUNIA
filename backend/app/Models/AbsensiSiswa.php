<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AbsensiSiswa extends Model
{
    protected $table = 'absensi_siswas';

    protected $fillable = [
        'siswa_id',
        'cabang_id',
        'kelas_sensei_id',
        'tanggal',
        'jam_masuk',
        'jam_keluar',
        'status',
        'keterangan',
        'foto_masuk',
        'foto_pulang',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'jam_masuk' => 'string',
        'jam_keluar' => 'string',
    ];

    public function siswa()
    {
        return $this->belongsTo(Siswa::class);
    }

    public function cabang()
    {
        return $this->belongsTo(Cabang::class);
    }

    public function kelasSensei()
    {
        return $this->belongsTo(KelasSensei::class);
    }
}
