<?php

namespace App\Http\Controllers\Absensi;

use App\Models\Absensi;
use App\Models\User;
use App\Models\Cabang;
use App\Models\Divisi;
use App\Models\HariLibur;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;

class KehadiranController extends Controller
{
    public function index(Request $request)
    {
        $list_cabang = \App\Models\Cabang::all();
        $list_divisi = \App\Models\Divisi::all();

        $tanggal    = $request->tanggal ?? now('Asia/Jakarta')->toDateString();
        $start_date = $request->start_date ?? now('Asia/Jakarta')->startOfMonth()->toDateString();
        $end_date   = $request->end_date ?? now('Asia/Jakarta')->endOfMonth()->toDateString();

        $cabang_id  = $request->cabang_id;
        $divisi_id  = $request->divisi_id;
        $status     = $request->status;

        $absensis = \App\Models\Absensi::with(['user.shift', 'user.divisi', 'cabang'])
            ->whereBetween('tanggal', [$start_date, $end_date])
            ->whereHas('user', fn ($q) => $q->where('status', 'AKTIF'))
            ->whereDoesntHave('user.kelasSensei')
            ->when($status, function ($query) use ($status) {
                return $query->where('status', $status);
            })
            ->when($cabang_id, function ($query) use ($cabang_id) {
                return $query->whereHas('user', function ($q) use ($cabang_id) {
                    $q->where('cabang_id', $cabang_id);
                });
            })
            ->when($divisi_id, function ($query) use ($divisi_id) {
                return $query->whereHas('user', function ($q) use ($divisi_id) {
                    $q->where('divisi_id', $divisi_id);
                });
            })
            ->orderBy('tanggal', 'desc')
            ->orderBy('jam_masuk', 'asc')
            ->get();

        return view('admin.kehadiran.index', [
            'absensis'    => $absensis,
            'start_date'  => $start_date,
            'end_date'    => $end_date,
            'tanggal'     => $tanggal,
            'list_cabang' => $list_cabang,
            'list_divisi' => $list_divisi,
            'status_selected' => $status
        ]);
    }

