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
        'locations',
        'alamat',
        'penempatan_cabang_id',
        'penempatan_cabang_kode',
        'penempatan_cabang_nama',
    ];

    protected $casts = [
        'locations' => 'array',
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

    public function kontraks()
    {
        return $this->hasMany(Kontrak::class);
    }

    public function locationPoints(): array
    {
        $points = [];

        if ($this->latitude !== null && $this->longitude !== null) {
            $points[] = [
                'label' => 'Lokasi Utama',
                'latitude' => (float) $this->latitude,
                'longitude' => (float) $this->longitude,
                'radius' => (int) ($this->radius ?? 0),
            ];
        }

        foreach ($this->locations ?? [] as $loc) {
            if (!isset($loc['latitude'], $loc['longitude'], $loc['radius'])) {
                continue;
            }
            $points[] = [
                'label' => isset($loc['label']) ? (string) $loc['label'] : null,
                'latitude' => (float) $loc['latitude'],
                'longitude' => (float) $loc['longitude'],
                'radius' => (int) $loc['radius'],
            ];
        }

        return $points;
    }

    public function titikDalamJangkauan($latitude, $longitude): ?array
    {
        foreach ($this->locationPoints() as $titik) {
            $jarak = $this->jarakAntarTitik($latitude, $longitude, $titik['latitude'], $titik['longitude']);
            if ($jarak <= $titik['radius']) {
                return $titik;
            }
        }

        return null;
    }

    public function titikTerdekat($latitude, $longitude): ?array
    {
        $terdekat = null;

        foreach ($this->locationPoints() as $titik) {
            $jarak = $this->jarakAntarTitik($latitude, $longitude, $titik['latitude'], $titik['longitude']);
            if ($terdekat === null || $jarak < $terdekat['jarak']) {
                $titik['jarak'] = $jarak;
                $terdekat = $titik;
            }
        }

        return $terdekat;
    }

    private function jarakAntarTitik($lat1, $lng1, $lat2, $lng2): float
    {
        $earthRadius = 6371000;
        $dLat = deg2rad((float) $lat2 - (float) $lat1);
        $dLng = deg2rad((float) $lng2 - (float) $lng1);
        $a = sin($dLat / 2) * sin($dLat / 2)
            + cos(deg2rad((float) $lat1)) * cos(deg2rad((float) $lat2)) * sin($dLng / 2) * sin($dLng / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
