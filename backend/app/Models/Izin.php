<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class Izin extends Model
{
    use HasFactory;

    protected $table = 'izins'; // pastikan nama tabel benar

    protected $fillable = [
        'user_id',
        'jenis_izin',     // CUTI / SAKIT / IZIN
        'tgl_mulai',
        'tgl_selesai',
        'alasan',
        'lampiran',
        'status',         // PENDING / DISETUJUI / DITOLAK
    ];

    protected $casts = [
        'tgl_mulai'   => 'date',
        'tgl_selesai' => 'date',
    ];

    /* =========================
       RELASI
    ========================== */

    /**
     * Izin diajukan oleh satu user (karyawan)
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Izin memiliki banyak data absensi
     * (auto generate saat izin disetujui)
     */
    public function absensis()
    {
        return $this->hasMany(Absensi::class, 'izin_id');
    }

    public function approver()
{
    return $this->belongsTo(User::class, 'approved_by');
}


    /* =========================
       HELPER / LOGIC
    ========================== */

    /**
     * Ambil semua tanggal dalam rentang izin
     * Berguna saat generate absensi otomatis
     */
    public function getTanggalRange()
    {
        $dates = [];
        $start = Carbon::parse($this->tgl_mulai);
        $end   = Carbon::parse($this->tgl_selesai);

        while ($start->lte($end)) {
            $dates[] = $start->copy();
            $start->addDay();
        }

        return $dates;
    }
}
