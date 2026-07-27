<?php

namespace App\Services;

use App\Models\EmailNotification;
use App\Models\Pendaftar;
use App\Models\CompanyProfile;
use Illuminate\Support\Facades\Mail;
use App\Mail\PaymentReminderMail;
use App\Mail\PaymentStatusMail;
use App\Mail\RegistrationApprovedMail;
use App\Mail\NewBillMail;

class EmailService
{
    /**
     * Send payment reminder email.
     */
    public function sendPaymentReminder(Pendaftar $pendaftar, string $kategoriNama, string $jumlah, int $hariTersisa, string $noInvoice, ?string $customSubject = null, ?string $customTemplate = null): bool
    {
        $email = $pendaftar->email;
        if (empty($email)) {
            $this->log($pendaftar->id, 'reminder_no_email', '', '', false, 'Pendaftar tidak memiliki email');
            return false;
        }

        $company = CompanyProfile::getProfile();
        $subject = $customSubject ?: "Pengingat Pembayaran - {$kategoriNama}";
        $link = url("/pendaftar/{$pendaftar->id}/invoice");

        $labelHari = match(true) {
            $hariTersisa <= 0 => 'sudah jatuh tempo',
            $hariTersisa == 1 => 'besok',
            default => "dalam {$hariTersisa} hari",
        };

        try {
            Mail::to($email)->send(new PaymentReminderMail(
                nama: $pendaftar->nama,
                kategori: $kategoriNama,
                jumlah: $jumlah,
                hariTersisa: $labelHari,
                link: $link,
                company: $company,
                customTemplate: $customTemplate,
                subject: $subject,
            ));

            $this->log($pendaftar->id, "reminder_h{$hariTersisa}_email", $email, $subject, true);
            return true;
        } catch (\Exception $e) {
            $this->log($pendaftar->id, "reminder_h{$hariTersisa}_email", $email, $subject, false, $e->getMessage());
            return false;
        }
    }

    /**
     * Send payment status notification email.
     */
    public function sendPaymentStatus(Pendaftar $pendaftar, string $status, string $keterangan): bool
    {
        $email = $pendaftar->email;
        if (empty($email)) {
            $this->log($pendaftar->id, "payment_{$status}_no_email", '', '', false, 'Pendaftar tidak memiliki email');
            return false;
        }

        $company = CompanyProfile::getProfile();
        $subject = match($status) {
            'success' => 'Pembayaran Berhasil Diverifikasi',
            'rejected' => 'Pembayaran Ditolak',
            'partial' => 'Pembayaran Cicilan Diterima',
            'full_payment' => 'Pembayaran Lunas',
            'new_bill' => 'Tagihan Baru',
            default => 'Notifikasi Pembayaran',
        };

        try {
            Mail::to($email)->send(new PaymentStatusMail(
                nama: $pendaftar->nama,
                status: $status,
                keterangan: $keterangan,
                company: $company,
                subject: $subject,
            ));

            $this->log($pendaftar->id, "payment_{$status}_email", $email, $subject, true);
            return true;
        } catch (\Exception $e) {
            $this->log($pendaftar->id, "payment_{$status}_email", $email, $subject, false, $e->getMessage());
            return false;
        }
    }

    /**
     * Send registration approved notification email.
     */
    public function sendRegistrationApproved(Pendaftar $pendaftar): bool
    {
        $email = $pendaftar->email;
        if (empty($email)) {
            $this->log($pendaftar->id, 'approved_no_email', '', '', false, 'Pendaftar tidak memiliki email');
            return false;
        }

        $company = CompanyProfile::getProfile();
        $noInvoice = 'INV/' . str_pad($pendaftar->id, 5, '0', STR_PAD_LEFT) . '/' . $pendaftar->created_at->format('Ym');
        $subject = 'Pendaftaran Disetujui - ' . ($pendaftar->product?->nama ?? 'Program');

        try {
            Mail::to($email)->send(new RegistrationApprovedMail(
                nama: $pendaftar->nama,
                program: $pendaftar->product?->nama ?? '-',
                noRegistrasi: $pendaftar->no_registrasi ?? '-',
                noInvoice: $noInvoice,
                company: $company,
                customSubject: $subject,
            ));

            $this->log($pendaftar->id, 'approved_email', $email, $subject, true);
            return true;
        } catch (\Exception $e) {
            $this->log($pendaftar->id, 'approved_email', $email, $subject, false, $e->getMessage());
            return false;
        }
    }

    /**
     * Send new bill notification email.
     */
    public function sendNewBill(Pendaftar $pendaftar): bool
    {
        $email = $pendaftar->email;
        if (empty($email)) {
            $this->log($pendaftar->id, 'new_bill_no_email', '', '', false, 'Pendaftar tidak memiliki email');
            return false;
        }

        $company = CompanyProfile::getProfile();
        $noInvoice = 'INV/' . str_pad($pendaftar->id, 5, '0', STR_PAD_LEFT) . '/' . $pendaftar->created_at->format('Ym');

        $totalTagihan = 0;
        $pendaftar->loadMissing('product.biayaKategoris');
        if ($pendaftar->product && $pendaftar->product->relationLoaded('biayaKategoris')) {
            $totalTagihan = $pendaftar->product->biayaKategoris->sum(fn($k) => (int) $k->pivot->harga);
        }
        $totalTagihan = $totalTagihan ?: ($pendaftar->product?->harga ?? 0);
        $totalTagihan = $totalTagihan - ($pendaftar->diskon ?? 0);
        $totalFormat = 'Rp ' . number_format($totalTagihan, 0, ',', '.');
        $linkInvoice = url("/pendaftar/{$pendaftar->id}/invoice");

        try {
            Mail::to($email)->send(new NewBillMail(
                nama: $pendaftar->nama,
                program: $pendaftar->product?->nama ?? '-',
                noRegistrasi: $pendaftar->no_registrasi ?? '-',
                noInvoice: $noInvoice,
                totalTagihan: $totalFormat,
                linkInvoice: $linkInvoice,
                company: $company,
            ));

            $this->log($pendaftar->id, 'new_bill_email', $email, 'Tagihan Baru', true);
            return true;
        } catch (\Exception $e) {
            $this->log($pendaftar->id, 'new_bill_email', $email, 'Tagihan Baru', false, $e->getMessage());
            return false;
        }
    }

    /**
     * Log email notification.
     */
    private function log(?int $pendaftarId, string $type, string $toEmail, string $subject, bool $success, ?string $error = null): void
    {
        EmailNotification::create([
            'pendaftar_id' => $pendaftarId,
            'type' => $type,
            'to_email' => $toEmail,
            'subject' => $subject,
            'message' => '',
            'success' => $success,
            'error' => $error,
        ]);
    }
}
