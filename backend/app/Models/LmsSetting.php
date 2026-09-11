<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LmsSetting extends Model
{
    protected $table = 'lms_settings';

    protected $fillable = ['key', 'is_enabled', 'value'];

    protected $casts = [
        'is_enabled' => 'boolean',
    ];

    public static function getValue(string $key, $default = null)
    {
        $setting = static::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    public static function setValue(string $key, $value): void
    {
        $setting = static::where('key', $key)->first();
        if ($setting) {
            $setting->value = $value;
            $setting->save();
        } else {
            static::create(['key' => $key, 'is_enabled' => true, 'value' => $value]);
        }
    }

    public static function getWelcomeVideo()
    {
        return static::getValue('welcome_video');
    }

    public static function getWelcomeVideoUrl()
    {
        return static::getValue('welcome_video_url');
    }
}