<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KelasPertemuan extends Model
{
    use HasFactory;

    protected $table = 'kelas_pertemuan';

    protected $fillable = [
        'kelas_sensei_id',
        'pertemuan_ke',
        'tanggal',
        'materi',
        'foto_bukti',
        'latihan_paket_id',
        'ulangan_harian_paket_id',
        'ulangan_mingguan_paket_id',
    ];

    protected $casts = [
        'tanggal' => 'date',
    ];

    public function kelasSensei()
    {
        return $this->belongsTo(KelasSensei::class, 'kelas_sensei_id');
    }

    public function latihanPaket()
    {
        return $this->belongsTo(QuizPaket::class, 'latihan_paket_id');
    }

    public function ulanganHarianPaket()
    {
        return $this->belongsTo(QuizPaket::class, 'ulangan_harian_paket_id');
    }

    public function ulanganMingguanPaket()
    {
        return $this->belongsTo(QuizPaket::class, 'ulangan_mingguan_paket_id');
    }
}