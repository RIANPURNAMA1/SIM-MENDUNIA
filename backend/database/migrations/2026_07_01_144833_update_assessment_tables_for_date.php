<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // drop old tables (no real data)
        Schema::dropIfExists('student_assessments');
        Schema::dropIfExists('assessment_components');
        Schema::dropIfExists('assessment_categories');

        // recreate
        Schema::create('assessment_categories', function (Blueprint $table) {
            $table->id();
            $table->string('level');
            $table->string('nama_kategori');
            $table->integer('urutan')->default(0);
            $table->timestamps();
        });

        Schema::create('assessment_components', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('assessment_categories')->cascadeOnDelete();
            $table->string('sub_komponen');
            $table->integer('urutan')->default(0);
            $table->timestamps();
        });

        Schema::create('student_assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('component_id')->constrained('assessment_components')->cascadeOnDelete();
            $table->foreignId('siswa_id')->constrained('siswas')->cascadeOnDelete();
            $table->foreignId('batch_id')->constrained('batches')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->date('tanggal');
            $table->decimal('nilai', 5, 2)->nullable();
            $table->timestamps();

            $table->unique(['component_id', 'siswa_id', 'batch_id', 'tanggal'], 'assessment_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_assessments');
        Schema::dropIfExists('assessment_components');
        Schema::dropIfExists('assessment_categories');
    }
};
