<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pembayaran extends Model
{
    protected $table = 'pembayaran';

    protected $fillable = [
        'pendaftar_id',
        'jumlah',
        'bukti_pembayaran',
        'status',
        'kategori_id',
    ];

    public function pendaftar()
    {
        return $this->belongsTo(Pendaftar::class, 'pendaftar_id');
    }

    public function kategori()
    {
        return $this->belongsTo(BiayaKategori::class, 'kategori_id');
    }
}
