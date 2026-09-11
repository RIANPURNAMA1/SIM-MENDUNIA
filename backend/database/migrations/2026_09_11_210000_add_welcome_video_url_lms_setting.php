<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('lms_settings')->updateOrInsert(
            ['key' => 'welcome_video_url'],
            ['is_enabled' => true, 'value' => null, 'created_at' => now(), 'updated_at' => now()]
        );
    }

    public function down(): void
    {
        DB::table('lms_settings')->where('key', 'welcome_video_url')->delete();
    }
};