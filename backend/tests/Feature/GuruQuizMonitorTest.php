<?php

namespace Tests\Feature;

use App\Models\Batch;
use App\Models\Cabang;
use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use App\Models\QuizPaket;
use App\Models\QuizQuestion;
use App\Models\Siswa;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Monitoring guru: poin sementara harus tampil live dan daftar kandidat
 * diurutkan sebagai peringkat, sehingga kandidat bisa saling menyalip.
 *
 * Catatan database sama seperti QuizSertifikasiTest: migrasi repo memakai SQL
 * khusus MySQL, jadi tes berjalan di MySQL lokal dalam satu transaksi yang
 * selalu di-rollback di tearDown.
 */
class GuruQuizMonitorTest extends TestCase
{
    private User $guru;
    private Batch $batch;
    private QuizPaket $paket;
    private array $soalIds = [];
    private bool $transaksiMulai = false;

    protected function setUp(): void
    {
        parent::setUp();

        $database = static::namaDatabaseUji();
        if ($database === null) {
            $this->markTestSkipped(
                'Butuh database MySQL yang sudah dimigrasi. Set SERTIFIKASI_TEST_DB atau sediakan .env.'
            );
        }

        config([
            'database.default' => 'mysql',
            'database.connections.mysql.database' => $database,
        ]);
        DB::purge('mysql');
        DB::connection('mysql')->beginTransaction();
        $this->transaksiMulai = true;

        $this->guru = User::where('role', 'GURU')->first()
            ?? User::create([
                'name' => 'Guru Uji', 'email' => 'guru.uji@mendunia.test',
                'password' => bcrypt('rahasia'), 'role' => 'GURU',
            ]);

        $this->batch = Batch::create([
            'nama_batch' => 'Batch Guru Uji',
            'cabang_id' => Cabang::first()->id,
            'status' => 'aktif',
        ]);

        $this->paket = QuizPaket::create([
            'user_id' => $this->guru->id,
            'title' => 'Paket Monitoring Guru',
            'description' => 'Uji peringkat live',
            'level' => '2',
            'time_limit_minutes' => 60,
            'max_attempts' => 1,
            'max_warnings' => 3,
            'passing_score' => 70,
            'shuffle_questions' => false,
            'quiz_template' => 'basic',
            'status' => 'aktif',
            'batch_id' => $this->batch->id,
            'sertifikasi_aktif' => false,
            'sertifikat_wajib_foto' => false,
        ]);

        // 3 soal x 10 poin supaya total maksimum 30 dan urutannya jelas.
        for ($i = 0; $i < 3; $i++) {
            $soal = QuizQuestion::create([
                'quiz_paket_id' => $this->paket->id,
                'question' => 'Soal ' . ($i + 1),
                'options' => ['a', 'b', 'c'],
                'correct_index' => 0,
                'points' => 10,
                'sort' => $i + 1,
                'question_type' => 'choice',
            ]);
            $this->soalIds[] = $soal->id;
        }

        $this->paket->load('questions');
    }

    private function buatSiswa(string $nama, string $nik): Siswa
    {
        return Siswa::create([
            'nama' => $nama,
            'nik' => $nik,
            'no_registrasi' => 'REG/GURU/' . $nik,
            'batch_id' => $this->batch->id,
            'level' => '2',
            'status' => 'aktif',
        ]);
    }

    /**
     * @param array<int, bool> $benar indeks soal => benar / salah
     */
    private function buatAttempt(Siswa $siswa, array $benar, string $status = 'in_progress'): QuizAttempt
    {
        $attempt = QuizAttempt::create([
            'quiz_paket_id' => $this->paket->id,
            'siswa_id' => $siswa->id,
            'source' => 'lms',
            'attempt_number' => 1,
            'started_at' => now(),
            'submitted_at' => $status === 'submitted' ? now() : null,
            'time_limit_seconds' => 3600,
            'score' => $status === 'submitted' ? 10 : null,
            'warnings' => 0,
            'auto_submitted' => false,
            'status' => $status,
        ]);

        foreach (array_values($benar) as $i => $isBenar) {
            $soalId = $this->soalIds[$i];
            QuizAnswer::create([
                'quiz_attempt_id' => $attempt->id,
                'quiz_question_id' => $soalId,
                'selected_index' => $isBenar ? 0 : 1,
                'earned_points' => $isBenar ? 10 : 0,
                'is_correct' => $isBenar,
            ]);
        }

        return $attempt;
    }

    protected function tearDown(): void
    {
        if ($this->transaksiMulai) {
            DB::connection('mysql')->rollBack();
            $this->transaksiMulai = false;
        }

        parent::tearDown();
    }

