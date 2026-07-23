<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BatchKategoriDeadline extends Model
{
    protected $fillable = [
        'batch_id',
        'kategori_id',
        'tanggal_awal',
        'tanggal_akhir',
        'reminder_days',
        'is_enabled',
        'template_pesan',
        'channel',
        'template_email',
        'subject_email',
    ];

    protected $casts = [
        'tanggal_awal' => 'date',
        'tanggal_akhir' => 'date',
        'reminder_days' => 'array',
        'is_enabled' => 'boolean',
    ];

    public function batch()
    {
        return $this->belongsTo(Batch::class);
    }

    public function kategori()
    {
        return $this->belongsTo(BiayaKategori::class, 'kategori_id');
    }

    /**
     * Check if reminder should fire today based on days before deadline.
     */
    public function shouldRemind(int $hariTersisa): bool
    {
        return in_array($hariTersisa, $this->reminder_days ?? [7, 3, 1]);
    }

    /**
     * Generate message from template.
     */
    public function generateMessage(array $vars): string
    {
        $template = $this->template_pesan;
        if (empty($template)) {
            $template = "Hai {nama}, ini pengingat untuk pembayaran *{kategori}* sebesar *{jumlah}*. Sisa waktu: *{hari} hari*. Link: {link}";
        }

        foreach ($vars as $key => $value) {
            $template = str_replace('{' . $key . '}', $value, $template);
        }

        return $template;
    }
}
