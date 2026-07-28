<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JadwalLevel extends Model
{
    protected $table = 'jadwal_levels';

    protected $fillable = [
        'batch_id',
        'level',
        'tanggal_mulai',
        'tanggal_selesai',
    ];

    protected $casts = [
        'tanggal_mulai' => 'date:Y-m-d',
        'tanggal_selesai' => 'date:Y-m-d',
    ];

    public function batch()
    {
        return $this->belongsTo(Batch::class);
    }
}
