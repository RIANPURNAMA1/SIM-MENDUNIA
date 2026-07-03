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
        Schema::table('lemburs', function (Blueprint $table) {
            // Menambahkan kolom jam_masuk setelah user_id
            $table->dateTime('jam_masuk')->after('user_id')->nullable();
            
            // Menambahkan kolom jam_keluar setelah jam_masuk
            $table->dateTime('jam_keluar')->after('jam_masuk')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lemburs', function (Blueprint $table) {
            $table->dropColumn(['jam_masuk', 'jam_keluar']);
        });
    }
};