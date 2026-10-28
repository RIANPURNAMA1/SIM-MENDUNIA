<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('notification_settings')->updateOrInsert(
            ['key' => 'wa_pengajuan_gaji'],
            [
                'is_enabled' => true,
                'description' => 'Pengajuan gaji sensei ke admin follow up (WA)',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    public function down(): void
    {
        DB::table('notification_settings')->where('key', 'wa_pengajuan_gaji')->delete();
    }
};
