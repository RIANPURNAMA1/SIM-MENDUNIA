<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lms_lesson_quiz_pakets', function (Blueprint $table) {
            $table->boolean('is_pembahasan')->default(false)->after('penilaian_ulangan');
        });
    }

    public function down(): void
    {
        Schema::table('lms_lesson_quiz_pakets', function (Blueprint $table) {
            $table->dropColumn('is_pembahasan');
        });
    }
};