<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lms_assignments', function (Blueprint $table) {
            $table->unsignedBigInteger('paket_id')->nullable()->after('status');
            $table->foreign('paket_id')->references('id')->on('quiz_pakets')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('lms_assignments', function (Blueprint $table) {
            $table->dropForeign(['paket_id']);
            $table->dropColumn('paket_id');
        });
    }
};