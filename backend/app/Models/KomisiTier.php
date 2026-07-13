<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KomisiTier extends Model
{
    protected $fillable = [
        'product_id',
        'kategori_id',
        'min_orang',
        'max_orang',
        'komisi',
        'urutan',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function kategori()
    {
        return $this->belongsTo(BiayaKategori::class, 'kategori_id');
    }
}
