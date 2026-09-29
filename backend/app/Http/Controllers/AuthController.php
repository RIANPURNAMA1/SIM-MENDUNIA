<?php

namespace App\Http\Controllers;

use App\Mail\ResetPasswordOtpMail;
use App\Models\PasswordResetOtp;
use App\Models\User;
use App\Models\LoginLog;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    // ========== API Sanctum ==========

    public function loginForm()
    {
        return view('Auth.login');
    }

    public function registerForm()
    {
        return view('Auth.register');
    }

   
   // Tampilkan form lupa password
    public function show()
    {
        return view('Auth.forgot-password');
    }

    // Reset password langsung
    public function reset(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'password' => 'required|min:6|confirmed',
        ]);

        $user = User::where('email', $request->email)->first();
        $user->password = Hash::make($request->password);
        $user->save();

        return redirect()->route('login')->with('status', 'Password berhasil diubah. Silakan login.');
    }



    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required',
            'password' => 'required'
        ]);

        // Cari user by email atau name
        $user = User::where('email', $request->email)
            ->orWhere('name', $request->email)
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email/Nama atau password salah'
            ], 401);
        }

        if ($user->status !== 'AKTIF') {
            return response()->json([
                'message' => 'Akun tidak aktif'
            ], 403);
        }

        Auth::login($user, true);

        $user->update(['last_login' => now()]);

        $redirect = match ($user->role) {
            'HR', 'MANAGER' => route('dashboard'),
            'ACCOUNTING'    => route('dashboard'),
            'KARYAWAN', 'KANDIDAT', 'GURU' => route('absensi.index'),
            default         => route('login')
        };

        return response()->json([
            'message'  => 'Login berhasil',
            'redirect' => $redirect
        ]);
    }


    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6|confirmed',
            'role' => 'required|in:HR,MANAGER,KARYAWAN,KANDIDAT,ACCOUNTING',
            'cabang_id' => 'nullable|integer'
        ]);

        User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => $data['role'],
            'cabang_id' => $data['cabang_id'],
            'status' => 'AKTIF'
        ]);

        return redirect()->route('login')->with('success', 'Registrasi berhasil');
    }

    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'status' => true,
            'message' => 'Logout berhasil',
            'redirect' => route('login')
        ]);
    }

    // ========== API Sanctum ==========

    public function loginApi(Request $request)
    {
        $request->validate([
            'email'    => 'required',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)
            ->orWhere('name', $request->email)
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email/Nama atau password salah'
            ], 401);
        }

        if ($user->status !== 'AKTIF') {
            return response()->json([
                'message' => 'Akun tidak aktif'
            ], 403);
        }

        Auth::login($user, true);
        $user->update(['last_login' => now()]);

        $ua = $request->userAgent() ?? '';
        $browser = 'Unknown';
        $platform = 'Unknown';
        if (preg_match('/(Chrome|Firefox|Safari|Edge|Opera|Brave)\b/i', $ua, $m)) $browser = $m[1];
        if (preg_match('/\b(Windows|Mac|Linux|Android|iOS|iPhone|iPad)\b/i', $ua, $m)) $platform = $m[1];

        LoginLog::create([
            'user_id'   => $user->id,
            'ip_address'=> $request->ip(),
            'user_agent'=> $ua,
            'browser'   => $browser,
            'platform'  => $platform,
            'login_at'  => now(),
        ]);

        return response()->json([
            'message' => 'Login berhasil',
            'user'    => $user,
        ]);
    }

    public function registerApi(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:100',
            'email'    => 'required|email|unique:users',
            'password' => 'required|min:6|confirmed',
            'role'     => 'required|in:HR,MANAGER,KARYAWAN,KANDIDAT',
            'cabang_id'=> 'nullable|integer',
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'role'     => $data['role'],
            'cabang_id'=> $data['cabang_id'],
            'status'   => 'AKTIF',
        ]);

        Auth::login($user, true);

        return response()->json([
            'message' => 'Registrasi berhasil',
            'user'    => $user,
        ], 201);
    }

    /**
     * Kirim kode OTP 6 digit ke email pengguna (langkah 1).
     * Tidak membocorkan apakah email terdaftar (selalu pesan sukses yang sama).
     */
    public function forgotPasswordApi(Request $request)
    {
        $request->validate([
            'email' => 'required|email|max:191',
        ]);

        $message = 'Jika email tersebut terdaftar, kode OTP reset password sudah kami kirim ke inbox Anda.';
        $expireMinutes = 10;
        $cooldownSeconds = 60;

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => $message]);
        }

        if (in_array($user->role, ['MANAGER', 'HR'])) {
            return response()->json([
                'message' => 'Akun Manager dan HR tidak dapat direset melalui fitur ini. Hubungi administrator.',
            ], 403);
        }

        $last = PasswordResetOtp::where('email', $user->email)->latest()->first();
        if ($last && $last->created_at && $last->created_at->addSeconds($cooldownSeconds)->isFuture()) {
            $wait = max(1, (int) ceil(now()->diffInSeconds($last->created_at->addSeconds($cooldownSeconds))));

            $payload = ['message' => $message, 'cooldown' => $wait];
            if (app()->environment('local')) {
                $payload['dev_code'] = 'throttled';
            }

            return response()->json($payload, 429);
        }

        $code = (string) random_int(100000, 999999);

        PasswordResetOtp::where('email', $user->email)->delete();

        PasswordResetOtp::create([
            'email' => $user->email,
            'code_hash' => Hash::make($code),
            'attempts' => 0,
            'expires_at' => now()->addMinutes($expireMinutes),
        ]);

        $resetUrl = rtrim(config('app.frontend_url', config('app.url')), '/')
            . '/reset-password?email=' . urlencode($user->email)
            . '&code=' . $code;

        try {
            Mail::to($user->email)->send(new ResetPasswordOtpMail(
                nama: $user->name ?? 'Pengguna',
                code: $code,
                expireMinutes: $expireMinutes,
                link: $resetUrl,
            ));
        } catch (\Throwable $e) {
            report($e);
            PasswordResetOtp::where('email', $user->email)->delete();

            if (app()->environment('local')) {
                return response()->json([
                    'message' => $message,
                    'mail_error' => $e->getMessage(),
                    'dev_code' => $code,
                ]);
            }

            return response()->json(['message' => 'Gagal mengirim email OTP. Silakan coba lagi beberapa saat lagi.'], 500);
        }

        $payload = ['message' => $message, 'expire_minutes' => $expireMinutes];
        if (app()->environment('local')) {
            $payload['dev_code'] = $code;
            $payload['dev_reset_url'] = $resetUrl;
        }

        return response()->json($payload);
    }

    /**
     * Verifikasi kode OTP -> terbitkan token reset sementara (langkah 2).
     */
    public function verifyOtpApi(Request $request)
    {
        $request->validate([
            'email' => 'required|email|max:191',
            'code' => 'required|digits:6',
        ]);

        $otp = PasswordResetOtp::where('email', $request->email)
            ->whereNull('verified_at')
            ->latest()
            ->first();

        if (!$otp) {
            return response()->json(['message' => 'Kode OTP tidak ditemukan. Silakan minta kode baru.'], 422);
        }

        if ($otp->expires_at && $otp->expires_at->isPast()) {
            return response()->json(['message' => 'Kode OTP sudah kedaluwarsa. Silakan minta kode baru.'], 422);
        }

        if ($otp->attempts >= 5) {
            return response()->json(['message' => 'Terlalu banyak percobaan kode. Silakan minta kode baru.'], 422);
        }

        if (!Hash::check($request->code, $otp->code_hash)) {
            $otp->increment('attempts');

            return response()->json([
                'message' => 'Kode OTP salah. Periksa kembali kode yang Anda terima.',
                'attempts_left' => max(0, 5 - $otp->fresh()->attempts),
            ], 422);
        }

        $token = Str::random(64);
        $otp->update([
            'verified_at' => now(),
            'verified_token' => $token,
            'expires_at' => now()->addMinutes(15),
        ]);

        return response()->json([
            'message' => 'Kode OTP benar. Silakan buat password baru.',
            'token' => $token,
        ]);
    }

    /**
     * Konsumsi token hasil verifikasi OTP lalu simpan password baru (langkah 3).
     */
    public function resetPasswordApi(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => ['required', 'confirmed', 'min:8', 'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).+$/'],
        ], [
            'password.regex' => 'Password harus mengandung minimal satu huruf kecil, satu huruf besar, satu angka, dan satu simbol (! @ # $ % ^ & *)',
        ]);

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['message' => 'Email tidak terdaftar.'], 404);
        }

        if (in_array($user->role, ['MANAGER', 'HR'])) {
            return response()->json([
                'message' => 'Akun Manager dan HR tidak dapat direset melalui fitur ini. Hubungi administrator.',
            ], 403);
        }

        $otp = PasswordResetOtp::where('email', $user->email)
            ->where('verified_token', $request->token)
            ->whereNotNull('verified_at')
            ->latest()
            ->first();

        if (!$otp) {
            return response()->json([
                'message' => 'Sesi reset tidak berlaku. Silakan minta kode OTP baru.',
            ], 422);
        }

        if ($otp->expires_at && $otp->expires_at->isPast()) {
            $otp->delete();

            return response()->json([
                'message' => 'Sesi reset sudah kedaluwarsa. Silakan minta kode OTP baru.',
            ], 422);
        }

        $user->forceFill([
            'password' => Hash::make($request->password),
            'remember_token' => Str::random(60),
        ])->save();

        if (method_exists($user, 'tokens')) {
            $user->tokens()->delete();
        }

        event(new PasswordReset($user));

        $otp->delete();

        return response()->json([
            'message' => 'Password berhasil diubah. Silakan login dengan password baru Anda.',
        ]);
    }

    public function logoutApi(Request $request)
    {
        $user = $request->user() ?? Auth::user();
        if ($user) {
            $user->setRememberToken(null);
            $user->save();
            if (method_exists($user, 'tokens')) {
                $user->tokens()->delete();
            }
        }

        try {
            Auth::guard('web')->logout();
        } catch (\Throwable $e) {}

        try {
            Auth::logout();
        } catch (\Throwable $e) {}

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        $cookieName = config('session.cookie', 'laravel_session');
        $recallerName = Auth::guard('web')->getRecallerName();

        return response()->json([
            'message' => 'Logout berhasil',
        ])
        ->withCookie(cookie()->forget($cookieName))
        ->withCookie(cookie()->forget('XSRF-TOKEN'))
        ->withCookie(cookie()->forget($recallerName));
    }

    public function userApi(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        return response()->json($user);
    }

    public function registerAffiliate(Request $request)
    {
        $data = $request->validate([
            'name'          => 'required|string|max:100',
            'email'         => 'required|email|unique:users',
            'password'      => 'required|min:6',
            'telepon'       => 'nullable|string|max:20',
            'alamat'        => 'nullable|string',
            'provinsi'      => 'nullable|string|max:100',
            'kabupaten'     => 'nullable|string|max:100',
            'kecamatan'     => 'nullable|string|max:100',
            'desa'          => 'nullable|string|max:100',
            'nama_rekening' => 'nullable|string|max:100',
            'no_rekening'   => 'nullable|string|max:30',
            'bank'          => 'nullable|string|max:50',
        ]);

        $user = User::create([
            'name'          => $data['name'],
            'email'         => $data['email'],
            'password'      => Hash::make($data['password']),
            'role'          => 'AFFILIATE',
            'status'        => 'AKTIF',
            'no_hp'         => $data['telepon'] ?? null,
            'alamat'        => $data['alamat'] ?? null,
            'provinsi'      => $data['provinsi'] ?? null,
            'kabupaten'     => $data['kabupaten'] ?? null,
            'kecamatan'     => $data['kecamatan'] ?? null,
            'desa'          => $data['desa'] ?? null,
            'nama_rekening' => $data['nama_rekening'] ?? null,
            'no_rekening'   => $data['no_rekening'] ?? null,
            'bank'          => $data['bank'] ?? null,
        ]);

        Auth::login($user, true);

        return response()->json([
            'message' => 'Pendaftaran affiliate berhasil',
            'user'    => $user,
        ], 201);
    }
}
