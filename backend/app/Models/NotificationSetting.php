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
     * Snapshot config mail apa adanya (dari .env) sebelum di-override DB.
     * Dipakai supaya field yang dikosongkan user benar-benar kembali ke
     * nilai .env, bukan tetap memakai nilai DB lama di request yang sama.
     */
    protected static ?array $pristineMail = null;

    /**
     * Terapkan konfigurasi SMTP dinamis dari database ke config mail.
     *
     * Dipanggil otomatis oleh middleware ApplyMailSettings pada setiap
     * request, jadi semua pengiriman email memakai nilai dari UI.
     * Nilai kosong pada DB berarti "pakai nilai bawaan .env".
     */
    public static function applyMailConfig(): void
    {
        try {
            if (static::$pristineMail === null) {
                static::$pristineMail = [
                    'default' => config('mail.default'),
                    'smtp' => config('mail.mailers.smtp'),
                    'from' => config('mail.from'),
                ];
            }

            // Selalu mulai dari kondisi bersih .env.
            config([
                'mail.default' => static::$pristineMail['default'],
                'mail.mailers.smtp' => static::$pristineMail['smtp'],
                'mail.from' => static::$pristineMail['from'],
            ]);

            $rows = static::whereIn('key', [
                'mail_mailer',
                'mail_host',
                'mail_port',
                'mail_username',
                'mail_password',
                'mail_encryption',
                'mail_from_address',
                'mail_from_name',
            ])->pluck('value', 'key');

            $val = function (string $key) use ($rows) {
                $v = $rows->get($key);
                return ($v === null || $v === '') ? null : $v;
            };

            if ($rows->filter(fn($v) => $v !== null && $v !== '')->isEmpty()) {
                return;
            }

            $mailer = $val('mail_mailer');
            $encryption = $val('mail_encryption');

            $config = [];

            if ($mailer !== null) {
                $config['mail.default'] = $mailer;
            }

            $host = $val('mail_host');
            if ($host !== null) {
                $config['mail.mailers.smtp.host'] = $host;
            }

            $port = $val('mail_port');
            if ($port !== null) {
                $config['mail.mailers.smtp.port'] = (int) $port;
            }

            $username = $val('mail_username');
            if ($username !== null) {
                $config['mail.mailers.smtp.username'] = $username;
            }

            $password = $val('mail_password');
            if ($password !== null) {
                $config['mail.mailers.smtp.password'] = $password;
            }

            // "none" berarti tanpa enkripsi (port 25 / relay internal),
            // bedakan dari kosong yang berarti "pakai .env".
            if ($encryption !== null) {
                $config['mail.mailers.smtp.encryption'] = strtolower($encryption) === 'none'
                    ? null
                    : $encryption;
            }

            $fromAddress = $val('mail_from_address');
            if ($fromAddress !== null) {
                $config['mail.from.address'] = $fromAddress;
            }

            $fromName = $val('mail_from_name');
            if ($fromName !== null) {
                $config['mail.from.name'] = $fromName;
            }

            // Mailer selain smtp (mis. "log") tetap butuh host/port default
            // yang valid agar tidak blowing up saat config di-resolve.
            if ($mailer !== null && $mailer !== 'smtp') {
                $config['mail.mailers.smtp.host'] ??= config('mail.mailers.smtp.host', 'smtp.gmail.com');
                $config['mail.mailers.smtp.port'] ??= (int) config('mail.mailers.smtp.port', 587);
            }

            config($config);

            app('mail.manager')->forgetMailers();
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Gagal memuat konfigurasi mail dinamis: ' . $e->getMessage());
        }
    }
}
