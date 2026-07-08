<?php

namespace App\Http\Controllers;

use App\Models\Batch;
use App\Models\Divisi;
use App\Models\KelasSensei;
use App\Models\Penilaian;
use App\Models\PenilaianSetting;
use App\Models\Siswa;
use App\Models\StudentAssessment;
use App\Models\AssessmentCategory;
use App\Models\AssessmentComponent;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;

class PenilaianController extends Controller
{
    public function settingsIndex()
    {
        $divisis = Divisi::orderBy('nama_divisi')->get();
        $settings = PenilaianSetting::pluck('penilaian_aktif', 'divisi_id')->toArray();

        return view('penilaian.settings', compact('divisis', 'settings'));
    }

    public function updateSettings(Request $request)
    {
        $request->validate([
            'penilaian_aktif' => 'array',
            'penilaian_aktif.*' => 'in:1',
        ]);

        $aktifIds = array_keys($request->penilaian_aktif ?? []);

        PenilaianSetting::query()->update(['penilaian_aktif' => false]);

        foreach ($aktifIds as $divisiId) {
            PenilaianSetting::updateOrCreate(
                ['divisi_id' => $divisiId],
                ['penilaian_aktif' => true]
            );
        }

        return redirect()->back()->with('success', 'Pengaturan penilaian berhasil disimpan.');
    }

    public function index(Request $request)
    {
        $user = auth()->user();

        $levels = KelasSensei::select('level')->distinct()->orderBy('level')->pluck('level');

        $queryGuru = User::whereIn('id', KelasSensei::select('user_id')->distinct());
        if ($user->role === 'GURU') {
            $queryGuru->where('id', $user->id);
        }
        $gurus = $queryGuru->orderBy('name')->get(['id', 'name']);

        $level = $request->level;
        $guruId = $request->guru_id;
        $batchId = $request->batch_id;
        $kelasSenseiId = $request->kelas_sensei_id;

        if ($user->role === 'GURU') {
            $guruId = $user->id;
        }

        $batchList = collect();
        if ($level && $guruId) {
            $batchIds = KelasSensei::where('level', $level)
                ->where('user_id', $guruId)
                ->whereNotNull('batch_id')
                ->pluck('batch_id');
            $batchList = \App\Models\Batch::whereIn('id', $batchIds)
                ->orderBy('nama_batch')
                ->get(['id', 'nama_batch']);
        }

        $kelas = null;
        if ($kelasSenseiId) {
            $kelas = KelasSensei::with('batchRelasi')->find($kelasSenseiId);
            if ($kelas) {
                $batchId = $kelas->batch_id;
                $level = $kelas->level;
                $guruId = $kelas->user_id;
            }
        } elseif ($batchId && $level && $guruId) {
            $kelas = KelasSensei::where('batch_id', $batchId)
                ->where('level', $level)
                ->where('user_id', $guruId)
                ->first();
        }

        $students = collect();
        $categories = collect();
        $days = [];
        $assessmentCheck = collect();

        $weekStart = $request->week
            ? Carbon::parse($request->week)->startOfWeek(Carbon::MONDAY)
            : Carbon::now()->startOfWeek(Carbon::MONDAY);

        $prevWeek = $weekStart->copy()->subWeek()->toDateString();
        $nextWeek = $weekStart->copy()->addWeek()->toDateString();

        for ($i = 0; $i < 5; $i++) {
            $days[] = $weekStart->copy()->addDays($i)->toDateString();
        }

        if ($kelas) {
            $students = Siswa::with('kelasRelasi')->where('batch_id', $batchId)->where('status', 'AKTIF')->orderBy('nama')->get(['id', 'nama', 'kelas', 'kelas_id']);

            $categories = AssessmentCategory::with('components')
                ->where('level', $kelas->level)
                ->orderBy('urutan')
                ->get();

            $studentIds = $students->pluck('id');
            $componentIds = $categories->pluck('components')->flatten()->pluck('id');

            $existing = StudentAssessment::whereIn('siswa_id', $studentIds)
                ->whereIn('component_id', $componentIds)
                ->where('batch_id', $batchId)
                ->whereBetween('tanggal', [$days[0], $days[4]])
                ->select('siswa_id', 'tanggal')
                ->distinct()
                ->get();

            foreach ($students as $s) {
                foreach ($days as $d) {
                    $key = $s->id . '_' . $d;
                    $assessmentCheck[$key] = $existing->contains(fn($a) =>
                        $a->siswa_id === $s->id && $a->tanggal === $d
                    );
                }
            }
        }

        return view('penilaian.index', compact(
            'levels', 'gurus', 'level', 'guruId', 'batchId',
            'batchList', 'kelas', 'students', 'categories',
            'days', 'assessmentCheck', 'weekStart', 'prevWeek', 'nextWeek'
        ));
    }

