<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BankAccount extends Model
{
    protected $table = 'bank_accounts';

    protected $fillable = [
        'bank_name',
        'bank_logo',
        'account_holder',
        'account_number',
        'branch',
        'additional_info',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'product_bank_account')->withTimestamps();
    }

    /**
     * Rekening aktif untuk sebuah program.
     * Jika program belum di-set rekening khusus, kembalikan semua rekening aktif.
     */
    public static function forProduct($product)
    {
        $productId = $product instanceof Product ? $product->id : $product;

        if ($productId) {
            $assigned = static::active()
                ->whereHas('products', fn ($q) => $q->where('products.id', $productId))
                ->orderBy('id')
                ->get();
            if ($assigned->isNotEmpty()) {
                return $assigned;
            }
        }

        return static::active()->orderBy('id')->get();
    }

    /**
     * Info rekening utama (untuk variabel notifikasi {bank_nama}, {bank_rekening}, {bank_pemilik}).
     * Fallback ke rekening di Company Profile bila tidak ada rekening aktif.
     */
    public static function primaryInfoForProduct($product, $company = null): array
    {
        $acc = static::forProduct($product)->first();
        if ($acc) {
            return [
                'bank_nama' => $acc->bank_name,
                'bank_rekening' => $acc->account_number,
                'bank_pemilik' => $acc->account_holder,
            ];
        }

        return [
            'bank_nama' => $company->bank_nama ?? '-',
            'bank_rekening' => $company->bank_nomor_rekening ?? '-',
            'bank_pemilik' => $company->bank_pemilik ?? '-',
        ];
    }

    public function getBankLogoUrlAttribute()
    {
        return $this->bank_logo ? asset('storage/' . $this->bank_logo) : null;
    }
}
