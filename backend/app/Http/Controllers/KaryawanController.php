<?php

namespace App\Http\Controllers;

use App\Models\Cabang;
use App\Models\Divisi;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class KaryawanController extends Controller
{
    public function index(Request $request)
    {
        // 1. Hapus 'cabang' dari with()
        $query = User::with(['divisi', 'shift'])->whereIn('role', ['KARYAWAN', 'GURU']);

        // 2. Logika Filter Cabang (Gunakan whereJsonContains)
        if ($request->filled('cabang_id')) {
            $query->whereJsonContains('cabang_ids', $request->cabang_id);
        }

        // 3. Logika Filter Divisi
        if ($request->filled('divisi_id')) {
            $query->where('divisi_id', $request->divisi_id);
        }

        $karyawan = $query->latest()->get();

        $divisi = Divisi::orderBy('nama_divisi')->get();
        $cabang = Cabang::orderBy('nama_cabang')->get();
        $shifts = \App\Models\Shift::where('status', 'AKTIF')->get();

        return view('karyawan.index', compact('karyawan', 'divisi', 'cabang', 'shifts'));
    }



    public function store(Request $request)
    {
        // Ambil tahun masuk dari input
        $tahunMasuk = \Carbon\Carbon::parse($request->tanggal_masuk)->format('Y');

        // Cari NIP terakhir di tahun ini
        $lastNip = User::whereYear('tanggal_masuk', $tahunMasuk)
            ->orderBy('nip', 'desc')
            ->first();

        $urutan = $lastNip ? (int)substr($lastNip->nip, -4) + 1 : 1;

        // Buat NIP baru: YYYYXXXX
        $nipBaru = $tahunMasuk . str_pad($urutan, 4, '0', STR_PAD_LEFT);

        // Merge NIP ke request
        $request->merge(['nip' => $nipBaru]);

        $request->validate([
            // Identitas Utama
            'nik'               => 'required|string|size:16|unique:users,nik',
            'nip'               => 'required|string|max:50|unique:users,nip',
            'name'              => 'required|string|max:100',
            'email'             => 'required|email|unique:users,email',

            // Data Kepegawaian (DISESUAIKAN UNTUK MULTIPLE CABANG)
            'jabatan'           => 'nullable|string|max:100',
            'pendidikan_terakhir' => 'nullable|string',
            'divisi_id'         => 'nullable|exists:divisis,id',

            // Validasi Cabang sebagai Array
            'cabang_ids'        => 'required|array|min:1',
            'cabang_ids.*'      => 'exists:cabangs,id',

            // Multiple Shifts
            'shift_ids'        => 'nullable|array',
            'shift_ids.*'      => 'exists:shifts,id',

            'shift_id'          => 'nullable|exists:shifts,id',
            'tanggal_masuk'     => 'nullable|date',
            'status_kerja'      => 'nullable|in:TETAP,KONTRAK,MAGANG',

            // Kontak & Personal
            'no_hp'             => 'nullable|string|max:20',
            'alamat'            => 'nullable|string',
            'tempat_lahir'      => 'nullable|string|max:100',
            'tanggal_lahir'     => 'nullable|date',
            'jenis_kelamin'     => 'nullable|in:L,P',
            'agama'             => 'nullable|in:ISLAM,KRISTEN,KATOLIK,HINDU,BUDDHA,KONGHUCU',
            'status_pernikahan' => 'nullable|in:BELUM MENIKAH,MENIKAH,CERAI',

            // Upload Files & Foto
            'foto_profil'       => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'foto_ktp'          => 'nullable|file|mimes:jpg,jpeg,png,pdf,doc,docx|max:5120',
            'foto_ijazah'       => 'nullable|file|mimes:jpg,jpeg,png,pdf,doc,docx|max:5120',
            'foto_kk'           => 'nullable|file|mimes:jpg,jpeg,png,pdf,doc,docx|max:5120',
            'cv_file'           => 'nullable|file|mimes:pdf,doc,docx|max:5120',
            'sertifikat_file'   => 'nullable|file|mimes:pdf,doc,docx|max:5120',
        ]);

        // Upload semua file jika ada
        $fileFields = ['foto_profil', 'foto_ktp', 'foto_ijazah', 'foto_kk', 'cv_file', 'sertifikat_file'];
        $uploadedFiles = [];

        foreach ($fileFields as $field) {
            if ($request->hasFile($field)) {
                $file = $request->file($field);
                $namaFile = time() . '_' . $file->getClientOriginalName();
                $tujuanFolder = public_path('uploads/' . $field);
                if (!file_exists($tujuanFolder)) mkdir($tujuanFolder, 0755, true);
                $file->move($tujuanFolder, $namaFile);
                $uploadedFiles[$field] = $namaFile;
            } else {
                $uploadedFiles[$field] = null;
            }
        }

        // Simpan user karyawan
        $user = User::create(array_merge([
            'name'              => $request->name,
            'email'             => $request->email,
            'password'          => Hash::make('12345678'), // Password default
            'role'              => 'KARYAWAN',
            'status'            => 'AKTIF',

            'nik'               => $request->nik,
            'pendidikan_terakhir' => $request->pendidikan_terakhir,

            // Data Kepegawaian
            'nip'               => $nipBaru,
            'divisi_id'         => $request->divisi_id,

            // SIMPAN CABANG SEBAGAI ARRAY/JSON
            'cabang_ids'        => $request->cabang_ids,

            // Multiple Shifts
            'shift_ids'        => $request->shift_ids,

            'shift_id'          => $request->shift_id,
            'jabatan'           => $request->jabatan,
            'tanggal_masuk'     => $request->tanggal_masuk,
            'status_kerja'      => $request->status_kerja,

            // Data Personal & Kontak
            'no_hp'             => $request->no_hp,
            'alamat'            => $request->alamat,
            'tempat_lahir'      => $request->tempat_lahir,
            'tanggal_lahir'     => $request->tanggal_lahir,
            'jenis_kelamin'     => $request->jenis_kelamin,
            'agama'             => $request->agama,
            'status_pernikahan' => $request->status_pernikahan,
        ], $uploadedFiles));

        return response()->json([
            'status'  => true,
            'message' => 'Karyawan berhasil dibuat',
            'akun'    => [
                'email'    => $request->email,
                'password' => '12345678',
                'nip'      => $nipBaru
            ],
            'data' => $user
        ], 201);
    }

    // public function store(Request $request)
    // {
    //     // Ambil tahun masuk dari input
    //     $tahunMasuk = \Carbon\Carbon::parse($request->tanggal_masuk)->format('Y');

    //     // Cari NIP terakhir di tahun ini
    //     $lastNip = User::whereYear('tanggal_masuk', $tahunMasuk)
    //         ->orderBy('nip', 'desc')
    //         ->first();

    //     $urutan = $lastNip ? (int)substr($lastNip->nip, -4) + 1 : 1;

    //     // Buat NIP baru: YYYYXXXX
    //     $nipBaru = $tahunMasuk . str_pad($urutan, 4, '0', STR_PAD_LEFT);

    //     // Merge NIP ke request
    //     $request->merge(['nip' => $nipBaru]);

    //     $request->validate([
    //         // Identitas Utama (Tetap Required agar sistem tidak error)
    //         'nik'               => 'required|string|size:16|unique:users,nik',
    //         'nip'               => 'required|string|max:50|unique:users,nip',
    //         'name'              => 'required|string|max:100',
    //         'email'             => 'required|email|unique:users,email',

    //         // Data Kepegawaian (Dibuat nullable agar bisa dilengkapi nanti)
    //         'jabatan'           => 'nullable|string|max:100',
    //         'pendidikan_terakhir' => 'nullable|string',
    //         'divisi_id'         => 'nullable|exists:divisis,id',
    //         'cabang_id'         => 'nullable|exists:cabangs,id',
    //         'shift_id'          => 'nullable|exists:shifts,id',
    //         'tanggal_masuk'     => 'nullable|date',
    //         'status_kerja'      => 'nullable|in:TETAP,KONTRAK,MAGANG',

    //         // Kontak & Personal
    //         'no_hp'             => 'nullable|string|max:20',
    //         'alamat'            => 'nullable|string',
    //         'tempat_lahir'      => 'nullable|string|max:100',
    //         'tanggal_lahir'     => 'nullable|date',
    //         'jenis_kelamin'     => 'nullable|in:L,P',
    //         'agama'             => 'nullable|in:ISLAM,KRISTEN,KATOLIK,HINDU,BUDDHA,KONGHUCU',
    //         'status_pernikahan' => 'nullable|in:BELUM MENIKAH,MENIKAH,CERAI',

    //         // Upload Files & Foto (Tetap nullable)
    //         'foto_profil'       => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
    //         'foto_ktp'          => 'nullable|file|mimes:jpg,jpeg,png,pdf,doc,docx|max:5120',
    //         'foto_ijazah'       => 'nullable|file|mimes:jpg,jpeg,png,pdf,doc,docx|max:5120',
    //         'foto_kk'           => 'nullable|file|mimes:jpg,jpeg,png,pdf,doc,docx|max:5120',
    //         'cv_file'           => 'nullable|file|mimes:pdf,doc,docx|max:5120',
    //         'sertifikat_file'   => 'nullable|file|mimes:pdf,doc,docx|max:5120',
    //     ]);

    //     // Upload semua file jika ada
    //     $fileFields = [
    //         'foto_profil',
    //         'foto_ktp',
    //         'foto_ijazah',
    //         'foto_kk',
    //         'cv_file',
    //         'sertifikat_file'
    //     ];
    //     $uploadedFiles = [];

    //     foreach ($fileFields as $field) {
    //         if ($request->hasFile($field)) {
    //             $file = $request->file($field);
    //             $namaFile = time() . '_' . $file->getClientOriginalName();
    //             $tujuanFolder = public_path('uploads/' . $field);
    //             if (!file_exists($tujuanFolder)) mkdir($tujuanFolder, 0755, true);
    //             $file->move($tujuanFolder, $namaFile);
    //             $uploadedFiles[$field] = $namaFile;
    //         } else {
    //             $uploadedFiles[$field] = null;
    //         }
    //     }

    //     // Simpan user karyawan
    //     $user = User::create(array_merge([
    //         'name'              => $request->name,
    //         'email'             => $request->email,
    //         'password'          => Hash::make('12345678'), // Password default
    //         'role'              => 'KARYAWAN',
    //         'status'            => 'AKTIF',

    //         // Field Baru yang ditambahkan
    //         'nik'               => $request->nik,
    //         'pendidikan_terakhir' => $request->pendidikan_terakhir,

    //         // Data Kepegawaian
    //         'nip'               => $nipBaru, // Menggunakan variabel NIP yang sudah digenerate
    //         'divisi_id'         => $request->divisi_id,
    //         'cabang_id'         => $request->cabang_id,
    //         'shift_id'          => $request->shift_id,
    //         'jabatan'           => $request->jabatan,
    //         'tanggal_masuk'     => $request->tanggal_masuk,
    //         'status_kerja'      => $request->status_kerja,

    //         // Data Personal & Kontak
    //         'no_hp'             => $request->no_hp,
    //         'alamat'            => $request->alamat,
    //         'tempat_lahir'      => $request->tempat_lahir,
    //         'tanggal_lahir'     => $request->tanggal_lahir,
    //         'jenis_kelamin'     => $request->jenis_kelamin,
    //         'agama'             => $request->agama,
    //         'status_pernikahan' => $request->status_pernikahan,
    //     ], $uploadedFiles));

    //     return response()->json([
    //         'status'  => true,
    //         'message' => 'Karyawan berhasil dibuat',
    //         'akun'    => [
    //             'email'    => $request->email,
    //             'password' => '12345678',
    //             'nip'      => $nipBaru
    //         ],
    //         'data' => $user
    //     ], 201);
    // }



    // public function update(Request $request, $id)
    // {
    //     $user = User::findOrFail($id);

    //     // Validasi request
    //     $request->validate([
    //         'nik'                => 'required|string|size:16|unique:users,nik,' . $user->id,
    //         'nip'                => 'required|unique:users,nip,' . $user->id,
    //         'name'               => 'required|string|max:100',
    //         'email'              => 'required|email|unique:users,email,' . $user->id,
    //         'jabatan'            => 'required|string|max:100',
    //         'pendidikan_terakhir' => 'required|string', // Tambahan field pendidikan
    //         'divisi_id'          => 'required|exists:divisis,id',
    //         'cabang_id'          => 'required|exists:cabangs,id',
    //         'shift_id'           => 'required|exists:shifts,id',
    //         'no_hp'              => 'required|string|max:20',
    //         'alamat'             => 'nullable|string',
    //         'tanggal_masuk'      => 'required|date',
    //         'status_kerja'       => 'required|in:TETAP,KONTRAK,MAGANG',

    //         // File Validation
    //         'foto_profil'        => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
    //         'foto_ktp'           => 'nullable|file|mimes:jpg,jpeg,png,pdf,doc,docx|max:5120',
    //         'foto_ijazah'        => 'nullable|file|mimes:jpg,jpeg,png,pdf,doc,docx|max:5120',
    //         'foto_kk'            => 'nullable|file|mimes:jpg,jpeg,png,pdf,doc,docx|max:5120',
    //         'cv_file'            => 'nullable|file|mimes:pdf,doc,docx|max:5120',
    //         'sertifikat_file'    => 'nullable|file|mimes:pdf,doc,docx|max:5120',

    //         'tempat_lahir'       => 'nullable|string|max:100',
    //         'tanggal_lahir'      => 'nullable|date',
    //         'jenis_kelamin'      => 'nullable|in:L,P',
    //         'agama'              => 'nullable|in:ISLAM,KRISTEN,KATOLIK,HINDU,BUDDHA,KONGHUCU',
    //         'status_pernikahan'  => 'nullable|in:BELUM_MENIKAH,MENIKAH,CERAI',
    //     ]);

    //     // Array field file
    //     $fileFields = [
    //         'foto_profil',
    //         'foto_ktp',
    //         'foto_ijazah',
    //         'foto_kk',
    //         'cv_file',
    //         'sertifikat_file'
    //     ];
    //     $uploadedFiles = [];

    //     foreach ($fileFields as $field) {
    //         if ($request->hasFile($field)) {
    //             $file = $request->file($field);
    //             $namaFile = time() . '_' . $file->getClientOriginalName();
    //             $tujuanFolder = public_path('uploads/' . $field);

    //             // Pastikan folder ada
    //             if (!file_exists($tujuanFolder)) {
    //                 mkdir($tujuanFolder, 0755, true);
    //             }

    //             // Hapus file lama jika ada
    //             if ($user->$field && file_exists($tujuanFolder . '/' . $user->$field)) {
    //                 unlink($tujuanFolder . '/' . $user->$field);
    //             }

    //             // Pindahkan file baru
    //             $file->move($tujuanFolder, $namaFile);
    //             $uploadedFiles[$field] = $namaFile;
    //         } else {
    //             $uploadedFiles[$field] = $user->$field; // tetap pakai file lama jika tidak diupload
    //         }
    //     }

    //     // Update user
    //     $user->update(array_merge([
    //         'nik'               => $request->nik, // Tambahan pembaruan NIK
    //         'nip'               => $request->nip,
    //         'name'              => $request->name,
    //         'email'             => $request->email,
    //         'jabatan'           => $request->jabatan,
    //         'pendidikan_terakhir' => $request->pendidikan_terakhir, // Tambahan pembaruan Pendidikan
    //         'divisi_id'         => $request->divisi_id,
    //         'cabang_id'         => $request->cabang_id,
    //         'shift_id'          => $request->shift_id,
    //         'no_hp'             => $request->no_hp,
    //         'alamat'            => $request->alamat,
    //         'tanggal_masuk'     => $request->tanggal_masuk,
    //         'status_kerja'      => $request->status_kerja,
    //         'tempat_lahir'      => $request->tempat_lahir,
    //         'tanggal_lahir'     => $request->tanggal_lahir,
    //         'jenis_kelamin'     => $request->jenis_kelamin,
    //         'agama'             => $request->agama,
    //         'status_pernikahan' => $request->status_pernikahan,
    //     ], $uploadedFiles));

    //     return response()->json([
    //         'status'  => 'success',
    //         'message' => 'Data karyawan berhasil diperbarui',
    //         'data'    => $user
    //     ]);
    // }


    public function update(Request $request, $id)
{
    $user = User::findOrFail($id);

    // 1. Validasi request
    $request->validate([
        'nik'               => 'required|string|size:16|unique:users,nik,' . $user->id,
        'nip'               => 'required|unique:users,nip,' . $user->id,
        'name'              => 'required|string|max:100',
        'email'             => 'required|email|unique:users,email,' . $user->id,
        'jabatan'           => 'required|string|max:100',
        'pendidikan_terakhir' => 'required|string',
        'divisi_id'         => 'required|exists:divisis,id',
        
        // SESUAIKAN: Cabang sekarang harus array
        'cabang_ids'        => 'required|array|min:1',
        'cabang_ids.*'      => 'exists:cabangs,id',
        
        // Multiple Shifts
        'shift_ids'        => 'nullable|array',
        'shift_ids.*'      => 'exists:shifts,id',

        'shift_id'          => 'nullable|exists:shifts,id',
        'no_hp'             => 'required|string|max:20',
        'alamat'            => 'nullable|string',
        'tanggal_masuk'     => 'required|date',
        'status_kerja'      => 'required|in:TETAP,KONTRAK,MAGANG',

        // File Validation
        'foto_profil'       => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        'foto_ktp'          => 'nullable|file|mimes:jpg,jpeg,png,pdf,doc,docx|max:5120',
        'foto_ijazah'       => 'nullable|file|mimes:jpg,jpeg,png,pdf,doc,docx|max:5120',
        'foto_kk'           => 'nullable|file|mimes:jpg,jpeg,png,pdf,doc,docx|max:5120',
        'cv_file'           => 'nullable|file|mimes:pdf,doc,docx|max:5120',
        'sertifikat_file'   => 'nullable|file|mimes:pdf,doc,docx|max:5120',

        'tempat_lahir'      => 'nullable|string|max:100',
        'tanggal_lahir'     => 'nullable|date',
        'jenis_kelamin'     => 'nullable|in:L,P',
        'agama'             => 'nullable|in:ISLAM,KRISTEN,KATOLIK,HINDU,BUDDHA,KONGHUCU',
        'status_pernikahan' => 'nullable|in:BELUM MENIKAH,MENIKAH,CERAI',
    ]);
    
    // 2. Olah File Upload
    $fileFields = ['foto_profil', 'foto_ktp', 'foto_ijazah', 'foto_kk', 'cv_file', 'sertifikat_file'];
    $uploadedFiles = [];

    foreach ($fileFields as $field) {
        if ($request->hasFile($field)) {
            $file = $request->file($field);
            $namaFile = time() . '_' . $field . '_' . str_replace(' ', '_', $file->getClientOriginalName());
            $tujuanFolder = public_path('uploads/' . $field);

            // Buat folder jika belum ada
            if (!file_exists($tujuanFolder)) {
                mkdir($tujuanFolder, 0755, true);
            }

            // Hapus file lama jika ada dan bukan null
            if ($user->$field && file_exists($tujuanFolder . '/' . $user->$field)) {
                unlink($tujuanFolder . '/' . $user->$field);
            }

            // Upload file baru
            $file->move($tujuanFolder, $namaFile);
            $uploadedFiles[$field] = $namaFile;
        } else {
            // Jika tidak upload baru, tetap gunakan file lama
            $uploadedFiles[$field] = $user->$field;
        }
    }

    // 3. Update Data ke Database
    $user->update(array_merge([
        'nik'               => $request->nik,
        'nip'               => $request->nip,
        'name'              => $request->name,
        'email'             => $request->email,
        'jabatan'           => $request->jabatan,
        'pendidikan_terakhir' => $request->pendidikan_terakhir,
        'divisi_id'         => $request->divisi_id,
        
        // SESUAIKAN: Update kolom cabang_ids (Array otomatis jadi JSON karena casts di Model)
            'cabang_ids'        => $request->cabang_ids, 
            
            // Multiple Shifts
            'shift_ids'        => $request->shift_ids,

            'shift_id'          => $request->shift_id,
            'no_hp'             => $request->no_hp,
            'alamat'            => $request->alamat,
            'tanggal_masuk'     => $request->tanggal_masuk,
            'status_kerja'      => $request->status_kerja,
            'tempat_lahir'      => $request->tempat_lahir,
            'tanggal_lahir'     => $request->tanggal_lahir,
            'jenis_kelamin'     => $request->jenis_kelamin,
            'agama'             => $request->agama,
            'status_pernikahan' => $request->status_pernikahan,
            'can_access_khusus' => $request->boolean('can_access_khusus'),
        ], $uploadedFiles));

        return response()->json([
            'status'  => 'success',
            'message' => 'Data karyawan berhasil diperbarui',
            'data'    => $user
        ]);
    }

    public function toggleKhusus($id)
    {
        $user = User::findOrFail($id);
        $user->can_access_khusus = !$user->can_access_khusus;
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => $user->can_access_khusus ? 'Akses absen khusus diaktifkan' : 'Akses absen khusus dinonaktifkan',
            'can_access_khusus' => $user->can_access_khusus,
        ]);
    }

    public function toggleStatus($id)
    {
        $user = User::findOrFail($id);
        $user->status = $user->status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Status karyawan berhasil diubah menjadi ' . $user->status,
            'user_status' => $user->status,
        ]);
    }


    public function show($id)
    {
        $karyawan = User::with(['divisi', 'shift'])->findOrFail($id);
        
        // Ambil multiple shifts jika ada
        $shifts = collect();
        if ($karyawan->shift_ids && is_array($karyawan->shift_ids) && count($karyawan->shift_ids) > 0) {
            $shifts = \App\Models\Shift::whereIn('id', $karyawan->shift_ids)->get();
        } elseif ($karyawan->shift) {
            $shifts = collect([$karyawan->shift]);
        }
        
        return view('karyawan.detail', compact('karyawan', 'shifts'));
    }

    // ===== API METHODS =====

    public function apiIndex(Request $request)
    {
        // 1. Kembalikan ke semula, JANGAN pakai 'cabang' di sini
        $query = User::with(['divisi', 'shift'])
            ->whereIn('role', ['KARYAWAN', 'GURU']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('nip', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('jabatan', 'like', "%{$search}%");
            });
        }

        if ($request->filled('cabang_id')) {
            $query->whereJsonContains('cabang_ids', $request->cabang_id);
        }

        if ($request->filled('divisi_id')) {
            $query->where('divisi_id', $request->divisi_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $perPage = $request->per_page ?? 20;
        $karyawan = $query->latest()->paginate($perPage);

        // 2. PERBAIKAN DI SINI: Kita map datanya untuk menempelkan array cabang secara manual ke JSON
        $data_karyawan = collect($karyawan->items())->map(function ($user) {
            // Jika Anda sudah punya fungsi getCabangAttribute() di Model User:
            $user->append('cabang'); 
            
            // JIKA CARA APPEND DI ATAS TIDAK JALAN, HAPUS BARIS APPEND DI ATAS DAN GUNAKAN CARA MANUAL INI:
            // $user->cabang = \App\Models\Cabang::whereIn('id', $user->cabang_ids ?? [])->get();
            
            return $user;
        });

        return response()->json([
            'status' => 'success',
            // 3. Pastikan kita mengirim data hasil map yang baru
            'data' => $data_karyawan,
            'pagination' => [
                'current_page' => $karyawan->currentPage(),
                'last_page' => $karyawan->lastPage(),
                'per_page' => $karyawan->perPage(),
                'total' => $karyawan->total(),
            ],
        ]);
    }

    public function apiShow($id)
    {
        $karyawan = User::with(['divisi', 'shift'])->findOrFail($id);

        $cabang = collect();
        if ($karyawan->cabang_ids && is_array($karyawan->cabang_ids)) {
            $cabang = \App\Models\Cabang::whereIn('id', $karyawan->cabang_ids)->get();
        }

        $shifts = collect();
        if ($karyawan->shift_ids && is_array($karyawan->shift_ids) && count($karyawan->shift_ids) > 0) {
            $shifts = \App\Models\Shift::whereIn('id', $karyawan->shift_ids)->get();
        } elseif ($karyawan->shift) {
            $shifts = collect([$karyawan->shift]);
        }

        return response()->json([
            'status' => 'success',
            'data' => $karyawan,
            'cabang' => $cabang,
            'shifts' => $shifts,
        ]);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);

        if (in_array(strtoupper($user->role), ['MANAGER', 'HR'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'User dengan role MANAGER atau HR tidak bisa dihapus!'
            ], 403);
        }

        if ($user->foto_profil && file_exists(public_path('foto-karyawan/' . $user->foto_profil))) {
            unlink(public_path('foto-karyawan/' . $user->foto_profil));
        }

        $user->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Data karyawan berhasil dihapus'
        ]);
    }
}
