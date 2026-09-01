<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Proxy integrasi ke Sistem Penempatan (job.mendunia.id).
 * API key disimpan di server (.env) dan tidak pernah bocor ke frontend.
 */
class PenempatanKandidatController extends Controller
{
    protected string $baseUrl;
    protected string $apiKey;

    public function __construct()
    {
        $this->baseUrl = rtrim((string) config('services.penempatan.base_url'), '/');
        $this->apiKey = (string) config('services.penempatan.api_key');
    }

    /**
     * GET /api/penempatan/kandidat — daftar kandidat (pagination & filter).
     */
    public function index(Request $request)
    {
        $params = array_filter([
            'page' => $request->integer('page', 1),
            'limit' => min($request->integer('limit', 50), 200),
            'search' => $request->input('search'),
            'status' => $request->input('status'),
            'status_progres' => $request->input('status_progres'),
            'jenis_kelamin' => $request->input('jenis_kelamin'),
            'cabang_id' => $request->input('cabang_id'),
            'bidang_ssw' => $request->input('bidang_ssw'),
            'jenjang' => $request->input('jenjang'),
            'umur_min' => $request->input('umur_min'),
            'umur_max' => $request->input('umur_max'),
            'status_keberangkatan' => $request->input('status_keberangkatan'),
        ], fn($v) => $v !== null && $v !== '');

        $result = $this->proxyGetData('/api/integrasi/kandidat', $params);
        if ($result === null) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal terhubung ke Sistem Penempatan.',
            ], 502);
        }

        // Enrich: ambil pas_foto tiap kandidat secara paralel di server,
        // agar frontend tidak perlu N request detail.
        if (is_array($result['data'] ?? null) && count($result['data']) > 0) {
            $fotos = $this->fetchFotos(array_column($result['data'], 'id'));
            foreach ($result['data'] as &$kandidat) {
                $kandidat['foto_url'] = $fotos[$kandidat['id']] ?? null;
            }
            unset($kandidat);
        }

        return response()->json($result);
    }

    /**
     * GET /api/penempatan/kandidat/{id} — detail kandidat.
     */
    public function show(Request $request, $id)
    {
        $result = $this->proxyGetData("/api/integrasi/kandidat/{$id}");
        if ($result === null) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal terhubung ke Sistem Penempatan.',
            ], 502);
        }
        return response()->json($result);
    }

    /**
     * GET /api/penempatan/dashboard — statistik keseluruhan (total, byStatus,
     * byCabang, SSW, JFT/SSW, interview) seperti dashboard admin Sistem Penempatan.
     */
    public function dashboard(Request $request)
    {
        $params = array_filter([
            'filter_type' => $request->input('filter_type'),
            'start_date' => $request->input('start_date'),
            'end_date' => $request->input('end_date'),
            'cabang_id' => $request->input('cabang_id'),
        ], fn($v) => $v !== null && $v !== '');

        $result = $this->proxyGetData('/api/integrasi/dashboard', $params);
        if ($result === null) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal terhubung ke Sistem Penempatan.',
            ], 502);
        }
        return response()->json($result);
    }

    /**
     * GET /api/penempatan/cabang — daftar cabang (search & status opsional).
     */
    public function cabangIndex(Request $request)
    {
        $params = array_filter([
            'search' => $request->input('search'),
            'status' => $request->input('status'),
        ], fn($v) => $v !== null && $v !== '');

        $result = $this->proxyGetData('/api/integrasi/cabang', $params);
        if ($result === null) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal terhubung ke Sistem Penempatan.',
            ], 502);
        }
        return response()->json($result);
    }

    /**
     * POST /api/penempatan/kandidat — buat/isi formulir kandidat.
     */
    public function store(Request $request)
    {
        $payload = $request->json()->all();
        return $this->proxySendData('POST', '/api/integrasi/kandidat', $payload);
    }

    /**
     * PUT /api/penempatan/kandidat/{id} — update formulir kandidat.
     */
    public function update(Request $request, $id)
    {
        $payload = $request->json()->all();
        return $this->proxySendData('PUT', "/api/integrasi/kandidat/{$id}", $payload);
    }

    /**
     * POST /api/penempatan/kandidat/{id}/upload-dokumen — upload dokumen (multipart).
     * Query param wajib: jenis_dokumen
     */
    public function uploadDokumen(Request $request, $id)
    {
        $jenis = $request->query('jenis_dokumen');
        if (!$jenis) {
            return response()->json([
                'success' => false,
                'message' => 'Parameter jenis_dokumen wajib diisi.',
            ], 422);
        }

        if (!$request->hasFile('file')) {
            return response()->json([
                'success' => false,
                'message' => 'Field file wajib diisi.',
            ], 422);
        }

        try {
            $file = $request->file('file');
            $response = Http::timeout(60)
                ->withHeaders(['x-api-key' => $this->apiKey])
                ->attach(
                    'file',
                    fopen($file->getRealPath(), 'r'),
                    $file->getClientOriginalName()
                )
                ->post($this->baseUrl . "/api/integrasi/kandidat/{$id}/upload-dokumen?jenis_dokumen={$jenis}");

            $body = $response->json();
            if (is_array($body)) {
                return response()->json($body, $response->status());
            }

            Log::error('Penempatan API upload non-JSON response: ' . $response->status() . ' - ' . substr((string) $response->body(), 0, 500));
            return response()->json([
                'success' => false,
                'status' => $response->status(),
                'message' => 'Sistem Penempatan mengembalikan respons tidak valid (HTTP ' . $response->status() . ').',
            ], $response->status());
        } catch (\Exception $e) {
            Log::error('Penempatan API upload failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupload dokumen ke Sistem Penempatan.',
            ], 502);
        }
    }

    /**
     * Ambil pas_foto untuk daftar id secara paralel (Http::pool).
     * Hasil di-cache sebentar (60 detik) agar request berulang cepat.
     */
    protected function fetchFotos(array $ids): array
    {
        $ids = array_values(array_filter(array_map('intval', $ids), fn($v) => $v > 0));
        if (empty($ids)) return [];

        $cacheKey = 'penempatan_foto_' . md5(implode(',', $ids));
        if (\Illuminate\Support\Facades\Cache::has($cacheKey)) {
            return \Illuminate\Support\Facades\Cache::get($cacheKey);
        }

        $fotos = [];
        $responses = \Illuminate\Support\Facades\Http::pool(function ($pool) use ($ids) {
            foreach ($ids as $id) {
                $pool->timeout(10)
                    ->withHeaders(['x-api-key' => $this->apiKey])
                    ->get($this->baseUrl . "/api/integrasi/kandidat/{$id}");
            }
        });

        foreach ($responses as $i => $response) {
            if (!$response) continue;
            if ($response->ok()) {
                $body = $response->json();
                $detail = $body['data'] ?? [];
                foreach ($detail['dokumen'] ?? [] as $doc) {
                    if (($doc['jenis_dokumen'] ?? '') === 'pas_foto' && !empty($doc['file_url'])) {
                        $fotos[$ids[$i]] = $doc['file_url'];
                        break;
                    }
                }
            }
        }

        \Illuminate\Support\Facades\Cache::put($cacheKey, $fotos, 60);
        return $fotos;
    }

    /**
     * Teruskan request GET ke Sistem Penempatan dengan header x-api-key.
     * Mengembalikan array hasil (sudah di-decode) atau null jika gagal.
     */
    protected function proxyGetData(string $path, array $params = [])
    {
        try {
            $response = Http::timeout(15)
                ->withHeaders(['x-api-key' => $this->apiKey])
                ->get($this->baseUrl . $path, $params);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Penempatan API error: ' . $response->status() . ' - ' . $response->body());
            return null;
        } catch (\Exception $e) {
            Log::error('Penempatan API request failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Teruskan request POST/PUT JSON ke Sistem Penempatan dengan header x-api-key.
     */
    protected function proxySendData(string $method, string $path, array $payload)
    {
        try {
            $client = Http::timeout(30)->withHeaders(['x-api-key' => $this->apiKey]);
            $response = $method === 'PUT'
                ? $client->put($this->baseUrl . $path, $payload)
                : $client->post($this->baseUrl . $path, $payload);

            $body = $response->json();
            if (is_array($body)) {
                return response()->json($body, $response->status());
            }

            Log::error('Penempatan API ' . $method . ' non-JSON response: ' . $response->status() . ' - ' . substr((string) $response->body(), 0, 500));
            return response()->json([
                'success' => false,
                'status' => $response->status(),
                'message' => 'Sistem Penempatan mengembalikan respons tidak valid (HTTP ' . $response->status() . '). Endpoint mungkin belum aktif.',
            ], $response->status());
        } catch (\Exception $e) {
            Log::error('Penempatan API ' . $method . ' failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal terhubung ke Sistem Penempatan.',
            ], 502);
        }
    }
}
