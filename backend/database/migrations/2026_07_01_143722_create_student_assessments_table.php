<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('component_id')->constrained('assessment_components')->cascadeOnDelete();
            $table->foreignId('siswa_id')->constrained('siswas')->cascadeOnDelete();
            $table->foreignId('batch_id')->constrained('batches')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('nilai', 5, 2)->nullable();
            $table->timestamps();

            $table->unique(['component_id', 'siswa_id', 'batch_id'], 'assessment_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_assessments');
    }
};
