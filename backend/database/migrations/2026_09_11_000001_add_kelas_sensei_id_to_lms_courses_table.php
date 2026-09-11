<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lms_courses', function (Blueprint $table) {
            $table->foreignId('kelas_sensei_id')->nullable()->after('category_id')
                ->constrained('kelas_sensei')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('lms_courses', function (Blueprint $table) {
            $table->dropForeign(['kelas_sensei_id']);
            $table->dropColumn('kelas_sensei_id');
        });
    }
};