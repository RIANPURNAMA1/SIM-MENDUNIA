<?php

namespace Tests\Feature;

use App\Models\Batch;
use App\Models\Cabang;
use App\Models\Siswa;
use App\Models\User;
use App\Models\QuizPaket;
use App\Models\QuizQuestion;
use App\Models\QuizSection;
use App\Models\QuizSertifikat;
use App\Services\QuizSertifikatService;
use App\Models\QuizAttempt;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Alur sertifikasi ujian: pengaturan paket, gerbang foto pra-ujian, penerbitan
 * sertifikat, dan verifikasi publik.
 *
 * Catatan penting soal database: phpunit.xml menunjuk SQLite in-memory, tapi
 * migrasi repo ini memakai SQL khusus MySQL (MODIFY COLUMN), jadi skema tidak
 * bisa dibangun di SQLite. Karena itu tes ini sengaja memakai koneksi MySQL
 * lokal DI DALAM satu transaksi yang selalu di-rollback di tearDown, sehingga
 * data asli tidak pernah berubah.
 */
class QuizSertifikasiTest extends TestCase
{
    private User $admin;
    private User $userSiswa;
    private Siswa $siswa;
    private Batch $batch;
    private QuizPaket $paket;
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

        Storage::fake('public');

        $this->admin = User::where('role', 'MANAGER')->first()
            ?? User::create([
                'name' => 'Admin Uji', 'email' => 'admin.uji@mendunia.test',
                'password' => bcrypt('rahasia'), 'role' => 'MANAGER',
            ]);

        $this->userSiswa = User::where('role', 'KANDIDAT')->first()
            ?? User::create([
                'name' => 'Kandidat Uji', 'email' => 'kandidat.uji@mendunia.test',
                'password' => bcrypt('rahasia'), 'role' => 'KANDIDAT',
            ]);

        $this->batch = Batch::create([
            'nama_batch' => 'Batch Sertifikasi Uji',
            'cabang_id' => Cabang::first()->id,
            'status' => 'aktif',
        ]);

        $this->siswa = Siswa::where('user_id', $this->userSiswa->id)->first()
            ?? Siswa::create([
                'user_id' => $this->userSiswa->id, 'nama' => 'Kandidat Uji',
                'nik' => '3273011501990001', 'no_registrasi' => 'REG/UJI/0001',
                'batch_id' => $this->batch->id, 'level' => '2', 'status' => 'aktif',
            ]);
        $this->siswa->update([
            'batch_id' => $this->batch->id, 'level' => '2', 'nik' => '3273011501990001',
        ]);

