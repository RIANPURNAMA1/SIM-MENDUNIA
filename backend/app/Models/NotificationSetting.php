<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationSetting extends Model
{
    protected $fillable = [
        'key',
        'is_enabled',
        'description',
        'value',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
    ];

    /**
     * Cek apakah notifikasi tertentu aktif
     */
    public static function isEnabled($key)
    {
        $setting = self::where('key', $key)->first();
        return $setting ? $setting->is_enabled : true;
    }

    /**
     * Ambil value dari setting tertentu
     */
    public static function getValue($key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }
}
