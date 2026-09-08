<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->string('image_path')->nullable()->after('question');
            $table->string('audio_path')->nullable()->after('image_path');
            $table->unsignedInteger('audio_max_plays')->nullable()->after('audio_path');
        });
    }

    public function down(): void
    {
        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->dropColumn(['image_path', 'audio_path', 'audio_max_plays']);
        });
    }
};