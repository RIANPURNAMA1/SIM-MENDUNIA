<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('batch_kategori_deadlines', function (Blueprint $table) {
            $table->string('channel')->default('wa')->after('is_enabled'); // 'wa', 'email', 'both'
            $table->text('template_email')->nullable()->after('template_pesan');
            $table->text('subject_email')->nullable()->after('template_email');
        });
    }

    public function down(): void
    {
        Schema::table('batch_kategori_deadlines', function (Blueprint $table) {
            $table->dropColumn(['channel', 'template_email', 'subject_email']);
        });
    }
};
