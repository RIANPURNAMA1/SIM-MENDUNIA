<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('biaya_kategoris', function (Blueprint $table) {
            $table->string('trigger_type', 20)->default('registration')->after('parent_id');
            $table->string('trigger_value', 100)->nullable()->after('trigger_type');
            $table->string('due_type', 20)->default('days_after_invoice')->after('trigger_value');
            $table->string('due_value', 100)->nullable()->after('due_type');
            $table->json('reminder_setting')->nullable()->after('due_value');
        });
    }

    public function down(): void
    {
        Schema::table('biaya_kategoris', function (Blueprint $table) {
            $table->dropColumn(['trigger_type', 'trigger_value', 'due_type', 'due_value', 'reminder_setting']);
        });
    }
};
