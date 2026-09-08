<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lms_progress', function (Blueprint $table) {
            $table->unsignedInteger('video_duration_seconds')->nullable()->after('completed_at');
            $table->unsignedInteger('video_watched_seconds')->nullable()->after('video_duration_seconds');
            $table->unsignedTinyInteger('video_percent')->nullable()->after('video_watched_seconds');
            $table->unsignedInteger('read_seconds')->default(0)->after('video_percent');
        });
    }

    public function down(): void
    {
        Schema::table('lms_progress', function (Blueprint $table) {
            $table->dropColumn(['video_duration_seconds', 'video_watched_seconds', 'video_percent', 'read_seconds']);
        });
    }
};