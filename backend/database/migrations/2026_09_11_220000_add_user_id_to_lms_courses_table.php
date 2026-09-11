<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lms_courses', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->after('id');
            $table->index('user_id');
        });

        // Backfill: courses created by guru (from kelas sensei) → user_id = guru's user_id
        DB::table('lms_courses')
            ->join('kelas_sensei', 'lms_courses.kelas_sensei_id', '=', 'kelas_sensei.id')
            ->whereNull('lms_courses.user_id')
            ->update(['lms_courses.user_id' => DB::raw('kelas_sensei.user_id')]);
    }

    public function down(): void
    {
        Schema::table('lms_courses', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropColumn('user_id');
        });
    }
};