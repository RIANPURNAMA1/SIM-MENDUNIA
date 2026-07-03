<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up()
{
    Schema::create('izin_approvals', function (Blueprint $table) {
        $table->id();

        // Relasi ke izin
        $table->foreignId('izin_id')
              ->constrained('izins')
              ->cascadeOnDelete();

        // Siapa yang approve (HR / Manager)
        $table->foreignId('approved_by')
              ->constrained('users')
              ->cascadeOnDelete();

        // Status approval
        $table->enum('status', ['APPROVED', 'REJECTED']);

        // Catatan approver (opsional)
        $table->text('catatan')->nullable();

        // Waktu approval
        $table->timestamp('approved_at');

        $table->timestamps();
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('izin_approvals');
    }
};
