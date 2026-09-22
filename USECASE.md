# Use Case SIM Mendunia

Dokumen use case untuk setiap role dalam Sistem Informasi Manajemen SIM Mendunia.
Dibuat berdasarkan implementasi aktual pada `routes/web.php`, `routes/api.php`, controller, dan frontend routing.

---

## Daftar Role

| Kode Role | Nama Role | Karakteristik |
|-----------|-----------|---------------|
| `ADMIN` | Administrator Pusat | Akses penuh semua modul |
| `MANAGER` | Manajer | Semua fitur admin (kecuali Affiliate Dashboard) |
| `HR` | Human Resource | Semua fitur admin (kecuali Affiliate Dashboard) |
| `ACCOUNTING` | Bagian Keuangan | Khusus dashboard & data keuangan |
| `ADMIN_CABANG` | Admin Cabang | Data & operasional lingkup cabang tertentu |
| `KARYAWAN` | Karyawan | Mobile: absensi, izin, lembur, jadwal, profil |
| `GURU` | Guru / Sensei | Mobile guru: kelas, absensi, penilaian, LMS |
| `KANDIDAT` | Siswa / Kandidat | Dashboard siswa: profil, absensi, pembayaran, LMS, nilai |
| `AFFILIATE` | Affiliate / Mitra | Dashboard affiliate: link, komisi, closing |

---

## 1. UC001 — Login Sistem

- **Aktor:** Semua role (terdaftar)
- **Precondition:** Akun sudah dibuat admin, status akun aktif
- **Alur Normal:**
  1. User membuka halaman login
  2. User mengisi email & password
  3. Sistem memverifikasi kredensial & mencatat login ke `login_logs`
  4. Sistem mengarahkan ke dashboard sesuai role (Manager/HR → `/`, Karyawan → `/dashboard-karyawan`, Guru → `/guru-dashboard`, Siswa → `/siswa-dashboard`, Affiliate → `/affiliate-dashboard`, Admin Cabang → `/admin-cabang`)
- **Alur Alternatif:**
  - Kredensial salah → sistem menampilkan pesan error, user mengulang
  - Akun nonaktif → sistem menolak login
  - Lupa password → user memakai `forgot-password` untuk reset
- **Postcondition:** User berada di dashboard sesuai role

---

## 2. Use Case Role ADMIN / MANAGER / HR

Merupakan role admin pusat. Berikut use case yang dapat dilakukan. MANAGER & HR tidak dapat mengakses Affiliate Dashboard (`/affiliate-dashboard`) sebagai pengguna affiliate.

### 2.1 UC002 — Kelola Kandidat & Pendaftaran

- **Aktor:** ADMIN, MANAGER, HR
- **Precondition:** Sudah login
- **Alur Normal:**
  1. Akses menu Manajemen Kandidat → Pendaftaran (`/pendaftar`)
  2. Lihat daftar pendaftar (filter: pencarian, status, batch, cabang)
  3. Lihat detail pendaftar & invoice
  4. Verifikasi pembayaran pendaftar
  5. **Approve** pendaftar → sistem membuat record Siswa dan mencatat KomisiAffiliate (jika dari link affiliate)
  6. **Reject** pendaftar → status berubah tolak
- **Alur Alternatif:**
  - Pembayaran belum terverifikasi → admin klik "Verifikasi Pembayaran" atau "Bayar Manual"
  - Set lunas / batal lunas
  - Hapus pendaftar
  - Import kandidat massal via Excel / AI
  - Bulk delete / bulk update batch
- **Postcondition:** Status pendaftar berubah, data siswa/komisi tercatat

### 2.2 UC003 — Kelola Program, Affiliate & Kupon

- **Aktor:** ADMIN, MANAGER (HR sebagian)
- **Alur Normal:**
  1. Akses Program & Affiliate → Data Affiliate (`/data-affiliate`)
  2. Kelola Produk/Program (`/data-product`): nama, harga, komisi, slug, batch, status
  3. Kelola Kategori Produk & Kategori Biaya (`/data-biaya-kategori`)
  4. Kelola Kupon diskon (`/data-coupon`): tipe persen/nominal, masa berlaku, kuota
  5. Buat link affiliate (pilih affiliate + produk) → sistem generate kode unik
- **Postcondition:** Data program/link/kupon tersimpan

### 2.3 UC004 — Kelola Data Akademik (Guru, Kelas, Siswa, Batch)

