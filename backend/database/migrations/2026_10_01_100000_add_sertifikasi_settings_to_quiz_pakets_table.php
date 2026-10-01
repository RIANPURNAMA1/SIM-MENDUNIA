<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quiz_pakets', function (Blueprint $table) {
            $table->boolean('sertifikasi_aktif')->default(false)->after('penilaian_ulangan');
            $table->string('sertifikat_judul')->nullable()->after('sertifikasi_aktif');
            $table->string('sertifikat_penerbit')->nullable()->after('sertifikat_judul');
            $table->unsignedSmallInteger('sertifikat_berlaku_hari')->nullable()->after('sertifikat_penerbit');
            $table->boolean('sertifikat_wajib_foto')->default(true)->after('sertifikat_berlaku_hari');
        });

        // Foto identitas untuk sertifikat diambil sebelum ujian dimulai, jadi
        // kolomnya terpisah dari webcam_photo yang tiap 5 detik ditimpa.
        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->string('foto_wajah')->nullable()->after('webcam_photo');
        });
    }

    public function down(): void
    {
        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->dropColumn('foto_wajah');
        });

        Schema::table('quiz_pakets', function (Blueprint $table) {
            $table->dropColumn([
                'sertifikasi_aktif',
                'sertifikat_judul',
                'sertifikat_penerbit',
                'sertifikat_berlaku_hari',
                'sertifikat_wajib_foto',
            ]);
        });
    }
};
