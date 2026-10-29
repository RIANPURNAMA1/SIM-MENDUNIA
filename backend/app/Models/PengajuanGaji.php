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
        'no_req_list',
        'status',
        'catatan',
        'ringkasan_kehadiran',
    ];

    protected $casts = [
        'ringkasan_kehadiran' => 'array',
        'no_req_list' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
