<?php

namespace App\Http\Controllers;

use App\Models\Kelas;
use Illuminate\Http\Request;

class KelasController extends Controller
{
    public function index()
    {
        $kelas = Kelas::latest()->get();
        return view('kelas.index', compact('kelas'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_kelas' => 'required|string|max:255|unique:kelas,nama_kelas',
        ]);

        Kelas::create($request->only('nama_kelas'));

        return response()->json([
            'status' => 'success',
            'message' => 'Kelas berhasil ditambahkan',
        ]);
    }

    public function update(Request $request, $id)
    {
        $kelas = Kelas::findOrFail($id);

        $request->validate([
            'nama_kelas' => 'required|string|max:255|unique:kelas,nama_kelas,' . $id,
        ]);

        $kelas->update($request->only('nama_kelas'));

        return response()->json([
            'status' => 'success',
            'message' => 'Kelas berhasil diperbarui',
        ]);
    }

    public function destroy($id)
    {
        $kelas = Kelas::findOrFail($id);

        if ($kelas->siswas()->count() > 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'Kelas tidak bisa dihapus karena masih memiliki ' . $kelas->siswas()->count() . ' siswa',
            ], 422);
        }

        $kelas->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Kelas berhasil dihapus',
        ]);
    }

    public function toggleStatus($id)
    {
        $kelas = Kelas::findOrFail($id);
        $kelas->status = $kelas->status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
        $kelas->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Status kelas berhasil diubah menjadi ' . $kelas->status,
        ]);
    }
}
