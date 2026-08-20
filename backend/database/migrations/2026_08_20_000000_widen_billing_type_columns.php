<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('biaya_kategoris', function (Blueprint $table) {
            $table->string('trigger_type', 40)->default('registration')->change();
            $table->string('due_type', 40)->default('days_after_invoice')->change();
        });
    }

    public function down(): void
    {
        Schema::table('biaya_kategoris', function (Blueprint $table) {
            $table->string('trigger_type', 20)->default('registration')->change();
            $table->string('due_type', 20)->default('days_after_invoice')->change();
        });
    }
};