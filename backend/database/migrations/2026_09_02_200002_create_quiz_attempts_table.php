<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_paket_id')->constrained()->cascadeOnDelete();
            $table->foreignId('siswa_id')->constrained('siswas')->cascadeOnDelete();
            $table->unsignedTinyInteger('attempt_number');
            $table->timestamp('started_at');
            $table->timestamp('submitted_at')->nullable();
            $table->unsignedInteger('time_limit_seconds')->default(0);
            $table->unsignedInteger('score')->nullable();
            $table->unsignedInteger('correct_count')->nullable();
            $table->unsignedInteger('total_count')->nullable();
            $table->unsignedTinyInteger('warnings')->default(0);
            $table->boolean('auto_submitted')->default(false);
            $table->string('webcam_photo')->nullable();
            $table->enum('status', ['in_progress', 'submitted'])->default('in_progress');
            $table->timestamps();

            $table->unique(['quiz_paket_id', 'siswa_id', 'attempt_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_attempts');
    }
};