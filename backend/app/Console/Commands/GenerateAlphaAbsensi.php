<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Absensi;
use App\Models\HariLibur;
use App\Services\WhatsAppService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class GenerateAlphaAbsensi extends Command
{
    protected $signature = 'absensi:generate-alpha';
    protected $description = 'Otomatis set status ALPA atau LIBUR bagi karyawan di akhir hari';

    public function handle()
    {
        // Gunakan timezone Jakarta
        $today = Carbon::today('Asia/Jakarta');
        $now = Carbon::now('Asia/Jakarta');
        $whatsapp = new WhatsAppService();
        
        // 1. Cek apakah hari ini Libur
        $isLibur = HariLibur::apakahLibur($today->toDateString());

        // Ambil karyawan aktif
        $users = User::where('role', 'KARYAWAN')
            ->where('status', 'AKTIF')
            ->where(function ($q) {
                $q->whereNotNull('shift_id')->orWhereNotNull('shift_ids');
            })
            ->whereNotNull('no_hp')
            ->get();

        foreach ($users as $user) {
            // Kumpulkan semua shift user
            $userShifts = $user->shifts;
            if ($userShifts->isEmpty() && $user->shift) {
                $userShifts = collect([$user->shift]);
            }

            foreach ($userShifts as $shift) {
                if (!$shift) continue;

                // 2. CEK APAKAH SUDAH ADA RECORD ABSENSI UNTUK SHIFT INI
                $absensi = Absensi::where('user_id', $user->id)
                    ->whereDate('tanggal', $today)
                    ->where('shift_id', $shift->id)
                    ->first();

                // JIKA SUDAH ADA DATA
                if ($absensi) {
                    // Jika dia sudah masuk tapi lupa absen pulang sampai akhir hari
                    if ($absensi->jam_masuk && !$absensi->jam_keluar && !$isLibur) {
                        $absensi->update([
                            'status' => 'TIDAK ABSEN PULANG',
                            'keterangan' => 'Sistem otomatis: Lupa absen pulang.'
                        ]);

                        // Kirim notifikasi TIDAK ABSEN PULANG
                        $whatsapp->sendAbsensiNotification($user, 'TIDAK ABSEN PULANG', $absensi);
                        $this->info("Notif TIDAK ABSEN PULANG: {$user->name} - {$shift->nama_shift}");
                    }
                    continue; // Lanjut ke shift berikutnya
                }

                // JIKA BELUM ADA DATA SAMA SEKALI
                if ($now->hour >= 20 || $isLibur) {
                    $status = $isLibur ? 'LIBUR' : 'ALPA';
                    $keterangan = $isLibur 
                        ? 'Libur otomatis (Weekend/Nasional)' 
                        : 'Tidak melakukan absensi seharian';

                    $absensi = Absensi::create([
                        'user_id'   => $user->id,
                        'shift_id'  => $shift->id,
                        'cabang_id' => $user->cabang_id ?? ($user->cabang_ids[0] ?? null),
                        'tanggal'   => $today,
                        'status'    => $status,
                        'keterangan' => $keterangan
                    ]);

                    // Kirim notifikasi ALPA
                    if (!$isLibur) {
                        $whatsapp->sendAbsensiNotification($user, 'ALPA', $absensi);
                        $this->info("Notif ALPA: {$user->name} - {$shift->nama_shift}");
                    }
                }
            }
        }

        $this->info('Generate status harian selesai.');
    }
}