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
        Schema::table('pendaftar', function (Blueprint $table) {
            $table->string('provinsi')->nullable()->after('alamat');
            $table->string('kabupaten')->nullable()->after('provinsi');
            $table->string('kecamatan')->nullable()->after('kabupaten');
            $table->string('desa')->nullable()->after('kecamatan');
        });
    }

    public function down(): void
    {
        Schema::table('pendaftar', function (Blueprint $table) {
            $table->dropColumn(['provinsi', 'kabupaten', 'kecamatan', 'desa']);
        });
    }
};
