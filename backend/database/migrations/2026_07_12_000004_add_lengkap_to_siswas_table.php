<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('siswas', function (Blueprint $table) {
            $table->string('nik', 50)->nullable()->after('nama');
            $table->string('no_registrasi', 50)->nullable()->after('nik');
            $table->string('real_batch', 100)->nullable()->after('batch_id');
            $table->string('desa', 100)->nullable()->after('alamat');
            $table->string('kecamatan', 100)->nullable()->after('desa');
            $table->string('kabupaten', 100)->nullable()->after('kecamatan');
            $table->string('provinsi', 100)->nullable()->after('kabupaten');
            $table->string('pendidikan_terakhir', 50)->nullable()->after('provinsi');
            $table->string('tahun_lulus', 10)->nullable()->after('pendidikan_terakhir');
            $table->string('tinggi_badan', 10)->nullable()->after('tahun_lulus');
            $table->string('berat_badan', 10)->nullable()->after('tinggi_badan');
            $table->string('goldar', 10)->nullable()->after('berat_badan');
            $table->string('ukuran_baju', 20)->nullable()->after('goldar');
            $table->string('status_pernikahan', 30)->nullable()->after('ukuran_baju');
            $table->string('no_hp_ortu', 30)->nullable()->after('no_hp');
            $table->string('nama_ortu', 100)->nullable()->after('no_hp_ortu');
            $table->string('keterangan')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('siswas', function (Blueprint $table) {
            $table->dropColumn([
                'nik', 'no_registrasi', 'real_batch', 'desa', 'kecamatan',
                'kabupaten', 'provinsi', 'pendidikan_terakhir', 'tahun_lulus',
                'tinggi_badan', 'berat_badan', 'goldar', 'ukuran_baju',
                'status_pernikahan', 'no_hp_ortu', 'nama_ortu', 'keterangan',
            ]);
        });
    }
};
