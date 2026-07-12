<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('product_biaya_kategori', function (Blueprint $table) {
            $table->decimal('komisi', 15, 2)->nullable()->after('harga');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_biaya_kategori', function (Blueprint $table) {
            $table->dropColumn('komisi');
        });
    }
};
