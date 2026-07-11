<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_assessment_statuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('siswa_id')->constrained('siswas')->cascadeOnDelete();
            $table->foreignId('kelas_sensei_id')->nullable()->constrained('kelas_sensei')->cascadeOnDelete();
            $table->date('tanggal');
            $table->boolean('is_terisi')->default(false);
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->unique(['siswa_id', 'tanggal']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_assessment_statuses');
    }
};
