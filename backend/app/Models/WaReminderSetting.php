<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WaReminderSetting extends Model
{
    protected $fillable = [
        'kategori_id',
        'jatuh_tempo_hari',
        'reminder_days',
        'is_enabled',
        'template_pesan',
    ];

    protected $casts = [
        'reminder_days' => 'array',
        'is_enabled' => 'boolean',
    ];

    public function kategori()
    {
        return $this->belongsTo(BiayaKategori::class, 'kategori_id');
    }

    /**
     * Cek apakah reminder aktif untuk kategori ini
     */
    public function shouldRemind($hariTersisa): bool
    {
        if (!$this->is_enabled) return false;
        $days = $this->reminder_days ?? [7, 3, 1];
        return in_array($hariTersisa, $days);
    }

    /**
     * Generate pesan reminder dengan template custom
     */
    public function generateMessage($nama, $kategoriNama, $jumlahFormat, $hariTersisa, $linkInvoice = ''): string
    {
        $template = $this->template_pesan;

        if ($template && str_contains($template, '{nama}')) {
            $labelHari = match(true) {
                $hariTersisa <= 0 => 'sudah jatuh tempo',
                $hariTersisa <= 1 => 'besok',
                default => "dalam {$hariTersisa} hari",
            };
            return str_replace(
                ['{nama}', '{kategori}', '{jumlah}', '{hari}', '{link}'],
                [$nama, $kategoriNama, $jumlahFormat, $labelHari, $linkInvoice],
                $template
            );
        }

        return null; // fallback ke default
    }
}
