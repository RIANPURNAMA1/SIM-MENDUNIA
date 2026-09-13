<?php

namespace App\Services;

use App\Models\NotificationSetting;

class AiAssistantService
{
    public const PROVIDERS = ['groq', 'gemini', 'claude', 'gpt', 'modelsstudio'];

    /**
     * Pilih provider aktif (groq / gemini / claude / gpt / modelsstudio) lalu kirim chat.
     */
    public function chat(array $messages, float $temperature = 0.7, int $maxTokens = 2048): string
    {
        $provider = NotificationSetting::getValue('ai_provider', 'groq');

        return $this->makeService($provider)->chat($messages, $temperature, $maxTokens);
    }

    public function makeService(string $provider)
    {
        switch ($provider) {
            case 'gemini':
                return new GeminiService();
            case 'claude':
                return new ClaudeService();
            case 'gpt':
                return new GptService();
            case 'modelsstudio':
                return new ModelStudioService();
            default:
                return new GroqService();
        }
    }

    /**
     * Uji koneksi provider tertentu dengan API key tertentu (tanpa menyimpan).
     */
    public function test(string $provider, ?string $apiKey = null): array
    {
        $messages = [
            ['role' => 'user', 'content' => 'Balas hanya dengan kata: OK'],
        ];

        try {
            $service = $this->makeService($provider);
            if (!empty($apiKey)) {
                $service->setApiKey($apiKey);
            }
            $result = $service->chat($messages, 0, 10);

            if (str_contains($result, 'belum dikonfigurasi')) {
                return ['success' => false, 'message' => 'API key belum diisi.'];
            }
            if (str_contains($result, 'Maaf')) {
                return ['success' => false, 'message' => $result];
            }

            return ['success' => true, 'message' => 'Koneksi berhasil. Respon AI: ' . trim($result)];
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => 'Koneksi gagal: ' . $e->getMessage()];
        }
    }
}