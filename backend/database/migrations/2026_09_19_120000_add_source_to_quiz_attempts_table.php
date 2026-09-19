<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->string('source', 20)->default('paket')->after('siswa_id');
            $table->unsignedBigInteger('source_id')->nullable()->after('source');
            $table->index(['source', 'source_id']);
        });

        // Tambah unique baru dulu (memuat kolom source/source_id) sebelum drop
        // unique lama, karena FK quiz_paket_id butuh index yang diawali kolom itu.
        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->unique(['quiz_paket_id', 'siswa_id', 'source', 'source_id', 'attempt_number'], 'quiz_attempts_ctx_attempt_unique');
        });

        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->dropUnique(['quiz_paket_id', 'siswa_id', 'attempt_number']);
        });
    }

    public function down(): void
    {
        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->unique(['quiz_paket_id', 'siswa_id', 'attempt_number']);
        });

        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->dropUnique('quiz_attempts_ctx_attempt_unique');
        });

        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->dropIndex(['source', 'source_id']);
            $table->dropColumn(['source_id', 'source']);
        });
    }
};