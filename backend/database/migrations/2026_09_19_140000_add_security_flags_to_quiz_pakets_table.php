<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quiz_pakets', function (Blueprint $table) {
            $table->boolean('camera_enabled')->default(true)->after('template');
            $table->boolean('block_exit')->default(true)->after('camera_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('quiz_pakets', function (Blueprint $table) {
            $table->dropColumn(['camera_enabled', 'block_exit']);
        });
    }
};