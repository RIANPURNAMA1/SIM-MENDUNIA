<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PenilaianSetting extends Model
{
    protected $fillable = [
        'divisi_id',
        'penilaian_aktif',
    ];

    protected $casts = [
        'penilaian_aktif' => 'boolean',
    ];

    public function divisi()
    {
        return $this->belongsTo(Divisi::class);
    }
}
