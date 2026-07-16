<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Product extends Model
{
    protected $fillable = [
        'nama',
        'slug',
        'deskripsi',
        'kategori_items',
        'harga',
        'komisi',
        'status',
    ];

    protected $casts = [
        'kategori_items' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function (Product $product) {
            if (empty($product->slug)) {
                $product->slug = static::generateUniqueSlug($product->nama);
            }
        });

        static::updating(function (Product $product) {
            if ($product->isDirty('nama') && empty($product->slug) || $product->getOriginal('slug') === Str::slug($product->getOriginal('nama'))) {
                $product->slug = static::generateUniqueSlug($product->nama, $product->id);
            }
        });
    }

    private static function generateUniqueSlug(string $name, ?int $exceptId = null): string
    {
        $slug = Str::slug($name);
        $original = $slug;
        $n = 1;
        $query = static::where('slug', $slug);
        if ($exceptId) $query->where('id', '!=', $exceptId);
        while ($query->exists()) {
            $slug = $original . '-' . $n++;
            $query = static::where('slug', $slug);
            if ($exceptId) $query->where('id', '!=', $exceptId);
        }
        return $slug;
    }

    public function affiliateLinks()
    {
        return $this->hasMany(AffiliateLink::class);
    }

    public function biayaKategoris()
    {
        return $this->belongsToMany(BiayaKategori::class, 'product_biaya_kategori', 'product_id', 'kategori_id')
            ->withPivot('harga', 'komisi')
            ->withTimestamps();
    }

    public function komisiTiers()
    {
        return $this->hasMany(KomisiTier::class)->orderBy('kategori_id')->orderBy('urutan');
    }

    public function syncKategoriItems(array $items): void
    {
        $sync = [];
        $this->syncKategoriGroup($items, null, $sync);
        $this->biayaKategoris()->sync($sync);
    }

    private function syncKategoriGroup(array $items, ?int $parentId, array &$sync): void
    {
        foreach ($items as $item) {
            $name = trim($item['name'] ?? '');
            if ($name === '') continue;

            // Match existing kategori case-insensitively by kode or nama
            $kategori = BiayaKategori::whereRaw('LOWER(kode) = ?', [strtolower($name)])
                ->orWhereRaw('LOWER(nama) = ?', [strtolower($name)])
                ->first();

            if (!$kategori) {
                $kategori = BiayaKategori::create([
                    'kode' => $name,
                    'nama' => $name,
                    'urutan' => 0,
                ]);
            }

            $sync[$kategori->id] = [
                'harga' => $item['harga'] ?? 0,
                'komisi' => $item['komisi'] ?? 0,
            ];

            $children = $item['children'] ?? [];
            if (!empty($children)) {
                $this->syncKategoriGroup($children, $kategori->id, $sync);
            }
        }
    }
}