    public function dayDetail(Request $request)
    {
        $request->validate([
            'siswa_id' => 'required|integer',
            'batch_id' => 'nullable|integer',
            'level' => 'required|string',
            'guru_id' => 'nullable|integer',
            'kelas_sensei_id' => 'nullable|integer',
            'tanggal' => 'nullable|date',
        ]);

        $siswa = Siswa::findOrFail($request->siswa_id);

        if ($request->kelas_sensei_id) {
            $kelas = KelasSensei::find($request->kelas_sensei_id);
        } else {
            $kelas = KelasSensei::where('batch_id', $request->batch_id)
                ->where('level', $request->level)
                ->where('user_id', $request->guru_id)
                ->first();
        }

        if (!$kelas) {
            return response()->json(['error' => 'Kelas tidak ditemukan'], 404);
        }

        $batchId = $request->batch_id ?? $kelas->batch_id;

        $categories = AssessmentCategory::with('components')
            ->where('level', $kelas->level)
            ->orderBy('urutan')
            ->get();

        $componentIds = $categories->pluck('components')->flatten()->pluck('id');

        $query = StudentAssessment::where('siswa_id', $request->siswa_id)
            ->whereIn('component_id', $componentIds)
            ->where('batch_id', $batchId);

        if ($request->tanggal) {
            $query->where('tanggal', $request->tanggal);
        }

        $assessments = $query->orderBy('tanggal')->get();

        $tanggalMulai = Carbon::parse($kelas->tanggal_mulai);

        $result = [];
        foreach ($categories as $cat) {
            $catData = [
                'nama_kategori' => $cat->nama_kategori,
                'components' => [],
                'pertemuan' => [],
            ];

            foreach ($cat->components as $comp) {
                $catData['components'][] = [
                    'id' => $comp->id,
                    'nama' => $comp->sub_komponen,
                ];
            }

            // Group by date
            $catAssessments = $assessments->filter(fn($a) =>
                $cat->components->pluck('id')->contains($a->component_id)
            )->groupBy('tanggal');

            foreach ($catAssessments as $date => $items) {
                $carbonDate = Carbon::parse($date);
                $hari = $carbonDate->locale('id')->dayName;

                // Pertemuan ke
                $pertemuanKe = 1;
                $checkDate = $tanggalMulai->copy();
                while ($checkDate->lt($carbonDate)) {
                    if ($checkDate->dayOfWeek !== 0 && $checkDate->dayOfWeek !== 6
                        && !\App\Models\HariLibur::apakahLibur($checkDate->toDateString())) {
                        $pertemuanKe++;
                    }
                    $checkDate->addDay();
                }

                $scores = [];
                foreach ($cat->components as $comp) {
                    $a = $items->firstWhere('component_id', $comp->id);
                    $scores[] = $a ? (float) $a->nilai : null;
                }

                $catData['pertemuan'][] = [
                    'tanggal' => $carbonDate->format('d/m/Y'),
                    'hari' => $hari,
                    'pertemuan_ke' => $pertemuanKe,
                    'scores' => $scores,
                ];
            }

            // Sort pertemuan by date
            usort($catData['pertemuan'], fn($a, $b) => strcmp($a['tanggal'], $b['tanggal']));

            // Compute summary stats for this category
            $compAverages = [];
            $compImprovements = [];
            foreach ($cat->components as $comp) {
                $allScores = $assessments->filter(fn($a) => $a->component_id === $comp->id)->pluck('nilai')->map(fn($v) => (float) $v);
                if ($allScores->isNotEmpty()) {
                    $compAverages[$comp->id] = round($allScores->average(), 1);
                    $compImprovements[$comp->id] = round($allScores->last() - $allScores->first(), 1);
                } else {
                    $compAverages[$comp->id] = null;
                    $compImprovements[$comp->id] = null;
                }
            }

            $avgValues = array_filter($compAverages, fn($v) => $v !== null);
            $nilaiAkhir = !empty($avgValues) ? round(array_sum($avgValues) / count($avgValues), 1) : null;
            $resikoClass = null;
            $resikoText = null;
            if ($nilaiAkhir !== null) {
                $resikoClass = $nilaiAkhir >= 75 ? 'success' : ($nilaiAkhir >= 65 ? 'warning' : 'danger');
                $resikoText = match(true) {
                    $nilaiAkhir >= 85 => '🟢 Sangat Siap',
                    $nilaiAkhir >= 75 => '🟢 Siap',
                    $nilaiAkhir >= 65 => '🟡 Perlu Pendampingan',
                    default => '🔴 Berisiko',
                };
            }

            $catData['summary'] = [
                'averages' => $compAverages,
                'improvements' => $compImprovements,
                'nilai_akhir' => $nilaiAkhir,
                'resiko' => $resikoText,
                'resiko_class' => $resikoClass,
            ];

            $result[] = $catData;
        }

        $carbon = $request->tanggal ? Carbon::parse($request->tanggal) : Carbon::now();

        $totalPertemuan = collect($result)->sum(fn($c) => count($c['pertemuan']));

        return response()->json([
            'level' => $kelas->level,
            'siswa' => $siswa->nama,
            'total_pertemuan' => $totalPertemuan,
            'categories' => $result,
        ]);
    }

