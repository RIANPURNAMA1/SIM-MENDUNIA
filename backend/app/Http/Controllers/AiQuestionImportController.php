<?php

namespace App\Http\Controllers;

use App\Models\QuizPaket;
use App\Models\QuizSection;
use App\Services\AiAssistantService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Import soal dengan AI: admin menempelkan teks soal mentah (hasil copy dari
 * dokumen apa pun), AI menstrukturkannya, lalu hasilnya diubah ke format teks
 * "Import Banyak" yang sudah ada sehingga tetap melewati preview & simpan massal.
 */
class AiQuestionImportController extends Controller
{
    private const MAX_CHARS = 12000;

    public function parse(Request $request, $paketId, AiAssistantService $ai)
    {
        $validated = $request->validate([
            'text' => 'required|string|max:' . self::MAX_CHARS,
            'question_type' => 'required|in:choice,multi,rating,essay',
            'ai_boleh_isi_kunci' => 'nullable|boolean',
        ], [
            'text.required' => 'Tempel teks soal terlebih dahulu.',
            'text.max' => 'Teks terlalu panjang untuk sekali proses.',
        ]);

        // Respon AI untuk teks panjang bisa lebih dari 60 detik.
        @set_time_limit(180);

        $paket = QuizPaket::findOrFail($paketId);
        $type = $validated['question_type'];
        $bolehIsiKunci = $request->boolean('ai_boleh_isi_kunci', true);
        $sections = QuizSection::where('quiz_paket_id', $paket->id)->orderBy('sort')->pluck('name')->all();

        $raw = $ai->chatFor('import_soal', [
            ['role' => 'system', 'content' => $this->systemPrompt($type, $bolehIsiKunci, $sections)],
            ['role' => 'user', 'content' => "TEKS SOAL:\n<<<\n" . $validated['text'] . "\n>>>"],
        ], 0.0, 8000);

        $data = $this->decodeJson($raw);
        if (!is_array($data) || !isset($data['questions']) || !is_array($data['questions'])) {
            Log::warning('AI import soal: respon bukan JSON valid', ['paket_id' => $paket->id, 'raw' => mb_substr($raw, 0, 500)]);
            // Service AI mengembalikan pesan error sebagai teks biasa (mis. API key kosong).
            $pesan = mb_strlen($raw) < 300 && !str_contains($raw, '{') ? $raw : 'AI tidak mengembalikan format soal yang valid. Coba lagi atau perkecil teks.';

            return response()->json(['message' => $pesan], 422);
        }

        $questions = $this->normalize($data['questions'], $type);
        if (!$questions) {
            return response()->json(['message' => 'AI tidak menemukan soal pada teks yang ditempel.'], 422);
        }

        return response()->json([
            'text' => $this->toImportText($questions, $type),
            'count' => count($questions),
            'tanpa_kunci' => in_array($type, ['choice', 'multi'], true)
                ? count(array_filter($questions, fn ($q) => empty($q['correct'])))
                : 0,
        ]);
    }

    private function systemPrompt(string $type, bool $bolehIsiKunci, array $sections): string
    {
        $jenis = [
            'choice' => 'PILIHAN GANDA dengan TEPAT SATU jawaban benar',
            'multi' => 'PILIHAN GANDA dengan SATU ATAU LEBIH jawaban benar',
            'rating' => 'SKALA PENILAIAN (tanpa opsi jawaban)',
            'essay' => 'ESAI (tanpa opsi jawaban)',
        ][$type];

        $kunci = $bolehIsiKunci
            ? 'Jika teks memuat kunci jawaban (tanda pada opsi, tabel kunci, atau "Jawaban: B"), gunakan itu. Jika TIDAK ada kunci, tentukan sendiri jawaban yang benar dengan cermat.'
            : 'Gunakan kunci jawaban HANYA jika tertulis di teks (tanda pada opsi, tabel kunci, atau "Jawaban: B"). Jika tidak ada, isi "correct" dengan [].';

        $bagian = $sections
            ? 'Bagian (section) yang sudah ada di paket ini: ' . implode(', ', array_map(fn ($s) => '"' . $s . '"', $sections)) . '. Gunakan nama yang sama persis bila cocok.'
            : 'Paket ini belum memiliki bagian.';

        $opsiRule = in_array($type, ['choice', 'multi'], true)
            ? '- "options": daftar teks opsi TANPA huruf/nomor awalan (tanpa "A.", "b)", "1."). Pertahankan urutan.
- "correct": daftar indeks opsi yang benar, mulai dari 0.'
            : '- "options": selalu [] dan "correct": selalu [].';

        return <<<PROMPT
Anda adalah asisten yang mengubah teks soal mentah menjadi data terstruktur untuk sistem ujian bahasa Jepang.
Semua soal harus diperlakukan sebagai soal {$jenis}.

Aturan:
- Ambil SEMUA soal dari teks, sesuai urutan. Jangan menambah, menggabung, atau melewatkan soal.
- Salin teks soal dan opsi APA ADANYA (huruf Jepang, kanji, furigana, tanda baca). Jangan menerjemahkan atau memperbaiki isi.
- Buang nomor soal di awal pertanyaan (mis. "1.", "No. 2", "（３）").
- Soal yang terdiri dari beberapa baris (mis. dialog "A：..." / "B：...") tetap satu soal; pisahkan barisnya dengan "\\n".
- Pertahankan tag media seperti [gambar:...], [audio:...], [maks:N] persis apa adanya (jangan ubah path-nya), dan JANGAN membuang satu pun tag.
- Tag [gambar:...] pada baris tersendiri adalah gambar milik soal/opsi di dekatnya:
  * bila muncul sebelum/di antara teks soal (sebelum opsi pertama), masukkan ke "question" soal tersebut;
  * bila muncul pada/tepat setelah sebuah opsi (mis. "A. [gambar:...]" atau opsi berupa gambar saja), masukkan sebagai teks opsi itu.
  Soal atau opsi boleh hanya berisi tag gambar tanpa teks.
{$opsiRule}
- {$kunci}
- "section": nama bagian bila teks memberi judul bagian (mis. "Grammar", "Kanji", "文法"), selain itu null. {$bagian}
- "points": angka bobot bila tertulis di teks, selain itu null.
- Abaikan teks yang bukan soal (instruksi umum, header halaman, catatan kaki).

Balas HANYA dengan JSON valid tanpa penjelasan dan tanpa markdown, dengan bentuk:
{"questions":[{"section":null,"question":"...","options":["..."],"correct":[0],"points":null}]}
PROMPT;
    }

