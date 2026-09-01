<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('matching_job_forms', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->index();
            $table->unsignedBigInteger('pendaftar_id')->nullable()->index();
            $table->unsignedBigInteger('penempatan_kandidat_id')->nullable();
            $table->string('status_formulir')->default('draft');
            $table->string('nama')->nullable();
            $table->string('email')->nullable();
            $table->json('data')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('matching_job_forms');
    }
};
