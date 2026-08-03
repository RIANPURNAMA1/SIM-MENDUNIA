<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('notification_settings')->updateOrInsert(
            ['key' => 'wa_izin'],
            [
                'is_enabled' => true,
                'description' => 'Notifikasi WA pengajuan izin ke manager',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    public function down(): void
    {
        DB::table('notification_settings')->where('key', 'wa_izin')->delete();
    }
};
