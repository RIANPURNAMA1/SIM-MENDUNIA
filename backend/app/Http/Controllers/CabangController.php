<?php

namespace App\Http\Controllers;

use App\Models\Cabang;
use Illuminate\Http\Request;

class CabangController extends Controller
{
    /**
     * Menampilkan daftar cabang
     */
    public function index()
    {
        $cabangs = Cabang::all();
        return view('cabang.index', compact('cabangs'));
    }

    /**
     * Menyimpan data cabang baru
     */
    public function store(Request $request)
    {
        $request->validate([
            'kode_cabang'  => 'required|unique:cabangs,kode_cabang', // Field baru: KODE
            'nama_cabang'  => 'required',
            'status_pusat' => 'required|in:PUSAT,CABANG',         // Field baru: PUSAT/CABANG
            'latitude'     => 'required',
            'longitude'    => 'required',
            'radius'       => 'required|numeric',
            'alamat'       => 'nullable'
        ]);

        try {
            // Mengambil data kecuali _token
            Cabang::create($request->except(['_token']));
            
            return redirect()->back()->with('success', 'Cabang berhasil ditambahkan');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menambah cabang: ' . $e->getMessage());
        }
    }

    /**
     * Memperbarui data cabang
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'kode_cabang'  => 'required|unique:cabangs,kode_cabang,' . $id,
            'nama_cabang'  => 'required',
            'status_pusat' => 'required|in:PUSAT,CABANG',
            'latitude'     => 'required',
            'longitude'    => 'required',
            'radius'       => 'required|numeric',
            'alamat'       => 'nullable'
        ]);

        try {
            $cabang = Cabang::findOrFail($id);

            // Gunakan except untuk membuang _token dan _method agar tidak error di database
            $cabang->update($request->except(['_token', '_method']));

            if ($request->ajax()) {
                return response()->json([
                    'success' => true, 
                    'message' => 'Cabang berhasil diupdate'
                ]);
            }

            return redirect()->back()->with('success', 'Cabang berhasil diperbarui');
        } catch (\Exception $e) {
            if ($request->ajax()) {
                return response()->json([
                    'success' => false, 
                    'message' => $e->getMessage()
                ], 500);
            }
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Menghapus data cabang
     */
    public function destroy($id)
    {
        try {
            Cabang::destroy($id);
            return redirect()->back()->with('success', 'Cabang berhasil dihapus');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menghapus cabang: ' . $e->getMessage());
        }
    }

    public function apiList()
    {
        return response()->json([
            'status' => 'success',
            'data' => Cabang::orderBy('nama_cabang')->get(),
        ]);
    }

    public function apiStore(Request $request)
    {
        $request->validate([
            'kode_cabang'  => 'required|unique:cabangs,kode_cabang',
            'nama_cabang'  => 'required',
            'status_pusat' => 'required|in:PUSAT,CABANG',
            'latitude'     => 'required|numeric',
            'longitude'    => 'required|numeric',
            'radius'       => 'required|numeric',
            'alamat'       => 'nullable',
        ]);

        try {
            $cabang = Cabang::create($request->all());
            return response()->json([
                'status' => 'success',
                'message' => 'Cabang berhasil ditambahkan',
                'data' => $cabang,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menambah cabang: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function apiUpdate(Request $request, $id)
    {
        $request->validate([
            'kode_cabang'  => 'required|unique:cabangs,kode_cabang,' . $id,
            'nama_cabang'  => 'required',
            'status_pusat' => 'required|in:PUSAT,CABANG',
            'latitude'     => 'required|numeric',
            'longitude'    => 'required|numeric',
            'radius'       => 'required|numeric',
            'alamat'       => 'nullable',
        ]);

        try {
            $cabang = Cabang::findOrFail($id);
            $cabang->update($request->all());
            return response()->json([
                'status' => 'success',
                'message' => 'Cabang berhasil diperbarui',
                'data' => $cabang,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memperbarui cabang: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function apiDestroy($id)
    {
        try {
            Cabang::destroy($id);
            return response()->json([
                'status' => 'success',
                'message' => 'Cabang berhasil dihapus',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menghapus cabang: ' . $e->getMessage(),
            ], 500);
        }
    }
}