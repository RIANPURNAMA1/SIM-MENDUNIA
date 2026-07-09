<?php

namespace Database\Seeders;

use App\Models\BiayaKategori;
use Illuminate\Database\Seeder;

class BiayaKategoriSeeder extends Seeder
{
    public function run(): void
    {
        $kategoris = [
            ['nama' => 'Daftar', 'kode' => 'DAFTAR', 'urutan' => 1],
            ['nama' => 'MCU', 'kode' => 'MCU', 'urutan' => 2],
            ['nama' => 'LEVEL 1', 'kode' => 'LEVEL1', 'urutan' => 3],
            ['nama' => 'ASRAMA 1', 'kode' => 'ASRAMA1', 'urutan' => 4],
            ['nama' => 'LEVEL 2', 'kode' => 'LEVEL2', 'urutan' => 5],
            ['nama' => 'ASRAMA 2', 'kode' => 'ASRAMA2', 'urutan' => 6],
            ['nama' => 'LEVEL 3', 'kode' => 'LEVEL3', 'urutan' => 7],
            ['nama' => 'ASRAMA 3', 'kode' => 'ASRAMA3', 'urutan' => 8],
            ['nama' => 'LEVEL 4', 'kode' => 'LEVEL4', 'urutan' => 9],
            ['nama' => 'ASRAMA 4', 'kode' => 'ASRAMA4', 'urutan' => 10],
            ['nama' => 'JFT', 'kode' => 'JFT', 'urutan' => 11],
            ['nama' => 'SSW', 'kode' => 'SSW', 'urutan' => 12],
        ];

        foreach ($kategoris as $k) {
            BiayaKategori::updateOrCreate(
                ['kode' => $k['kode']],
                $k
            );
        }
    }
}
