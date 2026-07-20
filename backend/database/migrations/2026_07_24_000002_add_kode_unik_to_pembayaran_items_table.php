<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pembayaran_items', function (Blueprint $table) {
            $table->integer('kode_unik')->default(0)->after('jumlah');
            $table->decimal('total_transfer', 15, 2)->default(0)->after('kode_unik');
            $table->string('payment_code')->nullable()->after('total_transfer');
        });
    }

    public function down(): void
    {
        Schema::table('pembayaran_items', function (Blueprint $table) {
            $table->dropColumn(['kode_unik', 'total_transfer', 'payment_code']);
        });
    }
};
