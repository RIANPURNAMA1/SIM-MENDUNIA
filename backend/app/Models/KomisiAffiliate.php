<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KomisiAffiliate extends Model
{
    protected $fillable = [
        'affiliate_link_id',
        'pendaftar_id',
        'kategori_id',
        'jumlah',
        'status',
    ];

    public function affiliateLink()
    {
        return $this->belongsTo(AffiliateLink::class);
    }

    public function pendaftar()
    {
        return $this->belongsTo(Pendaftar::class);
    }

    public function kategori()
    {
        return $this->belongsTo(BiayaKategori::class, 'kategori_id');
    }
}
