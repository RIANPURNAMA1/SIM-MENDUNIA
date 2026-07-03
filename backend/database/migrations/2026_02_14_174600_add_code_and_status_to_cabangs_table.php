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
        Schema::table('cabangs', function (Blueprint $table) {
            // Kita tambahkan kolom kode_cabang setelah kolom ID
            $table->string('kode_cabang')->nullable(); 
            
            // Kita tambahkan kolom status_pusat setelah nama_cabang
            $table->enum('status_pusat', ['PUSAT', 'CABANG'])->default('CABANG')->after('nama_cabang');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cabangs', function (Blueprint $table) {
            $table->dropColumn(['kode_cabang', 'status_pusat']);
        });
    }
};