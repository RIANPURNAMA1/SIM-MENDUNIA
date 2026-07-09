<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('biaya_kategoris', function (Blueprint $table) {
            $table->id();
            $table->string('nama', 100);
            $table->string('kode', 50)->unique();
            $table->integer('urutan')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('biaya_kategoris');
    }
};
