<?php

namespace App\Services;

use App\Models\PengaturanShift;
use App\Models\Shift;
use App\Models\ShiftJadwal;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class ShiftResolutionService
{
    /**
     * Daftar shift milik user pada tanggal tertentu, mengikuti mode shift yang aktif:
     * - fixed  : dari shift_ids / shift_id pada data karyawan
     * - jadwal : dari tabel shift_jadwal (per tanggal), fallback ke shift tetap
     */
    public function shiftsForUser(User $user, ?string $tanggal = null): Collection
    {
        $tanggal = $tanggal ?? Carbon::today()->toDateString();

        if (PengaturanShift::getMode() === 'fixed') {
            return $this->fixedShifts($user);
        }

        $jadwals = ShiftJadwal::where('user_id', $user->id)
            ->where('tanggal', $tanggal)
            ->with('shift')
            ->get()
            ->pluck('shift')
            ->filter()
            ->values();

        return $jadwals->isNotEmpty() ? $jadwals : $this->fixedShifts($user);
    }

    private function fixedShifts(User $user): Collection
    {
        if (is_array($user->shift_ids) && count($user->shift_ids) > 0) {
            $byId = Shift::whereIn('id', $user->shift_ids)->get()->keyBy('id');

            // Jaga urutan sesuai urutan shift_ids pada data karyawan (prioritas admin)
            $ordered = collect();
            foreach ($user->shift_ids as $id) {
                if ($byId->has($id)) {
                    $ordered->push($byId->get($id));
                }
            }

            return $ordered;
        }

        if ($user->shift) {
            return collect([$user->shift]);
        }

        return collect();
    }

    /**
     * Rentang waktu bekerja sebuah shift pada basis tanggal tertentu.
     * Shift lintas tengah malam (jam_pulang < jam_masuk) otomatis digeser ke hari berikutnya.
     *
     * @return array{0: Carbon, 1: Carbon} [start, end]
     */
    public function window(Shift $shift, CarbonInterface $basisTgl): array
    {
        $jamMasuk = Carbon::parse($shift->jam_masuk);
        $jamPulang = Carbon::parse($shift->jam_pulang);

        $start = Carbon::parse($basisTgl->toDateString().' '.$jamMasuk->format('H:i:s'));
        $end = Carbon::parse($basisTgl->toDateString().' '.$jamPulang->format('H:i:s'));

        if ($end->lte($start)) {
            $end->addDay();
        }

        return [$start, $end];
    }

    /**
     * Resolusi shift yang SEDANG AKTIF (dipakai untuk absen masuk).
     * Kandidat = jam sekarang berada dalam [jam_masuk - toleransi, jam_pulang].
     * Jika ada beberapa shift yang cocok, pilih shift yang paling baru dimulai.
     */
    public function resolveActiveShift(User $user, CarbonInterface $now, ?string $tanggal = null): ?Shift
    {
        $tanggal = $tanggal ?? Carbon::parse($now)->toDateString();
        $shifts = $this->shiftsForUser($user, $tanggal);

        if ($shifts->isEmpty()) {
            return null;
        }

        $now = Carbon::parse($now);
        $basis = Carbon::parse($tanggal);

        $kandidat = null;
        $terbaik = null;

        foreach ($shifts as $shift) {
            [$start, $end] = $this->window($shift, $basis);
            $mulaiAbsen = $start->copy()->subMinutes((int) ($shift->toleransi ?? 0));

            if ($now->between($mulaiAbsen, $end)) {
                if ($terbaik === null || $start->gt($terbaik)) {
                    $terbaik = $start;
                    $kandidat = $shift;
                }
            }
        }

        return $kandidat;
    }

    /**
     * Shift milik user untuk absen PULANG. Memakai shift yang sudah "dikunci" pada
     * catatan absensi (shift_id) bila ada, sehingga status pulang konsisten dengan saat masuk.
     */
    public function resolveShiftForPulang(User $user, object $absensi, CarbonInterface $now): ?Shift
    {
        $tanggal = Carbon::parse($absensi->tanggal ?? now())->toDateString();

        if (! empty($absensi->shift_id)) {
            $shift = Shift::find($absensi->shift_id);
            if ($shift) {
                return $shift;
            }
        }

        // Fallback: shift yang "masih relevan" pada jam sekarang (toleransi keterlambatan pulang +7 jam)
        $shifts = $this->shiftsForUser($user, $tanggal);
        if ($shifts->isEmpty()) {
            return null;
        }

        $now = Carbon::parse($now);
        $basis = Carbon::parse($tanggal);
        $kandidat = null;
        $terbaik = null;

        foreach ($shifts as $shift) {
            [$start, $end] = $this->window($shift, $basis);
            $mulaiAbsen = $start->copy()->subMinutes((int) ($shift->toleransi ?? 0));
            $batasAkhir = $end->copy()->addHours(7);

            if ($now->between($mulaiAbsen, $batasAkhir)) {
                if ($terbaik === null || $start->gt($terbaik)) {
                    $terbaik = $start;
                    $kandidat = $shift;
                }
            }
        }

        return $kandidat;
    }

    /**
     * Status absen MASUK: HADIR atau TERLAMBAT.
     */
    public function statusMasuk(Shift $shift, CarbonInterface $now): string
    {
        $jamMasuk = Carbon::parse($shift->jam_masuk);
        $batasToleransi = $jamMasuk->copy()->addMinutes((int) ($shift->toleransi ?? 0));

        return Carbon::parse($now)->gt($batasToleransi) ? 'TERLAMBAT' : 'HADIR';
    }

    /**
     * Status absen PULANG.
     * - PULANG LEBIH AWAL : pulang sebelum jam_pulang (selama tidak terlambat masuk)
     * - TIDAK ABSEN PULANG: melewati batas akhir (jam_pulang + 7 jam)
     * - selain itu: status awal dipertahankan (HADIR / TERLAMBAT)
     *
     * $tanggalAbsen = tanggal saat absen MASUK (basis window shift malam lintas tengah malam).
     *
     * @return array{status: string, habis: bool}
     */
    public function statusPulang(Shift $shift, string $statusMasuk, CarbonInterface $now, ?string $tanggalAbsen = null): array
    {
        $basis = $tanggalAbsen !== null ? Carbon::parse($tanggalAbsen) : Carbon::parse($now->toDateString());
        [$start, $end] = $this->window($shift, $basis);
        $now = Carbon::parse($now);

        $batasAkhir = $end->copy()->addHours(7);
        if ($now->gt($batasAkhir)) {
            return ['status' => 'TIDAK ABSEN PULANG', 'habis' => true];
        }

        if ($now->lt($end) && $statusMasuk !== 'TERLAMBAT') {
            return ['status' => 'PULANG LEBIH AWAL', 'habis' => false];
        }

        return ['status' => $statusMasuk, 'habis' => false];
    }
}