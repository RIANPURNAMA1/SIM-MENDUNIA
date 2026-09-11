<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('kelas_pertemuan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kelas_sensei_id')->constrained('kelas_sensei')->cascadeOnDelete();
            $table->unsignedInteger('pertemuan_ke');
            $table->date('tanggal');
            $table->longText('materi')->nullable();
            $table->string('foto_bukti')->nullable();
            $table->foreignId('latihan_paket_id')->nullable()->constrained('quiz_pakets')->nullOnDelete();
            $table->foreignId('ulangan_harian_paket_id')->nullable()->constrained('quiz_pakets')->nullOnDelete();
            $table->foreignId('ulangan_mingguan_paket_id')->nullable()->constrained('quiz_pakets')->nullOnDelete();
            $table->timestamps();

            $table->unique(['kelas_sensei_id', 'tanggal']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('kelas_pertemuan');
    }
};