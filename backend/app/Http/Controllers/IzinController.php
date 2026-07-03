<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Izin;
use App\Models\IzinApproval;
use App\Models\WaIzinApproval;
use App\Services\IzinApprovalService as ServicesIzinApprovalService;
use App\Services\WhatsAppService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use IzinApprovalService;

class IzinController extends Controller
{
    public function create()
    {
        return view('absensi.izin.create'); // Menampilkan view form yang kita buat sebelumnya
    }



    public function approvalList()
    {
        $izins = Izin::with('user')
            ->latest()
            ->get();

        return view('admin.izin.index', compact('izins'));
    }


    public function approve($id)
    {
        $izin = Izin::findOrFail($id);

        if ($izin->status !== 'PENDING') {
            return back()->with('error', 'Izin sudah diproses');
        }

        if (!auth()->user()->isHR() && !auth()->user()->isManager() && !auth()->user()->isGuru()) {
            abort(403, 'Tidak punya akses approval');
        }

        DB::transaction(function () use ($izin) {

            // 1️⃣ Update status izin utama
            $izin->update([
                'status' => 'APPROVED'
            ]);

            // 2️⃣ Simpan log approval
            IzinApproval::create([
                'izin_id'     => $izin->id,
                'approved_by' => auth()->id(),
                'status'      => 'APPROVED',
                'approved_at' => now(),
            ]);

            // 3️⃣ Generate absensi otomatis
            if ($izin->user->isSiswa()) {
                $siswa = $izin->user->siswa;
                if ($siswa) {
                    $dates = $izin->getTanggalRange();
                    foreach ($dates as $date) {
                        \App\Models\AbsensiSiswa::firstOrCreate(
                            ['siswa_id' => $siswa->id, 'tanggal' => $date->toDateString()],
                            [
                                'status' => $izin->jenis_izin === 'SAKIT' ? 'SAKIT' : 'IZIN',
                                'keterangan' => $izin->alasan,
                            ]
                        );
                    }
                }
            } else {
                ServicesIzinApprovalService::generateAbsensi($izin);
            }
        });

        return back()->with('success', 'Izin disetujui & absensi otomatis dibuat');
    }


    public function reject(Request $request, $id)
    {
        $izin = Izin::findOrFail($id);

        if ($izin->status !== 'PENDING') {
            return back()->with('error', 'Izin sudah diproses');
        }

        if (!auth()->user()->isHR() && !auth()->user()->isManager() && !auth()->user()->isGuru()) {
            abort(403, 'Tidak punya akses approval');
        }

        DB::transaction(function () use ($izin, $request) {

            $izin->update([
                'status' => 'REJECTED'
            ]);

            IzinApproval::create([
                'izin_id'     => $izin->id,
                'approved_by' => auth()->id(),
                'status'      => 'REJECTED',
                'catatan'     => $request->catatan,
                'approved_at' => now(),
            ]);
        });

        return back()->with('success', 'Izin ditolak');
    }

    public function pendingByBatch($batchId)
    {
        $siswaIds = \App\Models\Siswa::where('batch_id', $batchId)->pluck('id');
        $userIds = \App\Models\Siswa::where('batch_id', $batchId)->pluck('user_id');

        $pendingIzins = Izin::whereIn('user_id', $userIds)
            ->where('status', 'PENDING')
            ->with('user')
            ->get()
            ->filter(function ($izin) {
                return $izin->user && $izin->user->siswa;
            })
            ->map(function ($izin) {
                $siswa = $izin->user->siswa;
                return [
                    'id' => $izin->id,
                    'siswa_id' => $siswa->id,
                    'nama' => $izin->user->name ?? $izin->user->nama ?? '-',
                    'jenis_izin' => $izin->jenis_izin,
                    'tgl_mulai' => $izin->tgl_mulai->format('Y-m-d'),
                    'tgl_selesai' => $izin->tgl_selesai->format('Y-m-d'),
                    'alasan' => $izin->alasan,
                ];
            })->values();

        return response()->json($pendingIzins);
    }

