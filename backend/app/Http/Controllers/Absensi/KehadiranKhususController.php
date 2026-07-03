<?php

namespace App\Http\Controllers\Absensi;

use App\Models\AbsensiKhusus;
use App\Models\Cabang;
use App\Models\Divisi;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class KehadiranKhususController extends Controller
{
    public function index(Request $request)
    {
        $list_cabang = \App\Models\Cabang::all();
        $list_divisi = \App\Models\Divisi::all();

        $start_date = $request->start_date ?? now('Asia/Jakarta')->startOfMonth()->toDateString();
        $end_date   = $request->end_date ?? now('Asia/Jakarta')->endOfMonth()->toDateString();

        $cabang_id  = $request->cabang_id;
        $divisi_id  = $request->divisi_id;
        $status     = $request->status;

        $data = AbsensiKhusus::with('user.divisi')
            ->whereBetween('tanggal', [$start_date, $end_date])
            ->whereHas('user', fn ($q) => $q->where('status', 'AKTIF'))
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

        return view('admin.kehadiran_khusus.index', [
            'data'        => $data,
            'start_date'  => $start_date,
            'end_date'    => $end_date,
            'list_cabang' => $list_cabang,
            'list_divisi' => $list_divisi,
            'status_selected' => $status,
        ]);
    }

    public function updateStatus(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:absensi_khusus,id',
            'status' => 'required|in:BERJALAN,DITUNDA,SELESAI',
        ]);

        $absen = AbsensiKhusus::findOrFail($request->id);
        $absen->update(['status' => $request->status]);

        return back()->with('success', 'Status absensi khusus berhasil diperbarui');
    }

    // API
    public function apiIndex(Request $request)
    {
        $start_date = $request->start_date ?? now('Asia/Jakarta')->startOfMonth()->toDateString();
        $end_date   = $request->end_date ?? now('Asia/Jakarta')->endOfMonth()->toDateString();
        $cabang_id  = $request->cabang_id;
        $divisi_id  = $request->divisi_id;
        $status     = $request->status;

        $data = AbsensiKhusus::with('user.divisi')
            ->whereBetween('tanggal', [$start_date, $end_date])
            ->whereHas('user', fn($q) => $q->where('status', 'AKTIF'))
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
            'data' => $data,
            'list_cabang' => $list_cabang,
            'list_divisi' => $list_divisi,
        ]);
    }

    public function updateStatusApi(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:absensi_khusus,id',
            'status' => 'required|in:BERJALAN,DITUNDA,SELESAI',
        ]);

        $absen = AbsensiKhusus::findOrFail($request->id);
        $absen->update(['status' => $request->status]);

        return response()->json([
            'status' => 'success',
            'message' => 'Status absensi khusus berhasil diperbarui',
        ]);
    }
}
