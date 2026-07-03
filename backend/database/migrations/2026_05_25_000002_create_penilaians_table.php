<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('penilaians', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('nama_siswa');
            $table->string('kelas')->nullable();
            $table->string('mata_pelajaran')->nullable();
            $table->decimal('nilai', 5, 2)->nullable();
            $table->text('keterangan')->nullable();
            $table->date('tanggal_penilaian');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('penilaians');
    }
};
