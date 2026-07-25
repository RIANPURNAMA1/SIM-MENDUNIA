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
        // Step 1: Tambah kolom token (nullable dulu)
        Schema::table('pendaftar', function (Blueprint $table) {
            if (!Schema::hasColumn('pendaftar', 'token')) {
                $table->string('token', 32)->nullable()->after('id');
            }
        });

        // Step 2: Backfill token untuk data existing
        $pendaftars = DB::table('pendaftar')
            ->whereNull('token')
            ->orWhere('token', '')
            ->get();
        foreach ($pendaftars as $p) {
            DB::table('pendaftar')
                ->where('id', $p->id)
                ->update(['token' => Str::random(32)]);
        }

        // Step 3: Tambah unique constraint jika belum ada
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
            if (Schema::hasIndex('pendaftar', 'pendaftar_token_unique')) {
                $table->dropIndex('pendaftar_token_unique');
            }
            if (Schema::hasColumn('pendaftar', 'token')) {
                $table->dropColumn('token');
            }
        });
    }
};
