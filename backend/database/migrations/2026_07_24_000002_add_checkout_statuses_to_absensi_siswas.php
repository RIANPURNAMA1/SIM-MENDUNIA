<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // MySQL: drop old enum, add new enum with additional statuses
        DB::statement("ALTER TABLE absensi_siswas MODIFY COLUMN status ENUM('HADIR','TERLAMBAT','PULANG LEBIH AWAL','TIDAK ABSEN PULANG','IZIN','SAKIT','ALPA','LIBUR') DEFAULT 'HADIR'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE absensi_siswas MODIFY COLUMN status ENUM('HADIR','TERLAMBAT','IZIN','SAKIT','ALPA','LIBUR') DEFAULT 'HADIR'");
    }
};
