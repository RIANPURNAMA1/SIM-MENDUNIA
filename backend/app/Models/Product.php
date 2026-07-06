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
}
