<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Agenda extends Model
{
    use HasFactory;

    protected $table = 'agendas';

    protected $fillable = [
        'user_id',
        'judul',
        'keterangan',
        'foto',
        'tanggal',
        'jam_mulai',
        'jam_selesai',
        'jam_absen_masuk',
        'jam_absen_keluar',
        'status',
        'status_absen',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'jam_mulai' => 'datetime:H:i',
        'jam_selesai' => 'datetime:H:i',
        'jam_absen_masuk' => 'datetime:H:i',
        'jam_absen_keluar' => 'datetime:H:i',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeHariIni($query)
    {
        return $query->where('tanggal', now()->toDateString());
    }

    public function scopeTerjadwal($query)
    {
        return $query->where('status', 'terjadwal');
    }
}
