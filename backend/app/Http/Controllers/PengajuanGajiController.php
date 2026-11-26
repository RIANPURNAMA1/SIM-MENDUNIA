<?php

namespace App\Http\Controllers;

use App\Models\AbsensiSensei;
use App\Models\HariLibur;
use App\Models\KelasSensei;
use App\Models\PengajuanGaji;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PengajuanGajiController extends Controller
{
    private const BULAN = [
        1 => 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];

    /** Minimal pertemuan yang belum diajukan agar sensei boleh mengajukan gaji. */
    public const MIN_PERTEMUAN = 5;

    /** Status absensi sensei yang dihitung sebagai pertemuan mengajar. */
    public const STATUS_DIHITUNG = ['HADIR', 'TERLAMBAT', 'PULANG LEBIH AWAL'];

    /** Status pengajuan yang belum di-ACC (masih memblokir pengajuan baru). */
    private const STATUS_BELUM_ACC = ['pending', 'diproses'];

    public function index(Request $request)
    {
        $user = Auth::user();

        $query = PengajuanGaji::with([
            'user:id,name,email,nama_rekening,no_rekening,bank,rekening_list',
            'kelasSensei:id,nama_kelas,level,batch_id,tanggal_mulai,tanggal_selesai',
            'kelasSensei.batchRelasi:id,nama_batch',
        ])->orderBy('created_at', 'desc');

        if ($request->boolean('my')) {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('keterangan', 'like', "%$s%")
                    ->orWhere('bulan', 'like', "%$s%")
                    ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%$s%"));
            });
        }

        $perPage = max(1, (int) $request->input('per_page', 15));

        return response()->json($query->paginate($perPage)->withQueryString());
    }

    /**
     * Status kelayakan pengajuan gaji sensei yang login: apakah masih ada
     * pengajuan yang belum di-ACC, dan per kelas berapa pertemuan yang belum diajukan.
     */
    public function eligibility()
    {
        $userId = Auth::id();
        $pending = $this->pendingPengajuan($userId);
        $claimed = $this->claimedAbsensiIds($userId);

        // Hanya kelas yang masih aktif diajar (status aktif & hari ini dalam periode kelas).
        $kelasList = KelasSensei::with('batchRelasi:id,nama_batch')
            ->where('user_id', $userId)
            ->aktif()
            ->orderByDesc('tanggal_mulai')
            ->get()
            ->map(function (KelasSensei $kelas) use ($userId, $claimed) {
                $semua = $this->pertemuanKelas($kelas, $userId);
                $belum = $semua->reject(fn ($p) => in_array($p['id'], $claimed, true))->values();

                return [
                    'id' => $kelas->id,
                    'nama' => $kelas->batchRelasi?->nama_batch ?: $kelas->nama_kelas,
                    'level' => $kelas->level,
                    'tanggal_mulai' => $kelas->tanggal_mulai?->toDateString(),
                    'tanggal_selesai' => $kelas->tanggal_selesai?->toDateString(),
                    'periode' => $this->formatPeriode($kelas),
                    'total_pertemuan' => $semua->count(),
                    'sudah_diajukan' => $semua->count() - $belum->count(),
                    'belum_diajukan' => $belum->count(),
                    'pertemuan' => $belum,
                ];
            })
            ->values();

        return response()->json([
            'min_pertemuan' => self::MIN_PERTEMUAN,
            'has_pending' => (bool) $pending,
            'pending' => $pending ? [
                'id' => $pending->id,
                'status' => $pending->status,
                'created_at' => $pending->created_at,
                'jumlah_pertemuan' => $pending->jumlah_pertemuan,
            ] : null,
            'kelas' => $kelasList,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'bulan' => 'nullable|string|max:20',
            'tahun' => 'nullable|integer|min:2000|max:2100',
            'jumlah' => 'nullable|numeric|min:0',
            'keterangan' => 'nullable|string|max:1000',
            'ringkasan_kehadiran' => 'nullable',
            'no_req_list' => 'nullable',
            'selected_kelas_id' => 'required|integer',
            'selected_kelas_name' => 'nullable',
        ], [
            'selected_kelas_id.required' => 'Pilih kelas yang akan diajukan terlebih dahulu.',
        ]);

        $userId = Auth::id();
        $kelas = KelasSensei::with('batchRelasi:id,nama_batch')
            ->where('user_id', $userId)
            ->aktif()
            ->find($validated['selected_kelas_id']);

        if (!$kelas) {
            return response()->json(['message' => 'Kelas tidak ditemukan, bukan kelas Anda, atau sudah tidak aktif.'], 422);
        }

        $ringkasan = null;
        if ($request->filled('ringkasan_kehadiran')) {
            $decoded = is_array($request->input('ringkasan_kehadiran'))
                ? $request->input('ringkasan_kehadiran')
                : json_decode($request->input('ringkasan_kehadiran'), true);
            $ringkasan = is_array($decoded) ? $decoded : null;
        }

        $noReqList = null;
        if ($request->filled('no_req_list')) {
            $decoded = is_array($request->input('no_req_list'))
                ? $request->input('no_req_list')
                : json_decode($request->input('no_req_list'), true);
            if (is_array($decoded)) {
                $noReqList = array_values(array_filter($decoded, fn($v) => is_string($v) && trim($v) !== ''));
            }
        }

        $result = DB::transaction(function () use ($userId, $kelas, $validated, $ringkasan, $noReqList) {
            // Kunci baris pengajuan milik user agar dua request bersamaan tidak lolos bersamaan.
            PengajuanGaji::where('user_id', $userId)->lockForUpdate()->get(['id']);

            if ($this->pendingPengajuan($userId)) {
                return ['error' => 'Masih ada pengajuan gaji yang belum disetujui. Anda bisa mengajukan lagi setelah pengajuan sebelumnya di-ACC.'];
            }

            $claimed = $this->claimedAbsensiIds($userId);
            $belum = $this->pertemuanKelas($kelas, $userId)
                ->reject(fn ($p) => in_array($p['id'], $claimed, true))
                ->values();

            if ($belum->count() < self::MIN_PERTEMUAN) {
                return ['error' => sprintf(
                    'Pengajuan minimal %d pertemuan yang belum diajukan. Kelas ini baru memiliki %d pertemuan.',
                    self::MIN_PERTEMUAN,
                    $belum->count()
                )];
            }

            // Riwayat yang dikirim selalu pertemuan yang belum diajukan (dihitung server).
            $ringkasan = $ringkasan ?? [];
            $ringkasan['riwayat'] = $belum->map(fn ($p) => $p + [
                'kelas_id' => $kelas->id,
                'kelas' => $kelas->batchRelasi?->nama_batch ?: $kelas->nama_kelas,
            ])->all();
            $ringkasan['kelas_diajukan'] = [
                'id' => $kelas->id,
                'nama_batch' => $kelas->batchRelasi?->nama_batch ?: $kelas->nama_kelas,
                'level' => $kelas->level,
                'periode' => $this->formatPeriode($kelas),
            ];

            $pengajuan = PengajuanGaji::create([
                'user_id' => $userId,
                'kelas_sensei_id' => $kelas->id,
                'absensi_sensei_ids' => $belum->pluck('id')->all(),
                'jumlah_pertemuan' => $belum->count(),
                'bulan' => $validated['bulan'] ?? self::BULAN[(int) now()->format('n')],
                'tahun' => $validated['tahun'] ?? (int) now()->format('Y'),
                'jumlah' => $validated['jumlah'] ?? null,
                'keterangan' => $validated['keterangan'] ?? null,
                'no_req_list' => $noReqList,
                'status' => 'pending',
                'ringkasan_kehadiran' => $ringkasan,
            ]);

            return ['pengajuan' => $pengajuan];
        });

        if (isset($result['error'])) {
            return response()->json(['message' => $result['error']], 422);
        }

        $pengajuan = $result['pengajuan'];

        try {
            $waService = app(\App\Services\WhatsAppService::class);
            $waService->sendPengajuanGajiToAdmin($pengajuan);
        } catch (\Exception $e) {
            \Log::error('Gagal kirim notifikasi WA pengajuan gaji: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Pengajuan gaji terkirim, menunggu disetujui admin',
            'data' => $pengajuan->load('user:id,name,email'),
        ], 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,diproses,disetujui,ditolak',
            'catatan' => 'nullable|string|max:1000',
        ]);

        $pengajuan = PengajuanGaji::findOrFail($id);

        // Pengajuan yang ditolak melepas pertemuannya. Jika diaktifkan kembali, pastikan
        // pertemuan itu belum dipakai pengajuan lain agar tidak terhitung dua kali.
        if ($pengajuan->status === 'ditolak' && $validated['status'] !== 'ditolak') {
            $dipakaiLain = $this->claimedAbsensiIds($pengajuan->user_id, $pengajuan->id);
            if (array_intersect($pengajuan->claimedAbsensiIds(), $dipakaiLain)) {
                return response()->json([
                    'message' => 'Sebagian pertemuan pada pengajuan ini sudah diajukan di pengajuan lain, sehingga tidak bisa diaktifkan kembali.',
                ], 422);
            }
        }

        $pengajuan->update([
            'status' => $validated['status'],
            'catatan' => $validated['catatan'] ?? $pengajuan->catatan,
        ]);

        return response()->json([
            'message' => 'Status pengajuan gaji diperbarui',
            'data' => $pengajuan->load('user:id,name,email'),
        ]);
    }

    private function pendingPengajuan(int $userId): ?PengajuanGaji
    {
        return PengajuanGaji::where('user_id', $userId)
            ->whereIn('status', self::STATUS_BELUM_ACC)
            ->latest()
            ->first();
    }

    /** Semua id absensi yang sudah dipakai pengajuan (selain yang ditolak). */
    private function claimedAbsensiIds(int $userId, ?int $exceptPengajuanId = null): array
    {
        return PengajuanGaji::where('user_id', $userId)
            ->where('status', '!=', 'ditolak')
            ->when($exceptPengajuanId, fn ($q) => $q->where('id', '!=', $exceptPengajuanId))
            ->get(['id', 'absensi_sensei_ids', 'ringkasan_kehadiran'])
            ->flatMap(fn (PengajuanGaji $p) => $p->claimedAbsensiIds())
            ->unique()
            ->values()
            ->all();
    }

    /**
     * Pertemuan mengajar sensei di kelas ini, dihitung dari tanggal mulai s/d
     * tanggal selesai kelas (hari libur & akhir pekan tidak dihitung).
     */
    private function pertemuanKelas(KelasSensei $kelas, int $userId)
    {
        $mulai = Carbon::parse($kelas->tanggal_mulai)->startOfDay();
        $selesai = Carbon::parse($kelas->tanggal_selesai)->startOfDay();

        return AbsensiSensei::where('kelas_sensei_id', $kelas->id)
            ->where('user_id', $userId)
            ->whereIn('status', self::STATUS_DIHITUNG)
            ->whereDate('tanggal', '>=', $mulai->toDateString())
            ->whereDate('tanggal', '<=', $selesai->toDateString())
            ->orderBy('tanggal')
            ->orderBy('jam_masuk')
            ->get()
            ->reject(fn ($a) => HariLibur::apakahLibur(Carbon::parse($a->tanggal)->toDateString()))
            ->map(function (AbsensiSensei $a) use ($mulai) {
                $tanggal = Carbon::parse($a->tanggal)->startOfDay();
                $ke = 1;
                for ($d = $mulai->copy(); $d->lt($tanggal); $d->addDay()) {
                    if (!$d->isWeekend() && !HariLibur::apakahLibur($d->toDateString())) {
                        $ke++;
                    }
                }

                return [
                    'id' => (int) $a->id,
                    'tanggal' => $tanggal->toDateString(),
                    'jam_masuk' => $a->jam_masuk,
                    'jam_keluar' => $a->jam_keluar,
                    'status' => $a->status,
                    'pertemuan_ke' => $ke,
                ];
            })
            ->values();
    }

    private function formatPeriode(KelasSensei $kelas): string
    {
        $fmt = fn ($d) => $d ? Carbon::parse($d)->locale('id')->translatedFormat('d M Y') : '?';

        return $fmt($kelas->tanggal_mulai) . ' – ' . $fmt($kelas->tanggal_selesai);
    }
}
