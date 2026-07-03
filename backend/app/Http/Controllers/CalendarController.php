<?php

namespace App\Http\Controllers;

use App\Models\Absensi;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CalendarController extends Controller
{

public function index()
{
    // Ini harus mengembalikan file blade, BUKAN data json
    return view('absensi.calendar.index'); 
}
public function getRiwayatKalender(Request $request)
{
$userId = Auth::id();
    $bulan = $request->query('bulan', date('m'));
    $tahun = $request->query('tahun', date('Y'));

    // 1. Ambil data Absensi User (Hadir, Alpa, Izin, Terlambat)
    $absensi = Absensi::where('user_id', $userId)
        ->whereYear('tanggal', $tahun)
        ->whereMonth('tanggal', $bulan)
        ->get(['tanggal', 'status', 'jam_masuk', 'jam_keluar'])
        ->map(function ($item) {
            return [
                'tanggal'   => \Carbon\Carbon::parse($item->tanggal)->format('Y-m-d'),
                'status'    => $item->status,
                'jam_masuk' => $item->jam_masuk,
                'jam_keluar'=> $item->jam_keluar,
            ];
        });

    // 2. Ambil data Hari Libur Nasional dari tabel HariLibur
    $hariLibur = \App\Models\HariLibur::whereYear('tanggal', $tahun)
        ->whereMonth('tanggal', $bulan)
        ->get()
        ->map(function ($item) {
            return [
                'tanggal'   => \Carbon\Carbon::parse($item->tanggal)->format('Y-m-d'),
                'status'    => 'LIBUR', // Status dipaksa LIBUR agar dibaca JS
                'jam_masuk' => null,
                'jam_keluar'=> null,
                'keterangan'=> $item->keterangan // Opsional: untuk detail saat diklik
            ];
        });

    // 3. Gabungkan kedua data (Absensi + Hari Libur)
    // Menggunakan merge agar data libur masuk ke dalam array yang sama
    $data = $absensi->concat($hariLibur);

    return response()->json($data);
}
}
