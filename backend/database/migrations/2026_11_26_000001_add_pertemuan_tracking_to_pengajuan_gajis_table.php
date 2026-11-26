<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengajuan_gajis', function (Blueprint $table) {
            $table->unsignedBigInteger('kelas_sensei_id')->nullable()->after('user_id');
            $table->json('absensi_sensei_ids')->nullable()->after('kelas_sensei_id');
            $table->unsignedInteger('jumlah_pertemuan')->nullable()->after('absensi_sensei_ids');
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('pengajuan_gajis', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'status']);
            $table->dropColumn(['kelas_sensei_id', 'absensi_sensei_ids', 'jumlah_pertemuan']);
        });
    }
};
