<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('komisi_tiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('kategori_id')->nullable()->constrained('biaya_kategoris')->nullOnDelete();
            $table->unsignedInteger('min_orang')->default(1);
            $table->unsignedInteger('max_orang')->nullable();
            $table->decimal('komisi', 15, 2)->default(0);
            $table->unsignedInteger('urutan')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('komisi_tiers');
    }
};
