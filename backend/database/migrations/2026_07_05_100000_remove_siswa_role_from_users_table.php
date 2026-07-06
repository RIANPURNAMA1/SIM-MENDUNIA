<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("UPDATE users SET role = 'KANDIDAT' WHERE role = 'SISWA'");
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('HR', 'MANAGER', 'KARYAWAN', 'GURU', 'AFFILIATE', 'KANDIDAT') NOT NULL DEFAULT 'KARYAWAN'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('HR', 'MANAGER', 'KARYAWAN', 'SISWA', 'GURU', 'AFFILIATE', 'KANDIDAT') NOT NULL DEFAULT 'KARYAWAN'");
    }
};