- **Aktor:** ADMIN, MANAGER, HR
- **Alur Normal:**
  1. **Data Guru** (`/guru`): tambah/ubah/hapus guru, assign `user_id`
  2. **Kelas Sensei** (`/kelas-sensei`): CRUD kelas linked ke guru + batch (tanggal mulai/selesai, status)
  3. **Data Siswa** (`/siswa`): CRUD siswa, unggah file (foto, KTP, ijazah, KK), buatkan akun (role KANDIDAT), bulk update shift
  4. **Batch** (`/batches`): CRUD batch & kuota
  5. **Jadwal Level** (`/jadwal-level`): atur tanggal mulai/selesai per level per batch
- **Alur Alternatif:** Import siswa massal via Excel, import via AI, bulk delete
- **Postcondition:** Data akademik mutakhir

### 2.4 UC005 — Kelola LMS (Kelas Mendunia)

- **Aktor:** ADMIN, MANAGER, HR
- **Alur Normal:**
  1. Akses Akademik → LMS (`/lms`)
  2. Buat course (judul, deskripsi, gambar, batch, level)
  3. Tambah lesson per course (judul, konten, urutan, file)
  4. Buat assignment per course
  5. Kelola file lampiran course
- **Postcondition:** Materi & tugas tersedia untuk siswa dan guru

### 2.5 UC006 — Kelola Absensi & Kehadiran (Semua Jenis)

- **Aktor:** ADMIN, MANAGER, HR
- **Alur Normal:**
  1. **Kehadiran Karyawan** (`/data-kehadiran`): lihat status, ubah status absensi manual
  2. **Kehadiran Khusus** (`/data-kehadiran-khusus`): monitoring absen timer
  3. **Kehadiran Sensei** (`/data-kehadiran-sensei`): lihat riwayat absen sensei, update status
  4. **Absensi Siswa** (`/absensi-siswa`): input/mass store status kehadiran kelas
  5. **Rekap Absensi** (`/rekap-absensi`): filter cabang/divisi/tanggal
  6. **Rekap Jadwal Shift** (`/rekap-jadwal-shift`): kalender bulanan per user
  7. **Monitoring Lokasi** (`/monitoring-lokasi`): peta Leaflet titik check-in/out
  8. **Data Agenda** (`/data-agenda`): lihat agenda & absen
- **Postcondition:** Status kehadiran terkoreksi & rekap tersedia

### 2.6 UC007 — Kelola Izin/Cuti & Lembur (Approval)

- **Aktor:** ADMIN, MANAGER, HR (approver)
- **Alur Normal:**
  1. Buka Manajemen Absensi → Izin & Cuti (`/izin-cuti`)
  2. Lihat daftar izin pending + lampiran
  3. **Approve** / **Reject** izin → notifikasi WA ke karyawan
  4. Buka Approval Lembur (`/approval-lembur`) → **Approve** / **Reject** pengajuan lembur
- **Alur Alternatif:** Approval izin via webhook WA (`WaIzinApproval`)
- **Postcondition:** Status izin/lembur diperbarui

### 2.7 UC008 — Kelola HR & Operasional (Karyawan, Divisi, Cabang, Shift)

- **Aktor:** ADMIN, MANAGER, HR
- **Alur Normal:**
  1. **Data Karyawan** (`/karyawan`): CRUD dengan unggah dokumen (KTP, ijazah, KK, CV, sertifikat), toggle status, toggle akses khusus
  2. **Divisi** (`/divisi`): CRUD
  3. **Cabang** (`/cabang`): CRUD dengan barcode/QR & radius geofencing
  4. **Shift Kerja** (`/shift`): CRUD jam masuk/pulang & toleransi
  5. **Jadwal Shift** (`/jadwal-shift`): kalender jadwal per karyawan, toggle libur
  6. **Pengaturan Shift** (`/pengaturan-shift`): mode `fixed` / `rotating`
  7. **Daftar User** (`/daftar-user`): CRUD akun semua role + toggle aktif
  8. **Hari Libur** (`/hari-libur`): kelola hari libur + auto-detect weekend
  9. **Manajemen Akun** (`/pengaturan`): CRUD akun admin (HR/MANAGER)
- **Postcondition:** Master data HR mutakhir

### 2.8 UC009 — Kelola Keuangan

- **Aktor:** ADMIN, MANAGER, HR (+ ACCOUNTING)
- **Alur Normal:**
  1. Buka dashboard keuangan (`/dashboard-keuangan`)
  2. Lihat grafik pengeluaran bulanan, perbandingan vs pendapatan, profit/loss
  3. Kelola **Kategori Pengeluaran** (`/kategori-pengeluaran`)
  4. Kelola **Data Pengeluaran** (`/pengeluaran`): input + upload bukti + filter
  5. Lihat rekap tahunan per bulan
