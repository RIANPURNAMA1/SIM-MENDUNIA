<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lms_assignments', function (Blueprint $table) {
            $table->foreignId('lesson_id')->nullable()->after('course_id')->constrained('lms_lessons')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('lms_assignments', function (Blueprint $table) {
            $table->dropForeign(['lesson_id']);
            $table->dropColumn('lesson_id');
        });
    }
};