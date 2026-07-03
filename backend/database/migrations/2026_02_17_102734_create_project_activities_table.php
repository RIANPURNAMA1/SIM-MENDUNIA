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
        Schema::create('project_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // Pelaku aktivitas
            $table->foreignId('task_id')->nullable()->constrained('tasks')->onDelete('set null');
            $table->string('jenis_aktivitas'); // Contoh: 'PINDAH_KOLOM', 'BUAT_TUGAS', 'SELESAI'
            $table->text('keterangan'); // Contoh: "Andi memindahkan tugas 'Login API' ke 'Selesai'"
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_activities');
    }
};
