<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lms_lessons', function (Blueprint $table) {
            $table->string('file_path')->nullable()->after('video_url');
            $table->string('file_name')->nullable()->after('file_path');
            $table->string('file_type')->nullable()->after('file_name');
            $table->unsignedInteger('file_size')->nullable()->after('file_type');
        });
    }

    public function down(): void
    {
        Schema::table('lms_lessons', function (Blueprint $table) {
            $table->dropColumn(['file_path', 'file_name', 'file_type', 'file_size']);
        });
    }
};
