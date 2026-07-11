<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_assessments', function (Blueprint $table) {
            $table->dropForeign(['batch_id']);
        });

        Schema::table('student_assessments', function (Blueprint $table) {
            $table->unsignedBigInteger('batch_id')->nullable()->change();
        });

        Schema::table('student_assessments', function (Blueprint $table) {
            $table->foreign('batch_id')->references('id')->on('batches')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('student_assessments', function (Blueprint $table) {
            $table->dropForeign(['batch_id']);
        });

        Schema::table('student_assessments', function (Blueprint $table) {
            $table->unsignedBigInteger('batch_id')->nullable(false)->change();
        });

        Schema::table('student_assessments', function (Blueprint $table) {
            $table->foreign('batch_id')->references('id')->on('batches')->cascadeOnDelete();
        });
    }
};
