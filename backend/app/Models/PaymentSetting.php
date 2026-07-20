<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentSetting extends Model
{
    protected $table = 'payment_settings';

    protected $fillable = ['key', 'is_enabled', 'value'];

    protected $casts = [
        'is_enabled' => 'boolean',
    ];

    public static function isEnabled(string $key): bool
    {
        $setting = static::where('key', $key)->first();
        return $setting ? $setting->is_enabled : false;
    }

    public static function getValue(string $key, $default = null)
    {
        $setting = static::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    public static function getUniqueCodeMax(): int
    {
        return (int) static::getValue('unique_code_max', '99');
    }

    public static function getUniqueCodeOperation(): string
    {
        return static::getValue('unique_code_operation', 'add');
    }

    public static function generateUniqueCode(): int
    {
        if (!static::isEnabled('manual_payment_enabled')) {
            return 0;
        }
        $max = static::getUniqueCodeMax();
        if ($max <= 0) return 0;
        return rand(1, $max);
    }

    public static function calculateTotalTransfer(float $amount, int $kodeUnik): float
    {
        $operation = static::getUniqueCodeOperation();
        return $operation === 'subtract'
            ? max(0, $amount - $kodeUnik)
            : $amount + $kodeUnik;
    }
}
