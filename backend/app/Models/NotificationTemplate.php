<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationTemplate extends Model
{
    protected $fillable = [
        'key',
        'name',
        'description',
        'channel',
        'subject',
        'body',
        'variables',
        'is_active',
    ];

    protected $casts = [
        'variables' => 'array',
        'is_active' => 'boolean',
    ];

    public static function getTemplate(string $key): ?self
    {
        return self::where('key', $key)->where('is_active', true)->first();
    }

    public static function render(string $key, array $data = []): ?array
    {
        $template = self::getTemplate($key);
        if (!$template) return null;

        $subject = $template->subject ? self::replaceVars($template->subject, $data) : null;
        $body = self::replaceVars($template->body, $data);

        return [
            'subject' => $subject,
            'body' => $body,
        ];
    }

    public static function replaceVars(string $text, array $data): string
    {
        return preg_replace_callback('/\{(\w+)\}/', function ($m) use ($data) {
            return $data[$m[1]] ?? $m[0];
        }, $text);
    }
}
