<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('batches', function (Blueprint $table) {
            $table->string('warna', 20)->nullable()->after('is_penuh_manual');
        });
    }

    public function down(): void
    {
        Schema::table('batches', function (Blueprint $table) {
            $table->dropColumn('warna');
        });
    }
};
