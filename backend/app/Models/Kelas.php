<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kelas extends Model
{
    protected $table = 'kelas';

    protected $fillable = [
        'nama_kelas',
        'status',
    ];

    public function siswas()
    {
        return $this->hasMany(Siswa::class, 'kelas_id');
    }

    public function scopeAktif($query)
    {
        return $query->where('status', 'AKTIF');
    }
}
