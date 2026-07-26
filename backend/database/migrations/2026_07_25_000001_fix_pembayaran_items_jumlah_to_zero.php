<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Reset jumlah on pembayaran_items that have no matching verified Pembayaran
        // This fixes the bug where registration set jumlah = nominal (tagihan) instead of 0
        DB::statement('
            UPDATE pembayaran_items pi
            SET pi.jumlah = 0
            WHERE pi.jumlah > 0
            AND NOT EXISTS (
                SELECT 1 FROM pembayaran p
                WHERE p.pendaftar_id = pi.pendaftar_id
                AND p.kategori_id = pi.kategori_id
                AND p.status = ?
            )
        ', ['verified']);
    }

    public function down(): void
    {
        // No rollback needed — the correct jumlah will be recalculated
        // when payments are verified via verifyPayment() or approve()
    }
};
