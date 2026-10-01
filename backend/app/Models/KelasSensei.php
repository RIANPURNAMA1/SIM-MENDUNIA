<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KelasSensei extends Model
{
    use HasFactory;

    protected $table = 'kelas_sensei';

    protected $fillable = [
        'user_id',
        'batch_id',
        'nama_kelas',
        'level',
        'tanggal_mulai',
        'tanggal_selesai',
        'catatan',
        'status',
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function batchRelasi()
    {
        return $this->belongsTo(Batch::class, 'batch_id');
    }

    public function absensi()
    {
        return $this->hasMany(AbsensiSensei::class, 'kelas_sensei_id');
    }

    public function isAktif(): bool
    {
        $today = now()->toDateString();

        return $this->status === 'aktif'
            && $today >= $this->tanggal_mulai->toDateString()
            && $today <= $this->tanggal_selesai->toDateString();
    }

    public function scopeAktif($query)
    {
        $today = now()->toDateString();

        return $query->where('status', 'aktif')
            ->whereDate('tanggal_mulai', '<=', $today)
            ->whereDate('tanggal_selesai', '>=', $today);
    }

    /**
     * Jumlah pertemuan: hari kerja (Senin-Jumat) di luar hari libur
     * antara tanggal mulai dan tanggal selesai.
     *
     * Dihitung aritmatika, bukan dengan mengiterasi tiap tanggal. Halaman
     * daftar pertemuan memanggil ini untuk semua kelas sekaligus, jadi loop
     * per tanggal akan lambat sekali kalau daftar kelasnya banyak.
     */
    public function totalPertemuan(): int
    {
        $mulai = \Carbon\Carbon::parse($this->tanggal_mulai)->startOfDay();
        $selesai = \Carbon\Carbon::parse($this->tanggal_selesai)->startOfDay();
        if ($selesai->lt($mulai)) {
            return 0;
        }

        $totalHari = (int) $mulai->diffInDays($selesai) + 1;

        // Setiap 7 hari penuh ada tepat 1 Sabtu + 1 Minggu.
        $pekanPenuh = intdiv($totalHari, 7);
        $sisaHari = $totalHari % 7;

        $akhirPekan = 0;
        $hariAwal = $mulai->dayOfWeek;
        for ($i = 0; $i < $sisaHari; $i++) {
            $dow = ($hariAwal + $i) % 7;
            if ($dow === \Carbon\Carbon::SATURDAY || $dow === \Carbon\Carbon::SUNDAY) {
                $akhirPekan++;
            }
        }

        $hariKerja = $totalHari - ($pekanPenuh * 2) - $akhirPekan;

        // Kurangi hari libur yang jatuh di hari kerja. Bandingkan string
        // Y-m-d secara leksikal supaya tidak perlu parse tiap entri.
        $mulaiStr = $mulai->toDateString();
        $selesaiStr = $selesai->toDateString();
        $liburDiKerja = 0;
        foreach (HariLibur::tanggalLibur() as $tgl) {
            if ($tgl < $mulaiStr || $tgl > $selesaiStr) {
                continue;
            }
            $dow = \Carbon\Carbon::parse($tgl)->dayOfWeek;
            if ($dow !== \Carbon\Carbon::SATURDAY && $dow !== \Carbon\Carbon::SUNDAY) {
                $liburDiKerja++;
            }
        }

        return max(0, $hariKerja - $liburDiKerja);
    }

    /**
     * Daftar tanggal pertemuan (hari kerja di luar hari libur)
     * antara tanggal mulai dan tanggal selesai.
     *
     * @return array<string>
     */
    public function daftarPertemuan(): array
    {
        $libur = HariLibur::tanggalLiburSet();

        $tglMulai = \Carbon\Carbon::parse($this->tanggal_mulai)->startOfDay();
        $tglSelesai = \Carbon\Carbon::parse($this->tanggal_selesai)->startOfDay();

        $dates = [];
        $cursor = $tglMulai->copy();
        while ($cursor->lte($tglSelesai)) {
            $dow = $cursor->dayOfWeek;
            if ($dow !== \Carbon\Carbon::SATURDAY && $dow !== \Carbon\Carbon::SUNDAY) {
                $tgl = $cursor->toDateString();
                if (!isset($libur[$tgl])) {
                    $dates[] = $tgl;
                }
            }
            $cursor->addDay();
        }

        return $dates;
    }
}
