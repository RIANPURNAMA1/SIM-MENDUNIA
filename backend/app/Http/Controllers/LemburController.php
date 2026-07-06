<?php

namespace App\Http\Controllers;

use App\Models\Lembur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class LemburController extends Controller
{
    // --- ADMIN SECTION ---
    public function approvalIndex()
    {
        $lembur = Lembur::with(['user.divisi'])->orderBy('created_at', 'desc')->get();
        return view('admin.approval_lembur.index', compact('lembur'));
    }

    public function updateStatus(Request $request, $id)
    {
        $lembur = Lembur::findOrFail($id);
        $lembur->update(['status' => $request->status]);
        return response()->json(['message' => 'Success']);
    }


    // --- KARYAWAN SECTION ---
    public function index()
    {
        $user_id = Auth::id();
        
        $riwayat = Lembur::where('user_id', $user_id)
            ->orderBy('created_at', 'desc')
            ->get();

        $totalApproved = Lembur::where('user_id', $user_id)->where('status', 'APPROVED')->count();
        $totalPending = Lembur::where('user_id', $user_id)->where('status', 'PENDING')->count();

        return view('absensi.lembur.index', compact('riwayat', 'totalApproved', 'totalPending'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'keterangan' => 'required|string|max:1000',
            'foto_data' => 'required',
            'tipe' => 'required|in:MASUK,KELUAR' // Input hidden dari form
        ]);

        $today = Carbon::now()->toDateString();

        if ($request->tipe === 'MASUK') {
            $exists = Lembur::where('user_id', Auth::id())
                ->whereDate('jam_masuk', $today)
                ->exists();

            if ($exists) {
                return redirect()->back()->with('error', 'Anda sudah mengajukan lembur hari ini. Hanya satu kali lembur per hari.');
            }
        }

        if ($request->tipe === 'KELUAR') {
            $completed = Lembur::where('user_id', Auth::id())
                ->whereDate('jam_masuk', $today)
                ->whereNotNull('jam_keluar')
                ->exists();

            if ($completed) {
                return redirect()->back()->with('error', 'Lembur hari ini sudah selesai. Tidak bisa mengajukan lagi.');
            }
        }

        try {
            $imageData = $request->foto_data;
            $image_parts = explode(";base64,", $imageData);
            $image_base64 = base64_decode($image_parts[1]);

            $fileName = 'lembur_' . Auth::id() . '_' . time() . '.jpg';
            $destinationPath = public_path('uploads/lembur');

            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0777, true);
            }

            file_put_contents($destinationPath . '/' . $fileName, $image_base64);

            if ($request->tipe === 'MASUK') {
                // Buat data lembur baru
                Lembur::create([
                    'user_id' => Auth::id(),
                    'jam_masuk' => Carbon::now(),
                    'keterangan' => $request->keterangan,
                    'foto' => $fileName,
                    'status' => 'PENDING',
                ]);
                $msg = 'Berhasil memulai lembur!';
            } else {
                // Cari data lembur hari ini yang belum ada jam keluar
                $lembur = Lembur::where('user_id', Auth::id())
                    ->whereNull('jam_keluar')
                    ->latest()
                    ->first();

                if (!$lembur) {
                    return redirect()->back()->with('error', 'Data lembur masuk tidak ditemukan.');
                }

                $lembur->update([
                    'jam_keluar' => Carbon::now(),
                    // Gabungkan keterangan masuk dengan keterangan keluar
                    'keterangan' => $lembur->keterangan . " | Keluar: " . $request->keterangan,
                ]);
                $msg = 'Berhasil menyelesaikan lembur!';
            }

            return redirect()->back()->with('success', $msg);

        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }

    // API
    public function apiIndex(Request $request)
    {
        $query = Lembur::with(['user.divisi']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('user', fn($q) => $q->where('name', 'like', "%{$search}%")
                ->orWhere('nip', 'like', "%{$search}%"));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $perPage = $request->per_page ?? 50;
        $data = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $data->items(),
            'pagination' => [
                'current_page' => $data->currentPage(),
                'last_page' => $data->lastPage(),
                'total' => $data->total(),
                'per_page' => $data->perPage(),
            ],
        ]);
    }

    public function apiUpdateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:PENDING,APPROVED,REJECTED',
        ]);

        $lembur = Lembur::findOrFail($id);
        $lembur->update(['status' => $request->status]);

        return response()->json([
            'status' => 'success',
            'message' => 'Status lembur berhasil diperbarui',
        ]);
    }

    // ——— API untuk Karyawan ———

    public function apiAktif()
    {
        $lembur = Lembur::where('user_id', Auth::id())
            ->whereNull('jam_keluar')
            ->latest()
            ->first();

        return response()->json([
            'status' => 'success',
            'data' => $lembur,
        ]);
    }

    public function apiSaya()
    {
        $riwayat = Lembur::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $riwayat,
        ]);
    }

    public function apiStore(Request $request)
    {
        $request->validate([
            'keterangan' => 'required|string|max:1000',
            'foto' => 'required',
            'tipe' => 'required|in:MASUK,KELUAR',
        ]);

        $today = Carbon::now()->toDateString();

        if ($request->tipe === 'MASUK') {
            $exists = Lembur::where('user_id', Auth::id())
                ->whereDate('jam_masuk', $today)
                ->exists();

            if ($exists) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Anda sudah mengajukan lembur hari ini. Hanya satu kali lembur per hari.',
                ], 422);
            }
        }

        if ($request->tipe === 'KELUAR') {
            $completed = Lembur::where('user_id', Auth::id())
                ->whereDate('jam_masuk', $today)
                ->whereNotNull('jam_keluar')
                ->exists();

            if ($completed) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Lembur hari ini sudah selesai. Tidak bisa mengajukan lagi.',
                ], 422);
            }
        }

        try {
            $foto = $request->foto;
            $fileName = 'lembur_' . Auth::id() . '_' . time() . '.jpg';
            $destinationPath = public_path('uploads/lembur');

            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0777, true);
            }

            // Handle base64 image
            if (str_starts_with($foto, 'data:image')) {
                $image_parts = explode(";base64,", $foto);
                $image_base64 = base64_decode($image_parts[1]);
                file_put_contents($destinationPath . '/' . $fileName, $image_base64);
            } else {
                $fileName = $foto;
            }

            if ($request->tipe === 'MASUK') {
                $lembur = Lembur::create([
                    'user_id' => Auth::id(),
                    'jam_masuk' => Carbon::now(),
                    'keterangan' => $request->keterangan,
                    'foto' => $fileName,
                    'status' => 'PENDING',
                ]);
                $msg = 'Berhasil memulai lembur!';
            } else {
                $lembur = Lembur::where('user_id', Auth::id())
                    ->whereNull('jam_keluar')
                    ->latest()
                    ->first();

                if (!$lembur) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Data lembur masuk tidak ditemukan.',
                    ], 404);
                }

                $lembur->update([
                    'jam_keluar' => Carbon::now(),
                    'keterangan' => $lembur->keterangan . ' | Keluar: ' . $request->keterangan,
                ]);
                $msg = 'Berhasil menyelesaikan lembur!';
            }

            return response()->json([
                'status' => 'success',
                'message' => $msg,
                'data' => $lembur ?? null,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ], 500);
        }
    }
}