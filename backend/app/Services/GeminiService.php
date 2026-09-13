<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    protected ?string $apiKey = null;
    protected string $model;

    public function __construct()
    {
        $this->apiKey = \App\Models\NotificationSetting::getValue('ai_gemini_api_key', config('services.gemini.api_key'));
        $this->model = \App\Models\NotificationSetting::getValue('ai_gemini_model', config('services.gemini.model', 'gemini-2.0-flash'));
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
            return 'API key Gemini belum dikonfigurasi. Hubungi administrator.';
        }

        try {
            $contents = [];
            foreach ($messages as $message) {
                $role = ($message['role'] ?? 'user') === 'assistant' ? 'model' : 'user';
                $contents[] = [
                    'role' => $role,
                    'parts' => [['text' => $message['content'] ?? '']],
                ];
            }

            $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . $this->model . ':generateContent';

            $response = $this->postRetry(fn () => Http::withHeaders([
                'Content-Type' => 'application/json',
                'x-goog-api-key' => $this->apiKey,
            ])->timeout(120)->post($url, [
                'contents' => $contents,
                'generationConfig' => [
                    'temperature' => $temperature,
                    'maxOutputTokens' => $maxTokens,
                ],
            ]));

            if ($response->failed()) {
                Log::error('Gemini API Error: ' . $response->body());
                $status = $response->status();
                if (in_array($status, [429, 500, 502, 503, 504])) {
                    return 'Maaf, layanan AI (Gemini) sedang sibuk. Silakan coba lagi dalam beberapa saat.';
                }
                return 'Maaf, terjadi kesalahan saat menghubungi AI. Silakan coba lagi.';
            }

            $data = $response->json();
            return $data['candidates'][0]['content']['parts'][0]['text'] ?? 'Tidak ada respon dari AI.';
        } catch (\Exception $e) {
            Log::error('Gemini API Exception: ' . $e->getMessage());
            return 'Maaf, terjadi kesalahan koneksi. Silakan coba lagi.';
        }
    }
}