<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_list_id');
            $table->string('judul_tugas');
            $table->text('deskripsi_tugas')->nullable();
            $table->enum('prioritas', ['RENDAH', 'SEDANG', 'TINGGI', 'DARURAT'])->default('SEDANG');
            $table->date('tgl_mulai_tugas')->nullable(); // Untuk tampilan Timeline/Gantt
            $table->date('tgl_selesai_tugas')->nullable(); // Untuk tampilan Timeline/Gantt
            $table->integer('urutan_kartu')->default(0); // Posisi kartu di dalam satu kolom
            $table->boolean('is_selesai')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
