<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lms_course_quiz_pakets', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('course_id');
            $table->unsignedBigInteger('quiz_paket_id');
            $table->timestamps();

            $table->foreign('course_id')->references('id')->on('lms_courses')->cascadeOnDelete();
            $table->foreign('quiz_paket_id')->references('id')->on('quiz_pakets')->cascadeOnDelete();

            $table->unique(['course_id', 'quiz_paket_id']);
        });

        // Backfill relasi lama (quiz_pakets.course_id) agar paket yang sudah
        // terhubung ke kursus tetap terbaca lewat pivot yang baru.
        DB::table('quiz_pakets')
            ->whereNotNull('course_id')
            ->orderBy('id')
            ->chunk(500, function ($pakets) {
                $now = now();
                $rows = [];
                foreach ($pakets as $paket) {
                    $rows[] = [
                        'course_id' => $paket->course_id,
                        'quiz_paket_id' => $paket->id,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
                if ($rows) {
                    DB::table('lms_course_quiz_pakets')->insertOrIgnore($rows);
                }
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('lms_course_quiz_pakets');
    }
};
