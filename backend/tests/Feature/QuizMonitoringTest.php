<?php

namespace Tests\Feature;

use App\Models\Batch;
use App\Models\Cabang;
use App\Models\Course;
use App\Models\Lesson;
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
 * Monitoring live per pertemuan: lesson_id harus mempersempit daftar paket
 * hanya ke paket milik pertemuan tersebut, sehingga layar kandidat tidak
 * tercampur paket dari pertemuan lain.
 *
 * Catatan database sama seperti QuizSertifikasiTest: migrasi repo memakai SQL
 * khusus MySQL, jadi tes berjalan di MySQL lokal dalam satu transaksi yang
 * selalu di-rollback di tearDown.
 */
class QuizMonitoringTest extends TestCase
{
    private User $admin;
    private Batch $batch;
    private Siswa $siswa;
    private Course $course;
    private QuizPaket $paketA;
    private QuizPaket $paketB;
    private Lesson $lessonA;
    private Lesson $lessonB;
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

        $this->admin = User::where('role', 'MANAGER')->first()
            ?? User::create([
                'name' => 'Admin Monitoring Uji', 'email' => 'monitor.admin@mendunia.test',
                'password' => bcrypt('rahasia'), 'role' => 'MANAGER',
            ]);

        $this->batch = Batch::create([
            'nama_batch' => 'Batch Monitoring Uji',
            'cabang_id' => Cabang::first()->id,
            'status' => 'aktif',
        ]);

        $this->siswa = Siswa::where('nik', '3273011501990002')->first()
            ?? Siswa::create([
                'nama' => 'Kandidat Monitoring', 'nik' => '3273011501990002',
                'no_registrasi' => 'REG/UJI/0002',
                'batch_id' => $this->batch->id, 'level' => '2', 'status' => 'aktif',
            ]);
        $this->siswa->update(['batch_id' => $this->batch->id, 'level' => '2']);

        $this->course = Course::create([
            'batch_id' => $this->batch->id,
            'level' => '2',
            'title' => 'Kursus Monitoring Uji',
            'sort' => 0,
            'status' => 'aktif',
        ]);

        $this->lessonA = Lesson::create([
            'course_id' => $this->course->id, 'title' => 'Pertemuan 1', 'sort' => 1, 'status' => 'aktif',
        ]);
        $this->lessonB = Lesson::create([
            'course_id' => $this->course->id, 'title' => 'Pertemuan 2', 'sort' => 2, 'status' => 'aktif',
        ]);

        $this->paketA = $this->buatPaket('Paket Pertemuan 1');
        $this->paketB = $this->buatPaket('Paket Pertemuan 2');

        DB::table('lms_lesson_quiz_pakets')->insert([
            ['lesson_id' => $this->lessonA->id, 'quiz_paket_id' => $this->paketA->id],
            ['lesson_id' => $this->lessonB->id, 'quiz_paket_id' => $this->paketB->id],
        ]);

