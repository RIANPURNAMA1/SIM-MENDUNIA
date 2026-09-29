<?php

namespace App\Http\Middleware;

use App\Models\NotificationSetting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApplyMailSettings
{
    /**
     * Terapkan konfigurasi SMTP dari database ke config mail SEBELUM request
     * diproses, sehingga semua pengiriman email (notifikasi, tagihan, OTP
     * reset password, dll) memakai pengaturan yang disimpan di UI, bukan .env.
     */
    public function handle(Request $request, Closure $next): Response
    {
        NotificationSetting::applyMailConfig();

        return $next($request);
    }
}
