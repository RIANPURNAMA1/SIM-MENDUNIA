<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('izin_senseis', function (Blueprint $table) {
            $table->string('nama_pengganti')->nullable()->after('pengganti_id');
        });
    }

    public function down(): void
    {
        Schema::table('izin_senseis', function (Blueprint $table) {
            $table->dropColumn('nama_pengganti');
        });
    }
};
