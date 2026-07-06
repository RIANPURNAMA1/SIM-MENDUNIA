<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('kode')->unique();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('tipe', ['persen', 'nominal']);
            $table->decimal('nilai', 15, 2);
            $table->decimal('min_pembelian', 15, 2)->default(0);
            $table->integer('maks_penggunaan')->nullable();
            $table->integer('penggunaan')->default(0);
            $table->date('berlaku_mulai')->nullable();
            $table->date('berlaku_sampai')->nullable();
            $table->string('status')->default('aktif');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coupons');
    }
};
