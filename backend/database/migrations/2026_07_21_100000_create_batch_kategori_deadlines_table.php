<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('batch_kategori_deadlines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_id')->constrained('batches')->cascadeOnDelete();
            $table->foreignId('kategori_id')->constrained('biaya_kategoris')->cascadeOnDelete();
            $table->date('tanggal_awal')->nullable()->comment('Buka pembayaran');
            $table->date('tanggal_akhir')->nullable()->comment('Jatuh tempo');
            $table->json('reminder_days')->nullable()->comment('Array of day offsets before deadline');
            $table->boolean('is_enabled')->default(true);
            $table->text('template_pesan')->nullable();
            $table->timestamps();

            $table->unique(['batch_id', 'kategori_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('batch_kategori_deadlines');
    }
};
