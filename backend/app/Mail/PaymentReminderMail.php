<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $nama,
        public string $kategori,
        public string $jumlah,
        public string $hariTersisa,
        public string $link,
        public $company,
        public ?string $customTemplate = null,
        public ?string $subject = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subject ?: 'Pengingat Pembayaran',
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlView: 'emails.payment-reminder',
        );
    }
}
