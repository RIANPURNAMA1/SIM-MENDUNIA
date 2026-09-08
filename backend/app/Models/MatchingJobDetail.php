<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MatchingJobDetail extends Model
{
    protected $table = 'matching_job_details';

    protected $fillable = [
        'matching_job_form_id',
        'user_id',
        'pendaftar_id',
        'penempatan_kandidat_id',
        'status_formulir',
        'status_progres',
        'nama_romaji',
        'nama_katakana',
        'nik',
        'email',
        'email_kontak',
        'cabang_id',
        'tempat_lahir',
        'tanggal_lahir',
        'umur',
        'jenis_kelamin',
        'status_pernikahan',
        'agama',
        'tinggi_badan',
        'berat_badan',
        'golongan_darah',
        'tangan_dominan',
        'ukuran_baju',
        'lingkar_pinggang',
        'panjang_telapak_kaki',
        'sim_dimiliki',
        'nomor_hp',
        'kontak_ortu_nama',
        'kontak_ortu_hp',
        'alamat_lengkap',
        'pendidikan_terakhir',
        'sudah_vaksin',
        'kondisi_kesehatan',
        'penglihatan_kanan',
        'penglihatan_kiri',
        'berkacamata',
        'lensa_kontak',
        'buta_warna',
        'bertato',
        'merokok',
        'minum_alkohol',
        'riwayat_penyakit',
        'pendidikan',
        'pengalaman',
        'level_jlpt',
        'level_jft',
        'lama_belajar_jepang',
        'level_bahasa_jepang',
        'id_prometric',
        'password_prometric',
        'sertifikat_ssw',
        'keluarga',
        'penghasilan_keluarga',
        'pernah_ke_jepang',
        'keluarga_di_jepang',
        'kenalan_di_jepang',
        'tujuan_ke_jepang',
        'alasan_ke_jepang',
        'cita_cita_setelah_jepang',
        'rencana_pengiriman_uang',
        'kelebihan_diri',
        'kekurangan_diri',
        'hobi',
        'keahlian',
        'bersedia_shift',
        'bersedia_lembur',
        'bersedia_hari_libur',
        'lama_tinggal_jepang',
        'lama_kerja_perusahaan',
        'rencana_pulang',
        'sumber_biaya',
        'biaya_disiapkan',
    ];

    protected $casts = [
        'tanggal_lahir' => 'date',
        'sudah_vaksin' => 'boolean',
        'berkacamata' => 'boolean',
        'lensa_kontak' => 'boolean',
        'buta_warna' => 'boolean',
        'bertato' => 'boolean',
        'merokok' => 'boolean',
        'minum_alkohol' => 'boolean',
        'pendidikan' => 'array',
        'pengalaman' => 'array',
        'sertifikat_ssw' => 'array',
        'keluarga' => 'array',
        'pernah_ke_jepang' => 'boolean',
        'keluarga_di_jepang' => 'boolean',
        'kenalan_di_jepang' => 'boolean',
        'bersedia_shift' => 'boolean',
        'bersedia_lembur' => 'boolean',
        'bersedia_hari_libur' => 'boolean',
    ];

    public function form()
    {
        return $this->belongsTo(MatchingJobForm::class, 'matching_job_form_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function pendaftar()
    {
        return $this->belongsTo(Pendaftar::class);
    }

    /**
     * Simpan/mutakhirkan baris relasional per-field untuk satu formulir matching job.
     */
    public static function syncFromForm(MatchingJobForm $form, ?array $payload): self
    {
        $data = [];
        if (!empty($payload)) {
            foreach (static::columnMap() as $src => $col) {
                if (array_key_exists($src, $payload)) {
                    $data[$col] = $payload[$src] ?? null;
                }
            }
        }

        return static::updateOrCreate(
            ['matching_job_form_id' => $form->id],
            array_merge([
                'user_id' => $form->user_id,
                'pendaftar_id' => $form->pendaftar_id,
                'penempatan_kandidat_id' => $form->penempatan_kandidat_id,
                'status_formulir' => $form->status_formulir,
            ], $data)
        );
    }

    /**
     * Peta nama key payload frontend -> kolom tabel relasional.
     */
    public static function columnMap(): array
    {
        return [
            'nama_romaji' => 'nama_romaji',
            'nama_katakana' => 'nama_katakana',
            'nik' => 'nik',
            'email' => 'email',
            'email_kontak' => 'email_kontak',
            'cabang_id' => 'cabang_id',
            'tempat_lahir' => 'tempat_lahir',
            'tanggal_lahir' => 'tanggal_lahir',
            'umur' => 'umur',
            'jenis_kelamin' => 'jenis_kelamin',
            'status_pernikahan' => 'status_pernikahan',
            'agama' => 'agama',
            'tinggi_badan' => 'tinggi_badan',
            'berat_badan' => 'berat_badan',
            'golongan_darah' => 'golongan_darah',
            'tangan_dominan' => 'tangan_dominan',
            'ukuran_baju' => 'ukuran_baju',
            'lingkar_pinggang' => 'lingkar_pinggang',
            'panjang_telapak_kaki' => 'panjang_telapak_kaki',
            'sim_dimiliki' => 'sim_dimiliki',
            'nomor_hp' => 'nomor_hp',
            'kontak_ortu_nama' => 'kontak_ortu_nama',
            'kontak_ortu_hp' => 'kontak_ortu_hp',
            'alamat_lengkap' => 'alamat_lengkap',
            'pendidikan_terakhir' => 'pendidikan_terakhir',
            'sudah_vaksin' => 'sudah_vaksin',
            'kondisi_kesehatan' => 'kondisi_kesehatan',
            'penglihatan_kanan' => 'penglihatan_kanan',
            'penglihatan_kiri' => 'penglihatan_kiri',
            'berkacamata' => 'berkacamata',
            'lensa_kontak' => 'lensa_kontak',
            'buta_warna' => 'buta_warna',
            'bertato' => 'bertato',
            'merokok' => 'merokok',
            'minum_alkohol' => 'minum_alkohol',
            'riwayat_penyakit' => 'riwayat_penyakit',
            'pendidikan' => 'pendidikan',
            'pengalaman' => 'pengalaman',
            'level_jlpt' => 'level_jlpt',
            'level_jft' => 'level_jft',
            'lama_belajar_jepang' => 'lama_belajar_jepang',
            'level_bahasa_jepang' => 'level_bahasa_jepang',
            'id_prometric' => 'id_prometric',
            'password_prometric' => 'password_prometric',
            'sertifikat_ssw' => 'sertifikat_ssw',
            'keluarga' => 'keluarga',
            'penghasilan_keluarga' => 'penghasilan_keluarga',
            'pernah_ke_jepang' => 'pernah_ke_jepang',
            'keluarga_di_jepang' => 'keluarga_di_jepang',
            'kenalan_di_jepang' => 'kenalan_di_jepang',
            'tujuan_ke_jepang' => 'tujuan_ke_jepang',
            'alasan_ke_jepang' => 'alasan_ke_jepang',
            'cita_cita_setelah_jepang' => 'cita_cita_setelah_jepang',
            'rencana_pengiriman_uang' => 'rencana_pengiriman_uang',
            'kelebihan_diri' => 'kelebihan_diri',
            'kekurangan_diri' => 'kekurangan_diri',
            'hobi' => 'hobi',
            'keahlian' => 'keahlian',
            'bersedia_shift' => 'bersedia_shift',
            'bersedia_lembur' => 'bersedia_lembur',
            'bersedia_hari_libur' => 'bersedia_hari_libur',
            'lama_tinggal_jepang' => 'lama_tinggal_jepang',
            'lama_kerja_perusahaan' => 'lama_kerja_perusahaan',
            'rencana_pulang' => 'rencana_pulang',
            'sumber_biaya' => 'sumber_biaya',
            'biaya_disiapkan' => 'biaya_disiapkan',
            'status_progres' => 'status_progres',
        ];
    }
}