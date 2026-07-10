<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $cabangs = DB::table('cabangs')->whereNull('barcode')->get();
        foreach ($cabangs as $cabang) {
            DB::table('cabangs')
                ->where('id', $cabang->id)
                ->update(['barcode' => 'CAB-' . strtoupper(substr(md5(uniqid()), 0, 10))]);
        }
    }

    public function down(): void
    {
        DB::table('cabangs')->where('barcode', 'like', 'CAB-%')->update(['barcode' => null]);
    }
};
