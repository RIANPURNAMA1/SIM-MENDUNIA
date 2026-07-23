<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $nama,
        public string $status,
        public string $keterangan,
        public $company,
        public ?string $subject = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subject ?: 'Notifikasi Pembayaran',
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlView: 'emails.payment-status',
        );
    }
}
