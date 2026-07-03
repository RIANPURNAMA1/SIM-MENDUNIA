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
        Schema::create('absensis', function (Blueprint $table) {
            $table->id();
            // Relasi user
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            // TAMBAHKAN INI: Relasi ke Shift
            $table->foreignId('shift_id')
                ->nullable()
                ->constrained('shifts')
                ->nullOnDelete();

            $table->foreignId('cabang_id')
                ->nullable()
                ->constrained('cabangs')
                ->nullOnDelete();

            $table->foreignId('izin_id')
                ->nullable()
                ->constrained('izins')
                ->nullOnDelete();



            // Tanggal absensi (1 user = 1 record per hari)
            $table->date('tanggal');

            // Waktu absensi
            $table->time('jam_masuk')->nullable();
            $table->time('jam_keluar')->nullable();

            // Lokasi user saat absen masuk
            $table->decimal('lat_masuk', 10, 8)->nullable();
            $table->decimal('long_masuk', 11, 8)->nullable();

            // Lokasi user saat absen pulang
            $table->decimal('lat_pulang', 10, 8)->nullable();
            $table->decimal('long_pulang', 11, 8)->nullable();

            // TAMBAHKAN 'LIBUR' di sini
            $table->enum('status', [
                'HADIR',
                'TERLAMBAT',
                'IZIN',
                'ALPA',
                'PULANG LEBIH AWAL',
                'TIDAK ABSEN PULANG',
                'LIBUR'
            ])->default('HADIR');

            // Foto dari kamera
            $table->string('foto_masuk')->nullable();
            $table->string('foto_pulang')->nullable();

            // Catatan tambahan
            $table->text('keterangan')->nullable();

            // Audit
            $table->timestamps();

            // 🔐 Constraint: 1 user hanya boleh 1 absensi per hari
            $table->unique(['user_id', 'tanggal']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('absensis');
    }
};
