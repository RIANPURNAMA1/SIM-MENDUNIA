<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShiftJadwal extends Model
{
    use HasFactory;

    protected $table = 'shift_jadwal';

    protected $fillable = [
        'user_id',
        'shift_id',
        'tanggal',
        'keterangan',
        'is_libur'
    ];

    protected $casts = [
        'tanggal' => 'date:Y-m-d',
        'is_libur' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    public static function getShiftForUser($userId, $tanggal)
    {
        $jadwal = self::where('user_id', $userId)
            ->where('tanggal', $tanggal)
            ->first();

        if ($jadwal) {
            return $jadwal->shift;
        }

        $user = User::find($userId);
        return $user?->shift;
    }
}