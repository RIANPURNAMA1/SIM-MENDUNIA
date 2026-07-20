<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('siswa_id')->constrained('siswas')->cascadeOnDelete();
            $table->foreignId('batch_id')->constrained('batches')->cascadeOnDelete();
            $table->string('level');
            $table->unsignedTinyInteger('rating');
            $table->text('komentar')->nullable();
            $table->timestamps();

            $table->unique(['siswa_id', 'batch_id', 'level']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_evaluations');
    }
};
