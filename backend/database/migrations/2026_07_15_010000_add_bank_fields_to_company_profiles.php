<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('company_profiles', function (Blueprint $table) {
            $table->string('bank_nama')->nullable()->after('phone');
            $table->string('bank_nomor_rekening')->nullable()->after('bank_nama');
            $table->string('bank_pemilik')->nullable()->after('bank_nomor_rekening');
        });
    }

    public function down(): void
    {
        Schema::table('company_profiles', function (Blueprint $table) {
            $table->dropColumn(['bank_nama', 'bank_nomor_rekening', 'bank_pemilik']);
        });
    }
};
