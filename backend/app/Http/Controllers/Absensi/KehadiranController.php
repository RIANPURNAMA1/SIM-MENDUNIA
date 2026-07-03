<?php

namespace App\Http\Controllers\Absensi;

use App\Models\Absensi;
use App\Models\User;
use App\Models\Cabang;
use App\Models\Divisi;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class KehadiranController extends Controller
{
    public function index(Request $request)
    {
        // 1. Ambil data pendukung untuk dropdown filter
        $list_cabang = \App\Models\Cabang::all();
        $list_divisi = \App\Models\Divisi::all();

        // 2. Inisialisasi Tanggal (Default: Awal bulan s/d hari ini)
        // Menggunakan Carbon agar lebih konsisten dengan timezone Jakarta
        $tanggal    = $request->tanggal ?? now('Asia/Jakarta')->toDateString();
        $start_date = $request->start_date ?? now('Asia/Jakarta')->startOfMonth()->toDateString();
        $end_date   = $request->end_date ?? now('Asia/Jakarta')->endOfMonth()->toDateString();

        // 3. Ambil Input Filter
        $cabang_id  = $request->cabang_id;
        $divisi_id  = $request->divisi_id;
        $status     = $request->status; // Ambil filter status dari request

        // 4. Query Absensi dengan Filter
        $absensis = \App\Models\Absensi::with(['user.shift', 'user.divisi', 'cabang'])
            // Filter berdasarkan rentang tanggal
            ->whereBetween('tanggal', [$start_date, $end_date])

            // Hanya tampilkan absensi dari karyawan AKTIF
            ->whereHas('user', fn ($q) => $q->where('status', 'AKTIF'))

            // Jangan tampilkan karyawan yang mempunyai kelas sensei
            ->whereDoesntHave('user.kelasSensei')

            // Filter berdasarkan Status (HADIR, TERLAMBAT, IZIN, dll)
            ->when($status, function ($query) use ($status) {
                return $query->where('status', $status);
            })

            // Filter berdasarkan Cabang (jika dipilih)
            // Menggunakan whereHas jika relasi ke user mendefinisikan penempatan cabang
            ->when($cabang_id, function ($query) use ($cabang_id) {
                return $query->whereHas('user', function ($q) use ($cabang_id) {
                    // Sesuaikan kolom di tabel users (apakah cabang_id atau lainnya)
                    $q->where('cabang_id', $cabang_id);
                });
            })

            // Filter berdasarkan Divisi (jika dipilih)
            ->when($divisi_id, function ($query) use ($divisi_id) {
                return $query->whereHas('user', function ($q) use ($divisi_id) {
                    $q->where('divisi_id', $divisi_id);
                });
            })

            ->orderBy('tanggal', 'desc')
            ->orderBy('jam_masuk', 'asc')
            ->get();

        // 5. Kirim semua variabel ke view
        return view('admin.kehadiran.index', [
            'absensis'    => $absensis,
            'start_date'  => $start_date,
            'end_date'    => $end_date,
            'tanggal'     => $tanggal,
            'list_cabang' => $list_cabang,
            'list_divisi' => $list_divisi,
            'status_selected' => $status // Opsional: untuk menandai status yang sedang aktif
        ]);
    }

    // revisi
    public function updateStatus(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:absensis,id',
            'status' => 'required|in:HADIR,TERLAMBAT,IZIN,ALPA,PULANG LEBIH AWAL,LIBUR',
        ]);

        $absen = Absensi::findOrFail($request->id);

        $updateData = ['status' => $request->status];

        if ($request->status === 'HADIR') {
            $shift = $absen->shift;
            if ($shift) {
                $updateData['jam_masuk'] = $shift->jam_masuk;
                $updateData['jam_keluar'] = $shift->jam_pulang;
            }
        }

        $absen->update($updateData);

        return back()->with('success', 'Status absensi berhasil diperbarui');
    }

    // API
    public function apiIndex(Request $request)
    {
        $start_date = $request->start_date ?? now('Asia/Jakarta')->startOfMonth()->toDateString();
        $end_date   = $request->end_date ?? now('Asia/Jakarta')->endOfMonth()->toDateString();
        $cabang_id  = $request->cabang_id;
        $divisi_id  = $request->divisi_id;
        $status     = $request->status;

        $absensis = Absensi::with(['user.shift', 'user.divisi', 'cabang'])
            ->whereBetween('tanggal', [$start_date, $end_date])
            ->whereHas('user', fn($q) => $q->where('status', 'AKTIF'))
            ->whereDoesntHave('user.kelasSensei')
            ->when($status, fn($q) => $q->where('status', $status))
            ->when($cabang_id, fn($q) => $q->whereHas('user', fn($qq) => $qq->where('cabang_id', $cabang_id)))
            ->when($divisi_id, fn($q) => $q->whereHas('user', fn($qq) => $qq->where('divisi_id', $divisi_id)))
            ->orderBy('tanggal', 'desc')
            ->orderBy('jam_masuk', 'asc')
            ->get();

        $list_cabang = Cabang::all();
        $list_divisi = Divisi::all();

        return response()->json([
            'status' => 'success',
            'data' => $absensis,
            'list_cabang' => $list_cabang,
            'list_divisi' => $list_divisi,
        ]);
    }

    public function updateStatusApi(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:absensis,id',
            'status' => 'required|in:HADIR,TERLAMBAT,IZIN,ALPA,PULANG LEBIH AWAL,LIBUR',
        ]);

        $absen = Absensi::findOrFail($request->id);

        $updateData = ['status' => $request->status];

        if ($request->status === 'HADIR') {
            $shift = $absen->shift;
            if ($shift) {
                $updateData['jam_masuk'] = $shift->jam_masuk;
                $updateData['jam_keluar'] = $shift->jam_pulang;
            }
        }

        $absen->update($updateData);

        return response()->json([
            'status' => 'success',
            'message' => 'Status absensi berhasil diperbarui',
        ]);
    }
}
