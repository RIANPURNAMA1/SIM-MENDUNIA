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
        $level = $this->absensi()
            ->when($startDate && $endDate, fn ($q) => $q->whereBetween('tanggal', [$startDate, $endDate]))
            ->with('kelasSensei:id,level')
            ->get()
            ->map(fn ($a) => $a->kelasSensei?->level)
            ->filter()
            ->last();
        if ($level !== null) return (int) $level;

        if (!empty($this->level)) return (int) $this->level;

        $level = $this->absensi()
            ->with('kelasSensei:id,level')
            ->get()
            ->map(fn ($a) => $a->kelasSensei?->level)
            ->filter()
            ->last();
        if ($level !== null) return (int) $level;

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
