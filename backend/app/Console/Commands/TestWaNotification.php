<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Absensi;
use App\Services\WhatsAppService;
use Illuminate\Console\Command;

class TestWaNotification extends Command
{
    protected $signature = 'wa:test {status} {--user_id=}';
    protected $description = 'Test kirim WA notifikasi berdasarkan status';

    public function handle()
    {
        $status = strtoupper($this->argument('status'));
        $userId = $this->option('user_id');

        // Validasi status
        $validStatuses = ['HADIR', 'TERLAMBAT', 'PULANG LEBIH AWAL', 'TIDAK ABSEN PULANG', 'ALPA', 'REMINDER_BELUM_ABSEN'];
        
        if (!in_array($status, $validStatuses)) {
            $this->error("Status tidak valid! Gunakan: " . implode(', ', $validStatuses));
            return;
        }

        // Ambil user
        if ($userId) {
            $user = User::find($userId);
        } else {
            $user = User::whereNotNull('no_hp')->where('role', 'KARYAWAN')->first();
        }

        if (!$user) {
            $this->error("User tidak ditemukan!");
            return;
        }

        if (!$user->no_hp) {
            $this->error("User {$user->name} tidak memiliki no_hp!");
            return;
        }

        $this->info("Mengirim notifikasi ke: {$user->name} ({$user->no_hp})");
        $this->info("Status: {$status}");

        // Buat absensi dummy jika diperlukan
        $absensi = null;
        if (in_array($status, ['HADIR', 'TERLAMBAT', 'PULANG LEBIH AWAL', 'TIDAK ABSEN PULANG'])) {
            $absensi = new Absensi();
            $absensi->jam_masuk = now()->format('H:i:s');
            $absensi->jam_keluar = now()->format('H:i:s');
            
            // Ambil shift user
            if ($user->shift) {
                $absensi->shift = $user->shift;
            }
        }

        // Kirim notifikasi
        $whatsapp = new WhatsAppService();
        $result = $whatsapp->sendAbsensiNotification($user, $status, $absensi);

        if ($result) {
            $this->info("✓ Notifikasi berhasil dikirim!");
        } else {
            $this->error("✗ Gagal mengirim notifikasi. Cek log di storage/logs/laravel.log");
        }
    }
}