    private function decodeJson(string $raw): ?array
    {
        $raw = trim($raw);
        $raw = preg_replace('/^```(?:json)?\s*|\s*```$/i', '', $raw);
        $start = strpos($raw, '{');
        $end = strrpos($raw, '}');
        if ($start === false || $end === false || $end <= $start) {
            return null;
        }
        $decoded = json_decode(substr($raw, $start, $end - $start + 1), true);

        return is_array($decoded) ? $decoded : null;
    }

    /** Bersihkan & validasi hasil AI sesuai jenis soal. */
    private function normalize(array $items, string $type): array
    {
        $isChoice = in_array($type, ['choice', 'multi'], true);
        $out = [];

        foreach ($items as $q) {
            if (!is_array($q)) {
                continue;
            }
            $question = trim(str_replace(["\r\n", "\r"], "\n", (string) ($q['question'] ?? '')));
            // Buang nomor soal di awal ("1.", "No. 2", "（３）") bila AI tidak membuangnya.
            $question = trim(preg_replace('/^\s*(?:No\.?\s*)?[(（]?[0-9０-９]{1,3}\s*[.)．）、]\s*/u', '', $question));
            if ($question === '') {
                continue;
            }

            $options = [];
            $correct = [];
            if ($isChoice) {
                foreach ((array) ($q['options'] ?? []) as $opt) {
                    $text = trim(preg_replace('/\s*\n\s*/', ' ', (string) (is_array($opt) ? ($opt['text'] ?? '') : $opt)));
                    if ($text !== '' && count($options) < 8) { // parser import mengenal opsi a–h
                        $options[] = $text;
                    }
                }
                foreach ((array) ($q['correct'] ?? []) as $idx) {
                    if (is_numeric($idx) && (int) $idx >= 0 && (int) $idx < count($options)) {
                        $correct[] = (int) $idx;
                    }
                }
                // Buang awalan "A." / "b)" / "1." hanya bila SEMUA opsi memakainya.
                $prefix = '/^\s*(?:[A-Ha-h]|[1-8])\s*[.)．）:]\s*/u';
                if ($options && count(array_filter($options, fn ($o) => preg_match($prefix, $o))) === count($options)) {
                    $options = array_map(fn ($o) => preg_replace($prefix, '', $o), $options);
                }
                $correct = array_values(array_unique($correct));
                if ($type === 'choice' && count($correct) > 1) {
                    $correct = [$correct[0]];
                }
            }

            $section = isset($q['section']) && is_string($q['section']) ? trim($q['section']) : '';
            $points = isset($q['points']) && is_numeric($q['points']) && (int) $q['points'] > 0 ? (int) $q['points'] : null;

            $out[] = compact('question', 'options', 'correct', 'section', 'points');
        }

        return $out;
    }

    /**
     * Ubah ke format teks "Import Banyak":
     *   ## Bagian
     *   [stem soal, boleh multi-baris]
     *   *a. opsi benar
     *   b. opsi lain
     */
    private function toImportText(array $questions, string $type): string
    {
        $lines = [];
        $currentSection = null;

        foreach ($questions as $q) {
            if ($q['section'] !== $currentSection) {
                if ($lines) {
                    $lines[] = '';
                }
                $lines[] = $q['section'] !== '' ? '## ' . $q['section'] : '##';
                $currentSection = $q['section'];
            }

            // Baris stem di tengah yang berakhiran "]" akan dianggap penutup kurung oleh parser.
            $stemLines = array_map('rtrim', explode("\n", $q['question']));
            $last = count($stemLines) - 1;
            foreach ($stemLines as $i => $l) {
                if ($i < $last && str_ends_with($l, ']')) {
                    // Parser men-trim spasi, jadi pakai zero-width space agar "]" bukan karakter terakhir.
                    $stemLines[$i] = $l . "\u{200B}";
                }
            }
            $stem = implode("\n", $stemLines);
            if ($q['points']) {
                $stem .= ' (' . $q['points'] . ' poin)';
            }
            $lines[] = '[' . $stem . ']';

            if (in_array($type, ['choice', 'multi'], true)) {
                foreach ($q['options'] as $i => $opt) {
                    $mark = in_array($i, $q['correct'], true) ? '*' : '';
                    $lines[] = $mark . chr(97 + $i) . '. ' . $opt;
                }
            }
            $lines[] = '';
        }

        return rtrim(implode("\n", $lines)) . "\n";
    }
}
