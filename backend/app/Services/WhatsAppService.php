<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected $apiKey;
    protected $apiUrl = 'https://api.starsender.online/api/send';

    public function __construct()
    {
        $this->apiKey = config('services.starsender.api_key', env('STARSAPI_KEY'));
    }

    /**
     * Kirim pesan WhatsApp (text)
     */
    public function sendMessage($to, $message, $delay = 0)
    {
        $to = $this->formatPhoneNumber($to);

        if (!$to) {
            Log::warning('Nomor HP tidak valid untuk WhatsApp: ' . $to);
            return false;
        }

        $payload = [
            'messageType' => 'text',
            'to' => $to,
            'body' => $message,
        ];

        if ($delay > 0) {
            $payload['delay'] = $delay;
        }

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Authorization' => $this->apiKey,
            ])->post($this->apiUrl, $payload);

            if ($response->successful()) {
                Log::info('WhatsApp terkirim ke: ' . $to);
                return true;
            }

            Log::error('Gagal kirim WhatsApp ke: ' . $to . ' - ' . $response->body());
            return false;
        } catch (\Exception $e) {
            Log::error('Error kirim WhatsApp: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Kirim pesan WhatsApp (media + caption)
     */
    public function sendMediaMessage($to, $fileUrl, $caption = '', $delay = 0)
    {
        $to = $this->formatPhoneNumber($to);

        if (!$to) {
            Log::warning('Nomor HP tidak valid untuk WhatsApp media: ' . $to);
            return false;
        }

        $payload = [
            'messageType' => 'media',
            'to' => $to,
            'file' => $fileUrl,
        ];

        if ($caption) {
            $payload['body'] = $caption;
        }

        if ($delay > 0) {
            $payload['delay'] = $delay;
        }

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Authorization' => $this->apiKey,
            ])->post($this->apiUrl, $payload);

            if ($response->successful()) {
                Log::info('WhatsApp media terkirim ke: ' . $to);
                return true;
            }

            Log::error('Gagal kirim WhatsApp media ke: ' . $to . ' - ' . $response->body());
            return false;
        } catch (\Exception $e) {
            Log::error('Error kirim WhatsApp media: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Kirim notifikasi pembayaran ke admin (dengan gambar bukti)
     */
    public function sendPaymentNotificationToAdmin($pendaftar, $jumlah, $kategoriNama, $buktiPembayaran = null)
    {
        $settingKey = 'wa_pembayaran';
        if (!\App\Models\NotificationSetting::isEnabled($settingKey)) {
            Log::info("Notifikasi {$settingKey} dinonaktifkan.");
            return false;
        }

        $adminPhones = $this->getAdminPaymentPhones();
        if (empty($adminPhones)) {
            Log::warning('Tidak ada nomor admin untuk notifikasi pembayaran.');
            return false;
        }

        $tanggal = now()->translatedFormat('d F Y H:i');
        $nama = $pendaftar->nama;
        $jumlahFormat = 'Rp ' . number_format($jumlah, 0, ',', '.');
        $noReg = $pendaftar->no_registrasi ?? '-';
        $batch = $pendaftar->batch?->nama_batch ?? '-';

        $buktiLink = $buktiPembayaran ? asset('storage/' . $buktiPembayaran) : null;

        $message = "💰 *NOTIFIKASI PEMBAYARAN BARU*\n\n"
            . "Tanggal: {$tanggal}\n"
            . "Nama: {$nama}\n"
            . "No. Registrasi: {$noReg}\n"
            . "Batch: {$batch}\n"
            . "Kategori: {$kategoriNama}\n"
            . "Jumlah: {$jumlahFormat}\n"
            . "Status: Menunggu Verifikasi\n\n";

        if ($buktiLink) {
            $message .= "🧾 Bukti Pembayaran: {$buktiLink}\n\n";
        }

        $message .= "Silakan verifikasi pembayaran ini di panel admin.\n\n"
            . "- Sistem SIM Mendunia";

        $results = [];
        foreach ($adminPhones as $phone) {
            $results[] = $this->sendMessage($phone, $message);
        }

        return in_array(true, $results);
    }

    /**
     * Kirim notifikasi verifikasi pembayaran ke kandidat
     */
    public function sendPaymentVerifiedNotification($pendaftar, $kategoriNama, $status)
    {
        $noHp = $pendaftar->telepon ?? $pendaftar->user?->no_hp ?? null;
        if (!$noHp) {
            Log::warning('Pendaftar ' . $pendaftar->nama . ' tidak memiliki no_hp untuk notifikasi verifikasi.');
            return false;
        }

        $tanggal = now()->translatedFormat('d F Y H:i');
        $nama = $pendaftar->nama;
        $noReg = $pendaftar->no_registrasi ?? '-';
        $statusLabel = $status === 'verified' ? '✅ TERVERIFIKASI' : '❌ DITOLAK';

        $message = "📋 *NOTIFIKASI VERIFIKASI PEMBAYARAN*\n\n"
            . "Halo {$nama},\n\n"
            . "Pembayaran Anda telah diproses.\n"
            . "📅 Tanggal: {$tanggal}\n"
            . "No. Registrasi: {$noReg}\n"
            . "Kategori: {$kategoriNama}\n"
            . "Status: {$statusLabel}\n\n";

        if ($status === 'verified') {
            $message .= "Pembayaran Anda telah berhasil diverifikasi. Terima kasih.\n\n";
        } else {
            $message .= "Pembayaran Anda ditolak. Silakan hubungi admin untuk informasi lebih lanjut.\n\n";
        }

        $message .= "- Sistem SIM Mendunia";

        return $this->sendMessage($noHp, $message);
    }

    /**
     * Ambil nomor HP admin dari notification_settings
     */
    private function getAdminPaymentPhones()
    {
        $setting = \App\Models\NotificationSetting::where('key', 'wa_pembayaran_admin_phones')->first();
        if (!$setting || !$setting->value) {
            return [];
        }
        $phones = array_map('trim', explode(',', $setting->value));
        return array_filter($phones);
    }

    /**
     * Kirim notifikasi berdasarkan status absensi
     */
    public function sendAbsensiNotification($user, $status, $absensi = null)
    {
        if (!$user->no_hp) {
            Log::warning('User ' . $user->name . ' tidak memiliki no_hp');
            return false;
        }

        // Cek pengaturan notifikasi
        $key = $this->getSettingKey($status);
        if ($key && !\App\Models\NotificationSetting::isEnabled($key)) {
            Log::info("Notifikasi {$key} dinonaktifkan.");
            return false;
        }

        $message = $this->generateMessage($user, $status, $absensi);

        return $this->sendMessage($user->no_hp, $message);
    }

    /**
     * Mapping status ke key setting
     */
    private function getSettingKey($status)
    {
        $map = [
            'HADIR' => 'wa_hadir',
            'TERLAMBAT' => 'wa_terlambat',
            'PULANG LEBIH AWAL' => 'wa_pulang_lebih_awal',
            'TIDAK ABSEN PULANG' => 'wa_tidak_absen_pulang',
            'ALPA' => 'wa_alpa',
            'REMINDER_BELUM_ABSEN' => 'wa_reminder_belum_absen',
        ];

        return $map[$status] ?? null;
    }

    /**
     * Generate pesan berdasarkan status
     */
    private function generateMessage($user, $status, $absensi = null)
    {
        $nama = $user->name;
        $tanggal = now()->translatedFormat('d F Y');

        switch ($status) {
            case 'TERLAMBAT':
                $jamMasuk = $absensi ? $absensi->jam_masuk : '-';
                return "🔴 *NOTIFIKASI KETERLAMBATAN*\n\n"
                    . "Halo {$nama},\n\n"
                    . "Anda terlambat melakukan absensi masuk hari ini.\n"
                    . "📅 Tanggal: {$tanggal}\n"
                    . "⏰ Jam Masuk: {$jamMasuk}\n"
                    . "Status: TERLAMBAT\n\n"
                    . "Segera lakukan absensi masuk.\n\n"
                    . "- Sistem Absensi Karyawan";

            case 'PULANG LEBIH AWAL':
                $jamKeluar = $absensi ? $absensi->jam_keluar : '-';
                $jamPulangShift = $absensi && $absensi->shift ? $absensi->shift->jam_pulang : '-';
                return "🟡 *NOTIFIKASI PULANG LEBIH AWAL*\n\n"
                    . "Halo {$nama},\n\n"
                    . "Anda melakukan absensi pulang lebih awal dari jadwal.\n"
                    . "📅 Tanggal: {$tanggal}\n"
                    . "⏰ Jam Pulang Anda: {$jamKeluar}\n"
                    . "🕐 Jam Pulang Shift: {$jamPulangShift}\n"
                    . "Status: PULANG LEBIH AWAL\n\n"
                    . "Pastikan Anda telah menyelesaikan tugas hari ini.\n\n"
                    . "- Sistem Absensi Karyawan";

            case 'TIDAK ABSEN PULANG':
                return "🔴 *NOTIFIKASI TIDAK ABSEN PULANG*\n\n"
                    . "Halo {$nama},\n\n"
                    . "Anda tidak melakukan absensi pulang hari ini.\n"
                    . "📅 Tanggal: {$tanggal}\n"
                    . "Status: TIDAK ABSEN PULANG\n\n"
                    . "Silakan hubungi admin jika ada kendala.\n\n"
                    . "- Sistem Absensi Karyawan";

            case 'ALPA':
                return "🔴 *NOTIFIKASI ALPHA*\n\n"
                    . "Halo {$nama},\n\n"
                    . "Anda tidak melakukan absensi hari ini.\n"
                    . "📅 Tanggal: {$tanggal}\n"
                    . "Status: ALPHA\n\n"
                    . "Silakan hubungi admin jika ada kendala.\n\n"
                    . "- Sistem Absensi Karyawan";

            case 'HADIR':
                $jamMasuk = $absensi ? $absensi->jam_masuk : '-';
                return "🟢 *KONFIRMASI KEHADIRAN*\n\n"
                    . "Halo {$nama},\n\n"
                    . "Absensi masuk Anda berhasil dicatat.\n"
                    . "📅 Tanggal: {$tanggal}\n"
                    . "⏰ Jam Masuk: {$jamMasuk}\n"
                    . "Status: HADIR\n\n"
                    . "Selamat bekerja!\n\n"
                    . "- Sistem Absensi Karyawan";

            case 'REMINDER_BELUM_ABSEN':
                $jamMasukShift = $user->shift ? $user->shift->jam_masuk : '-';
                return "📩 *PENGINGAT ABSENSI*\n\n"
                    . "Halo {$nama},\n\n"
                    . "Anda belum melakukan absensi hari ini.\n"
                    . "📅 Tanggal: {$tanggal}\n"
                    . "⏰ Jam Masuk Shift: {$jamMasukShift}\n\n"
                    . "Silakan segera melakukan absensi sebelum terlambat.\n\n"
                    . "- Sistem Absensi Karyawan";

            default:
                return "Halo {$nama},\n\nStatus absensi Anda: {$status}\n\n- Sistem Absensi Karyawan";
        }
    }

    /**
     * Format nomor HP ke format 62
     */
    private function formatPhoneNumber($number)
    {
        if (!$number) return null;

        // Hapus karakter non-digit
        $number = preg_replace('/[^0-9]/', '', $number);

        // Jika diawali 0, ganti dengan 62
        if (substr($number, 0, 1) === '0') {
            $number = '62' . substr($number, 1);
        }

        // Jika belum diawali 62, tambahkan
        if (substr($number, 0, 2) !== '62') {
            $number = '62' . $number;
        }

        return $number;
    }
}
