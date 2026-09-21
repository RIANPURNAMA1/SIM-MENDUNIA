<?php

namespace App\Services;

use App\Models\NotificationSetting;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Klien HTTP untuk service WhatsApp Gateway internal (Baileys).
 * Menggantikan ketergantungan pada penyedia pihak ketiga (StarSender).
 *
 * Konfigurasi diambil dari notification_settings dan dapat di-override
 * lewat config/services.php + .env.
 */
class WaGatewayClient
{
    public function baseUrl(): string
    {
        $value = NotificationSetting::getValue('wa_gateway_base_url');
        if ($value === null) {
            $value = config('services.wa_gateway.base_url', 'http://localhost:4300');
        }

        return rtrim((string) $value, '/');
    }

    public function token(): ?string
    {
        $value = NotificationSetting::getValue('wa_gateway_token');
        if ($value === null) {
            $value = config('services.wa_gateway.token');
        }

        return $value !== null && $value !== '' ? (string) $value : null;
    }

    public function webhookSecret(): string
    {
        return (string) NotificationSetting::getValue(
            'wa_gateway_webhook_secret',
            config('services.wa_gateway.webhook_secret', 'mendunia-gateway-secret')
        );
    }

    public function defaultDeviceSetting(): ?string
    {
        $value = NotificationSetting::getValue(
            'wa_gateway_default_device',
            config('services.wa_gateway.default_device')
        );

        return $value !== null && $value !== '' ? (string) $value : null;
    }

    public function isConfigured(): bool
    {
        return $this->baseUrl() !== '' && $this->token() !== null && $this->token() !== '';
    }

    public function client(): PendingRequest
    {
        return Http::baseUrl($this->baseUrl())
            ->withHeaders([
                'X-Gateway-Token' => $this->token(),
                'Accept' => 'application/json',
            ])
            ->timeout((int) config('services.wa_gateway.timeout', 10));
    }

    /**
     * @return array<int, array<string, mixed>>
     * @throws \RuntimeException
     */
    public function devices(): array
    {
        $res = $this->client()->get('/api/devices');
        if (!$res->successful()) {
            throw new \RuntimeException('Gateway merespons dengan status ' . $res->status());
        }

        $devices = $res->json('devices');
        return is_array($devices) ? $devices : [];
    }

    /**
     * Tentukan slug device yang dipakai untuk pengiriman:
     * 1) device default yang dikonfigurasi (jika ada),
     * 2) device pertama yang berstatus connected.
     */
    public function resolveDeviceSlug(): ?string
    {
        $configured = $this->defaultDeviceSetting();

        try {
            $devices = $this->devices();
        } catch (\Throwable $e) {
            Log::warning('WA Gateway: gagal mengambil daftar device - ' . $e->getMessage());
            return $configured;
        }

        if ($configured) {
            foreach ($devices as $device) {
                if (($device['slug'] ?? null) === $configured) {
                    return $configured;
                }
            }
            Log::warning("WA Gateway: device default '{$configured}' tidak ditemukan di gateway.");
        }

        foreach ($devices as $device) {
            if (($device['status'] ?? null) === 'connected') {
                return $device['slug'] ?? null;
            }
        }

        return null;
    }

    public function sendText(string $to, string $message, ?string $slug = null): bool
    {
        $slug = $slug ?: $this->resolveDeviceSlug();
        if (!$slug) {
            Log::warning('WA Gateway: tidak ada device terhubung untuk mengirim pesan ke ' . $to);
            return false;
        }

        $res = $this->client()->post("/api/devices/{$slug}/send", [
            'to' => $to,
            'message' => $message,
        ]);

        if ($res->successful()) {
            Log::info("WhatsApp terkirim via gateway [{$slug}] ke: {$to}");
            return true;
        }

        Log::error("Gagal kirim WhatsApp via gateway [{$slug}] ke {$to}: " . $res->body());
        return false;
    }

    public function sendMedia(
        string $to,
        string $fileUrl,
        string $caption = '',
        string $type = 'image',
        ?string $slug = null
    ): bool {
        $slug = $slug ?: $this->resolveDeviceSlug();
        if (!$slug) {
            Log::warning('WA Gateway: tidak ada device terhubung untuk mengirim media ke ' . $to);
            return false;
        }

        $validType = in_array($type, ['image', 'video', 'document', 'audio'], true) ? $type : 'image';

        $res = $this->client()->post("/api/devices/{$slug}/send", [
            'to' => $to,
            'fileUrl' => $fileUrl,
            'caption' => $caption,
            'type' => $validType,
        ]);

        if ($res->successful()) {
            Log::info("WhatsApp media terkirim via gateway [{$slug}] ke: {$to}");
            return true;
        }

        Log::error("Gagal kirim WhatsApp media via gateway [{$slug}] ke {$to}: " . $res->body());
        return false;
    }
}
