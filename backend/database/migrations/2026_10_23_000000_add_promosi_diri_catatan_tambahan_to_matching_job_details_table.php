<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('matching_job_details', function (Blueprint $table) {
            $table->text('promosi_diri')->nullable()->after('keahlian');
            $table->text('catatan_tambahan')->nullable()->after('promosi_diri');
        });
    }

    public function down(): void
    {
        Schema::table('matching_job_details', function (Blueprint $table) {
            $table->dropColumn(['promosi_diri', 'catatan_tambahan']);
        });
    }
};