- **Postcondition:** Data keuangan terpantau

### 2.9 UC010 — Kelola Penilaian & Raport Siswa

- **Aktor:** ADMIN, MANAGER, HR
- **Alur Normal:**
  1. Buka Penilaian Siswa (`/penilaian`)
  2. Setup kategori penilaian per level & komponen sub-penilaian
  3. Lihat matrix penilaian (filter batch, level, tanggal)
  4. Generate **Raport** per siswa per level (`/raport`) → export PDF
- **Postcondition:** Nilai & raport tersedia

### 2.10 UC011 — Monitoring & AI

- **Aktor:** ADMIN, MANAGER, HR
- **Alur Normal:**
  1. **AI Chat** (`/ai-chat`): tanya jawab dengan AI (Groq)
  2. **Log Login** (`/log-login`): pantau aktivitas login seluruh user
- **Postcondition:** Informasi diperoleh admin

### 2.11 UC012 — Manajemen Proyek & Tugas

- **Aktor:** ADMIN, MANAGER, HR
- **Alur Normal:**
  1. Akses Dashboard Management (`/dashboard-management`)
  2. Buat proyek & list pekerjaan
  3. **Assign task** ke karyawan (`task_assignments`)
  4. Susun ulang prioritas task (drag & drop)
  5. Pantau log aktivitas proyek
- **Postcondition:** Proyek & tugas terkelola

### 2.12 UC013 — Pengaturan Sistem & Notifikasi

- **Aktor:** ADMIN, MANAGER, HR
- **Alur Normal:**
  1. **Pengaturan Notifikasi WA** (`/pengaturan-wa`): aktif/nonaktif notif (hadir, terlambat, izin, lembur)
  2. **Template Notifikasi** (`/data-template-notifikasi`): kelola template & variabel
  3. **Profil Perusahaan** (`/pengaturan-perusahaan`): data perusahaan + rekening bank
  4. **Pengaturan Pembayaran** (`/pengaturan-pembayaran`): payment settings
- **Postcondition:** Konfigurasi sistem tersimpan

---

## 3. Use Case Role ACCOUNTING

### 3.1 UC014 — Mengelola Data Pengeluaran

- **Aktor:** ACCOUNTING
- **Precondition:** Login sebagai ACCOUNTING
- **Alur Normal:**
  1. Buka Kategori Pengeluaran (`/kategori-pengeluaran`) → tambah/ubah/hapus kategori
  2. Buka Data Pengeluaran (`/pengeluaran`) → input pengeluaran (judul, nominal, kategori, cabang, tanggal, bukti)
  3. Lihat dashboard keuangan & rekap tahunan
- **Postcondition:** Data pengeluaran tercatat

---

## 4. Use Case Role ADMIN_CABANG

Hanya mengelola data lingkup cabang yang ditugaskan (dibatasi `cabang_ids`).

### 4.1 UC015 — Dashboard Cabang

- **Aktor:** ADMIN_CABANG
- **Alur Normal:**
  1. Login → masuk `/admin-cabang`
  2. Lihat statistik: kandidat, pendaftar pending, tagihan pending, pembayaran pending
- **Postcondition:** Kondisi cabang terpantau

### 4.2 UC016 — Kelola Kandidat, Pendaftaran & Tagihan Cabang

- **Aktor:** ADMIN_CABANG
- **Alur Normal:**
  1. **Data Kandidat** (`/admin-cabang/kandidat`)
  2. **Pendaftaran** (`/admin-cabang/pendaftar`): lihat daftar, verifikasi pembayaran, bayar manual, update kandidat
  3. **Tagihan** (`/admin-cabang/tagihan`): lihat & kelola item pembayaran
  4. **Rekap Per Batch** (`/admin-cabang/rekap-per-batch`)
- **Postcondition:** Data pendaftaran cabang terkelola

### 4.3 UC017 — Kelola Pengeluaran Cabang

- **Aktor:** ADMIN_CABANG
- **Alur Normal:**
  1. **Pengeluaran** (`/admin-cabang/pengeluaran`)
  2. **Kategori Pengeluaran** (`/admin-cabang/kategori-pengeluaran`)
- **Postcondition:** Pengeluaran cabang tercatat

### 4.4 UC018 — Kelola Akademik Cabang

