<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pendaftar', function (Blueprint $table) {
            $table->enum('status_pembayaran', [
                'unpaid', 'pending', 'processing', 'verified', 'ditolak', 'refund', 'ditangguhkan',
            ])->default('unpaid')->change();
        });

        Schema::table('pembayaran', function (Blueprint $table) {
            $table->enum('status', [
                'pending', 'processing', 'verified', 'ditolak', 'refund', 'ditangguhkan',
            ])->default('pending')->change();
        });
    }

    public function down(): void
    {
        Schema::table('pendaftar', function (Blueprint $table) {
            $table->enum('status_pembayaran', [
                'unpaid', 'pending', 'processing', 'verified', 'ditolak', 'refund',
            ])->default('unpaid')->change();
        });

        Schema::table('pembayaran', function (Blueprint $table) {
            $table->enum('status', [
                'pending', 'processing', 'verified', 'ditolak', 'refund',
            ])->default('pending')->change();
        });
    }
};
