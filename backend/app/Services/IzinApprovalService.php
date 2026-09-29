<?php

namespace App\Services;

use App\Models\Absensi;
use App\Models\HariLibur;
use App\Models\Shift;
use App\Models\User;
use Carbon\Carbon;

class IzinApprovalService
{
    /**
     * Map jenis pengajuan → status baris absensi.
     * Enum absensis hanya punya IZIN (belum ada SAKIT/CUTI), jadi
     * SAKIT & CUTI dipetakan ke IZIN dengan keterangan yang berbeda.
     */
    public const STATUS_MAP = [
        'IZIN'  => 'IZIN',
        'SAKIT' => 'IZIN',
        'CUTI'  => 'IZIN',
    ];

    /**
     * Terapkan pengajuan izin/cuti yang berstatus APPROVED ke tabel absensis.
     *
     * Dipakai:
     *  - saat pengajuan disetujui (IzinController, webhook WA, AI chat)
     *  - saat GenerateAlpha membuat baris baru (agar izin yang disetujui
     *    SEBELUMNIYA tidak ditimpa jadi ALPA)
     *  - untuk backfill manual via `php artisan izin:sinkron-absensi`
     *
     * Sifatnya idempotent: baris yang sudah ada di-update (bukan
     * firstOrCreate yang diam-diam leaving existing row), sehingga ALPA
     * yang terlanjur dibuat cron sebelum pengajuan disetujui ikut berubah.
     *
     * @return array{hari: int, dibuat: int, diperbarui: int}
     */
    public static function applyToAbsensi(User $user, int $izinId, string $jenisIzin, string $alasan, string $tglMulai, string $tglSelesai): array
    {
        $status = self::STATUS_MAP[strtoupper($jenisIzin)] ?? 'IZIN';
        $label  = strtoupper($jenisIzin);
        $keterangan = $label . ($alasan ? ': ' . $alasan : '');

        $start = Carbon::parse($tglMulai)->startOfDay();
        $end   = Carbon::parse($tglSelesai)->startOfDay();

        $shifts = self::shiftsFor($user);
        $result = ['hari' => 0, 'dibuat' => 0, 'diperbarui' => 0];

        for ($date = $start->copy(); $date->lte($end); $date->addDay()) {
            $result['hari']++;

            // Jangan menimpa hari libur dengan IZIN — hari libur sudah
            //handled sendiri oleh GenerateAlpha dengan status LIBUR.
            if (HariLibur::apakahLibur($date->toDateString())) {
                continue;
            }

            $shift = self::pickShiftFor($shifts, $date);

            // Tanpa shift (user belum punya shift) tetap catat agar tidak ALPA.
            $existing = Absensi::where('user_id', $user->id)
                ->whereDate('tanggal', $date->toDateString())
                ->where(function ($q) use ($shift) {
                    $q->whereNull('shift_id');
                    if ($shift) {
                        $q->orWhere('shift_id', $shift->id);
                    }
                })
                // Baris yang punya shift_id dianggap lebih "nyata"
                // daripada baris cadangan (shift_id NULL).
                ->orderByDesc(\Illuminate\Support\Facades\DB::raw('(absensis.shift_id IS NOT NULL)'))
                ->first();

            $values = [
                'izin_id'     => $izinId,
                'cabang_id'   => $user->cabang_id ?? null,
                'status'      => $status,
                'keterangan'  => $keterangan,
                'jam_masuk'   => null,
                'jam_keluar'  => null,
                'lat_masuk'   => null,
                'long_masuk'  => null,
                'lat_pulang'  => null,
                'long_pulang' => null,
            ];

            if ($shift) {
                $values['shift_id'] = $shift->id;
            }

            if ($existing) {
                // Jangan timpa absensi riil (HADIR / TERLAMBAT / PULANG LEBIH AWAL).
                if (in_array($existing->status, ['HADIR', 'TERLAMBAT', 'PULANG LEBIH AWAL'], true)) {
                    Absensi::where('id', $existing->id)->update(['izin_id' => $izinId]);
                    continue;
                }

                $existing->fill($values)->save();
                $result['diperbarui']++;
                continue;
            }

            Absensi::create(array_merge($values, [
                'user_id' => $user->id,
                'tanggal' => $date->toDateString(),
            ]));
            $result['dibuat']++;
        }

        return $result;
    }

    /**
     * Entry point lama — mempertahankansignature supaya tidak breaking.
     *
     * @param \App\Models\Izin $izin
     */
    public static function generateAbsensi($izin)
    {
        $user = $izin->user ?: User::find($izin->user_id);
        if (!$user) {
            return ['hari' => 0, 'dibuat' => 0, 'diperbarui' => 0];
        }

        return self::applyToAbsensi(
            $user,
            (int) $izin->id,
            (string) $izin->jenis_izin,
            (string) ($izin->alasan ?? ''),
            Carbon::parse($izin->tgl_mulai)->toDateString(),
            Carbon::parse($izin->tgl_selesai)->toDateString()
        );
    }

    /** @return \Illuminate\Support\Collection<int, Shift> */
    private static function shiftsFor(User $user)
    {
        $shifts = collect();

        $ids = $user->shift_ids;
        if (is_string($ids)) {
            $ids = json_decode($ids, true);
        }
        if (is_array($ids) && $ids !== []) {
            $shifts = $shifts->merge(Shift::whereIn('id', $ids)->get());
        }

        if ($shifts->isEmpty() && $user->shift_id) {
            $shift = Shift::find($user->shift_id);
            if ($shift) {
                $shifts = $shifts->merge([$shift]);
            }
        }

        return $shifts->unique('id')->values();
    }

    /** Pilih shift pertama yang aktif di tanggal tersebut (dari nama/label hari bila ada). */
    private static function pickShiftFor($shifts, Carbon $date)
    {
        if ($shifts->isEmpty()) {
            return null;
        }

        if ($shifts->count() === 1) {
            return $shifts->first();
        }

        $namaHari = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
        $needle = $namaHari[$date->dayOfWeekIso - 1] ?? null;

        if ($needle !== null) {
            $match = $shifts->first(function ($s) use ($needle) {
                $teks = strtolower((string) ($s->nama_shift ?? $s->name ?? ''));
                return $needle !== '' && str_contains($teks, $needle);
            });

            if ($match) {
                return $match;
            }
        }

        return $shifts->first();
    }
}