    /**
     * Menyimpan data pengajuan izin ke database
     */
    public function store(Request $request)
    {
        $userId = Auth::id();
        $today = \Carbon\Carbon::today();
        $tglMulai = $request->tgl_mulai;

        // 🔒 1. CEK: Apakah hari ini user sudah membuat pengajuan izin?
        // Pengecekan berdasarkan kolom created_at (tanggal input data)
        $sudahInputHariIni = Izin::where('user_id', $userId)
            ->whereDate('created_at', $today)
            ->exists();

        if ($sudahInputHariIni) {
            $msg = 'Anda sudah membuat pengajuan izin hari ini. Silakan ajukan kembali besok jika ada keperluan lain.';
            return $request->ajax()
                ? response()->json(['status' => 'error', 'message' => $msg], 422)
                : redirect()->back()->with('error', $msg)->withInput();
        }

        // 🔒 2. CEK: user hanya boleh punya 1 izin PENDING (Opsional, tetap dipertahankan agar tidak double)
        $izinPending = Izin::where('user_id', $userId)
            ->where('status', 'PENDING')
            ->exists();

        if ($izinPending) {
            $msg = 'Anda masih memiliki pengajuan izin yang sedang menunggu persetujuan.';
            return $request->ajax()
                ? response()->json(['status' => 'error', 'message' => $msg], 422)
                : redirect()->back()->with('error', $msg)->withInput();
        }

        // 🔒 3. CEK: Apakah sudah ada absen pada tanggal mulai izin?
        $user = Auth::user();
        if ($user->isSiswa()) {
            $siswa = $user->siswa;
            $sudahAbsen = $siswa && \App\Models\AbsensiSiswa::where('siswa_id', $siswa->id)
                ->where('tanggal', $tglMulai)
                ->exists();
        } else {
            $sudahAbsen = \App\Models\Absensi::where('user_id', $userId)
                ->where('tanggal', $tglMulai)
                ->exists();
        }

        if ($sudahAbsen) {
            $msg = 'Gagal mengajukan izin. Anda tercatat sudah melakukan absensi pada tanggal ' . \Carbon\Carbon::parse($tglMulai)->format('d-m-Y') . '.';
            return $request->ajax()
                ? response()->json(['status' => 'error', 'message' => $msg], 422)
                : redirect()->back()->with('error', $msg)->withInput();
        }

        // 3️⃣ VALIDASI INPUT
        $request->validate([
            'jenis_izin' => 'required|in:SAKIT,CUTI,IZIN',
            'tgl_mulai'   => 'required|date|after_or_equal:today',
            'tgl_selesai' => 'required|date|after_or_equal:tgl_mulai',
            'alasan'      => 'required|string|min:10',
            'lampiran'    => 'nullable|mimes:jpeg,png,jpg,pdf|max:2048',
        ], [
            'tgl_mulai.after_or_equal'   => 'Tanggal mulai tidak boleh masa lalu.',
            'tgl_selesai.after_or_equal' => 'Tanggal berakhir harus setelah atau sama dengan tanggal mulai.',
            'alasan.min'                 => 'Berikan alasan yang lebih detail (minimal 10 karakter).',
        ]);

        try {
            // 4️⃣ SIMPAN DATA IZIN
            $izin = new Izin();
            $izin->user_id     = $userId;
            $izin->jenis_izin  = $request->jenis_izin;
            $izin->tgl_mulai   = $request->tgl_mulai;
            $izin->tgl_selesai = $request->tgl_selesai;
            $izin->alasan      = $request->alasan;
            $izin->status      = 'PENDING';

            // 5️⃣ UPLOAD LAMPIRAN
            if ($request->hasFile('lampiran')) {
                $file = $request->file('lampiran');
                $namaFile = $userId . '_' . time() . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('uploads/izin'), $namaFile);
                $izin->lampiran = $namaFile;
            }

            $izin->save();

            try {
                $managerPhone = '6285773141623';
                $userName = $izin->user->name;
                $tglMulai = \Carbon\Carbon::parse($izin->tgl_mulai)->translatedFormat('d F Y');
                $tglSelesai = \Carbon\Carbon::parse($izin->tgl_selesai)->translatedFormat('d F Y');
                $periode = $izin->tgl_mulai === $izin->tgl_selesai
                    ? $tglMulai
                    : "{$tglMulai} s/d {$tglSelesai}";

                WaIzinApproval::create([
                    'izin_id' => $izin->id,
                    'manager_phone' => $managerPhone,
                    'status' => 'PENDING',
                ]);

                $waMessage = "📋 *PENGAJUAN IZIN KARYAWAN*\n\n"
                    . "Ada pengajuan izin baru:\n\n"
                    . "👤 *Nama:* {$userName}\n"
                    . "📋 *Jenis:* {$izin->jenis_izin}\n"
                    . "📅 *Tanggal:* {$periode}\n"
                    . "📝 *Alasan:* {$izin->alasan}\n\n"
                    . "Apakah Anda menyetujui izin ini?\n\n"
                    . "Balas: *IYA* untuk menyetujui ✅\n"
                    . "Balas: *TIDAK* untuk menolak ❌";

                $wa = app(WhatsAppService::class);
                $wa->sendMessage($managerPhone, $waMessage);
            } catch (\Exception $waErr) {
                Log::error('Gagal kirim WA izin: ' . $waErr->getMessage());
            }

            if ($request->ajax()) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Pengajuan izin berhasil dikirim.'
                ]);
            }

            return redirect('/absensi')->with('success', 'Pengajuan izin berhasil dikirim.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Terjadi kesalahan sistem.')->withInput();
        }
    }
    public function index()
    {
        // Mengambil data izin milik user yang sedang login saja
        $riwayatIzin = \App\Models\Izin::where('user_id', Auth::user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return view('absensi.izin.index', compact('riwayatIzin'));
    }


    public function lihatLampiran($filename)
    {
        $path = storage_path('app/public/' . $filename);

        if (!file_exists($path)) {
            dd($path); // 🔥 biar kita tahu dia nyari dimana
        }

        return response()->file($path);
    }




    // API
    public function apiIndex(Request $request)
    {
        $query = Izin::with(['user.divisi', 'approver']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('user', fn($q) => $q->where('name', 'like', "%{$search}%")
                ->orWhere('nip', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%"));
        }

        if ($request->filled('jenis_izin')) {
            $query->where('jenis_izin', $request->jenis_izin);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->where(function ($q) use ($request) {
                $q->whereBetween('tgl_mulai', [$request->start_date, $request->end_date])
                  ->orWhereBetween('tgl_selesai', [$request->start_date, $request->end_date])
                  ->orWhere(function ($qq) use ($request) {
                      $qq->where('tgl_mulai', '<=', $request->start_date)
                         ->where('tgl_selesai', '>=', $request->end_date);
                  });
            });
        }

        $perPage = $request->per_page ?? 50;
        $izins = $query->latest()->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $izins->items(),
            'pagination' => [
                'current_page' => $izins->currentPage(),
                'last_page' => $izins->lastPage(),
                'total' => $izins->total(),
                'per_page' => $izins->perPage(),
            ],
        ]);
    }

    public function apiApprove($id)
    {
        $izin = Izin::with('user')->findOrFail($id);

        if ($izin->status !== 'PENDING') {
            return response()->json(['status' => 'error', 'message' => 'Izin sudah diproses'], 422);
        }

        DB::transaction(function () use ($izin) {
            $izin->update(['status' => 'APPROVED']);

            IzinApproval::create([
                'izin_id'     => $izin->id,
                'approved_by' => 1,
                'status'      => 'APPROVED',
                'approved_at' => now(),
            ]);

            if ($izin->user && $izin->user->isSiswa()) {
                $siswa = $izin->user->siswa;
                if ($siswa) {
                    $dates = $izin->getTanggalRange();
                    foreach ($dates as $date) {
                        \App\Models\AbsensiSiswa::firstOrCreate(
                            ['siswa_id' => $siswa->id, 'tanggal' => $date->toDateString()],
                            [
                                'status' => $izin->jenis_izin === 'SAKIT' ? 'SAKIT' : 'IZIN',
                                'keterangan' => $izin->alasan,
                            ]
                        );
                    }
                }
            } else {
                ServicesIzinApprovalService::generateAbsensi($izin);
            }
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Izin disetujui & absensi otomatis dibuat',
        ]);
    }

    public function apiReject(Request $request, $id)
    {
        $izin = Izin::findOrFail($id);

        if ($izin->status !== 'PENDING') {
            return response()->json(['status' => 'error', 'message' => 'Izin sudah diproses'], 422);
        }

        DB::transaction(function () use ($izin, $request) {
            $izin->update(['status' => 'REJECTED']);

            IzinApproval::create([
                'izin_id'     => $izin->id,
                'approved_by' => 1,
                'status'      => 'REJECTED',
                'catatan'     => $request->catatan,
                'approved_at' => now(),
            ]);
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Izin ditolak',
        ]);
    }
}
