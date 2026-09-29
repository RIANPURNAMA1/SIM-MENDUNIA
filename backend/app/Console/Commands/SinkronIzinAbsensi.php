<?php

namespace App\Console\Commands;

use App\Models\Izin;
use App\Services\IzinApprovalService;
use Illuminate\Console\Command;

class SinkronIzinAbsensi extends Command
{
    protected $signature = 'izin:sinkron-absensi
        {--status=APPROVED : Hanya sinkronkan pengajuan dengan status ini (kosongkan untuk semua)}
        {--user= : Batasi ke satu user_id}';

    protected $description = 'Terapkan pengajuan izin/cuti yang disetujui ke tabel absensis (memperbaiki status yang masih ALPA)';

    public function handle(): int
    {
        $q = Izin::with('user')->orderBy('tgl_mulai');

        if (($status = trim((string) $this->option('status'))) !== '') {
            $q->where('status', $status);
        }
        if ($userId = $this->option('user')) {
            $q->where('user_id', (int) $userId);
        }

        $totalDibuat = $totalDiperbarui = 0;
        $jumlah = 0;

        foreach ($q->get() as $izin) {
            if (!$izin->user) {
                $this->warn("Izin #{$izin->id}: user #{$izin->user_id} tidak ditemukan, dilewati.");
                continue;
            }

            $hasil = IzinApprovalService::applyToAbsensi(
                $izin->user,
                (int) $izin->id,
                (string) $izin->jenis_izin,
                (string) ($izin->alasan ?? ''),
                (string) $izin->tgl_mulai,
                (string) $izin->tgl_selesai
            );

            $jumlah++;
            $totalDibuat += $hasil['dibuat'];
            $totalDiperbarui += $hasil['diperbarui'];

            $this->line(sprintf(
                '  izin #%-4d %-6s %s..%s  dibuat=%d diperbarui=%d',
                $izin->id,
                $izin->jenis_izin,
                $izin->tgl_mulai,
                $izin->tgl_selesai,
                $hasil['dibuat'],
                $hasil['diperbarui']
            ));
        }

        $this->info("Selesai. {$jumlah} pengajuan diproses — {$totalDibuat} baris absensi dibuat, {$totalDiperbarui} diperbarui (ALPA → IZIN).");

        return self::SUCCESS;
    }
}
