<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('absensis', function (Blueprint $table) {
            $table->json('notif_terkirim')->nullable()->after('keterangan');
        });

        Schema::table('wa_notifications', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('pendaftar_id')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('absensis', function (Blueprint $table) {
            $table->dropColumn('notif_terkirim');
        });

        Schema::table('wa_notifications', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
        });
    }
};
