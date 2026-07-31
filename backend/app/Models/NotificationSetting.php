<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationSetting extends Model
{
    protected $fillable = [
        'key',
        'is_enabled',
        'description',
        'value',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
    ];

    /**
     * Cek apakah notifikasi tertentu aktif
     */
    public static function isEnabled($key)
    {
        $setting = self::where('key', $key)->first();
        return $setting ? $setting->is_enabled : true;
    }

    /**
     * Ambil value dari setting tertentu
     */
    public static function getValue($key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    /**
     * Terapkan konfigurasi SMTP dinamis dari database ke config mail.
     * Harus dipanggil sebelum pengiriman email pertama pada request/process.
     */
    public static function applyMailConfig(): void
    {
        try {
            $get = fn($key, $default = null) => static::getValue($key, $default);

            $host = $get('mail_host');
            $username = $get('mail_username');
            $password = $get('mail_password');
            $encryption = $get('mail_encryption');
            $fromAddress = $get('mail_from_address');
            $mailer = $get('mail_mailer');

            if ($host === null && $username === null && $password === null && $encryption === null && $fromAddress === null && $mailer === null) {
                return;
            }

            config([
                'mail.default' => $mailer ?? config('mail.default', 'smtp'),
                'mail.mailers.smtp.host' => $host ?? config('mail.mailers.smtp.host', 'smtp.gmail.com'),
                'mail.mailers.smtp.port' => (int) ($get('mail_port') ?? config('mail.mailers.smtp.port', 587)),
                'mail.mailers.smtp.username' => $username ?? config('mail.mailers.smtp.username'),
                'mail.mailers.smtp.password' => $password ?? config('mail.mailers.smtp.password'),
                'mail.mailers.smtp.encryption' => $encryption ?? config('mail.mailers.smtp.encryption', 'tls'),
                'mail.from.address' => $fromAddress ?? config('mail.from.address'),
                'mail.from.name' => $get('mail_from_name') ?? config('mail.from.name'),
            ]);

            app('mail.manager')->forgetMailers();
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Gagal memuat konfigurasi mail dinamis: ' . $e->getMessage());
        }
    }
}
