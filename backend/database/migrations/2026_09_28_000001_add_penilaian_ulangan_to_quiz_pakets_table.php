<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quiz_pakets', function (Blueprint $table) {
            $table->boolean('penilaian_ulangan')->default(false)->after('block_exit');
        });
    }

    public function down(): void
    {
        Schema::table('quiz_pakets', function (Blueprint $table) {
            $table->dropColumn('penilaian_ulangan');
        });
    }
};
