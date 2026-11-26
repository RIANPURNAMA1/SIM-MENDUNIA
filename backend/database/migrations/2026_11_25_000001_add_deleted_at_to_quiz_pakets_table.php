<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quiz_pakets', function (Blueprint $table) {
            // Paket yang dihapus dari bank disimpan dulu di sini agar bisa dipulihkan.
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('quiz_pakets', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
