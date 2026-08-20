<?php

namespace App\Services;

use App\Models\BiayaKategori;
use App\Models\JadwalLevel;
use App\Models\Pendaftar;
use Carbon\Carbon;

class BillingScheduleService
{
    public static function levelFromKategori(BiayaKategori $kategori): ?int
    {
        if (preg_match('/^level\s*([1-4])$/i', trim($kategori->nama), $m)) {
            return (int) $m[1];
        }

        return null;
    }

    public static function scheduleStart(Pendaftar $pendaftar, ?BiayaKategori $kategori): ?Carbon
    {
        $level = null;
        if ($kategori) {
            if ($kategori->trigger_value && preg_match('/^[1-4]$/', $kategori->trigger_value)) {
                $level = (int) $kategori->trigger_value;
            } else {
                $level = self::levelFromKategori($kategori);
            }
        }
        if (!$level || !$pendaftar->batch_id) {
            return null;
        }

        $jadwal = JadwalLevel::where('batch_id', $pendaftar->batch_id)
            ->where('level', $level)
            ->where('status', '!=', 'ditolak')
            ->orderByDesc('updated_at')
            ->first();

        return $jadwal ? $jadwal->tanggal_mulai->copy() : null;
    }
}