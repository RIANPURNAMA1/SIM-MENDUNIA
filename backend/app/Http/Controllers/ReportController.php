<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Absensi;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $now = Carbon::now();

        $bulan = $now->month;
        $tahun = $now->year;

        // 🔹 Ambil semua data absensi bulan ini (1x query saja)
        $data = Absensi::where('user_id', $user->id)
            ->whereMonth('tanggal', $bulan)
            ->whereYear('tanggal', $tahun)
            ->get();

        // 🔹 Statistik
        $stats = [
            'hadir'      => $data->whereIn('status', ['HADIR'])->count(),
            'terlambat'  => $data->where('status', 'TERLAMBAT')->count(),
            'izin'       => $data->where('status', 'IZIN')->count(),
            'alpa'       => $data->where('status', 'ALPA')->count(),
        ];

        // 🔹 Total hari kerja (tanpa Sabtu Minggu)
        $hariKerja = collect(
            Carbon::create($tahun, $bulan, 1)->daysUntil(Carbon::create($tahun, $bulan)->endOfMonth())
        )->filter(fn($date) => !$date->isWeekend())->count();

        // 🔹 Skor Disiplin
        $totalKehadiran = $stats['hadir'] + $stats['terlambat'] + $stats['izin'];
        $skor = $hariKerja > 0 ? round(($totalKehadiran / $hariKerja) * 100) : 0;
        $skor = min($skor, 100);

        // 🔹 Label skor
        if ($skor >= 90) {
            $labelSkor = "Sangat Baik";
        } elseif ($skor >= 75) {
            $labelSkor = "Baik";
        } else {
            $labelSkor = "Perlu Peningkatan";
        }

        // 🔹 5 aktivitas terakhir bulan ini
        $riwayatTerakhir = $data->sortByDesc('tanggal')->take(5);

        return view('absensi.report.index', compact(
            'stats',
            'skor',
            'labelSkor',
            'riwayatTerakhir',
            'hariKerja'
        ));
    }
}
