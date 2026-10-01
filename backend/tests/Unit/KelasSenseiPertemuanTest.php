<?php

namespace Tests\Unit;

use App\Models\HariLibur;
use App\Models\KelasSensei;
use PHPUnit\Framework\TestCase;

/**
 * totalPertemuan() dihitung secara aritmetika (bukan loop per tanggal)
 * demi performa di halaman daftar pertemuan. Aritmetika itu mudah rusak
 * tanpa terdeteksi, jadi diuji langsung di sini.
 *
 * Test ini sengaja tidak memakai database: memo hari libur diisi lewat
 * reflection supaya bisa berjalan tanpa koneksi.
 */
class KelasSenseiPertemuanTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->withLibur([]);
    }

    /**
     * Isi memo hari libur tanpa menyentuh database.
     *
     * @param array<string> $tanggal
     */
    protected function withLibur(array $tanggal): void
    {
        foreach (['memoTanggal', 'memoTanggalSet', 'memoDibuatPada'] as $prop) {
            $ref = new \ReflectionProperty(HariLibur::class, $prop);
            $ref->setValue(null, match ($prop) {
                'memoTanggal' => $tanggal,
                'memoTanggalSet' => array_fill_keys($tanggal, true),
                default => time(),
            });
        }
    }

    protected function kelas(string $mulai, string $selesai): KelasSensei
    {
        $kelas = new KelasSensei();

        // setRawAttributes() sengaja dipakai supaya tidak melewati cast
        // tanggal, yang butuh koneksi database.
        $kelas->setRawAttributes([
            'tanggal_mulai' => $mulai,
            'tanggal_selesai' => $selesai,
        ], true);

        return $kelas;
    }

    public function test_menghitung_hari_kerja_saja(): void
    {
        // 17-23 Sep 2026 = 7 hari, 2 akhir pekan (Sab 19, Min 20) -> 5
        $this->assertSame(5, $this->kelas('2026-09-17', '2026-09-23')->totalPertemuan());
    }

    public function test_mengecualikan_hari_libur_nasional(): void
    {
        $this->withLibur(['2026-09-22']);
        $kelas = $this->kelas('2026-09-17', '2026-09-23');

        $this->assertSame(4, $kelas->totalPertemuan());
        $this->assertNotContains('2026-09-22', $kelas->daftarPertemuan());
    }

    public function test_hari_libur_di_akhir_pekan_tidak_dihitung_ganda(): void
    {
        // 19 Sep 2026 adalah Sabtu; sudah tidak dihitung sebagai hari kerja
        $this->withLibur(['2026-09-19']);
        $kelas = $this->kelas('2026-09-17', '2026-09-23');

        $this->assertSame(5, $kelas->totalPertemuan());
    }

    public function test_hari_libur_di_luar_rentang_diabaikan(): void
    {
        $this->withLibur(['2026-01-01', '2026-12-25']);
        $this->assertSame(5, $this->kelas('2026-09-17', '2026-09-23')->totalPertemuan());
    }

    public function test_rentang_terbalik_nol(): void
    {
        $this->assertSame(0, $this->kelas('2026-06-01', '2026-05-01')->totalPertemuan());
        $this->assertSame([], $this->kelas('2026-06-01', '2026-05-01')->daftarPertemuan());
    }

    public function test_satu_hari_sabtu_nol(): void
    {
        $this->assertSame(0, $this->kelas('2026-09-19', '2026-09-19')->totalPertemuan());
    }

    public function test_satu_hari_selasa_satu(): void
    {
        $this->assertSame(1, $this->kelas('2026-09-22', '2026-09-22')->totalPertemuan());
    }

    public function test_rentang_enam_bulan(): void
    {
        // 1 Apr - 30 Sep 2026 = 183 hari, 52 akhir pekan, 5 libur nasional -> 126
        $this->withLibur([
            '2026-04-03', '2026-05-01', '2026-05-27',
            '2026-06-01', '2026-08-17',
        ]);

        $this->assertSame(126, $this->kelas('2026-04-01', '2026-09-30')->totalPertemuan());
    }

    public function test_hasil_urutan_tidak_berlubang_saat_libur_dilewati(): void
    {
        $this->withLibur(['2026-09-22']);
        $daftar = $this->kelas('2026-09-17', '2026-09-30')->daftarPertemuan();

        $this->assertSame([
            '2026-09-17', '2026-09-18', '2026-09-21', '2026-09-23',
            '2026-09-24', '2026-09-25', '2026-09-28', '2026-09-29', '2026-09-30',
        ], $daftar);
    }

    /**
     * Invariant utama: hitungan cepat harus sama persis dengan menghitung
     * daftarMeeting satu per satu.
     */
    public function test_aritmetika_selalu_cocok_dengan_daftar(): void
    {
        $this->withLibur(['2026-05-01', '2026-06-01', '2026-08-17', '2026-09-22']);

        $mulai = new \DateTimeImmutable('2026-01-01');
        $dicek = 0;

        for ($i = 0; $i < 120; $i++) {
            $m = $mulai->modify("+{$i} days")->format('Y-m-d');
            $s = $mulai->modify('+' . ($i + 200) . ' days')->format('Y-m-d');

            $kelas = $this->kelas($m, $s);
            $this->assertSame(
                count($kelas->daftarPertemuan()),
                $kelas->totalPertemuan(),
                "rentang {$m} s/d {$s} tidak cocok"
            );
            $dicek++;
        }

        $this->assertSame(120, $dicek);
    }
}
