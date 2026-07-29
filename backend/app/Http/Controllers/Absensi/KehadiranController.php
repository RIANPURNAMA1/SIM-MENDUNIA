<?php

namespace App\Http\Controllers\Absensi;

use App\Models\Absensi;
use App\Models\User;
use App\Models\Cabang;
use App\Models\Divisi;
use App\Models\HariLibur;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;

class KehadiranController extends Controller
{
    public function index(Request $request)
    {
        $list_cabang = \App\Models\Cabang::all();
        $list_divisi = \App\Models\Divisi::all();

        $tanggal    = $request->tanggal ?? now('Asia/Jakarta')->toDateString();
        $start_date = $request->start_date ?? now('Asia/Jakarta')->startOfMonth()->toDateString();
        $end_date   = $request->end_date ?? now('Asia/Jakarta')->endOfMonth()->toDateString();

        $cabang_id  = $request->cabang_id;
        $divisi_id  = $request->divisi_id;
        $status     = $request->status;

        $absensis = \App\Models\Absensi::with(['user.shift', 'user.divisi', 'cabang'])
            ->whereBetween('tanggal', [$start_date, $end_date])
            ->whereHas('user', fn ($q) => $q->where('status', 'AKTIF'))
            ->whereDoesntHave('user.kelasSensei')
            ->when($status, function ($query) use ($status) {
                return $query->where('status', $status);
            })
            ->when($cabang_id, function ($query) use ($cabang_id) {
                return $query->whereHas('user', function ($q) use ($cabang_id) {
                    $q->where('cabang_id', $cabang_id);
                });
            })
            ->when($divisi_id, function ($query) use ($divisi_id) {
                return $query->whereHas('user', function ($q) use ($divisi_id) {
                    $q->where('divisi_id', $divisi_id);
                });
            })
            ->orderBy('tanggal', 'desc')
            ->orderBy('jam_masuk', 'asc')
            ->get();

        return view('admin.kehadiran.index', [
            'absensis'    => $absensis,
            'start_date'  => $start_date,
            'end_date'    => $end_date,
            'tanggal'     => $tanggal,
            'list_cabang' => $list_cabang,
            'list_divisi' => $list_divisi,
            'status_selected' => $status
        ]);
    }

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
        try {
            $start_date = $request->start_date ?? now('Asia/Jakarta')->startOfMonth()->toDateString();
            $end_date   = $request->end_date ?? now('Asia/Jakarta')->endOfMonth()->toDateString();
            $cabang_id  = $request->cabang_id;
            $divisi_id  = $request->divisi_id;
            $status     = $request->status;
            $search     = $request->search;

            // Ambil absensi yang sudah ada di DB
            $absensis = Absensi::with([
                'user' => fn($q) => $q->select(['id', 'name', 'nip', 'divisi_id', 'shift_id']),
                'user.shift',
                'user.divisi',
                'cabang',
                'shift',
            ])
                ->whereBetween('tanggal', [$start_date, $end_date])
                ->whereHas('user', fn($q) => $q->where('status', 'AKTIF'))
                ->whereDoesntHave('user.kelasSensei')
                ->when($search, fn($q) => $q->whereHas('user', fn($qq) => $qq->where(function ($qqq) use ($search) {
                    $qqq->where('name', 'like', "%{$search}%")->orWhere('nip', 'like', "%{$search}%");
                })))
                ->when($status, fn($q) => $q->where('status', $status))
                ->when($cabang_id, fn($q) => $q->whereHas('user', fn($qq) => $qq->whereJsonContains('cabang_ids', (int)$cabang_id)))
                ->when($divisi_id, fn($q) => $q->whereHas('user', fn($qq) => $qq->where('divisi_id', $divisi_id)))
                ->orderBy('tanggal', 'desc')
                ->orderBy('jam_masuk', 'asc')
                ->get();

            // Kirim juga daftar user aktif — frontend akan generate virtual records sendiri
            $users = User::with('divisi')
                ->where('status', 'AKTIF')
                ->whereDoesntHave('kelasSensei')
                ->when($cabang_id, fn($q) => $q->whereJsonContains('cabang_ids', (int)$cabang_id))
                ->when($divisi_id, fn($q) => $q->where('divisi_id', $divisi_id))
                ->when($search, fn($q) => $q->where(function ($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")->orWhere('nip', 'like', "%{$search}%");
                }))
                ->get(['id', 'name', 'nip', 'divisi_id'])
                ->map(fn($u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'nip' => $u->nip,
                    'divisi' => $u->divisi ? ['nama_divisi' => $u->divisi->nama_divisi] : null,
                ]);

            $list_cabang = Cabang::all();
            $list_divisi = Divisi::all();

            $hariLibur = \App\Models\HariLibur::whereBetween('tanggal', [$start_date, $end_date])
                ->pluck('tanggal')
                ->map(fn($d) => (string) $d)
                ->values();

            return response()->json([
                'status' => 'success',
                'data' => $absensis,
                'users' => $users,
                'hari_libur' => $hariLibur,
                'start_date' => $start_date,
                'end_date' => $end_date,
                'list_cabang' => $list_cabang,
                'list_divisi' => $list_divisi,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
            ], 500);
        }
    }

    public function updateStatusApi(Request $request)
    {
        $request->validate([
            'id' => 'required',
            'status' => 'required|in:HADIR,TERLAMBAT,IZIN,ALPA,PULANG LEBIH AWAL,LIBUR',
            'user_id' => 'required_if:id,virtual_*|exists:users,id',
            'tanggal' => 'required_if:id,virtual_*|date',
            'shift_id' => 'nullable|exists:shifts,id',
        ]);

        $absen = null;
        if (is_numeric($request->id)) {
            $absen = Absensi::findOrFail($request->id);
        } elseif (str_starts_with($request->id, 'virtual_')) {
            // Cari atau buat record absensi baru
            $absen = Absensi::firstOrNew([
                'user_id' => $request->user_id,
                'tanggal' => $request->tanggal,
                'shift_id' => $request->shift_id,
            ]);
            if (!$absen->exists) {
                $user = User::find($request->user_id);
                if ($user && !empty($user->cabang_ids)) {
                    $absen->cabang_id = is_array($user->cabang_ids) ? $user->cabang_ids[0] : $user->cabang_ids;
                }
            }
        } else {
            return response()->json(['message' => 'ID absensi tidak valid'], 400);
        }

        $updateData = ['status' => $request->status];

        if ($request->status === 'HADIR') {
            $shift = $absen->shift ?? ($request->shift_id ? \App\Models\Shift::find($request->shift_id) : null);
            if ($shift) {
                $updateData['jam_masuk'] = $shift->jam_masuk;
                $updateData['jam_keluar'] = $shift->jam_pulang;
            }
        }

        $absen->fill($updateData)->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Status absensi berhasil diperbarui',
        ]);
    }
}
