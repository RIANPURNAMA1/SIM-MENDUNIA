<?php

namespace App\Http\Controllers;

use App\Models\Batch;
use App\Models\JadwalLevel;
use App\Models\Siswa;
use App\Models\StudentAssessment;
use App\Models\AssessmentCategory;
use Illuminate\Http\Request;

class RaportController extends Controller
{
    public function levels($batchId)
    {
        $levels = AssessmentCategory::select('level')
            ->distinct()
            ->orderBy('level')
            ->pluck('level');

        $jadwalLevels = JadwalLevel::where('batch_id', $batchId)->get();

        $result = [];
        foreach ($levels as $level) {
            $jl = $jadwalLevels->firstWhere('level', $level);
            $result[] = [
                'level' => $level,
                'has_jadwal' => $jl !== null,
                'tanggal_mulai' => $jl?->tanggal_mulai,
                'tanggal_selesai' => $jl?->tanggal_selesai,
            ];
        }

        return response()->json(['data' => $result]);
    }

    public function students($batchId, $level)
    {
        $batch = Batch::with('cabang')->findOrFail($batchId);

        $siswaList = Siswa::where('batch_id', $batchId)
            ->where('status', 'AKTIF')
            ->orderBy('nama')
            ->get(['id', 'nama', 'level', 'nik', 'no_registrasi']);

        $siswaIds = $siswaList->pluck('id');

        $categories = AssessmentCategory::where('level', $level)
            ->with('components')
            ->orderBy('urutan')
            ->get();

        $componentIds = $categories->flatMap->components->pluck('id');

        $assessments = StudentAssessment::whereIn('siswa_id', $siswaIds)
            ->whereIn('component_id', $componentIds)
            ->where('batch_id', $batchId)
            ->whereNotNull('nilai')
            ->get();

        $categoriesData = $categories->map(fn($c) => [
            'id' => $c->id,
            'nama' => $c->nama_kategori,
            'components' => $c->components->map(fn($co) => [
                'id' => $co->id,
                'nama' => $co->sub_komponen,
            ]),
        ]);

        $siswaResult = $siswaList->map(function ($s) use ($assessments, $categories) {
            $siswaAssessments = $assessments->where('siswa_id', $s->id);

            $perKategori = [];
            $totalNilai = 0;
            $totalCount = 0;

            foreach ($categories as $cat) {
                $catComponents = [];
                $catTotal = 0;
                $catCount = 0;

                foreach ($cat->components as $comp) {
                    $compAssessments = $siswaAssessments->where('component_id', $comp->id);
                    $scores = $compAssessments->pluck('nilai')->map(fn($v) => (float) $v);

                    if ($scores->isNotEmpty()) {
                        $compAvg = round($scores->avg(), 1);
                        $catTotal += $scores->sum();
                        $catCount += $scores->count();
                    } else {
                        $compAvg = null;
                    }

                    $catComponents[] = [
                        'id' => $comp->id,
                        'nama' => $comp->sub_komponen,
                        'rata_rata' => $compAvg,
                        'total_nilai' => $scores->count(),
                    ];
                }

                $catAvg = $catCount > 0 ? round($catTotal / $catCount, 1) : null;
                $totalNilai += $catTotal;
                $totalCount += $catCount;

                $perKategori[] = [
                    'id' => $cat->id,
                    'nama' => $cat->nama_kategori,
                    'rata_rata' => $catAvg,
                    'total_nilai' => $catCount,
                    'components' => $catComponents,
                ];
            }

            $overallAvg = $totalCount > 0 ? round($totalNilai / $totalCount, 1) : null;

            return [
                'id' => $s->id,
                'nama' => $s->nama,
                'nik' => $s->nik,
                'no_registrasi' => $s->no_registrasi,
                'level' => $s->level,
                'rata_rata' => $overallAvg,
                'total_nilai' => $totalCount,
                'per_kategori' => $perKategori,
            ];
        });

        $sorted = $siswaResult->sortByDesc('rata_rata')->values();

        return response()->json([
            'batch' => [
                'id' => $batch->id,
                'nama_batch' => $batch->nama_batch,
                'cabang' => $batch->cabang?->nama_cabang,
            ],
            'level' => $level,
            'categories' => $categoriesData,
            'siswa' => $sorted,
        ]);
    }
}
