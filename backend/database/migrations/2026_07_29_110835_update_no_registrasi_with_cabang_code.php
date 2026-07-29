<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $pendaftars = DB::table('pendaftar')
            ->whereNotNull('no_registrasi')
            ->where('no_registrasi', 'like', 'REG/%')
            ->whereRaw("no_registrasi NOT LIKE 'REG/%/%/%'")
            ->get();

        foreach ($pendaftars as $p) {
            $batch = DB::table('batches')->where('id', $p->batch_id)->first();
            if (!$batch || !$batch->cabang_id) continue;

            $cabang = DB::table('cabangs')->where('id', $batch->cabang_id)->first();
            if (!$cabang || !$cabang->kode_cabang) continue;

            $oldReg = $p->no_registrasi;
            $parts = explode('/', $oldReg);
            if (count($parts) !== 3) continue;

            $newReg = 'REG/' . $cabang->kode_cabang . '/' . $parts[1] . '/' . $parts[2];

            DB::table('pendaftar')
                ->where('id', $p->id)
                ->update(['no_registrasi' => $newReg]);
        }
    }

    public function down(): void
    {
        // Tidak bisa revert karena sudah berubah
    }
};
