<?php

namespace App\Http\Controllers;

use App\Models\WaReminderSetting;
use App\Models\NotificationSetting;
use App\Models\Product;
use App\Models\BiayaKategori;
use Illuminate\Http\Request;

class WaSettingController extends Controller
{
    /**
     * Ambil pengaturan reminder yang digrup per Product
     */
    public function reminderIndex()
    {
        $products = Product::with('biayaKategoris')->where('status', 'aktif')->get();

        // Auto-create settings untuk kategori baru yang belum punya
        $allKatIds = $products->flatMap->biayaKategoris->pluck('id')->unique()->toArray();
        $existingKatIds = WaReminderSetting::whereIn('kategori_id', $allKatIds)->pluck('kategori_id')->toArray();
        $newKatIds = array_diff($allKatIds, $existingKatIds);

        foreach ($newKatIds as $katId) {
            WaReminderSetting::create([
                'kategori_id' => $katId,
                'jatuh_tempo_hari' => 30,
                'reminder_days' => [7, 3, 1],
                'is_enabled' => true,
            ]);
        }

        // Load semua settings
        $settingsMap = WaReminderSetting::whereIn('kategori_id', $allKatIds)
            ->get()
            ->keyBy('kategori_id');

        // Format per product
        $result = $products->map(function ($product) use ($settingsMap) {
            $kategoris = $product->biayaKategoris->map(function ($k) use ($settingsMap) {
                $setting = $settingsMap[$k->id] ?? null;
                return [
                    'kategori_id' => $k->id,
                    'nama' => $k->nama,
                    'kode' => $k->kode,
                    'harga' => (int) $k->pivot->harga,
                    'komisi' => (int) $k->pivot->komisi,
                    'jatuh_tempo_hari' => $setting->jatuh_tempo_hari ?? 30,
                    'reminder_days' => $setting->reminder_days ?? [7, 3, 1],
                    'is_enabled' => $setting->is_enabled ?? true,
                    'template_pesan' => $setting->template_pesan ?? null,
                ];
            });

            return [
                'id' => $product->id,
                'nama' => $product->nama,
                'deskripsi' => $product->deskripsi,
                'total' => $kategoris->sum('harga'),
                'status' => $product->status,
                'kategori_count' => $kategoris->count(),
                'kategoris' => $kategoris->sortBy('kode')->values(),
            ];
        });

        return response()->json($result);
    }

    /**
     * Update pengaturan reminder per kategori (bulk save)
     */
    public function reminderUpdate(Request $request)
    {
        $data = $request->validate([
            'settings' => 'required|array',
            'settings.*.kategori_id' => 'required|exists:biaya_kategoris,id',
            'settings.*.jatuh_tempo_hari' => 'required|integer|min:1|max:365',
            'settings.*.reminder_days' => 'nullable|array',
            'settings.*.reminder_days.*' => 'integer|min:0|max:365',
            'settings.*.is_enabled' => 'boolean',
            'settings.*.template_pesan' => 'nullable|string|max:1000',
        ]);

        foreach ($data['settings'] as $item) {
            WaReminderSetting::updateOrCreate(
                ['kategori_id' => $item['kategori_id']],
                [
                    'jatuh_tempo_hari' => $item['jatuh_tempo_hari'],
                    'reminder_days' => $item['reminder_days'] ?? [7, 3, 1],
                    'is_enabled' => $item['is_enabled'] ?? true,
                    'template_pesan' => $item['template_pesan'] ?? null,
                ]
            );
        }

        return response()->json(['message' => 'Pengaturan reminder berhasil disimpan']);
    }

    /**
     * Ambil pengaturan notifikasi global (toggle on/off per jenis)
     */
    public function globalIndex()
    {
        $keys = [
            'wa_pembayaran' => 'Notifikasi pembayaran ke admin',
            'wa_pembayaran_admin_phones' => 'Nomor HP admin (pisahkan koma)',
            'wa_new_bill' => 'Tagihan baru dibuat',
            'wa_payment_success' => 'Pembayaran berhasil',
            'wa_payment_rejected' => 'Pembayaran ditolak',
            'wa_payment_partial' => 'Pembayaran cicilan',
            'wa_full_payment' => 'Tagihan lunas',
            'wa_reminder_pembayaran' => 'Pengingat pembayaran otomatis',
            'wa_registration_approved' => 'Pendaftaran disetujui',
        ];

        $settings = [];
        foreach ($keys as $key => $desc) {
            $existing = NotificationSetting::where('key', $key)->first();
            $settings[] = [
                'key' => $key,
                'description' => $desc,
                'is_enabled' => $existing ? $existing->is_enabled : true,
                'value' => $existing?->value ?? null,
            ];
        }

        return response()->json($settings);
    }

    /**
     * Update pengaturan notifikasi global
     */
    public function globalUpdate(Request $request)
    {
        $data = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.is_enabled' => 'required|boolean',
            'settings.*.value' => 'nullable|string',
        ]);

        foreach ($data['settings'] as $item) {
            NotificationSetting::updateOrCreate(
                ['key' => $item['key']],
                [
                    'is_enabled' => $item['is_enabled'],
                    'value' => $item['value'] ?? null,
                    'description' => $item['description'] ?? null,
                ]
            );
        }

        return response()->json(['message' => 'Pengaturan global berhasil disimpan']);
    }
}
