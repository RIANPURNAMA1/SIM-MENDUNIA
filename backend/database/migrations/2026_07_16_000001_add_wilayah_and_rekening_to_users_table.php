<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('provinsi')->nullable()->after('alamat');
            $table->string('kabupaten')->nullable()->after('provinsi');
            $table->string('kecamatan')->nullable()->after('kabupaten');
            $table->string('desa')->nullable()->after('kecamatan');
            $table->string('nama_rekening')->nullable()->after('desa');
            $table->string('no_rekening')->nullable()->after('nama_rekening');
            $table->string('bank')->nullable()->after('no_rekening');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'provinsi', 'kabupaten', 'kecamatan', 'desa',
                'nama_rekening', 'no_rekening', 'bank',
            ]);
        });
    }
};
