<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wa_reminder_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kategori_id')->constrained('biaya_kategoris')->cascadeOnDelete();
            $table->integer('jatuh_tempo_hari')->default(30)->comment('Hari dari pendaftaran sampai jatuh tempo');
            $table->json('reminder_days')->nullable()->comment('Array hari pengingat, misal [7,3,1]');
            $table->boolean('is_enabled')->default(true);
            $table->text('template_pesan')->nullable()->comment('Template pesan custom, kosong = default');
            $table->timestamps();

            $table->unique('kategori_id');
        });

        // Insert default settings for existing kategoris
        $kategoris = DB::table('biaya_kategoris')->get();
        foreach ($kategoris as $k) {
            DB::table('wa_reminder_settings')->insert([
                'kategori_id' => $k->id,
                'jatuh_tempo_hari' => 30,
                'reminder_days' => json_encode([7, 3, 1]),
                'is_enabled' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('wa_reminder_settings');
    }
};
