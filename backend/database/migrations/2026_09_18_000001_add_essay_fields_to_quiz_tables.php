<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->string('keyword')->nullable()->after('correct_index');
        });

        Schema::table('quiz_answers', function (Blueprint $table) {
            $table->text('answer_text')->nullable()->after('selected_index');
            $table->unsignedInteger('earned_points')->nullable()->after('answer_text');
        });
    }

    public function down(): void
    {
        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->dropColumn('keyword');
        });

        Schema::table('quiz_answers', function (Blueprint $table) {
            $table->dropColumn(['answer_text', 'earned_points']);
        });
    }
};