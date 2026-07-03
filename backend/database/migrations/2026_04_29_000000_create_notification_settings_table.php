<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->boolean('is_enabled')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Insert default settings
        DB::table('notification_settings')->insert([
            [
                'key' => 'wa_hadir',
                'is_enabled' => true,
                'description' => 'Notifikasi WA untuk status HADIR',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'wa_terlambat',
                'is_enabled' => true,
                'description' => 'Notifikasi WA untuk status TERLAMBAT',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'wa_pulang_lebih_awal',
                'is_enabled' => true,
                'description' => 'Notifikasi WA untuk status PULANG LEBIH AWAL',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'wa_tidak_absen_pulang',
                'is_enabled' => true,
                'description' => 'Notifikasi WA untuk status TIDAK ABSEN PULANG',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'wa_alpa',
                'is_enabled' => true,
                'description' => 'Notifikasi WA untuk status ALPA',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'wa_reminder_belum_absen',
                'is_enabled' => true,
                'description' => 'Notifikasi reminder belum absen (30 menit sebelum jam masuk)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_settings');
    }
};
