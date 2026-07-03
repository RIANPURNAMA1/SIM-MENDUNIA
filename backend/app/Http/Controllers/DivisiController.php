<?php

namespace App\Http\Controllers;

use App\Models\Divisi;
use Illuminate\Http\Request;

class DivisiController extends Controller
{
    /**
     * Menampilkan daftar divisi
     */
    public function index()
    {
        $divisi = Divisi::all();
        return view('divisi.index', compact('divisi'));
    }

    /**
     * Menyimpan divisi baru
     */
    public function store(Request $request)
    {
        $request->validate([
            'kode_divisi' => 'required|string|max:10|unique:divisis,kode_divisi',
            'nama_divisi' => 'required|string|max:100|unique:divisis,nama_divisi'
        ]);

        try {
            $divisi = Divisi::create([
                'kode_divisi' => strtoupper($request->kode_divisi), // Simpan dalam huruf kapital
                'nama_divisi' => $request->nama_divisi
            ]);

            if ($request->ajax() || $request->wantsJson()) {
                return response()->json([
                    'status'  => 'success',
                    'message' => 'Divisi berhasil ditambahkan',
                    'data'    => $divisi
                ], 201);
            }

            return redirect()->back()->with('success', 'Divisi berhasil ditambahkan');

        } catch (\Exception $e) {
            if ($request->ajax()) {
                return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
            }
            return redirect()->back()->with('error', 'Gagal menambahkan divisi');
        }
    }

    /**
     * Memperbarui data divisi
     */
    public function update(Request $request, $id)
    {
        $divisi = Divisi::findOrFail($id);

        $request->validate([
            'kode_divisi' => 'required|string|max:10|unique:divisis,kode_divisi,' . $divisi->id,
            'nama_divisi' => 'required|string|max:100|unique:divisis,nama_divisi,' . $divisi->id,
        ]);

        try {
            $divisi->update([
                'kode_divisi' => strtoupper($request->kode_divisi),
                'nama_divisi' => $request->nama_divisi,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Divisi berhasil diperbarui'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memperbarui data'
            ], 500);
        }
    }

    /**
     * Menghapus divisi
     */
    public function destroy($id)
    {
        try {
            Divisi::findOrFail($id)->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Divisi berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menghapus data'
            ], 500);
        }
    }

    public function apiList()
    {
        return response()->json([
            'status' => 'success',
            'data' => Divisi::orderBy('nama_divisi')->get(),
        ]);
    }
}