- **Aktor:** ADMIN_CABANG
- **Alur Normal:**
  1. **Data Siswa** & **Data Guru** cabang
  2. **Kelas Sensei** & **Jadwal Level**
  3. **Rekap Siswa**, **Penilaian**, **Raport**, **Evaluasi Instruktur**
  4. **LMS** (Kelas Mendunia) lingkup cabang
- **Postcondition:** Data akademik cabang terkelola

---

## 5. Use Case Role KARYAWAN

Menggunakan aplikasi mobile (`/dashboard-karyawan`).

### 5.1 UC019 — Absensi Masuk (Check-in)

- **Aktor:** KARYAWAN
- **Precondition:** Terdaftar di cabang & memiliki shift aktif
- **Alur Normal:**
  1. Karyawan login → dashboard karyawan → menu Absen
  2. Sistem resolusi shift aktif (mode fixed/rotating, `resolveActiveShift`)
  3. Sistem validasi geofencing (jarak vs radius cabang)
  4. Identifikasi: **face recognition** / scan QR / foto
  5. Sistem simpan `jam_masuk` dengan `shift_id`, status `HADIR`/`TERLAMBAT`
  6. Notifikasi WA terkirim ke karyawan
- **Alur Alternatif:**
  - Belum ada shift aktif (di luar `jam_masuk - toleransi`) → sistem tolak "Tidak ada shift yang aktif saat ini"
  - Wajah tidak dikenali → tolak "Wajah tidak terdaftar"
  - Lokasi di luar radius → tolak dengan info jarak
  - Shift NONAKTIF → tolak
  - Sudah absen masuk → tolak duplikat
  - Hari libur → absensi ditutup
- **Postcondition:** Record `absensis` baru dengan status masuk

### 5.2 UC020 — Absensi Pulang (Check-out)

- **Aktor:** KARYAWAN
- **Precondition:** Sudah ada absensi masuk yang terbuka
- **Alur Normal:**
  1. Karyawan klik Absen Pulang
  2. Sistem cari catatan absen terbuka (hari ini atau shift malam lintas tengah malam)
  3. Sistem validasi shift & range waktu
  4. Sistem simpan `jam_keluar` & tentukan status (`PULANG LEBIH AWAL` / tetap / `TIDAK ABSEN PULANG`)
- **Alur Alternatif:** Belum absen masuk → tolak "belum absen masuk"
- **Postcondition:** Record absensi tertutup

### 5.3 UC021 — Absensi Khusus (Timer)

- **Aktor:** KARYAWAN (yang memiliki `can_access_khusus`)
- **Alur Normal:**
  1. Masuk menu Absensi Khusus
  2. **Mulai** → timer berjalan, **Pause/Resume**, **Selesai**
  3. Sistem catat durasi kerja khusus di luar shift
- **Postcondition:** Riwayat absensi khusus tersimpan

### 5.4 UC022 — Mengajukan Izin/Cuti

- **Aktor:** KARYAWAN
- **Alur Normal:**
  1. Buka menu Izin (`/pengajuan-izin`)
  2. Isi form izin/cuti + upload lampiran
  3. Kirim → status pending
  4. Admin approve/reject → notifikasi WA
- **Postcondition:** Pengajuan izin tersimpan & menunggu approval

### 5.5 UC023 — Mengajukan Lembur

- **Aktor:** KARYAWAN
- **Alur Normal:**
  1. Buka menu Lembur (`/lembur-karyawan`)
  2. Isi pengajuan lembur (dengan foto)
  3. Kirim → status pending → approval admin
- **Postcondition:** Pengajuan lembur tersimpan

### 5.6 UC024 — Melihat Jadwal & Riwayat Absensi

- **Aktor:** KARYAWAN
- **Alur Normal:**
  1. Melihat jadwal shift (`/jadwal-karyawan`) & kalender
  2. Melihat riwayat absensi (`/riwayat-absensi-karyawan`), statistik & grafik mingguan
- **Postcondition:** Informasi jadwal & kehadiran terlihat

### 5.7 UC025 — Mengelola Profil

- **Aktor:** KARYAWAN
- **Alur Normal:**
  1. Buka Profil (`/profil-karyawan`)
  2. Ubah data diri, foto, dan **pindai ulang wajah** (`update-face`)
  3. Ganti password
- **Postcondition:** Data profil diperbarui

### 5.8 UC026 — Melakukan Penilaian

- **Aktor:** KARYAWAN
- **Alur Normal:**
  1. Buka menu Penilaian Karyawan
  2. Isi penilaian kinerja
