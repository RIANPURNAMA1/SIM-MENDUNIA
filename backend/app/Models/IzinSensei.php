<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IzinSensei extends Model
{
    use HasFactory;

    protected $table = 'izin_senseis';

    protected $fillable = [
        'user_id',
        'kelas_sensei_id',
        'jenis_izin',
        'tgl_mulai',
        'tgl_selesai',
        'alasan',
        'jadwal_terdampak',
        'jadwal_tertentu',
        'mekanisme_pengganti',
        'pengganti_id',
        'nama_pengganti',
        'catatan_pengganti',
        'status',
        'catatan_admin',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'tgl_mulai' => 'date:Y-m-d',
        'tgl_selesai' => 'date:Y-m-d',
        'jadwal_tertentu' => 'array',
        'approved_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function kelas()
    {
        return $this->belongsTo(KelasSensei::class, 'kelas_sensei_id');
    }

    public function pengganti()
    {
        return $this->belongsTo(User::class, 'pengganti_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
