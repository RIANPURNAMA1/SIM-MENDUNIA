<?php

namespace App\Services;

use App\Models\QuizAnswer;
use App\Models\QuizQuestion;
use App\Models\QuizSection;

/**
 * Menghitung rincian jawaban per BAGIAN (section) untuk sebuah percobaan.
 *
 * Dipakai oleh tiga pemanggil: rekap di AdminQuizController, rekap di
 * GuruQuizController, dan penerbitan sertifikat. Semula logikanya ditulis
 * dua kali di dua controller; disatukan di sini agar angka yang tampil di
 * grafik rekap dan yang tercetak di sertifikat tidak pernah berbeda.
 *
 * Penyebut memakai jumlah soal paket pada bagian tersebut, bukan jumlah
 * soal yang dijawab, sehingga soal yang dilewati ikut terhitung salah.
 */
class QuizSectionScore
{
    /**
     * @param  array<int>  $attemptIds
     * @return array<int, array<int, array{id:int,name:string,total:int,correct:int,percent:float}>>
     *         Dikunci indeks attempt id.
     */
    public static function untukBanyakAttempt(int $paketId, array $attemptIds): array
    {
        $attemptIds = array_values(array_unique(array_map('intval', $attemptIds)));
        $out = [];
        if ($attemptIds === []) {
            return $out;
        }

        $sectionMeta = self::sectionMeta($paketId);
        $questionSection = self::questionSectionMap($paketId);

        $answersByAttempt = QuizAnswer::whereIn('quiz_attempt_id', $attemptIds)
            ->get(['quiz_attempt_id', 'quiz_question_id', 'is_correct'])
            ->groupBy('quiz_attempt_id');

        foreach ($attemptIds as $attemptId) {
            $tally = array_fill_keys(array_keys($sectionMeta), 0);
            foreach ($answersByAttempt->get($attemptId, collect()) as $ans) {
                $sid = $questionSection[(int) $ans->quiz_question_id] ?? 0;
                if (!array_key_exists($sid, $tally)) {
                    $tally[$sid] = 0;
                }
                if ($ans->is_correct) {
                    $tally[$sid]++;
                }
            }

            $rows = [];
            foreach ($tally as $sid => $correct) {
                $total = $sectionMeta[$sid]['total'];
                // Bagian tanpa soal tidak ditampilkan: entah bagian virtual
                // "Tanpa Bagian" atau section yang belum diisi, keduanya hanya
                // menghasilkan baris 0/0 = 0% yang menyesatkan di sertifikat.
                if ($total === 0) {
                    continue;
                }
                $rows[] = [
                    'id' => $sid,
                    'name' => $sectionMeta[$sid]['name'],
                    'total' => $total,
                    'correct' => $correct,
                    'percent' => $total > 0 ? round($correct / $total * 100, 1) : 0.0,
                ];
            }
            $out[$attemptId] = $rows;
        }

        return $out;
    }

    /**
     * @return array<int, array<int, array{id:int,name:string,total:int}>>
     */
    public static function untukAttempt(int $paketId, int $attemptId): array
    {
        return self::untukBanyakAttempt($paketId, [$attemptId])[$attemptId] ?? [];
    }

    /**
     * Metadata bagian beserta jumlah soal paket pada bagian itu.
     * Termasuk bagian virtual id=0 untuk soal yang belum dikelompokkan.
     *
     * @return array<int, array{id:int,name:string,total:int}>
     */
    private static function sectionMeta(int $paketId): array
    {
        $meta = [];
        foreach (QuizSection::where('quiz_paket_id', $paketId)
            ->orderBy('sort')->orderBy('id')->get(['id', 'name']) as $sec) {
            $meta[(int) $sec->id] = ['id' => (int) $sec->id, 'name' => $sec->name, 'total' => 0];
        }
        $meta[0] = ['id' => 0, 'name' => 'Tanpa Bagian', 'total' => 0];

        foreach (QuizQuestion::where('quiz_paket_id', $paketId)->get(['id', 'section_id']) as $q) {
            $sid = (int) ($q->section_id ?? 0);
            if (isset($meta[$sid])) {
                $meta[$sid]['total']++;
            }
        }

        return $meta;
    }

    /**
     * @return array<int, int> question id => section id
     */
    private static function questionSectionMap(int $paketId): array
    {
        $map = [];
        foreach (QuizQuestion::where('quiz_paket_id', $paketId)->get(['id', 'section_id']) as $q) {
            $map[(int) $q->id] = (int) ($q->section_id ?? 0);
        }

        return $map;
    }
}
