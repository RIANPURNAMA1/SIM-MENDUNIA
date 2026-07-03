<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::table('divisis', function (Blueprint $table) {
        $table->string('kode_divisi')->nullable();
    });
}

public function down(): void
{
    Schema::table('divisis', function (Blueprint $table) {
        $table->dropColumn('kode_divisi');
    });
}
};
