<?php

namespace App\Services;

use App\Models\AssessmentCategory;
use App\Models\KelasPertemuan;
use App\Models\Lesson;
use App\Models\QuizAttempt;
use App\Models\Siswa;
use App\Models\StudentAssessment;

class QuizAssessmentSync
{
    /** Nama komponen penilaian yang diisi otomatis dari skor quiz ulangan. */
    public const COMPONENT = 'Ulangan';

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

            $level = $siswa->level ?? $kelas->level;
            $component = $this->ulanganComponent($level);
            if (!$component) {
                continue;
            }

            $this->writeUlangan(
                $component->id,
                $siswaId,
                $kelas->batch_id,
                $p->tanggal->toDateString(),
                $kelas->user_id,
                $bestScore
            );

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
            if ($course->level !== null && $course->level !== ''
                && (string) $siswa->level !== (string) $course->level
            ) {
                continue;
            }

            $level = $siswa->level ?? $course->level;
            $component = $this->ulanganComponent($level);
            if (!$component) {
                continue;
            }

            $this->writeUlangan(
                $component->id,
                $siswaId,
                (int) $siswa->batch_id,
                $tanggal,
                (int) $course->user_id,
                $bestScore
            );

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

        return AssessmentCategory::where('level', $level)
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