    public function karyawanIndex()
    {
        $user = auth()->user();

        $aktif = PenilaianSetting::where('divisi_id', $user->divisi_id)
            ->where('penilaian_aktif', true)->exists();

        if (!$aktif) {
            abort(403, 'Fitur penilaian tidak aktif untuk divisi Anda.');
        }

        $penilaians = Penilaian::where('user_id', $user->id)
            ->orderBy('tanggal_penilaian', 'desc')
            ->get();

        $kelasList = \App\Models\KelasSensei::where('user_id', $user->id)
            ->orderBy('nama_kelas')
            ->get();

        return view('penilaian.karyawan', compact('penilaians', 'kelasList'));
    }

    public function apiIndex(Request $request)
    {
        $query = Penilaian::with('user');

        if ($request->filled('start_date')) {
            $query->whereDate('tanggal_penilaian', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('tanggal_penilaian', '<=', $request->end_date);
        }
        if ($request->filled('mata_pelajaran')) {
            $query->where('mata_pelajaran', 'like', '%' . $request->mata_pelajaran . '%');
        }
        if ($request->filled('search')) {
            $query->where('nama_siswa', 'like', '%' . $request->search . '%');
        }
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->filled('kelas')) {
            $query->where('kelas', $request->kelas);
        }

        $data = $query->orderBy('created_at', 'desc')->get();

        $gurus = User::whereIn('id', KelasSensei::select('user_id')->distinct())
            ->orderBy('name')
            ->get(['id', 'name']);

        $kelasOptions = Penilaian::select('kelas')->distinct()->whereNotNull('kelas')->orderBy('kelas')->pluck('kelas');

        return response()->json([
            'data' => $data,
            'gurus' => $gurus,
            'kelas_options' => $kelasOptions,
        ]);
    }