- **Postcondition:** Penilaian tersimpan

---

## 6. Use Case Role GURU (Sensei)

Menggunakan aplikasi mobile guru (`/guru-dashboard`).

### 6.1 UC027 — Absensi Masuk per Kelas

- **Aktor:** GURU
- **Precondition:** Memiliki kelas sensei aktif
- **Alur Normal:**
  1. Buka menu Kelas aktual (`/absensi/sensei` atau dashboard guru)
  2. Pilih kelas sensei yang aktif
  3. **Absen masuk** dengan foto + lokasi
  4. Sistem simpan `AbsensiSensei` per kelas
- **Alur Alternatif:** Belum ada kelas aktif → tidak ada pilihan kelas
- **Postcondition:** Absen masuk sensei tercatat

### 6.2 UC028 — Absensi Pulang per Kelas

- **Aktor:** GURU
- **Alur Normal:**
  1. Pilih kelas yang sudah absen masuk
  2. Absen pulang dengan foto + lokasi
- **Postcondition:** Jam keluar sensei tercatat

### 6.3 UC029 — Mengelola Absensi Siswa

- **Aktor:** GURU
- **Alur Normal:**
  1. Pilih kelas → daftar siswa tampil
  2. Update status kehadiran siswa (HADIR/TERLAMBAT/IZIN/SAKIT/ALPHA) (`updateSiswaStatus`)
  3. Lihat riwayat absensi & penilaian per siswa
- **Postcondition:** Data kehadiran siswa diperbarui

### 6.4 UC030 — Input Penilaian Harian Siswa

- **Aktor:** GURU
- **Alur Normal:**
  1. Buka Penilaian Harian (`/guru-penilaian-harian`)
  2. Pilih kelas & tanggal
  3. Input nilai per komponen penilaian (skala 0–100)
  4. Simpan `StudentAssessment`
  5. Simpan evaluasi level per siswa
- **Postcondition:** Nilai harian tersimpan

### 6.5 UC031 — Kelola LMS Guru (Kelas Mendunia)

- **Aktor:** GURU
- **Alur Normal:**
  1. Buka `/guru-lms`
  2. Kelola course & lesson untuk kelas yang diajar
  3. Buat assignment & beri **grade** pada submission siswa
  4. Unggah materi/file
- **Postcondition:** Materi & nilai tugas terkelola

### 6.6 UC032 — Mengelola Profil Guru

- **Aktor:** GURU
- **Alur Normal:**
  1. Ubah profil (`/guru-profil`)
  2. Cek batch & ranking siswa
- **Postcondition:** Profil terupdate

### 6.7 UC033 — Agenda Kelas

- **Aktor:** GURU (juga role lain dengan akses)
- **Alur Normal:**
  1. Lihat/tambah agenda dengan foto & jam absen
  2. Scan QR siswa untuk absensi
- **Postcondition:** Agenda & absensi QR tercatat

---

## 7. Use Case Role KANDIDAT (Siswa)

Menggunakan dashboard siswa (`/siswa-dashboard`).

### 7.1 UC034 — Melihat & Mengisi Data Diri

- **Aktor:** KANDIDAT
- **Alur Normal:**
  1. Buka `/siswa-dashboard/data-diri`
  2. Melihat/melengkapi data diri (keluarga, pendidikan, kesehatan, dll)
- **Postcondition:** Data diri siswa tersimpan

### 7.2 UC035 — Absensi Siswa (Scan QR)

- **Aktor:** KANDIDAT
- **Alur Normal:**
  1. Buka `/siswa-dashboard/absensi`
  2. **Scan QR** dari guru/kelas → status kehadiran tercatat
  3. Lihat riwayat kehadiran sendiri
- **Alur Alternatif:** Absen tidak bisa jika QR tidak valid
- **Postcondition:** absensi siswa tercatat

### 7.3 UC036 — Pembayaran & Tagihan

- **Aktor:** KANDIDAT
- **Alur Normal:**
  1. Buka `/siswa-dashboard/pembayaran`
  2. Lihat tagihan & status pembayaran
  3. Upload bukti / lakukan pembayaran online
- **Postcondition:** Status pembayaran diperbarui

### 7.4 UC037 — Belajar di LMS (Kelas Mendunia)

- **Aktor:** KANDIDAT
- **Alur Normal:**
  1. Buka `/siswa-dashboard/lms`
  2. Lihat daftar course berdasarkan batch/level
  3. Buka lesson → baca materi → klik **Selesai** (progress tercatat)
  4. Kerjakan assignment → upload submission
  5. Lihat nilai LMS
