<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengajuan_gajis', function (Blueprint $table) {
            $table->unsignedInteger('pertemuan_dari')->nullable()->after('jumlah_pertemuan');
            $table->unsignedInteger('pertemuan_sampai')->nullable()->after('pertemuan_dari');
        });
    }

    public function down(): void
    {
        Schema::table('pengajuan_gajis', function (Blueprint $table) {
            $table->dropColumn(['pertemuan_dari', 'pertemuan_sampai']);
        });
    }
};
