<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('lms_courses', function (Blueprint $table) {
            $table->text('alert')->nullable()->after('status');
            $table->boolean('alert_active')->default(true)->after('alert');
        });
    }

    public function down()
    {
        Schema::table('lms_courses', function (Blueprint $table) {
            $table->dropColumn(['alert', 'alert_active']);
        });
    }
};