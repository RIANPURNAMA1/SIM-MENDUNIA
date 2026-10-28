<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengajuan_gajis', function (Blueprint $table) {
            $table->json('ringkasan_kehadiran')->nullable()->after('catatan');
        });
    }

    public function down(): void
    {
        Schema::table('pengajuan_gajis', function (Blueprint $table) {
            $table->dropColumn('ringkasan_kehadiran');
        });
    }
};
