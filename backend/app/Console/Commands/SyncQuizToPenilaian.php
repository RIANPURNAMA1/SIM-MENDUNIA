<?php

namespace App\Console\Commands;

use App\Services\QuizAssessmentSync;
use Illuminate\Console\Command;

class SyncQuizToPenilaian extends Command
{
    protected $signature = 'quiz:sync-penilaian
        {lesson? : ID lesson (LMS). Kosongkan untuk memproses semua lesson yang punya paket penilaian_ulangan aktif}
        {--kelas= : Sinkronkan juga paket ulangan harian/mingguan milik kelas_sensei ini}';

    protected $description = 'Tarik skor quiz (terbaik) ke kolom "Ulangan" pada Penilaian Siswa';

    public function handle(): int
    {
        $sync = app(QuizAssessmentSync::class);

        if ($lessonId = $this->argument('lesson')) {
            $result = $sync->syncLesson((int) $lessonId);

            $this->info("Lesson #{$lessonId}: {$result['paket']} paket ulangan, {$result['attempt']} attempt, {$result['penilaian']} nilai ditulis.");
            foreach ($result['detail'] as $d) {
                $this->line("  - siswa #{$d['siswa_id']} · paket #{$d['paket_id']} → Ulangan {$d['nilai']}");
            }

            if ($result['penilaian'] === 0) {
                $this->warn('Tidak ada nilai yang ditulis. Periksa: paket sudah "Masuk Penilaian"? tanggal pertemuan lesson tersedia? level kelas punya komponen "Ulangan"? batch siswa cocok dengan batch course?');
            }

            return self::SUCCESS;
        }

        if ($kelasId = $this->option('kelas')) {
            $result = $sync->syncKelas((int) $kelasId);
            $this->info("Kelas #{$kelasId}: {$result['attempts']} attempt, {$result['penilaian']} nilai ditulis.");
            return self::SUCCESS;
        }

        $total = 0;
        $lessonIds = \App\Models\Lesson::whereHas('linkPakets', fn ($q) => $q->where('penilaian_ulangan', true))
            ->pluck('id');

        foreach ($lessonIds as $id) {
            $result = $sync->syncLesson((int) $id);
            if ($result['penilaian'] > 0) {
                $this->info("Lesson #{$id}: {$result['penilaian']} nilai ditulis (dari {$result['attempt']} attempt).");
                $total += $result['penilaian'];
            }
        }

        $this->info("Total: {$total} nilai ulangan ditulis.");
        return self::SUCCESS;
    }
}
