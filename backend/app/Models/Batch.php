<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Batch extends Model
{
    protected $table = 'batches';

    protected $fillable = [
        'nama_batch',
        'status',
        'cabang_id',
        'kuota',
        'is_penuh_manual',
        'warna',
    ];

    public function siswas()
    {
        return $this->hasMany(Siswa::class, 'batch_id');
    }

    public function cabang()
    {
        return $this->belongsTo(Cabang::class);
    }

    public function scopeAktif($query)
    {
        return $query->where('status', 'AKTIF');
    }
}
