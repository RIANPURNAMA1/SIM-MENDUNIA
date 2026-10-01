<?php

namespace App\Services;

use App\Models\QuizAttempt;
use App\Models\QuizPaket;
use App\Models\QuizSertifikat;
use App\Models\Siswa;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Penerbitan sertifikat ujian.
 *
 * Satu sertifikat per percobaan (bukan per kandidat), jadi kandidat boleh
 * punya beberapa sertifikat dari paket yang sama. Nomor sertifikat dan
 * kode verifikasi dibuat berurutan/acak tapi dijamin unik.
 *
 * Semua field identitas, judul paket, dan rincian nilai disimpan sebagai
 * snapshot: sertifikat lama harus tetap akurat walaupun data kandidat atau
 * paket berubah di kemudian hari.
 */
class QuizSertifikatService
{
    public const DISK_FOTO = 'public';
    public const PATH_FOTO = 'quiz/sertifikat';

    /**
     * Terbitkan sertifikat untuk satu percobaan. Aman dipanggil berulang:
     * kalau sudah ada, sertifikat lama dikembalikan apa adanya.
     */
    public static function terbitkan(QuizAttempt $attempt, ?QuizPaket $paket = null): ?QuizSertifikat
    {
        if ($attempt->status !== 'submitted') {
            return null;
        }

        $paket = $paket ?: $attempt->paket;
        if (!$paket || !$paket->sertifikasi_aktif) {
            return null;
        }

        $existing = QuizSertifikat::where('quiz_attempt_id', $attempt->id)->first();
        if ($existing) {
            return $existing;
        }

        $siswa = $attempt->siswa;
        $issuedAt = $attempt->submitted_at ?: now();
        $berlaku = $paket->sertifikat_berlaku_hari ?: null;

        $rows = [
            'quiz_paket_id' => $paket->id,
            'quiz_attempt_id' => $attempt->id,
            'siswa_id' => $attempt->siswa_id,
            'kode_verifikasi' => static::kodeVerifikasi(),
            'kandidat_nama' => $siswa?->nama ?? 'Tanpa nama',
            'kandidat_nik' => $siswa?->nik,
            'kandidat_no_registrasi' => $siswa?->no_registrasi,
            'paket_judul' => $paket->title,
            'paket_kategori' => $paket->category,
            'sertifikat_judul' => $paket->sertifikat_judul,
            'sertifikat_penerbit' => $paket->sertifikat_penerbit,
            'batch_nama' => $siswa?->batchRelasi?->nama_batch ?? $paket->batch?->nama_batch,
            'level' => $paket->level ?: ($siswa?->level !== null ? (string) $siswa->level : null),
            'nilai' => (int) $attempt->score,
            'nilai_lulus' => (int) $paket->passing_score,
            'lulus' => (int) $attempt->score >= (int) $paket->passing_score,
            'benar' => (int) $attempt->correct_count,
            'total_soal' => (int) $attempt->total_count,
            'durasi_detik' => static::durasiDetik($attempt),
            'rincian_bagian' => QuizSectionScore::untukAttempt($paket->id, $attempt->id),
            'foto' => $attempt->foto_wajah,
            'issued_at' => $issuedAt,
            'expires_at' => $berlaku ? Carbon::parse($issuedAt)->addDays($berlaku) : null,
        ];

        $rows['nomor'] = static::nomor($paket, $issuedAt);

        try {
            return QuizSertifikat::create($rows);
        } catch (\Illuminate\Database\QueryException $e) {
            // Balapan bila submit dikirim dua kali bersamaan.
            Log::warning('Gagal terbitkan sertifikat, mencoba ambil yang ada: ' . $e->getMessage());
            return QuizSertifikat::where('quiz_attempt_id', $attempt->id)->first();
        }
    }

    /**
     * Nomor sertifikat: SRT/{tahun}/{paket}-{urutan hari ini}.
     * Urutan dihitung dari jumlah sertifikat paket yang sama pada hari itu,
     * lalu diulang sampai benar-benar unik.
     */
    private static function nomor(QuizPaket $paket, $issuedAt): string
    {
        $tahun = Carbon::parse($issuedAt)->format('Y');
        $prefix = sprintf('SRT/%s/%d-', $tahun, $paket->id);
        $sudah = QuizSertifikat::where('nomor', 'like', $prefix . '%')->count();
        $urutan = $sudah + 1;
        $nomor = $prefix . str_pad((string) $urutan, 4, '0', STR_PAD_LEFT);
        while (QuizSertifikat::where('nomor', $nomor)->exists()) {
            $urutan++;
            $nomor = $prefix . str_pad((string) $urutan, 4, '0', STR_PAD_LEFT);
        }

        return $nomor;
    }

