<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

class AuthController extends Controller
{
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
            'KARYAWAN', 'SISWA', 'GURU' => route('absensi.index'),
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
            'role' => 'required|in:HR,MANAGER,KARYAWAN,SISWA',
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
}
