<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GroqService
{
    protected ?string $apiKey = null;
    protected string $apiUrl;
    protected string $model;

    public function __construct()
    {
        $this->apiKey = config('services.groq.api_key');
        $this->apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        $this->model = 'openai/gpt-oss-120b';
    }

    public function chat(array $messages, float $temperature = 0.7, int $maxTokens = 2048): string
    {
        if (empty($this->apiKey)) {
            return 'GROQ_API_KEY belum dikonfigurasi. Hubungi administrator.';
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(120)->post($this->apiUrl, [
                'model' => $this->model,
                'messages' => $messages,
                'temperature' => $temperature,
                'max_tokens' => $maxTokens,
            ]);

            if ($response->failed()) {
                Log::error('Groq API Error: ' . $response->body());
                return 'Maaf, terjadi kesalahan saat menghubungi AI. Silakan coba lagi.';
            }

            $data = $response->json();
            return $data['choices'][0]['message']['content'] ?? 'Tidak ada respon dari AI.';
        } catch (\Exception $e) {
            Log::error('Groq API Exception: ' . $e->getMessage());
            return 'Maaf, terjadi kesalahan koneksi. Silakan coba lagi.';
        }
    }
}
