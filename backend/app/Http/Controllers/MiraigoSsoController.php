<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Penerbit token SSO untuk sistem Miraigo.
 * Token ditandatangani HMAC-SHA256 memakai secret bersama (MIRAIGO_SSO_SECRET).
 */
class MiraigoSsoController extends Controller
{
    /**
     * POST /api/miraigo/sso — terbitkan token SSO untuk user yang sedang login.
     * Mengembalikan URL tujuan (redirect_url) yang membawa sso_token.
     */
    public function sso(Request $request)
    {
        $user = $request->user();
        if (!$user || $user->status !== 'AKTIF') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        $baseUrl = rtrim((string) config('services.miraigo.base_url'), '/');
        $secret  = (string) config('services.miraigo.sso_secret');
        $ttl     = (int) config('services.miraigo.token_ttl', 60);

        $now = time();
        $payload = [
            'sub'   => $user->id,
            'email' => $user->email,
            'name'  => $user->name,
            'role'  => $user->role,
            'iat'   => $now,
            'exp'   => $now + $ttl,
        ];

        $encoded = $this->base64UrlEncode(json_encode($payload));
        $signature = $this->base64UrlEncode(hash_hmac('sha256', $encoded, $secret, true));
        $token = $encoded . '.' . $signature;

        $target = $baseUrl . '/sso';

        return response()->json([
            'success' => true,
            'redirect_url' => $target . '?sso_token=' . urlencode($token),
            'expires_in' => $ttl,
        ]);
    }

    protected function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}