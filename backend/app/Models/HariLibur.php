<?php
// app/Models/HariLibur.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class HariLibur extends Model {
    protected $fillable = ['tanggal', 'keterangan'];

    /**
     * Logika Inti: Cek apakah sebuah tanggal itu libur
     */
    public static function apakahLibur($tanggal) {
        $dt = Carbon::parse($tanggal);

        // 1. Cek Otomatis: Jika hari Sabtu atau Minggu
        if ($dt->isWeekend()) {
            return true;
        }

        // 2. Cek Manual: Jika ada di tabel hari_liburs (Inputan Admin)
        $liburNasional = self::where('tanggal', $dt->toDateString())->exists();
        if ($liburNasional) {
            return true;
        }

        return false;
    }
}