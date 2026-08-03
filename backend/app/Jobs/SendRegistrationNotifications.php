<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

/**
 * Kirim notifikasi pendaftaran (WA + email) SETELAH response dikirim ke client
 * agar halaman daftar-program tampil cepat tanpa menunggu proses pengiriman.
 *
 * Dipanggil via SendRegistrationNotifications::dispatch($pendaftarId)->afterResponse()
 * sehingga berjalan synchronous tanpa memerlukan queue worker.
 */
class SendRegistrationNotifications
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $pendaftarId;

    public $affiliate;

    public function __construct($pendaftarId, $affiliate = false)
    {
        $this->pendaftarId = $pendaftarId;
        $this->affiliate = $affiliate;
    }

    public function handle()
    {
        try {
            $pendaftar = \App\Models\Pendaftar::with('product.batch', 'batch')->find($this->pendaftarId);
            if (!$pendaftar) {
                return;
            }

            $nama = $pendaftar->nama;
            $email = $pendaftar->email;
            $telepon = $pendaftar->telepon;
            $product = $pendaftar->product;
            $nominal = (float) ($pendaftar->nominal ?? 0);
            $noReg = $pendaftar->no_registrasi ?? '-';
            $noInvoice = 'INV/' . str_pad($pendaftar->id, 5, '0', STR_PAD_LEFT) . '/' . $pendaftar->created_at->format('Ym');
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

            $paymentItem = \App\Models\PembayaranItem::where('pendaftar_id', $pendaftar->id)->orderBy('id')->first();
            $kodeUnik = $paymentItem?->kode_unik ?? 0;
            $totalTransfer = $paymentItem?->total_transfer ?? $nominal;
            $paymentCode = $paymentItem?->payment_code
                ?? 'PAY/' . str_pad($pendaftar->id, 5, '0', STR_PAD_LEFT) . '/' . $pendaftar->created_at->format('Ym');

            // Kirim WA notifikasi pendaftaran sukses
            try {
                $waService = new \App\Services\WhatsAppService();
                $waService->sendRegistrationSuccessNotification($pendaftar->fresh()->load('product'));
            } catch (\Exception $e) {
                Log::error('Gagal kirim WA notifikasi daftar: ' . $e->getMessage());
            }

            // Kirim email selamat datang ke kandidat
            try {
                if ($email) {
                    $company = \App\Models\CompanyProfile::getProfile();
                    $jatuhTempo = now()->addDays(1);
                    $templateVars = [
                        'nama' => $nama,
                        'program' => $product->nama ?? '-',
                        'batch' => $pendaftar->batch?->nama_batch ?? ($product->batch?->nama_batch ?? '-'),
                        'no_registrasi' => $noReg,
                        'no_invoice' => $noInvoice,
                        'tanggal_daftar' => now()->format('d F Y'),
                        'total' => number_format($nominal, 0, ',', '.'),
                        'total_transfer' => number_format($totalTransfer, 0, ',', '.'),
                        'kode_unik' => (string) $kodeUnik,
                        'payment_code' => $paymentCode,
                        'jatuh_tempo' => $jatuhTempo->format('l, d F Y') . ' pukul ' . $jatuhTempo->format('H:i') . ' WIB',
                        'company_name' => $company->company_name ?? 'MENDUNIA.ID',
                        'bank_nama' => $company->bank_nama ?? '-',
                        'bank_rekening' => $company->bank_nomor_rekening ?? '-',
                        'bank_pemilik' => $company->bank_pemilik ?? '-',
                        'konfirmasi_url' => $frontendUrl . '/checkout-berhasil/' . $pendaftar->token,
                        'invoice_url' => $frontendUrl . '/pendaftar/' . $pendaftar->id . '/invoice',
                    ];
                    $rendered = \App\Models\NotificationTemplate::render('welcome_email', $templateVars);
                    if ($rendered) {
                        Mail::send('emails.registration-welcome', [
                            'company' => $company,
                            'nama' => $nama,
                            'totalTransfer' => $totalTransfer,
                            'paymentCode' => $paymentCode,
                            'jatuhTempo' => $jatuhTempo->format('l, d F Y'),
                            'jatuhTempoWaktu' => $jatuhTempo->format('H:i') . ' WIB',
                            'konfirmasiUrl' => $frontendUrl . '/checkout-berhasil/' . $pendaftar->token,
                            'invoiceUrl' => $frontendUrl . '/pendaftar/' . $pendaftar->id . '/invoice',
                            'bodyContent' => $rendered['body'],
                        ], function ($message) use ($email, $rendered, $nama) {
                            $message->to($email)
                                ->subject($rendered['subject'] ?? '[SIM Mendunia] Pendaftaran Berhasil - ' . $nama)
                                ->from(config('mail.from.address'), config('mail.from.name'));
                        });
                    }
                }
            } catch (\Exception $e) {
                Log::error('Gagal kirim email selamat datang daftar: ' . $e->getMessage());
            }

            // Kirim email notifikasi ke admin
            try {
                $adminEmails = \App\Models\NotificationSetting::getValue('email_pembayaran_admin_addresses');
                if ($adminEmails) {
                    $batchNama = $pendaftar->batch?->nama_batch ?? ($product->batch?->nama_batch ?? '-');
                    $programNama = $product->nama ?? '-';
                    $labelAffiliate = $this->affiliate ? ' (Affiliate)' : '';
                    $subjek = '[SIM Mendunia] Pendaftar Baru' . $labelAffiliate . ' - ' . $nama;
                    $emails = array_map('trim', explode(',', $adminEmails));
                    foreach ($emails as $adminEmail) {
                        if (filter_var($adminEmail, FILTER_VALIDATE_EMAIL)) {
                            Mail::raw(
                                "📋 *NOTIFIKASI PENDAFTARAN BARU" . $labelAffiliate . "*\n\n"
                                . "Halo Admin,\n\n"
                                . "Ada pendaftar baru" . ($this->affiliate ? ' melalui link affiliate' : '') . " di sistem SIM Mendunia.\n\n"
                                . "Nama: {$nama}\n"
                                . "Email: {$email}\n"
                                . "No. WhatsApp: {$telepon}\n"
                                . "Program: {$programNama}\n"
                                . "Batch: {$batchNama}\n"
                                . "No. Registrasi: {$noReg}\n"
                                . "Waktu: " . now()->format('d F Y H:i') . "\n\n"
                                . "Silakan login ke panel admin untuk memproses pendaftaran ini.\n\n"
                                . "- Sistem SIM Mendunia",
                                function ($message) use ($adminEmail, $subjek) {
                                    $message->to($adminEmail)
                                        ->subject($subjek)
                                        ->from(config('mail.from.address'), config('mail.from.name'));
                                }
                            );
                        }
                    }
                }
            } catch (\Exception $e) {
                Log::error('Gagal kirim email notifikasi admin daftar: ' . $e->getMessage());
            }
        } catch (\Exception $e) {
            Log::error('Gagal menjalankan SendRegistrationNotifications: ' . $e->getMessage());
        }
    }
}