        $this->paket = $this->buatPaketSertifikasi();
    }

    private function buatPaketSertifikasi(array $tambahan = []): QuizPaket
    {
        Sanctum::actingAs($this->admin);

        $respons = $this->postJson('/api/admin-cabang/quiz/pakets', array_merge([
            'title' => 'Simulasi JFT', 'description' => 'Uji sertifikasi',
            'category' => 'Ujian', 'level' => '2',
            'time_limit_minutes' => 30, 'max_attempts' => 3, 'max_warnings' => 3,
            'passing_score' => 70, 'shuffle_questions' => false,
            'quiz_template' => 'basic', 'camera_enabled' => false, 'block_exit' => false,
            'status' => 'aktif', 'batch_id' => $this->batch->id,
            'sertifikasi_aktif' => true,
            'sertifikat_judul' => 'Sertifikat Kemampuan Bahasa Jepang',
            'sertifikat_penerbit' => 'Lembaga BAHASA',
            'sertifikat_berlaku_hari' => 365,
            'sertifikat_wajib_foto' => true,
        ], $tambahan));

        $respons->assertCreated();
        $paket = QuizPaket::find($respons->json('paket.id'));

        $script = QuizSection::create(['quiz_paket_id' => $paket->id, 'name' => 'Script and Vocabulary', 'sort' => 1]);
        $grammar = QuizSection::create(['quiz_paket_id' => $paket->id, 'name' => 'Grammar', 'sort' => 2]);
        $listening = QuizSection::create(['quiz_paket_id' => $paket->id, 'name' => 'Listening', 'sort' => 3]);

        // 4 soal x 10 poin: 3 dijawab benar -> 75 dari 100.
        $soal = [];
        foreach ([[$script, 0], [$script, 1], [$grammar, 2], [$listening, 0]] as $i => [$bagian, $benar]) {
            $soal[] = QuizQuestion::create([
                'quiz_paket_id' => $paket->id, 'section_id' => $bagian->id,
                'question' => 'Soal ' . ($i + 1), 'options' => ['a', 'b', 'c'],
                'correct_index' => $benar, 'points' => 10, 'sort' => 1,
                'question_type' => 'choice',
            ]);
        }
        $paket->setRelation('soalUji', collect($soal));

        return $paket;
    }

    protected function tearDown(): void
    {
        if ($this->transaksiMulai) {
            DB::connection('mysql')->rollBack();
            $this->transaksiMulai = false;
        }

        parent::tearDown();
    }

    /**
     * Jawaban untuk keempat soal, urut sama seperti pembuatan soal:
     * Script 1, Script 2, Grammar, Listening.
     *
     * $salahkan berisi nama bagian yang justru dijawab salah, supaya skenario
     * nilai campur (mis. 75 dari 100) ikut teruji.
     *
     * @return array<int, array{0:int, 1:int}> question id => jawaban yang dikirim
     */
    private function jawabanBenar(string $salahkan = ''): array
    {
        $out = [];
        foreach (QuizQuestion::where('quiz_paket_id', $this->paket->id)->orderBy('id')->get() as $soal) {
            $benar = (int) $soal->correct_index;
            $jawab = $soal->section && $soal->section->name === $salahkan
                ? ($benar + 1) % 3
                : $benar;
            $out[] = [$soal->id, $jawab];
        }

        return $out;
    }

    /**
     * Nama database MySQL untuk tes ini.
     *
     * Diambil dari SERTIFIKASI_TEST_DB, atau dari .env lokal. Kalau keduanya
     * tidak ada (misalnya di CI tanpa .env), tes di-skip, bukan dijalankan
     * memakai database yang tidak sengaja.
     */
    private static function namaDatabaseUji(): ?string
    {
        if ($dariEnv = env('SERTIFIKASI_TEST_DB')) {
            return $dariEnv;
        }

        $file = base_path('.env');
        if (!is_readable($file)) {
            return null;
        }

        // .env Laravel tidak selalu valid INI (nilai bisa berisi kurung atau
        // tanda kutip), jadi dibaca per baris, bukan lewat parse_ini_file.
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

    private function sebagaiSiswa(): void
    {
        Sanctum::actingAs($this->userSiswa);
    }
    private function tokenFotoValid(string $nama = 'wajah.jpg'): string
    {
        $respons = $this->postJson("/api/quiz/pakets/{$this->paket->id}/sertifikasi/foto", [
            'photo' => UploadedFile::fake()->create($nama, 200, 'image/jpeg'),
        ]);
        $respons->assertOk();

        return $respons->json('sertifikat_foto_token');
    }

    private function kerjakanDanSubmit(array $jawaban): array
    {
        $start = $this->postJson("/api/quiz/pakets/{$this->paket->id}/start", [
            'sertifikat_foto_token' => $this->tokenFotoValid(),
        ]);
        $start->assertCreated();
        $attemptId = $start->json('attempt.id');

        foreach ($jawaban as [$questionId, $index]) {
            $this->postJson("/api/quiz/attempts/{$attemptId}/answer", [
                'question_id' => $questionId, 'selected_index' => $index,
            ])->assertOk();
        }

        $submit = $this->postJson("/api/quiz/attempts/{$attemptId}/submit");
        $submit->assertOk();

        return $submit->json('attempt');
    }

    // ================= Pengaturan =================

    public function test_pengaturan_sertifikasi_tersimpan(): void
    {
        $paket = $this->paket->fresh();

        $this->assertTrue((bool) $paket->sertifikasi_aktif);
        $this->assertSame('Sertifikat Kemampuan Bahasa Jepang', $paket->sertifikat_judul);
        $this->assertSame('Lembaga BAHASA', $paket->sertifikat_penerbit);
        $this->assertSame(365, (int) $paket->sertifikat_berlaku_hari);
        $this->assertTrue((bool) $paket->sertifikat_wajib_foto);
    }

    public function test_sertifikasi_aktif_selalu_menyalakan_foto_wajib(): void
    {
        Sanctum::actingAs($this->admin);

        // Klien mengirim toggle foto=false, tapi sertifikasi aktif tetap mewajibkan foto.
        $this->postJson("/api/admin-cabang/quiz/pakets/{$this->paket->id}", [
            'sertifikasi_aktif' => true,
            'sertifikat_wajib_foto' => false,
        ])->assertOk();

        $this->assertTrue((bool) $this->paket->fresh()->sertifikat_wajib_foto);
    }

    public function test_sertifikasi_bisa_dimatikan(): void
    {
        Sanctum::actingAs($this->admin);

        $this->postJson("/api/admin-cabang/quiz/pakets/{$this->paket->id}", [
            'sertifikasi_aktif' => false, 'sertifikat_judul' => '', 'sertifikat_berlaku_hari' => '',
        ])->assertOk();

        $paket = $this->paket->fresh();
        $this->assertFalse((bool) $paket->sertifikasi_aktif);
        $this->assertNull($paket->sertifikat_judul);
        $this->assertNull($paket->sertifikat_berlaku_hari);
    }

    // ================= Gerbang foto =================

    public function test_ujian_tersertifikasi_tidak_bisa_dimulai_tanpa_foto(): void
    {
        $this->sebagaiSiswa();

        $respons = $this->postJson("/api/quiz/pakets/{$this->paket->id}/start");

        $respons->assertStatus(422);
        $this->assertSame('sertifikasi_foto_required', $respons->json('code'));
        $this->assertSame(0, QuizAttempt::where('quiz_paket_id', $this->paket->id)->count());
    }

    public function test_token_foto_tidak_boleh_dipakai_siswa_atau_paket_lain(): void
    {
        $this->sebagaiSiswa();
        $token = $this->tokenFotoValid();

        $respons = $this->postJson("/api/quiz/pakets/{$this->paket->id}/start", [
            'sertifikat_foto_token' => 'token-palsu-1234567890',
        ]);
        $respons->assertStatus(422);

        // Token milik siswa ini tetap sah untuk paket ini saja.
        $this->postJson("/api/quiz/pakets/{$this->paket->id}/start", [
            'sertifikat_foto_token' => $token,
        ])->assertCreated();
    }

    public function test_foto_tetap_diwajibkan_walau_toggle_dimatikan_di_database(): void
    {
        // Menirukan paket lama/hasil request yang pernah menyimpan toggle false.
        $this->paket->forceFill(['sertifikat_wajib_foto' => false])->save();
        $this->sebagaiSiswa();

        $respons = $this->postJson("/api/quiz/pakets/{$this->paket->id}/start");
        $respons->assertStatus(422);
        $this->assertSame('sertifikasi_foto_required', $respons->json('code'));

        // Detail paket juga menginformasikan bahwa foto tetap wajib.
        $this->getJson("/api/quiz/pakets/{$this->paket->id}")
            ->assertJsonPath('paket.sertifikat_wajib_foto', true);
    }

    public function test_token_foto_hanya_berlaku_satu_percobaan(): void
    {
        $this->sebagaiSiswa();
        $jawaban = $this->jawabanBenar();

        $token = $this->tokenFotoValid();

        $start = $this->postJson("/api/quiz/pakets/{$this->paket->id}/start", [
            'sertifikat_foto_token' => $token,
        ])->assertCreated();
        $attemptId = $start->json('attempt.id');

        foreach ($jawaban as [$questionId, $index]) {
            $this->postJson("/api/quiz/attempts/{$attemptId}/answer", [
                'question_id' => $questionId, 'selected_index' => $index,
            ])->assertOk();
        }
        $this->postJson("/api/quiz/attempts/{$attemptId}/submit")->assertOk();

        // Percobaan kedua harus memotret ulang, bukan memakai token yang sama.
        $respons = $this->postJson("/api/quiz/pakets/{$this->paket->id}/start", [
            'sertifikat_foto_token' => $token,
        ]);

        $respons->assertStatus(422);
        $this->assertSame('sertifikasi_foto_required', $respons->json('code'));

        // Dengan foto baru, percobaan kedua tetap bisa jalan.
        $this->postJson("/api/quiz/pakets/{$this->paket->id}/start", [
            'sertifikat_foto_token' => $this->tokenFotoValid('wajah2.jpg'),
        ])->assertCreated();
    }

    public function test_foto_terpasang_pada_attempt(): void
    {
        $this->sebagaiSiswa();
        $token = $this->tokenFotoValid();

        $start = $this->postJson("/api/quiz/pakets/{$this->paket->id}/start", [
            'sertifikat_foto_token' => $token,
        ]);
        $start->assertCreated();

        $this->assertNotNull(
            \App\Models\QuizAttempt::find($start->json('attempt.id'))->foto_wajah
        );
    }

    // ================= Sertifikat =================

    public function test_sertifikat_terbit_setelah_submit(): void
    {
        $this->sebagaiSiswa();
        $hasil = $this->kerjakanDanSubmit($this->jawabanBenar('Listening'));

        $this->assertSame(75, (int) $hasil['score']);

        $sertifikat = $hasil['sertifikat'];
        $this->assertIsArray($sertifikat);
        $this->assertSame($this->siswa->nama, $sertifikat['kandidat_nama']);
        $this->assertSame(75, (int) $sertifikat['nilai']);
        $this->assertTrue($sertifikat['lulus']);
        $this->assertStringStartsWith('SRT/', $sertifikat['nomor']);
        $this->assertSame(8, strlen($sertifikat['kode_verifikasi']));
        $this->assertNotEmpty($sertifikat['foto_url']);
        $this->assertNotEmpty($sertifikat['tanggal_indah']);
        $this->assertFalse($sertifikat['expired']);

        // Judul dan penerbit kustom dari pengaturan paket, bukan judul paket.
        $this->assertSame('Sertifikat Kemampuan Bahasa Jepang', $sertifikat['judul']);
        $this->assertSame('Lembaga BAHASA', $sertifikat['penerbit']);
        $this->assertSame('Simulasi JFT', $sertifikat['judul_paket']);
    }

    public function test_rincian_nilai_per_bagian(): void
    {
        $this->sebagaiSiswa();
        $hasil = $this->kerjakanDanSubmit($this->jawabanBenar('Listening'));

        $rincian = collect($hasil['sertifikat']['rincian_bagian'])->keyBy('name');

        // Hanya bagian yang benar-benar punya soal yang ditampilkan.
        $this->assertCount(3, $rincian);
        $this->assertSame(100.0, (float) $rincian['Script and Vocabulary']['percent']);
        $this->assertSame(100.0, (float) $rincian['Grammar']['percent']);
        $this->assertSame(0.0, (float) $rincian['Listening']['percent']);
        $this->assertSame(2, (int) $rincian['Script and Vocabulary']['total']);
        $this->assertArrayNotHasKey('Tanpa Bagian', $rincian->all());
    }

    public function test_sertifikat_terbit_walau_nilai_di_bawah_batas(): void
    {
        $this->sebagaiSiswa();

        $start = $this->postJson("/api/quiz/pakets/{$this->paket->id}/start", [
            'sertifikat_foto_token' => $this->tokenFotoValid(),
        ])->assertCreated();
        $attemptId = $start->json('attempt.id');

        // Semua soal dijawab salah -> nilai 0.
        foreach ($this->jawabanBenar() as [$questionId, $index]) {
            $soal = QuizQuestion::find($questionId);
            $salah = ((int) $soal->correct_index + 1) % 3;
            $this->postJson("/api/quiz/attempts/{$attemptId}/answer", [
                'question_id' => $questionId, 'selected_index' => $salah,
            ])->assertOk();
        }

        $hasil = $this->postJson("/api/quiz/attempts/{$attemptId}/submit")->json('attempt');

        $this->assertSame(0, (int) $hasil['score']);
        $this->assertFalse($hasil['sertifikat']['lulus']);
        $this->assertNotEmpty($hasil['sertifikat']['nomor'], 'Sertifikat tetap terbit walau tidak lulus');
    }

    public function test_satu_sertifikat_per_percobaan_dan_tidak_menggandakan(): void
    {
        $this->sebagaiSiswa();
        $hasil = $this->kerjakanDanSubmit($this->jawabanBenar());
        $attemptId = $hasil['attempt_id'];

        $this->assertSame(1, QuizSertifikat::where('quiz_attempt_id', $attemptId)->count());

        \App\Services\QuizSertifikatService::terbitkan(
            \App\Models\QuizAttempt::find($attemptId)
        );

        $this->assertSame(1, QuizSertifikat::where('quiz_attempt_id', $attemptId)->count());
    }

    public function test_setiap_percobaan_mendapat_sertifikat_terpisah(): void
    {
        $this->sebagaiSiswa();
        $jawaban = $this->jawabanBenar();

        $pertama = $this->kerjakanDanSubmit($jawaban);
        $kedua = $this->kerjakanDanSubmit($jawaban);

        $this->assertNotSame($pertama['sertifikat']['id'], $kedua['sertifikat']['id']);
        $this->assertNotSame($pertama['sertifikat']['nomor'], $kedua['sertifikat']['nomor']);
        $this->assertSame(2, QuizSertifikat::where('quiz_paket_id', $this->paket->id)->count());
    }

    public function test_tidak_ada_sertifikat_bila_sertifikasi_nonaktif(): void
    {
        Sanctum::actingAs($this->admin);
        $this->postJson("/api/admin-cabang/quiz/pakets/{$this->paket->id}", [
            'sertifikasi_aktif' => false,
        ])->assertOk();

        $this->sebagaiSiswa();
        $start = $this->postJson("/api/quiz/pakets/{$this->paket->id}/start")->assertCreated();
        $attemptId = $start->json('attempt.id');

        foreach ($this->jawabanBenar() as [$questionId, $index]) {
            $this->postJson("/api/quiz/attempts/{$attemptId}/answer", [
                'question_id' => $questionId, 'selected_index' => $index,
            ])->assertOk();
        }

        $hasil = $this->postJson("/api/quiz/attempts/{$attemptId}/submit")->json('attempt');

        $this->assertNull($hasil['sertifikat']);
        $this->assertSame(0, QuizSertifikat::where('quiz_paket_id', $this->paket->id)->count());
    }

    // ================= Verifikasi publik =================

    public function test_verifikasi_publik_dengan_kode_yang_benar(): void
    {
        $this->sebagaiSiswa();
        $hasil = $this->kerjakanDanSubmit($this->jawabanBenar());
        $kode = $hasil['sertifikat']['kode_verifikasi'];

        // Endpoint verifikasi memang tanpa login.
        $this->app['auth']->forgetGuards();

        $respons = $this->getJson("/api/sertifikat/verify/{$kode}");
        $respons->assertOk();
        $this->assertTrue($respons->json('valid'));
        $this->assertSame($this->siswa->nama, $respons->json('sertifikat.kandidat_nama'));
        $this->assertSame((float) 100.0, (float) $respons->json('sertifikat.rincian_bagian.0.percent'));
    }

    public function test_verifikasi_publik_tidak_membocorkan_data_pribadi(): void
    {
        $this->sebagaiSiswa();
        $hasil = $this->kerjakanDanSubmit($this->jawabanBenar());

        // Endpoint verifikasi memang tanpa login.
        $this->app['auth']->forgetGuards();

        $sertifikat = $this->getJson("/api/sertifikat/verify/{$hasil['sertifikat']['kode_verifikasi']}")
            ->json('sertifikat');

        $this->assertSame('************0001', $sertifikat['kandidat_nik']);
        $this->assertArrayNotHasKey('foto_url', $sertifikat);
        $this->assertArrayNotHasKey('kandidat_no_registrasi', $sertifikat);
    }

    public function test_verifikasi_kode_tidak_dikenal(): void
    {
        // Endpoint verifikasi memang tanpa login.
        $this->app['auth']->forgetGuards();

        $this->getJson('/api/sertifikat/verify/KODEPALSU')->assertNotFound();
    }

    public function test_verifikasi_huruf_kecil_tetap_ditemukan(): void
    {
        $this->sebagaiSiswa();
        $hasil = $this->kerjakanDanSubmit($this->jawabanBenar());

        // Endpoint verifikasi memang tanpa login.
        $this->app['auth']->forgetGuards();

        $this->getJson('/api/sertifikat/verify/' . strtolower($hasil['sertifikat']['kode_verifikasi']))
            ->assertOk();
    }
}
