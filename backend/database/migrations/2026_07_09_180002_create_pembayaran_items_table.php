<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pembayaran_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pendaftar_id')->constrained('pendaftar')->cascadeOnDelete();
            $table->foreignId('kategori_id')->constrained('biaya_kategoris')->cascadeOnDelete();
            $table->decimal('jumlah', 15, 2)->default(0);
            $table->timestamps();

            $table->unique(['pendaftar_id', 'kategori_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pembayaran_items');
    }
};
