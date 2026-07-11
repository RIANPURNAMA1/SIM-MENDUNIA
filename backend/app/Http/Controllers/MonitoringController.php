<?php

namespace App\Http\Controllers;

use App\Models\Absensi;
use App\Models\Cabang;
use Illuminate\Http\Request;

class MonitoringController extends Controller
{
    public function monitoring(Request $request)
    {
        $tglMulai  = $request->tgl_mulai  ?? now()->toDateString();
        $tglSelesai = $request->tgl_selesai ?? now()->toDateString();
        $cabangId  = $request->cabang_id;

        $user = auth()->user();

        $query = Absensi::with(['user', 'cabang'])
            ->whereBetween('tanggal', [$tglMulai, $tglSelesai])
            ->where(function ($q) {
                $q->whereNotNull('lat_masuk')
                  ->orWhereNotNull('lat_pulang');
            });

        if ($cabangId) {
            $query->where('cabang_id', $cabangId);
        } elseif ($user && $user->cabang_ids) {
            $query->whereIn('cabang_id', $user->cabang_ids);
        }

        $absensis = $query->orderBy('tanggal', 'desc')->get();
        $cabangs  = Cabang::orderBy('nama_cabang')->get();

        return view('admin.monitoring.index', compact(
            'absensis', 'tglMulai', 'tglSelesai', 'cabangId', 'cabangs'
        ));
    }

    public function apiMonitoring(Request $request)
    {
        $tglMulai  = $request->tgl_mulai  ?? now()->toDateString();
        $tglSelesai = $request->tgl_selesai ?? now()->toDateString();
        $cabangId  = $request->cabang_id;

        $user = auth()->user();

        $query = Absensi::with(['user', 'cabang'])
            ->whereBetween('tanggal', [$tglMulai, $tglSelesai])
            ->where(function ($q) {
                $q->whereNotNull('lat_masuk')
                  ->orWhereNotNull('lat_pulang');
            });

        if ($cabangId) {
            $query->where('cabang_id', $cabangId);
        } elseif ($user && $user->cabang_ids) {
            $query->whereIn('cabang_id', $user->cabang_ids);
        }

        $absensis = $query->orderBy('tanggal', 'desc')->get();
        $cabangs  = Cabang::orderBy('nama_cabang')->get();

        return response()->json([
            'success' => true,
            'data' => $absensis,
            'list_cabang' => $cabangs,
        ]);
    }
}