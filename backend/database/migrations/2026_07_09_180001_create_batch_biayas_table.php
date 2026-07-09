<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('batch_biayas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_id')->constrained('batches')->cascadeOnDelete();
            $table->foreignId('kategori_id')->constrained('biaya_kategoris')->cascadeOnDelete();
            $table->decimal('biaya', 15, 2)->default(0);
            $table->timestamps();

            $table->unique(['batch_id', 'kategori_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('batch_biayas');
    }
};
