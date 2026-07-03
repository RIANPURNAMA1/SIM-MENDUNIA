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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('nama_proyek');
            $table->text('deskripsi')->nullable();
            $table->date('tanggal_mulai')->nullable();
            $table->date('tanggal_deadline')->nullable(); // Penting untuk fitur Timeline
            $table->enum('status', ['PERENCANAAN', 'BERJALAN', 'SELESAI', 'DITUNDA'])->default('PERENCANAAN');
            $table->foreignId('manager_id')->constrained('users')->onDelete('cascade'); // Penanggung jawab
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
