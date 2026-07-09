<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PembayaranItem extends Model
{
    protected $table = 'pembayaran_items';

    protected $fillable = ['pendaftar_id', 'kategori_id', 'jumlah'];

    public function pendaftar()
    {
        return $this->belongsTo(Pendaftar::class);
    }

    public function kategori()
    {
        return $this->belongsTo(BiayaKategori::class, 'kategori_id');
    }
}
