<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('HR', 'MANAGER', 'KARYAWAN', 'SISWA') NOT NULL DEFAULT 'KARYAWAN'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('HR', 'MANAGER', 'KARYAWAN') NOT NULL DEFAULT 'KARYAWAN'");
    }
};
