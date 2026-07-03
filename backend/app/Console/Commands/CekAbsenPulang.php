<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Absensi;
use App\Services\WhatsAppService;
use Carbon\Carbon;

class CekAbsenPulang extends Command
{
    protected $signature = 'app:cek-absen-pulang';
    protected $description = 'Menandai absensi yang tidak absen pulang lewat 3 jam dari jam shift';

    public function handle()
    {
        $now = Carbon::now('Asia/Jakarta');
        $whatsapp = new WhatsAppService();

        $absensis = Absensi::with(['shift', 'user'])
            ->whereNull('jam_keluar')
            ->whereIn('status', ['HADIR', 'TERLAMBAT'])
            ->get();

        foreach ($absensis as $absen) {

            if (!$absen->shift) continue;

            $jamMasukShift  = Carbon::parse($absen->shift->jam_masuk);
            $jamPulangShift = Carbon::parse($absen->shift->jam_pulang);

            if ($jamPulangShift->lt($jamMasukShift)) {
                $jamPulangShift->addDay();
            }

            $batasAkhir = $jamPulangShift->copy()->addHours(5);

            if ($now->greaterThan($batasAkhir)) {

                $absen->update([
                    'status' => 'TIDAK ABSEN PULANG',
                    'keterangan' => 'Otomatis sistem: tidak absen pulang'
                ]);

                // Kirim notifikasi WhatsApp
                if ($absen->user && $absen->user->no_hp) {
                    $whatsapp->sendAbsensiNotification($absen->user, 'TIDAK ABSEN PULANG', $absen);
                }

                $this->info("User {$absen->user_id} → TIDAK ABSEN PULANG");
            }
        }

        $this->info('Selesai cek absen pulang.');
    }
}
