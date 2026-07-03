<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shift_jadwal', function (Blueprint $table) {
            $table->dropForeign(['shift_id']);
            $table->foreignId('shift_id')->nullable()->change();
            $table->boolean('is_libur')->default(false)->after('keterangan');
            $table->foreign('shift_id')->references('id')->on('shifts')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('shift_jadwal', function (Blueprint $table) {
            $table->dropForeign(['shift_id']);
            $table->dropColumn('is_libur');
            $table->foreignId('shift_id')->nullable(false)->change();
            $table->foreign('shift_id')->references('id')->on('shifts')->onDelete('cascade');
        });
    }
};
