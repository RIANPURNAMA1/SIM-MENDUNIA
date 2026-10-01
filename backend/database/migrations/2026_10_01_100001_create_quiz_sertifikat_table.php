<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_sertifikat', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_paket_id')->constrained('quiz_pakets')->cascadeOnDelete();
            $table->foreignId('quiz_attempt_id')->constrained('quiz_attempts')->cascadeOnDelete();
            $table->foreignId('siswa_id')->constrained('siswas')->cascadeOnDelete();

            // Satu sertifikat per percobaan, bukan per kandidat. Kandidat
            // boleh punya beberapa sertifikat dari paket yang sama.
            $table->unique('quiz_attempt_id');

            $table->string('nomor', 40)->unique();
            $table->string('kode_verifikasi', 24)->unique();

            // Semua kolom di bawah adalah snapshot: sertifikat lama harus tetap
            // akurat walau data kandidat atau paket berubah di kemudian hari.
            $table->string('kandidat_nama');
            $table->string('kandidat_nik')->nullable();
            $table->string('kandidat_no_registrasi')->nullable();
            $table->string('paket_judul');
            $table->string('paket_kategori')->nullable();

            // Judul dan penerbit yang dicetak, disalin dari pengaturan paket
            // saat sertifikat terbit. Kalau tidak disalin, sertifikat lama
            // ikut berubah saat admin mengganti pengaturan.
            $table->string('sertifikat_judul')->nullable();
            $table->string('sertifikat_penerbit')->nullable();

            $table->string('batch_nama')->nullable();
            $table->string('level')->nullable();

            $table->unsignedInteger('nilai')->default(0);
            $table->unsignedInteger('nilai_lulus')->default(0);
            $table->boolean('lulus')->default(false);
            $table->unsignedInteger('benar')->default(0);
            $table->unsignedInteger('total_soal')->default(0);
            $table->unsignedInteger('durasi_detik')->default(0);

            $table->json('rincian_bagian')->nullable();

            $table->string('foto')->nullable();
            $table->timestamp('issued_at');
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['quiz_paket_id', 'siswa_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_sertifikat');
    }
};
