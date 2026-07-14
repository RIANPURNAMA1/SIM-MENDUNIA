<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengeluaran', function (Blueprint $table) {
            $table->foreignId('cabang_id')->nullable()->after('user_id')->constrained('cabangs')->nullOnDelete();
            $table->index('cabang_id');
        });
    }

    public function down(): void
    {
        Schema::table('pengeluaran', function (Blueprint $table) {
            $table->dropForeign(['cabang_id']);
            $table->dropIndex(['cabang_id']);
            $table->dropColumn('cabang_id');
        });
    }
};
