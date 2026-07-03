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

        Schema::create('izins', function (Blueprint $table) {
            $table->id();

            // Karyawan pengaju izin
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Jenis izin
            $table->enum('jenis_izin', ['SAKIT', 'CUTI', 'IZIN']);

            // Periode izin
            $table->date('tgl_mulai');
            $table->date('tgl_selesai');

            // Keterangan
            $table->text('alasan')->nullable();
            $table->string('lampiran')->nullable();

            // Status approval
            $table->enum('status', ['PENDING', 'APPROVED', 'REJECTED'])
                ->default('PENDING');

            // Approver (HR / Manager)
            $table->foreignId('approved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
                

            // Waktu approve
            $table->timestamp('approved_at')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('izins');
    }
};
