<?php

namespace App\Services;

use App\Models\AssessmentCategory;
use App\Models\KelasPertemuan;
use App\Models\QuizAttempt;
use App\Models\Siswa;
use App\Models\StudentAssessment;

class QuizAssessmentSync
{
    /** Nama komponen penilaian yang diisi otomatis dari skor quiz ulangan. */
    public const COMPONENT = 'Ulangan';

    /**
     * Sinkronkan skor terbaik siswa untuk sebuah attempt quiz ke penilaian
     * ("Ulangan") pada tanggal pertemuan yang memakai paket tersebut sebagai
     * ulangan harian / mingguan.
     *
     * @return int jumlah baris penilaian yang ditulis/ diperbarui
     */
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

        $bestScore = QuizAttempt::where('quiz_paket_id', $paketId)
            ->where('siswa_id', $siswaId)
            ->where('status', 'submitted')
            ->whereNotNull('score')
            ->max('score');

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

            $component = AssessmentCategory::where('level', $level)
                ->with(['components' => fn ($q) => $q->where('sub_komponen', self::COMPONENT)])
                ->get()
                ->flatMap->components
                ->first();

            if (!$component) {
                continue;
            }

            StudentAssessment::updateOrCreate(
                [
                    'component_id' => $component->id,
                    'siswa_id' => $siswaId,
                    'batch_id' => $kelas->batch_id,
                    'tanggal' => $p->tanggal->toDateString(),
                ],
                [
                    'user_id' => $kelas->user_id,
                    'nilai' => (float) $bestScore,
                    'sumber' => 'quiz',
                ]
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
}