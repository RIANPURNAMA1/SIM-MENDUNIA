<?php
// app/Models/HariLibur.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class HariLibur extends Model {
    protected $fillable = ['tanggal', 'keterangan'];

    /**
     * Daftar tanggal libur (Y-m-d), dimuat satu kali per request.
     *
     * Di-cache di memori karena hampir semua halaman memanggil
     * apakahLibur() di dalam loop per tanggal. Tanpa cache, satu halaman
     * daftar pertemuan bisa menembak ribuan query.
     */
    protected static ?array $memoTanggal = null;

    /** Set versi terbalik dari $memoTanggal, untuk lookup O(1). */
    protected static ?array $memoTanggalSet = null;

    protected static ?int $memoDibuatPada = null;

    /**
     * Batas umur memo dalam detik.
     *
     * Memo ini menempel di proses PHP, sedangkan tabel hari_liburs
     * dipakai bersama. Event saved/deleted hanya membersihkan memo di
     * proses yang melakukan penulisan, jadi worker jangka panjang
     * (queue:work) bisa tetap memakai data lama. TTL membatasi umur data
     * tanpa menambah query pada request normal.
     */
    protected const MEMO_TTL_DETIK = 300;

    public static function tanggalLibur(): array
    {
        static::pastikanMemoSegar();

        return static::$memoTanggal;
    }

    /**
     * Daftar tanggal libur sebagai set asosiatif, untuk cek O(1).
     *
     * @return array<string, true>
     */
    public static function tanggalLiburSet(): array
    {
        static::pastikanMemoSegar();

        return static::$memoTanggalSet;
    }

    protected static function pastikanMemoSegar(): void
    {
        if (static::$memoTanggal !== null && static::$memoDibuatPada !== null) {
            if ((time() - static::$memoDibuatPada) < static::MEMO_TTL_DETIK) {
                return;
            }
        }

        $tanggal = static::query()
            ->pluck('tanggal')
            ->map(fn ($d) => Carbon::parse($d)->toDateString())
            ->all();

        static::$memoTanggal = $tanggal;
        static::$memoTanggalSet = array_fill_keys($tanggal, true);
        static::$memoDibuatPada = time();
    }

    public static function flushMemo(): void
    {
        static::$memoTanggal = null;
        static::$memoTanggalSet = null;
        static::$memoDibuatPada = null;
    }

    protected static function booted(): void
    {
        static::saved(fn () => static::flushMemo());
        static::deleted(fn () => static::flushMemo());
    }

    /**
     * Logika Inti: Cek apakah sebuah tanggal itu libur
     */
    public static function apakahLibur($tanggal) {
        $dt = Carbon::parse($tanggal);

        // 1. Cek Otomatis: Jika hari Sabtu atau Minggu
        if ($dt->isWeekend()) {
            return true;
        }

        // 2. Cek Manual: Jika ada di tabel hari_liburs (Inputan Admin)
        return isset(static::tanggalLiburSet()[$dt->toDateString()]);
    }
}
