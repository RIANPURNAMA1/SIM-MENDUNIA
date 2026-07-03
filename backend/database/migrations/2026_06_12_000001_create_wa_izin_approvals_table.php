<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wa_izin_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('izin_id')->constrained('izins')->cascadeOnDelete();
            $table->string('manager_phone', 20);
            $table->enum('status', ['PENDING', 'APPROVED', 'REJECTED'])->default('PENDING');
            $table->timestamp('replied_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wa_izin_approvals');
    }
};
