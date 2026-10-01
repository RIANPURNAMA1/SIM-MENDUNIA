<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Batch;
use App\Models\QuizPaket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RekapNilaiController extends Controller
{
    /**
     * Rekap nilai kandidat berdasarkan kategori paket, batch, dan level.
     *
     * Sumber nilai: quiz_attempts status=submitted. Yang ditampilkan adalah
     * attempt terbaik per (paket, siswa) supaya attempts berulang tidak
     * menaikkan rata-rata secara artifisial.
     */
    public function index(Request $request)
    {
        $category = trim((string) $request->query('category', ''));
        $batchId = $request->query('batch_id');
        $level = trim((string) $request->query('level', ''));
        $search = trim((string) $request->query('search', ''));
        $perPage = $request->filled('per_page') ? max(1, (int) $request->per_page) : 15;

        $pakets = $this->paketQuery($category)->get();

        // Attempt terbaik per (paket, siswa) — hanya yang sudah disubmit.
        $bestAttempts = DB::table('quiz_attempts')
            ->where('status', 'submitted')
            ->whereIn('quiz_paket_id', $pakets->pluck('id'))
            ->selectRaw('quiz_paket_id, siswa_id, MAX(score) as score')
            ->groupBy('quiz_paket_id', 'siswa_id')
            ->get();

        $bestByKey = [];
        foreach ($bestAttempts as $a) {
            $bestByKey[$a->quiz_paket_id . ':' . $a->siswa_id] = (int) $a->score;
        }

        $siswaQuery = DB::table('siswas')
            ->select('id', 'nama', 'nik', 'no_registrasi', 'batch_id', 'level', 'kelas')
            ->whereNotNull('batch_id');

        if ($batchId !== null && $batchId !== '' && $batchId !== 'all') {
            $siswaQuery->where('batch_id', (int) $batchId);
        }
        if ($level !== '' && $level !== 'all') {
            $siswaQuery->where('level', $level);
        }
        if ($search !== '') {
            $s = '%' . $search . '%';
            $siswaQuery->where(function ($q) use ($s) {
                $q->where('nama', 'like', $s)
                    ->orWhere('nik', 'like', $s)
                    ->orWhere('no_registrasi', 'like', $s);
            });
        }

        $siswas = $siswaQuery->orderBy('nama')->get();
        $siswaIndex = $siswas->keyBy('id');

        // Rekap per kandidat: skor terbaik dari tiap paket dalam scope.
        $rows = [];
        foreach ($siswas as $sw) {
            $scores = [];
            foreach ($pakets as $p) {
                $key = $p->id . ':' . $sw->id;
                if (array_key_exists($key, $bestByKey)) {
                    $scores[(int) $p->id] = $bestByKey[$key];
                }
            }
            if ($scores === []) {
                continue;
            }

            $values = array_values($scores);
            $rows[] = [
                'siswa_id' => $sw->id,
                'nama' => $sw->nama,
                'nik' => $sw->nik,
                'no_registrasi' => $sw->no_registrasi,
                'kelas' => $sw->kelas,
                'batch_id' => $sw->batch_id,
                'level' => $sw->level,
                'scores' => $scores,
                'paket_kerjakan' => count($values),
                'total_paket' => $pakets->count(),
                'rata_rata' => round(array_sum($values) / count($values), 1),
                'terbaik' => max($values),
                'terendah' => min($values),
            ];
        }

        // Ranking: rata-rata turun, lalu paket kerjakan, lalu terbaik.
        usort($rows, function ($a, $b) {
            return [$b['rata_rata'], $b['paket_kerjakan'], $b['terbaik']]
                <=> [$a['rata_rata'], $a['paket_kerjakan'], $a['terbaik']];
        });

        $totalRows = count($rows);
        $page = max(1, (int) $request->query('page', 1));
        $paged = array_slice($rows, ($page - 1) * $perPage, $perPage);
        foreach ($paged as $i => $r) {
            $paged[$i]['peringkat'] = ($page - 1) * $perPage + $i + 1;
        }

        $batchMap = Batch::whereIn('id', $siswas->pluck('batch_id')->filter()->unique())
            ->pluck('nama_batch', 'id');

        $avgAll = $rows ? array_sum(array_column($rows, 'rata_rata')) / count($rows) : 0;

        return response()->json([
            'filters' => [
                'kategori' => QuizPaket::query()->where('category', '<>', '')
                    ->distinct()->orderBy('category')->pluck('category')->values(),
                'batch' => Batch::aktif()->orderBy('nama_batch')->get(['id', 'nama_batch', 'warna'])
                    ->map(fn ($b) => ['id' => $b->id, 'nama' => $b->nama_batch, 'warna' => $b->warna]),
                'level' => DB::table('siswas')->whereNotNull('level')->distinct()->orderBy('level')->pluck('level')->values(),
            ],
            'ringkasan' => [
                'total_paket' => $pakets->count(),
                'total_kandidat' => $totalRows,
                'total_kandidat_ter-filter' => count($siswaIndex),
                'rata_rata' => round($avgAll, 1),
                'tertinggi' => $rows ? max(array_column($rows, 'terbaik')) : 0,
                'terendah' => $rows ? min(array_column($rows, 'terendah')) : 0,
                'lulus' => count(array_filter($rows, fn ($r) => $r['rata_rata'] >= 70)),
            ],
            'paket' => $pakets->map(fn ($p) => [
                'id' => $p->id,
                'title' => $p->title,
                'category' => $p->category,
                'batch_name' => optional($p->batch)->nama_batch,
                'level' => $p->level,
                'passing_score' => (int) $p->passing_score,
                'questions_count' => $p->questions_count,
            ])->values(),
            'kandidat' => $paged,
            'pagination' => [
                'current_page' => $page,
                'last_page' => max(1, (int) ceil($totalRows / $perPage)),
                'per_page' => $perPage,
                'total' => $totalRows,
            ],
        ]);
    }

    /** Paket dalam scope kategori, tanpa paginate supaya bisa dipakai matrix. */
    private function paketQuery(string $category)
    {
        $q = QuizPaket::query()->with('batch')->withCount('questions');
        if ($category !== '' && $category !== 'all') {
            $q->where('category', $category);
        }
        return $q->orderBy('category')->orderBy('title');
    }
}
