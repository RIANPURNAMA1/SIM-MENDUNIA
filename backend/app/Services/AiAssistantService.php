<?php

namespace App\Services;

use App\Models\NotificationSetting;

class AiAssistantService
{
    public const PROVIDERS = ['groq', 'gemini', 'claude', 'gpt', 'modelsstudio'];

    /** Nilai pengaturan fitur yang berarti "ikuti provider utama". */
    public const FOLLOW_DEFAULT = 'default';

    /**
     * Fitur sistem yang memakai AI. Tiap fitur bisa diarahkan ke provider sendiri.
     * `fallback` = provider bila fitur belum pernah diatur (null = ikuti provider utama).
     */
    public const FEATURES = [
        'ai_chat' => ['label' => 'AI Chat', 'description' => 'Menu AI Chat di sidebar', 'fallback' => null],
        'import_soal' => ['label' => 'Import Soal dengan AI', 'description' => 'Import Banyak Soal di paket quiz LMS', 'fallback' => null],
        // Sebelumnya import siswa selalu memakai Groq; dipertahankan sampai diubah admin.
        'import_siswa' => ['label' => 'Import Data Siswa dengan AI', 'description' => 'Import data siswa/kandidat via AI', 'fallback' => 'groq'],
    ];

    public static function featureKey(string $feature): string
    {
        return 'ai_provider_feature_' . $feature;
    }

    public static function defaultProvider(): string
    {
        $provider = NotificationSetting::getValue('ai_provider', 'groq');

        return in_array($provider, self::PROVIDERS, true) ? $provider : 'groq';
    }

    /** Nilai tersimpan untuk fitur: salah satu PROVIDERS atau FOLLOW_DEFAULT. */
    public static function featureSetting(string $feature): string
    {
        $fallback = self::FEATURES[$feature]['fallback'] ?? null;
        $value = NotificationSetting::getValue(self::featureKey($feature), $fallback ?? self::FOLLOW_DEFAULT);

        return in_array($value, self::PROVIDERS, true) ? $value : self::FOLLOW_DEFAULT;
    }

    /** Provider yang benar-benar dipakai sebuah fitur. */
    public static function providerFor(?string $feature): string
    {
        if ($feature === null || !isset(self::FEATURES[$feature])) {
            return self::defaultProvider();
        }
        $setting = self::featureSetting($feature);

        return $setting === self::FOLLOW_DEFAULT ? self::defaultProvider() : $setting;
    }

    /**
     * Kirim chat memakai provider utama (groq / gemini / claude / gpt / modelsstudio).
     */
    public function chat(array $messages, float $temperature = 0.7, int $maxTokens = 2048): string
    {
        return $this->makeService(self::defaultProvider())->chat($messages, $temperature, $maxTokens);
    }

    /**
     * Kirim chat memakai provider yang diatur untuk fitur tertentu (lihat FEATURES).
     */
    public function chatFor(string $feature, array $messages, float $temperature = 0.7, int $maxTokens = 2048): string
    {
        return $this->makeService(self::providerFor($feature))->chat($messages, $temperature, $maxTokens);
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