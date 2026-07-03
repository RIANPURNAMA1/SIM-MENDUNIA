<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class DatabaseInfoService
{
    public function getSystemPrompt(): string
    {
        $schema = $this->getCompactSchema();
        $stats = $this->getDatabaseStats();
        $shiftData = $this->getShiftData();
        $divisiData = $this->getDivisiData();
        $cabangData = $this->getCabangData();
        $hariLiburData = $this->getHariLiburData();
        $karyawanData = $this->getKaryawanData();
        $kelasSenseiData = $this->getKelasSenseiData();
        $absensiSenseiToday = $this->getAbsensiSenseiTodayData();
        $todayData = $this->getTodayData();
        $pendingData = $this->getPendingData();

        return <<<PROMPT
Anda asisten AI "Absensi Mendunia". Jawab dalam bahasa Indonesia yang ramah dan informatif. Anda MENGETAHUI data real-time dari database.

DATABASE SCHEMA:
{$schema}

STATISTIK SAAT INI:
{$stats}

{$shiftData}

{$divisiData}

{$cabangData}

{$hariLiburData}

{$karyawanData}

{$kelasSenseiData}

{$absensiSenseiToday}

DATA HARI INI ({$todayData['tanggal']}):
{$todayData['data']}

DATA PENDING:
{$pendingData}

ANDA DAPAT MELAKUKAN TINDAKAN (ACTIONS):
Jika user MEMINTA Anda untuk melakukan tindakan (approve/reject izin, lembur, update status absensi), Anda WAJIB menambahkan blok [ACTION] di akhir respons dengan format:

[ACTION]
{"action":"approve_izin","izin_id":5}
[/ACTION]

Tindakan yang tersedia:
1. approve_izin — Menyetujui izin/cuti. Parameter: izin_id (int).
2. reject_izin — Menolak izin/cuti. Parameter: izin_id (int), catatan (string, opsional).
3. approve_lembur — Menyetujui lembur. Parameter: lembur_id (int).
4. reject_lembur — Menolak lembur. Parameter: lembur_id (int).
5. update_status_absensi — Mengubah status absensi. Parameter: absensi_id (int), status (string: HADIR/TERLAMBAT/IZIN/ALPA).

PENTING:
- HANYA lakukan tindakan jika user MEMINTA.
- Blok [ACTION] WAJIB di baris paling akhir setelah teks respons.
- Jika tidak ada tindakan yang diminta, jangan sertakan blok [ACTION].
- Lihat DATA PENDING di atas untuk mengetahui ID yang tersedia.

Gunakan data di atas untuk menjawab pertanyaan user. Jika user menanyakan data spesifik yang tidak ada, jawab dengan informasi yang tersedia. Jika benar-benar tidak tahu, sampaikan dengan jujur.
PROMPT;
    }

    protected function getCompactSchema(): string
    {
        $tables = [
            'users' => ['id','name','email','role(HR/MANAGER/KARYAWAN)','divisi_id','shift_id','cabang_ids','status(AKTIF/NONAKTIF)','nip','nik','jabatan','no_hp','alamat','tanggal_masuk','status_kerja(TETAP/KONTRAK/MAGANG)','tempat_lahir','tanggal_lahir','jenis_kelamin(L/P)','agama','pendidikan_terakhir'],
            'cabangs' => ['id','kode_cabang','nama_cabang','status_pusat(PUSAT/CABANG)','alamat','latitude','longitude','radius(m)'],
            'divisis' => ['id','nama_divisi','kode_divisi'],
            'shifts' => ['id','nama_shift','kode_shift','jam_masuk','jam_pulang','total_jam','toleransi(menit)','status(AKTIF/NONAKTIF)'],
            'absensis' => ['id','user_id','shift_id','cabang_id','izin_id','tanggal','jam_masuk','jam_keluar','lat_masuk','long_masuk','status(HADIR/TERLAMBAT/IZIN/ALPA/DLL)'],
            'shift_jadwal' => ['id','user_id','shift_id','tanggal','is_libur'],
            'izins' => ['id','user_id','jenis_izin(SAKIT/CUTI/IZIN)','tgl_mulai','tgl_selesai','alasan','status(PENDING/APPROVED/REJECTED)'],
            'lemburs' => ['id','user_id','jam_masuk','jam_keluar','keterangan','status(PENDING/APPROVED/REJECTED)'],
            'hari_liburs' => ['id','tanggal','keterangan'],
            'kelas_sensei' => ['id','user_id','nama_kelas','level(1-4)','tanggal_mulai','tanggal_selesai','status(aktif/selesai/dibatalkan)'],
            'absensi_sensei' => ['id','kelas_sensei_id','user_id','tanggal','jam_masuk','jam_keluar','status(HADIR/TERLAMBAT/PULANG LEBIH AWAL/TIDAK ABSEN PULANG)'],
            'absensi_khusus' => ['id','user_id','tanggal','jam_masuk','jam_keluar','total_detik','status(BERJALAN/DITUNDA/SELESAI)'],
            'agendas' => ['id','user_id','judul','tanggal','jam_mulai','jam_selesai','status(terjadwal/selesai/dibatalkan)'],
            'penilaians' => ['id','user_id','nama_siswa','kelas','mata_pelajaran','nilai','tanggal_penilaian'],
            'projects' => ['id','nama_proyek','status(PERENCANAAN/BERJALAN/SELESAI/DITUNDA)','manager_id'],
            'project_lists' => ['id','project_id','nama_list','urutan'],
            'tasks' => ['id','project_list_id','judul_tugas','prioritas(RENDAH/SEDANG/TINGGI/DARURAT)','is_selesai(bool)'],
            'task_assignments' => ['id','task_id','user_id'],
        ];

        $lines = [];
        foreach ($tables as $name => $cols) {
            $lines[] = "- {$name}: " . implode(', ', $cols);
        }
        return implode("\n", $lines);
    }

    protected function getDatabaseStats(): string
    {
        $stats = [];

        try {
            $totalKaryawan = DB::table('users')->where('role', 'KARYAWAN')->count();
            $totalHR = DB::table('users')->where('role', 'HR')->count();
            $totalManager = DB::table('users')->where('role', 'MANAGER')->count();
            $totalUser = DB::table('users')->count();
            $stats[] = "Total users: {$totalUser} (Karyawan: {$totalKaryawan}, HR: {$totalHR}, Manager: {$totalManager})";
        } catch (\Exception $e) {}

        try {
            $totalCabang = DB::table('cabangs')->count();
            $stats[] = "Total cabang: {$totalCabang}";
        } catch (\Exception $e) {}

        try {
            $totalDivisi = DB::table('divisis')->count();
            $stats[] = "Total divisi: {$totalDivisi}";
        } catch (\Exception $e) {}

        try {
            $totalShift = DB::table('shifts')->count();
            $stats[] = "Total shift: {$totalShift}";
        } catch (\Exception $e) {}

        try {
            $totalAbsensi = DB::table('absensis')->count();
            $stats[] = "Total data absensi: {$totalAbsensi}";
        } catch (\Exception $e) {}

        try {
            $totalIzin = DB::table('izins')->count();
            $pendingIzin = DB::table('izins')->where('status', 'PENDING')->count();
            $stats[] = "Total izin: {$totalIzin} (Pending: {$pendingIzin})";
        } catch (\Exception $e) {}

        try {
            $totalLembur = DB::table('lemburs')->count();
            $pendingLembur = DB::table('lemburs')->where('status', 'PENDING')->count();
            $stats[] = "Total lembur: {$totalLembur} (Pending: {$pendingLembur})";
        } catch (\Exception $e) {}

        try {
            $totalKelas = DB::table('kelas_sensei')->where('status', 'aktif')->count();
            $totalKelasAll = DB::table('kelas_sensei')->count();
            $stats[] = "Total kelas sensei: {$totalKelasAll} (Aktif: {$totalKelas})";
        } catch (\Exception $e) {}

        try {
            $totalProyek = DB::table('projects')->count();
            $stats[] = "Total proyek: {$totalProyek}";
        } catch (\Exception $e) {}

        try {
            $totalTasks = DB::table('tasks')->count();
            $stats[] = "Total tasks: {$totalTasks}";
        } catch (\Exception $e) {}

        try {
            $totalAgenda = DB::table('agendas')->count();
            $stats[] = "Total agenda: {$totalAgenda}";
        } catch (\Exception $e) {}

        return implode("\n", $stats);
    }

    protected function getShiftData(): string
    {
        try {
            $shifts = DB::table('shifts')->orderBy('jam_masuk')->get();
            if ($shifts->isEmpty()) return "DATA SHIFT: Tidak ada data";

            $lines = ["DATA SHIFT ({$shifts->count()} shift):"];
            foreach ($shifts as $s) {
                $lines[] = "- ID:{$s->id} | {$s->nama_shift} ({$s->kode_shift}) | {$s->jam_masuk} - {$s->jam_pulang} | Toleransi:{$s->toleransi}menit | Status:{$s->status}";
            }
            return implode("\n", $lines);
        } catch (\Exception $e) {
            return "DATA SHIFT: Error mengambil data";
        }
    }

    protected function getDivisiData(): string
    {
        try {
            $divisis = DB::table('divisis')
                ->leftJoin('users', 'divisis.id', '=', 'users.divisi_id')
                ->select('divisis.id', 'divisis.nama_divisi', 'divisis.kode_divisi', DB::raw('COUNT(users.id) as jumlah_karyawan'))
                ->groupBy('divisis.id', 'divisis.nama_divisi', 'divisis.kode_divisi')
                ->orderBy('divisis.nama_divisi')
                ->get();

            if ($divisis->isEmpty()) return "DATA DIVISI: Tidak ada data";

            $lines = ["DATA DIVISI ({$divisis->count()} divisi):"];
            foreach ($divisis as $d) {
                $lines[] = "- ID:{$d->id} | {$d->nama_divisi} ({$d->kode_divisi}) | {$d->jumlah_karyawan} karyawan";
            }
            return implode("\n", $lines);
        } catch (\Exception $e) {
            return "DATA DIVISI: Error mengambil data";
        }
    }

    protected function getCabangData(): string
    {
        try {
            $cabangs = DB::table('cabangs')->orderBy('nama_cabang')->get();
            if ($cabangs->isEmpty()) return "DATA CABANG: Tidak ada data";

            $lines = ["DATA CABANG ({$cabangs->count()} cabang):"];
            foreach ($cabangs as $c) {
                $lines[] = "- ID:{$c->id} | {$c->nama_cabang} ({$c->kode_cabang}) | {$c->status_pusat} | Alamat:{$c->alamat}";
            }
            return implode("\n", $lines);
        } catch (\Exception $e) {
            return "DATA CABANG: Error mengambil data";
        }
    }

    protected function getHariLiburData(): string
    {
        try {
            $today = now()->toDateString();
            $hariLibur = DB::table('hari_liburs')
                ->where('tanggal', '>=', today()->subMonth())
                ->orderBy('tanggal')
                ->get();

            if ($hariLibur->isEmpty()) return "DATA HARI LIBUR: Tidak ada hari libur";

            $lines = ["DATA HARI LIBUR:"];
            foreach ($hariLibur as $h) {
                $status = $h->tanggal === $today ? ' (HARI INI)' : '';
                $lines[] = "- {$h->tanggal}: {$h->keterangan}{$status}";
            }
            return implode("\n", $lines);
        } catch (\Exception $e) {
            return "DATA HARI LIBUR: Error mengambil data";
        }
    }

    protected function getKaryawanData(): string
    {
        try {
            $users = DB::table('users')
                ->leftJoin('divisis', 'users.divisi_id', '=', 'divisis.id')
                ->select(
                    'users.id',
                    'users.name',
                    'users.nip',
                    'users.jabatan',
                    'users.role',
                    'users.status',
                    'users.no_hp',
                    'users.tanggal_masuk',
                    'users.status_kerja',
                    'users.jenis_kelamin',
                    'divisis.nama_divisi'
                )
                ->orderBy('users.name')
                ->get();

            if ($users->isEmpty()) return "DATA KARYAWAN: Tidak ada data";

            $lines = ["DATA KARYAWAN ({$users->count()} orang):"];
            foreach ($users as $u) {
                $divisi = $u->nama_divisi ?? '-';
                $lines[] = "- ID:{$u->id} | {$u->name} | NIP:{$u->nip} | {$u->jabatan} | {$divisi} | {$u->role} | {$u->status} | HP:{$u->no_hp} | Masuk:{$u->tanggal_masuk} | Status Kerja:{$u->status_kerja}";
            }
            return implode("\n", $lines);
        } catch (\Exception $e) {
            return "DATA KARYAWAN: Error mengambil data";
        }
    }

    protected function getKelasSenseiData(): string
    {
        try {
            $kelas = DB::table('kelas_sensei')
                ->join('users', 'kelas_sensei.user_id', '=', 'users.id')
                ->select(
                    'kelas_sensei.id',
                    'kelas_sensei.nama_kelas',
                    'kelas_sensei.level',
                    'kelas_sensei.tanggal_mulai',
                    'kelas_sensei.tanggal_selesai',
                    'kelas_sensei.status',
                    'users.name as nama_sensei'
                )
                ->orderBy('kelas_sensei.tanggal_mulai', 'desc')
                ->get();

            if ($kelas->isEmpty()) return "DATA KELAS SENSEI: Tidak ada data";

            $lines = ["DATA KELAS SENSEI ({$kelas->count()} kelas):"];
            foreach ($kelas as $k) {
                $absenCount = DB::table('absensi_sensei')
                    ->where('kelas_sensei_id', $k->id)
                    ->whereBetween('tanggal', [$k->tanggal_mulai, $k->tanggal_selesai])
                    ->count();

                $alpaCount = DB::table('absensi_sensei')
                    ->where('kelas_sensei_id', $k->id)
                    ->whereBetween('tanggal', [$k->tanggal_mulai, $k->tanggal_selesai])
                    ->where('status', 'ALPA')
                    ->count();

                $hadirCount = DB::table('absensi_sensei')
                    ->where('kelas_sensei_id', $k->id)
                    ->whereBetween('tanggal', [$k->tanggal_mulai, $k->tanggal_selesai])
                    ->where('status', 'HADIR')
                    ->count();

                $terlambatCount = DB::table('absensi_sensei')
                    ->where('kelas_sensei_id', $k->id)
                    ->whereBetween('tanggal', [$k->tanggal_mulai, $k->tanggal_selesai])
                    ->where('status', 'TERLAMBAT')
                    ->count();

                $lines[] = "- ID:{$k->id} | {$k->nama_kelas} | Level:{$k->level} | Sensei:{$k->nama_sensei} | {$k->tanggal_mulai} s/d {$k->tanggal_selesai} | Status:{$k->status} | Absen:{$absenCount} (Hadir:{$hadirCount}, Terlambat:{$terlambatCount}, Alpa:{$alpaCount})";
            }
            return implode("\n", $lines);
        } catch (\Exception $e) {
            return "DATA KELAS SENSEI: Error mengambil data";
        }
    }

    protected function getAbsensiSenseiTodayData(): string
    {
        $tanggal = now()->toDateString();
        try {
            $absensi = DB::table('absensi_sensei')
                ->join('kelas_sensei', 'absensi_sensei.kelas_sensei_id', '=', 'kelas_sensei.id')
                ->join('users', 'absensi_sensei.user_id', '=', 'users.id')
                ->where('absensi_sensei.tanggal', $tanggal)
                ->select(
                    'absensi_sensei.id',
                    'kelas_sensei.nama_kelas',
                    'users.name as nama_sensei',
                    'absensi_sensei.jam_masuk',
                    'absensi_sensei.jam_keluar',
                    'absensi_sensei.status'
                )
                ->orderBy('absensi_sensei.jam_masuk')
                ->get();

            if ($absensi->isEmpty()) {
                return "ABSENSI SENSEI HARI INI ({$tanggal}): Belum ada absensi";
            }

            $hadir = $absensi->where('status', 'HADIR')->count();
            $terlambat = $absensi->where('status', 'TERLAMBAT')->count();
            $lines = ["ABSENSI SENSEI HARI INI ({$tanggal}): Total {$absensi->count()} (Hadir:{$hadir}, Terlambat:{$terlambat})"];
            foreach ($absensi as $a) {
                $keluar = $a->jam_keluar ?? 'belum pulang';
                $lines[] = "- ID:{$a->id} | {$a->nama_sensei} | Kelas:{$a->nama_kelas} | Masuk:{$a->jam_masuk} | Keluar:{$keluar} | Status:{$a->status}";
            }
            return implode("\n", $lines);
        } catch (\Exception $e) {
            return "ABSENSI SENSEI HARI INI: Error mengambil data";
        }
    }

    protected function getTodayData(): array
    {
        $tanggal = now()->toDateString();
        $lines = [];

        try {
            $absenHariIni = DB::table('absensis')->where('tanggal', $tanggal)->count();
            $absenMasuk = DB::table('absensis')->where('tanggal', $tanggal)->whereNotNull('jam_masuk')->count();
            $absenPulang = DB::table('absensis')->where('tanggal', $tanggal)->whereNotNull('jam_keluar')->count();
            $lines[] = "Absensi karyawan hari ini: {$absenHariIni} total, {$absenMasuk} sudah masuk, {$absenPulang} sudah pulang";
        } catch (\Exception $e) {}

        try {
            $keterlambatan = DB::table('absensis')
                ->join('users', 'absensis.user_id', '=', 'users.id')
                ->where('absensis.tanggal', $tanggal)
                ->where('absensis.status', 'TERLAMBAT')
                ->select('users.name', 'absensis.jam_masuk')
                ->get();
            if ($keterlambatan->isNotEmpty()) {
                $lines[] = "Karyawan terlambat hari ini ({$keterlambatan->count()} orang):";
                foreach ($keterlambatan as $k) {
                    $lines[] = "  - {$k->name} (masuk: {$k->jam_masuk})";
                }
            }
        } catch (\Exception $e) {}

        try {
            $activeSessions = DB::table('absensi_khusus')->where('status', 'BERJALAN')->count();
            if ($activeSessions > 0) $lines[] = "Sesi absensi khusus berjalan: {$activeSessions}";
        } catch (\Exception $e) {}

        return [
            'tanggal' => $tanggal,
            'data' => $lines ? implode("\n", $lines) : "Tidak ada data khusus hari ini",
        ];
    }

    protected function getPendingData(): string
    {
        $lines = [];

        try {
            $pendingIzins = DB::table('izins')
                ->join('users', 'izins.user_id', '=', 'users.id')
                ->where('izins.status', 'PENDING')
                ->select('izins.id', 'users.name', 'izins.jenis_izin', 'izins.tgl_mulai', 'izins.tgl_selesai', 'izins.alasan')
                ->get();

            if ($pendingIzins->isNotEmpty()) {
                $lines[] = "IZIN PENDING:";
                foreach ($pendingIzins as $i) {
                    $lines[] = "- ID:{$i->id} | {$i->name} | {$i->jenis_izin} | {$i->tgl_mulai} s/d {$i->tgl_selesai} | {$i->alasan}";
                }
            } else {
                $lines[] = "IZIN PENDING: Tidak ada";
            }
        } catch (\Exception $e) {
            $lines[] = "IZIN PENDING: Error mengambil data";
        }

        try {
            $pendingLemburs = DB::table('lemburs')
                ->join('users', 'lemburs.user_id', '=', 'users.id')
                ->where('lemburs.status', 'PENDING')
                ->select('lemburs.id', 'users.name', 'lemburs.jam_masuk', 'lemburs.keterangan')
                ->get();

            if ($pendingLemburs->isNotEmpty()) {
                $lines[] = "LEMBUR PENDING:";
                foreach ($pendingLemburs as $l) {
                    $lines[] = "- ID:{$l->id} | {$l->name} | {$l->jam_masuk} | {$l->keterangan}";
                }
            } else {
                $lines[] = "LEMBUR PENDING: Tidak ada";
            }
        } catch (\Exception $e) {
            $lines[] = "LEMBUR PENDING: Error mengambil data";
        }

        return implode("\n", $lines);
    }
}
