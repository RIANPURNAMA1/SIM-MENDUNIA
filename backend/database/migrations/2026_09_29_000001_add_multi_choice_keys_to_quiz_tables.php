<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->json('correct_indexes')->nullable()->after('correct_index');
        });

        Schema::table('quiz_answers', function (Blueprint $table) {
            $table->json('selected_indexes')->nullable()->after('selected_index');
        });
    }

    public function down(): void
    {
        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->dropColumn('correct_indexes');
        });

        Schema::table('quiz_answers', function (Blueprint $table) {
            $table->dropColumn('selected_indexes');
        });
    }
};
