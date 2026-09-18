<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lms_assignment_pakets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained('lms_assignments')->cascadeOnDelete();
            $table->foreignId('quiz_paket_id')->constrained('quiz_pakets')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['assignment_id', 'quiz_paket_id']);
        });

        // Backfill dari kolom paket_id (jika ada data lama)
        DB::table('lms_assignments')
            ->whereNotNull('paket_id')
            ->select('id', 'paket_id')
            ->get()
            ->each(function ($row) {
                try {
                    DB::table('lms_assignment_pakets')->insert([
                        'assignment_id' => $row->id,
                        'quiz_paket_id' => $row->paket_id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } catch (\Throwable $e) {
                    // abaikan duplikat
                }
            });

        Schema::table('lms_assignments', function (Blueprint $table) {
            $table->dropForeign(['paket_id']);
            $table->dropColumn('paket_id');
        });
    }

    public function down(): void
    {
        Schema::table('lms_assignments', function (Blueprint $table) {
            $table->unsignedBigInteger('paket_id')->nullable()->after('status');
        });

        DB::table('lms_assignment_pakets')->get()->each(function ($row) {
            DB::table('lms_assignments')->where('id', $row->assignment_id)->update(['paket_id' => $row->quiz_paket_id]);
        });

        Schema::dropIfExists('lms_assignment_pakets');
    }
};