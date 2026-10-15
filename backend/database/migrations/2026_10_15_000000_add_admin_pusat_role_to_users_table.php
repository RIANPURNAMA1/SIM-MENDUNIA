<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('HR','MANAGER','KARYAWAN','KANDIDAT','GURU','AFFILIATE','ADMIN_CABANG','ACCOUNTING','ADMIN_MUTASI','ADMIN_PUSAT') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('HR','MANAGER','KARYAWAN','KANDIDAT','GURU','AFFILIATE','ADMIN_CABANG','ACCOUNTING','ADMIN_MUTASI') NOT NULL");
    }
};
