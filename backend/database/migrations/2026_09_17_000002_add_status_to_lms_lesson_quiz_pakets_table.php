<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lms_lesson_quiz_pakets', function (Blueprint $table) {
            $table->string('status', 20)->default('aktif')->after('quiz_paket_id');
        });
    }

    public function down(): void
    {
        Schema::table('lms_lesson_quiz_pakets', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};