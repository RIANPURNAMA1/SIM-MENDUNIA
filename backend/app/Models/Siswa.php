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
    ];

    protected $casts = [];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function absensi()
    {
        return $this->hasMany(AbsensiSiswa::class, 'siswa_id');
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