    public function apiMatrixIndex(Request $request)
    {
        $levels = KelasSensei::select('level')->distinct()->orderBy('level')->pluck('level');

        $level = $request->level;

        $guruQuery = \App\Models\Guru::with('user')->where('status', 'AKTIF');
        $gurus = $guruQuery->orderBy('nama')->get()->map(fn($g) => [
            'id' => $g->user_id,
            'name' => $g->nama,
        ])->values();
        $guruId = $request->guru_id;
        $batchId = $request->batch_id;
        $kelasSenseiId = $request->kelas_sensei_id;

        $batchList = \App\Models\Batch::orderBy('nama_batch')
            ->get(['id', 'nama_batch']);

        if ($level && $guruId) {
            $batchIds = KelasSensei::where('level', $level)
                ->where('user_id', $guruId)
                ->whereNotNull('batch_id')
                ->pluck('batch_id');
            $batchList = \App\Models\Batch::whereIn('id', $batchIds)
                ->orderBy('nama_batch')
                ->get(['id', 'nama_batch']);
        }

        $kelas = null;
        if ($kelasSenseiId) {
            $kelas = KelasSensei::with('batchRelasi')->find($kelasSenseiId);
            if ($kelas) {
                $batchId = $kelas->batch_id;
                $level = $kelas->level;
                $guruId = $kelas->user_id;
            }
        } elseif ($batchId && $level && $guruId) {
            $kelas = KelasSensei::where('batch_id', $batchId)
                ->where('level', $level)
                ->where('user_id', $guruId)
                ->first();
        }

        $students = [];
        $categories = [];
        $days = [];
        $assessmentCheck = [];
        $kelasaData = null;

        $weekStart = $request->week
            ? Carbon::parse($request->week)->startOfWeek(Carbon::MONDAY)
            : Carbon::now()->startOfWeek(Carbon::MONDAY);

        $prevWeek = $weekStart->copy()->subWeek()->toDateString();
        $nextWeek = $weekStart->copy()->addWeek()->toDateString();

        for ($i = 0; $i < 5; $i++) {
            $days[] = $weekStart->copy()->addDays($i)->toDateString();
        }

        if ($kelas) {
            $kelasaData = [
                'id' => $kelas->id,
                'user_id' => $kelas->user_id,
                'nama_kelas' => $kelas->nama_kelas,
                'level' => $kelas->level,
                'batch_id' => $kelas->batch_id,
                'tanggal_mulai' => $kelas->tanggal_mulai?->toDateString(),
                'tanggal_selesai' => $kelas->tanggal_selesai?->toDateString(),
                'batch_nama' => $kelas->batchRelasi?->nama_batch,
            ];

            $students = Siswa::with('kelasRelasi')
                ->where('batch_id', $batchId)
                ->where('status', 'AKTIF')
                ->orderBy('nama')
                ->get(['id', 'nama', 'kelas', 'kelas_id'])
                ->toArray();

            $categories = AssessmentCategory::with('components')
                ->where('level', $kelas->level)
                ->orderBy('urutan')
                ->get()
                ->toArray();

            $studentIds = array_column($students, 'id');
            $allComponentIds = [];
            foreach ($categories as $cat) {
                foreach ($cat['components'] as $comp) {
                    $allComponentIds[] = $comp['id'];
                }
            }

            $existing = StudentAssessment::whereIn('siswa_id', $studentIds)
                ->whereIn('component_id', $allComponentIds)
                ->where('batch_id', $batchId)
                ->whereBetween('tanggal', [$days[0], $days[4]])
                ->select('siswa_id', 'tanggal')
                ->distinct()
                ->get()
                ->keyBy(fn($a) => $a->siswa_id . '_' . $a->tanggal);

            foreach ($students as $s) {
                foreach ($days as $d) {
                    $key = $s['id'] . '_' . $d;
                    $assessmentCheck[$key] = isset($existing[$key]);
                }
            }
        }

        return response()->json([
            'levels' => $levels,
            'gurus' => $gurus,
            'level' => $level,
            'guru_id' => $guruId,
            'batch_id' => $batchId,
            'batch_list' => $batchList,
            'kelas' => $kelasaData,
            'students' => $students,
            'categories' => $categories,
            'days' => $days,
            'assessment_check' => $assessmentCheck,
            'week_start' => $weekStart->toDateString(),
            'prev_week' => $prevWeek,
            'next_week' => $nextWeek,
        ]);
    }

