<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('absensi_khusus', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('tanggal');
            $table->dateTime('jam_masuk');
            $table->dateTime('jam_keluar')->nullable();
            $table->integer('total_detik')->default(0);
            $table->enum('status', ['BERJALAN', 'DITUNDA', 'SELESAI'])->default('BERJALAN');
            $table->string('foto_masuk')->nullable();
            $table->string('foto_keluar')->nullable();
            $table->string('latitude_masuk')->nullable();
            $table->string('longitude_masuk')->nullable();
            $table->string('latitude_keluar')->nullable();
            $table->string('longitude_keluar')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('absensi_khusus');
    }
};
