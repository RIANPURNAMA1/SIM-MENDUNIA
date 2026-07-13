<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('HR', 'MANAGER', 'KARYAWAN', 'SISWA', 'GURU', 'AFFILIATE', 'KANDIDAT', 'ADMIN_CABANG') NOT NULL DEFAULT 'KARYAWAN'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('HR', 'MANAGER', 'KARYAWAN', 'SISWA', 'GURU', 'AFFILIATE', 'KANDIDAT') NOT NULL DEFAULT 'KARYAWAN'");
    }
};
