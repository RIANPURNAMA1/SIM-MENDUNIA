<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizQuestion extends Model
{
    protected $fillable = [
        'quiz_paket_id',
        'question',
        'section_id',
        'question_type',
        'rating_max',
        'options',
        'correct_index',
        'correct_indexes',
        'keyword',
        'points',
        'sort',
        'image_path',
        'audio_path',
        'audio_max_plays',
    ];

    protected $casts = [
        'question_type' => 'string',
        'rating_max' => 'integer',
        'options' => 'array',
        'correct_index' => 'integer',
        'correct_indexes' => 'array',
        'points' => 'integer',
        'sort' => 'integer',
        'audio_max_plays' => 'integer',
    ];

    protected $appends = ['image_url', 'audio_url'];

    public function paket()
    {
        return $this->belongsTo(QuizPaket::class, 'quiz_paket_id');
    }

    public function section()
    {
        return $this->belongsTo(QuizSection::class, 'section_id');
    }

    public function isMulti(): bool
    {
        return ($this->question_type ?? 'choice') === 'multi';
    }

    /**
     * Normalisasi sekumpulan index opsi menjadi daftar int unik yang terurut.
     * Menerima array, JSON string, atau null.
     */
    public static function normalizeIndexes($indexes): array
    {
        if ($indexes === null || $indexes === '') {
            return [];
        }

        if (is_string($indexes)) {
            $trimmed = trim($indexes);
            if ($trimmed === '') {
                return [];
            }
            $decoded = json_decode($trimmed, true);
            $indexes = is_array($decoded) ? $decoded : array_map('trim', str_split($trimmed));
        }

        if (!is_array($indexes)) {
            return [];
        }

        $result = [];
        foreach ($indexes as $i) {
            if (is_numeric($i)) {
                $result[] = (int) $i;
                continue;
            }
            // Huruf kunci (mis. "A", "B") dari impor massal.
            $ch = strtoupper(trim((string) $i));
            if (strlen($ch) === 1 && $ch >= 'A' && $ch <= 'Z') {
                $result[] = ord($ch) - 65;
            }
        }

        $result = array_values(array_unique(array_filter($result, fn ($v) => $v >= 0)));
        sort($result);

        return $result;
    }

    public function correctIndexList(): array
    {
        return self::normalizeIndexes($this->correct_indexes);
    }

    /**
     * Pilihan ganda multi: benar hanya bila jawaban siswa persis sama dengan kunci.
     */
    public function isAnswerCorrect(?array $selectedIndexes): bool
    {
        $selected = self::normalizeIndexes($selectedIndexes);
        if ($selected === []) {
            return false;
        }

        return $selected === $this->correctIndexList();
    }

    public function getImageUrlAttribute()
    {
        if (!$this->image_path) return null;
        if (str_starts_with($this->image_path, 'http')) return $this->image_path;
        return asset('storage/' . $this->image_path);
    }

    public function getAudioUrlAttribute()
    {
        if (!$this->audio_path) return null;
        if (str_starts_with($this->audio_path, 'http')) return $this->audio_path;
        return asset('storage/' . $this->audio_path);
    }
}