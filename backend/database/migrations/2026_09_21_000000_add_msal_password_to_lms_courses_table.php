<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('lms_courses', function (Blueprint $table) {
            $table->string('password_course', 255)->nullable()->after('alert_active');
        });
    }

    public function down()
    {
        Schema::table('lms_courses', function (Blueprint $table) {
            $table->dropColumn('password_course');
        });
    }
};