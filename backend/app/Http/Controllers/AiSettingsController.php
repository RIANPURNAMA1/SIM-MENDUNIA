<?php

namespace App\Http\Controllers;

use App\Models\NotificationSetting;
use App\Services\AiAssistantService;
use Illuminate\Http\Request;

class AiSettingsController extends Controller
{
    protected string $providerKey = 'ai_provider';
    protected array $keys = [
        'groq' => 'ai_groq_api_key',
        'gemini' => 'ai_gemini_api_key',
        'claude' => 'ai_claude_api_key',
        'gpt' => 'ai_gpt_api_key',
        'modelsstudio' => 'ai_modelsstudio_api_key',
    ];
    protected array $modelKeys = [
        'groq' => 'ai_groq_model',
        'gemini' => 'ai_gemini_model',
        'claude' => 'ai_claude_model',
        'gpt' => 'ai_gpt_model',
        'modelsstudio' => 'ai_modelsstudio_model',
    ];
    protected array $baseUrlKeys = [
        'modelsstudio' => 'ai_modelsstudio_base_url',
    ];

    protected function mask(?string $value): ?string
    {
        if (empty($value)) {
            return null;
        }
        $len = strlen($value);
        if ($len <= 4) {
            return '••••';
        }
        return str_repeat('•', 8) . substr($value, -4);
    }

    public function index()
    {
        $data = [];

        foreach ($this->keys as $provider => $key) {
            $value = NotificationSetting::getValue($key, config('services.' . $provider . '.api_key'));
            $data[$provider . '_api_key'] = $this->mask($value);
            $data[$provider . '_configured'] = !empty($value);
        }

        $data['provider'] = NotificationSetting::getValue($this->providerKey, 'groq');
        $data['models'] = [
            'groq' => NotificationSetting::getValue('ai_groq_model', config('services.groq.model', 'openai/gpt-oss-120b')),
            'gemini' => NotificationSetting::getValue('ai_gemini_model', config('services.gemini.model', 'gemini-2.0-flash')),
            'claude' => NotificationSetting::getValue('ai_claude_model', config('services.claude.model', 'claude-3-5-sonnet-latest')),
            'gpt' => NotificationSetting::getValue('ai_gpt_model', config('services.gpt.model', 'gpt-4o-mini')),
            'modelsstudio' => NotificationSetting::getValue('ai_modelsstudio_model', config('services.modelsstudio.model', 'qwen-plus')),
        ];
        $data['base_urls'] = [
            'modelsstudio' => NotificationSetting::getValue('ai_modelsstudio_base_url', config('services.modelsstudio.base_url', 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1')),
        ];

        return response()->json($data);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'provider' => 'required|in:groq,gemini,claude,gpt,modelsstudio',
            'groq_api_key' => 'nullable|string',
            'gemini_api_key' => 'nullable|string',
            'claude_api_key' => 'nullable|string',
            'gpt_api_key' => 'nullable|string',
            'modelsstudio_api_key' => 'nullable|string',
            'modelsstudio_base_url' => 'nullable|string',
            'groq_model' => 'nullable|string',
            'gemini_model' => 'nullable|string',
            'claude_model' => 'nullable|string',
            'gpt_model' => 'nullable|string',
            'modelsstudio_model' => 'nullable|string',
        ]);

        NotificationSetting::updateOrCreate(
            ['key' => $this->providerKey],
            [
                'is_enabled' => true,
                'value' => $data['provider'],
                'description' => 'Provider AI Assistant (groq / gemini / claude / gpt / modelsstudio)',
            ]
        );

        $labels = [
            'groq' => 'API Key Groq untuk AI Assistant',
            'gemini' => 'API Key Gemini untuk AI Assistant',
            'claude' => 'API Key Claude untuk AI Assistant',
            'gpt' => 'API Key GPT untuk AI Assistant',
            'modelsstudio' => 'API Key Model Studio untuk AI Assistant',
        ];

        $modelLabels = [
            'groq' => 'Model Groq untuk AI Assistant',
            'gemini' => 'Model Gemini untuk AI Assistant',
            'claude' => 'Model Claude untuk AI Assistant',
            'gpt' => 'Model GPT untuk AI Assistant',
            'modelsstudio' => 'Model Model Studio untuk AI Assistant',
        ];

        foreach ($this->keys as $provider => $key) {
            if (!empty($data[$provider . '_api_key'])) {
                NotificationSetting::updateOrCreate(
                    ['key' => $key],
                    [
                        'is_enabled' => true,
                        'value' => $data[$provider . '_api_key'],
                        'description' => $labels[$provider] ?? $key,
                    ]
                );
            }
        }

        foreach ($this->modelKeys as $provider => $key) {
            if (!empty($data[$provider . '_model'])) {
                NotificationSetting::updateOrCreate(
                    ['key' => $key],
                    [
                        'is_enabled' => true,
                        'value' => trim($data[$provider . '_model']),
                        'description' => $modelLabels[$provider] ?? $key,
                    ]
                );
            }
        }

        foreach ($this->baseUrlKeys as $provider => $key) {
            $value = trim($data[$provider . '_base_url'] ?? '');
            if ($value !== '') {
                NotificationSetting::updateOrCreate(
                    ['key' => $key],
                    [
                        'is_enabled' => true,
                        'value' => rtrim($value, '/'),
                        'description' => 'Base URL Model Studio untuk AI Assistant',
                    ]
                );
            } else {
                NotificationSetting::where('key', $key)->delete();
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan AI Assistant berhasil disimpan.',
        ]);
    }

    public function test(Request $request)
    {
        $data = $request->validate([
            'provider' => 'required|in:groq,gemini,claude,gpt,modelsstudio',
            'api_key' => 'nullable|string',
        ]);

        $result = (new AiAssistantService())->test($data['provider'], $data['api_key'] ?? null);

        return response()->json($result);
    }
}