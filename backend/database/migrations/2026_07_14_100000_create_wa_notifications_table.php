<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wa_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pendaftar_id')->nullable()->constrained('pendaftar')->nullOnDelete();
            $table->string('type');
            $table->string('to_phone');
            $table->text('message');
            $table->boolean('success')->default(false);
            $table->text('error')->nullable();
            $table->timestamps();

            $table->index(['type', 'created_at']);
            $table->index(['pendaftar_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wa_notifications');
    }
};
