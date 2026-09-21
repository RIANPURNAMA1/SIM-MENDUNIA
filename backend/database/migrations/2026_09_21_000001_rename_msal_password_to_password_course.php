<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (Schema::hasColumn('lms_courses', 'msal_password')) {
            Schema::table('lms_courses', function (Blueprint $table) {
                $table->renameColumn('msal_password', 'password_course');
            });
        }
    }

    public function down()
    {
        if (Schema::hasColumn('lms_courses', 'password_course')) {
            Schema::table('lms_courses', function (Blueprint $table) {
                $table->renameColumn('password_course', 'msal_password');
            });
        }
    }
};