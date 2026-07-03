<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('absensi_siswas', function (Blueprint $table) {
            $table->foreignId('cabang_id')->nullable()->constrained('cabangs')->nullOnDelete()->after('siswa_id');
        });
    }

    public function down(): void
    {
        Schema::table('absensi_siswas', function (Blueprint $table) {
            $table->dropForeign(['cabang_id']);
            $table->dropColumn('cabang_id');
        });
    }
};
