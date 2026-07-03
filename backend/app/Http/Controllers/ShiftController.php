<?php

namespace App\Http\Controllers;

use App\Models\Shift;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ShiftController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $shifts = Shift::orderBy('nama_shift', 'asc')->get();
        return view('shift.index', compact('shifts'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // 1. Validasi Input
        $validator = Validator::make($request->all(), [
            'nama_shift' => 'required|string|max:255',
            'kode_shift' => 'nullable|string|max:50|unique:shifts,kode_shift',
            'jam_masuk'  => 'required',
            'jam_pulang' => 'required',
            'toleransi'  => 'required|integer|min:0|max:60',
            'status'     => 'required|in:AKTIF,NONAKTIF',
            'keterangan' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        try {
            // 2. Ambil hanya data yang ada di form (TANPA total_jam)
            // Ini akan memastikan Laravel tidak mengirim kolom 'total_jam' ke MySQL
            $data = $request->only([
                'nama_shift',
                'kode_shift',
                'jam_masuk',
                'jam_pulang',
                'toleransi',
                'status',
                'keterangan'
            ]);

            // 3. Simpan ke Database
            Shift::create($data);

            return response()->json([
                'success' => true,
                'message' => 'Shift berhasil ditambahkan'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan shift: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $shift = Shift::findOrFail($id);
            return response()->json([
                'success' => true,
                'data'    => $shift
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Shift tidak ditemukan'
            ], 404);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $shift = Shift::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'nama_shift' => 'required|string|max:255',
            'kode_shift' => 'nullable|string|max:50|unique:shifts,kode_shift,' . $id,
            'jam_masuk'  => 'required|date_format:H:i',
            'jam_pulang' => 'required|date_format:H:i',
            'toleransi'  => 'required|integer|min:0|max:60',
            'status'     => 'required|in:AKTIF,NONAKTIF',
            'keterangan' => 'nullable|string'
        ], [
            'nama_shift.required'   => 'Nama shift harus diisi',
            'kode_shift.unique'     => 'Kode shift sudah digunakan',
            'jam_masuk.required'    => 'Jam masuk harus diisi',
            'jam_pulang.required'   => 'Jam pulang harus diisi',
            'toleransi.required'    => 'Toleransi keterlambatan harus diisi',
            'status.required'       => 'Status harus dipilih'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        try {
            // Update data, total_jam akan dihitung ulang otomatis oleh Model
            $shift->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Shift berhasil diperbarui'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui shift: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $shift = Shift::findOrFail($id);
            $shift->delete();

            return response()->json([
                'success' => true,
                'message' => 'Shift berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus shift: ' . $e->getMessage()
            ], 500);
        }
    }

    public function apiIndex()
    {
        return response()->json([
            'status' => 'success',
            'data' => Shift::orderBy('nama_shift')->get(),
        ]);
    }

    public function apiAktif()
    {
        return response()->json([
            'status' => 'success',
            'data' => Shift::where('status', 'AKTIF')->orderBy('nama_shift')->get(),
        ]);
    }
}