    public function updateStatus(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:absensis,id',
            'status' => 'required|in:HADIR,TERLAMBAT,IZIN,ALPA,PULANG LEBIH AWAL,LIBUR',
        ]);

        $absen = Absensi::findOrFail($request->id);

        $updateData = ['status' => $request->status];

        if ($request->status === 'HADIR') {
            $shift = $absen->shift;
            if ($shift) {
                $updateData['jam_masuk'] = $shift->jam_masuk;
                $updateData['jam_keluar'] = $shift->jam_pulang;
            }
        }

        $absen->update($updateData);

        return back()->with('success', 'Status absensi berhasil diperbarui');
    }

    private function generateVirtualAbsensis($start_date, $end_date, $cabang_id, $divisi_id, $status, $search = null)
    {
        $today = Carbon::today('Asia/Jakarta');
        $start = Carbon::parse($start_date);
        $end = Carbon::parse($end_date);

        // Ambil user aktif yang memenuhi kriteria (sama seperti query asli apiIndex)
        $users = User::where('status', 'AKTIF')
            ->whereDoesntHave('kelasSensei')
            ->when($cabang_id, fn($q) => $q->where('cabang_id', $cabang_id))
            ->when($divisi_id, fn($q) => $q->where('divisi_id', $divisi_id))
            ->when($search, fn($q) => $q->where(function ($qq) use ($search) {
                $qq->where('name', 'like', "%{$search}%")->orWhere('nip', 'like', "%{$search}%");
            }))
            ->get();

        // Ambil absensi yang sudah ada di DB untuk range tanggal ini
        $existingAbsensis = Absensi::whereBetween('tanggal', [$start_date, $end_date])
            ->whereHas('user', fn($q) => $q->where('status', 'AKTIF'))
            ->whereDoesntHave('user.kelasSensei')
            ->when($cabang_id, fn($q) => $q->whereHas('user', fn($qq) => $qq->where('cabang_id', $cabang_id)))
            ->when($divisi_id, fn($q) => $q->whereHas('user', fn($qq) => $qq->where('divisi_id', $divisi_id)))
            ->get()
            ->keyBy(fn($a) => $a->user_id . '_' . $a->tanggal->format('Y-m-d') . '_' . ($a->shift_id ?? 0));

        $todayEnd = Carbon::today('Asia/Jakarta');
        $virtual = [];
        $idCounter = 0;

        foreach ($users as $user) {
            $userShifts = $user->shifts;
            if ($userShifts->isEmpty() && $user->shift) {
                $userShifts = collect([$user->shift]);
            }
            if ($userShifts->isEmpty()) continue;

            // Load divisi once for all virtual records of this user
            $divisi = $user->divisi;

            $date = $start->copy();
            while ($date->lte($end)) {
                $dateStr = $date->format('Y-m-d');

                // Hanya generate untuk hari <= hari ini
                if ($date->gt($todayEnd)) {
                    $date->addDay();
                    continue;
                }

                foreach ($userShifts as $shift) {
                    $key = $user->id . '_' . $dateStr . '_' . ($shift->id ?? 0);
                    if (isset($existingAbsensis[$key])) continue;

                    $isLibur = HariLibur::apakahLibur($dateStr);
                    $statusLabel = $isLibur ? 'LIBUR' : 'ALPA';
                    $keterangan = $isLibur
                        ? 'Libur otomatis (Weekend/Nasional)'
                        : 'Tidak melakukan absensi seharian';

                    $virtual[] = [
                        'id' => 'virtual_' . ($idCounter++),
                        'user_id' => $user->id,
                        'shift_id' => $shift->id,
                        'cabang_id' => $user->cabang_id ?? ($user->cabang_ids[0] ?? null),
                        'izin_id' => null,
                        'tanggal' => $dateStr,
                        'jam_masuk' => null,
                        'jam_keluar' => null,
                        'lat_masuk' => null,
                        'long_masuk' => null,
                        'lat_pulang' => null,
                        'long_pulang' => null,
                        'status' => $statusLabel,
                        'foto_masuk' => null,
                        'foto_pulang' => null,
                        'keterangan' => $keterangan,
                        'user' => [
                            'id' => $user->id,
                            'name' => $user->name,
                            'nip' => $user->nip,
                            'shift' => $user->shift ? ['nama_shift' => $user->shift->nama_shift] : null,
                            'divisi' => $divisi ? ['nama_divisi' => $divisi->nama_divisi] : null,
                        ],
                        'shift' => [
                            'id' => $shift->id,
                            'nama_shift' => $shift->nama_shift,
                        ],
                        'cabang' => null,
                    ];
                }

                $date->addDay();
            }
        }

        return $virtual;
    }

    // API
    public function apiIndex(Request $request)
    {
        $start_date = $request->start_date ?? now('Asia/Jakarta')->startOfMonth()->toDateString();
        $end_date   = $request->end_date ?? now('Asia/Jakarta')->endOfMonth()->toDateString();
        $cabang_id  = $request->cabang_id;
        $divisi_id  = $request->divisi_id;
        $status     = $request->status;
        $search     = $request->search;

        // Ambil absensi yang sudah ada di DB
        $absensis = Absensi::with(['user.shift', 'user.divisi', 'cabang', 'shift'])
            ->whereBetween('tanggal', [$start_date, $end_date])
            ->whereHas('user', fn($q) => $q->where('status', 'AKTIF'))
            ->whereDoesntHave('user.kelasSensei')
            ->when($search, fn($q) => $q->whereHas('user', fn($qq) => $qq->where('name', 'like', "%{$search}%")->orWhere('nip', 'like', "%{$search}%")))
            ->when($status, fn($q) => $q->where('status', $status))
            ->when($cabang_id, fn($q) => $q->whereHas('user', fn($qq) => $qq->where('cabang_id', $cabang_id)))
            ->when($divisi_id, fn($q) => $q->whereHas('user', fn($qq) => $qq->where('divisi_id', $divisi_id)))
            ->orderBy('tanggal', 'desc')
            ->orderBy('jam_masuk', 'asc')
            ->get()
            ->toArray();

        // Generate virtual ALPA/LIBUR untuk hari yang tidak ada absensi
        // Hanya jika tidak ada filter status spesifik (jika filter status dipilih, hormati)
        if (!$status) {
            $virtual = $this->generateVirtualAbsensis($start_date, $end_date, $cabang_id, $divisi_id, $status, $search);

            // Filter virtual records berdasarkan status yang diminta (jika ada)
            $filteredVirtual = $virtual;
            if ($status) {
                $filteredVirtual = array_filter($virtual, fn($v) => $v->status === $status);
            }

            // Gabung real + virtual, urutkan
            $allData = array_merge($absensis, $filteredVirtual);
            usort($allData, function ($a, $b) {
                $dateA = $a['tanggal'];
                $dateB = $b['tanggal'];
                $cmp = strcmp($dateB, $dateA);
                if ($cmp !== 0) return $cmp;
                $jamA = $a['jam_masuk'] ?? '';
                $jamB = $b['jam_masuk'] ?? '';
                return strcmp($jamA, $jamB);
            });

            $absensis = $allData;
        }

        $list_cabang = Cabang::all();
        $list_divisi = Divisi::all();

        return response()->json([
            'status' => 'success',
            'data' => $absensis,
            'list_cabang' => $list_cabang,
            'list_divisi' => $list_divisi,
        ]);
    }

    public function updateStatusApi(Request $request)
    {
        $request->validate([
            'id' => 'required',
            'status' => 'required|in:HADIR,TERLAMBAT,IZIN,ALPA,PULANG LEBIH AWAL,LIBUR',
            'user_id' => 'required_if:id,virtual_*|exists:users,id',
            'tanggal' => 'required_if:id,virtual_*|date',
            'shift_id' => 'nullable|exists:shifts,id',
        ]);

        $absen = null;
        if (is_numeric($request->id)) {
            $absen = Absensi::findOrFail($request->id);
        } elseif (str_starts_with($request->id, 'virtual_')) {
            // Cari atau buat record absensi baru
            $absen = Absensi::firstOrNew([
                'user_id' => $request->user_id,
                'tanggal' => $request->tanggal,
                'shift_id' => $request->shift_id,
            ]);
            if (!$absen->exists) {
                $absen->cabang_id = User::find($request->user_id)?->cabang_id;
            }
        } else {
            return response()->json(['message' => 'ID absensi tidak valid'], 400);
        }

        $updateData = ['status' => $request->status];

        if ($request->status === 'HADIR') {
            $shift = $absen->shift ?? ($request->shift_id ? \App\Models\Shift::find($request->shift_id) : null);
            if ($shift) {
                $updateData['jam_masuk'] = $shift->jam_masuk;
                $updateData['jam_keluar'] = $shift->jam_pulang;
            }
        }

        $absen->fill($updateData)->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Status absensi berhasil diperbarui',
        ]);
    }
}
