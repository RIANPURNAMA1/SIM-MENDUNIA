<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lms_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->boolean('is_enabled')->default(true);
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // Seed default lms settings
        DB::table('lms_settings')->insert([
            ['key' => 'welcome_video', 'is_enabled' => true, 'value' => null, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('lms_settings');
    }
};