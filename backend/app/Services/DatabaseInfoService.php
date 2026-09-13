<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class DatabaseInfoService
{
    public function getSystemPrompt(): string
    {
        $schema = $this->getFullSchema();
        $guide = $this->getTableGuide();
        $stats = $this->getDatabaseStats();
        $shiftData = $this->getShiftData();
        $divisiData = $this->getDivisiData();
        $cabangData = $this->getCabangData();
        $hariLiburData = $this->getHariLiburData();
        $karyawanData = $this->getKaryawanData();
        $kelasSenseiData = $this->getKelasSenseiData();
        $absensiSenseiToday = $this->getAbsensiSenseiTodayData();
        $siswaData = $this->getSiswaData();
        $batchData = $this->getBatchData();
        $lmsData = $this->getLmsData();
        $kandidatData = $this->getKandidatData();
        $keuanganData = $this->getKeuanganData();
        $proyekData = $this->getProyekData();
        $websiteData = $this->getWebsiteData();
        $todayData = $this->getTodayData();
        $pendingData = $this->getPendingData();

        return <<<PROMPT
Anda asisten AI "SIM Mendunia" yang cerdas. Jawab dalam bahasa Indonesia yang ramah, jelas, dan informatif. Anda MENGETAHUI seluruh isi sistem SIM Mendunia secara real-time dari database (96 tabel).

=================================================================
PETA MODUL SISTEM (untuk menemukan tabel yang tepat):
{$guide}
=================================================================

FULL DATABASE SCHEMA (semua tabel & kolom):
{$schema}

=================================================================
STATISTIK SISTEM SAAT INI:
{$stats}

{$shiftData}

{$divisiData}

{$cabangData}

{$hariLiburData}

{$karyawanData}

{$kelasSenseiData}

{$absensiSenseiToday}

{$siswaData}

{$batchData}

{$lmsData}

{$kandidatData}

{$keuanganData}

{$proyekData}

{$websiteData}

DATA HARI INI ({$todayData['tanggal']}):
{$todayData['data']}

DATA PENDING:
{$pendingData}

=================================================================
CARA MENGAMBIL DATA & MELAKUKAN TINDAKAN:

1) [QUERY] — Ambil data dari database secara live (hanya SELECT):
Jika data yang tersedia di prompt belum cukup untuk menjawab pertanyaan user (misal: detail per siswa, transaksi, riwayat absensi seseorang, data penjualan, dll), Anda WAJIB menambahkan blok [QUERY] berisi SQL yang valid. Anda dapat mengirim beberapa [QUERY] sekaligus.

[QUERY]
{"sql":"SELECT id,name,nama_batch,level FROM ... LIMIT 10"}
[/QUERY]

Aturan query:
- HANYA pernyataan SELECT (satu statement, tanpa titik koma ganda, tanpa WITH).
- SELALU sertakan LIMIT (maks 50 baris).
- Jangan pernah meminta kolom password / token.
- Kolom id, nama, status, tanggal harus disertakan bila ada agar jawaban lebih baik.
- Kolom umum seperti nama, alamat, email, jabatan, status BOLEH ditampilkan bebas dalam jawaban. Hanya kolom password/token yang dilarang.
- Setelah query dieksekusi, hasilnya akan diserahkan kembali kepada Anda, lalu Anda lanjutkan dengan jawaban final dalam bahasa Indonesia (tanpa blok [QUERY] lagi kecuali data masih kurang).

2) [ACTION] — Melakukan tindakan (approve/reject, update status):
Jika user MEMINTA Anda untuk melakukan tindakan, tambahkan blok [ACTION] di akhir respons:

[ACTION]
{"action":"approve_izin","izin_id":5}
[/ACTION]

Tindakan yang tersedia:
1. approve_izin — Setujui izin/cuti. Parameter: izin_id (int).
2. reject_izin — Tolak izin/cuti. Parameter: izin_id (int), catatan (string opsional).
3. approve_lembur — Setujui lembur. Parameter: lembur_id (int).
4. reject_lembur — Tolak lembur. Parameter: lembur_id (int).
5. update_status_absensi — Ubah status absensi. Parameter: absensi_id (int), status (HADIR/TERLAMBAT/IZIN/ALPA/PULANG LEBIH AWAL/TIDAK ABSEN PULANG/LIBUR).

