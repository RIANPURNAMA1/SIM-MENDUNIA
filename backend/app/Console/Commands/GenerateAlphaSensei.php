<?php

namespace App\Console\Commands;

use App\Models\AbsensiSensei;
use App\Models\HariLibur;
use App\Models\KelasSensei;
use Carbon\Carbon;
use Illuminate\Console\Command;

class GenerateAlphaSensei extends Command
{
    protected $signature = 'absensi:generate-alpha-sensei';

    protected $description = 'Otomatis set status ALPA/LIBUR/TIDAK ABSEN PULANG untuk sensei di akhir hari';

    public function handle()
    {
        $today = Carbon::today('Asia/Jakarta')->toDateString();
        $now = Carbon::now('Asia/Jakarta');

        $isLibur = HariLibur::apakahLibur($today);

        $kelasAktif = KelasSensei::where('status', 'aktif')
            ->whereDate('tanggal_mulai', '<=', $today)
            ->whereDate('tanggal_selesai', '>=', $today)
            ->with('user')
            ->get();

        foreach ($kelasAktif as $kelas) {
            $sensei = $kelas->user;
            if (! $sensei) {
                continue;
            }

            $shift = $sensei->shift;
            $jamPulangShift = $shift ? Carbon::parse($shift->jam_pulang, 'Asia/Jakarta') : Carbon::parse('17:00:00', 'Asia/Jakarta');
            $jamMasukShift = $shift ? Carbon::parse($shift->jam_masuk, 'Asia/Jakarta') : Carbon::parse('09:00:00', 'Asia/Jakarta');
            $toleransi = $shift ? ($shift->toleransi ?? 0) : 0;

            if ($jamPulangShift->lt($jamMasukShift)) {
                $jamPulangShift->addDay();
            }

            $batasJamMasuk = $jamMasukShift->copy()->addMinutes(30 + $toleransi);
            $batasJamPulang = $jamPulangShift->copy()->addMinutes(30);

            $absensi = AbsensiSensei::where('kelas_sensei_id', $kelas->id)
                ->where('user_id', $sensei->id)
                ->where('tanggal', $today)
                ->first();

            if ($absensi) {
                if ($absensi->jam_masuk && ! $absensi->jam_keluar) {
                    if ($now->gt($batasJamPulang)) {
                        if ($isLibur) {
                            $absensi->update([
                                'status' => 'LIBUR',
                                'catatan' => 'Hari libur otomatis',
                            ]);
                        } else {
                            $absensi->update([
                                'status' => 'TIDAK ABSEN PULANG',
                                'catatan' => 'Sistem otomatis: Lupa absen pulang.',
                            ]);
                        }
                    }
                }

                continue;
            }

            if ($isLibur) {
                AbsensiSensei::create([
                    'kelas_sensei_id' => $kelas->id,
                    'user_id' => $sensei->id,
                    'tanggal' => $today,
                    'status' => 'LIBUR',
                    'catatan' => 'Libur otomatis (Weekend/Nasional)',
                ]);
            } elseif ($now->gt($batasJamMasuk)) {
                AbsensiSensei::create([
                    'kelas_sensei_id' => $kelas->id,
                    'user_id' => $sensei->id,
                    'tanggal' => $today,
                    'status' => 'ALPA',
                    'catatan' => 'Sistem otomatis: Tidak melakukan absensi setelah melewati batas jam masuk shift.',
                ]);
            }
        }

        $this->info('Generate status sensei harian selesai.');
    }
}