    public function apiStore(Request $request)
    {
        $request->validate([
            'nama_siswa' => 'required|string|max:255',
            'kelas' => 'nullable|string|max:100',
            'mata_pelajaran' => 'nullable|string|max:255',
            'nilai' => 'nullable|numeric|min:0|max:100',
            'keterangan' => 'nullable|string',
            'tanggal_penilaian' => 'required|date',
        ]);

        $penilaian = Penilaian::create([
            'user_id' => auth()->id(),
            'nama_siswa' => $request->nama_siswa,
            'kelas' => $request->kelas,
            'mata_pelajaran' => $request->mata_pelajaran,
            'nilai' => $request->nilai,
            'keterangan' => $request->keterangan,
            'tanggal_penilaian' => $request->tanggal_penilaian,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Penilaian berhasil ditambahkan',
            'data' => $penilaian,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_siswa' => 'required|string|max:255',
            'kelas' => 'nullable|string|max:100',
            'mata_pelajaran' => 'nullable|string|max:255',
            'nilai' => 'nullable|numeric|min:0|max:100',
            'keterangan' => 'nullable|string',
            'tanggal_penilaian' => 'required|date',
        ]);

        Penilaian::create([
            'user_id' => auth()->id(),
            'nama_siswa' => $request->nama_siswa,
            'kelas' => $request->kelas,
            'mata_pelajaran' => $request->mata_pelajaran,
            'nilai' => $request->nilai,
            'keterangan' => $request->keterangan,
            'tanggal_penilaian' => $request->tanggal_penilaian,
        ]);

        return redirect()->back()->with('success', 'Penilaian berhasil ditambahkan.');
    }

    public function apiUpdate(Request $request, $id)
    {
        $penilaian = Penilaian::findOrFail($id);

        $request->validate([
            'nama_siswa' => 'required|string|max:255',
            'kelas' => 'nullable|string|max:100',
            'mata_pelajaran' => 'nullable|string|max:255',
            'nilai' => 'nullable|numeric|min:0|max:100',
            'keterangan' => 'nullable|string',
            'tanggal_penilaian' => 'required|date',
        ]);

        $penilaian->update($request->only([
            'nama_siswa', 'kelas', 'mata_pelajaran', 'nilai', 'keterangan', 'tanggal_penilaian',
        ]));

        return response()->json([
            'status' => 'success',
            'message' => 'Penilaian berhasil diperbarui',
            'data' => $penilaian,
        ]);
    }

    public function apiDestroy($id)
    {
        $penilaian = Penilaian::findOrFail($id);
        $penilaian->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Penilaian berhasil dihapus',
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = auth()->user();

        if (in_array($user->role, ['HR', 'MANAGER'])) {
            $penilaian = Penilaian::findOrFail($id);
        } else {
            $penilaian = Penilaian::where('user_id', $user->id)->findOrFail($id);
        }

        $request->validate([
            'nama_siswa' => 'required|string|max:255',
            'kelas' => 'nullable|string|max:100',
            'mata_pelajaran' => 'nullable|string|max:255',
            'nilai' => 'nullable|numeric|min:0|max:100',
            'keterangan' => 'nullable|string',
            'tanggal_penilaian' => 'required|date',
        ]);

        $penilaian->update($request->only([
            'nama_siswa', 'kelas', 'mata_pelajaran', 'nilai', 'keterangan', 'tanggal_penilaian',
        ]));

        return redirect()->back()->with('success', 'Penilaian berhasil diperbarui.');
    }

