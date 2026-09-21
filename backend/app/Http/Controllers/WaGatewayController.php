<?php

namespace App\Http\Controllers;

use App\Services\WaGatewayClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Manajemen WhatsApp Gateway internal (Baileys): daftar device, scan QR,
 * kirim pesan uji, logout/hapus device, serta penerimaan webhook.
 *
 * Controller ini bertindak sebagai proxy aman antara frontend (yang telah
 * terautentikasi) dengan service gateway yang dilindungi token.
 */
class WaGatewayController extends Controller
{
    protected WaGatewayClient $gateway;

    public function __construct(WaGatewayClient $gateway)
    {
        $this->gateway = $gateway;
    }

    /**
     * Ringkasan status gateway + konektivitas & daftar device.
     */
    public function status()
    {
        $configured = $this->gateway->isConfigured();

        if (!$configured) {
            return response()->json([
                'online' => false,
                'configured' => false,
                'base_url' => $this->gateway->baseUrl(),
                'default_device' => $this->gateway->defaultDeviceSetting(),
                'devices' => [],
                'message' => 'Gateway belum dikonfigurasi. Isi Base URL & Token pada Pengaturan Notifikasi.',
            ]);
        }

        try {
            $health = $this->gateway->client()->get('/api/health');
            $devices = $this->gateway->devices();

            return response()->json([
                'online' => $health->successful(),
                'configured' => true,
                'base_url' => $this->gateway->baseUrl(),
                'default_device' => $this->gateway->defaultDeviceSetting(),
                'gateway' => $health->json(),
                'devices' => $devices,
            ]);
        } catch (\Throwable $e) {
            Log::warning('WA Gateway tidak dapat dihubungi: ' . $e->getMessage());

            return response()->json([
                'online' => false,
                'configured' => true,
                'base_url' => $this->gateway->baseUrl(),
                'default_device' => $this->gateway->defaultDeviceSetting(),
                'devices' => [],
                'message' => 'Tidak dapat terhubung ke gateway: ' . $e->getMessage(),
            ]);
        }
    }

    public function devices()
    {
        try {
            return response()->json(['devices' => $this->gateway->devices()]);
        } catch (\Throwable $e) {
            return $this->gatewayError($e);
        }
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
        ]);

        try {
            $res = $this->gateway->client()->post('/api/devices', [
                'name' => $data['name'],
            ]);

            return response()->json($res->json(), $res->status());
        } catch (\Throwable $e) {
            return $this->gatewayError($e);
        }
    }

    public function show($slug)
    {
        try {
            $res = $this->gateway->client()->get("/api/devices/{$slug}/status");
            return response()->json($res->json(), $res->status());
        } catch (\Throwable $e) {
            return $this->gatewayError($e);
        }
    }

    public function qr($slug)
    {
        try {
            $res = $this->gateway->client()->get("/api/devices/{$slug}/qr");
            return response()->json($res->json(), $res->status());
        } catch (\Throwable $e) {
            return $this->gatewayError($e);
        }
    }

    public function rename(Request $request, $slug)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
        ]);

        try {
            $res = $this->gateway->client()->patch("/api/devices/{$slug}", [
                'name' => $data['name'],
            ]);
            return response()->json($res->json(), $res->status());
        } catch (\Throwable $e) {
            return $this->gatewayError($e);
        }
    }

    public function send(Request $request, $slug)
    {
        $data = $request->validate([
            'to' => 'required|string|max:30',
            'message' => 'nullable|string',
            'fileUrl' => 'nullable|url',
            'caption' => 'nullable|string',
            'type' => 'nullable|string|in:image,video,document,audio',
        ]);

        if (empty($data['message']) && empty($data['fileUrl'])) {
            return response()->json(['error' => 'Isi pesan atau URL media wajib diisi'], 422);
        }

        try {
            $res = $this->gateway->client()->post("/api/devices/{$slug}/send", $data);
            return response()->json($res->json(), $res->status());
        } catch (\Throwable $e) {
            return $this->gatewayError($e);
        }
    }

    public function logout($slug)
    {
        try {
            $res = $this->gateway->client()->post("/api/devices/{$slug}/logout");
            return response()->json($res->json(), $res->status());
        } catch (\Throwable $e) {
            return $this->gatewayError($e);
        }
    }

    public function reconnect($slug)
    {
        try {
            $res = $this->gateway->client()->post("/api/devices/{$slug}/reconnect");
            return response()->json($res->json(), $res->status());
        } catch (\Throwable $e) {
            return $this->gatewayError($e);
        }
    }

    public function destroy($slug)
    {
        try {
            $res = $this->gateway->client()->delete("/api/devices/{$slug}");
            return response()->json($res->json(), $res->status());
        } catch (\Throwable $e) {
            return $this->gatewayError($e);
        }
    }

    /**
     * Terima event dari gateway (status, qr, message).
     * Dilindungi header X-Webhook-Secret (dibagikan lewat konfigurasi).
     */
    public function webhook(Request $request)
    {
        $secret = $request->header('X-Webhook-Secret');
        if (!$secret || !hash_equals($this->gateway->webhookSecret(), (string) $secret)) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $payload = $request->all();
        $event = $payload['event'] ?? 'unknown';
        Log::info("WA Gateway webhook [{$event}]", $payload);

        // Pesan masuk: teruskan ke handler balasan (approval izin/pembayaran)
        // agar alur yang sudah ada tetap bekerja dengan gateway internal.
        if ($event === 'message' && !empty($payload['from']) && !empty($payload['text'])) {
            try {
                $forward = Request::create('/api/wa-webhook', 'POST', [
                    'from' => $payload['from'],
                    'message' => $payload['text'],
                ]);
                $forward->headers->set('Content-Type', 'application/json');
                app(WaWebhookController::class)->handle($forward);
            } catch (\Throwable $e) {
                Log::error('WA Gateway webhook: gagal memproses pesan masuk - ' . $e->getMessage());
            }
        }

        return response()->json(['status' => 'ok']);
    }

    protected function gatewayError(\Throwable $e)
    {
        Log::error('WA Gateway error: ' . $e->getMessage());

        return response()->json([
            'error' => 'Gagal menghubungi WhatsApp Gateway',
            'message' => $e->getMessage(),
        ], 502);
    }
}
