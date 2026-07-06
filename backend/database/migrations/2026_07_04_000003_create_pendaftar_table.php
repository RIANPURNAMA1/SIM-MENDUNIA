<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pendaftar', function (Blueprint $table) {
            $table->id();
            $table->foreignId('affiliate_link_id')->nullable()->constrained('affiliate_links')->nullOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('nama');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('telepon')->nullable();
            $table->text('alamat')->nullable();
            $table->decimal('nominal', 15, 2)->nullable();
            $table->string('bukti_pembayaran')->nullable();
            $table->enum('status_pendaftaran', ['pending', 'disetujui', 'ditolak'])->default('pending');
            $table->enum('status_pembayaran', ['unpaid', 'processing', 'verified'])->default('unpaid');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pendaftar');
    }
};
