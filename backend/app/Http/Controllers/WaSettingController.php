<?php

namespace App\Http\Controllers;

use App\Models\WaReminderSetting;
use App\Models\NotificationSetting;
use App\Models\Product;
use App\Models\BiayaKategori;
use App\Models\Batch;
use App\Models\BatchBiaya;
use App\Models\BatchKategoriDeadline;
use App\Models\EmailNotification;
use App\Services\EmailService;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

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
                'is_enabled' => false,
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
                    'trigger_type' => $k->trigger_type ?? 'registration',
                    'trigger_value' => $k->trigger_value,
                    'due_type' => $k->due_type ?? 'days_after_invoice',
                    'due_value' => $k->due_value,
                    'reminder_setting' => $k->reminder_setting,
                    'jatuh_tempo_hari' => $setting->jatuh_tempo_hari ?? 30,
                    'reminder_days' => $setting->reminder_days ?? [7, 3, 1],
                    'is_enabled' => $setting->is_enabled ?? false,
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

    // ==================== BATCH KATEGORI DEADLINES ====================

    /**
     * Ambil kategori yang dimiliki oleh batch tertentu (dari batch_biayas).
     */
    public function batchKategoris(Request $request)
    {
        $batchId = $request->input('batch_id');
        if (!$batchId) {
            return response()->json(['message' => 'batch_id wajib'], 422);
        }

        $kategoris = BatchBiaya::with('kategori')
            ->where('batch_id', $batchId)
            ->get()
            ->map(fn($bb) => [
                'kategori_id' => $bb->kategori_id,
                'nama' => $bb->kategori->nama ?? '-',
                'kode' => $bb->kategori->kode ?? '-',
                'urutan' => $bb->kategori->urutan ?? 0,
            ]);

        return response()->json($kategoris);
    }

    /**
     * Ambil semua deadline per batch + kategori.
     * Frontend mengirim batch_id, backend mengembalikan semua kategori + deadline yang sudah ada.
     */
    public function batchDeadlineIndex(Request $request)
    {
        $batchId = $request->input('batch_id');

        $query = BatchKategoriDeadline::with(['batch', 'kategori']);
        if ($batchId) {
            $query->where('batch_id', $batchId);
        }
        $deadlines = $query->get();

        // Group by batch
        $grouped = $deadlines->groupBy('batch_id')->map(function ($items, $batchId) {
            $batch = Batch::find($batchId);
            return [
                'batch_id' => $batchId,
                'batch_nama' => $batch?->nama_batch ?? 'Batch #' . $batchId,
                'batch_status' => $batch?->status ?? '-',
                'deadlines' => $items->map(fn($d) => [
                    'id' => $d->id,
                    'kategori_id' => $d->kategori_id,
                    'kategori_nama' => $d->kategori->nama ?? '-',
                    'kategori_kode' => $d->kategori->kode ?? '-',
                    'tanggal_awal' => $d->tanggal_awal?->format('Y-m-d'),
                    'tanggal_akhir' => $d->tanggal_akhir?->format('Y-m-d'),
                    'reminder_days' => $d->reminder_days ?? [7, 3, 1],
                    'is_enabled' => $d->is_enabled,
                    'template_pesan' => $d->template_pesan,
                    'channel' => $d->channel ?? 'wa',
                    'template_email' => $d->template_email,
                    'subject_email' => $d->subject_email,
                ])->values(),
            ];
        })->values();

        return response()->json($grouped);
    }

    /**
     * Bulk save deadline per batch + kategori.
     * Expected payload: { deadlines: [{ batch_id, kategori_id, tanggal_awal, tanggal_akhir, reminder_days, is_enabled, template_pesan }] }
     */
    public function batchDeadlineBulkUpdate(Request $request)
    {
        $data = $request->validate([
            'deadlines' => 'required|array|min:1',
            'deadlines.*.batch_id' => 'required|exists:batches,id',
            'deadlines.*.kategori_id' => 'required|exists:biaya_kategoris,id',
            'deadlines.*.tanggal_awal' => 'nullable|date',
            'deadlines.*.tanggal_akhir' => 'nullable|date|after_or_equal:deadlines.*.tanggal_awal',
            'deadlines.*.reminder_days' => 'nullable|array',
            'deadlines.*.reminder_days.*' => 'integer|min:0|max:365',
            'deadlines.*.is_enabled' => 'boolean',
            'deadlines.*.template_pesan' => 'nullable|string|max:1000',
            'deadlines.*.channel' => 'nullable|string|in:wa,email,both',
            'deadlines.*.template_email' => 'nullable|string|max:5000',
            'deadlines.*.subject_email' => 'nullable|string|max:255',
        ]);

        $saved = 0;
        foreach ($data['deadlines'] as $item) {
            BatchKategoriDeadline::updateOrCreate(
                ['batch_id' => $item['batch_id'], 'kategori_id' => $item['kategori_id']],
                [
                    'tanggal_awal' => $item['tanggal_awal'] ?? null,
                    'tanggal_akhir' => $item['tanggal_akhir'] ?? null,
                    'reminder_days' => $item['reminder_days'] ?? [7, 3, 1],
                    'is_enabled' => $item['is_enabled'] ?? true,
                    'template_pesan' => $item['template_pesan'] ?? null,
                    'channel' => $item['channel'] ?? 'wa',
                    'template_email' => $item['template_email'] ?? null,
                    'subject_email' => $item['subject_email'] ?? null,
                ]
            );
            $saved++;
        }

        return response()->json([
            'message' => "{$saved} deadline berhasil disimpan",
            'count' => $saved,
        ]);
    }

    /**
     * Hapus satu deadline.
     */
    public function batchDeadlineDestroy($id)
    {
        $deleted = BatchKategoriDeadline::where('id', $id)->delete();
        return response()->json(['message' => $deleted ? 'Berhasil dihapus' : 'Tidak ditemukan']);
    }

    /**
     * Ambil deadline yang aktif untuk batch tertentu (public, untuk frontend countdown).
     * Digunakan oleh CheckoutBerhasil / PembayaranSiswa.
     */
    public function batchDeadlinePublic(Request $request)
    {
        $batchId = $request->input('batch_id');
        if (!$batchId) {
            return response()->json(['message' => 'batch_id wajib'], 422);
        }

        $deadlines = BatchKategoriDeadline::with('kategori')
            ->where('batch_id', $batchId)
            ->where('is_enabled', true)
            ->get()
            ->map(fn($d) => [
                'kategori_id' => $d->kategori_id,
                'kategori_nama' => $d->kategori->nama ?? '-',
                'kategori_kode' => $d->kategori->kode ?? '-',
                'tanggal_awal' => $d->tanggal_awal?->format('Y-m-d'),
                'tanggal_akhir' => $d->tanggal_akhir?->format('Y-m-d'),
                'channel' => $d->channel ?? 'wa',
            ]);

        return response()->json($deadlines);
    }

    /**
     * Ambil pengaturan notifikasi global (toggle on/off per jenis)
     */
    public function globalIndex()
    {
        $keys = [
            'wa_pembayaran' => 'Notifikasi pembayaran ke admin (WA)',
            'wa_pembayaran_admin_phones' => 'Nomor HP admin mutasi (pisahkan koma)',
            'wa_pendaftaran_baru' => 'Pendaftaran baru ke admin (WA)',
            'wa_pendaftaran_admin_phones' => 'Nomor HP admin follow up (pisahkan koma)',
            'wa_new_bill' => 'Tagihan baru dibuat (WA)',
            'wa_payment_success' => 'Pembayaran berhasil (WA)',
            'wa_payment_rejected' => 'Pembayaran ditolak (WA)',
            'wa_payment_partial' => 'Pembayaran cicilan (WA)',
            'wa_full_payment' => 'Tagihan lunas (WA)',
            'wa_reminder_pembayaran' => 'Pengingat pembayaran otomatis (WA)',
            'wa_registration_approved' => 'Pendaftaran disetujui (WA)',
            'email_pembayaran' => 'Notifikasi pembayaran ke admin (Email)',
            'email_pembayaran_admin_addresses' => 'Alamat email admin (pisahkan koma)',
            'email_reminder_pembayaran' => 'Pengingat pembayaran otomatis (Email)',
            'email_payment_success' => 'Pembayaran berhasil (Email)',
            'email_payment_rejected' => 'Pembayaran ditolak (Email)',
            'email_full_payment' => 'Tagihan lunas (Email)',
            'starsender_api_key' => 'API Key StarSender',
            'starsender_api_url' => 'API URL StarSender',
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

    /**
     * Ambil konfigurasi SMTP email dari database
     */
    public function mailIndex()
    {
        $keys = [
            'mail_mailer' => 'Mailer',
            'mail_host' => 'SMTP Host',
            'mail_port' => 'SMTP Port',
            'mail_username' => 'SMTP Username',
            'mail_password' => 'SMTP Password',
            'mail_encryption' => 'Enkripsi (tls / ssl / null)',
            'mail_from_address' => 'Email Pengirim (From Address)',
            'mail_from_name' => 'Nama Pengirim (From Name)',
        ];

        $settings = [];
        foreach ($keys as $key => $desc) {
            $existing = NotificationSetting::where('key', $key)->first();
            $settings[] = [
                'key' => $key,
                'description' => $desc,
                'value' => $existing?->value ?? null,
            ];
        }

        return response()->json($settings);
    }

    /**
     * Simpan konfigurasi SMTP email ke database lalu terapkan langsung
     */
    public function mailUpdate(Request $request)
    {
        $data = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'nullable|string',
        ]);

        foreach ($data['settings'] as $item) {
            NotificationSetting::updateOrCreate(
                ['key' => $item['key']],
                [
                    'value' => ($item['value'] ?? null) !== '' ? $item['value'] : null,
                    'description' => $item['description'] ?? null,
                ]
            );
        }

        NotificationSetting::applyMailConfig();

        return response()->json(['message' => 'Konfigurasi email berhasil disimpan']);
    }

    // ==================== EMAIL NOTIFICATION LOG ====================

    /**
     * Ambil log notifikasi email.
     */
    public function emailLog(Request $request)
    {
        $query = EmailNotification::with('pendaftar');

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        if ($request->filled('pendaftar_id')) {
            $query->where('pendaftar_id', $request->pendaftar_id);
        }

        $logs = $query->latest()->paginate(20);

        return response()->json($logs);
    }

    /**
     * Stats notifikasi email.
     */
    public function emailStats()
    {
        $total = EmailNotification::count();
        $success = EmailNotification::where('success', true)->count();
        $failed = EmailNotification::where('success', false)->count();
        $today = EmailNotification::whereDate('created_at', today())->count();

        return response()->json([
            'total' => $total,
            'success' => $success,
            'failed' => $failed,
            'today' => $today,
        ]);
    }

    /**
     * Kirim email uji coba untuk mengecek konfigurasi SMTP.
     */
    public function testEmail(Request $request)
    {
        $request->validate([
            'to_email' => 'required|email',
        ]);

        NotificationSetting::applyMailConfig();

        $to = $request->to_email;
        $mailer = config('mail.default');
        $fromAddress = config('mail.from.address');
        $fromName = config('mail.from.name');
        $host = config('mail.mailers.smtp.host');
        $port = config('mail.mailers.smtp.port');
        $encryption = config('mail.mailers.smtp.encryption');
        $username = config('mail.mailers.smtp.username');

        try {
            Mail::raw(
                "✅ Email berhasil terkirim!\n\n"
                . "Konfigurasi SMTP:\n"
                . "- Mailer: {$mailer}\n"
                . "- Host: {$host}\n"
                . "- Port: {$port}\n"
                . "- Encryption: {$encryption}\n"
                . "- Username: {$username}\n"
                . "- From: {$fromAddress} ({$fromName})\n\n"
                . "Waktu: " . now()->format('d F Y H:i:s') . "\n"
                . "- Sistem SIM Mendunia",
                function ($message) use ($to, $fromAddress, $fromName) {
                    $message->to($to)
                        ->subject('[Test Email] SIM Mendunia - Notifikasi Berfungsi')
                        ->from($fromAddress, $fromName);
                }
            );

            return response()->json([
                'success' => true,
                'message' => "Email uji coba berhasil dikirim ke {$to}",
                'config' => [
                    'mailer' => $mailer,
                    'host' => $host,
                    'port' => $port,
                    'encryption' => $encryption,
                    'username' => $username ? substr($username, 0, 3) . '***' : null,
                    'from_address' => $fromAddress,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Test email gagal: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim email: ' . $e->getMessage(),
                'config' => [
                    'mailer' => $mailer,
                    'host' => $host,
                    'port' => $port,
                    'encryption' => $encryption,
                    'username' => $username ? substr($username, 0, 3) . '***' : null,
                    'from_address' => $fromAddress,
                ],
            ], 500);
        }
    }

    public function testWa(Request $request)
    {
        $request->validate([
            'to_phone' => 'required|string',
        ]);

        $to = $request->to_phone;
        $apiKey = NotificationSetting::getValue('starsender_api_key', config('services.starsender.api_key', env('STARSAPI_KEY')));
        $apiUrl = NotificationSetting::getValue('starsender_api_url', config('services.starsender.api_url', env('STARSAPI_URL', 'https://api.starsender.online/api/send')));

        try {
            $wa = new WhatsAppService();
            $sent = $wa->sendMessage($to, "✅ Uji coba WhatsApp dari SIM Mendunia berhasil!\n\nWaktu: " . now()->format('d F Y H:i:s') . "\n\n- Sistem SIM Mendunia");

            if ($sent) {
                return response()->json([
                    'success' => true,
                    'message' => "WhatsApp uji coba berhasil dikirim ke {$to}",
                    'config' => [
                        'api_url' => $apiUrl,
                        'api_key' => $apiKey ? substr($apiKey, 0, 8) . '***' : null,
                    ],
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim WhatsApp. Periksa konfigurasi API StarSender.',
                'config' => [
                    'api_url' => $apiUrl,
                    'api_key' => $apiKey ? substr($apiKey, 0, 8) . '***' : null,
                ],
            ], 500);
        } catch (\Exception $e) {
            Log::error('Test WhatsApp gagal: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim WhatsApp: ' . $e->getMessage(),
                'config' => [
                    'api_url' => $apiUrl,
                    'api_key' => $apiKey ? substr($apiKey, 0, 8) . '***' : null,
                ],
            ], 500);
        }
    }
}
