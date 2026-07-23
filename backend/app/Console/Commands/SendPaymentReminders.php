<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Pendaftar;
use App\Models\WaNotification;
use App\Models\EmailNotification;
use App\Models\WaReminderSetting;
use App\Models\NotificationSetting;
use App\Models\BatchKategoriDeadline;
use App\Services\WhatsAppService;
use App\Services\EmailService;

class SendPaymentReminders extends Command
{
    protected $signature = 'app:reminder-pembayaran';
    protected $description = 'Kirim pengingat pembayaran via WhatsApp & Email berdasarkan pengaturan dinamis per kategori';

    public function handle()
    {
        $globalSetting = NotificationSetting::where('key', 'wa_reminder_pembayaran')->first();
        if ($globalSetting && !$globalSetting->is_enabled) {
            $this->info('Fitur pengingat pembayaran dinonaktifkan.');
            return 0;
        }

        $waService = new WhatsAppService();
        $emailService = new EmailService();
        $today = now()->startOfDay();
        $sentWa = 0;
        $sentEmail = 0;
        $skipped = 0;

        $reminderSettings = WaReminderSetting::where('is_enabled', true)
            ->get()
            ->keyBy('kategori_id');

        if ($reminderSettings->isEmpty()) {
            $this->info('Tidak ada pengaturan reminder yang aktif.');
            return 0;
        }

        $activeKategoriIds = $reminderSettings->pluck('kategori_id')->toArray();

        // Get email notification toggle
        $emailEnabled = NotificationSetting::isEnabled('email_reminder_pembayaran');

        $pendaftars = Pendaftar::with(['product.biayaKategoris', 'user', 'categoryPayments'])
            ->where('status_pendaftaran', 'disetujui')
            ->where('status_pembayaran', '!=', 'verified')
            ->get(); // removed whereNotNull('telepon') to allow email-only pendaftars

        // Pre-load batch deadlines
        $batchIdSet = $pendaftars->pluck('batch_id')->filter()->unique();
        $allBatchDeadlines = BatchKategoriDeadline::where('is_enabled', true)
            ->whereIn('batch_id', $batchIdSet)
            ->get()
            ->groupBy('batch_id')
            ->map(fn($items) => $items->keyBy('kategori_id'));

        foreach ($pendaftars as $p) {
            if (!$p->product) {
                $skipped++;
                continue;
            }

            $kategoris = $p->product->biayaKategoris;
            if (!$kategoris || $kategoris->isEmpty()) {
                $this->processWithoutCategory($p, $today, $waService, $emailService, $sentWa, $sentEmail, $skipped, $emailEnabled);
                continue;
            }

            foreach ($kategoris as $k) {
                $katId = $k->id;
                if (!in_array($katId, $activeKategoriIds)) continue;

                $isPaid = $this->isKategoriPaid($p, $k);
                if ($isPaid) continue;

                // Resolve deadline + channel
                $jatuhTempo = null;
                $reminderDays = null;
                $channel = 'wa';
                $templateEmail = null;
                $subjectEmail = null;

                if ($p->batch_id && isset($allBatchDeadlines[$p->batch_id][$katId])) {
                    $batchDl = $allBatchDeadlines[$p->batch_id][$katId];
                    if ($batchDl->tanggal_akhir) {
                        $jatuhTempo = $batchDl->tanggal_akhir->copy()->startOfDay();
                        $reminderDays = $batchDl->reminder_days ?? [7, 3, 1];
                        $channel = $batchDl->channel ?? 'wa';
                        $templateEmail = $batchDl->template_email;
                        $subjectEmail = $batchDl->subject_email;
                    }
                }

                if (!$jatuhTempo) {
                    $setting = $reminderSettings[$katId] ?? null;
                    if (!$setting) continue;
                    $baseDate = ($p->tanggal_persetujuan ?? $p->created_at)->copy();
                    $jatuhTempo = $baseDate->addDays($setting->jatuh_tempo_hari)->startOfDay();
                    $reminderDays = $setting->reminder_days ?? [7, 3, 1];
                }

                $hariTersisa = (int) $today->diffInDays($jatuhTempo, false);

                if (!in_array($hariTersisa, $reminderDays)) continue;

                $kategoriNama = $k->nama;
                $jumlah = 'Rp ' . number_format((int) $k->pivot->harga, 0, ',', '.');
                $noInvoice = 'INV/' . str_pad($p->id, 5, '0', STR_PAD_LEFT) . '/' . $p->created_at->format('Ym');

                // Send via selected channel
                if (in_array($channel, ['wa', 'both']) && $p->telepon) {
                    $tipe = $hariTersisa <= 0 ? "reminder_overdue_k{$katId}" : "reminder_h{$hariTersisa}_k{$katId}";
                    $alreadySent = WaNotification::where('pendaftar_id', $p->id)
                        ->where('type', $tipe)
                        ->whereDate('created_at', $today)
                        ->exists();

                    if (!$alreadySent) {
                        $setting = $reminderSettings[$katId] ?? null;
                        $customMessage = $setting?->generateMessage($p->nama, $kategoriNama, $jumlah, $hariTersisa, $noInvoice);
                        $waService->sendPaymentReminder($p, max(0, $hariTersisa));
                        $sentWa++;
                        $this->info("WA: {$p->nama} - {$kategoriNama} (H-{$hariTersisa})");
                    }
                }

                if (in_array($channel, ['email', 'both']) && $emailEnabled && $p->email) {
                    $tipeEmail = $hariTersisa <= 0 ? "reminder_overdue_k{$katId}_email" : "reminder_h{$hariTersisa}_k{$katId}_email";
                    $alreadySentEmail = EmailNotification::where('pendaftar_id', $p->id)
                        ->where('type', $tipeEmail)
                        ->whereDate('created_at', $today)
                        ->exists();

                    if (!$alreadySentEmail) {
                        $emailService->sendPaymentReminder($p, $kategoriNama, $jumlah, max(0, $hariTersisa), $noInvoice, $subjectEmail, $templateEmail);
                        $sentEmail++;
                        $this->info("Email: {$p->nama} - {$kategoriNama} (H-{$hariTersisa})");
                    }
                }
            }
        }

        $this->info("Selesai. WA: {$sentWa}, Email: {$sentEmail}, Dilewati: {$skipped}");
        return 0;
    }

