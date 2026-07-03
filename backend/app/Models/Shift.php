<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Shift extends Model
{
    use HasFactory;

    protected $table = 'shifts';

    protected $fillable = [
        'nama_shift',
        'kode_shift',
        'jam_masuk',
        'jam_pulang',
        'toleransi',
        'status',
        'keterangan'
    ];

    protected $casts = [
        'jam_masuk' => 'datetime:H:i',
        'jam_pulang' => 'datetime:H:i',
    ];

    /**
     * Boot function untuk menangani logic otomatis
     */
    protected static function booted()
    {
        // static::saving(function ($shift) {
        //     if ($shift->jam_masuk && $shift->jam_pulang) {
        //         // Parse jam menggunakan Carbon
        //         $masuk = Carbon::parse($shift->jam_masuk);
        //         $pulang = Carbon::parse($shift->jam_pulang);

        //         // Jika jam pulang lebih kecil dari jam masuk (Shift Malam)
        //         // Contoh: Masuk 22:00, Pulang 06:00
        //         if ($pulang->lt($masuk)) {
        //             $pulang->addDay();
        //         }

        //         // Hitung selisih jam (bulat)
        //         // Gunakan diffInMinutes($pulang) / 60 jika ingin hasil desimal (misal 8.5 jam)
        //         $shift->total_jam = $masuk->diffInHours($pulang);
        //     }
        // });
    }

    /**
     * Scope untuk shift aktif
     */
    public function scopeAktif($query)
    {
        return $query->where('status', 'AKTIF');
    }

    /**
     * Scope untuk shift nonaktif
     */
    public function scopeNonaktif($query)
    {
        return $query->where('status', 'NONAKTIF');
    }


    // relasi
    public function absensis()
    {
        return $this->hasMany(Absensi::class, 'shift_id');
    }
    public function users()
    {
        // Parameter kedua adalah foreign key di tabel users
        return $this->hasMany(User::class, 'shift_id');
    }
    public function siswas()
    {
        return $this->hasMany(Siswa::class, 'shift_id');
    }
}
