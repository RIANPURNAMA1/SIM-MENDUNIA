<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        DB::table('quiz_categories')->insert(array_map(
            fn ($name) => ['name' => $name, 'created_at' => now(), 'updated_at' => now()],
            ['Umum', 'Materi', 'Hiragana', 'Katakana', 'Kanji', 'Latihan', 'Ujian']
        ));
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_categories');
    }
};