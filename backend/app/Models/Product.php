<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'nama',
        'deskripsi',
        'kategori_items',
        'harga',
        'komisi',
        'status',
    ];

    protected $casts = [
        'kategori_items' => 'array',
    ];

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
