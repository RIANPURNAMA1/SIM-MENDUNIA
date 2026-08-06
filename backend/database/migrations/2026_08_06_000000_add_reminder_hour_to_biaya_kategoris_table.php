<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('biaya_kategoris', function (Blueprint $table) {
            $table->string('reminder_hour', 5)->default('09:00')->after('reminder_setting');
        });
    }

    public function down(): void
    {
        Schema::table('biaya_kategoris', function (Blueprint $table) {
            $table->dropColumn('reminder_hour');
        });
    }
};
