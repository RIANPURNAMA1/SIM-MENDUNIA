<?php

namespace App\Traits;

/**
 * Aturan validasi untuk pengaturan sertifikasi ujian pada paket soal.
 *
 * Dipakai AdminQuizController, GuruQuizController, dan AdminCabang supaya
 * ketiganya tidak berbeda pendapat soal field apa saja yang bisa dikirim.
 */
trait HandlesSertifikasiSetting
{
    /**
     * Aturan validasi setelan sertifikasi.
     *
     * Semuanya nullable: pada store boleh tidak dikirim, pada update hanya
     * field yang benar-benar dikirim yang ikut ter-update.
     *
     * @return array<string, string>
     */
    protected function aturanSertifikasi(): array
    {
        return [
            'sertifikasi_aktif' => 'nullable|boolean',
            'sertifikat_judul' => 'nullable|string|max:150',
            'sertifikat_penerbit' => 'nullable|string|max:150',
            'sertifikat_berlaku_hari' => 'nullable|integer|min:1|max:3650',
            'sertifikat_wajib_foto' => 'nullable|boolean',
        ];
    }

    /**
     * Normalisasi nilai setelan sebelum disimpan.
     *
     * Semua kolom dibersihkan ke null kalau kosong, supaya tidak ada string
     * kosong yang tersimpan dan muncul lagi saat fitur dinyalakan lain kali.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function normalisasiSertifikasi(array $data): array
    {
        if (array_key_exists('sertifikasi_aktif', $data)) {
            $data['sertifikasi_aktif'] = (bool) $data['sertifikasi_aktif'];
        }

        if (array_key_exists('sertifikat_wajib_foto', $data)) {
            $data['sertifikat_wajib_foto'] = (bool) $data['sertifikat_wajib_foto'];
        }

        if (array_key_exists('sertifikat_berlaku_hari', $data)) {
            $hari = $data['sertifikat_berlaku_hari'];
            $data['sertifikat_berlaku_hari'] = ($hari === null || $hari === '') ? null : (int) $hari;
        }

        foreach (['sertifikat_judul', 'sertifikat_penerbit'] as $kunci) {
            if (array_key_exists($kunci, $data)) {
                $nilai = $data[$kunci];
                $data[$kunci] = ($nilai === null || trim((string) $nilai) === '') ? null : trim((string) $nilai);
            }
        }

        if (array_key_exists('sertifikasi_aktif', $data) && !$data['sertifikasi_aktif']) {
            $data['sertifikat_judul'] = $data['sertifikat_judul'] ?? null;
            $data['sertifikat_penerbit'] = $data['sertifikat_penerbit'] ?? null;
        }

        // Mengaktifkan sertifikasi selalu berarti foto identitas wajib diambil
        // sebelum ujian, jadi toggle dari klien tidak boleh mematikan hal ini.
        if (array_key_exists('sertifikasi_aktif', $data)) {
            $data['sertifikat_wajib_foto'] = (bool) $data['sertifikasi_aktif'];
        }

        return $data;
    }
}
