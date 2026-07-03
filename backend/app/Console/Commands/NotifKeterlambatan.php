<?php

namespace App\Console\Commands;

use App\Models\Absensi;
use App\Services\WhatsAppService;
use Carbon\Carbon;

class NotifKeterlambatan extends \Illuminate\Console\Command
{
    protected $signature = 'app:notif-keterlambatan';
    protected $description = 'Kirim notifikasi WA untuk karyawan yang terlambat';

    public function handle()
    {
        $today = Carbon::today('Asia/Jakarta')->toDateString();
        $whatsapp = new WhatsAppService();
        $count = 0;

        // Ambil absensi hari ini dengan status TERLAMBAT yang belum dinotifikasi
        $absensis = Absensi::with('user')
            ->where('tanggal', $today)
            ->where('status', 'TERLAMBAT')
            ->whereNotNull('jam_masuk')
            ->get();

        foreach ($absensis as $absensi) {
            if (!$absensi->user || !$absensi->user->no_hp) continue;

            // Kirim notifikasi
            $whatsapp->sendAbsensiNotification($absensi->user, 'TERLAMBAT', $absensi);
            $count++;
        }

        $this->info("Notifikasi keterlambatan terkirim ke {$count} karyawan.");
    }
}
