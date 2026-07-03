<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Carbon;

class Absensi extends Model
{
    use HasFactory;

    protected $table = 'absensis';

    protected $fillable = [
        'user_id',
        'shift_id', // Tambahkan ini agar bisa disimpan
        'cabang_id', // Tambahkan ini agar bisa disimpan
        'tanggal',
        'jam_masuk',
        'jam_keluar',
        'lat_masuk',   // Tambahkan koordinat masuk
        'long_masuk',  // Tambahkan koordinat masuk
        'lat_pulang',  // Tambahkan koordinat pulang
        'long_pulang', // Tambahkan koordinat pulang
        'status',
        'foto_masuk',
        'foto_pulang',
        'keterangan',
    ];

    protected $casts = [
        'tanggal'    => 'date',
        // Gunakan string jika hanya menyimpan waktu (H:i:s) agar tidak konflik dengan objek Carbon penuh
        'jam_masuk'  => 'string',
        'jam_keluar' => 'string',
        'lat_masuk'  => 'float',
        'long_masuk' => 'float',
        'lat_pulang' => 'float',
        'long_pulang' => 'float',
    ];

    /* =========================
       RELASI
    ========================== */

    // Relasi ke Shift (Wajib karena ada shift_id di tabel)
    public function shift()
    {
        return $this->belongsTo(Shift::class, 'shift_id');
    }

    // User (karyawan)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

 // Ganti relasi lama dengan Accessor ini
    // public function getCabangAttribute()
    // {
    //     if (!$this->cabang_ids) return collect();

    //     // Mengambil semua data cabang yang ID-nya ada di dalam list cabang_ids
    //     return \App\Models\Cabang::whereIn('id', $this->cabang_ids)->get();
    // }

// Tambahkan ini di Model Absensi
public function cabang()
{
    // Ini mengacu pada kolom 'cabang_id' yang ada di tabel absensis
    return $this->belongsTo(Cabang::class, 'cabang_id');
}

    public function izin()
    {
        return $this->belongsTo(Izin::class);
    }

    /* =========================
       ACCESSOR
    ========================== */

    public function getFotoMasukUrlAttribute()
    {
        return $this->foto_masuk
            ? asset('storage/' . $this->foto_masuk)
            : asset('assets/images/no-image.png'); // Beri fallback image jika null
    }

    public function getFotoPulangUrlAttribute()
    {
        return $this->foto_pulang
            ? asset('storage/' . $this->foto_pulang)
            : asset('assets/images/no-image.png');
    }

    /* =========================
       LOGIKA JARAK (HELPERS)
    ========================== */

    /**
     * Menghitung jarak ke cabang terkait
     * Berguna untuk menampilkan jarak di dashboard admin
     */
    public function getJarakMasukAttribute()
    {
        if (!$this->lat_masuk || !$this->user->cabang) return null;

        return $this->calculateDistance(
            $this->lat_masuk,
            $this->long_masuk,
            $this->user->cabang->latitude,
            $this->user->cabang->longitude
        );
    }

    private function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371000; // meter
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) * sin($dLat / 2) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) * sin($dLon / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return $earthRadius * $c;
    }
}
