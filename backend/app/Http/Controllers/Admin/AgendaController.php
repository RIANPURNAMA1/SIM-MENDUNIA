<?php

namespace App\Http\Controllers\Admin;

use App\Models\Agenda;
use App\Models\Cabang;
use App\Models\Divisi;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AgendaController extends Controller
{
    public function index(Request $request)
    {
        $start_date = $request->start_date ?? Carbon::now()->startOfMonth()->toDateString();
        $end_date = $request->end_date ?? Carbon::now()->endOfMonth()->toDateString();
        $cabang_id = $request->cabang_id;
        $divisi_id = $request->divisi_id;

        $cabangs = Cabang::orderBy('nama_cabang')->get();
        $divisis = Divisi::orderBy('nama_divisi')->get();

        $agendas = Agenda::with(['user.shift', 'user.divisi'])
            ->whereHas('user', function ($query) use ($cabang_id, $divisi_id) {
                if ($divisi_id) {
                    $query->where('divisi_id', $divisi_id);
                }
                if ($cabang_id) {
                    $query->whereJsonContains('cabang_ids', (string) $cabang_id);
                }
            })
            ->whereBetween('tanggal', [$start_date, $end_date])
            ->orderBy('tanggal', 'desc')
            ->orderBy('jam_absen_masuk', 'desc')
            ->paginate(20);

        return view('admin.agenda.index', compact(
            'agendas', 'start_date', 'end_date', 'cabang_id', 'divisi_id', 'cabangs', 'divisis'
        ));
    }

    public function apiIndex(Request $request)
    {
        $start_date = $request->start_date ?? Carbon::now()->startOfMonth()->toDateString();
        $end_date = $request->end_date ?? Carbon::now()->endOfMonth()->toDateString();
        $cabang_id = $request->cabang_id;
        $divisi_id = $request->divisi_id;
        $perPage = $request->per_page ?? 20;

        $cabangs = Cabang::orderBy('nama_cabang')->get();
        $divisis = Divisi::orderBy('nama_divisi')->get();

        $agendas = Agenda::with(['user.shift', 'user.divisi', 'user.cabang'])
            ->whereHas('user', function ($query) use ($cabang_id, $divisi_id) {
                if ($divisi_id) {
                    $query->where('divisi_id', $divisi_id);
                }
                if ($cabang_id) {
                    $query->whereJsonContains('cabang_ids', (string) $cabang_id);
                }
            })
            ->whereBetween('tanggal', [$start_date, $end_date])
            ->orderBy('tanggal', 'desc')
            ->orderBy('jam_absen_masuk', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $agendas->items(),
            'pagination' => [
                'current_page' => $agendas->currentPage(),
                'last_page' => $agendas->lastPage(),
                'total' => $agendas->total(),
                'per_page' => $agendas->perPage(),
            ],
            'list_cabang' => $cabangs,
            'list_divisi' => $divisis,
        ]);
    }
}
