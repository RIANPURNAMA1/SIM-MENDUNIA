<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use App\Models\Product;
use App\Models\BiayaKategori;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Find all kategoris, group by lowercase nama
        $all = BiayaKategori::orderBy('urutan')->get();
        $groups = $all->groupBy(fn($k) => strtolower($k->nama));

        foreach ($groups as $namaLower => $items) {
            if ($items->count() <= 1) continue;

            // Keep the one with lowest urutan (seeder ones have urutan 1,2,...)
            $keep = $items->sortBy('urutan')->first();
            $duplicates = $items->filter(fn($k) => $k->id !== $keep->id);

            foreach ($duplicates as $dup) {
                // Migrate product_biaya_kategori pivot
                DB::table('product_biaya_kategori')
                    ->where('kategori_id', $dup->id)
                    ->update(['kategori_id' => $keep->id]);

                // Migrate pembayaran_items
                DB::table('pembayaran_items')
                    ->where('kategori_id', $dup->id)
                    ->update(['kategori_id' => $keep->id]);

                // Migrate pembayaran
                DB::table('pembayaran')
                    ->where('kategori_id', $dup->id)
                    ->update(['kategori_id' => $keep->id]);

                // Migrate batch_biayas
                DB::table('batch_biayas')
                    ->where('kategori_id', $dup->id)
                    ->update(['kategori_id' => $keep->id]);

                // Migrate komisi_tiers
                DB::table('komisi_tiers')
                    ->where('kategori_id', $dup->id)
                    ->update(['kategori_id' => $keep->id]);

                // Migrate komisi_affiliates
                DB::table('komisi_affiliates')
                    ->where('kategori_id', $dup->id)
                    ->update(['kategori_id' => $keep->id]);

                // Delete duplicate
                $dup->delete();
            }

            // Sync pivot duplicates (in case same product linked to both keep and dup)
            $keepPivotRows = DB::table('product_biaya_kategori')
                ->where('kategori_id', $keep->id)
                ->get();

            $keepByProduct = $keepPivotRows->keyBy('product_id');
            $dupIds = $duplicates->pluck('id')->toArray();

            // Delete any remaining rows referencing deleted duplicates
            DB::table('product_biaya_kategori')
                ->whereIn('kategori_id', $dupIds)
                ->delete();
        }

        // 2. Re-sync all products
        Product::all()->each(function ($product) {
            if (is_array($product->kategori_items) && count($product->kategori_items) > 0) {
                $product->syncKategoriItems($product->kategori_items);
            }
        });
    }

    public function down(): void
    {
        // This migration is not easily reversible - data integrity is maintained
    }
};
