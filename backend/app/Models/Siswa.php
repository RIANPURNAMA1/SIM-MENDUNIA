<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Siswa extends Model
{
    protected $table = 'siswas';

    protected $fillable = [
        'user_id',
        'shift_id',
        'kelas_id',
        'batch_id',
        'nama',
        'nik',
        'no_registrasi',
        'kelas',
        'batch',
        'level',
        'real_batch',
        'jenis_kelamin',
        'tempat_lahir',
        'tanggal_lahir',
        'agama',
        'alamat',
        'desa',
        'kecamatan',
        'kabupaten',
        'provinsi',
        'pendidikan_terakhir',
        'tahun_lulus',
        'tinggi_badan',
        'berat_badan',
        'goldar',
        'ukuran_baju',
        'status_pernikahan',
        'no_hp',
        'no_hp_ortu',
        'nama_ortu',
        'foto',
        'status',
        'keterangan',
        'status_kandidat',
        'is_cuti',
        'cuti_sejak',
        'level_status',
    ];

    protected $casts = [
        'level_status' => 'json',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function absensi()
    {
        return $this->hasMany(AbsensiSiswa::class, 'siswa_id');
    }

    /**
     * Resolusi level siswa untuk rekap: absensi dalam rentang → kolom level →
     * absensi kapan pun → level kelas aktif pada batch siswa.
     */
    public function levelRekap(?string $startDate = null, ?string $endDate = null): ?int
    {
        $level = $this->levelAbsensiTerbaru($startDate, $endDate);
        if ($level !== null) return $level;

        if (!empty($this->level)) return (int) $this->level;

        $level = $this->levelAbsensiTerbaru();
        if ($level !== null) return $level;

        $aktifLevels = KelasSensei::where('batch_id', $this->batch_id)
            ->where('status', 'aktif')
            ->whereNotNull('level')
            ->distinct()
            ->pluck('level');
        if ($aktifLevels->isNotEmpty()) {
            return (int) $aktifLevels->max();
        }

        return null;
    }

    /**
     * Level kelas dari absensi paling baru. Absensi wajib diurutkan, tanpa itu
     * "terakhir" hanya berarti baris acak hasil returned MySQL. Absensi dengan
     * kelas_sensei_id NULL diabaikan karena kelasnya sudah dihapus.
     */
    private function levelAbsensiTerbaru(?string $startDate = null, ?string $endDate = null): ?int
    {
        $q = $this->absensi()
            ->whereNotNull('kelas_sensei_id')
            ->whereHas('kelasSensei', fn ($k) => $k->whereNotNull('level'))
            ->with('kelasSensei:id,level')
            ->orderByRaw('tanggal IS NULL')
            ->orderByDesc('tanggal')
            ->orderByDesc('id');

        if ($startDate && $endDate) {
            $q->whereBetween('tanggal', [$startDate, $endDate]);
        }

        $level = $q->first()?->kelasSensei?->level;

        return ($level === null || $level === '') ? null : (int) $level;
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class, 'shift_id');
    }

    public function kelasRelasi()
    {
        return $this->belongsTo(Kelas::class, 'kelas_id');
    }

    public function batchRelasi()
    {
        return $this->belongsTo(Batch::class, 'batch_id');
    }
}
