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

/**
 * Pengajuan gaji sensei per blok pertemuan.
 *
 * Pertemuan dihitung dari tanggal mulai kelas (hari kerja, tanpa akhir pekan &
 * hari libur). Pengajuan dilakukan per blok 5 pertemuan berurutan: 1–5, 6–10,
 * 11–15, dst. Sebuah blok baru bisa diajukan setelah pertemuan terakhir di blok
 * itu selesai, dan hanya boleh ada satu pengajuan yang belum di-ACC.
 */
class PengajuanGajiController extends Controller
{
    private const BULAN = [
        1 => 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];

    /** Jumlah pertemuan per satu pengajuan gaji. */
    public const MIN_PERTEMUAN = 5;

    /** Status absensi sensei yang dihitung sebagai hadir mengajar. */
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
     * Data form pengajuan: kelas aktif beserta seluruh pertemuannya (dari pertemuan 1
     * s/d hari ini), status pengajuan tiap pertemuan, dan blok berikutnya yang bisa diajukan.
     */
    public function eligibility()
    {
        $userId = Auth::id();
        $pending = $this->pendingPengajuan($userId);

        // Hanya kelas yang masih aktif diajar (status aktif & hari ini dalam periode kelas).
        $kelasList = KelasSensei::with('batchRelasi:id,nama_batch')
            ->where('user_id', $userId)
            ->aktif()
            ->orderByDesc('tanggal_mulai')
            ->get()
            ->map(fn (KelasSensei $kelas) => $this->ringkasKelas($kelas, $userId))
            ->values();

        return response()->json([
            'min_pertemuan' => self::MIN_PERTEMUAN,
            'has_pending' => (bool) $pending,
            'pending' => $pending ? [
                'id' => $pending->id,
                'status' => $pending->status,
                'created_at' => $pending->created_at,
                'jumlah_pertemuan' => $pending->jumlah_pertemuan,
                'pertemuan_dari' => $pending->pertemuan_dari,
                'pertemuan_sampai' => $pending->pertemuan_sampai,
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

            $info = $this->ringkasKelas($kelas, $userId);
            $blok = $info['blok'];
            if (!$blok) {
                return ['error' => 'Semua pertemuan di kelas ini sudah diajukan.'];
            }
            if (!$blok['siap']) {
                return ['error' => sprintf(
                    'Pengajuan pertemuan %d–%d baru bisa dilakukan setelah pertemuan ke-%d (%s) selesai.',
                    $blok['dari'], $blok['sampai'], $blok['sampai'],
                    Carbon::parse($blok['tanggal_selesai_blok'])->locale('id')->translatedFormat('d M Y')
                )];
            }

            $rows = collect($info['pertemuan'])
                ->filter(fn ($p) => $p['pertemuan_ke'] >= $blok['dari'] && $p['pertemuan_ke'] <= $blok['sampai'])
                ->values();
            $hadir = $rows->filter(fn ($p) => $p['absensi'] && in_array($p['absensi']['status'], self::STATUS_DIHITUNG, true));
            $namaKelas = $kelas->batchRelasi?->nama_batch ?: $kelas->nama_kelas;

            $ringkasan = $ringkasan ?? [];
            $ringkasan['riwayat'] = $rows->map(fn ($p) => [
                'id' => $p['absensi']['id'] ?? null,
                'tanggal' => $p['tanggal'],
                'pertemuan_ke' => $p['pertemuan_ke'],
                'status' => $p['absensi']['status'] ?? 'TIDAK ADA ABSEN',
                'jam_masuk' => $p['absensi']['jam_masuk'] ?? null,
                'jam_keluar' => $p['absensi']['jam_keluar'] ?? null,
                'kelas_id' => $kelas->id,
                'kelas' => $namaKelas,
            ])->all();
            $ringkasan['kelas_diajukan'] = [
                'id' => $kelas->id,
                'nama_batch' => $namaKelas,
                'level' => $kelas->level,
                'periode' => $info['periode'],
                'pertemuan_dari' => $blok['dari'],
                'pertemuan_sampai' => $blok['sampai'],
            ];

            $pengajuan = PengajuanGaji::create([
                'user_id' => $userId,
                'kelas_sensei_id' => $kelas->id,
                'absensi_sensei_ids' => $hadir->pluck('absensi.id')->values()->all(),
                'jumlah_pertemuan' => $hadir->count(),
                'pertemuan_dari' => $blok['dari'],
                'pertemuan_sampai' => $blok['sampai'],
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

        // Pengajuan yang ditolak melepas bloknya. Jika diaktifkan kembali, pastikan blok
        // pertemuan itu belum dipakai pengajuan lain agar tidak terbayar dua kali.
        if ($pengajuan->status === 'ditolak' && $validated['status'] !== 'ditolak' && $pengajuan->pertemuan_dari) {
            $bentrok = PengajuanGaji::where('user_id', $pengajuan->user_id)
                ->where('kelas_sensei_id', $pengajuan->kelas_sensei_id)
                ->where('id', '!=', $pengajuan->id)
                ->where('status', '!=', 'ditolak')
                ->where('pertemuan_dari', '<=', $pengajuan->pertemuan_sampai)
                ->where('pertemuan_sampai', '>=', $pengajuan->pertemuan_dari)
                ->exists();
            if ($bentrok) {
                return response()->json([
                    'message' => 'Pertemuan pada pengajuan ini sudah diajukan di pengajuan lain, sehingga tidak bisa diaktifkan kembali.',
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

    /**
     * Ringkasan satu kelas: seluruh pertemuan dari pertemuan 1 s/d hari ini,
     * status absen & pengajuan tiap pertemuan, dan blok berikutnya yang bisa diajukan.
     */
    private function ringkasKelas(KelasSensei $kelas, int $userId): array
    {
        $today = now()->startOfDay();
        $jadwal = $this->jadwalPertemuan($kelas);          // [pertemuan_ke => 'Y-m-d'] seluruh periode
        $totalPeriode = count($jadwal);

        $absensi = AbsensiSensei::where('kelas_sensei_id', $kelas->id)
            ->where('user_id', $userId)
            ->orderBy('jam_masuk')
            ->get(['id', 'tanggal', 'jam_masuk', 'jam_keluar', 'status'])
            ->groupBy(fn ($a) => Carbon::parse($a->tanggal)->toDateString())
            ->map(fn ($items) => $items->first());

        $klaim = $this->klaimPertemuan($kelas, $userId, $jadwal, $absensi);

        $rows = [];
        foreach ($jadwal as $ke => $tanggal) {
            if (Carbon::parse($tanggal)->gt($today)) {
                break;
            }
            $a = $absensi->get($tanggal);
            $rows[] = [
                'pertemuan_ke' => $ke,
                'tanggal' => $tanggal,
                // Pertemuan dianggap selesai bila harinya sudah lewat, atau hari ini & sudah absen pulang.
                'terlaksana' => Carbon::parse($tanggal)->lt($today) || ($a && $a->jam_keluar),
                'absensi' => $a ? [
                    'id' => (int) $a->id,
                    'jam_masuk' => $a->jam_masuk,
                    'jam_keluar' => $a->jam_keluar,
                    'status' => $a->status,
                ] : null,
                'pengajuan' => $klaim[$ke] ?? null,
                'akan_diajukan' => false,
            ];
        }

        // Blok berikutnya = blok 5 pertemuan pertama yang belum diklaim sama sekali.
        $blok = null;
        for ($dari = 1; $dari <= $totalPeriode; $dari += self::MIN_PERTEMUAN) {
            $sampai = min($dari + self::MIN_PERTEMUAN - 1, $totalPeriode);
            $adaKlaim = false;
            for ($k = $dari; $k <= $sampai; $k++) {
                if (isset($klaim[$k])) {
                    $adaKlaim = true;
                    break;
                }
            }
            if ($adaKlaim) {
                continue;
            }
            $dalamBlok = array_filter($rows, fn ($r) => $r['pertemuan_ke'] >= $dari && $r['pertemuan_ke'] <= $sampai);
            $terlaksana = count(array_filter($dalamBlok, fn ($r) => $r['terlaksana']));
            $blok = [
                'dari' => $dari,
                'sampai' => $sampai,
                'ukuran' => $sampai - $dari + 1,
                'terlaksana' => $terlaksana,
                'siap' => $terlaksana === $sampai - $dari + 1,
                'tanggal_selesai_blok' => $jadwal[$sampai],
            ];
            break;
        }

        if ($blok) {
            foreach ($rows as &$r) {
                $r['akan_diajukan'] = $r['pertemuan_ke'] >= $blok['dari'] && $r['pertemuan_ke'] <= $blok['sampai'];
            }
            unset($r);
        }

        return [
            'id' => $kelas->id,
            'nama' => $kelas->batchRelasi?->nama_batch ?: $kelas->nama_kelas,
            'level' => $kelas->level,
            'tanggal_mulai' => $kelas->tanggal_mulai?->toDateString(),
            'tanggal_selesai' => $kelas->tanggal_selesai?->toDateString(),
            'periode' => $this->formatPeriode($kelas),
            'total_periode' => $totalPeriode,
            'pertemuan_berjalan' => count($rows),
            'sudah_diajukan' => count($klaim),
            'pertemuan' => $rows,
            'blok' => $blok,
        ];
    }

    /** Daftar pertemuan seluruh periode kelas: [pertemuan_ke => 'Y-m-d'] (hari kerja, tanpa libur). */
    private function jadwalPertemuan(KelasSensei $kelas): array
    {
        $mulai = Carbon::parse($kelas->tanggal_mulai)->startOfDay();
        $selesai = Carbon::parse($kelas->tanggal_selesai)->startOfDay();

        $jadwal = [];
        $ke = 1;
        for ($d = $mulai->copy(); $d->lte($selesai); $d->addDay()) {
            if ($d->isWeekend() || HariLibur::apakahLibur($d->toDateString())) {
                continue;
            }
            $jadwal[$ke++] = $d->toDateString();
        }

        return $jadwal;
    }

    /**
     * Pertemuan yang sudah diajukan (selain pengajuan yang ditolak):
     * [pertemuan_ke => ['id' => pengajuan id, 'status' => status]].
     */
    private function klaimPertemuan(KelasSensei $kelas, int $userId, array $jadwal, $absensiByTanggal): array
    {
        $keByTanggal = array_flip($jadwal);
        $keByAbsensiId = [];
        foreach ($absensiByTanggal as $tanggal => $a) {
            if (isset($keByTanggal[$tanggal])) {
                $keByAbsensiId[(int) $a->id] = $keByTanggal[$tanggal];
            }
        }

        $klaim = [];
        PengajuanGaji::where('user_id', $userId)
            ->where('status', '!=', 'ditolak')
            ->orderBy('id')
            ->get(['id', 'status', 'kelas_sensei_id', 'pertemuan_dari', 'pertemuan_sampai', 'absensi_sensei_ids', 'ringkasan_kehadiran'])
            ->each(function (PengajuanGaji $p) use ($kelas, $keByAbsensiId, &$klaim) {
                $info = ['id' => $p->id, 'status' => $p->status];
                if ((int) $p->kelas_sensei_id === (int) $kelas->id && $p->pertemuan_dari && $p->pertemuan_sampai) {
                    for ($k = $p->pertemuan_dari; $k <= $p->pertemuan_sampai; $k++) {
                        $klaim[$k] = $info;
                    }

                    return;
                }
                // Pengajuan lama (sebelum ada rentang pertemuan): petakan dari id absensinya.
                foreach ($p->claimedAbsensiIds() as $absensiId) {
                    if (isset($keByAbsensiId[$absensiId])) {
                        $klaim[$keByAbsensiId[$absensiId]] = $info;
                    }
                }
            });

        ksort($klaim);

        return $klaim;
    }

    private function formatPeriode(KelasSensei $kelas): string
    {
        $fmt = fn ($d) => $d ? Carbon::parse($d)->locale('id')->translatedFormat('d M Y') : '?';

        return $fmt($kelas->tanggal_mulai) . ' – ' . $fmt($kelas->tanggal_selesai);
    }
}
