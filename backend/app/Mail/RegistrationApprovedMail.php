<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RegistrationApprovedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $nama,
        public string $program,
        public string $noRegistrasi,
        public string $noInvoice,
        public $company,
        public ?string $customSubject = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->customSubject ?: 'Pendaftaran Disetujui',
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlView: 'emails.registration-approved',
        );
    }
}
