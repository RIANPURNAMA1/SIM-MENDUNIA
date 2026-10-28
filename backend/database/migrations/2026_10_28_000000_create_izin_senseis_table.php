<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('izin_senseis', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('kelas_sensei_id')
                ->nullable()
                ->constrained('kelas_sensei')
                ->nullOnDelete();

            $table->enum('jenis_izin', [
                'IZIN_PRIBADI',
                'SAKIT',
                'URUSAN_KELUARGA',
                'DINAS_LEMBAGA',
                'IZIN_MENDADAK',
            ]);

            $table->date('tgl_mulai');
            $table->date('tgl_selesai');
            $table->text('alasan');

            $table->enum('jadwal_terdampak', ['SEMUA', 'TERTENTU'])->default('SEMUA');
            $table->json('jadwal_tertentu')->nullable();

            $table->enum('mekanisme_pengganti', ['USUL', 'ADMIN'])->default('ADMIN');

            $table->foreignId('pengganti_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->text('catatan_pengganti')->nullable();

            $table->enum('status', ['PENDING', 'APPROVED', 'REJECTED'])->default('PENDING');
            $table->text('catatan_admin')->nullable();

            $table->foreignId('approved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('approved_at')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['tgl_mulai', 'tgl_selesai']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('izin_senseis');
    }
};
