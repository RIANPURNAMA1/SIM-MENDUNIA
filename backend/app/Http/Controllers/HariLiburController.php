<?php
namespace App\Http\Controllers;

use App\Models\HariLibur;
use Illuminate\Http\Request;

class HariLiburController extends Controller
{
    public function index()
    {
        // Ambil data hari libur diurutkan dari yang terdekat
    $hariLiburs = HariLibur::orderBy('tanggal', 'asc')->paginate(10);
        return view('admin.hariLibur.index', compact('hariLiburs'));
    }

 public function store(Request $request)
{
    $request->validate([
        'tgl_mulai'   => 'required|date',
        'tgl_selesai' => 'required|date|after_or_equal:tgl_mulai',
        'keterangan'  => 'required|string|max:255',
    ]);

    $start = \Carbon\Carbon::parse($request->tgl_mulai);
    $end   = \Carbon\Carbon::parse($request->tgl_selesai);
    $added = 0;

    while ($start->lte($end)) {
        // Skip jika sudah ada
        HariLibur::firstOrCreate(
            ['tanggal'     => $start->format('Y-m-d')],
            ['keterangan'  => $request->keterangan]
        ) && $added++;

        $start->addDay();
    }

    return back()->with('success', "Berhasil menambahkan {$added} tanggal libur!");
}

    public function destroy($id)
    {
        HariLibur::findOrFail($id)->delete();
        return back()->with('success', 'Hari libur berhasil dihapus!');
    }

    // API
    public function apiIndex()
    {
        $data = HariLibur::orderBy('tanggal', 'asc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $data,
        ]);
    }

    public function apiStore(Request $request)
    {
        $request->validate([
            'tgl_mulai'   => 'required|date',
            'tgl_selesai' => 'required|date|after_or_equal:tgl_mulai',
            'keterangan'  => 'required|string|max:255',
        ]);

        $start = \Carbon\Carbon::parse($request->tgl_mulai);
        $end   = \Carbon\Carbon::parse($request->tgl_selesai);
        $added = 0;

        while ($start->lte($end)) {
            HariLibur::firstOrCreate(
                ['tanggal' => $start->format('Y-m-d')],
                ['keterangan' => $request->keterangan]
            );
            $added++;
            $start->addDay();
        }

        return response()->json([
            'status' => 'success',
            'message' => "Berhasil menambahkan {$added} tanggal libur!",
        ]);
    }

    public function apiDestroy($id)
    {
        HariLibur::findOrFail($id)->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Hari libur berhasil dihapus!',
        ]);
    }
}