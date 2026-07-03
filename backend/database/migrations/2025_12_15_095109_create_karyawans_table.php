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
        Schema::create('karyawan', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('divisi_id');
            $table->string('nip')->unique();
            $table->string('name');
            $table->string('jabatan');
            $table->string('email')->unique();
            $table->string('no_hp');
            $table->text('alamat')->nullable();
            $table->string('foto_profil')->nullable();
            $table->date('tanggal_masuk');
            $table->enum('status_kerja', ['TETAP', 'KONTRAK', 'MAGANG']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('karyawan');
    }
};
