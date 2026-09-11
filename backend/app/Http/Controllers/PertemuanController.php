<?php

namespace App\Http\Controllers;

use App\Models\KelasSensei;
use App\Models\KelasPertemuan;
use App\Models\QuizPaket;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PertemuanController extends Controller
{
    /**
     * Daftar hari kerja (Senin-Jumat) di luar hari libur dalam rentang kelas,
     * diurutkan sebagai pertemuan ke-1, 2, 3, ...
     */
    private function hariKerjaList(KelasSensei $kelas): array
    {
        $list = [];
        $ke = 0;
        $tgl = Carbon::parse($kelas->tanggal_mulai);
        $selesai = Carbon::parse($kelas->tanggal_selesai);

        while ($tgl->lte($selesai)) {
            if ($tgl->dayOfWeek !== Carbon::SATURDAY && $tgl->dayOfWeek !== Carbon::SUNDAY
                && !\App\Models\HariLibur::apakahLibur($tgl->toDateString())) {
                $ke++;
                $list[] = [
                    'pertemuan_ke' => $ke,
                    'tanggal' => $tgl->toDateString(),
                ];
            }
            $tgl->addDay();
        }

        return $list;
    }

    private function kelasPayload(KelasSensei $kelas): array
    {
        $kelas->load('batchRelasi', 'user');
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

    public function ringkasan()
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $kelas = KelasSensei::where('user_id', $user->id)
            ->with('batchRelasi')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['kelas' => $this->mapRingkasan($kelas)]);
    }

    public function adminIndex()
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user || !in_array($user->role, ['ADMIN', 'MANAGER', 'HR'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $kelas = KelasSensei::with('batchRelasi', 'user')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['kelas' => $this->mapRingkasan($kelas)]);
    }

    public function adminCabangIndex()
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user || $user->role !== 'ADMIN_CABANG') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $cabangIds = $user->cabang_ids ?? [];
        $kelas = KelasSensei::with('batchRelasi', 'user')
            ->whereHas('batchRelasi', function ($q) use ($cabangIds) {
                $q->whereIn('cabang_id', $cabangIds);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['kelas' => $this->mapRingkasan($kelas)]);
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
                'tanggal_mulai' => $k->tanggal_mulai->toDateString(),
                'tanggal_selesai' => $k->tanggal_selesai->toDateString(),
                'total_pertemuan' => $total,
                'terisi' => $terisi,
                'persen_terisi' => $total > 0 ? round(($terisi / $total) * 100) : 0,
            ];
        })->values();
    }
}