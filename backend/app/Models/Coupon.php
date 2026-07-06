<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    protected $fillable = [
        'kode',
        'product_id',
        'tipe',
        'nilai',
        'min_pembelian',
        'maks_penggunaan',
        'penggunaan',
        'berlaku_mulai',
        'berlaku_sampai',
        'status',
    ];

    protected $casts = [
        'berlaku_mulai' => 'date',
        'berlaku_sampai' => 'date',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function pendaftar()
    {
        return $this->hasMany(Pendaftar::class);
    }
}
