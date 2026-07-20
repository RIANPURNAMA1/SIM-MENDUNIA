<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->boolean('is_enabled')->default(false);
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // Seed default settings
        DB::table('payment_settings')->insert([
            ['key' => 'manual_payment_enabled', 'is_enabled' => false, 'value' => null, 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'unique_code_max', 'is_enabled' => false, 'value' => '99', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'unique_code_operation', 'is_enabled' => false, 'value' => 'add', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_settings');
    }
};
