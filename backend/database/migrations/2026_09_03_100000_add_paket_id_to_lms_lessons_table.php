<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lms_lessons', function (Blueprint $table) {
            $table->foreignId('paket_id')->nullable()->after('course_id')->constrained('quiz_pakets')->nullOnDelete();
            $table->index('paket_id');
        });
    }

    public function down(): void
    {
        Schema::table('lms_lessons', function (Blueprint $table) {
            $table->dropConstrainedForeignId('paket_id');
        });
    }
};
