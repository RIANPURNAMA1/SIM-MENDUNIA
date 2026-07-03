<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Pindahkan data kelas unik ke tabel kelas
        $kelasList = DB::table('siswas')->select('kelas')->distinct()->whereNotNull('kelas')->pluck('kelas');
        foreach ($kelasList as $nama) {
            $existing = DB::table('kelas')->where('nama_kelas', $nama)->first();
            if (!$existing) {
                DB::table('kelas')->insert(['nama_kelas' => $nama, 'status' => 'AKTIF', 'created_at' => now(), 'updated_at' => now()]);
            }
        }

        Schema::table('siswas', function (Blueprint $table) {
            $table->foreignId('kelas_id')->nullable()->constrained('kelas')->nullOnDelete()->after('shift_id');
        });

        // Update kolom kelas_id berdasarkan nilai kelas string
        $siswas = DB::table('siswas')->whereNotNull('kelas')->get();
        foreach ($siswas as $s) {
            $kelas = DB::table('kelas')->where('nama_kelas', $s->kelas)->first();
            if ($kelas) {
                DB::table('siswas')->where('id', $s->id)->update(['kelas_id' => $kelas->id]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('siswas', function (Blueprint $table) {
            $table->dropForeign(['kelas_id']);
            $table->dropColumn('kelas_id');
        });
    }
};
