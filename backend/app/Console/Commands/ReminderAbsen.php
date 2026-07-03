<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Absensi;
use App\Services\WhatsAppService;
use Carbon\Carbon;

class ReminderAbsen extends \Illuminate\Console\Command
{
    protected $signature = 'app:reminder-absen';
    protected $description = 'Kirim reminder WA 30 menit sebelum jam masuk shift';

    public function handle()
    {
        $now = Carbon::now('Asia/Jakarta');
        $today = Carbon::today('Asia/Jakarta')->toDateString();

        $users = User::where('role', 'KARYAWAN')
            ->where('status', 'AKTIF')
            ->whereNotNull('shift_id')
            ->whereNotNull('no_hp')
            ->with('shift')
            ->get();

        $whatsapp = new WhatsAppService();
        $count = 0;

        foreach ($users as $user) {
            $shift = $user->shift;
            if (!$shift) continue;

            // Cek apakah sudah absen
            $sudahAbsen = Absensi::where('user_id', $user->id)
                ->where('tanggal', $today)
                ->exists();

            if ($sudahAbsen) continue;

            $jamMasuk = Carbon::parse($today . ' ' . $shift->jam_masuk, 'Asia/Jakarta');
            $selisihMenit = $now->diffInMinutes($jamMasuk, false);

            // Reminder 30 menit sebelum jam masuk
            if ($selisihMenit > 0 && $selisihMenit <= 30) {
                $whatsapp->sendAbsensiNotification($user, 'REMINDER_BELUM_ABSEN');
                $count++;
            }
        }

        $this->info("Reminder terkirim ke {$count} karyawan.");
    }
}
