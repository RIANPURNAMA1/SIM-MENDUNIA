<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('lms_courses', function (Blueprint $table) {
            $table->string('category', 100)->nullable()->after('image')->index();
        });
    }

    public function down()
    {
        Schema::table('lms_courses', function (Blueprint $table) {
            $table->dropIndex(['category']);
            $table->dropColumn('category');
        });
    }
};