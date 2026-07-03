<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('absensi_sensei', function (Blueprint $table) {
            $table->decimal('lat_masuk', 10, 8)->nullable()->after('catatan');
            $table->decimal('long_masuk', 11, 8)->nullable()->after('lat_masuk');
            $table->decimal('lat_pulang', 10, 8)->nullable()->after('long_masuk');
            $table->decimal('long_pulang', 11, 8)->nullable()->after('lat_pulang');
        });
    }

    public function down(): void
    {
        Schema::table('absensi_sensei', function (Blueprint $table) {
            $table->dropColumn(['lat_masuk', 'long_masuk', 'lat_pulang', 'long_pulang']);
        });
    }
};
