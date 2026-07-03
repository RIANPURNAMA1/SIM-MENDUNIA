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
}
