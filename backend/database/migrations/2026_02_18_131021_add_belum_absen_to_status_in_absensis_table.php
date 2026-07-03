<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Karena enum di database sulit diubah secara langsung via Laravel Blueprint 
        // tanpa library tambahan (doctrine/dbal), kita gunakan Raw Query agar lebih aman.
        DB::statement("ALTER TABLE absensis MODIFY COLUMN status ENUM(
            'HADIR', 
            'TERLAMBAT', 
            'IZIN', 
            'ALPA', 
            'PULANG LEBIH AWAL', 
            'TIDAK ABSEN PULANG', 
            'LIBUR', 
            'BELUM ABSEN'
        ) DEFAULT 'BELUM ABSEN'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Kembalikan ke kondisi semula jika diperlukan
        DB::statement("ALTER TABLE absensis MODIFY COLUMN status ENUM(
            'HADIR', 
            'TERLAMBAT', 
            'IZIN', 
            'ALPA', 
            'PULANG LEBIH AWAL', 
            'TIDAK ABSEN PULANG', 
            'LIBUR'
        ) DEFAULT 'HADIR'");
    }
};