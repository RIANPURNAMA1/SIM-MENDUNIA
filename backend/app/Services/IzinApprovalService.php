<?php

namespace App\Services;

use App\Models\Absensi;
use Carbon\Carbon;

class IzinApprovalService
{
    public static function generateAbsensi($izin)
    {
        $start = Carbon::parse($izin->tgl_mulai);
        $end   = Carbon::parse($izin->tgl_selesai);

        for ($date = $start; $date->lte($end); $date->addDay()) {

            Absensi::firstOrCreate(
                [
                    'user_id' => $izin->user_id,
                    'tanggal' => $date->toDateString(),
                ],
                [
                    'izin_id'    => $izin->id,
                    'shift_id'   => null, // ⬅ PENTING
                    'status'     => 'IZIN', // ⬅ BUKAN SAKIT/CUTI
                    'keterangan' => $izin->alasan,
                ]
            );
        }
    }
}
