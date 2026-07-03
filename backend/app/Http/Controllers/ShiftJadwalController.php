<?php

namespace App\Http\Controllers;

use App\Models\ShiftJadwal;
use App\Models\Shift;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class ShiftJadwalController extends Controller
{
    public function index(Request $request)
    {
        $bulan = $request->get('bulan', Carbon::now()->month);
        $tahun = $request->get('tahun', Carbon::now()->year);
        $userId = $request->get('user_id');

        $query = ShiftJadwal::with(['user', 'shift']);

        if ($userId) {
            $query->where('user_id', $userId);
        }

        if ($bulan && $tahun) {
            $query->whereMonth('tanggal', $bulan)
                  ->whereYear('tanggal', $tahun);
        }

        $jadwals = $query->orderBy('tanggal', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $jadwals
        ]);
    }

    public function store(Request $request)
    {
        $rules = [
            'user_id' => 'required|exists:users,id',
            'tanggal' => 'required|date',
            'keterangan' => 'nullable|string'
        ];

        if ($request->is_libur) {
            $rules['is_libur'] = 'in:true,false,1,0';
        } else {
            $rules['shift_id'] = 'required|exists:shifts,id';
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            if ($request->is_libur) {
                ShiftJadwal::updateOrCreate(
                    ['user_id' => $request->user_id, 'tanggal' => $request->tanggal],
                    ['is_libur' => true, 'shift_id' => null, 'keterangan' => $request->keterangan]
                );
            } else {
                $existing = ShiftJadwal::where('user_id', $request->user_id)
                    ->where('tanggal', $request->tanggal)
                    ->where('shift_id', $request->shift_id)
                    ->first();

                if ($existing) {
                    $existing->update([
                        'keterangan' => $request->keterangan,
                        'is_libur' => false
                    ]);
                } else {
                    ShiftJadwal::create([
                        'user_id' => $request->user_id,
                        'shift_id' => $request->shift_id,
                        'tanggal' => $request->tanggal,
                        'keterangan' => $request->keterangan,
                        'is_libur' => false
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Jadwal shift berhasil disimpan'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function createMultiple(Request $request)
    {
        $rules = [
            'user_id' => 'required|exists:users,id',
            'tanggal_list' => 'required|array',
            'tanggal_list.*' => 'required|date',
            'keterangan' => 'nullable|string'
        ];

        if ($request->is_libur) {
            $rules['is_libur'] = 'in:true,false,1,0';
        } else {
            $rules['shift_id'] = 'required|exists:shifts,id';
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $count = 0;
            foreach ($request->tanggal_list as $tanggal) {
                if ($request->is_libur) {
                    ShiftJadwal::updateOrCreate(
                        ['user_id' => $request->user_id, 'tanggal' => $tanggal],
                        ['is_libur' => true, 'shift_id' => null, 'keterangan' => $request->keterangan]
                    );
                } else {
                    ShiftJadwal::firstOrCreate(
                        [
                            'user_id' => $request->user_id,
                            'tanggal' => $tanggal,
                            'shift_id' => $request->shift_id
                        ],
                        [
                            'keterangan' => $request->keterangan,
                            'is_libur' => false
                        ]
                    );
                }
                $count++;
            }

            return response()->json([
                'success' => true,
                'message' => "Jadwal shift berhasil dibuat untuk {$count} hari"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $jadwal = ShiftJadwal::findOrFail($id);
            $jadwal->delete();

            return response()->json([
                'success' => true,
                'message' => 'Jadwal shift berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus: ' . $e->getMessage()
            ], 500);
        }
    }

    public function indexPage()
    {
        $karyawan = User::where('role', 'KARYAWAN')->where('status', 'AKTIF')->get();
        $shifts = Shift::where('status', 'AKTIF')->get();

        return view('shift.jadwal-shift', compact('karyawan', 'shifts'));
    }

    public function getJadwalKaryawan(Request $request, $userId)
    {
        try {
            $bulan = $request->get('bulan', Carbon::now()->month);
            $tahun = $request->get('tahun', Carbon::now()->year);

            $jadwals = ShiftJadwal::where('user_id', $userId)
                ->whereMonth('tanggal', $bulan)
                ->whereYear('tanggal', $tahun)
                ->with('shift')
                ->get()
                ->groupBy(function ($item) {
                    return $item->tanggal->toDateString();
                });

            $user = User::findOrFail($userId);
            $defaultShift = $user->shift;

            return response()->json([
                'success' => true,
                'jadwals' => $jadwals,
                'default_shift' => $defaultShift
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }
}
