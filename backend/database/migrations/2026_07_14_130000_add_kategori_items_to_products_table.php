<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->json('kategori_items')->nullable()->after('deskripsi');
        });

        $products = DB::table('products')->get();
        foreach ($products as $product) {
            $rows = DB::table('product_biaya_kategori')
                ->join('biaya_kategoris', 'biaya_kategoris.id', '=', 'product_biaya_kategori.kategori_id')
                ->where('product_biaya_kategori.product_id', $product->id)
                ->select('biaya_kategoris.nama', 'product_biaya_kategori.harga', 'product_biaya_kategori.komisi')
                ->get();
            if ($rows->isEmpty()) continue;
            $items = $rows->map(fn($r) => [
                'name' => $r->nama,
                'harga' => (int) $r->harga,
                'komisi' => (int) ($r->komisi ?? 0),
            ])->toArray();
            DB::table('products')->where('id', $product->id)->update(['kategori_items' => json_encode($items)]);
        }
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('kategori_items');
        });
    }
};
