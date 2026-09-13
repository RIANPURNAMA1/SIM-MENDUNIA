<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('quiz_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_paket_id')->constrained('quiz_pakets')->cascadeOnDelete();
            $table->string('name', 100);
            $table->integer('sort')->default(0);
            $table->timestamps();

            $table->unique(['quiz_paket_id', 'name']);
        });

        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->dropColumn('section');
        });

        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->foreignId('section_id')->nullable()->after('question')->constrained('quiz_sections')->nullOnDelete();
        });
    }

    public function down()
    {
        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->dropForeign(['section_id']);
            $table->dropColumn('section_id');
        });

        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->string('section', 100)->nullable()->after('question');
        });

        Schema::dropIfExists('quiz_sections');
    }
};