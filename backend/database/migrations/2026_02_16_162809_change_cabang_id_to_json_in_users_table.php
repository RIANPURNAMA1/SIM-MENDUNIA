<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // 1. Hapus Foreign Key lama jika ada (agar tidak error saat drop column)
            // Nama index foreign biasanya: nama_tabel_nama_kolom_foreign
            if (Schema::hasColumn('users', 'cabang_id')) {
                // Gunakan try-catch atau dropForeign jika Anda menggunakan constrained foreign key
                $table->dropColumn('cabang_id');
            }

            // 2. Tambah kolom baru tipe JSON
            $table->json('cabang_ids')->nullable()->after('divisi_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Balikkan keadaan: Hapus JSON dan kembalikan ke BigInteger
            if (Schema::hasColumn('users', 'cabang_ids')) {
                $table->dropColumn('cabang_ids');
            }
            
            $table->unsignedBigInteger('cabang_id')->nullable()->after('divisi_id');
        });
    }
};