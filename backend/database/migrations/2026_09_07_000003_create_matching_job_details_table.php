<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('matching_job_details', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('matching_job_form_id')->nullable()->index();
            $table->unsignedBigInteger('user_id')->index();
            $table->unsignedBigInteger('pendaftar_id')->nullable()->index();
            $table->unsignedBigInteger('penempatan_kandidat_id')->nullable();
            $table->string('status_formulir')->default('draft');
            $table->string('status_progres')->nullable();

            // Langkah 1: Data Diri
            $table->string('nama_romaji')->nullable();
            $table->string('nama_katakana')->nullable();
            $table->string('nik', 32)->nullable();
            $table->string('email')->nullable();
            $table->string('email_kontak')->nullable();
            $table->unsignedBigInteger('cabang_id')->nullable();
            $table->string('tempat_lahir')->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->unsignedSmallInteger('umur')->nullable();
            $table->string('jenis_kelamin', 20)->nullable();
            $table->string('status_pernikahan', 30)->nullable();
            $table->string('agama', 30)->nullable();
            $table->decimal('tinggi_badan', 5, 1)->nullable();
            $table->decimal('berat_badan', 5, 1)->nullable();
            $table->string('golongan_darah', 5)->nullable();
            $table->string('tangan_dominan', 10)->nullable();
            $table->string('ukuran_baju', 10)->nullable();
            $table->decimal('lingkar_pinggang', 6, 1)->nullable();
            $table->decimal('panjang_telapak_kaki', 6, 1)->nullable();
            $table->string('sim_dimiliki')->nullable();
            $table->string('nomor_hp', 30)->nullable();
            $table->string('kontak_ortu_nama')->nullable();
            $table->string('kontak_ortu_hp', 30)->nullable();
            $table->text('alamat_lengkap')->nullable();
            $table->string('pendidikan_terakhir')->nullable();

            // Langkah 2: Kesehatan
            $table->boolean('sudah_vaksin')->nullable();
            $table->text('kondisi_kesehatan')->nullable();
            $table->string('penglihatan_kanan')->nullable();
            $table->string('penglihatan_kiri')->nullable();
            $table->boolean('berkacamata')->nullable();
            $table->boolean('lensa_kontak')->nullable();
            $table->boolean('buta_warna')->nullable();
            $table->boolean('bertato')->nullable();
            $table->boolean('merokok')->nullable();
            $table->boolean('minum_alkohol')->nullable();
            $table->text('riwayat_penyakit')->nullable();

            // Langkah 3: Pendidikan
            $table->json('pendidikan')->nullable();

            // Langkah 4: Pengalaman
            $table->json('pengalaman')->nullable();

            // Langkah 5: Kemampuan
            $table->string('level_jlpt', 10)->nullable();
            $table->string('level_jft', 10)->nullable();
            $table->string('lama_belajar_jepang')->nullable();
            $table->string('level_bahasa_jepang')->nullable();
            $table->string('id_prometric')->nullable();
            $table->string('password_prometric')->nullable();
            $table->json('sertifikat_ssw')->nullable();

            // Langkah 6: Keluarga
            $table->json('keluarga')->nullable();
            $table->decimal('penghasilan_keluarga', 14, 0)->nullable();

            // Langkah 7: Jepang
            $table->boolean('pernah_ke_jepang')->nullable();
            $table->boolean('keluarga_di_jepang')->nullable();
            $table->boolean('kenalan_di_jepang')->nullable();
            $table->text('tujuan_ke_jepang')->nullable();
            $table->text('alasan_ke_jepang')->nullable();
            $table->text('cita_cita_setelah_jepang')->nullable();
            $table->decimal('rencana_pengiriman_uang', 14, 0)->nullable();

            // Langkah 8: Motivasi
            $table->text('kelebihan_diri')->nullable();
            $table->text('kekurangan_diri')->nullable();
            $table->string('hobi')->nullable();
            $table->string('keahlian')->nullable();
            $table->boolean('bersedia_shift')->nullable();
            $table->boolean('bersedia_lembur')->nullable();
            $table->boolean('bersedia_hari_libur')->nullable();

            // Informasi tambahan
            $table->string('lama_tinggal_jepang')->nullable();
            $table->string('lama_kerja_perusahaan')->nullable();
            $table->string('rencana_pulang')->nullable();
            $table->string('sumber_biaya')->nullable();
            $table->string('biaya_disiapkan')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('matching_job_details');
    }
};