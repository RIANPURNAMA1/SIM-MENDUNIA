<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') return;
        if (Schema::getColumnType('komisi_affiliates', 'status') !== 'enum') return;

        DB::statement(
            "ALTER TABLE komisi_affiliates
             MODIFY COLUMN status ENUM('pending','paid','cair') NOT NULL DEFAULT 'pending'"
        );

        // Normalisasi nilai kosong/asing yang mungkin tersimpan saat update 'cair' gagal
        DB::statement(
            "UPDATE komisi_affiliates
             SET status = 'pending'
             WHERE status IS NULL OR status NOT IN ('pending','paid','cair')"
        );
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') return;

        DB::statement(
            "ALTER TABLE komisi_affiliates
             MODIFY COLUMN status ENUM('pending','paid') NOT NULL DEFAULT 'pending'"
        );
    }
};
