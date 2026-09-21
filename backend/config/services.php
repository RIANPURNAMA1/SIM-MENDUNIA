<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'starsender' => [
        'api_key' => env('STARSAPI_KEY'),
        'api_url' => env('STARSAPI_URL', 'https://api.starsender.online/api/send'),
    ],

    /*
    |--------------------------------------------------------------------------
    | WhatsApp Gateway (Baileys) — pengganti StarSender
    |--------------------------------------------------------------------------
    | Konfigurasi default gateway internal. Nilai dapat di-override per-installasi
    | lewat tabel notification_settings (key: wa_gateway_base_url, wa_gateway_token,
    | wa_gateway_default_device, wa_gateway_webhook_secret).
    */
    'wa_gateway' => [
        'base_url' => env('WA_GATEWAY_BASE_URL', 'http://localhost:4300'),
        'token' => env('WA_GATEWAY_TOKEN', 'mendunia-gateway-token'),
        'webhook_secret' => env('WA_GATEWAY_WEBHOOK_SECRET', 'mendunia-gateway-secret'),
        'default_device' => env('WA_GATEWAY_DEFAULT_DEVICE'),
        'timeout' => (int) env('WA_GATEWAY_TIMEOUT', 10),
    ],

    'groq' => [
        'api_key' => env('GROQ_API_KEY'),
        'model' => env('GROQ_MODEL', 'openai/gpt-oss-120b'),
    ],

    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
        'model' => env('GEMINI_MODEL', 'gemini-2.0-flash'),
    ],

    'claude' => [
        'api_key' => env('CLAUDE_API_KEY'),
        'model' => env('CLAUDE_MODEL', 'claude-3-5-sonnet-latest'),
    ],

    'gpt' => [
        'api_key' => env('GPT_API_KEY'),
        'model' => env('GPT_MODEL', 'gpt-4o-mini'),
    ],

    'modelsstudio' => [
        'api_key' => env('MODELSSTUDIO_API_KEY'),
        'base_url' => env('MODELSSTUDIO_BASE_URL', 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'),
        'model' => env('MODELSSTUDIO_MODEL', 'qwen-plus'),
    ],

    'penempatan' => [
        'api_key' => env('PENEMPATAN_API_KEY'),
        'base_url' => env('PENEMPATAN_BASE_URL', 'https://api.penempatan.mendunia.id'),
    ],

    'miraigo' => [
        'base_url' => env('MIRAIGO_BASE_URL', 'http://localhost:5173'),
        'sso_secret' => env('MIRAIGO_SSO_SECRET', 'miraigo-sso-local-secret-change-me'),
        'token_ttl' => (int) env('MIRAIGO_SSO_TTL', 60),
    ],

];
