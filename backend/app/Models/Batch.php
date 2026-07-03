<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Batch extends Model
{
    protected $table = 'batches';

    protected $fillable = [
        'nama_batch',
        'status',
    ];

    public function siswas()
    {
        return $this->hasMany(Siswa::class, 'batch_id');
    }

    public function scopeAktif($query)
    {
        return $query->where('status', 'AKTIF');
    }
}
