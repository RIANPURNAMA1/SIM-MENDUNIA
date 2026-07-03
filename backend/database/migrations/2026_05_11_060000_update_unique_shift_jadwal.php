<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shift_jadwal', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropUnique('unique_user_tanggal');
            $table->index('user_id');
            $table->unique(['user_id', 'tanggal', 'shift_id'], 'unique_user_tanggal_shift');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('shift_jadwal', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropUnique('unique_user_tanggal_shift');
            $table->dropIndex(['user_id']);
            $table->unique(['user_id', 'tanggal'], 'unique_user_tanggal');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};