    private function isKategoriPaid($pendaftar, $kategori): bool
    {
        $payments = $pendaftar->categoryPayments ?? collect();
        $categoryPayment = $payments->firstWhere('kategori_id', $kategori->id);

        if (!$categoryPayment) return false;

        $harga = (int) $kategori->pivot->harga;
        $dibayar = (float) ($categoryPayment->nominal ?? 0);

        return $dibayar >= $harga;
    }

    private function processWithoutCategory($p, $today, $waService, $emailService, &$sentWa, &$sentEmail, &$skipped, $emailEnabled)
    {
        $baseDate = ($p->tanggal_persetujuan ?? $p->created_at)->copy();
        $jatuhTempo = $baseDate->addDays(30)->startOfDay();
        $hariTersisa = (int) $today->diffInDays($jatuhTempo, false);

        $reminderDays = [7, 3, 1, 0];
        if (!in_array($hariTersisa, $reminderDays)) {
            $skipped++;
            return;
        }

        // WA
        if ($p->telepon) {
            $tipe = $hariTersisa <= 0 ? 'reminder_overdue' : "reminder_h{$hariTersisa}";
            $alreadySentToday = WaNotification::where('pendaftar_id', $p->id)
                ->where('type', $tipe)
                ->whereDate('created_at', $today)
                ->exists();

            if (!$alreadySentToday) {
                $waService->sendPaymentReminder($p, max(0, $hariTersisa));
                $sentWa++;
            }
        }

        // Email
        if ($emailEnabled && $p->email) {
            $tipeEmail = ($hariTersisa <= 0 ? 'reminder_overdue' : "reminder_h{$hariTersisa}") . '_email';
            $alreadySentEmail = EmailNotification::where('pendaftar_id', $p->id)
                ->where('type', $tipeEmail)
                ->whereDate('created_at', $today)
                ->exists();

            if (!$alreadySentEmail) {
                $emailService->sendPaymentReminder($p, 'Tagihan', 'Rp 0', max(0, $hariTersisa), 'INV/' . str_pad($p->id, 5, '0', STR_PAD_LEFT) . '/' . $p->created_at->format('Ym'));
                $sentEmail++;
            }
        }
    }
}
