<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ClaudeService
{
    protected ?string $apiKey = null;
    protected string $model;

    public function __construct()
    {
        $this->apiKey = \App\Models\NotificationSetting::getValue('ai_claude_api_key', config('services.claude.api_key'));
        $this->model = \App\Models\NotificationSetting::getValue('ai_claude_model', config('services.claude.model', 'claude-3-5-sonnet-latest'));
    }

    public function setApiKey(string $apiKey): self
    {
        $this->apiKey = $apiKey;
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
            return 'API key Claude belum dikonfigurasi. Hubungi administrator.';
        }

        try {
            $system = '';
            $claudeMessages = [];
            foreach ($messages as $message) {
                $role = $message['role'] ?? 'user';
                $content = $message['content'] ?? '';
                if ($role === 'system') {
                    $system = trim($system . "\n" . $content);
                } elseif ($role === 'user' || $role === 'assistant') {
                    $claudeMessages[] = [
                        'role' => $role === 'assistant' ? 'assistant' : 'user',
                        'content' => (string) $content,
                    ];
                }
            }

            $payload = [
                'model' => $this->model,
                'max_tokens' => $maxTokens,
                'temperature' => $temperature,
                'messages' => $claudeMessages,
            ];
            if (!empty($system)) {
                $payload['system'] = $system;
            }

            $response = $this->postRetry(fn () => Http::withHeaders([
                'x-api-key' => $this->apiKey,
                'anthropic-version' => '2023-06-01',
                'Content-Type' => 'application/json',
            ])->timeout(120)->post('https://api.anthropic.com/v1/messages', $payload));

            if ($response->failed()) {
                Log::error('Claude API Error: ' . $response->body());
                $status = $response->status();
                if (in_array($status, [429, 500, 502, 503, 504])) {
                    return 'Maaf, layanan AI (Claude) sedang sibuk. Silakan coba lagi dalam beberapa saat.';
                }
                return 'Maaf, terjadi kesalahan saat menghubungi AI. Silakan coba lagi.';
            }

            $data = $response->json();
            return $data['content'][0]['text'] ?? 'Tidak ada respon dari AI.';
        } catch (\Exception $e) {
            Log::error('Claude API Exception: ' . $e->getMessage());
            return 'Maaf, terjadi kesalahan koneksi. Silakan coba lagi.';
        }
    }
}