    public function destroy($id)
    {
        $user = auth()->user();

        if (in_array($user->role, ['HR', 'MANAGER'])) {
            $penilaian = Penilaian::findOrFail($id);
        } else {
            $penilaian = Penilaian::where('user_id', $user->id)->findOrFail($id);
        }

        $penilaian->delete();

        return redirect()->back()->with('success', 'Penilaian berhasil dihapus.');
    }

    public function apiRekapPenilaian(Request $request)
    {
        $perBatch = Batch::where('status', 'AKTIF')
            ->withCount('siswas')
            ->get()
            ->map(function ($batch) {
                $stats = StudentAssessment::where('batch_id', $batch->id)
                    ->selectRaw('COUNT(*) as total, AVG(nilai) as rata, COUNT(DISTINCT siswa_id) as siswa_dinilai')
                    ->first();
                return [
                    'batch_id' => $batch->id,
                    'nama_batch' => $batch->nama_batch,
                    'total_siswa' => $batch->siswas_count,
                    'siswa_dinilai' => (int) ($stats?->siswa_dinilai ?? 0),
                    'rata_rata' => $stats?->rata ? round((float) $stats->rata, 2) : 0,
                    'total_assessments' => (int) ($stats?->total ?? 0),
                ];
            });

        $leaderboard = StudentAssessment::selectRaw('
                siswa_id, AVG(nilai) as rata_rata, COUNT(*) as total_penilaian
            ')
            ->with('siswa.batchRelasi')
            ->groupBy('siswa_id')
            ->orderByDesc('rata_rata')
            ->limit(20)
            ->get()
            ->map(fn($item) => [
                'siswa_id' => $item->siswa_id,
                'nama' => $item->siswa?->nama ?? 'Unknown',
                'batch' => $item->siswa?->batchRelasi?->nama_batch ?? '-',
                'level' => $item->siswa?->level ?? '-',
                'rata_rata' => round((float) $item->rata_rata, 2),
                'total_penilaian' => (int) $item->total_penilaian,
            ]);

        $totalSiswaDinilai = StudentAssessment::distinct('siswa_id')->count('siswa_id');
        $totalAssessments = StudentAssessment::count();
        $rataRataKeseluruhan = StudentAssessment::avg('nilai');

        return response()->json([
            'success' => true,
            'data' => [
                'per_batch' => $perBatch,
                'leaderboard' => $leaderboard,
                'statistik' => [
                    'total_siswa_dinilai' => $totalSiswaDinilai,
                    'total_assessments' => $totalAssessments,
                    'rata_rata_keseluruhan' => $rataRataKeseluruhan ? round((float) $rataRataKeseluruhan, 2) : 0,
                ],
            ],
        ]);
    }

    public function apiStoreStudentAssessment(Request $request)
    {
        $request->validate([
            'siswa_id' => 'required|exists:siswas,id',
            'batch_id' => 'nullable|exists:batches,id',
            'kelas_sensei_id' => 'nullable|exists:kelas_sensei,id',
            'tanggal' => 'required|date',
            'scores' => 'required|array',
            'scores.*.component_id' => 'required|exists:assessment_components,id',
            'scores.*.nilai' => 'nullable|numeric|min:0|max:100',
        ]);

        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $batchId = $request->batch_id;
        if (!$batchId && $request->kelas_sensei_id) {
            $kelas = KelasSensei::find($request->kelas_sensei_id);
            $batchId = $kelas?->batch_id;
        }

        $stored = [];
        foreach ($request->scores as $score) {
            $sa = StudentAssessment::updateOrCreate(
                [
                    'component_id' => $score['component_id'],
                    'siswa_id' => $request->siswa_id,
                    'batch_id' => $batchId,
                    'tanggal' => $request->tanggal,
                ],
                [
                    'user_id' => $user->id,
                    'nilai' => $score['nilai'],
                ]
            );
            $stored[] = $sa;
        }

        return response()->json([
            'success' => true,
            'message' => 'Penilaian berhasil disimpan',
            'data' => $stored,
        ]);
    }
}
