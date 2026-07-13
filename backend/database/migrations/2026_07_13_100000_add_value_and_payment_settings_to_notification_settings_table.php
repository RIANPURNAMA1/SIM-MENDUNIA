<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notification_settings', function (Blueprint $table) {
            $table->text('value')->nullable()->after('description');
        });

        // Insert payment notification settings
        DB::table('notification_settings')->insert([
            [
                'key' => 'wa_pembayaran',
                'is_enabled' => true,
                'description' => 'Notifikasi WA untuk pembayaran baru ke admin',
                'value' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'wa_pembayaran_admin_phones',
                'is_enabled' => true,
                'description' => 'Nomor HP admin yang menerima notifikasi pembayaran (koma untuk multiple)',
                'value' => '',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        DB::table('notification_settings')->whereIn('key', [
            'wa_pembayaran',
            'wa_pembayaran_admin_phones',
        ])->delete();

        Schema::table('notification_settings', function (Blueprint $table) {
            $table->dropColumn('value');
        });
    }
};