PENTING:
- [QUERY] bersifat membaca data (default untuk menjawab pertanyaan yang datanya tidak tersedia).
- [ACTION] HANYA dilakukan jika user MEMINTA dengan jelas.
- Blok [QUERY] atau [ACTION] diletakkan di baris paling akhir setelah teks / alasan Anda.
- Lihat DATA PENDING untuk ID izin/lembur yang tersedia.
- JANGAN PERNAH mengaku "tidak punya akses" atau "dibatasi" untuk kolom normal (nama, jabatan, status, hp, email, alamat). Akses Anda normal. Satu-satunya hal terlarang adalah kolom password/token.

Gunakan data di atas untuk menjawab pertanyaan user secara akurat dan ringkas (gunakan tabel/poin bila perlu). Jika benar-benar tidak ada data, jawab jujur dan sarankan langkah selanjutnya.
PROMPT;
    }

    // ============ PANDUAN MODUL → TABEL ============
    protected function getTableGuide(): string
    {
        return implode("\n", [
            '- HR & Operasional: users(karyawan/guru/affiliate/kandidat), divisis, cabangs, shifts, shift_jadwal, absensis, absensi_khusus, izins, izin_approvals, wa_izin_approvals, lemburs, hari_liburs, pengaturan_shifts',
            '- Akademik/Siswa: siswas, batches, gurus, kelasses, kelas_sensei, absensi_siswas, jadwal_levels, assessment_categories, assessment_components, student_assessments, daily_assessment_statuses, level_evaluations, student_evaluations, penilaians, penilaian_settings, riwayat pertemuan: lesson_recaps & kelas_pertemuan',
            '- Kelas Mendunia (LMS): lms_courses, lms_categories, lms_lessons, lms_lesson_slides, lms_progress, lms_assignments, lms_course_files, lms_settings, quiz_pakets, quiz_categories, quiz_sections, quiz_questions, quiz_attempts, quiz_answers',
            '- Affiliate/Kandidat/Penjualan: products, product_categories, biaya_kategoris, product_biaya_kategori, coupons, pendaftar, affiliate_links, komisi_affiliates, komisi_tiers, pembayarans, pembayaran_items, batch_biayas, batch_kategori_deadlines, wa_payment_approvals, payment_settings, bank_accounts',
            '- Keuangan: pengeluaran, kategori_pengeluaran, company_profiles',
            '- Proyek/Task: projects, project_lists, project_activities, tasks, task_assignments, agendas',
            '- Website/Matching Job: blogs, blog_categories, visits, matching_job_forms, matching_job_details, kontraks, kontrak_tanda_tangans',
            '- Notifikasi & Sistem: notification_settings, wa_notifications, wa_reminder_settings, email_notifications, notification_templates, login_logs',
        ]);
    }

    // ============ SCHEMA DINAMIS (semua tabel) ============
    protected function getFullSchema(): string
    {
        try {
            $tables = DB::select(
                "SELECT TABLE_NAME FROM information_schema.TABLES
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
                 ORDER BY TABLE_NAME"
            );
        } catch (\Exception $e) {
            return 'Tidak dapat membaca schema.';
        }

        if (empty($tables)) {
            return 'Tidak ada tabel.';
        }

        $lines = [];
        foreach ($tables as $t) {
            $cols = DB::select(
                "SELECT COLUMN_NAME, COLUMN_COMMENT FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
                 ORDER BY ORDINAL_POSITION",
                [$t->TABLE_NAME]
            );

            $parts = [];
            foreach ($cols as $c) {
                $col = $c->COLUMN_NAME;
                if (!empty($c->COLUMN_COMMENT)) {
                    $col .= '(' . $c->COLUMN_COMMENT . ')';
                }
                $parts[] = $col;
            }

            $lines[] = '- ' . $t->TABLE_NAME . ': ' . implode(', ', $parts);
        }

        return implode("\n", $lines);
    }

    // ============ STATISTIK ============
    protected function getDatabaseStats(): string
    {
        $stats = [];

        try {
            $totalUser = DB::table('users')->count();
            $totalKaryawan = DB::table('users')->where('role', 'KARYAWAN')->count();
            $totalHR = DB::table('users')->where('role', 'HR')->count();
            $totalGuru = DB::table('users')->where('role', 'GURU')->count();
            $totalAffiliate = DB::table('users')->where('role', 'AFFILIATE')->count();
            $totalManager = DB::table('users')->where('role', 'MANAGER')->count();
            $stats[] = "Total users: {$totalUser} (Karyawan:{$totalKaryawan}, HR:{$totalHR}, Manager:{$totalManager}, Guru:{$totalGuru}, Affiliate:{$totalAffiliate})";
        } catch (\Exception $e) {}

        $countMap = [
            'Total cabang' => 'cabangs',
            'Total divisi' => 'divisis',
            'Total shift' => 'shifts',
            'Total data absensi' => 'absensis',
            'Total izin' => 'izins',
            'Total lembur' => 'lemburs',
            'Total siswa' => 'siswas',
            'Total batch' => 'batches',
            'Total kelas sensei' => 'kelas_sensei',
            'Total absensi sensei' => 'absensi_sensei',
            'Total pendaftar/kandidat' => 'pendaftar',
            'Total produk' => 'products',
            'Total kupon' => 'coupons',
            'Total pembayaran' => 'pembayarans',
            'Total pengeluaran' => 'pengeluaran',
            'Total proyek' => 'projects',
            'Total tugas' => 'tasks',
            'Total agenda' => 'agendas',
            'Total kursus LMS' => 'lms_courses',
            'Total lesson LMS' => 'lms_lessons',
            'Total paket quiz' => 'quiz_pakets',
            'Total blog' => 'blogs',
            'Total form matching job' => 'matching_job_forms',
            'Total kontrak' => 'kontraks',
        ];
        foreach ($countMap as $label => $table) {
            try {
                $stats[] = "{$label}: " . DB::table($table)->count();
            } catch (\Exception $e) {}
        }

        try {
            $activeKelas = DB::table('kelas_sensei')->where('status', 'aktif')->count();
            $stats[] = "Kelas sensei aktif: {$activeKelas}";
        } catch (\Exception $e) {}

        try {
            $pendingIzin = DB::table('izins')->where('status', 'PENDING')->count();
            $stats[] = "Izin pending: {$pendingIzin}";
        } catch (\Exception $e) {}

        try {
            $pendingLembur = DB::table('lemburs')->where('status', 'PENDING')->count();
            $stats[] = "Lembur pending: {$pendingLembur}";
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
                $hadirCount = DB::table('absensi_sensei')
                    ->where('kelas_sensei_id', $k->id)
                    ->where('status', 'HADIR')
                    ->count();
                $terlambatCount = DB::table('absensi_sensei')
                    ->where('kelas_sensei_id', $k->id)
                    ->where('status', 'TERLAMBAT')
                    ->count();
                $alpaCount = DB::table('absensi_sensei')
                    ->where('kelas_sensei_id', $k->id)
                    ->where('status', 'ALPA')
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

    protected function getSiswaData(): string
    {
        try {
            $totalSiswa = DB::table('siswas')->count();
            if ($totalSiswa === 0) return "DATA SISWA: Tidak ada data";

            $lines = ["DATA SISWA (total {$totalSiswa}). Per status kandidat:"];
            $byStatus = DB::table('siswas')
                ->select('status_kandidat', DB::raw('COUNT(*) as total'))
                ->groupBy('status_kandidat')
                ->get();
            foreach ($byStatus as $s) {
                $lines[] = "- {$s->status_kandidat}: {$s->total}";
            }

            $byBatch = DB::table('siswas')
                ->join('batches', 'siswas.batch_id', '=', 'batches.id')
                ->select('batches.nama_batch', DB::raw('COUNT(siswas.id) as total'))
                ->groupBy('batches.nama_batch')
                ->orderByDesc('total')
                ->get();
            if ($byBatch->isNotEmpty()) {
                $lines[] = "Sebaran per batch:";
                foreach ($byBatch as $b) {
                    $lines[] = "- {$b->nama_batch}: {$b->total}";
                }
            }

            return implode("\n", $lines);
        } catch (\Exception $e) {
            return "DATA SISWA: Error mengambil data";
        }
    }

    protected function getBatchData(): string
    {
        try {
            $batches = DB::table('batches')
                ->leftJoin('cabangs', 'batches.cabang_id', '=', 'cabangs.id')
                ->select('batches.id', 'batches.nama_batch', 'batches.kuota', 'batches.status', 'batches.link_grup', 'cabangs.nama_cabang as cabang')
                ->get();

            if ($batches->isEmpty()) return "DATA BATCH: Tidak ada data";

            $lines = ["DATA BATCH ({$batches->count()} batch):"];
            foreach ($batches as $b) {
                $siswaCount = DB::table('siswas')->where('batch_id', $b->id)->count();
                $cabang = $b->cabang ?? '-';
                $kuota = $b->kuota ?? '-';
                $linkGrup = $b->link_grup ?? '-';
                $lines[] = "- ID:{$b->id} | {$b->nama_batch} | Cabang:{$cabang} | Kuota:{$kuota} | Siswa:{$siswaCount} | Link Grup:{$linkGrup}";
            }
            return implode("\n", $lines);
        } catch (\Exception $e) {
            return "DATA BATCH: Error mengambil data";
        }
    }

    protected function getLmsData(): string
    {
        $lines = [];

        try {
            $courses = DB::table('lms_courses')
                ->select('id', 'judul', 'category_id', 'kelas_sensei_id')
                ->orderByDesc('id')
                ->limit(15)
                ->get();
            if ($courses->isNotEmpty()) {
                $lines[] = "KURSUS LMS terbaru:";
                foreach ($courses as $c) {
                    $lines[] = "- ID:{$c->id} | {$c->judul}";
                }
            }
        } catch (\Exception $e) {}

        try {
            $pakets = DB::table('quiz_pakets')->orderByDesc('id')->limit(15)->get();
            if ($pakets->isNotEmpty()) {
                $lines[] = "PAKET QUIZ:";
                foreach ($pakets as $p) {
                    $pertanyaan = DB::table('quiz_questions')->where('paket_id', $p->id)->count();
                    $lines[] = "- ID:{$p->id} | {$p->nama_paket} | Pertanyaan:{$pertanyaan}";
                }
            }
        } catch (\Exception $e) {}

        return implode("\n", $lines) ?: "DATA KELAS MENDUNIA (LMS): Tidak ada data";
    }

    protected function getKandidatData(): string
    {
        $lines = [];

        try {
            $total = DB::table('pendaftar')->count();
            $lines[] = "PENDAFTAR/SUMBER KANDIDAT (total {$total}):";
            $byStatus = DB::table('pendaftar')
                ->select('status', DB::raw('COUNT(*) as total'))
                ->groupBy('status')
                ->get();
            foreach ($byStatus as $s) {
                $lines[] = "- {$s->status}: {$s->total}";
            }

            $recent = DB::table('pendaftar')
                ->join('products', 'pendaftar.product_id', '=', 'products.id')
                ->select('pendaftar.id', 'pendaftar.nama', 'pendaftar.no_wa', 'pendaftar.status', 'products.nama_produk')
                ->orderByDesc('pendaftar.id')
                ->limit(10)
                ->get();
            if ($recent->isNotEmpty()) {
                $lines[] = "Pendaftar terbaru:";
                foreach ($recent as $r) {
                    $lines[] = "- ID:{$r->id} | {$r->nama} | WA:{$r->no_wa} | Produk:{$r->nama_produk} | Status:{$r->status}";
                }
            }
        } catch (\Exception $e) {
            $lines[] = "DATA KANDIDAT: Error mengambil data";
        }

        return implode("\n", $lines);
    }

    protected function getKeuanganData(): string
    {
        $lines = [];

        try {
            $totalBayar = DB::table('pembayarans')->count();
            $terverifikasi = DB::table('pembayarans')->where('status', 'VERIFIED')->count();
            $pendingBayar = DB::table('pembayarans')->whereIn('status', ['PENDING', 'MENUNGGU'])->count();
            $lines[] = "PEMBAYARAN (total {$totalBayar}, verifikasi:{$terverifikasi}, pending:{$pendingBayar})";

            $pengeluaranKategori = DB::table('pengeluaran')
                ->leftJoin('kategori_pengeluaran', 'pengeluaran.kategori_id', '=', 'kategori_pengeluaran.id')
                ->select('kategori_pengeluaran.nama_kategori', DB::raw('COALESCE(SUM(pengeluaran.jumlah),0) as total'))
                ->groupBy('kategori_pengeluaran.nama_kategori')
                ->orderByDesc('total')
                ->limit(5)
                ->get();
            if ($pengeluaranKategori->isNotEmpty()) {
                $lines[] = "Total pengeluaran per kategori (terbesar):";
                foreach ($pengeluaranKategori as $k) {
                    $lines[] = "- {$k->nama_kategori}: " . number_format((float)$k->total, 0, ',', '.');
                }
            }

            $pendingWa = DB::table('wa_payment_approvals')->where('status', 'PENDING')->count();
            $lines[] = "Approval pembayaran WA pending: {$pendingWa}";
        } catch (\Exception $e) {
            $lines[] = "DATA KEUANGAN: Error mengambil data";
        }

        return implode("\n", $lines);
    }

    protected function getProyekData(): string
    {
        try {
            $projects = DB::table('projects')
                ->leftJoin('users', 'projects.manager_id', '=', 'users.id')
                ->select('projects.id', 'projects.nama_proyek', 'projects.status', 'users.name as manager')
                ->orderByDesc('projects.id')
                ->limit(15)
                ->get();

            if ($projects->isEmpty()) return "DATA PROYEK: Tidak ada data";

            $lines = ["DATA PROYEK ({$projects->count()} aktif/terbaru):"];
            foreach ($projects as $p) {
                $taskCount = DB::table('tasks')
                    ->join('project_lists', 'tasks.project_list_id', '=', 'project_lists.id')
                    ->where('project_lists.project_id', $p->id)
                    ->count();
                $manager = $p->manager ?? '-';
                $lines[] = "- ID:{$p->id} | {$p->nama_proyek} | Status:{$p->status} | Manager:{$manager} | Tasks:{$taskCount}";
            }
            return implode("\n", $lines);
        } catch (\Exception $e) {
            return "DATA PROYEK: Error mengambil data";
        }
    }

    protected function getWebsiteData(): string
    {
        $lines = [];

        try {
            $blogCount = DB::table('blogs')->count();
            $lines[] = "Total blog: {$blogCount}";
        } catch (\Exception $e) {}

        try {
            $mjCount = DB::table('matching_job_forms')->count();
            $lines[] = "Total pendaftar matching job: {$mjCount}";
        } catch (\Exception $e) {}

        try {
            $kontrakCount = DB::table('kontraks')->count();
            $lines[] = "Total kontrak: {$kontrakCount}";
        } catch (\Exception $e) {}

        return implode("\n", $lines) ?: "DATA WEBSITE: Tidak ada data";
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

        try {
            $pendingPayments = DB::table('wa_payment_approvals')
                ->join('pendaftar', 'wa_payment_approvals.pendaftar_id', '=', 'pendaftar.id')
                ->where('wa_payment_approvals.status', 'PENDING')
                ->select('wa_payment_approvals.id', 'pendaftar.nama', 'wa_payment_approvals.amount')
                ->get();
            if ($pendingPayments->isNotEmpty()) {
                $lines[] = "PEMBAYARAN MENUNGGU VERIFIKASI:";
                foreach ($pendingPayments as $p) {
                    $lines[] = "- ID:{$p->id} | {$p->nama} | Rp " . number_format((float)$p->amount, 0, ',', '.');
                }
            }
        } catch (\Exception $e) {}

        return implode("\n", $lines);
    }
}