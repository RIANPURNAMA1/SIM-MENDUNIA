<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lembur extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id',
        'jam_masuk',
        'jam_keluar',
        'keterangan',
        'foto',
        'status'
    ];

    // Opsional: Agar Laravel otomatis menganggap kolom ini sebagai objek Carbon (tanggal)
    protected $casts = [
        'jam_masuk' => 'datetime',
        'jam_keluar' => 'datetime',
    ];

    // Relasi ke User
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
