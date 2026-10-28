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
        Schema::table('absensi_sensei', function (Blueprint $table) {
            $table->enum('status', ['HADIR', 'TERLAMBAT', 'PULANG LEBIH AWAL', 'TIDAK ABSEN PULANG', 'ALPA', 'LIBUR', 'IZIN'])->default('HADIR')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('absensi_sensei', function (Blueprint $table) {
            $table->enum('status', ['HADIR', 'TERLAMBAT', 'PULANG LEBIH AWAL', 'TIDAK ABSEN PULANG', 'ALPA', 'LIBUR'])->default('HADIR')->change();
        });
    }
};
