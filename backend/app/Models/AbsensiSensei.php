<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class AbsensiSensei extends Model
{
    use HasFactory;

    protected $table = 'absensi_sensei';

    protected $fillable = [
        'kelas_sensei_id',
        'user_id',
        'tanggal',
        'jam_masuk',
        'jam_keluar',
        'status',
        'catatan',
        'lat_masuk',
        'long_masuk',
        'lat_pulang',
        'long_pulang',
        'foto_masuk',
        'foto_pulang',
    ];

    protected $casts = [
        'tanggal' => 'date:Y-m-d',
    ];

    public function kelasSensei()
    {
        return $this->belongsTo(KelasSensei::class, 'kelas_sensei_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static function savePhoto($base64, $type)
    {
        $image = explode(',', $base64)[1] ?? $base64;
        $image = base64_decode($image);

        $filename = $type.'_'.uniqid().'.jpg';
        $path = 'absensi_sensei/'.$filename;
        Storage::disk('public')->put($path, $image);

        return $path;
    }
}
