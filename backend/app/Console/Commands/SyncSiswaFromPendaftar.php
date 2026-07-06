<?php

namespace App\Console\Commands;

use App\Models\Pendaftar;
use App\Models\Siswa;
use Illuminate\Console\Command;

class SyncSiswaFromPendaftar extends Command
{
    protected $signature = 'sync:siswa-from-pendaftar';
    protected $description = 'Buat record Siswa untuk pendaftar yang sudah disetujui tapi belum punya data di tabel siswas';

    public function handle()
    {
        $pendaftars = Pendaftar::where('status_pendaftaran', 'disetujui')
            ->whereNotNull('user_id')
            ->get();

        $count = 0;
        foreach ($pendaftars as $p) {
            $exists = Siswa::where('user_id', $p->user_id)->exists();
            if ($exists) {
                $this->warn("Siswa untuk user_id {$p->user_id} ({$p->nama}) sudah ada, skip");
                continue;
            }

            Siswa::create([
                'user_id' => $p->user_id,
                'nama' => $p->nama,
                'batch_id' => $p->batch_id,
                'no_hp' => $p->telepon,
                'alamat' => $p->alamat,
                'status' => 'AKTIF',
            ]);

            $this->info("Siswa {$p->nama} berhasil dibuat");
            $count++;
        }

        $this->info("Selesai. {$count} data siswa baru dibuat.");
    }
}
