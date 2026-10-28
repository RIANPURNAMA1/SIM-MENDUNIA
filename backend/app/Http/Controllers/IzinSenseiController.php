<?php

namespace App\Http\Controllers;

use App\Models\AbsensiSensei;
use App\Models\HariLibur;
use App\Models\IzinSensei;
use App\Models\KelasSensei;
use App\Models\NotificationSetting;
use App\Models\User;
use App\Services\WhatsAppService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class IzinSenseiController extends Controller
{
    private const JENIS_IZIN = [
        'IZIN_PRIBADI',
        'SAKIT',
        'URUSAN_KELUARGA',
        'DINAS_LEMBAGA',
        'IZIN_MENDADAK',
    ];

    private function currentUser(): ?User
    {
        return Auth::guard('sanctum')->user() ?: Auth::user();
    }

    private function jadwalKelas(KelasSensei $kelas, string $mulai, string $selesai): array
    {
        return collect($kelas->daftarPertemuan())
            ->filter(fn ($tanggal) => $tanggal >= $mulai && $tanggal <= $selesai)
            ->values()
            ->all();
    }

    private function tanggalTarget(Request $request): array
    {
        $raw = $request->input('tanggal', $request->input('dates', []));

        if (is_string($raw)) {
            $raw = array_filter(array_map('trim', explode(',', $raw)));
        }

        $dates = collect(is_array($raw) ? $raw : [])
            ->filter()
            ->map(function ($tanggal) {
                try {
                    return Carbon::parse($tanggal)->toDateString();
                } catch (\Throwable $error) {
                    return null;
                }
            })
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->all();

        if (count($dates) > 0) {
            return $dates;
        }

        $mulai = $request->input('tgl_mulai');
        $selesai = $request->input('tgl_selesai');

        if (!$mulai || !$selesai) {
            return [];
        }

        $cursor = Carbon::parse($mulai)->startOfDay();
        $akhir = Carbon::parse($selesai)->startOfDay();

        while ($cursor->lte($akhir)) {
            $dates[] = $cursor->toDateString();
            $cursor->addDay();
        }

        return $dates;
    }

    private function memilikiBentrokJadwal(int $userId, array $dates): bool
    {
        $kelasList = KelasSensei::where('user_id', $userId)
            ->where('status', 'aktif')
            ->get(['tanggal_mulai', 'tanggal_selesai']);

        foreach ($kelasList as $kelas) {
            $mulai = $kelas->tanggal_mulai->toDateString();
            $selesai = $kelas->tanggal_selesai->toDateString();

            foreach ($dates as $tanggal) {
                if ($tanggal >= $mulai && $tanggal <= $selesai) {
                    return true;
                }
            }
        }

        return false;
    }

    private function memilikiBentrokIzin(int $userId, array $dates): bool
    {
        $izinList = IzinSensei::where('user_id', $userId)
            ->whereIn('status', ['PENDING', 'APPROVED'])
            ->get(['tgl_mulai', 'tgl_selesai']);

        foreach ($izinList as $izin) {
            $mulai = $izin->tgl_mulai->toDateString();
            $selesai = $izin->tgl_selesai->toDateString();

            foreach ($dates as $tanggal) {
                if ($tanggal >= $mulai && $tanggal <= $selesai) {
                    return true;
                }
            }
        }

        $sebagaiPengganti = IzinSensei::where('pengganti_id', $userId)
            ->whereIn('status', ['PENDING', 'APPROVED'])
            ->get(['tgl_mulai', 'tgl_selesai']);

        foreach ($sebagaiPengganti as $izin) {
            $mulai = $izin->tgl_mulai->toDateString();
            $selesai = $izin->tgl_selesai->toDateString();

            foreach ($dates as $tanggal) {
                if ($tanggal >= $mulai && $tanggal <= $selesai) {
                    return true;
                }
            }
        }

        return false;
    }

    private function penggantiTersedia(int $penggantiId, array $dates, int $pemohonId): bool
    {
        if ($penggantiId === $pemohonId) {
            return false;
        }

        $pengganti = User::where('id', $penggantiId)
            ->where('role', 'GURU')
            ->where('status', 'AKTIF')
            ->exists();

        if (!$pengganti) {
            return false;
        }

        return !$this->memilikiBentrokJadwal($penggantiId, $dates)
            && !$this->memilikiBentrokIzin($penggantiId, $dates);
    }

    public function meta()
    {
        $user = $this->currentUser();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $kelas = KelasSensei::where('user_id', $user->id)
            ->with('batchRelasi:id,nama_batch')
            ->orderByDesc('tanggal_mulai')
            ->get()
            ->map(function (KelasSensei $item) {
                $batch = $item->batchRelasi?->nama_batch;

                return [
                    'id' => $item->id,
                    'nama_kelas' => $item->nama_kelas,
                    'level' => $item->level,
                    'batch_id' => $item->batch_id,
                    'batch' => $batch,
                    'label' => trim(($batch ?: $item->nama_kelas) . ' - Level ' . $item->level),
                    'tanggal_mulai' => $item->tanggal_mulai->format('Y-m-d'),
                    'tanggal_selesai' => $item->tanggal_selesai->format('Y-m-d'),
                    'status' => $item->status,
                ];
            });

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
            ],
            'jenis_izin' => self::JENIS_IZIN,
            'kelas' => $kelas,
        ]);
    }

    public function jadwal(Request $request)
    {
        $user = $this->currentUser();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'kelas_sensei_id' => 'required|exists:kelas_sensei,id',
            'tgl_mulai' => 'required|date',
            'tgl_selesai' => 'required|date|after_or_equal:tgl_mulai',
        ]);

        $kelas = KelasSensei::where('user_id', $user->id)->findOrFail($validated['kelas_sensei_id']);

        return response()->json([
            'kelas_sensei_id' => $kelas->id,
            'tanggal' => $this->jadwalKelas($kelas, $validated['tgl_mulai'], $validated['tgl_selesai']),
        ]);
    }

    public function pengganti(Request $request)
    {
        $user = $this->currentUser();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $request->validate([
            'tanggal' => 'nullable',
            'tgl_mulai' => 'nullable|date',
            'tgl_selesai' => 'nullable|date|after_or_equal:tgl_mulai',
        ]);

        $dates = $this->tanggalTarget($request);

        if (count($dates) === 0) {
            return response()->json([
                'message' => 'Pilih tanggal jadwal yang ditinggalkan terlebih dahulu.',
                'data' => [],
            ], 422);
        }

        $sensei = User::where('role', 'GURU')
            ->where('status', 'AKTIF')
            ->where('id', '!=', $user->id)
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'foto_profil']);

        $tersedia = $sensei
            ->filter(fn (User $item) => $this->penggantiTersedia($item->id, $dates, $user->id))
            ->map(fn (User $item) => [
                'id' => $item->id,
                'name' => $item->name,
                'email' => $item->email,
                'foto_profil' => $item->foto_profil,
            ])
            ->values();

        return response()->json([
            'tanggal' => $dates,
            'data' => $tersedia,
        ]);
    }

    public function index(Request $request)
    {
        $user = $this->currentUser();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $query = IzinSensei::with([
            'user:id,name,nip',
            'kelas:id,nama_kelas,level,batch_id',
            'kelas.batchRelasi:id,nama_batch',
            'pengganti:id,name',
            'approver:id,name',
        ])->latest();

        if ($request->boolean('my') || $user->isGuru()) {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($sub) use ($search) {
                $sub->whereHas('user', fn ($userQuery) => $userQuery
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('nip', 'like', "%{$search}%"))
                    ->orWhere('nama_pengganti', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('jenis_izin')) {
            $query->where('jenis_izin', $request->jenis_izin);
        }

        $perPage = max(1, (int) $request->input('per_page', 15));

        return response()->json($query->paginate($perPage)->withQueryString());
    }

    public function store(Request $request)
    {
        $user = $this->currentUser();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if (!$user->isGuru()) {
            return response()->json(['message' => 'Hanya sensei yang dapat mengajukan izin sensei.'], 403);
        }

        $validated = $request->validate([
            'jenis_izin' => 'required|in:' . implode(',', self::JENIS_IZIN),
            'tgl_mulai' => 'required|date',
            'tgl_selesai' => 'required|date|after_or_equal:tgl_mulai',
            'alasan' => 'required|string|min:10|max:2000',
            'kelas_sensei_id' => 'required|exists:kelas_sensei,id',
            'jadwal_terdampak' => 'required|in:SEMUA,TERTENTU',
            'jadwal_tertentu' => 'required_if:jadwal_terdampak,TERTENTU|array',
            'jadwal_tertentu.*' => 'date',
            'mekanisme_pengganti' => 'required|in:USUL,ADMIN',
            'nama_pengganti' => 'nullable|required_if:mekanisme_pengganti,USUL|string|min:2|max:255',
            'catatan_pengganti' => 'nullable|string|max:2000',
        ], [
            'alasan.min' => 'Berikan alasan izin minimal 10 karakter.',
            'nama_pengganti.required_if' => 'Tulis nama sensei pengganti yang Anda usulkan.',
            'nama_pengganti.min' => 'Nama sensei pengganti minimal 2 karakter.',
            'jadwal_tertentu.required_if' => 'Pilih minimal satu jadwal yang terdampak.',
        ]);

        $kelas = KelasSensei::where('user_id', $user->id)->find($validated['kelas_sensei_id']);

        if (!$kelas) {
            return response()->json(['message' => 'Kelas yang dipilih bukan milik Anda.'], 422);
        }

        $jadwalKelas = $this->jadwalKelas($kelas, $validated['tgl_mulai'], $validated['tgl_selesai']);

        if (count($jadwalKelas) === 0) {
            return response()->json(['message' => 'Tidak ada jadwal kelas pada rentang tanggal yang dipilih.'], 422);
        }

        $jadwalTerdampak = $validated['jadwal_terdampak'] === 'SEMUA'
            ? $jadwalKelas
            : array_values(array_intersect($jadwalKelas, $validated['jadwal_tertentu'] ?? []));

        if (count($jadwalTerdampak) === 0) {
            return response()->json(['message' => 'Jadwal yang dipilih tidak sesuai dengan jadwal kelas.'], 422);
        }

        $sudahAda = IzinSensei::where('user_id', $user->id)
            ->whereIn('status', ['PENDING', 'APPROVED'])
            ->whereDate('tgl_mulai', '<=', $validated['tgl_selesai'])
            ->whereDate('tgl_selesai', '>=', $validated['tgl_mulai'])
            ->exists();

        if ($sudahAda) {
            return response()->json(['message' => 'Anda sudah memiliki pengajuan izin pada rentang tanggal tersebut.'], 422);
        }

        $namaPengganti = $validated['mekanisme_pengganti'] === 'USUL'
            ? trim($validated['nama_pengganti'] ?? '')
            : null;

        $izin = DB::transaction(function () use ($validated, $user, $jadwalTerdampak, $namaPengganti) {
            return IzinSensei::create([
                'user_id' => $user->id,
                'kelas_sensei_id' => $validated['kelas_sensei_id'],
                'jenis_izin' => $validated['jenis_izin'],
                'tgl_mulai' => $validated['tgl_mulai'],
                'tgl_selesai' => $validated['tgl_selesai'],
                'alasan' => $validated['alasan'],
                'jadwal_terdampak' => $validated['jadwal_terdampak'],
                'jadwal_tertentu' => $jadwalTerdampak,
                'mekanisme_pengganti' => $validated['mekanisme_pengganti'],
                'nama_pengganti' => $namaPengganti,
                'catatan_pengganti' => $validated['catatan_pengganti'] ?? null,
                'status' => 'PENDING',
            ]);
        });

        return response()->json([
            'message' => 'Pengajuan izin sensei berhasil dikirim.',
            'data' => $izin->load([
                'kelas:id,nama_kelas,level,batch_id',
                'kelas.batchRelasi:id,nama_batch',
                'pengganti:id,name',
            ]),
        ], 201);
    }

    public function approve(Request $request, $id)
    {
        $user = $this->currentUser();
        $izin = IzinSensei::findOrFail($id);

        if ($izin->status !== 'PENDING') {
            return response()->json(['message' => 'Pengajuan izin sudah diproses.'], 422);
        }

        $izin->update([
            'status' => 'APPROVED',
            'catatan_admin' => $request->input('catatan_admin'),
            'approved_by' => $user?->id,
            'approved_at' => now(),
        ]);

        // Buat record absensi untuk setiap tanggal yang diizinkan agar muncul di riwayat absensi
        $affectedDates = [];
        if ($izin->jadwal_terdampak === 'TERTENTU' && is_array($izin->jadwal_tertentu)) {
            $affectedDates = array_values($izin->jadwal_tertentu);
        } else {
            $start = Carbon::parse($izin->tgl_mulai);
            $end = Carbon::parse($izin->tgl_selesai);
            while ($start->lte($end)) {
                if ($start->dayOfWeek !== 0 && $start->dayOfWeek !== 6 && !HariLibur::apakahLibur($start->toDateString())) {
                    $affectedDates[] = $start->toDateString();
                }
                $start->addDay();
            }
        }

        foreach ($affectedDates as $tanggal) {
            AbsensiSensei::firstOrCreate(
                [
                    'kelas_sensei_id' => $izin->kelas_sensei_id,
                    'user_id' => $izin->user_id,
                    'tanggal' => $tanggal,
                ],
                [
                    'status' => 'IZIN',
                    'catatan' => 'Izin: ' . ($izin->jenis_izin ?? '') . ' - ' . ($izin->alasan ?? ''),
                ]
            );
        }

        // Notifikasi WhatsApp ke sensei
        try {
            $izin->loadMissing('user', 'kelas');
            $user = $izin->user;
            $phone = $user?->no_hp;
            if ($phone && NotificationSetting::isEnabled('wa_izin_sensei')) {
                $kelasNama = $izin->kelas ? ($izin->kelas->batch_relasi?->nama_batch ?? $izin->kelas->nama_kelas ?? '-') : '-';
                $level = $izin->kelas?->level ?? '-';
                $jenisLabel = [
                    'IZIN_PRIBADI' => 'Izin Pribadi',
                    'SAKIT' => 'Sakit',
                    'URUSAN_KELUARGA' => 'Urusan Keluarga',
                    'DINAS_LEMBAGA' => 'Dinas Lembaga',
                    'IZIN_MENDADAK' => 'Izin Mendadak',
                ][$izin->jenis_izin ?? ''] ?? $izin->jenis_izin;
                $periode = Carbon::parse($izin->tgl_mulai)->format('d M Y') . ' s.d ' . Carbon::parse($izin->tgl_selesai)->format('d M Y');
                $message = "✅ *Pengajuan Izin Disetujui*\n\n"
                    . "Halo {$user->name},\n\n"
                    . "Pengajuan izin mengajar Anda telah disetujui oleh admin/koordinator.\n\n"
                    . "📅 Tanggal: {$periode}\n"
                    . "📋 Kelas: {$kelasNama} (Level {$level})\n"
                    . "📝 Jenis: {$jenisLabel}\n"
                    . "💬 Alasan: {$izin->alasan}\n\n"
                    . "Terima kasih.";
                app(WhatsAppService::class)->sendMessage($phone, $message);
            }
        } catch (\Exception $e) {
            Log::warning('Gagal kirim notifikasi WA izin sensei (approve): ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Pengajuan izin sensei disetujui.',
            'data' => $izin->fresh(['user:id,name', 'pengganti:id,name', 'approver:id,name']),
        ]);
    }

    public function reject(Request $request, $id)
    {
        $user = $this->currentUser();
        $izin = IzinSensei::findOrFail($id);

        if ($izin->status !== 'PENDING') {
            return response()->json(['message' => 'Pengajuan izin sudah diproses.'], 422);
        }

        $request->validate([
            'catatan_admin' => 'nullable|string|max:2000',
        ]);

        $izin->update([
            'status' => 'REJECTED',
            'catatan_admin' => $request->input('catatan_admin'),
            'approved_by' => $user?->id,
            'approved_at' => now(),
        ]);

        // Notifikasi WhatsApp ke sensei
        try {
            $izin->loadMissing('user', 'kelas');
            $senseiUser = $izin->user;
            $phone = $senseiUser?->no_hp;
            if ($phone && NotificationSetting::isEnabled('wa_izin_sensei')) {
                $kelasNama = $izin->kelas ? ($izin->kelas->batch_relasi?->nama_batch ?? $izin->kelas->nama_kelas ?? '-') : '-';
                $level = $izin->kelas?->level ?? '-';
                $jenisLabel = [
                    'IZIN_PRIBADI' => 'Izin Pribadi',
                    'SAKIT' => 'Sakit',
                    'URUSAN_KELUARGA' => 'Urusan Keluarga',
                    'DINAS_LEMBAGA' => 'Dinas Lembaga',
                    'IZIN_MENDADAK' => 'Izin Mendadak',
                ][$izin->jenis_izin ?? ''] ?? $izin->jenis_izin;
                $periode = Carbon::parse($izin->tgl_mulai)->format('d M Y') . ' s.d ' . Carbon::parse($izin->tgl_selesai)->format('d M Y');
                $catatanAdmin = $izin->catatan_admin ? "\n📝 Catatan admin: {$izin->catatan_admin}" : '';
                $message = "❌ *Pengajuan Izin Ditolak*\n\n"
                    . "Halo {$senseiUser->name},\n\n"
                    . "Maaf, pengajuan izin mengajar Anda ditolak oleh admin/koordinator.\n\n"
                    . "📅 Tanggal: {$periode}\n"
                    . "📋 Kelas: {$kelasNama} (Level {$level})\n"
                    . "📝 Jenis: {$jenisLabel}\n"
                    . "💬 Alasan: {$izin->alasan}{$catatanAdmin}\n\n"
                    . "Silakan ajukan kembali jika diperlukan.";
                app(WhatsAppService::class)->sendMessage($phone, $message);
            }
        } catch (\Exception $e) {
            Log::warning('Gagal kirim notifikasi WA izin sensei (reject): ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Pengajuan izin sensei ditolak.',
            'data' => $izin->fresh(['user:id,name', 'pengganti:id,name', 'approver:id,name']),
        ]);
    }
}
