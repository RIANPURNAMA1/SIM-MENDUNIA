<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected $apiKey;
    protected $apiUrl;

    public function __construct()
    {
        $this->apiKey = \App\Models\NotificationSetting::getValue('starsender_api_key', config('services.starsender.api_key', env('STARSAPI_KEY')));
        $this->apiUrl = \App\Models\NotificationSetting::getValue('starsender_api_url', config('services.starsender.api_url', env('STARSAPI_URL', 'https://api.starsender.online/api/send')));
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

        if (!$this->apiKey || !$this->apiUrl) {
            Log::warning('WhatsAppService: API key atau URL tidak dikonfigurasi.');
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

        if (!$this->apiKey || !$this->apiUrl) {
            Log::warning('WhatsAppService: API key atau URL tidak dikonfigurasi.');
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
        $company = \App\Models\CompanyProfile::getProfile()->company_name ?? 'MENDUNIA.ID';

        $buktiLink = $buktiPembayaran ? asset('storage/' . $buktiPembayaran) : null;
        $buktiSection = $buktiLink ? "🧾 Bukti Pembayaran: {$buktiLink}\n\n" : '';

        $replyInstructions = "Silakan balas pesan ini:\n"
            . "• Balas *KONFIRMASI* untuk menyetujui pembayaran ✅\n"
            . "• Balas *BATAL* untuk menolak pembayaran ❌";

        $vars = [
            'tanggal' => $tanggal,
            'nama' => $nama,
            'no_registrasi' => $noReg,
            'batch' => $batch,
            'kategori' => $kategoriNama,
            'jumlah' => $jumlahFormat,
            'bukti_link' => $buktiLink,
            'bukti_section' => $buktiSection,
            'reply_instructions' => $replyInstructions,
            'company_name' => $company,
        ];

        $message = null;
        $rendered = \App\Models\NotificationTemplate::render('payment_new_wa', $vars);
        if ($rendered) {
            $message = $rendered['body'];
        }

        // Fallback jika template tidak ditemukan atau tidak aktif
        if (!$message) {
            $message = "💰 *NOTIFIKASI PEMBAYARAN BARU*\n\n"
                . "Tanggal: {$tanggal}\n"
                . "Nama: {$nama}\n"
                . "No. Registrasi: {$noReg}\n"
                . "Batch: {$batch}\n"
                . "Kategori: {$kategoriNama}\n"
                . "Jumlah: {$jumlahFormat}\n"
                . "Status: Menunggu Verifikasi\n\n"
                . $buktiSection
                . "Silakan verifikasi pembayaran ini di panel admin.\n\n"
                . $replyInstructions . "\n\n"
                . "- {$company}";
        }

        // Catat approval PENDING agar balasan admin bisa dipetakan ke pendaftar ini
        foreach ($adminPhones as $phone) {
            \App\Models\WaPaymentApproval::create([
                'pendaftar_id' => $pendaftar->id,
                'admin_phone' => $phone,
                'status' => 'PENDING',
            ]);
        }

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

        $sent = $this->sendMessage($noHp, $message);
        $this->logNotification($pendaftar->id ?? null, 'payment_verified', $noHp, $message, $sent);
        return $sent;
    }

    /**
     * 1. Tagihan Baru — dikirim ke kandidat saat tagihan dibuat
     */
    public function sendNewBillNotification($pendaftar, $noInvoice)
    {
        $noHp = $pendaftar->telepon ?? $pendaftar->user?->no_hp ?? null;
        if (!$noHp) return false;

        $nama = $pendaftar->nama;
        $program = $pendaftar->product?->nama ?? '-';
        $noReg = $pendaftar->no_registrasi ?? '-';
        $totalTagihan = $this->getTotalTagihan($pendaftar);
        $totalFormat = 'Rp ' . number_format($totalTagihan, 0, ',', '.');
        $linkInvoice = env('FRONTEND_URL', 'http://localhost:5173') . '/pendaftar/' . $pendaftar->id . '/invoice';

        $message = "Halo {$nama},\n\n"
            . "Tagihan Anda telah dibuat.\n\n"
            . "*Program:* {$program}\n"
            . "*No. Registrasi:* {$noReg}\n"
            . "*Invoice:* {$noInvoice}\n"
            . "*Nominal:* {$totalFormat}\n\n"
            . "Silakan lakukan pembayaran sebelum tagihan jatuh tempo.\n\n"
            . "Lihat Invoice: {$linkInvoice}\n"
            . "Hubungi Admin: {$this->getAdminWhatsApp()}\n\n"
            . "- Sistem SIM Mendunia";

        $sent = $this->sendMessage($noHp, $message);
        $this->logNotification($pendaftar->id ?? null, 'new_bill', $noHp, $message, $sent);
        return $sent;
    }

    /**
     * 2. Pengingat Sebelum Jatuh Tempo (H-7, H-3, H-1)
     */
    public function sendPaymentReminder($pendaftar, $hariTersisa)
    {
        $noHp = $pendaftar->telepon ?? $pendaftar->user?->no_hp ?? null;
        if (!$noHp) return false;

        $nama = $pendaftar->nama;
        $program = $pendaftar->product?->nama ?? '-';
        $totalTagihan = $this->getTotalTagihan($pendaftar);
        $totalDibayar = (float) ($pendaftar->nominal ?? 0);
        $sisa = max(0, $totalTagihan - $totalDibayar);
        $sisaFormat = 'Rp ' . number_format($sisa, 0, ',', '.');
        $noInvoice = 'INV/' . str_pad($pendaftar->id, 5, '0', STR_PAD_LEFT) . '/' . $pendaftar->created_at->format('Ym');

        $labelHari = match(true) {
            $hariTersisa <= 1 => 'besok',
            $hariTersisa <= 3 => "dalam {$hariTersisa} hari",
            default => "dalam {$hariTersisa} hari",
        };

        $message = "Pengingat pembayaran.\n\n"
            . "Halo {$nama},\n\n"
            . "Tagihan sebesar *{$sisaFormat}* akan jatuh tempo {$labelHari}.\n\n"
            . "*Program:* {$program}\n"
            . "*Invoice:* {$noInvoice}\n"
            . "*Sisa Tagihan:* {$sisaFormat}\n\n"
            . "Silakan lakukan pembayaran sebelum jatuh tempo.\n\n"
            . "- Sistem SIM Mendunia";

        $sent = $this->sendMessage($noHp, $message);
        $this->logNotification($pendaftar->id ?? null, "reminder_h{$hariTersisa}", $noHp, $message, $sent);
        return $sent;
    }

    /**
     * 3. Pembayaran Berhasil (lunas per kategori)
     */
    public function sendPaymentSuccessNotification($pendaftar, $kategoriNama, $jumlah)
    {
        $noHp = $pendaftar->telepon ?? $pendaftar->user?->no_hp ?? null;
        if (!$noHp) return false;

        $nama = $pendaftar->nama;
        $noInvoice = 'INV/' . str_pad($pendaftar->id, 5, '0', STR_PAD_LEFT) . '/' . $pendaftar->created_at->format('Ym');
        $jumlahFormat = 'Rp ' . number_format($jumlah, 0, ',', '.');
        $tanggal = now()->translatedFormat('d F Y');

        $message = "Pembayaran Anda telah diterima.\n\n"
            . "*Invoice:* {$noInvoice}\n"
            . "*Kategori:* {$kategoriNama}\n"
            . "*Nominal:* {$jumlahFormat}\n"
            . "*Tanggal:* {$tanggal}\n\n"
            . "Terima kasih.\n\n"
            . "- Sistem SIM Mendunia";

        $sent = $this->sendMessage($noHp, $message);
        $this->logNotification($pendaftar->id ?? null, 'payment_success', $noHp, $message, $sent);
        return $sent;
    }

    /**
     * 4. Pembayaran Ditolak (dengan alasan)
     */
    public function sendPaymentRejectedNotification($pendaftar, $kategoriNama, $alasan = null)
    {
        $noHp = $pendaftar->telepon ?? $pendaftar->user?->no_hp ?? null;
        if (!$noHp) return false;

        $nama = $pendaftar->nama;
        $noInvoice = 'INV/' . str_pad($pendaftar->id, 5, '0', STR_PAD_LEFT) . '/' . $pendaftar->created_at->format('Ym');

        $message = "Bukti pembayaran belum dapat kami verifikasi.\n\n"
            . "*Invoice:* {$noInvoice}\n"
            . "*Kategori:* {$kategoriNama}\n\n";

        if ($alasan) {
            $message .= "*Alasan:* {$alasan}\n\n";
        } else {
            $message .= "Silakan hubungi admin untuk informasi lebih lanjut.\n\n";
        }

        $message .= "Silakan unggah ulang bukti pembayaran.\n\n"
            . "- Sistem SIM Mendunia";

        $sent = $this->sendMessage($noHp, $message);
        $this->logNotification($pendaftar->id ?? null, 'payment_rejected', $noHp, $message, $sent);
        return $sent;
    }

    /**
     * 5. Pembayaran Sebagian (Cicilan)
     */
    public function sendPartialPaymentNotification($pendaftar, $kategoriNama, $jumlahBayar)
    {
        $noHp = $pendaftar->telepon ?? $pendaftar->user?->no_hp ?? null;
        if (!$noHp) return false;

        $nama = $pendaftar->nama;
        $program = $pendaftar->product?->nama ?? '-';
        $noReg = $pendaftar->no_registrasi ?? '-';
        $noInvoice = 'INV/' . str_pad($pendaftar->id, 5, '0', STR_PAD_LEFT) . '/' . $pendaftar->created_at->format('Ym');
        $totalTagihan = $this->getTotalTagihan($pendaftar);
        $totalDibayar = (float) ($pendaftar->nominal ?? 0);
        $sisa = max(0, $totalTagihan - $totalDibayar);

        $totalFormat = 'Rp ' . number_format($totalTagihan, 0, ',', '.');
        $dibayarFormat = 'Rp ' . number_format($totalDibayar, 0, ',', '.');
        $sisaFormat = 'Rp ' . number_format($sisa, 0, ',', '.');
        $bayarFormat = 'Rp ' . number_format($jumlahBayar, 0, ',', '.');

        $company = \App\Models\CompanyProfile::getProfile();
        $companyName = $company->company_name ?? 'MENDUNIA.ID';

        if (!$pendaftar->relationLoaded('batch')) {
            $pendaftar->load('batch');
        }
        $linkGrup = $pendaftar->batch?->link_grup;

        $rendered = \App\Models\NotificationTemplate::render('payment_verified_wa', [
            'nama' => $nama,
            'program' => $program,
            'no_registrasi' => $noReg,
            'link_grup' => $linkGrup,
            'company_name' => $companyName,
        ]);

        if ($rendered && $sisa <= 0) {
            $message = $rendered['body'];
        } else {
            $message = "Pembayaran cicilan berhasil diterima.\n\n"
                . "*Invoice:* {$noInvoice}\n"
                . "*Kategori:* {$kategoriNama}\n"
                . "*Dibayar:* {$bayarFormat}\n\n"
                . "*Total Tagihan:* {$totalFormat}\n"
                . "*Sudah Dibayar:* {$dibayarFormat}\n"
                . "*Sisa:* {$sisaFormat}\n\n";

            if ($sisa <= 0) {
                $message .= "Seluruh pembayaran Anda telah lunas.\n\n"
                    . "Terima kasih telah menyelesaikan pembayaran.\n\n";
            } else {
                $message .= "Silakan lakukan pembayaran sisa sebelum jatuh tempo.\n\n";
            }

            $message .= "- {$companyName}";
        }

        $sent = $this->sendMessage($noHp, $message);
        $this->logNotification($pendaftar->id ?? null, 'payment_partial', $noHp, $message, $sent);
        return $sent;
    }

    /**
     * 6. Tagihan Lunas
     */
    public function sendFullPaymentNotification($pendaftar)
    {
        $noHp = $pendaftar->telepon ?? $pendaftar->user?->no_hp ?? null;
        if (!$noHp) return false;

        $nama = $pendaftar->nama;
        $program = $pendaftar->product?->nama ?? '-';
        $noReg = $pendaftar->no_registrasi ?? '-';
        $company = \App\Models\CompanyProfile::getProfile();
        $companyName = $company->company_name ?? 'MENDUNIA.ID';

        // Load batch untuk link_grup
        if (!$pendaftar->relationLoaded('batch')) {
            $pendaftar->load('batch');
        }
        $linkGrup = $pendaftar->batch?->link_grup;

        $rendered = \App\Models\NotificationTemplate::render('payment_verified_wa', [
            'nama' => $nama,
            'program' => $program,
            'no_registrasi' => $noReg,
            'link_grup' => $linkGrup,
            'company_name' => $companyName,
        ]);

        if ($rendered) {
            $message = $rendered['body'];
        } else {
            $message = "Selamat.\n\n"
                . "Seluruh pembayaran Anda telah *lunas*.\n\n"
                . "*Program:* {$program}\n"
                . "*No. Registrasi:* {$noReg}\n\n"
                . "Terima kasih telah menyelesaikan pembayaran.\n\n"
                . "- {$companyName}";
        }

        $sent = $this->sendMessage($noHp, $message);
        $this->logNotification($pendaftar->id ?? null, 'full_payment', $noHp, $message, $sent);
        return $sent;
    }

    /**
     * Kirim notifikasi persetujuan pendaftaran ke kandidat
     */
    public function sendRegistrationApprovedNotification($pendaftar)
    {
        $noHp = $pendaftar->telepon ?? $pendaftar->user?->no_hp ?? null;
        if (!$noHp) return false;

        $nama = $pendaftar->nama;
        $noReg = $pendaftar->no_registrasi ?? '-';
        $program = $pendaftar->product?->nama ?? '-';
        $noInvoice = 'INV/' . str_pad($pendaftar->id, 5, '0', STR_PAD_LEFT) . '/' . $pendaftar->created_at->format('Ym');

        $message = "Selamat, {$nama}.\n\n"
            . "Pendaftaran Anda telah *disetujui*.\n\n"
            . "*Program:* {$program}\n"
            . "*No. Registrasi:* {$noReg}\n"
            . "*Invoice:* {$noInvoice}\n\n"
            . "Silakan cek invoice untuk detail pembayaran.\n\n"
            . "- Sistem SIM Mendunia";

        $sent = $this->sendMessage($noHp, $message);
        $this->logNotification($pendaftar->id ?? null, 'registration_approved', $noHp, $message, $sent);
        return $sent;
    }

    /**
     * Kirim notifikasi perubahan status (pendaftaran/pembayaran) ke kandidat.
     * Pesan memakai template WA sesuai $templateKey, fallback ke pesan bawaan.
     */
    public function sendStatusNotification($pendaftar, $templateKey, $vars = [])
    {
        $noHp = $pendaftar->telepon ?? $pendaftar->user?->no_hp ?? null;
        if (!$noHp) {
            Log::warning('Pendaftar ' . $pendaftar->nama . ' tidak memiliki no_hp untuk notifikasi status.');
            return false;
        }

        $defaults = [
            'nama' => $pendaftar->nama,
            'program' => $pendaftar->product?->nama ?? '-',
            'no_registrasi' => $pendaftar->no_registrasi ?? '-',
            'status' => 'diperbarui',
            'waktu' => now()->translatedFormat('d F Y H:i'),
            'company_name' => \App\Models\CompanyProfile::getProfile()->company_name ?? 'MENDUNIA.ID',
        ];
        $vars = array_merge($defaults, $vars);

        $rendered = \App\Models\NotificationTemplate::render($templateKey, $vars);
        if ($rendered) {
            $message = $rendered['body'];
        } else {
            $message = "Halo *{$vars['nama']}*,\n\n"
                . "Status pendaftaran/pembayaran kamu untuk *{$vars['program']}* (No. Registrasi: {$vars['no_registrasi']}) telah berubah menjadi: *{$vars['status']}*.\n\n"
                . "- {$vars['company_name']}";
        }

        $sent = $this->sendMessage($noHp, $message);
        $this->logNotification($pendaftar->id ?? null, str_replace('_wa', '', $templateKey), $noHp, $message, $sent);
        return $sent;
    }

    /**
     * Hitung total tagihan pendaftar
     */
    private function getTotalTagihan($pendaftar)
    {
        $totalBiaya = 0;
        $pendaftar->loadMissing('product.biayaKategoris');
        if ($pendaftar->product && $pendaftar->product->relationLoaded('biayaKategoris')) {
            $totalBiaya = $pendaftar->product->biayaKategoris->sum(fn($k) => (int) $k->pivot->harga);
        }
        $totalBiaya = $totalBiaya ?: ($pendaftar->product?->harga ?? 0);
        return $totalBiaya - ($pendaftar->diskon ?? 0);
    }

    /**
     * Ambil nomor WhatsApp admin
     */
    private function getAdminWhatsApp()
    {
        $phones = $this->getAdminPaymentPhones();
        return $phones[0] ?? '-';
    }

    /**
     * Log notifikasi ke database
     */
    private function logNotification($pendaftarId, $type, $toPhone, $message, $success, $userId = null)
    {
        try {
            \App\Models\WaNotification::create([
                'pendaftar_id' => $pendaftarId,
                'user_id' => $userId,
                'type' => $type,
                'to_phone' => $toPhone,
                'message' => $message,
                'success' => $success,
                'error' => $success ? null : 'Gagal mengirim',
            ]);
        } catch (\Exception $e) {
            Log::error('Gagal log WA notification: ' . $e->getMessage());
        }
    }

    /**
     * Ambil nomor HP admin dari notification_settings
     */
    private function getAdminPaymentPhones()
    {
        return $this->getAdminPhones('wa_pembayaran_admin_phones');
    }

    /**
     * Ambil daftar nomor HP dari notification_settings berdasarkan key (pisahkan koma)
     */
    private function getAdminPhones($key)
    {
        $setting = \App\Models\NotificationSetting::where('key', $key)->first();
        if (!$setting || !$setting->value) {
            return [];
        }
        $phones = array_map('trim', explode(',', $setting->value));
        return array_filter($phones);
    }

    /**
     * Kirim notifikasi berdasarkan status absensi
     * Cegah duplikat: setiap jenis notifikasi hanya dikirim 1x per hari per user
     */
    public function sendAbsensiNotification($user, $status, $absensi = null)
    {
        // Hanya kirim ke role KARYAWAN
        if ($user->role !== 'KARYAWAN') {
            Log::info("Notifikasi {$status} dilewati untuk {$user->name} (role: {$user->role}, bukan KARYAWAN).");
            return false;
        }

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

        // Cek duplikat via absensi record (untuk status selain REMINDER)
        if ($absensi && $status !== 'REMINDER_BELUM_ABSEN') {
            $notifTerkirim = $absensi->notif_terkirim ?? [];
            if (!empty($notifTerkirim[$status])) {
                Log::info("Notifikasi {$status} sudah terkirim untuk absensi user {$user->id} hari ini, skip.");
                return false;
            }
        }

        // Cek duplikat via wa_notifications (untuk REMINDER atau fallback)
        $today = now()->toDateString();
        $notifType = 'absensi_' . strtolower(str_replace(' ', '_', $status));
        $sudahDikirim = \App\Models\WaNotification::where('user_id', $user->id)
            ->where('type', $notifType)
            ->whereDate('created_at', $today)
            ->exists();

        if ($sudahDikirim) {
            Log::info("Notifikasi {$status} sudah terkirim ke user {$user->id} hari ini (via log), skip.");
            return false;
        }

        $message = $this->generateMessage($user, $status, $absensi);
        $sent = $this->sendMessage($user->no_hp, $message);

        // Log ke wa_notifications
        $this->logNotification(null, $notifType, $user->no_hp, $message, $sent, $user->id);

        // Tandai di absensi record
        if ($absensi && $sent && $status !== 'REMINDER_BELUM_ABSEN') {
            $notifTerkirim = $absensi->notif_terkirim ?? [];
            $notifTerkirim[$status] = true;
            $absensi->update(['notif_terkirim' => $notifTerkirim]);
        }

        return $sent;
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
     * Kirim notifikasi pendaftaran berhasil ke kandidat dengan link pembayaran
     * (teks dapat diatur lewat template "welcome_wa")
     */
    public function sendRegistrationSuccessNotification($pendaftar)
    {
        $noHp = $pendaftar->telepon ?? $pendaftar->user?->no_hp ?? null;
        if (!$noHp) return false;

        $nama = $pendaftar->nama;
        $program = $pendaftar->product?->nama ?? '-';
        $noReg = $pendaftar->no_registrasi ?? '-';
        $noInvoice = 'INV/' . str_pad($pendaftar->id, 5, '0', STR_PAD_LEFT) . '/' . $pendaftar->created_at->format('Ym');
        $linkBayar = env('FRONTEND_URL', 'http://localhost:5173') . '/checkout-berhasil/' . $pendaftar->token;

        if (!$pendaftar->relationLoaded('batch')) {
            $pendaftar->load('batch');
        }
        $batchNama = $pendaftar->batch?->nama_batch ?? '-';

        $company = \App\Models\CompanyProfile::getProfile();
        $companyName = $company->company_name ?? 'MENDUNIA.ID';

        $pendaftar->loadMissing('pembayaranItems');
        $totalTransfer = $pendaftar->pembayaranItems->first()?->total_transfer ?? $this->getTotalTagihan($pendaftar);
        $jatuhTempo = now()->addDays(1);

        $rendered = \App\Models\NotificationTemplate::render('welcome_wa', [
            'nama' => $nama,
            'program' => $program,
            'batch' => $batchNama,
            'no_registrasi' => $noReg,
            'total_transfer' => number_format($totalTransfer, 0, ',', '.'),
            'jatuh_tempo' => $jatuhTempo->format('l, d F Y') . ' pukul ' . $jatuhTempo->format('H:i') . ' WIB',
            'company_name' => $companyName,
            'bank_nama' => $company->bank_nama ?? '-',
            'bank_rekening' => $company->bank_nomor_rekening ?? '-',
            'bank_pemilik' => $company->bank_pemilik ?? '-',
            'konfirmasi_url' => $linkBayar,
        ]);

        if ($rendered) {
            $message = $rendered['body'];
        } else {
            $message = "Selamat, {$nama}!\n\n"
                . "Pendaftaran Anda di program *{$program}* berhasil.\n\n"
                . "*No. Registrasi:* {$noReg}\n"
                . "*Invoice:* {$noInvoice}\n\n"
                . "Silakan lakukan pembayaran melalui tautan berikut:\n"
                . "🔗 {$linkBayar}\n\n"
                . "Setelah transfer, upload bukti pembayaran di tautan tersebut agar segera diverifikasi.\n\n"
                . "- Sistem SIM Mendunia";
        }

        $sent = $this->sendMessage($noHp, $message);
        $this->logNotification($pendaftar->id ?? null, 'registration_success', $noHp, $message, $sent);
        return $sent;
    }

    /**
     * Kirim notifikasi pendaftaran baru ke nomor admin via WhatsApp
     * (nomor admin & teks dapat diatur dinamis lewat settings / template "admin_new_registration_wa")
     */
    public function sendNewRegistrationToAdmin($pendaftar, $affiliate = false)
    {
        $settingKey = 'wa_pendaftaran_baru';
        if (!\App\Models\NotificationSetting::isEnabled($settingKey)) {
            Log::info("Notifikasi {$settingKey} dinonaktifkan.");
            return false;
        }

        $adminPhones = $this->getAdminPhones('wa_pendaftaran_admin_phones');
        if (empty($adminPhones)) {
            Log::warning('Tidak ada nomor admin untuk notifikasi pendaftaran baru.');
            return false;
        }

        $nama = $pendaftar->nama;
        $program = $pendaftar->product?->nama ?? '-';
        $noReg = $pendaftar->no_registrasi ?? '-';
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        $konfirmasiUrl = $frontendUrl . '/checkout-berhasil/' . $pendaftar->token;
        $invoiceUrl = $frontendUrl . '/pendaftar/' . $pendaftar->id . '/invoice';
        $tanggal = now()->format('d F Y H:i');
        $label = $affiliate ? ' (via Affiliate)' : '';

        if (!$pendaftar->relationLoaded('batch')) {
            $pendaftar->load('batch');
        }
        $batchNama = $pendaftar->batch?->nama_batch ?? '-';

        $pendaftar->loadMissing('pembayaranItems');
        $totalTransfer = $pendaftar->pembayaranItems->first()?->total_transfer ?? $this->getTotalTagihan($pendaftar);

        $company = \App\Models\CompanyProfile::getProfile();
        $companyName = $company->company_name ?? 'MENDUNIA.ID';

        $rendered = \App\Models\NotificationTemplate::render('admin_new_registration_wa', [
            'nama' => $nama,
            'program' => $program,
            'batch' => $batchNama,
            'no_registrasi' => $noReg,
            'total_transfer' => number_format($totalTransfer, 0, ',', '.'),
            'tanggal' => $tanggal,
            'no_hp' => $pendaftar->telepon ?? '-',
            'konfirmasi_url' => $konfirmasiUrl,
            'invoice_url' => $invoiceUrl,
            'company_name' => $companyName,
            'label_affiliate' => $label,
        ]);

        if ($rendered) {
            $message = $rendered['body'];
        } else {
            $message = "📋 *NOTIFIKASI PENDAFTARAN BARU{$label}*\n\n"
                . "Halo Admin,\n\n"
                . "Ada pendaftar baru di *{$companyName}*.\n\n"
                . "👤 Nama: {$nama}\n"
                . "📚 Program: {$program} ({$batchNama})\n"
                . "🗂️ No. Registrasi: {$noReg}\n"
                . "💰 Total Transfer: Rp " . number_format($totalTransfer, 0, ',', '.') . "\n"
                . "📱 No. WhatsApp: {$pendaftar->telepon}\n"
                . "🕒 Waktu: {$tanggal}\n\n"
                . "🔗 Konfirmasi Pembayaran:\n{$konfirmasiUrl}\n\n"
                . "- Sistem SIM Mendunia";
        }

        $results = [];
        foreach ($adminPhones as $phone) {
            $sent = $this->sendMessage($phone, $message);
            $this->logNotification($pendaftar->id ?? null, 'registration_admin', $phone, $message, $sent);
            $results[] = $sent;
        }

        return in_array(true, $results);
    }

    /**
     * Kirim notifikasi ke admin follow up saat admin cabang mengatur/mengedit jadwal level.
     * Nomor tujuan memakai setting 'wa_pendaftaran_admin_phones', gating via toggle 'wa_jadwal_level'.
     */
    public function sendJadwalLevelToAdmin($jadwal, $isUpdate = false)
    {
        if (!\App\Models\NotificationSetting::isEnabled('wa_jadwal_level')) {
            Log::info("Notifikasi wa_jadwal_level dinonaktifkan.");
            return false;
        }

        $adminPhones = $this->getAdminPhones('wa_pendaftaran_admin_phones');
        if (empty($adminPhones)) {
            Log::warning('Tidak ada nomor admin follow up untuk notifikasi jadwal level.');
            return false;
        }

        $batch = $jadwal->batch;
        $batchNama = $batch?->nama_batch ?? '-';
        $cabangNama = $batch?->cabang?->nama_cabang ?? '-';
        $submittedBy = $jadwal->submittedBy?->name ?? '-';
        $action = $isUpdate ? 'diperbarui' : 'diatur';
        $mulai = $jadwal->tanggal_mulai?->format('d F Y') ?? '-';
        $selesai = $jadwal->tanggal_selesai?->format('d F Y') ?? '-';
        $waktu = now()->translatedFormat('d F Y H:i');

        $message = "📅 *NOTIFIKASI JADWAL LEVEL*\n\n"
            . "Halo Admin,\n\n"
            . "Jadwal *Level {$jadwal->level}* untuk batch *{$batchNama}* ({$cabangNama}) telah {$action} oleh *{$submittedBy}*.\n\n"
            . "📌 Level: Level {$jadwal->level}\n"
            . "🎓 Batch: {$batchNama}\n"
            . "🏢 Cabang: {$cabangNama}\n"
            . "🗓️ Tanggal Mulai: {$mulai}\n"
            . "🗓️ Tanggal Selesai: {$selesai}\n"
            . "⏰ Waktu: {$waktu}\n"
            . "📝 Status: Menunggu Approval\n\n"
            . "Silakan cek dan lakukan approval di panel admin.\n\n"
            . "- Sistem SIM Mendunia";

        $results = [];
        foreach ($adminPhones as $phone) {
            $sent = $this->sendMessage($phone, $message);
            $this->logNotification(null, 'jadwal_level', $phone, $message, $sent);
            $results[] = $sent;
        }

        return in_array(true, $results);
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
