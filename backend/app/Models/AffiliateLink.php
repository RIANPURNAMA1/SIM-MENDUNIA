<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AffiliateLink extends Model
{
    protected $fillable = [
        'affiliate_id',
        'product_id',
        'kode',
        'nama_link',
        'views',
        'pendaftar_count',
        'status',
    ];

    public function affiliate()
    {
        return $this->belongsTo(User::class, 'affiliate_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function pendaftar()
    {
        return $this->hasMany(Pendaftar::class);
    }

    public function komisi()
    {
        return $this->hasMany(KomisiAffiliate::class);
    }
}
