<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('absensi_siswas', function (Blueprint $table) {
            $table->unsignedBigInteger('kelas_sensei_id')->nullable()->after('cabang_id');
            $table->foreign('kelas_sensei_id')->references('id')->on('kelas_sensei')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('absensi_siswas', function (Blueprint $table) {
            $table->dropForeign(['kelas_sensei_id']);
            $table->dropColumn('kelas_sensei_id');
        });
    }
};
