<?php

namespace App\Console\Commands;

use App\Models\Absensi;
use App\Services\WhatsAppService;
use Carbon\Carbon;

class NotifTidakAbsenPulang extends \Illuminate\Console\Command
{
    protected $signature = 'app:notif-tidak-absen-pulang';
    protected $description = 'Kirim notifikasi WA untuk status TIDAK ABSEN PULANG';

    public function handle()
    {
        $today = Carbon::today('Asia/Jakarta')->toDateString();
        $whatsapp = new WhatsAppService();
        $count = 0;

        // Ambil absensi hari ini dengan status TIDAK ABSEN PULANG
        $absensis = Absensi::with('user')
            ->where('tanggal', $today)
            ->where('status', 'TIDAK ABSEN PULANG')
            ->get();

        foreach ($absensis as $absensi) {
            if (!$absensi->user || !$absensi->user->no_hp) continue;

            $whatsapp->sendAbsensiNotification($absensi->user, 'TIDAK ABSEN PULANG', $absensi);
            $count++;
        }

        $this->info("Notifikasi TIDAK ABSEN PULANG terkirim ke {$count} karyawan.");
    }
}
