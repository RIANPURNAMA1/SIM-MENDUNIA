<?php

namespace App\Http\Controllers;

use App\Models\KelasSensei;
use App\Models\KelasPertemuan;
use App\Models\AbsensiSiswa;
use App\Models\QuizPaket;
use App\Models\QuizAttempt;
use App\Models\StudentAssessment;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PertemuanController extends Controller
{
    /**
     * Daftar hari kerja (Senin-Jumat) di luar hari libur dalam rentang kelas,
     * diurutkan sebagai pertemuan ke-1, 2, 3, ...
     *
     * Sumber tunggalnya adalah KelasSensei::daftarPertemuan() supaya nomor
     * pertemuan di daftar ini tidak pernah melenceng dari hitungan di header.
     */
    private function hariKerjaList(KelasSensei $kelas): array
    {
        $list = [];
        $ke = 0;
        foreach ($kelas->daftarPertemuan() as $tanggal) {
            $ke++;
            $list[] = [
                'pertemuan_ke' => $ke,
                'tanggal' => $tanggal,
            ];
        }

        return $list;
    }

    private function kelasPayload(KelasSensei $kelas): array
    {
        $kelas->loadMissing('batchRelasi.cabang', 'user');
        return [
            'id' => $kelas->id,
            'nama_kelas' => $kelas->nama_kelas,
            'user_id' => $kelas->user_id,
            'sensei' => $kelas->user?->name,
            'batch_id' => $kelas->batch_id,
            'batch' => $kelas->batchRelasi?->nama_batch,
            'cabang' => $kelas->batchRelasi?->cabang?->nama_cabang ?? $kelas->batchRelasi?->cabang_id,
            'level' => $kelas->level,
            'tanggal_mulai' => $kelas->tanggal_mulai->toDateString(),
            'tanggal_selesai' => $kelas->tanggal_selesai->toDateString(),
            'status' => $kelas->status,
            'total_pertemuan' => $kelas->totalPertemuan(),
        ];
    }

    private function bolehLihat(KelasSensei $kelas, $user): bool
    {
        if ($kelas->user_id === (int) $user->id) {
            return true;
        }
        if (in_array($user->role, ['ADMIN', 'MANAGER', 'HR'])) {
            return true;
        }
        if ($user->role === 'ADMIN_CABANG') {
            $cabangIds = $user->cabang_ids ?? [];
            $cabangId = $kelas->batchRelasi?->cabang_id;
            return count($cabangIds) > 0 && $cabangId && in_array($cabangId, $cabangIds);
        }
        return false;
    }

    public function index(int $kelasId)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $kelas = KelasSensei::find($kelasId);
        if (!$kelas) {
            return response()->json(['message' => 'Kelas tidak ditemukan'], 404);
        }
        if (!$this->bolehLihat($kelas, $user)) {
            return response()->json(['message' => 'Tidak memiliki akses ke kelas ini'], 403);
        }

        $canEdit = (int) $kelas->user_id === (int) $user->id;

        $saved = KelasPertemuan::with('latihanPaket', 'ulanganHarianPaket', 'ulanganMingguanPaket')
            ->where('kelas_sensei_id', $kelas->id)
            ->get()
            ->keyBy(fn ($p) => $p->tanggal->toDateString());

        $pertemuan = collect($this->hariKerjaList($kelas))->map(function ($item) use ($saved) {
            $data = $saved->get($item['tanggal']);
            return [
                'pertemuan_ke' => $item['pertemuan_ke'],
                'tanggal' => $item['tanggal'],
                'tanggal_label' => Carbon::parse($item['tanggal'])->translatedFormat('d F Y'),
                'data' => $data ? $this->pertemuanPayload($data) : null,
            ];
        });

        $paketOptions = $canEdit
            ? QuizPaket::where('user_id', $user->id)
                ->orderBy('category')
                ->orderBy('title')
                ->get(['id', 'title', 'category'])
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'title' => $p->title,
                    'category' => $p->category,
                    'label' => ($p->category ? $p->category . ' — ' : '') . $p->title,
                ])
                ->values()
            : [];

        return response()->json([
            'kelas' => $this->kelasPayload($kelas),
            'pertemuan' => $pertemuan,
            'paket_options' => $paketOptions,
            'can_edit' => $canEdit,
            'terisi' => $saved->count(),
        ]);
    }

    private function pertemuanPayload(KelasPertemuan $p): array
    {
        return [
            'id' => $p->id,
            'pertemuan_ke' => $p->pertemuan_ke,
            'tanggal' => $p->tanggal->toDateString(),
            'materi' => $p->materi,
            'foto_bukti' => $p->foto_bukti ? asset('storage/' . $p->foto_bukti) : null,
            'foto_bukti_path' => $p->foto_bukti,
            'latihan_paket_id' => $p->latihan_paket_id,
            'latihan_paket' => $p->latihanPaket ? ['id' => $p->latihanPaket->id, 'title' => $p->latihanPaket->title] : null,
            'ulangan_harian_paket_id' => $p->ulangan_harian_paket_id,
            'ulangan_harian_paket' => $p->ulanganHarianPaket ? ['id' => $p->ulanganHarianPaket->id, 'title' => $p->ulanganHarianPaket->title, 'category' => $p->ulanganHarianPaket->category] : null,
            'ulangan_mingguan_paket_id' => $p->ulangan_mingguan_paket_id,
            'ulangan_mingguan_paket' => $p->ulanganMingguanPaket ? ['id' => $p->ulanganMingguanPaket->id, 'title' => $p->ulanganMingguanPaket->title, 'category' => $p->ulanganMingguanPaket->category] : null,
        ];
    }

    /**
     * Detail SATU pertemuan (per tanggal): riwayat yang diisi sensei, kehadiran
     * kandidat pada hari itu, hasil quiz, dan penilaian siswa.
     */
    public function detailTanggal(int $kelasId, string $tanggal)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if (!strtotime($tanggal)) {
            return response()->json(['message' => 'Format tanggal tidak valid'], 422);
        }

        $kelas = KelasSensei::with('batchRelasi', 'user')->find($kelasId);
        if (!$kelas) {
            return response()->json(['message' => 'Kelas tidak ditemukan'], 404);
        }
        if (!$this->bolehLihat($kelas, $user)) {
            return response()->json(['message' => 'Tidak memiliki akses ke kelas ini'], 403);
        }

        $pertemuanKe = null;
        foreach ($this->hariKerjaList($kelas) as $item) {
            if ($item['tanggal'] === $tanggal) {
                $pertemuanKe = $item['pertemuan_ke'];
                break;
            }
        }

        $record = KelasPertemuan::with('latihanPaket', 'ulanganHarianPaket', 'ulanganMingguanPaket')
            ->where('kelas_sensei_id', $kelas->id)
            ->where('tanggal', $tanggal)
            ->first();

        // --- Kehadiran kandidat (siswa) pada tanggal pertemuan ---
        $kehadiran = AbsensiSiswa::with('siswa:id,nama,no_registrasi,level')
            ->where('kelas_sensei_id', $kelas->id)
            ->where('tanggal', $tanggal)
            ->orderBy('status')
            ->orderBy('id')
            ->get()
            ->map(fn ($a) => [
                'siswa_id' => $a->siswa_id,
                'nama' => $a->siswa?->nama,
                'no_registrasi' => $a->siswa?->no_registrasi,
                'jam_masuk' => $a->jam_masuk,
                'jam_keluar' => $a->jam_keluar,
                'status' => $a->status,
                'keterangan' => $a->keterangan,
            ])
            ->values();

        $ringkasanKehadiran = [
            'HADIR' => 0,
            'TERLAMBAT' => 0,
            'IZIN' => 0,
            'SAKIT' => 0,
            'ALPA' => 0,
        ];
        foreach ($kehadiran as $row) {
            $st = strtoupper((string) ($row['status'] ?? ''));
            if (array_key_exists($st, $ringkasanKehadiran)) {
                $ringkasanKehadiran[$st]++;
            } else {
                $ringkasanKehadiran['LAINNYA'] = ($ringkasanKehadiran['LAINNYA'] ?? 0) + 1;
            }
        }
        $ringkasanKehadiran['terisi'] = $kehadiran->count();
        $ringkasanKehadiran['total_siswa'] = $kelas->batch_id
            ? \App\Models\Siswa::where('batch_id', $kelas->batch_id)->where('status', 'AKTIF')->count()
            : 0;

        // --- Hasil quiz (latihan / ulangan harian / ulangan mingguan) ---
        $paketIds = array_values(array_filter([
            $record?->latihan_paket_id,
            $record?->ulangan_harian_paket_id,
            $record?->ulangan_mingguan_paket_id,
        ]));

        $attemptsByPaket = collect();
        if ($paketIds) {
            $attemptsByPaket = QuizAttempt::with('siswa:id,nama,no_registrasi')
                ->whereIn('quiz_paket_id', $paketIds)
                ->where('status', 'submitted')
                ->get()
                ->groupBy('quiz_paket_id');
        }

        $quiz = [
            'latihan' => $this->quizSectionPengayaan($record?->latihanPaket, $attemptsByPaket->get($record?->latihan_paket_id)),
            'ulangan_harian' => $this->quizSectionPengayaan($record?->ulanganHarianPaket, $attemptsByPaket->get($record?->ulangan_harian_paket_id)),
            'ulangan_mingguan' => $this->quizSectionPengayaan($record?->ulanganMingguanPaket, $attemptsByPaket->get($record?->ulangan_mingguan_paket_id)),
        ];

        // --- Penilaian siswa pada tanggal pertemuan (component per kelas/batch) ---
        $penilaian = StudentAssessment::with('component', 'siswa:id,nama')
            ->where('batch_id', $kelas->batch_id)
            ->where('tanggal', $tanggal)
            ->orderBy('component_id')
            ->get()
            ->map(fn ($sa) => [
                'id' => $sa->id,
                'komponen' => $sa->component?->sub_komponen,
                'siswa_id' => $sa->siswa_id,
                'nama' => $sa->siswa?->nama,
                'nilai' => $sa->nilai !== null ? (float) $sa->nilai : null,
                'sumber' => $sa->sumber,
            ])
            ->values();

        return response()->json([
            'kelas' => [
                'id' => $kelas->id,
                'nama_kelas' => $kelas->nama_kelas,
                'batch' => $kelas->batchRelasi?->nama_batch,
                'level' => $kelas->level,
                'sensei' => $kelas->user?->name,
            ],
            'tanggal' => $tanggal,
            'pertemuan_ke' => $pertemuanKe,
            'tanggal_label' => Carbon::parse($tanggal)->translatedFormat('d F Y'),
            'data' => $record ? $this->pertemuanPayload($record) : null,
            'kehadiran' => $kehadiran,
            'ringkasan_kehadiran' => $ringkasanKehadiran,
            'quiz' => $quiz,
            'penilaian' => $penilaian,
        ]);
    }

    private function quizSectionPengayaan(?QuizPaket $paket, $attempts): array
    {
        if (!$paket) {
            return [
                'paket_id' => null,
                'title' => null,
                'category' => null,
                'ada' => false,
                'count' => 0,
                'rata_rata' => null,
                'attempts' => [],
            ];
        }

        $rows = $attempts ? $attempts->values() : collect();
        $count = $rows->count();
        $avg = $count ? round(collect($rows->pluck('score')->filter())->avg(), 1) : null;

        return [
            'paket_id' => $paket->id,
            'title' => $paket->title,
            'category' => $paket->category,
            'ada' => true,
            'count' => $count,
            'rata_rata' => $avg,
            'attempts' => $rows->map(fn ($at) => [
                'siswa_id' => $at->siswa_id,
                'nama' => $at->siswa?->nama,
                'score' => $at->score,
                'correct_count' => $at->correct_count,
                'total_count' => $at->total_count,
                'submitted_at' => $at->submitted_at ? $at->submitted_at->format('d/m/Y H:i') : null,
            ])->values(),
        ];
    }

    public function store(Request $request, int $kelasId)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $kelas = KelasSensei::find($kelasId);
        if (!$kelas) {
            return response()->json(['message' => 'Kelas tidak ditemukan'], 404);
        }
        if ((int) $kelas->user_id !== (int) $user->id) {
            return response()->json(['message' => 'Hanya sensei pemilik kelas yang dapat mengisi riwayat pertemuan'], 403);
        }

        $request->validate([
            'tanggal' => 'required|date',
            'materi' => 'nullable|string',
            'foto' => 'nullable|image|max:5120',
            'hapus_foto' => 'nullable|boolean',
            'latihan_paket_id' => 'nullable|exists:quiz_pakets,id',
            'ulangan_harian_paket_id' => 'nullable|exists:quiz_pakets,id',
            'ulangan_mingguan_paket_id' => 'nullable|exists:quiz_pakets,id',
        ]);

        $pertemuanKe = null;
        foreach ($this->hariKerjaList($kelas) as $item) {
            if ($item['tanggal'] === $request->tanggal) {
                $pertemuanKe = $item['pertemuan_ke'];
                break;
            }
        }
        if ($pertemuanKe === null) {
            return response()->json([
                'message' => 'Tanggal bukan hari pertemuan kelas ini (hari kerja Senin-Jumat, di luar hari libur, dalam rentang jadwal kelas)',
            ], 422);
        }

        $paket = fn ($key) => $request->filled($key) && $request->input($key) !== '' ? $request->input($key) : null;

        $data = [
            'kelas_sensei_id' => $kelas->id,
            'pertemuan_ke' => $pertemuanKe,
            'tanggal' => $request->tanggal,
            'materi' => $request->materi ?: null,
            'latihan_paket_id' => $paket('latihan_paket_id'),
            'ulangan_harian_paket_id' => $paket('ulangan_harian_paket_id'),
            'ulangan_mingguan_paket_id' => $paket('ulangan_mingguan_paket_id'),
        ];

        $record = KelasPertemuan::where('kelas_sensei_id', $kelas->id)
            ->where('tanggal', $request->tanggal)
            ->first();

        if ($request->hasFile('foto')) {
            $path = $request->file('foto')->store('kelas_pertemuan', 'public');
            $data['foto_bukti'] = $path;

            if ($record && $record->foto_bukti) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($record->foto_bukti);
            }
        } elseif ($record && $request->boolean('hapus_foto') && $record->foto_bukti) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($record->foto_bukti);
            $data['foto_bukti'] = null;
        }

        $record = KelasPertemuan::updateOrCreate(
            ['kelas_sensei_id' => $kelas->id, 'tanggal' => $request->tanggal],
            $data
        );

        $record->load('latihanPaket', 'ulanganHarianPaket', 'ulanganMingguanPaket');

        return response()->json([
            'success' => true,
            'message' => 'Riwayat pertemuan ke-' . $pertemuanKe . ' berhasil disimpan',
            'data' => $this->pertemuanPayload($record),
        ]);
    }

    public function syncNilai(int $kelasId)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $kelas = KelasSensei::find($kelasId);
        if (!$kelas) {
            return response()->json(['message' => 'Kelas tidak ditemukan'], 404);
        }
        if ((int) $kelas->user_id !== (int) $user->id) {
            return response()->json(['message' => 'Hanya sensei pemilik kelas yang dapat menarik nilai quiz'], 403);
        }

        $result = app(\App\Services\QuizAssessmentSync::class)->syncKelas($kelasId);

        return response()->json([
            'success' => true,
            'message' => 'Sinkronisasi selesai: ' . $result['attempts'] . ' percobaan quiz diproses, ' . $result['penilaian'] . ' data penilaian ditulis.',
            'data' => $result,
        ]);
    }

    public function ringkasan()
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $kelas = KelasSensei::where('user_id', $user->id)
            ->with('batchRelasi.cabang')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['kelas' => $this->mapRingkasan($kelas)]);
    }

    public function adminIndex(Request $request)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user || !in_array($user->role, ['ADMIN', 'MANAGER', 'HR'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return $this->daftarKelas($request, null);
    }

    public function adminCabangIndex(Request $request)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user || $user->role !== 'ADMIN_CABANG') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $cabangIds = $user->cabang_ids ?? [];

        return $this->daftarKelas($request, $cabangIds ?: [0]);
    }

    /**
     * Daftar kelas untuk halaman Riwayat Pertemuan. $cabangIds null = semua
     * cabang (admin pusat), array = batasi ke cabang yang dipegang admin cabang.
     *
     * Query, filter, dan ringkasan dikembalikan terpisah supaya frontend bisa
     * memfilter tanpa memuat ulang seluruh daftar.
     */
    private function daftarKelas(Request $request, ?array $cabangIds): JsonResponse
    {
        $q = $request->query('q');
        $status = $request->query('status');
        $cabang = $request->query('cabang_id');
        $sort = $request->query('sort', 'terbaru');

        $kelas = KelasSensei::with('batchRelasi.cabang', 'user')
            ->when($cabangIds !== null, fn ($b) => $b->whereHas('batchRelasi', fn ($sq) => $sq->whereIn('cabang_id', $cabangIds)))
            ->when($status !== null && $status !== '', fn ($b) => $b->where('status', $status))
            ->when($cabang !== null && $cabang !== '', fn ($b) => $b->whereHas('batchRelasi', fn ($sq) => $sq->where('cabang_id', (int) $cabang)))
            ->when($q !== null && $q !== '', function ($b) use ($q) {
                $needle = '%' . trim($q) . '%';
                $b->where(function ($w) use ($needle) {
                    $w->where('nama_kelas', 'like', $needle)
                        ->orWhereHas('user', fn ($u) => $u->where('name', 'like', $needle))
                        ->orWhereHas('batchRelasi', fn ($bt) => $bt->where('nama_batch', 'like', $needle));
                });
            });

        match ($sort) {
            'terlama' => $kelas->orderBy('tanggal_mulai'),
            'nama' => $kelas->orderBy('nama_kelas'),
            default => $kelas->orderByDesc('created_at'),
        };

        $result = $this->mapRingkasan($kelas->get());

        return response()->json([
            'kelas' => $result,
            'ringkasan' => [
                'jumlah_kelas' => count($result),
                'total_pertemuan' => (int) $result->sum('total_pertemuan'),
                'total_terisi' => (int) $result->sum('terisi'),
                'persen_terisi' => $result->sum('total_pertemuan') > 0
                    ? round($result->sum('terisi') / $result->sum('total_pertemuan') * 100)
                    : 0,
            ],
        ]);
    }

    private function mapRingkasan($kelas)
    {
        $counts = KelasPertemuan::selectRaw('kelas_sensei_id, count(*) as total')
            ->whereIn('kelas_sensei_id', $kelas->pluck('id'))
            ->groupBy('kelas_sensei_id')
            ->pluck('total', 'kelas_sensei_id');

        return $kelas->map(function ($k) use ($counts) {
            $total = $k->totalPertemuan();
            $terisi = (int) ($counts[$k->id] ?? 0);
            return [
                'id' => $k->id,
                'nama_kelas' => $k->nama_kelas,
                'sensei' => $k->user?->name,
                'batch' => $k->batchRelasi?->nama_batch,
                'cabang' => $k->batchRelasi?->cabang?->nama_cabang ?? $k->batchRelasi?->cabang_id,
                'level' => $k->level,
                'status' => $k->status,
                'tanggal_mulai' => $k->tanggal_mulai->toDateString(),
                'tanggal_selesai' => $k->tanggal_selesai->toDateString(),
                'total_pertemuan' => $total,
                'terisi' => $terisi,
                'persen_terisi' => $total > 0 ? round(($terisi / $total) * 100) : 0,
                'sisa_pertemuan' => max(0, $total - $terisi),
            ];
        })->values();
    }
}