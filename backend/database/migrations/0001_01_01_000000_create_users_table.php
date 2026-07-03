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
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            // Info login
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->enum('role', ['HR', 'MANAGER', 'KARYAWAN']);
            $table->unsignedBigInteger('cabang_id')->nullable();
            $table->enum('status', ['AKTIF', 'NONAKTIF'])->default('AKTIF');
            $table->timestamp('last_login')->nullable();

            // Info karyawan
            $table->unsignedBigInteger('divisi_id')->nullable(); // bisa null jika bukan karyawan
            $table->unsignedBigInteger('shift_id')->nullable(); // bisa null jika bukan karyawan
            $table->string('nip')->unique()->nullable();
            $table->string('jabatan')->nullable();
            $table->string('no_hp')->nullable();
            $table->text('alamat')->nullable();
            $table->string('foto_profil')->nullable();
            $table->date('tanggal_masuk')->nullable();
            $table->enum('status_kerja', ['TETAP', 'KONTRAK', 'MAGANG'])->nullable();
            $table->json('face_embedding')->nullable();

            // new data 
            $table->string('foto_ktp')->nullable();           // Scan KTP
            $table->string('foto_ijazah')->nullable();        // Scan ijazah
            $table->string('foto_kk')->nullable();            // Kartu keluarga
            $table->string('cv_file')->nullable();            // CV
            $table->string('sertifikat_file')->nullable();    // Sertifikat pendukung
            $table->string('tempat_lahir')->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->enum('jenis_kelamin', ['L', 'P'])->nullable();
            $table->enum('agama', ['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU'])->nullable();
            $table->enum('status_pernikahan', ['BELUM MENIKAH', 'MENIKAH', 'CERAI'])->nullable();



            $table->timestamps();
        });


        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('uasers');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
