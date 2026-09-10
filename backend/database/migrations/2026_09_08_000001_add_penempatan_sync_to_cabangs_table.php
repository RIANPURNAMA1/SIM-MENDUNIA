<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cabangs', function (Blueprint $table) {
            $table->unsignedBigInteger('penempatan_cabang_id')->nullable()->after('radius');
            $table->string('penempatan_cabang_kode', 20)->nullable()->after('penempatan_cabang_id');
            $table->string('penempatan_cabang_nama')->nullable()->after('penempatan_cabang_kode');
        });
    }

    public function down(): void
    {
        Schema::table('cabangs', function (Blueprint $table) {
            $table->dropColumn(['penempatan_cabang_id', 'penempatan_cabang_kode', 'penempatan_cabang_nama']);
        });
    }
};