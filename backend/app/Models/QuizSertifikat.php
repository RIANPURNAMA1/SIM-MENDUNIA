<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizSertifikat extends Model
{
    protected $table = 'quiz_sertifikat';

    protected $fillable = [
        'quiz_paket_id',
        'quiz_attempt_id',
        'siswa_id',
        'nomor',
        'kode_verifikasi',
        'kandidat_nama',
        'kandidat_nik',
        'kandidat_no_registrasi',
        'paket_judul',
        'paket_kategori',
        'sertifikat_judul',
        'sertifikat_penerbit',
        'batch_nama',
        'level',
        'nilai',
        'nilai_lulus',
        'lulus',
        'benar',
        'total_soal',
        'durasi_detik',
        'rincian_bagian',
        'foto',
        'issued_at',
        'expires_at',
    ];

    protected $casts = [
        'nilai' => 'integer',
        'nilai_lulus' => 'integer',
        'lulus' => 'boolean',
        'benar' => 'integer',
        'total_soal' => 'integer',
        'durasi_detik' => 'integer',
        'rincian_bagian' => 'array',
        'issued_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    protected $appends = ['foto_url'];

    public function getFotoUrlAttribute()
    {
        if (!$this->foto) {
            return null;
        }

        return asset('storage/' . $this->foto);
    }

    public function paket()
    {
        return $this->belongsTo(QuizPaket::class, 'quiz_paket_id');
    }

    public function attempt()
    {
        return $this->belongsTo(QuizAttempt::class, 'quiz_attempt_id');
    }

    public function siswa()
    {
        return $this->belongsTo(Siswa::class, 'siswa_id');
    }

    public function scopeAktif($q)
    {
        return $q->where(function ($w) {
            $w->whereNull('expires_at')->orWhere('expires_at', '>', now());
        });
    }
}
