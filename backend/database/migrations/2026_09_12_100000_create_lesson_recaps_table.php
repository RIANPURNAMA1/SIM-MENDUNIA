<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('lesson_recaps', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('lesson_id');
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->string('file_type')->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->enum('kind', ['image', 'pdf'])->default('image');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->foreign('lesson_id')
                ->references('id')
                ->on('lms_lessons')
                ->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('lesson_recaps');
    }
};