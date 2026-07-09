<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('product_biaya_kategori', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('kategori_id')->constrained('biaya_kategoris')->cascadeOnDelete();
            $table->decimal('harga', 12, 0)->default(0);
            $table->timestamps();
            $table->unique(['product_id', 'kategori_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('product_biaya_kategori');
    }
};