    public function test_poin_sementara_dihitung_dari_poin_soal_yang_sudah_benar()
    {
        Sanctum::actingAs($this->guru);

        $siswa = $this->buatSiswa('Kandidat Tiga Poin', '3273011501990011');
        $this->buatAttempt($siswa, [true, true, true]);

        $respons = $this->getJson("/api/guru/quiz/pakets/{$this->paket->id}/monitor");

        $respons->assertOk();
        $respons->assertJsonPath('attempts.0.live_points', 30);
        $respons->assertJsonPath('attempts.0.max_points', 30);
        $respons->assertJsonPath('attempts.0.rank', 1);
    }

    public function test_daftar_kandidat_diurutkan_berdasarkan_poin_live()
    {
        Sanctum::actingAs($this->guru);

        // Sengaja dibuat berlawanan urutan dengan peringkat yang diharapkan.
        $rendah = $this->buatSiswa('Kandidat Satu Poin', '3273011501990012');
        $tinggi = $this->buatSiswa('Kandidat Dua Poin', '3273011501990013');
        $this->buatAttempt($rendah, [true, false, false]);
        $this->buatAttempt($tinggi, [true, true, false]);

        $respons = $this->getJson("/api/guru/quiz/pakets/{$this->paket->id}/monitor");

        $respons->assertOk();
        $this->assertSame(
            ['Kandidat Dua Poin', 'Kandidat Satu Poin'],
            collect($respons->json('attempts'))->pluck('siswa.nama')->all()
        );
        $this->assertSame([20, 10], collect($respons->json('attempts'))->pluck('live_points')->all());
        $this->assertSame([1, 2], collect($respons->json('attempts'))->pluck('rank')->all());
    }

    public function test_poin_sama_diurutkan_berdasarkan_soal_terjawab_lalu_mulai_lebih_dulu()
    {
        Sanctum::actingAs($this->guru);

        // Poin sama (20), tapi soal terjawab beda karena ada jawaban kosong
        // pada kandidat kedua.
        $lengkap = $this->buatSiswa('Kandidat Lengkap', '3273011501990014');
        $sebagian = $this->buatSiswa('Kandidat Sebagian', '3273011501990015');
        $this->buatAttempt($lengkap, [true, true, false]);
        $attemptSebagian = $this->buatAttempt($sebagian, [true, true, true]);
        // Ubah satu jawaban jadi kosong supaya terjawab 2 tapi poin tetap 20.
        QuizAnswer::where('quiz_attempt_id', $attemptSebagian->id)
            ->where('quiz_question_id', $this->soalIds[2])->delete();

        $respons = $this->getJson("/api/guru/quiz/pakets/{$this->paket->id}/monitor");

        $respons->assertOk();
        $this->assertSame(
            ['Kandidat Lengkap', 'Kandidat Sebagian'],
            collect($respons->json('attempts'))->pluck('siswa.nama')->all()
        );
        $this->assertSame([3, 2], collect($respons->json('attempts'))->pluck('answered_count')->all());
    }

    public function test_kandidat_yang_sudah_kumpul_tetap_masuk_peringkat_bersama_yang_live()
    {
        Sanctum::actingAs($this->guru);

        $live = $this->buatSiswa('Kandidat Live', '3273011501990016');
        $kumpul = $this->buatSiswa('Kandidat Kumpul', '3273011501990017');
        $this->buatAttempt($live, [true, false, false]);
        $this->buatAttempt($kumpul, [true, true, true], 'submitted');

        $respons = $this->getJson("/api/guru/quiz/pakets/{$this->paket->id}/monitor");

        $respons->assertOk();
        $this->assertSame(
            ['Kandidat Kumpul', 'Kandidat Live'],
            collect($respons->json('attempts'))->pluck('siswa.nama')->all()
        );
        $this->assertSame(
            ['submitted', 'in_progress'],
            collect($respons->json('attempts'))->pluck('status')->all()
        );
    }

    private static function namaDatabaseUji(): ?string
    {
        if ($dariEnv = env('SERTIFIKASI_TEST_DB')) {
            return $dariEnv;
        }

        $file = base_path('.env');
        if (!is_readable($file)) {
            return null;
        }

        foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $baris) {
            $baris = trim($baris);
            if (str_starts_with($baris, '#') || !str_contains($baris, '=')) {
                continue;
            }
            [$kunci, $nilai] = explode('=', $baris, 2);
            if (trim($kunci) !== 'DB_DATABASE') {
                continue;
            }
            $nilai = trim($nilai, " \t\"'");

            return $nilai !== '' ? $nilai : null;
        }

        return null;
    }
}