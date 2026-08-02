<?php

namespace App\Console\Commands;

use App\Models\AbsensiSiswa;
use Carbon\Carbon;
use Illuminate\Console\Command;

class CekAbsenPulangSiswa extends Command
{
    protected $signature = 'app:cek-absen-pulang-siswa';
    protected $description = 'Menandai absensi siswa yang tidak absen pulang lewat 7 jam dari jam pulang shift';

    public function handle()
    {
        $now = Carbon::now('Asia/Jakarta');

        $absensis = AbsensiSiswa::with('siswa.shift')
            ->whereNotNull('jam_masuk')
            ->whereNull('jam_keluar')
            ->get();

        foreach ($absensis as $absen) {
            $siswa = $absen->siswa;
            if (!$siswa) continue;

            $shift = $siswa->shift;
            $jamPulang = $shift && $shift->jam_pulang
                ? Carbon::parse($shift->jam_pulang, 'Asia/Jakarta')
                : null;

            if ($jamPulang) {
                $jamMasuk = Carbon::parse($absen->jam_masuk, 'Asia/Jakarta');
                if ($jamPulang->lt($jamMasuk)) {
                    $jamPulang->addDay();
                }

                $batasAkhir = $jamPulang->copy()->addHours(7);

                if ($now->greaterThan($batasAkhir)) {
                    $absen->update([
                        'status' => 'TIDAK ABSEN PULANG',
                        'keterangan' => 'Sistem otomatis: Lupa absen pulang.',
                    ]);
                    $this->info("Siswa {$siswa->id} → TIDAK ABSEN PULANG");
                }
            }
        }

        $this->info('Selesai cek absen pulang siswa.');
    }
}