        $this->buatAttempt($this->paketA, 'benar');
        $this->buatAttempt($this->paketB, 'salah');
    }

    private function buatPaket(string $judul): QuizPaket
    {
        $paket = QuizPaket::create([
            'user_id' => $this->admin->id,
            'title' => $judul,
            'description' => 'Paket uji monitoring',
            'level' => '2',
            'time_limit_minutes' => 30,
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

        $soal = QuizQuestion::create([
            'quiz_paket_id' => $paket->id,
            'question' => 'Soal ' . $judul,
            'options' => ['a', 'b', 'c'],
            'correct_index' => 0,
            'points' => 10,
            'sort' => 1,
            'question_type' => 'choice',
        ]);
        $paket->setRelation('soalUji', collect([$soal]));

        return $paket;
    }

    private function buatAttempt(QuizPaket $paket, string $statusJawaban): QuizAttempt
    {
        $attempt = QuizAttempt::create([
            'quiz_paket_id' => $paket->id,
            'siswa_id' => $this->siswa->id,
            'source' => 'lms',
            'attempt_number' => 1,
            'started_at' => now(),
            'submitted_at' => now(),
            'time_limit_seconds' => 1800,
            'score' => $statusJawaban === 'benar' ? 100 : 0,
            'correct_count' => $statusJawaban === 'benar' ? 1 : 0,
            'total_count' => 1,
            'warnings' => 0,
            'auto_submitted' => false,
            'status' => 'submitted',
        ]);

        $soal = QuizQuestion::where('quiz_paket_id', $paket->id)->orderBy('id')->first();
        $indexBenar = (int) $soal->correct_index;

        QuizAnswer::create([
            'quiz_attempt_id' => $attempt->id,
            'quiz_question_id' => $soal->id,
            'selected_index' => $statusJawaban === 'benar' ? $indexBenar : ($indexBenar + 1) % 3,
            'earned_points' => $statusJawaban === 'benar' ? 10 : 0,
            'is_correct' => $statusJawaban === 'benar',
        ]);

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

    public function test_monitoring_kursus_menampilkan_semua_paket_kursus()
    {
        Sanctum::actingAs($this->admin);

        $respons = $this->getJson("/api/admin-cabang/quiz/courses/{$this->course->id}/monitor");

        $respons->assertOk();
        $respons->assertJsonPath('lesson', null);

        $ids = collect($respons->json('pakets'))->pluck('id')->all();
        $this->assertContains($this->paketA->id, $ids);
        $this->assertContains($this->paketB->id, $ids);

        // Tanpa lesson_id layar hanya menampilkan satu paket terpilih, jadi
        // daftar kandidat ikut fokus ke paket itu saja.
        $respons->assertJsonPath('paket.id', $this->paketA->id);
        $this->assertSame(
            [$this->paketA->id],
            collect($respons->json('attempts'))->pluck('paket_id')->unique()->values()->all()
        );
    }

    public function test_monitoring_dengan_lesson_id_hanya_menampilkan_paket_pertemuan_tersebut()
    {
        Sanctum::actingAs($this->admin);

        $respons = $this->getJson("/api/admin-cabang/quiz/courses/{$this->course->id}/monitor?lesson_id={$this->lessonA->id}");

        $respons->assertOk();
        $respons->assertJsonPath('lesson.id', $this->lessonA->id);
        $respons->assertJsonPath('lesson.title', 'Pertemuan 1');
        $respons->assertJsonPath('paket.id', $this->paketA->id);

        $this->assertSame([$this->paketA->id], collect($respons->json('pakets'))->pluck('id')->all());
        $this->assertCount(1, $respons->json('attempts'));
        $this->assertSame($this->paketA->id, $respons->json('attempts.0.paket_id'));
        $this->assertSame(['benar'], $respons->json('attempts.0.answers_status'));

        // Poin sementara dihitung dari questions->points, bukan dari
        // attempt->score yang masih null selama pengerjaan berjalan.
        $respons->assertJsonPath('attempts.0.live_points', 10);
        $respons->assertJsonPath('attempts.0.max_points', 10);
        $respons->assertJsonPath('attempts.0.rank', 1);
    }

    public function test_monitoring_kursus_urutkan_kandidat_berdasarkan_poin_live()
    {
        Sanctum::actingAs($this->admin);

        // Tambah dua soal lagi per paket supaya poin antar kandidat bisa beda.
        foreach ([$this->paketA, $this->paketB] as $paket) {
            for ($i = 1; $i < 3; $i++) {
                QuizQuestion::create([
                    'quiz_paket_id' => $paket->id,
                    'question' => 'Soal tambahan ' . ($i + 1),
                    'options' => ['a', 'b', 'c'],
                    'correct_index' => 0,
                    'points' => 10,
                    'sort' => $i + 1,
                    'question_type' => 'choice',
                ]);
            }
            $paket->load('questions');
        }

        $rendah = Siswa::create([
            'nama' => 'Kandidat Rendah', 'nik' => '3273011501990021',
            'no_registrasi' => 'REG/MON/0021',
            'batch_id' => $this->batch->id, 'level' => '2', 'status' => 'aktif',
        ]);
        $tinggi = Siswa::create([
            'nama' => 'Kandidat Tinggi', 'nik' => '3273011501990022',
            'no_registrasi' => 'REG/MON/0022',
            'batch_id' => $this->batch->id, 'level' => '2', 'status' => 'aktif',
        ]);

        $attemptRendah = QuizAttempt::create([
            'quiz_paket_id' => $this->paketA->id,
            'siswa_id' => $rendah->id,
            'source' => 'lms',
            'attempt_number' => 1,
            'started_at' => now(),
            'submitted_at' => null,
            'time_limit_seconds' => 1800,
            'warnings' => 0,
            'auto_submitted' => false,
            'status' => 'in_progress',
        ]);
        $attemptTinggi = QuizAttempt::create([
            'quiz_paket_id' => $this->paketA->id,
            'siswa_id' => $tinggi->id,
            'source' => 'lms',
            'attempt_number' => 1,
            'started_at' => now(),
            'submitted_at' => null,
            'time_limit_seconds' => 1800,
            'warnings' => 0,
            'auto_submitted' => false,
            'status' => 'in_progress',
        ]);

        // Kandidat rendah benar 1 soal, kandidat tinggi benar semua.
        foreach ($this->paketA->questions as $i => $soal) {
            foreach ([
                [$attemptRendah, $i === 0 ? 0 : 1],
                [$attemptTinggi, 0],
            ] as [$attempt, $index]) {
                QuizAnswer::create([
                    'quiz_attempt_id' => $attempt->id,
                    'quiz_question_id' => $soal->id,
                    'selected_index' => $index,
                    'earned_points' => $index === 0 ? 10 : 0,
                    'is_correct' => $index === 0,
                ]);
            }
        }

        $respons = $this->getJson("/api/admin-cabang/quiz/courses/{$this->course->id}/monitor");

        $respons->assertOk();

        $rows = collect($respons->json('attempts'));

        // Kandidat Tinggi benar semua harus menduduki peringkat 1 dengan poin
        // penuh; attempt bawaan setUp dan Kandidat Rendah tetap ikut masuk
        // dengan poin lebih kecil.
        $this->assertSame('Kandidat Tinggi', $rows->first()['siswa']['nama']);
        $this->assertSame(1, $rows->first()['rank']);
        $this->assertSame(30, $rows->first()['live_points']);
        $this->assertSame(30, $rows->first()['max_points']);

        // Poin selalu non-naik sesuai peringkat, dan rank berurutan tanpa bolong.
        $poin = $rows->pluck('live_points')->values()->all();
        $sortedPoin = $poin;
        rsort($sortedPoin);
        $this->assertSame($sortedPoin, $poin);
        $this->assertSame(range(1, $rows->count()), $rows->pluck('rank')->values()->all());
        $this->assertContains('Kandidat Rendah', $rows->pluck('siswa.nama')->all());
    }

    public function test_monitoring_pertemuan_kedua_menampilkan_kandidat_dan_status_soal_yang_sedang_dikerjakan()
    {
        Sanctum::actingAs($this->admin);

        $respons = $this->getJson("/api/admin-cabang/quiz/courses/{$this->course->id}/monitor?lesson_id={$this->lessonB->id}");

        $respons->assertOk();
        $respons->assertJsonPath('lesson.title', 'Pertemuan 2');
        $respons->assertJsonPath('attempts.0.siswa.nama', 'Kandidat Monitoring');
        $this->assertSame(['salah'], $respons->json('attempts.0.answers_status'));
        $this->assertSame(1, $respons->json('attempts.0.answered_count'));
    }

    public function test_lesson_id_asing_tidak_membocorkan_paket_pertemuan_lain()
    {
        Sanctum::actingAs($this->admin);

        $lessonLain = Lesson::create([
            'course_id' => $this->course->id, 'title' => 'Pertemuan Tanpa Paket',
            'sort' => 3, 'status' => 'aktif',
        ]);

        $respons = $this->getJson("/api/admin-cabang/quiz/courses/{$this->course->id}/monitor?lesson_id={$lessonLain->id}");

        $respons->assertOk();
        $respons->assertJsonPath('lesson.id', $lessonLain->id);
        $respons->assertJsonPath('paket', null);
        $this->assertSame([], $respons->json('pakets'));
        $this->assertSame([], $respons->json('attempts'));
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