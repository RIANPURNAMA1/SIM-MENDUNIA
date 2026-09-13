<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ModelStudioService
{
    protected ?string $apiKey = null;
    protected string $model;
    protected string $baseUrl;

    public function __construct()
    {
        $this->apiKey = \App\Models\NotificationSetting::getValue('ai_modelsstudio_api_key', config('services.modelsstudio.api_key'));
        $this->model = \App\Models\NotificationSetting::getValue('ai_modelsstudio_model', config('services.modelsstudio.model', 'qwen-plus'));
        $this->baseUrl = rtrim(
            \App\Models\NotificationSetting::getValue('ai_modelsstudio_base_url', config('services.modelsstudio.base_url', 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1')),
            '/'
        );
    }

    public function setApiKey(string $apiKey): self
    {
        $this->apiKey = $apiKey;
        return $this;
    }

    public function setBaseUrl(string $baseUrl): self
    {
        $baseUrl = trim($baseUrl);
        if ($baseUrl !== '') {
            $this->baseUrl = rtrim($baseUrl, '/');
        }
        return $this;
    }

    public function setModel(string $model): self
    {
        $this->model = $model;
        return $this;
    }

    protected function postRetry(callable $request, int $maxAttempts = 3): \Illuminate\Http\Client\Response
    {
        $response = null;
        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            $response = $request();
            if (!$response->failed() || !in_array($response->status(), [429, 500, 502, 503, 504])) {
                return $response;
            }
            if ($attempt < $maxAttempts) {
                usleep(900000 * $attempt);
            }
        }
        return $response;
    }

    public function chat(array $messages, float $temperature = 0.7, int $maxTokens = 2048): string
    {
        if (empty($this->apiKey)) {
            return 'API key Model Studio belum dikonfigurasi. Hubungi administrator.';
        }

        try {
            $response = $this->postRetry(fn () => Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(120)->post($this->baseUrl . '/chat/completions', [
                'model' => $this->model,
                'messages' => $messages,
                'temperature' => $temperature,
                'max_tokens' => $maxTokens,
            ]));

            if ($response->failed()) {
                Log::error('Model Studio API Error: ' . $response->body());
                $status = $response->status();
                if (in_array($status, [429, 500, 502, 503, 504])) {
                    return 'Maaf, layanan AI (Model Studio) sedang sibuk. Silakan coba lagi dalam beberapa saat.';
                }
                return 'Maaf, terjadi kesalahan saat menghubungi AI. Silakan coba lagi.';
            }

            $data = $response->json();
            return $data['choices'][0]['message']['content'] ?? 'Tidak ada respon dari AI.';
        } catch (\Exception $e) {
            Log::error('Model Studio API Exception: ' . $e->getMessage());
            return 'Maaf, terjadi kesalahan koneksi. Silakan coba lagi.';
        }
    }
}