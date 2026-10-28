<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PengajuanGaji extends Model
{
    protected $table = 'pengajuan_gajis';

    protected $fillable = [
        'user_id',
        'bulan',
        'tahun',
        'jumlah',
        'keterangan',
        'status',
        'catatan',
        'ringkasan_kehadiran',
    ];

    protected $casts = [
        'ringkasan_kehadiran' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
