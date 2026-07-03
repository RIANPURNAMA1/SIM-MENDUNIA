<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('absensi_sensei', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kelas_sensei_id')->constrained('kelas_sensei')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('tanggal');
            $table->time('jam_masuk')->nullable();
            $table->time('jam_keluar')->nullable();
            $table->enum('status', ['HADIR', 'TERLAMBAT', 'PULANG LEBIH AWAL', 'TIDAK ABSEN PULANG'])->default('HADIR');
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->unique(['kelas_sensei_id', 'user_id', 'tanggal'], 'unique_absensi_sensei');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('absensi_sensei');
    }
};
