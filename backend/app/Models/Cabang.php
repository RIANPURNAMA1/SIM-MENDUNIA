<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cabang extends Model
{
    protected $fillable = [
        'kode_cabang',
        'barcode',
        'nama_cabang',
        'status_pusat',
        'latitude',
        'longitude',
        'radius',
        'alamat'
    ];

    protected static function booted()
    {
        static::creating(function ($cabang) {
            if (!$cabang->barcode) {
                $cabang->barcode = 'CAB-' . strtoupper(substr(md5(uniqid()), 0, 10));
            }
        });

        static::updating(function ($cabang) {
            if (!$cabang->barcode) {
                $cabang->barcode = 'CAB-' . strtoupper(substr(md5(uniqid()), 0, 10));
            }
        });
    }

    public function users()
    {
        // Mencari user yang di dalam kolom JSON 'cabang_ids' terdapat ID cabang ini
        return User::whereJsonContains('cabang_ids', (string) $this->id)->get();
    }

    public function absensis()
    {
        return $this->hasMany(Absensi::class);
    }

    public function absensiSiswa()
    {
        return $this->hasMany(AbsensiSiswa::class);
    }
}
