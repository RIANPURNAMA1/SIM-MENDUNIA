<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'nama',
        'deskripsi',
        'harga',
        'komisi',
        'status',
    ];

    public function affiliateLinks()
    {
        return $this->hasMany(AffiliateLink::class);
    }

    public function biayaKategoris()
    {
        return $this->belongsToMany(BiayaKategori::class, 'product_biaya_kategori', 'product_id', 'kategori_id')
            ->withPivot('harga')
            ->withTimestamps();
    }
}
