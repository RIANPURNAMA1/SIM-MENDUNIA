<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('biaya_kategoris', function (Blueprint $table) {
            $table->string('channel', 10)->default('wa')->after('reminder_setting');
            $table->text('template_pesan')->nullable()->after('channel');
            $table->text('template_email')->nullable()->after('template_pesan');
            $table->text('subject_email')->nullable()->after('template_email');
        });
    }

    public function down(): void
    {
        Schema::table('biaya_kategoris', function (Blueprint $table) {
            $table->dropColumn(['channel', 'template_pesan', 'template_email', 'subject_email']);
        });
    }
};
