<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lms_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained('lms_courses')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->date('due_date')->nullable();
            $table->unsignedInteger('max_score')->default(100);
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->timestamps();
        });

        Schema::create('lms_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained('lms_assignments')->cascadeOnDelete();
            $table->foreignId('siswa_id')->constrained('siswas')->cascadeOnDelete();
            $table->text('notes')->nullable();
            $table->string('file_path');
            $table->string('file_name');
            $table->integer('file_size')->nullable();
            $table->decimal('score', 5, 1)->nullable();
            $table->text('feedback')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('graded_at')->nullable();
            $table->timestamps();

            $table->unique(['assignment_id', 'siswa_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lms_submissions');
        Schema::dropIfExists('lms_assignments');
    }
};
