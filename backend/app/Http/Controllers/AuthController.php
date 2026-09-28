<?php

namespace App\Http\Controllers;

use App\Mail\ResetPasswordMail;
use App\Models\User;
use App\Models\LoginLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;

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
     * Kirim link reset password ke email pengguna.
     * Tidak membocorkan apakah email terdaftar (selalu pesan sukses yang sama).
     */
    public function forgotPasswordApi(Request $request)
    {
        $request->validate([
            'email' => 'required|email|max:191',
        ]);

        $message = 'Jika email tersebut terdaftar, link reset password sudah kami kirim ke inbox Anda.';

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => $message]);
        }

        if (in_array($user->role, ['MANAGER', 'HR'])) {
            return response()->json([
                'message' => 'Akun Manager dan HR tidak dapat direset melalui fitur ini. Hubungi administrator.',
            ], 403);
        }

        $token = Password::broker()->createToken($user);

        $resetUrl = rtrim(config('app.frontend_url', config('app.url')), '/')
            . '/reset-password?token=' . $token
            . '&email=' . urlencode($user->email);

        try {
            Mail::to($user->email)->send(new ResetPasswordMail(
                nama: $user->name ?? 'Pengguna',
                resetUrl: $resetUrl,
                expireMinutes: (int) config('auth.passwords.users.expire', 60),
            ));
        } catch (\Throwable $e) {
            report($e);

            if (app()->environment('local')) {
                return response()->json([
                    'message' => $message,
                    'mail_error' => $e->getMessage(),
                    'dev_reset_url' => $resetUrl,
                ]);
            }

            return response()->json(['message' => 'Gagal mengirim email reset. Silakan coba lagi beberapa saat lagi.'], 500);
        }

        $payload = ['message' => $message];
        if (app()->environment('local')) {
            $payload['dev_reset_url'] = $resetUrl;
        }

        return response()->json($payload);
    }

    /**
     * Consume token reset link lalu simpan password baru.
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

        $status = Password::broker()->reset(
            credentials: $request->only('email', 'password', 'password_confirmation', 'token'),
            callback: function ($user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => \Illuminate\Support\Str::random(60),
                ])->save();

                if (method_exists($user, 'tokens')) {
                    $user->tokens()->delete();
                }

                event(new \Illuminate\Auth\Events\PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => match ($status) {
                    Password::INVALID_TOKEN => 'Link reset password sudah tidak berlaku. Silakan minta link baru.',
                    Password::INVALID_USER => 'Email tidak terdaftar.',
                    Password::RESET_THROTTLED => 'Terlalu banyak percobaan. Silakan coba lagi nanti.',
                    default => 'Gagal mereset password. Silakan minta link baru.',
                },
            ], 422);
        }

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
