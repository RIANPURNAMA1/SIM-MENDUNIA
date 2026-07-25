<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // Backfill token untuk data existing (sebelum add unique constraint)
        $pendaftars = DB::table('pendaftar')->whereNull('token')->orWhere('token', '')->get();
        foreach ($pendaftars as $p) {
            DB::table('pendaftar')
                ->where('id', $p->id)
                ->update(['token' => Str::random(32)]);
        }

        // Tambah unique constraint jika belum ada
        $indexes = DB::select("SHOW INDEX FROM pendaftar WHERE Key_name = 'pendaftar_token_unique'");
        if (empty($indexes)) {
            Schema::table('pendaftar', function (Blueprint $table) {
                $table->unique('token', 'pendaftar_token_unique');
            });
        }
    }

    public function down(): void
    {
        Schema::table('pendaftar', function (Blueprint $table) {
            $table->dropIndex('pendaftar_token_unique');
            $table->dropColumn('token');
        });
    }
};
