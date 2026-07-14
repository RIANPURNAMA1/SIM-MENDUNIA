<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('HR','MANAGER','KARYAWAN','KANDIDAT','GURU','AFFILIATE','ADMIN_CABANG','ACCOUNTING') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('HR','MANAGER','KARYAWAN','KANDIDAT','GURU','AFFILIATE','ADMIN_CABANG') NOT NULL");
    }
};
