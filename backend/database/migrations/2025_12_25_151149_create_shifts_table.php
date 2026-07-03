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
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->string('nama_shift');
            $table->string('kode_shift')->unique()->nullable();
            $table->time('jam_masuk');
            $table->time('jam_pulang');

            $table->integer('total_jam')->nullable();
            $table->integer('toleransi')->default(15);
            $table->enum('status', ['AKTIF', 'NONAKTIF'])->default('AKTIF');
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shifts');
    }
};
