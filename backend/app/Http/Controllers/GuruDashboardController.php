<?php

namespace App\Http\Controllers;

use App\Models\AbsensiSensei;
use App\Models\Guru;
use App\Models\KelasSensei;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GuruDashboardController extends Controller
{
    public function index()
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $guru = Guru::where('user_id', $user->id)->first();
        $today = now()->toDateString();
        $bulanIni = now()->month;
        $tahunIni = now()->year;

        $kelasAktif = KelasSensei::where('user_id', $user->id)
            ->where('status', 'aktif')
            ->whereDate('tanggal_mulai', '<=', $today)
            ->whereDate('tanggal_selesai', '>=', $today)
            ->with(['absensi' => function ($q) use ($today) {
                $q->where('tanggal', $today);
            }, 'batchRelasi'])
            ->get();

        $totalKelas = KelasSensei::where('user_id', $user->id)->count();

        $kehadiranBulanIni = AbsensiSensei::where('user_id', $user->id)
            ->whereMonth('tanggal', $bulanIni)
            ->whereYear('tanggal', $tahunIni)
            ->count();

        $riwayatSensei = AbsensiSensei::where('user_id', $user->id)
            ->with('kelasSensei')
            ->orderBy('tanggal', 'desc')
            ->take(10)
            ->get();

        return response()->json([
            'guru' => $guru,
            'user' => $user,
            'kelas_aktif' => $kelasAktif,
            'total_kelas' => $totalKelas,
            'kehadiran_bulan_ini' => $kehadiranBulanIni,
            'riwayat_sensei' => $riwayatSensei,
        ]);
    }
}
