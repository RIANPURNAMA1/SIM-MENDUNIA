<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pendaftar extends Model
{
    protected $table = 'pendaftar';

    protected $fillable = [
        'affiliate_link_id',
        'product_id',
        'batch_id',
        'coupon_id',
        'nama',
        'email',
        'no_registrasi',
        'password',
        'telepon',
        'alamat',
        'bank_asal',
        'nama_rekening',
        'nominal',
        'diskon',
        'bukti_pembayaran',
        'status_pendaftaran',
        'status_pembayaran',
        'user_id',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'nominal' => 'decimal:2',
    ];

    public function affiliateLink()
    {
        return $this->belongsTo(AffiliateLink::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function batch()
    {
        return $this->belongsTo(Batch::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function coupon()
    {
        return $this->belongsTo(Coupon::class);
    }

    public function siswa()
    {
        return $this->hasOne(Siswa::class, 'user_id', 'user_id');
    }
}
