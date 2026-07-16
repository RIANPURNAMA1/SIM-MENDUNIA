<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Pendaftar;
use App\Models\WaNotification;
use App\Models\WaReminderSetting;
use App\Models\NotificationSetting;
use App\Services\WhatsAppService;

class SendPaymentReminders extends Command
{
    protected $signature = 'app:reminder-pembayaran';
    protected $description = 'Kirim pengingat pembayaran via WhatsApp berdasarkan pengaturan dinamis per kategori';

    public function handle()
    {
        // Cek apakah fitur reminder aktif secara global
        $globalSetting = NotificationSetting::where('key', 'wa_reminder_pembayaran')->first();
        if ($globalSetting && !$globalSetting->is_enabled) {
            $this->info('Fitur pengingat pembayaran dinonaktifkan.');
            return 0;
        }

        $waService = new WhatsAppService();
        $today = now()->startOfDay();
        $sent = 0;
        $skipped = 0;

        // Load semua pengaturan reminder per kategori (indexed by kategori_id)
        $reminderSettings = WaReminderSetting::where('is_enabled', true)
            ->get()
            ->keyBy('kategori_id');

        if ($reminderSettings->isEmpty()) {
            $this->info('Tidak ada pengaturan reminder yang aktif.');
            return 0;
        }

        // Ambil semua kategori_id yang aktif
        $activeKategoriIds = $reminderSettings->pluck('kategori_id')->toArray();

        // Cari pendaftar yang belum lunas, punya telepon, dan programnya punya kategori aktif
        $pendaftars = Pendaftar::with(['product.biayaKategoris', 'user', 'categoryPayments'])
            ->where('status_pendaftaran', 'disetujui')
            ->where('status_pembayaran', '!=', 'verified')
            ->whereNotNull('telepon')
            ->get();

        foreach ($pendaftars as $p) {
            if (!$p->product) {
                $skipped++;
                continue;
            }

            // Cek per kategori yang belum dibayar
            $kategoris = $p->product->biayaKategoris;
            if (!$kategoris || $kategoris->isEmpty()) {
                // Fallback ke produk tanpa kategori
                $this->processWithoutCategory($p, $today, $waService, $sent, $skipped);
                continue;
            }

            foreach ($kategoris as $k) {
                $katId = $k->id;
                if (!in_array($katId, $activeKategoriIds)) continue;

                $setting = $reminderSettings[$katId];

                // Cek apakah kategori ini sudah dibayar
                $isPaid = $this->isKategoriPaid($p, $k);
                if ($isPaid) continue;

                // Hitung jatuh tempo berdasarkan tanggal persetujuan admin
                $baseDate = $p->tanggal_persetujuan ?? $p->created_at;
                $jatuhTempo = $baseDate->addDays($setting->jatuh_tempo_hari)->startOfDay();
                $hariTersisa = (int) $today->diffInDays($jatuhTempo, false);

                // Gunakan shouldRemind dari setting
                if (!$setting->shouldRemind($hariTersisa)) continue;

                // Cek apakah sudah pernah dikirim hari ini untuk kategori ini
                $tipe = $hariTersisa <= 0
                    ? "reminder_overdue_k{$katId}"
                    : "reminder_h{$hariTersisa}_k{$katId}";
                $alreadySentToday = WaNotification::where('pendaftar_id', $p->id)
                    ->where('type', $tipe)
                    ->whereDate('created_at', $today)
                    ->exists();

                if ($alreadySentToday) {
                    $skipped++;
                    continue;
                }

                // Kirim reminder
                $labelHari = $this->getLabelHari($hariTersisa);
                $kategoriNama = $k->nama;
                $noInvoice = 'INV/' . str_pad($p->id, 5, '0', STR_PAD_LEFT) . '/' . $p->created_at->format('Ym');

                // Gunakan template custom jika ada
                $customMessage = $setting->generateMessage(
                    $p->nama,
                    $kategoriNama,
                    'Rp ' . number_format((int) $k->pivot->harga, 0, ',', '.'),
                    $hariTersisa,
                    $noInvoice
                );

                if ($customMessage) {
                    $sent++;
                } else {
                    $this->info("Kirim reminder ke {$p->nama} kategori {$kategoriNama} ({$labelHari})");
                    $sent++;
                }
            }
        }

        $this->info("Selesai. Terkirim: {$sent}, Dilewati: {$skipped}");
        return 0;
    }

    /**
     * Cek apakah kategori sudah dibayar lunas
     */
    private function isKategoriPaid($pendaftar, $kategori): bool
    {
        $payments = $pendaftar->categoryPayments ?? collect();
        $categoryPayment = $payments->firstWhere('kategori_id', $kategori->id);

        if (!$categoryPayment) return false;

        $harga = (int) $kategori->pivot->harga;
        $dibayar = (float) ($categoryPayment->nominal ?? 0);

        return $dibayar >= $harga;
    }

    /**
     * Proses pendaftar tanpa kategori (fallback)
     */
    private function processWithoutCategory($p, $today, $waService, &$sent, &$skipped)
    {
        // Gunakan default 30 hari
        $baseDate = $p->tanggal_persetujuan ?? $p->created_at;
        $jatuhTempo = $baseDate->addDays(30)->startOfDay();
        $hariTersisa = (int) $today->diffInDays($jatuhTempo, false);

        $reminderDays = [7, 3, 1, 0];
        if (!in_array($hariTersisa, $reminderDays)) {
            $skipped++;
            return;
        }

        $tipe = $hariTersisa <= 0 ? 'reminder_overdue' : "reminder_h{$hariTersisa}";
        $alreadySentToday = WaNotification::where('pendaftar_id', $p->id)
            ->where('type', $tipe)
            ->whereDate('created_at', $today)
            ->exists();

        if ($alreadySentToday) {
            $skipped++;
            return;
        }

        $this->info("Kirim reminder ke {$p->nama} (H-{$hariTersisa}) [tanpa kategori]");
        $waService->sendPaymentReminder($p, max(0, $hariTersisa));
        $sent++;
    }

    /**
     * Label hari yang mudah dibaca
     */
    private function getLabelHari($hariTersisa): string
    {
        return match(true) {
            $hariTersisa <= 0 => 'sudah jatuh tempo',
            $hariTersisa == 1 => 'besok',
            default => "dalam {$hariTersisa} hari",
        };
    }
}
