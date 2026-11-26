<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PengajuanGaji extends Model
{
    protected $table = 'pengajuan_gajis';

    protected $fillable = [
        'user_id',
        'kelas_sensei_id',
        'absensi_sensei_ids',
        'jumlah_pertemuan',
        'bulan',
        'tahun',
        'jumlah',
        'keterangan',
        'no_req_list',
        'status',
        'catatan',
        'ringkasan_kehadiran',
    ];

    protected $casts = [
        'ringkasan_kehadiran' => 'array',
        'no_req_list' => 'array',
        'absensi_sensei_ids' => 'array',
        'jumlah_pertemuan' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function kelasSensei()
    {
        return $this->belongsTo(KelasSensei::class, 'kelas_sensei_id');
    }

    /**
     * ID absensi sensei yang "dipakai" pengajuan ini. Pengajuan lama (sebelum
     * kolom absensi_sensei_ids ada) memakai id dari ringkasan riwayat yang dikirim.
     */
    public function claimedAbsensiIds(): array
    {
        if (is_array($this->absensi_sensei_ids)) {
            return array_map('intval', $this->absensi_sensei_ids);
        }

        $riwayat = $this->ringkasan_kehadiran['riwayat'] ?? [];

        return collect(is_array($riwayat) ? $riwayat : [])
            ->pluck('id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();
    }
}
