<?php

namespace App\Services;

use App\Models\AssessmentCategory;
use App\Models\DailyAssessmentStatus;
use App\Models\KelasPertemuan;
use App\Models\Lesson;
use App\Models\QuizAttempt;
use App\Models\Siswa;
use App\Models\StudentAssessment;

class QuizAssessmentSync
{
    /** Nama komponen penilaian yang diisi otomatis dari skor quiz ulangan. */
    public const COMPONENT = 'Ulangan';

    /**
     * Tentukan level penilaian yang dipakai untuk menulis kolom "Ulangan".
     *
     * Grid "Penilaian Siswa" menampilkan komponen berdasarkan level KELAS
     * (kelas_sensei.level), jadi itu harus jadi acuan utama. Level siswa
     * hanya dipakai sebagai cadangan terakhir karena sering kosong
     * (kolomnya nullable) dan kalau kosong dulu membuat seluruh sync ter-skip.
     */
    private function resolveLevel(?Siswa $siswa, $kelasLevel = null, $courseLevel = null)
    {
        foreach ([$kelasLevel, $courseLevel, $siswa?->level] as $candidate) {
            if ($candidate !== null && $candidate !== '') {
                return (string) $candidate;
            }
        }

        return null;
    }

    /**
     * Level siswa yang bertentangan dengan level kelas/course → students ini
     * memang tidak boleh ikut kelas tersebut. Level siswa yang kosong TIDAK
     * dianggap bertentangan.
     */
    private function levelConflicts(?Siswa $siswa, $kelasLevel, $courseLevel): bool
    {
        $target = $this->resolveLevel($siswa, $kelasLevel, $courseLevel);
        if ($target === null) {
            return false;
        }

        return $siswa !== null
            && $siswa->level !== null
            && $siswa->level !== ''
            && (string) $siswa->level !== $target;
    }

    /**
     * Tandai status harian "Terisi" supaya badge hijau di grid ikut menyala
     * ketika nilai ulangan berasal dari quiz.
     */
    private function markDailyTerisi(int $siswaId, ?int $kelasSenseiId, string $tanggal, int $userId): void
    {
        if (!$kelasSenseiId) {
            return;
        }

        DailyAssessmentStatus::updateOrCreate(
            [
                'siswa_id' => $siswaId,
                'kelas_sensei_id' => $kelasSenseiId,
                'tanggal' => $tanggal,
            ],
            [
                'user_id' => $userId,
                'is_terisi' => true,
            ]
        );
    }

    /** @return int jumlah baris penilaian yang ditulis/diperbarui */
    public function syncAttempt(QuizAttempt $attempt): int
    {
        $paketId = (int) $attempt->quiz_paket_id;
        $siswaId = (int) $attempt->siswa_id;

        $pertemuan = KelasPertemuan::with('kelasSensei')
            ->where(function ($q) use ($paketId) {
                $q->where('ulangan_harian_paket_id', $paketId)
                    ->orWhere('ulangan_mingguan_paket_id', $paketId);
            })
            ->get();

        if ($pertemuan->isEmpty()) {
            return 0;
        }

        $bestScore = $this->bestScore($attempt);
        if ($bestScore === null) {
            return 0;
        }

        $synced = 0;
        foreach ($pertemuan as $p) {
            $kelas = $p->kelasSensei;
            if (!$kelas) {
                continue;
            }

            $siswa = Siswa::where('id', $siswaId)
                ->where('batch_id', $kelas->batch_id)
                ->where('status', 'AKTIF')
                ->first();

            if (!$siswa) {
                continue;
            }

            $level = $this->resolveLevel($siswa, $kelas->level, null);
            $component = $this->ulanganComponent($level);
            if (!$component) {
                continue;
            }

            $tanggal = $p->tanggal->toDateString();
            $userId = (int) $kelas->user_id;

            $this->writeUlangan(
                $component->id,
                $siswaId,
                $kelas->batch_id,
                $tanggal,
                $userId,
                $bestScore
            );

            $this->markDailyTerisi($siswaId, (int) $kelas->id, $tanggal, $userId);

            $synced++;
        }

        return $synced;
    }

    /**
     * Sinkronkan skor terbaik sebuah attempt ke penilaian ("Ulangan") pada
     * tanggal pertemuan (lesson LMS) yang menautkan paket dengan pivot
     * penilaian_ulangan aktif.
     *
     * @param Lesson|null $lesson bila null, semua lesson yang menautkan paket
     *                            dengan penilaian_ulangan aktif diproses.
     *
     * @return int jumlah baris penilaian yang ditulis/diperbarui
     */
    public function syncAttemptFromLesson(QuizAttempt $attempt, ?Lesson $lesson = null): int
    {
        if ($attempt->status !== 'submitted' || $attempt->score === null) {
            return 0;
        }

        $paketId = (int) $attempt->quiz_paket_id;
        $siswaId = (int) $attempt->siswa_id;

        $lessons = $lesson
            ? collect([$lesson])
            : Lesson::whereHas('linkPakets', fn ($q) => $q->where('quiz_paket_id', $paketId))->get();

        $bestScore = $this->bestScore($attempt);
        if ($bestScore === null) {
            return 0;
        }

        $synced = 0;
        foreach ($lessons as $l) {
            $pivotLink = $l->linkPakets()->where('quiz_paket_id', $paketId)->first();
            if (!$pivotLink || !(bool) ($pivotLink->pivot->penilaian_ulangan ?? false)) {
                continue;
            }

            $tanggal = $l->pertemuanTanggal();
            if (!$tanggal) {
                continue;
            }

            $course = $l->course;
            if (!$course) {
                continue;
            }

            $siswa = Siswa::where('id', $siswaId)->where('status', 'AKTIF')->first();
            if (!$siswa || !$siswa->batch_id) {
                continue;
            }

            if ($course->batch_id && (int) $siswa->batch_id !== (int) $course->batch_id) {
                continue;
            }

            // Level kelas (kelas_sensei) adalah acuan grid, course sebagai
            // cadangan, dan level siswa sebagai cadangan terakhir. Level siswa
            // yang kosong tidak lagi memblokir penulisan nilai.
            $kelas = $course->kelasSensei;
            if ($this->levelConflicts($siswa, $kelas?->level, $course->level)) {
                continue;
            }

            $level = $this->resolveLevel($siswa, $kelas?->level, $course->level);
            $component = $this->ulanganComponent($level);
            if (!$component) {
                continue;
            }

            $userId = (int) $course->user_id;

            $this->writeUlangan(
                $component->id,
                $siswaId,
                (int) $siswa->batch_id,
                $tanggal,
                $userId,
                $bestScore
            );

            $this->markDailyTerisi($siswaId, (int) $course->kelas_sensei_id, $tanggal, $userId);

            $synced++;
        }

        return $synced;
    }

