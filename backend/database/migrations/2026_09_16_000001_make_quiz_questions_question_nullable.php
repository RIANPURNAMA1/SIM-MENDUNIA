<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->text('question')->nullable()->change();
        });
    }

    public function down(): void
    {
        DB::table('quiz_questions')->whereNull('question')->update(['question' => '']);

        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->text('question')->nullable(false)->change();
        });
    }
};