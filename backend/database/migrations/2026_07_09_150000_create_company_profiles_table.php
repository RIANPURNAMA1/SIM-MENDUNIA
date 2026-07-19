<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('company_name')->default('MENDUNIA.ID');
            $table->string('pt_name')->default('PT INDONESIA SUKSES MENDUNIA');
            $table->text('address')->nullable();
            $table->string('email')->nullable()->default('info@simmendunia.com');
            $table->string('phone')->nullable()->default('(021) 1234-5678');
            $table->string('logo')->nullable();
            $table->timestamps();
        });

        DB::table('company_profiles')->insert([
            'company_name' => 'MENDUNIA.ID',
            'pt_name' => 'PT INDONESIA SUKSES MENDUNIA',
            'address' => 'Jl. Contoh No. 123, Jakarta',
            'email' => 'info@simmendunia.com',
            'phone' => '(021) 1234-5678',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('company_profiles');
    }
};
