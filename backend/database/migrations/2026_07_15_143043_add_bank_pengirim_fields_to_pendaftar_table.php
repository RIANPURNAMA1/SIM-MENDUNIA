<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pendaftar', function (Blueprint $table) {
            $table->string('bank_pengirim', 100)->nullable()->after('nama_rekening');
            $table->string('nama_pengirim', 200)->nullable()->after('bank_pengirim');
        });
    }

    public function down(): void
    {
        Schema::table('pendaftar', function (Blueprint $table) {
            $table->dropColumn(['bank_pengirim', 'nama_pengirim']);
        });
    }
};
