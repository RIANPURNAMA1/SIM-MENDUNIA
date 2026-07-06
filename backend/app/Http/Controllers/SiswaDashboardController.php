<?php

namespace App\Http\Controllers;

use App\Models\Batch;
use App\Models\Pendaftar;
use App\Models\Siswa;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class SiswaDashboardController extends Controller
{
    public function index()
    {
        $user = Auth::guard('sanctum')->user();

        $pendaftar = Pendaftar::with(['product'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->first();

        $siswa = Siswa::where('user_id', $user->id)->first();
        $batches = Batch::aktif()->orderBy('nama_batch')->get(['id', 'nama_batch']);

        return response()->json([
            'pendaftar' => $pendaftar,
            'user' => $user,
            'siswa' => $siswa,
            'batches' => $batches,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = Auth::guard('sanctum')->user();

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'no_hp' => 'nullable|string|max:20',
            'alamat' => 'nullable|string',
            'tempat_lahir' => 'nullable|string|max:255',
            'tanggal_lahir' => 'nullable|date',
            'jenis_kelamin' => 'nullable|in:L,P',
            'agama' => 'nullable|string|max:100',
            'nik' => 'nullable|string|max:50',
            'pendidikan_terakhir' => 'nullable|string|max:100',
            'foto_profil' => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
            'foto_ktp' => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
            'foto_ijazah' => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
            'foto_kk' => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
            'foto' => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
            'batch_id' => 'nullable|exists:batches,id',
        ]);

        // Update User fields
        $userData = $request->only([
            'name', 'no_hp', 'alamat', 'tempat_lahir',
            'tanggal_lahir', 'jenis_kelamin', 'agama', 'nik', 'pendidikan_terakhir'
        ]);
        $user->fill(array_filter($userData, fn($v) => $v !== null));

        // Handle file uploads to User
        $fileFields = ['foto_profil', 'foto_ktp', 'foto_ijazah', 'foto_kk'];
        foreach ($fileFields as $field) {
            if ($request->hasFile($field)) {
                $file = $request->file($field);
                $filename = time() . '_' . $field . '.' . $file->extension();
                $file->move(public_path('uploads/' . $field), $filename);
                $user->$field = 'uploads/' . $field . '/' . $filename;
            }
        }

        $user->save();

        // Update or create Siswa record
        $siswa = Siswa::firstOrNew(['user_id' => $user->id]);
        $siswa->nama = $user->name;

        if ($request->has('no_hp')) $siswa->no_hp = $request->no_hp;
        if ($request->has('alamat')) $siswa->alamat = $request->alamat;
        if ($request->has('tempat_lahir')) $siswa->tempat_lahir = $request->tempat_lahir;
        if ($request->has('tanggal_lahir')) $siswa->tanggal_lahir = $request->tanggal_lahir;
        if ($request->has('jenis_kelamin')) $siswa->jenis_kelamin = $request->jenis_kelamin;
        if ($request->has('agama')) $siswa->agama = $request->agama;
        if ($request->has('batch_id')) $siswa->batch_id = $request->batch_id;
        $siswa->status = $siswa->status ?? 'AKTIF';

        // Handle foto upload for Siswa
        if ($request->hasFile('foto')) {
            $file = $request->file('foto');
            $filename = time() . '_foto_siswa.' . $file->extension();
            $file->move(public_path('uploads/siswa'), $filename);
            $siswa->foto = 'uploads/siswa/' . $filename;
        }

        $siswa->save();

        return response()->json([
            'message' => 'Profil berhasil diperbarui',
            'user' => $user,
            'siswa' => $siswa,
        ]);
    }

    public function absensiSaya()
    {
        $user = Auth::guard('sanctum')->user();

        $siswa = Siswa::with(['shift', 'kelasRelasi', 'batchRelasi'])
            ->where('user_id', $user->id)
            ->first();

        if (!$siswa) {
            return response()->json([
                'message' => 'Data siswa tidak ditemukan',
            ], 404);
        }

        $riwayat = $siswa->absensi()
            ->whereBetween('tanggal', [Carbon::now()->subMonth(), Carbon::now()])
            ->orderBy('tanggal', 'desc')
            ->orderBy('jam_masuk', 'desc')
            ->get();

        return response()->json([
            'siswa' => $siswa,
            'riwayat' => $riwayat,
        ]);
    }
}
