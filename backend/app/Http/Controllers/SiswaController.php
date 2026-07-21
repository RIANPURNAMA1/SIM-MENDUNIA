<?php

namespace App\Http\Controllers;

use App\Models\Kelas;
use App\Models\KelasSensei;
use App\Models\Siswa;
use App\Models\Shift;
use App\Models\User;
use App\Services\GroqService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SiswaController extends Controller
{
    public function index(Request $request)
    {
        $query = Siswa::query();

        if ($request->filled('kelas_id')) {
            $query->where('kelas_id', $request->kelas_id);
        }

        if ($request->filled('batch_id')) {
            $query->where('batch_id', $request->batch_id);
        }

        if ($request->filled('level')) {
            $query->where('level', $request->level);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('nama', 'like', '%' . $request->search . '%');
            });
        }

        $siswa = $query->with(['shift', 'kelasRelasi', 'batchRelasi'])->latest()->get();
        $kelasList = Kelas::aktif()->get();
        $batchList = \App\Models\Batch::aktif()->get();
        $shifts = Shift::aktif()->get();
        return view('siswa.index', compact('siswa', 'kelasList', 'batchList', 'shifts'));
    }

    public function apiIndex(Request $request)
    {
        $query = Siswa::query();

        if ($request->filled('kelas_id')) $query->where('kelas_id', $request->kelas_id);
        if ($request->filled('batch_id')) $query->where('batch_id', $request->batch_id);
        if ($request->filled('level')) $query->where('level', $request->level);
        if ($request->filled('status')) $query->where('status', $request->status);
        if ($request->filled('search')) $query->where('nama', 'like', '%' . $request->search . '%');

        $siswa = $query->with(['shift', 'kelasRelasi', 'batchRelasi'])->latest()->get();

        $senseiByBatch = KelasSensei::select('batch_id', 'level')
            ->distinct()
            ->get()
            ->groupBy('batch_id');

        $siswa->each(function ($s) use ($senseiByBatch) {
            $levels = [];
            for ($i = 1; $i <= 4; $i++) {
                $levels["level_{$i}"] = '-';
            }
            $batchSensei = $senseiByBatch->get($s->batch_id);
            if ($batchSensei) {
                $available = $batchSensei->pluck('level')->toArray();
                for ($i = 1; $i <= 4; $i++) {
                    if (in_array($i, $available)) {
                        $levels["level_{$i}"] = 'Active';
                    }
                }
            }
            $stored = $s->level_status ?? [];
            foreach ($stored as $key => $val) {
                if (in_array($key, ['level_1','level_2','level_3','level_4'])) {
                    $levels[$key] = $val;
                }
            }
            $s->level_status = $levels;
        });

        return response()->json([
            'success' => true,
            'data' => $siswa,
            'kelas_list' => Kelas::aktif()->get(),
            'batch_list' => \App\Models\Batch::aktif()->get(),
            'shifts' => Shift::aktif()->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'kelas_id' => 'nullable|exists:kelas,id',
            'batch_id' => 'nullable|exists:batches,id',
            'shift_id' => 'nullable|exists:shifts,id',
            'level' => 'nullable|integer|min:0|max:9999',
            'jenis_kelamin' => 'nullable|in:L,P',
            'tempat_lahir' => 'nullable|string|max:100',
            'tanggal_lahir' => 'nullable|date',
            'agama' => 'nullable|string|max:50',
            'alamat' => 'nullable|string',
            'no_hp' => 'nullable|string|max:20',
            'foto' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $foto = null;
        if ($request->hasFile('foto')) {
            $file = $request->file('foto');
            $foto = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/siswa'), $foto);
        }

        $kelasNama = $request->kelas_id ? \App\Models\Kelas::find($request->kelas_id)?->nama_kelas : '-';
        $batchNama = $request->batch_id ? \App\Models\Batch::find($request->batch_id)?->nama_batch : null;

        $siswa = Siswa::create([
            'nama' => $request->nama,
            'kelas_id' => $request->kelas_id,
            'kelas' => $kelasNama,
            'batch_id' => $request->batch_id,
            'batch' => $batchNama,
            'shift_id' => $request->shift_id,
            'level' => $request->level,
            'jenis_kelamin' => $request->jenis_kelamin,
            'tempat_lahir' => $request->tempat_lahir,
            'tanggal_lahir' => $request->tanggal_lahir,
            'agama' => $request->agama,
            'alamat' => $request->alamat,
            'no_hp' => $request->no_hp,
            'foto' => $foto,
            'status' => 'AKTIF',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Data siswa berhasil ditambahkan',
            'data' => $siswa,
        ]);
    }

    public function update(Request $request, $id)
    {
        $siswa = Siswa::findOrFail($id);

        $request->validate([
            'nama' => 'required|string|max:255',
            'kelas_id' => 'nullable|exists:kelas,id',
            'shift_id' => 'nullable|exists:shifts,id',
            'level' => 'nullable|integer|min:0|max:9999',
            'jenis_kelamin' => 'nullable|in:L,P',
            'tempat_lahir' => 'nullable|string|max:100',
            'tanggal_lahir' => 'nullable|date',
            'agama' => 'nullable|string|max:50',
            'alamat' => 'nullable|string',
            'no_hp' => 'nullable|string|max:20',
            'foto' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $data = $request->except('foto');

        if ($request->hasFile('foto')) {
            if ($siswa->foto && file_exists(public_path('uploads/siswa/' . $siswa->foto))) {
                unlink(public_path('uploads/siswa/' . $siswa->foto));
            }
            $file = $request->file('foto');
            $foto = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/siswa'), $foto);
            $data['foto'] = $foto;
        }

        $siswa->update($data);

        return response()->json([
            'status' => 'success',
            'message' => 'Data siswa berhasil diperbarui',
            'data' => $siswa,
        ]);
    }

    public function destroy($id)
    {
        $siswa = Siswa::findOrFail($id);

        if ($siswa->foto && file_exists(public_path('uploads/siswa/' . $siswa->foto))) {
            unlink(public_path('uploads/siswa/' . $siswa->foto));
        }

        $siswa->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Data siswa berhasil dihapus',
        ]);
    }

    public function toggleStatus($id)
    {
        $siswa = Siswa::findOrFail($id);
        $siswa->status = $siswa->status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
        $siswa->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Status siswa berhasil diubah menjadi ' . $siswa->status,
        ]);
    }

    public function importAi(Request $request, GroqService $groq)
    {
        $request->validate([
            'text' => 'required|string|min:3',
            'batch_id' => 'nullable|exists:batches,id',
            'level' => 'nullable|integer|min:0|max:9999',
            'kelas_id' => 'nullable|exists:kelas,id',
        ]);

        $pastedText = $request->input('text');
        $batchId = $request->input('batch_id');
        $level = $request->input('level');
        $kelasId = $request->input('kelas_id');

        $messages = [
            [
                'role' => 'system',
                'content' => 'Extract student names from the text below. Return ONLY a JSON array of strings like ["Name 1", "Name 2"]. No explanation, no markdown, just the JSON array.',
            ],
            [
                'role' => 'user',
                'content' => $pastedText,
            ],
        ];

        $response = $groq->chat($messages, 0.3, 1024);

        $names = [];
        if (preg_match('/\[.*?\]/s', $response, $matches)) {
            $names = json_decode($matches[0], true);
        }

        if (empty($names) || !is_array($names)) {
            $lines = array_filter(explode("\n", str_replace("\r\n", "\n", $pastedText)));
            $names = array_values(array_filter(array_map('trim', $lines)));
        }

        if (empty($names)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengekstrak nama dari teks yang diberikan',
            ], 422);
        }

        $imported = 0;
        $errors = [];

        foreach ($names as $nama) {
            $nama = trim($nama);
            if (empty($nama)) continue;

            $slug = Str::slug($nama, '');
            $email = $slug . '@mendunia.id';

            $counter = 1;
            $originalEmail = $email;
            while (User::where('email', $email)->exists()) {
                $email = $counter . '-' . $originalEmail;
                $counter++;
            }

            try {
                $user = User::create([
                    'name' => $nama,
                    'email' => $email,
                    'password' => Hash::make($nama),
                    'role' => 'KANDIDAT',
                    'status' => 'AKTIF',
                ]);

                $kelasNama = $kelasId ? \App\Models\Kelas::find($kelasId)?->nama_kelas : '-';
                $batchNama = $batchId ? \App\Models\Batch::find($batchId)?->nama_batch : null;

                Siswa::create([
                    'user_id' => $user->id,
                    'nama' => $nama,
                    'kelas_id' => $kelasId,
                    'kelas' => $kelasNama,
                    'batch_id' => $batchId,
                    'batch' => $batchNama,
                    'level' => $level,
                    'status' => 'AKTIF',
                ]);

                $imported++;
            } catch (\Exception $e) {
                $errors[] = "Gagal '{$nama}': " . $e->getMessage();
            }
        }

        if ($imported === 0) {
            return response()->json([
                'status' => 'error',
                'message' => "Import gagal. " . implode(', ', $errors),
            ], 422);
        }

        return response()->json([
            'status' => 'success',
            'message' => "Berhasil import {$imported} data siswa" . (!empty($errors) ? '. ' . implode(', ', $errors) : ''),
        ]);
    }

    public function buatkanAkun(Request $request, $id)
    {
        $siswa = Siswa::findOrFail($id);

        if ($siswa->user_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Siswa ini sudah memiliki akun login',
            ], 422);
        }

        $request->validate([
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
        ]);

        $user = User::create([
            'name' => $siswa->nama,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'KANDIDAT',
            'status' => 'AKTIF',
        ]);

        $siswa->update(['user_id' => $user->id]);

        return response()->json([
            'status' => 'success',
            'message' => 'Akun login berhasil dibuat',
            'data' => [
                'email' => $request->email,
                'password' => $request->password,
            ],
        ]);
    }

    public function updateLevelStatus(Request $request, $id)
    {
        $siswa = Siswa::findOrFail($id);

        $request->validate([
            'level' => 'required|integer|in:1,2,3,4',
            'status' => 'required|string|in:Active,Lulus,Proses,Tidak Lulus,Keluar',
        ]);

        $level = "level_{$request->level}";
        $stored = $siswa->level_status ?? [];
        $stored[$level] = $request->status;
        $siswa->update(['level_status' => $stored]);

        return response()->json([
            'status' => 'success',
            'message' => 'Status level berhasil diperbarui',
        ]);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:txt,csv|max:2048',
            'batch_id' => 'nullable|exists:batches,id',
            'level' => 'nullable|integer|min:0|max:9999',
            'kelas_id' => 'nullable|exists:kelas,id',
        ]);

        $file = $request->file('file');
        $batchId = $request->input('batch_id');
        $level = $request->input('level');
        $kelasId = $request->input('kelas_id');
        $content = file_get_contents($file->getRealPath());
        $lines = array_filter(explode("\n", str_replace("\r\n", "\n", $content)));

        if (empty($lines)) {
            return response()->json([
                'status' => 'error',
                'message' => 'File kosong atau tidak ada data',
            ], 422);
        }

        $imported = 0;
        $errors = [];

        foreach ($lines as $line) {
            $nama = trim($line);
            if (empty($nama)) continue;

            $slug = Str::slug($nama, '');
            $email = $slug . '@mendunia.id';

            $counter = 1;
            $originalEmail = $email;
            while (User::where('email', $email)->exists()) {
                $email = $counter . '-' . $originalEmail;
                $counter++;
            }

            try {
                $user = User::create([
                    'name' => $nama,
                    'email' => $email,
                    'password' => Hash::make($nama),
                    'role' => 'KANDIDAT',
                    'status' => 'AKTIF',
                ]);

                $kelasNama = $kelasId ? \App\Models\Kelas::find($kelasId)?->nama_kelas : '-';
                $batchNama = $batchId ? \App\Models\Batch::find($batchId)?->nama_batch : null;

                Siswa::create([
                    'user_id' => $user->id,
                    'nama' => $nama,
                    'kelas_id' => $kelasId,
                    'kelas' => $kelasNama,
                    'batch_id' => $batchId,
                    'batch' => $batchNama,
                    'level' => $level,
                    'status' => 'AKTIF',
                ]);

                $imported++;
            } catch (\Exception $e) {
                $errors[] = "Gagal import '{$nama}': " . $e->getMessage();
            }
        }

        if ($imported === 0) {
            return response()->json([
                'status' => 'error',
                'message' => "Import gagal. " . implode(', ', $errors),
            ], 422);
        }

        return response()->json([
            'status' => 'success',
            'message' => "Berhasil import {$imported} data siswa" . (!empty($errors) ? '. ' . implode(', ', $errors) : ''),
        ]);
    }

    public function bulkUpdateShift(Request $request)
    {
        $request->validate([
            'shift_id' => 'required|string',
            'mode' => 'required|in:selected,all',
            'ids' => 'array',
        ]);

        $shiftId = $request->shift_id === 'null' ? null : $request->shift_id;

        if ($request->mode === 'all') {
            Siswa::query()->update(['shift_id' => $shiftId]);
            $count = Siswa::count();
        } else {
            if (empty($request->ids)) {
                return response()->json(['status' => 'error', 'message' => 'Tidak ada siswa dipilih'], 422);
            }
            $count = Siswa::whereIn('id', $request->ids)->update(['shift_id' => $shiftId]);
        }

        return response()->json([
            'status' => 'success',
            'message' => "Berhasil mengupdate shift {$count} siswa",
        ]);
    }

    public function bulkDelete(Request $request)
    {
        $ids = $request->input('ids', []);

        if (empty($ids)) {
            return response()->json(['status' => 'error', 'message' => 'Tidak ada siswa dipilih'], 422);
        }

        $siswaList = Siswa::whereIn('id', $ids)->get();
        $count = 0;

        foreach ($siswaList as $siswa) {
            if ($siswa->user_id) {
                $siswa->user->delete();
            }
            $siswa->delete();
            $count++;
        }

        return response()->json([
            'status' => 'success',
            'message' => "Berhasil menghapus {$count} data siswa",
        ]);
    }
}
