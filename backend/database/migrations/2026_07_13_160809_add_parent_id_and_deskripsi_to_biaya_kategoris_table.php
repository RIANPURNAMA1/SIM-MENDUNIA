<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('biaya_kategoris', function (Blueprint $table) {
            $table->foreignId('parent_id')->nullable()->after('urutan')->constrained('biaya_kategoris')->nullOnDelete();
            $table->text('deskripsi')->nullable()->after('nama');
        });
    }

    public function down(): void
    {
        Schema::table('biaya_kategoris', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn(['parent_id', 'deskripsi']);
        });
    }
};
