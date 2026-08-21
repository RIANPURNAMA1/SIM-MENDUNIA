<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('kontrak_tanda_tangans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kontrak_id')->constrained('kontraks')->cascadeOnDelete();
            $table->foreignId('pendaftar_id')->constrained('pendaftars')->cascadeOnDelete();
            $table->string('file_ttd');
            $table->timestamps();
            $table->unique(['kontrak_id', 'pendaftar_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('kontrak_tanda_tangans');
    }
};
