<?php

namespace App\Http\Controllers\Absensi;

use App\Models\User;
use Carbon\Carbon;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class RekapController extends Controller
{
    public function rekap(Request $request)
    {
        $list_cabang = \App\Models\Cabang::all();
        $list_divisi = \App\Models\Divisi::all();

        $start_date = $request->start_date ?? now()->startOfMonth()->toDateString();
        $end_date = $request->end_date ?? now()->endOfMonth()->toDateString();
        $cabang_id = $request->cabang_id;
        $divisi_id = $request->divisi_id;

        $hiddenDivisi = session('hidden_divisi_ids', []);

        $rekap = User::where('role', 'KARYAWAN')->where('status', 'AKTIF')
            ->when($cabang_id, fn ($q) => $q->whereJsonContains('cabang_ids', (string) $cabang_id))
            ->when($divisi_id, fn ($q) => $q->where('divisi_id', $divisi_id))
            ->when($hiddenDivisi, fn ($q) => $q->whereNotIn('divisi_id', $hiddenDivisi))
            ->with([
                'divisi',
                'absensi' => fn ($q) => $q->whereBetween('tanggal', [$start_date, $end_date]),
                'lembur' => fn ($q) => $q->where('status', 'APPROVED')
                    ->whereBetween('created_at', [$start_date.' 00:00:00', $end_date.' 23:59:59']),
                'absensiSensei' => fn ($q) => $q->whereBetween('tanggal', [$start_date, $end_date]),
                'agenda' => fn ($q) => $q->whereBetween('tanggal', [$start_date, $end_date]),
                'absensiKhusus' => fn ($q) => $q->whereBetween('tanggal', [$start_date, $end_date]),
            ])
            ->get()
            ->map(function ($user) {
                $absensiFiltered = $user->absensi->filter(fn ($a) => !\App\Models\HariLibur::apakahLibur($a->tanggal));
                $hadir = $absensiFiltered->where('status', 'HADIR')->count();
                $terlambat = $absensiFiltered->where('status', 'TERLAMBAT')->count();
                $izin = $absensiFiltered->where('status', 'IZIN')->count();
                $alpa = $absensiFiltered->whereIn('status', ['ALPA', 'TIDAK ABSEN PULANG'])->count();
                $pulangAwal = $absensiFiltered->where('status', 'PULANG LEBIH AWAL')->count();
                $libur = $user->absensi->where('status', 'LIBUR')->count();

                $totalDetikKerja = 0;
                foreach ($absensiFiltered as $absen) {
                    if (! empty($absen->jam_masuk) && ! empty($absen->jam_keluar)) {
                        $totalDetikKerja += Carbon::parse($absen->jam_masuk)
                            ->diffInSeconds(Carbon::parse($absen->jam_keluar));
                    }
                }

                $jumlahLembur = $user->lembur->count();
                $totalDetikLembur = 0;
                foreach ($user->lembur as $l) {
                    if (! empty($l->jam_masuk) && ! empty($l->jam_keluar)) {
                        $totalDetikLembur += Carbon::parse($l->jam_masuk)
                            ->diffInSeconds(Carbon::parse($l->jam_keluar));
                    }
                }

                

                $senseiKehadiran = $user->absensiSensei->filter(fn ($a) => !\App\Models\HariLibur::apakahLibur($a->tanggal))->count();
                $totalAgenda = $user->agenda->filter(fn ($a) => !\App\Models\HariLibur::apakahLibur($a->tanggal))->count();
                $khusus = $user->absensiKhusus->filter(fn ($a) => !\App\Models\HariLibur::apakahLibur($a->tanggal))->count();
                $totalDetikKhusus = $user->absensiKhusus->sum('total_detik');
                $totalKehadiran = $hadir + $terlambat + $pulangAwal + $jumlahLembur + $senseiKehadiran + $totalAgenda + $khusus;

                $grandTotalDetik = $totalDetikKerja + $totalDetikLembur + $totalDetikKhusus;

                $fmt = fn ($s) => floor($s / 3600).'j '.floor(($s / 60) % 60).'m';

                $namaCabang = $user->cabang->pluck('nama_cabang')->implode(', ') ?: '-';

                return (object) [
                    'nama' => $user->name,
                    'jabatan' => $user->jabatan,
                    'cabang' => $namaCabang,
                    'hadir' => $hadir,
                    'terlambat' => $terlambat,
                    'izin' => $izin,
                    'alpa' => $alpa,
                    'pulang_awal' => $pulangAwal,
                    'libur' => $libur,
                    'jumlah_lembur' => $jumlahLembur,
                    'total_jam_lembur' => $fmt($totalDetikLembur),
                    'sensei_kehadiran' => $senseiKehadiran,
                    'total_agenda' => $totalAgenda,
                    'khusus' => $khusus,
                    'jam_khusus' => $fmt($totalDetikKhusus),
                    'total_hadir' => $hadir + $terlambat + $pulangAwal,
                    'total_kehadiran' => $totalKehadiran,
                    'total_jam_kerja' => $fmt($totalDetikKerja),
                    'grand_total_jam' => $fmt($grandTotalDetik),
                ];
            });

        return view('admin.rekap.index', compact(
            'rekap', 'start_date', 'end_date', 'list_cabang', 'list_divisi', 'hiddenDivisi'
        ));
    }

    public function apiRekap(Request $request)
    {
        $list_cabang = \App\Models\Cabang::all();
        $list_divisi = \App\Models\Divisi::all();

        $start_date = $request->start_date ?? now()->startOfMonth()->toDateString();
        $end_date = $request->end_date ?? now()->endOfMonth()->toDateString();
        $cabang_id = $request->cabang_id;
        $divisi_id = $request->divisi_id;

        $rekap = User::where('role', 'KARYAWAN')->where('status', 'AKTIF')
            ->when($cabang_id, fn($q) => $q->whereJsonContains('cabang_ids', (string) $cabang_id))
            ->when($divisi_id, fn($q) => $q->where('divisi_id', $divisi_id))
            ->with([
                'divisi',
                'absensi' => fn($q) => $q->whereBetween('tanggal', [$start_date, $end_date]),
                'lembur' => fn($q) => $q->where('status', 'APPROVED')
                    ->whereBetween('created_at', [$start_date . ' 00:00:00', $end_date . ' 23:59:59']),
                'absensiSensei' => fn($q) => $q->whereBetween('tanggal', [$start_date, $end_date]),
                'agenda' => fn($q) => $q->whereBetween('tanggal', [$start_date, $end_date]),
                'absensiKhusus' => fn($q) => $q->whereBetween('tanggal', [$start_date, $end_date]),
            ])
            ->get()
            ->map(function ($user) {
                $absensiFiltered = $user->absensi->filter(fn($a) => !\App\Models\HariLibur::apakahLibur($a->tanggal));
                $hadir = $absensiFiltered->where('status', 'HADIR')->count();
                $terlambat = $absensiFiltered->where('status', 'TERLAMBAT')->count();
                $izin = $absensiFiltered->where('status', 'IZIN')->count();
                $alpa = $absensiFiltered->whereIn('status', ['ALPA', 'TIDAK ABSEN PULANG'])->count();
                $pulangAwal = $absensiFiltered->where('status', 'PULANG LEBIH AWAL')->count();
                $libur = $user->absensi->where('status', 'LIBUR')->count();

                $totalDetikKerja = 0;
                foreach ($absensiFiltered as $absen) {
                    if (!empty($absen->jam_masuk) && !empty($absen->jam_keluar)) {
                        $totalDetikKerja += Carbon::parse($absen->jam_masuk)
                            ->diffInSeconds(Carbon::parse($absen->jam_keluar));
                    }
                }

                $jumlahLembur = $user->lembur->count();
                $totalDetikLembur = 0;
                foreach ($user->lembur as $l) {
                    if (!empty($l->jam_masuk) && !empty($l->jam_keluar)) {
                        $totalDetikLembur += Carbon::parse($l->jam_masuk)
                            ->diffInSeconds(Carbon::parse($l->jam_keluar));
                    }
                }

                $senseiKehadiran = $user->absensiSensei->filter(fn($a) => !\App\Models\HariLibur::apakahLibur($a->tanggal))->count();
                $totalAgenda = $user->agenda->filter(fn($a) => !\App\Models\HariLibur::apakahLibur($a->tanggal))->count();
                $khusus = $user->absensiKhusus->filter(fn($a) => !\App\Models\HariLibur::apakahLibur($a->tanggal))->count();
                $totalDetikKhusus = $user->absensiKhusus->sum('total_detik');
                $totalKehadiran = $hadir + $terlambat + $pulangAwal + $jumlahLembur + $senseiKehadiran + $totalAgenda + $khusus;

                $grandTotalDetik = $totalDetikKerja + $totalDetikLembur + $totalDetikKhusus;

                $fmt = fn($s) => floor($s / 3600) . 'j ' . floor(($s / 60) % 60) . 'm';

                $namaCabang = $user->cabang->pluck('nama_cabang')->implode(', ') ?: '-';

                return [
                    'nama' => $user->name,
                    'jabatan' => $user->jabatan,
                    'divisi' => $user->divisi->nama_divisi ?? '-',
                    'cabang' => $namaCabang,
                    'hadir' => $hadir,
                    'terlambat' => $terlambat,
                    'izin' => $izin,
                    'alpa' => $alpa,
                    'pulang_awal' => $pulangAwal,
                    'libur' => $libur,
                    'jumlah_lembur' => $jumlahLembur,
                    'total_jam_lembur' => $fmt($totalDetikLembur),
                    'sensei_kehadiran' => $senseiKehadiran,
                    'total_agenda' => $totalAgenda,
                    'khusus' => $khusus,
                    'jam_khusus' => $fmt($totalDetikKhusus),
                    'total_hadir' => $hadir + $terlambat + $pulangAwal,
                    'total_kehadiran' => $totalKehadiran,
                    'total_jam_kerja' => $fmt($totalDetikKerja),
                    'grand_total_jam' => $fmt($grandTotalDetik),
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $rekap,
            'list_cabang' => $list_cabang,
            'list_divisi' => $list_divisi,
        ]);
    }

    public function getHiddenDivisi()
    {
        return response()->json(['ids' => session('hidden_divisi_ids', [])]);
    }

    public function setHiddenDivisi(Request $request)
    {
        $request->validate(['ids' => 'array']);
        session(['hidden_divisi_ids' => $request->ids ?? []]);
        return response()->json(['status' => 'ok']);
    }
}