    /**
     * Backfill: sinkronkan semua attempt submitted pada paket ulangan milik sebuah kelas.
     *
     * @return array{attempts: int, penilaian: int}
     */
    public function syncKelas(int $kelasId): array
    {
        $pertemuan = KelasPertemuan::where('kelas_sensei_id', $kelasId)->get();

        $paketIds = collect();
        foreach ($pertemuan as $p) {
            if ($p->ulangan_harian_paket_id) {
                $paketIds->push((int) $p->ulangan_harian_paket_id);
            }
            if ($p->ulangan_mingguan_paket_id) {
                $paketIds->push((int) $p->ulangan_mingguan_paket_id);
            }
        }
        $paketIds = $paketIds->unique()->values();

        if ($paketIds->isEmpty()) {
            return ['attempts' => 0, 'penilaian' => 0];
        }

        $attempts = QuizAttempt::whereIn('quiz_paket_id', $paketIds)
            ->where('status', 'submitted')
            ->whereNotNull('score')
            ->get();

        $penilaian = 0;
        foreach ($attempts as $attempt) {
            $penilaian += $this->syncAttempt($attempt);
        }

        return ['attempts' => $attempts->count(), 'penilaian' => $penilaian];
    }

    /**
     * Backfill untuk satu lesson: semua paket yang pivot-nya penilaian_ulangan
     * aktif, semua siswa di kelas course tersebut.
     *
     * Dipakai saat guru menekan "Nilai Ulangan" pada paket yang sudah punya
     * attempt lama, dan bisa dipanggil ulang kapan saja lewat
     * `php artisan quiz:sync-penilaian {lessonId}`.
     *
     * @return array{paket: int, attempt: int, penilaian: int, detail: array}
     */
    public function syncLesson(int $lessonId): array
    {
        $lesson = Lesson::with(['course.kelasSensei', 'linkPakets'])->find($lessonId);
        $empty = ['paket' => 0, 'attempt' => 0, 'penilaian' => 0, 'detail' => []];

        if (!$lesson || !$lesson->course) {
            return $empty;
        }

        $course = $lesson->course;
        $kelas = $course->kelasSensei;

        $paketIds = $lesson->linkPakets()
            ->where('lms_lesson_quiz_pakets.penilaian_ulangan', true)
            ->pluck('quiz_pakets.id')
            ->map(fn ($id) => (int) $id)
            ->values();

        if ($paketIds->isEmpty()) {
            return $empty;
        }

        $tanggal = $lesson->pertemuanTanggal();
        if (!$tanggal) {
            return $empty;
        }

        $attempts = QuizAttempt::whereIn('quiz_paket_id', $paketIds)
            ->where('status', 'submitted')
            ->whereNotNull('score')
            ->get();

        $detail = [];
        $penilaian = 0;

        foreach ($attempts as $attempt) {
            $rows = $this->syncAttemptFromLesson($attempt, $lesson);
            $penilaian += $rows;
            if ($rows > 0) {
                $detail[] = [
                    'siswa_id' => (int) $attempt->siswa_id,
                    'paket_id' => (int) $attempt->quiz_paket_id,
                    'nilai' => (int) $attempt->score,
                ];
            }
        }

        return [
            'paket' => $paketIds->count(),
            'attempt' => $attempts->count(),
            'penilaian' => $penilaian,
            'detail' => $detail,
        ];
    }

    private function bestScore(QuizAttempt $attempt): ?float
    {
        $best = QuizAttempt::where('quiz_paket_id', (int) $attempt->quiz_paket_id)
            ->where('siswa_id', (int) $attempt->siswa_id)
            ->where('status', 'submitted')
            ->whereNotNull('score')
            ->max('score');

        return $best === null ? null : (float) $best;
    }

    private function ulanganComponent($level)
    {
        if ($level === null || $level === '') {
            return null;
        }

        return AssessmentCategory::where('level', (string) $level)
            ->with(['components' => fn ($q) => $q->where('sub_komponen', self::COMPONENT)])
            ->get()
            ->flatMap->components
            ->first();
    }

    private function writeUlangan(int $componentId, int $siswaId, int $batchId, string $tanggal, int $userId, float $nilai): void
    {
        StudentAssessment::updateOrCreate(
            [
                'component_id' => $componentId,
                'siswa_id' => $siswaId,
                'batch_id' => $batchId,
                'tanggal' => $tanggal,
            ],
            [
                'user_id' => $userId,
                'nilai' => $nilai,
                'sumber' => 'quiz',
            ]
        );
    }
}
