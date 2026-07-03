<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PengaturanShift extends Model
{
    protected $table = 'pengaturan_shifts';

    protected $fillable = [
        'key',
        'value',
    ];

    public static function getMode(): string
    {
        $setting = self::where('key', 'shift_mode')->first();
        return $setting ? $setting->value : 'fixed';
    }

    public static function setMode(string $mode): void
    {
        self::updateOrCreate(
            ['key' => 'shift_mode'],
            ['value' => $mode]
        );
    }

    public static function isJadwalMode(): bool
    {
        return self::getMode() === 'jadwal';
    }

    public static function isFixedMode(): bool
    {
        return self::getMode() === 'fixed';
    }
}
