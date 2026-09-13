<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lms_lesson_quiz_pakets', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('lesson_id');
            $table->unsignedBigInteger('quiz_paket_id');
            $table->timestamps();

            $table->foreign('lesson_id')->references('id')->on('lms_lessons')->cascadeOnDelete();
            $table->foreign('quiz_paket_id')->references('id')->on('quiz_pakets')->cascadeOnDelete();

            $table->unique(['lesson_id', 'quiz_paket_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lms_lesson_quiz_pakets');
    }
};