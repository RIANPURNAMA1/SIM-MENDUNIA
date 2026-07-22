<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_evaluations', function (Blueprint $table) {
            $table->json('scores')->nullable()->after('rating');
            $table->json('text_responses')->nullable()->after('scores');
        });
    }

    public function down(): void
    {
        Schema::table('student_evaluations', function (Blueprint $table) {
            $table->dropColumn(['scores', 'text_responses']);
        });
    }
};