- **Postcondition:** Progress belajar & submission tersimpan

### 7.5 UC038 — Melihat Nilai & Raport

- **Aktor:** KANDIDAT
- **Alur Normal:**
  1. Buka `/siswa-dashboard/nilai`
  2. Lihat nilai per level/batch
  3. Lihat raport (PDF) bila tersedia
- **Postcondition:** Nilai terlihat

### 7.6 UC039 — Evaluasi Instruktur

- **Aktor:** KANDIDAT
- **Alur Normal:**
  1. Buka menu Evaluasi Instruktur
  2. Memberi rating/penilaian instruktur per level
- **Postcondition:** Evaluasi instruktur tersimpan

---

## 8. Use Case Role AFFILIATE

Menggunakan dashboard affiliate (`/affiliate-dashboard`).

### 8.1 UC040 — Melihat Dashboard & Statistik

- **Aktor:** AFFILIATE
- **Alur Normal:**
  1. Login → masuk `/affiliate-dashboard`
  2. Lihat total komisi `pending` & `paid`, jumlah pendaftar, closing pasukan
- **Postcondition:** Statistik terlihat

### 8.2 UC041 — Membagikan Link Pendaftaran

- **Aktor:** AFFILIATE
- **Alur Normal:**
  1. Buka menu Link
  2. Lihat/copy link affiliate (kode unik per produk)
  3. Sebarkan ke publik
- **Postcondition:** Link disebar

### 8.3 UC042 — Memantau Komisi

- **Aktor:** AFFILIATE
- **Alur Normal:**
  1. Buka menu Komisi
  2. Lihat daftar pendaftar yang menghasilkan komisi
  3. Ajukan **pencairan komisi**
- **Postcondition:** Komisi terpantau & pencairan diajukan

### 8.4 UC043 — Melihat Profil & Notifikasi

- **Aktor:** AFFILIATE
- **Alur Normal:**
  1. Kelola profil (`/affiliate-profile`)
  2. Lihat data notifikasi (`/data-notifikasi`) & pengaturan notifikasi
- **Postcondition:** Profil & preferensi tersimpan

---

## 9. Use Case Publik (Tanpa Login)

### 9.1 UC044 — Pendaftaran Kandidat

- **Aktor:** Calon Kandidat (publik)
- **Alur Normal:**
  1. Buka link affiliate (`/daftar/:kode`) atau langsung (`/daftar-program/:slug`)
  2. Isi multi-step form: Data Diri → Kontak/Alamat → Pembayaran
  3. Sistem validasi kupon diskon & upload bukti bayar
  4. Sistem buat User (KANDIDAT) + record Pendaftar (status `pending`/`unpaid`)
  5. Sistem tampilkan checkout sukses
- **Postcondition:** Pendaftar menunggu verifikasi admin

### 9.2 UC045 — Register Affiliate Baru

- **Aktor:** Publik (calon affiliate)
- **Alur Normal:**
  1. Buka `/daftar-affiliate`
  2. Isi data & regi
  3. Akun AFFILIATE dibuat
- **Postcondition:** Akun affiliate siap diverifikasi

### 9.3 UC046 — Verifikasi Pembayaran Publik

- **Aktor:** Publik / Kandidat
- **Alur Normal:**
  1. Buka `/verifikasi/:noInvoice`
  2. Masukkan token verifikasi
  3. Sistem menampilkan status pembayaran
- **Postcondition:** Status pembayaran diketahui

---

## Lampiran: Matriks Role vs Fitur Absensi

| Modul | ADMIN/MANAGER/HR | ACCOUNTING | ADMIN_CABANG | KARYAWAN | GURU | KANDIDAT | AFFILIATE |
|-------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Absen Masuk/Pulang Karyawan | Monitor + edit status | – | – | ✔ | – | – | – |
| Absen Sensei | Monitor + riwayat | – | – | – | ✔ | – | – |
| Absen Siswa | Kelola/mass | – | ✔ | – | ✔ | Scan QR | – |
| Absen Khusus (timer) | Monitor | – | – | ✔ | – | – | – |
| Izin/Cuti | Approve | – | – | Ajukan | Ajukan | – | – |
| Lembur | Approve | – | – | Ajukan | – | – | – |
| Jadwal Shift | Kelola | – | – | Lihat | – | – | – |
| Monitoring Lokasi | ✔ | – | – | – | – | – | – |