    private static function kodeVerifikasi(): string
    {
        $kode = strtoupper(Str::random(8));
        while (QuizSertifikat::where('kode_verifikasi', $kode)->exists()) {
            $kode = strtoupper(Str::random(8));
        }

        return $kode;
    }

    private static function durasiDetik(QuizAttempt $attempt): int
    {
        if (!$attempt->started_at || !$attempt->submitted_at) {
            return 0;
        }
        $selisih = Carbon::parse($attempt->submitted_at)
            ->diffInSeconds(Carbon::parse($attempt->started_at), false);

        return max(0, (int) $selisih);
    }

    /**
     * Bentuk payload untuk ditampilkan di kartu sertifikat (kandidat/guru).
     */
    public static function payload(QuizSertifikat $s): array
    {
        return [
            'id' => $s->id,
            'nomor' => $s->nomor,
            'kode_verifikasi' => $s->kode_verifikasi,
            'judul' => $s->sertifikat_judul ?: $s->paket_judul,
            'judul_paket' => $s->paket_judul,
            'kategori' => $s->paket_kategori,
            'penerbit' => $s->sertifikat_penerbit ?: config('app.name'),
            'kandidat_nama' => $s->kandidat_nama,
            'kandidat_nik' => $s->kandidat_nik,
            'kandidat_no_registrasi' => $s->kandidat_no_registrasi,
            'batch_nama' => $s->batch_nama,
            'level' => $s->level,
            'nilai' => $s->nilai,
            'nilai_lulus' => $s->nilai_lulus,
            'lulus' => $s->lulus,
            'benar' => $s->benar,
            'total_soal' => $s->total_soal,
            'durasi_menit' => round($s->durasi_detik / 60),
            'rincian_bagian' => $s->rincian_bagian ?: [],
            'foto_url' => $s->foto_url,
            'issued_at' => $s->issued_at?->toDateTimeString(),
            'tanggal_indah' => $s->issued_at?->translatedFormat('d F Y'),
            'expired' => $s->expires_at !== null && $s->expires_at->isPast(),
            'expired_at' => $s->expires_at?->toDateTimeString(),
        ];
    }

    /**
     * Bentuk payload untuk halaman verifikasi publik.
     *
     * Endpoint ini terbuka tanpa login, jadi yang ditampilkan diminimalkan:
     * NIK hanya empat digit terakhir, dan foto serta nomor registrasi tidak
     * ikut dikembalikan sama sekali.
     */
    public static function payloadPublik(QuizSertifikat $s): array
    {
        return [
            'nomor' => $s->nomor,
            'kode_verifikasi' => $s->kode_verifikasi,
            'judul' => $s->sertifikat_judul ?: $s->paket_judul,
            'penerbit' => $s->sertifikat_penerbit ?: config('app.name'),
            'kandidat_nama' => $s->kandidat_nama,
            'kandidat_nik' => static::sensorNik($s->kandidat_nik),
            'batch_nama' => $s->batch_nama,
            'level' => $s->level,
            'nilai' => $s->nilai,
            'nilai_lulus' => $s->nilai_lulus,
            'lulus' => $s->lulus,
            'benar' => $s->benar,
            'total_soal' => $s->total_soal,
            'rincian_bagian' => $s->rincian_bagian ?: [],
            'issued_at' => $s->issued_at?->toDateTimeString(),
            'tanggal_indah' => $s->issued_at?->translatedFormat('d F Y'),
            'expired' => $s->expires_at !== null && $s->expires_at->isPast(),
        ];
    }

    /**
     * NIK disensor jadi empat digit terakhir saja, mis. 3201******.
     */
    private static function sensorNik(?string $nik): ?string
    {
        if (!$nik) {
            return null;
        }
        $nik = preg_replace('/\s+/', '', $nik);
        if (strlen($nik) <= 4) {
            return str_repeat('*', strlen($nik));
        }

        return str_repeat('*', max(0, strlen($nik) - 4)) . substr($nik, -4);
    }
}
