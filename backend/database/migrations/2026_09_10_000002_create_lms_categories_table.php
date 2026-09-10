<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('lms_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();
        });

        Schema::table('lms_courses', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable()->after('image')->constrained('lms_categories')->nullOnDelete();
        });

        // Migrasi data kategori lama (string) ke tabel terpisah
        $existing = DB::table('lms_courses')->whereNotNull('category')->where('category', '!=', '')->distinct()->pluck('category');
        $map = [];
        foreach ($existing as $name) {
            $id = DB::table('lms_categories')->insertGetId([
                'name' => $name,
                'sort' => $map->count(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $map[$name] = $id;
        }
        foreach ($map as $name => $id) {
            DB::table('lms_courses')->where('category', $name)->update(['category_id' => $id]);
        }

        Schema::table('lms_courses', function (Blueprint $table) {
            $table->dropIndex(['category']);
            $table->dropColumn('category');
        });
    }

    public function down()
    {
        Schema::table('lms_courses', function (Blueprint $table) {
            $table->string('category', 100)->nullable()->after('image');
            DB::table('lms_courses')->leftJoin('lms_categories', 'lms_courses.category_id', '=', 'lms_categories.id')
                ->update(['lms_courses.category' => DB::raw('lms_categories.name')]);
            $table->dropForeign(['category_id']);
            $table->dropColumn('category_id');
        });
        Schema::dropIfExists('lms_categories');
    }
};