<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password; // <-- Pastikan yang ini yang di-import
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function edit()
    {
        $user = auth()->user();
        return view('absensi.profile.update', compact('user'));
    }

    public function update(Request $request)
    {
        $user = auth()->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'no_hp' => 'nullable|string|max:15',
            'alamat' => 'nullable|string|max:500',
            'foto_profil' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'password' => ['nullable', 'confirmed', \Illuminate\Validation\Rules\Password::min(8)],
        ], [
            'name.required' => 'Nama lengkap wajib diisi.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
            'password.min' => 'Password minimal harus 8 karakter.',
            'foto_profil.image' => 'File harus berupa gambar.',
            'foto_profil.max' => 'Ukuran foto maksimal 2MB.',
        ]);

        // Update Data
        $user->name = $request->name;
        $user->no_hp = $request->no_hp;
        $user->alamat = $request->alamat;

        // Password hanya diupdate jika diisi
        if ($request->filled('password')) {
            $user->password = \Illuminate\Support\Facades\Hash::make($request->password);
        }

        // 3. Logika Foto Profil (Simpan ke public/uploads/foto_profil)
        if ($request->hasFile('foto_profil')) {

            $folderPath = public_path('uploads/foto_profil');

            // Pastikan folder ada
            if (!file_exists($folderPath)) {
                mkdir($folderPath, 0777, true);
            }

            // Hapus foto lama jika ada
            if ($user->foto_profil && file_exists($folderPath . '/' . $user->foto_profil)) {
                unlink($folderPath . '/' . $user->foto_profil);
            }

            $file = $request->file('foto_profil');
            $namaFoto = time() . '_' . $user->id . '.' . $file->getClientOriginalExtension();

            // Pindahkan file ke folder baru
            $file->move($folderPath, $namaFoto);

            $user->foto_profil = $namaFoto;
        }


        $user->save();

        return redirect()->back()->with('success', 'Profil berhasil diperbarui!');
    }
}
