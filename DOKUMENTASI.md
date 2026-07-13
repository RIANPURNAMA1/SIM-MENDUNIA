# Dokumentasi Sistem SIM Mendunia

## Daftar Isi

1. [Gambaran Umum](#1-gambaran-umum)
2. [Tech Stack](#2-tech-stack)
3. [Arsitektur](#3-arsitektur)
4. [Role & Hak Akses](#4-role--hak-akses)
5. [Struktur Database](#5-struktur-database)
6. [Modul & Fitur](#6-modul--fitur)
   - [6.1 Authentication](#61-authentication)
   - [6.2 Manajemen Kandidat & Pendaftaran](#62-manajemen-kandidat--pendaftaran)
   - [6.3 Affiliate & Program](#63-affiliate--program)
   - [6.4 Akademik](#64-akademik)
   - [6.5 LMS (Learning Management System)](#65-lms-learning-management-system)
   - [6.6 Absensi & Kehadiran](#66-absensi--kehadiran)
   - [6.7 HR & Operasional](#67-hr--operasional)
   - [6.8 Keuangan](#68-keuangan)
   - [6.9 Admin Cabang](#69-admin-cabang)
   - [6.10 AI & Automasi](#610-ai--automasi)
7. [API Endpoints](#7-api-endpoints)
8. [Alur Penting](#8-alur-penting)
9. [Frontend Routing](#9-frontend-routing)

---

## 1. Gambaran Umum

SIM Mendunia adalah sistem informasi manajemen terpadu untuk lembaga pelatihan dan penempatan kerja luar negeri (Jepang & Korea Selatan). Sistem mencakup manajemen pendaftaran kandidat, program affiliate, akademik (kelas, guru, siswa), LMS (Learning Management System), absensi (karyawan, sensei, siswa), HR & operasional, keuangan, admin cabang, serta AI Chat.

---

## 2. Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | React 19 + TypeScript + Vite |
| **Backend** | Laravel 12 + PHP 8.2 |
| **Database** | MySQL / MariaDB |
| **Auth** | Laravel Sanctum (token-based) |
| **Styling** | Tailwind CSS |
| **Charts** | Chart.js + react-chartjs-2 |
| **Maps** | Leaflet (react-leaflet) |
| **Icons** | Lucide React, Phosphor React |
| **HTTP Client** | Axios |

---

## 3. Arsitektur

### 3.1 Struktur Frontend

```
frontend/src/
  App.tsx              - Routing utama (React Router v6)
  main.tsx             - Entry point Vite
  types/index.ts       - TypeScript interfaces
  services/api.ts      - Axios client + semua API calls
  contexts/
    AuthContext.tsx     - Context autentikasi
  layouts/
    DashboardLayout.tsx    - Layout admin (Sidebar + Header)
    AffiliateLayout.tsx    - Layout affiliate
    GuruLayout.tsx         - Layout guru
    SiswaLayout.tsx        - Layout siswa/kandidat
    AdminCabangLayout.tsx  - Layout admin cabang
  components/
    Sidebar.tsx            - Navigasi sidebar admin
    Header.tsx             - Top navbar admin
    AffiliateSidebar.tsx   - Sidebar affiliate
    SiswaSidebar.tsx       - Sidebar siswa
    AdminCabangSidebar.tsx - Sidebar admin cabang
    KaryawanBottomNav.tsx  - Bottom nav mobile
    LocationTracker.tsx    - Peta Leaflet
    ConfirmModal.tsx       - Modal konfirmasi
  pages/
    Login.tsx
    ForgotPassword.tsx
    AiChat.tsx
    SiswaDashboard.tsx
    Dashboard/
      DashboardHome.tsx       - Pusat dashboard (central hub)
      DashboardKandidat.tsx   - Dashboard kandidat
      DashboardManagement.tsx - Dashboard management/proyek
    Absensi/
      DashboardAbsensi.tsx    - Dashboard absensi
      AbsensiKaryawan.tsx     - Absensi karyawan
      AbsensiSiswa.tsx        - Absensi siswa
      AbsensiSaya.tsx         - Absensi siswa (mobile)
      AbsensiGuruShift.tsx    - Absensi guru per shift
      AbsensiGuruCabang.tsx   - Absensi guru per cabang
      DataKehadiran.tsx       - Kehadiran karyawan
      DataKehadiranKhusus.tsx - Kehadiran khusus (timer)
      DataKehadiranSensei.tsx - Kehadiran sensei
      RekapAbsensi.tsx        - Rekap absensi
      RekapKehadiranSensei.tsx - Rekap kehadiran sensei
    Akademik/
      DashboardAkademik.tsx  - Dashboard akademik
      DataAgenda.tsx         - Data agenda/event
      DataMatchingJob.tsx    - Matching job (placeholder)
      LMS.tsx                - LMS (student view)
      DataCourse.tsx         - Kelola course (admin)
      DataLesson.tsx         - Kelola lesson per course (admin)
    Karyawan/
      Karyawan.tsx           - Data karyawan
      KaryawanDashboard.tsx  - Dashboard karyawan (mobile)
      Divisi.tsx             - Divisi
      Cabang.tsx             - Cabang
      Shift.tsx              - Shift
      JadwalShift.tsx        - Jadwal shift
      PengaturanShift.tsx    - Pengaturan shift mode
      DaftarUser.tsx         - User management
      IzinCuti.tsx           - Izin & cuti
      ApprovalLembur.tsx     - Approval lembur
      HariLibur.tsx          - Hari libur
      RekapJadwalShift.tsx   - Rekap jadwal shift
      MonitoringLokasi.tsx   - Monitoring lokasi (Leaflet)
      RiwayatAbsensiKaryawan.tsx - Riwayat absensi (mobile)
      PengajuanIzin.tsx      - Pengajuan izin (mobile)
      LemburKaryawan.tsx     - Lembur (mobile)
      JadwalKaryawan.tsx     - Jadwal (mobile)
      ProfilKaryawan.tsx     - Profil (mobile)
    Sensei/
      Guru.tsx               - Data guru
      KelasSensei.tsx        - Kelas sensei
      JadwalLevel.tsx        - Jadwal level per batch
    Siswa/
      Siswa.tsx              - Data siswa
      Batches.tsx            - Batch/angkatan
      RekapSiswa.tsx         - Rekap siswa
      RekapBatch.tsx         - Rekap per batch (biaya)
      Penilaian.tsx          - Penilaian siswa
      Tagihan.tsx            - Tagihan
      Pembayaran.tsx         - Pembayaran
      DataDiri.tsx           - Data diri siswa (mobile)
      PembayaranSiswa.tsx    - Pembayaran siswa (mobile)
    Pendaftaran/
      Pendaftar.tsx          - List pendaftar (admin)
      DataKandidat.tsx       - Data kandidat
      InvoicePendaftar.tsx   - Invoice detail
      DaftarAffiliate.tsx    - Daftar via link affiliate
      DaftarAffiliateBaru.tsx - Register affiliate baru
      DaftarProgram.tsx      - Daftar langsung program
    Affiliate/
      DataAffiliate.tsx      - Data affiliate
      DataProduct.tsx        - Data produk/program
      DataCoupon.tsx         - Data kupon
      DataBiayaKategori.tsx  - Kategori biaya
      AffiliateDashboard.tsx - Dashboard affiliate
    Keuangan/
      DashboardKeuangan.tsx       - Dashboard keuangan
      DataKategoriPengeluaran.tsx - Kategori pengeluaran
      DataPengeluaran.tsx         - Data pengeluaran
    Pengaturan/
      Pengaturan.tsx         - Manajemen akun
      PengaturanWa.tsx       - Notifikasi WA
      CompanyProfile.tsx     - Profil perusahaan
    Guru/
      GuruDashboard.tsx      - Dashboard guru (mobile)
      GuruDataSiswa.tsx      - Data siswa guru
      GuruProfil.tsx         - Profil guru
    AdminCabang/
      AdminCabangDashboard.tsx    - Dashboard admin cabang
      AdminCabangKandidat.tsx     - Data kandidat cabang
      AdminCabangPendaftaran.tsx  - Pendaftaran cabang
      AdminCabangTagihan.tsx      - Tagihan cabang
    DashboardHome.tsx         - Pusat dashboard
```

### 3.2 Struktur Backend

```
backend/app/
  Http/Controllers/
    AuthController.php            - Login/logout/register API
    PendaftaranController.php     - Pendaftaran, pembayaran, approve/reject
    ProductController.php         - CRUD produk/program
    ProductCategoryController.php - CRUD kategori produk
    AffiliateLinkController.php   - CRUD link affiliate
    DashboardController.php       - Dashboard admin utama
    SiswaDashboardController.php  - Dashboard siswa
    GuruDashboardController.php   - Dashboard guru
    AffiliateDashboardController.php - Dashboard affiliate
    AdminCabangController.php     - Admin cabang (branch admin)
    CompanyProfileController.php  - Profil perusahaan
    LmsController.php             - LMS (courses, lessons, progress)
    PengeluaranController.php     - Keuangan (pengeluaran, kategori)
    BiayaController.php           - Biaya & pembayaran item
    Absensi/
      AbsensiController.php          - Absensi karyawan
      AbsensiSiswaController.php     - Absensi siswa
      KehadiranController.php        - Kehadiran
      KehadiranKhususController.php  - Kehadiran khusus (timer)
      KehadiranSenseiController.php  - Kehadiran sensei
      RekapKehadiranSenseiController.php - Rekap kehadiran sensei
      RekapJadwalShiftController.php - Rekap jadwal shift
      JadwalLevelController.php      - Jadwal level
    Api/
      CouponController.php          - CRUD kupon
    (controllers lain untuk Karyawan, Divisi, Cabang, Shift, dll)
  Models/
    User, Product, ProductCategory, AffiliateLink, Pendaftar, KomisiAffiliate,
    Pembayaran, PembayaranItem, Coupon, Siswa, Batch, Kelas, KelasSensei,
    Absensi, AbsensiSiswa, AbsensiSensei, AbsensiKhusus,
    Shift, ShiftJadwal, Cabang, Divisi, Izin, Lembur,
    HariLibur, Guru, Penilaian, AssessmentCategory,
    AssessmentComponent, StudentAssessment,
    DailyAssessmentStatus, Agenda,
    Course, Lesson, LmsProgress, CourseFile,
    Pengeluaran, KategoriPengeluaran,
    BiayaKategori, BatchBiaya, ProductBiayaKategori,
    CompanyProfile, PengaturanShift, dll.
```

---

## 4. Role & Hak Akses

| Role | Akses |
|------|-------|
| **ADMIN** | Semua fitur admin |
| **MANAGER** | Semua fitur admin (kecuali Affiliate Dashboard) |
| **HR** | Semua fitur admin (kecuali Affiliate Dashboard) |
| **ADMIN_CABANG** | Dashboard cabang: kandidat, pendaftaran, tagihan, rekap per batch |
| **KARYAWAN** | Halaman mobile: dashboard, absensi, izin, lembur, jadwal, profil |
| **GURU** | Mobile dashboard guru: kelas, absensi, penilaian harian |
| **KANDIDAT** | Dashboard siswa: profil, absensi, pembayaran, LMS |
| **AFFILIATE** | Dashboard affiliate: link, pendaftar, komisi |

Rule di frontend (`App.tsx`):
- Route `/` dan admin lainnya diblokir untuk `KANDIDAT`, `AFFILIATE`, `KARYAWAN`, `GURU`, `ADMIN_CABANG`
- Route `/affiliate-dashboard` hanya untuk `AFFILIATE`
- Route `/siswa-dashboard/*` hanya untuk `KANDIDAT`
- Route `/guru-dashboard/*` hanya untuk `GURU`
- Route `/dashboard-karyawan/*` diblokir untuk `MANAGER`, `HR`, `ADMIN`, `GURU`
- Route `/admin-cabang/*` hanya untuk `ADMIN_CABANG`

---

## 5. Struktur Database

### 5.1 Core Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts (all roles) |
| `products` | Program/produk (nama, harga, komisi) |
| `product_categories` | Kategori produk |
| `product_biaya_kategori` | Mapping produk ke kategori biaya |
| `affiliate_links` | Link affiliate per produk (kode unik, views, pendaftar_count) |
| `pendaftar` | Pendaftar (dari link affiliate atau direct) |
| `komisi_affiliates` | Komisi yang dihasilkan per pendaftar di-approve |
| `pembayaran` | Riwayat pembayaran pendaftar |
| `pembayaran_items` | Item pembayaran per pendaftar |
| `coupons` | Kupon diskon |
| `batches` | Batch/angkatan |
| `kelas_sensei` | Kelas yang diajar sensei (guru) |
| `siswas` | Data siswa |
| `gurus` | Data guru |
| `kelas` | Master kelas |
| `company_profiles` | Profil perusahaan |

### 5.2 Absensi Tables

| Table | Purpose |
|-------|---------|
| `absensis` | Absensi karyawan |
| `absensi_siswas` | Absensi siswa |
| `absensi_sensei` | Absensi sensei |
| `absensi_khusus` | Absensi khusus (timer-based) |
| `shift_jadwal` | Jadwal shift karyawan |
| `shifts` | Master shift |
| `izins` | Izin/cuti |
| `lemburs` | Lembur |

### 5.3 Master Data Tables

| Table | Purpose |
|-------|---------|
| `divisis` | Divisi |
| `cabangs` | Cabang/lokasi |
| `hari_liburs` | Hari libur nasional |
| `jadwal_levels` | Jadwal level per batch |
| `assessment_categories` | Kategori penilaian |
| `assessment_components` | Sub-komponen penilaian |
| `student_assessments` | Nilai siswa per komponen |
| `daily_assessment_statuses` | Status penilaian harian per siswa |
| `agendas` | Agenda/event |
| `notification_settings` | Pengaturan notifikasi WA |
| `pengaturan_shifts` | Mode shift (fixed/rotating) |
| `projects`, `project_lists`, `tasks`, `task_assignments` | Manajemen proyek |

### 5.4 LMS Tables

| Table | Purpose |
|-------|---------|
| `lms_courses` | Course/mata pelajaran |
| `lms_lessons` | Lesson per course |
| `lms_progress` | Progress belajar siswa per lesson |
| `lms_course_files` | File lampiran course |

### 5.5 Keuangan Tables

| Table | Purpose |
|-------|---------|
| `kategori_pengeluaran` | Kategori pengeluaran |
| `pengeluaran` | Data pengeluaran (dengan bukti upload) |

### 5.6 Biaya & Pembayaran Tables

| Table | Purpose |
|-------|---------|
| `biaya_kategoris` | Kategori biaya (SPP, DLL, dsb) |
| `batch_biayas` | Biaya per batch per kategori |
| `pembayaran_items` | Item pembayaran per pendaftar |

---

## 6. Modul & Fitur

### 6.1 Authentication

- Login via email/password dengan CAPTCHA (angka acak 4 digit)
- Login di-handle oleh `AuthController@loginApi` (Sanctum token)
- Auto-redirect berdasarkan role setelah login
- Register affiliate publik via `AuthController@registerAffiliate`
- Lupa password via `/forgot-password`

### 6.2 Manajemen Kandidat & Pendaftaran

**Pendaftaran Publik:**
- `POST /pendaftaran/daftar` — Daftar via link affiliate (kode unik)
- `POST /pendaftaran/daftar-langsung` — Daftar langsung pilih produk
- Multi-step form: Data Diri (dengan pilih batch) → Kontak → Pembayaran (upload bukti + nominal)
- Validasi kupon diskon (persen/nominal) otomatis
- User baru dibuat dengan role `KANDIDAT`
- Pendaftaran default: `status_pendaftaran = pending`, `status_pembayaran = unpaid`
- File bukti bayar max 5MB

**Manajemen Admin:**
- `GET /pendaftar` — List pendaftar dengan filter (search, status daftar, status bayar, batch)
- `POST /pendaftar/{id}/approve` — Setujui → buat record Siswa + catat KomisiAffiliate
- `POST /pendaftar/{id}/reject` — Tolak
- `POST /pendaftar/{id}/verify-payment` — Verifikasi pembayaran
- `GET /pendaftar/{id}/invoice` — Invoice detail
- `DELETE /pendaftar/{id}` — Hapus

### 6.3 Affiliate & Program

**Link Affiliate:**
- CRUD link affiliate: pilih affiliate + produk, auto-generate kode unik
- Setiap link punya: views, pendaftar_count, status aktif/nonaktif
- Copy link (http://localhost:5173/daftar/{kode})

**Produk/Program:**
- CRUD produk: nama, deskripsi, harga, komisi (jumlah fix untuk affiliate), status
- Kategori produk via `ProductCategoryController`

**Komisi:**
- Komisi dibuat otomatis saat admin approve pendaftar yang berasal dari link affiliate
- Jumlah komisi = `product.komisi`
- Status komisi: `pending` (default), `paid`
- Dashboard affiliate menampilkan total komisi pending & paid

**Kupon Diskon:**
- CRUD kupon: tipe (persen/nominal), nilai, min_pembelian, maks_penggunaan, masa berlaku
- Validasi kupon: cek status, tanggal berlaku, kuota, product_id, min_pembelian

**Kategori Biaya:**
- CRUD kategori biaya (SPP, DLL, dsb)
- Mapping kategori biaya ke produk
- Biaya per batch per kategori

### 6.4 Akademik

**Guru:**
- CRUD guru: assign user_id, nama, nip, mata_pelajaran, status
- Filter guru aktif di penilaian

**Kelas Sensei:**
- CRUD kelas: linked ke user (guru) + batch (opsional)
- Kelas memiliki: nama, level, tanggal_mulai, tanggal_selesai, status

**Siswa:**
- CRUD siswa (multipart foto, dll)
- Import massal via Excel
- Import via AI
- Buatkan akun user otomatis (role KANDIDAT) untuk siswa
- Bulk delete, bulk update shift

**Batch:**
- CRUD batch: nama_batch, cabang_id, status
- Setiap batch bisa memiliki jadwal level (level 1-5+ dengan tanggal mulai/selesai)

**Jadwal Level:**
- Matrix jadwal per batch: tentukan tanggal_mulai & tanggal_selesai per level

**Penilaian Siswa:**
- Setting kategori penilaian per level (misal: Speaking, Listening, dll)
- Masing-masing kategori memiliki sub-komponen
- Penilaian harian per siswa per komponen (skala 0-100)
- Matrix view: baris = siswa, kolom = tanggal + total komponen
- Rekap penilaian

**Invoice & Tagihan:**
- Invoice detail per pendaftar (print, download PDF)
- Riwayat pembayaran
- Rekap per batch dengan breakdown kategori biaya

### 6.5 LMS (Learning Management System)

**Admin - Kelola Course:**
- `GET /admin/lms/courses` — List semua course
- `POST /admin/lms/courses` — Buat course (dengan gambar)
- `POST /admin/lms/courses/{id}` — Update course
- `DELETE /admin/lms/courses/{id}` — Hapus course

**Admin - Kelola Lesson:**
- `GET /admin/lms/courses/{courseId}/lessons` — List lesson per course
- `POST /admin/lms/lessons` — Buat lesson
- `POST /admin/lms/lessons/{id}` — Update lesson
- `DELETE /admin/lms/lessons/{id}` — Hapus lesson

**Admin - Kelola File:**
- `POST /admin/lms/upload` — Upload file
- `POST /admin/lms/files` — Attach file ke course
- `DELETE /admin/lms/files/{id}` — Hapus file
- `GET /admin/lms/courses/{courseId}/files` — List file per course

**Siswa - Akses LMS:**
- `GET /lms/courses` — List course berdasarkan batch/level siswa
- `GET /lms/courses/{id}` — Detail course + daftar lesson
- `GET /lms/lessons/{id}` — Detail lesson
- `POST /lms/lessons/{id}/complete` — Tandai lesson selesai
- `DELETE /lms/lessons/{id}/complete` — Batalkan penyelesaian

**Sidebar:** Akademik > LMS (`/lms`)

### 6.6 Absensi & Kehadiran

**Absensi Karyawan:**
- Check-in/out dengan: face recognition (face embedding), geofencing (radius cabang), QR code
- Multi-cabang, multi-shift
- Status: HADIR, TELAT, IZIN, SAKIT, ALPHA, CUTI, LIBUR, DINAS_LUAR, BELUM_ABSEN
- Overtime (lembur) terpisah dengan foto
- Izin/cuti dengan approval
- Laporan: rekap absensi, grafik mingguan, riwayat

**Absensi Sensei:**
- Check-in/out per kelas (dengan foto + lokasi)
- Status: HADIR, TELAT, IZIN, SAKIT, ALPHA, LIBUR
- Grouped by kelas, expandable accordion
- Rekap kalender per sensei

**Absensi Siswa:**
- Check-in/out dengan status: HADIR, TELAT, IZIN, SAKIT, ALPHA
- Mass store (satu kelas sekaligus)
- Rekap dengan export Excel/PDF
- Absensi via mobile oleh siswa

**Absensi Khusus:**
- Timer-based (mulai → pause/resume → selesai)
- Untuk pekerjaan khusus di luar shift

**Monitoring Lokasi:**
- Peta Leaflet menampilkan titik check-in/out karyawan
- Marker warna: hijau (masuk & pulang), biru (belum pulang), merah (tidak sesuai radius)

**Agenda:**
- CRUD agenda dengan foto, jam absen
- Filter by cabang, divisi, date range

### 6.7 HR & Operasional

**Karyawan:**
- CRUD lengkap dengan foto KTP, ijazah, KK, CV, sertifikat
- Bulk upload file
- Toggle status aktif/nonaktif
- Toggle akses khusus

**Divisi — Cabang — Shift — Jadwal Shift:**
- CRUD master data
- QR code per cabang
- Kalender jadwal shift (bulanan), toggle libur
- Mode shift: fixed atau rotating

**User Management:**
- CRUD user (ADMIN, MANAGER, HR, AFFILIATE, KANDIDAT, GURU, KARYAWAN, ADMIN_CABANG)
- Toggle status aktif/nonaktif
- Role-based access control

**Hari Libur:**
- Kelola hari libur + auto-detect weekend

**Approval:**
- Izin/cuti dengan approve/reject + notifikasi WA
- Lembur dengan approve/reject

**Profil Perusahaan:**
- `GET /company-profile` — Lihat profil perusahaan
- `POST /company-profile` — Update profil perusahaan

**Rekap:**
- Rekap absensi (filter cabang, divisi, date)
- Rekap jadwal shift (kalender bulanan per user)
- Export Excel, PDF

### 6.8 Keuangan

**Dashboard Keuangan:**
- Grafik pengeluaran bulanan (bar chart)
- Grafik perbandingan pengeluaran vs pendapatan (line chart)
- Grafik komposisi pengeluaran per kategori (doughnut chart)
- Total pengeluaran, pendapatan (dari pendaftar), dan profit/loss
- Transaksi terbaru

**Kategori Pengeluaran:**
- CRUD kategori pengeluaran (Operasional, Gaji, Marketing, dll)
- `GET /pengeluaran/kategori` — List kategori
- `POST /pengeluaran/kategori` — Buat kategori
- `PUT /pengeluaran/kategori/{id}` — Update kategori
- `DELETE /pengeluaran/kategori/{id}` — Hapus kategori

**Data Pengeluaran:**
- CRUD pengeluaran dengan upload bukti
- Filter by kategori, tanggal, pencarian
- `GET /pengeluaran` — List pengeluaran (paginated)
- `POST /pengeluaran` — Buat pengeluaran (dengan file bukti)
- `GET /pengeluaran/{id}` — Detail pengeluaran
- `PUT /pengeluaran/{id}` — Update pengeluaran
- `DELETE /pengeluaran/{id}` — Hapus pengeluaran
- `GET /pengeluaran/dashboard` — Data dashboard keuangan
- `GET /pengeluaran/rekap` — Rekap tahunan per bulan

**Sidebar:** Keuangan (khusus HR & MANAGER):
- Kategori Pengeluaran → `/kategori-pengeluaran`
- Data Pengeluaran → `/pengeluaran`

### 6.9 Admin Cabang

**Role Admin Cabang (`ADMIN_CABANG`):**
- Role baru dengan layout, sidebar, dan dashboard terpisah
- Hanya melihat data untuk cabang yang ditugaskan

**Dashboard:**
- Statistik kandidat, pendaftar pending, tagihan pending
- `GET /admin-cabang/dashboard`

**Data Kandidat:**
- List kandidat per cabang
- `GET /admin-cabang/kandidat`

**Pendaftaran:**
- List pendaftar per cabang
- Verifikasi pembayaran
- Invoice & riwayat pembayaran
- Bayar manual
- Update data kandidat
- `GET /admin-cabang/pendaftar`
- `POST /admin-cabang/pendaftar/{id}/verify-payment`
- `POST /admin-cabang/pendaftar/{id}/bayar-manual`
- `POST /admin-cabang/pendaftar/{id}/update-kandidat`

**Tagihan:**
- Tagihan per cabang
- Pembayaran item
- `GET /admin-cabang/tagihan`
- `GET /admin-cabang/pembayaran-item/{id}`
- `POST /admin-cabang/pembayaran-item/{id}`

**Rekap Per Batch:**
- Rekap keuangan per batch dengan breakdown kategori biaya
- `GET /admin-cabang/rekap-per-batch`

**Sidebar:** Admin Cabang (layout terpisah):
- Dashboard → `/admin-cabang`
- Data Kandidat → `/admin-cabang/kandidat`
- Pendaftaran → `/admin-cabang/pendaftar`
- Tagihan → `/admin-cabang/tagihan`
- Rekap Per Batch → `/admin-cabang/rekap-per-batch`

### 6.10 AI & Automasi

**AI Chat:**
- Chat dengan AI untuk informasi umum
- Markdown rendering, code blocks

**Notifikasi WA:**
- Pengaturan notifikasi (hadir, terlambat, izin, lembur, dll)
- Webhook untuk approval via WA

---

## 7. API Endpoints

### 7.1 Public (No Auth)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/auth/login` | Login |
| POST | `/auth/register-affiliate` | Register affiliate baru |
| POST | `/pendaftaran/daftar` | Daftar via link affiliate |
| POST | `/pendaftaran/daftar-langsung` | Daftar langsung |
| GET | `/affiliate-link/{kode}` | Get link affiliate by kode |
| GET | `/products` | List produk aktif |
| POST | `/coupons/validate` | Validasi kupon |

### 7.2 Auth Required (Sanctum)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/auth/user` | Get current user |
| POST | `/auth/logout` | Logout |
| GET | `/pendaftar` | List pendaftar (admin) |
| POST | `/pendaftar/{id}/approve` | Approve pendaftar |
| POST | `/pendaftar/{id}/reject` | Reject pendaftar |
| POST | `/pendaftar/{id}/verify-payment` | Verify payment |
| GET | `/pendaftar/pending-count` | Count pendaftar pending |
| GET | `/affiliate-dashboard` | Dashboard affiliate |
| GET | `/siswa-dashboard` | Dashboard siswa |
| POST | `/siswa/profile` | Update profile siswa |
| GET | `/siswa/absensi-saya` | Absensi siswa |
| GET | `/siswa/nilai-saya/{batchId}` | Nilai siswa |
| POST | `/siswa/scan-qr` | Scan QR absensi |
| GET | `/guru-dashboard` | Dashboard guru |
| GET/POST | `/guru/kelas-saya` | Kelas guru |
| GET/POST | `/guru/absen-masuk/pulang` | Absensi guru |
| GET | `/guru/data-siswa/{kelasId}` | Data siswa per kelas |
| GET/POST | `/guru/penilaian-harian` | Penilaian harian |
| GET | `/guru/profile` | Profile guru |
| GET | `/guru/batch-dan-nilai` | Batch & nilai |
| GET | `/affiliates/stats` | Statistik affiliate (dgn komisi) |
| CRUD | `/products`, `/product-categories` | Produk & kategori |
| CRUD | `/affiliate-links`, `/coupons` | Affiliate & kupon |
| CRUD | `/batches` | Batch |
| CRUD | `/divisi`, `/cabang`, `/shift`, `/karyawan`, `/user` | HR data |
| CRUD | `/siswa`, `/guru`, `/kelas-sensei` | Akademik data |
| CRUD | `/absensi-siswa`, `/absensi-karyawan/*` | Absensi |
| GET | `/rekap-absensi`, `/penilaian`, `/data-agenda` | Reports |
| GET/POST | `/pengaturan-shift` | Pengaturan shift mode |
| GET/POST | `/company-profile` | Profil perusahaan |
| CRUD | `/biaya-kategori` | Kategori biaya |
| CRUD | `/batch-biaya/{batchId}` | Biaya per batch |
| CRUD | `/pembayaran-item/{pendaftarId}` | Item pembayaran |
| GET | `/pembayaran`, `/pembayaran-pending` | Pembayaran |
| GET | `/rekap-per-batch` | Rekap per batch |

### 7.3 LMS Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| **Siswa** | | |
| GET | `/lms/courses` | List course (by batch/level) |
| GET | `/lms/courses/{id}` | Detail course + lessons |
| GET | `/lms/lessons/{id}` | Detail lesson |
| POST | `/lms/lessons/{id}/complete` | Tandai selesai |
| DELETE | `/lms/lessons/{id}/complete` | Batalkan |
| **Admin** | | |
| GET | `/admin/lms/courses` | List semua course |
| POST | `/admin/lms/courses` | Buat course |
| POST | `/admin/lms/courses/{id}` | Update course |
| DELETE | `/admin/lms/courses/{id}` | Hapus course |
| GET | `/admin/lms/courses/{courseId}/lessons` | List lesson |
| POST | `/admin/lms/lessons` | Buat lesson |
| POST | `/admin/lms/lessons/{id}` | Update lesson |
| DELETE | `/admin/lms/lessons/{id}` | Hapus lesson |
| POST | `/admin/lms/upload` | Upload file |
| POST | `/admin/lms/files` | Attach file ke course |
| DELETE | `/admin/lms/files/{id}` | Hapus file |
| GET | `/admin/lms/courses/{courseId}/files` | List file |

### 7.4 Keuangan Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/pengeluaran/kategori` | List kategori |
| POST | `/pengeluaran/kategori` | Buat kategori |
| PUT | `/pengeluaran/kategori/{id}` | Update kategori |
| DELETE | `/pengeluaran/kategori/{id}` | Hapus kategori |
| GET | `/pengeluaran` | List pengeluaran |
| POST | `/pengeluaran` | Buat pengeluaran |
| GET | `/pengeluaran/dashboard` | Dashboard keuangan |
| GET | `/pengeluaran/rekap` | Rekap tahunan |
| GET | `/pengeluaran/{id}` | Detail pengeluaran |
| PUT | `/pengeluaran/{id}` | Update pengeluaran |
| DELETE | `/pengeluaran/{id}` | Hapus pengeluaran |

### 7.5 Admin Cabang Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/admin-cabang/dashboard` | Dashboard cabang |
| GET | `/admin-cabang/pendaftar` | List pendaftar cabang |
| GET | `/admin-cabang/tagihan` | Tagihan cabang |
| GET | `/admin-cabang/kandidat` | Kandidat cabang |
| GET | `/admin-cabang/batches` | Batch cabang |
| GET | `/admin-cabang/pending-count` | Jumlah pending |
| GET | `/admin-cabang/pending-pembayaran` | Pembayaran pending |
| GET | `/admin-cabang/rekap-per-batch` | Rekap per batch |
| GET | `/admin-cabang/my-branches` | Cabang saya |
| GET | `/admin-cabang/pembayaran-item/{id}` | Item pembayaran |
| POST | `/admin-cabang/pembayaran-item/{id}` | Tambah pembayaran |
| POST | `/admin-cabang/pendaftar/{id}/verify-payment` | Verifikasi bayar |
| GET | `/admin-cabang/pendaftar/{id}/invoice` | Invoice |
| GET | `/admin-cabang/pendaftar/{id}/riwayat-pembayaran` | Riwayat bayar |
| POST | `/admin-cabang/pendaftar/{id}/bayar-manual` | Bayar manual |
| POST | `/admin-cabang/pendaftar/{id}/update-kandidat` | Update kandidat |
| GET | `/admin-cabang/biaya-kategori` | Kategori biaya |
| GET | `/admin-cabang/batch-biaya/{batchId}` | Biaya per batch |

---

## 8. Alur Penting

### 8.1 Alur Pendaftaran Kandidat

```
User buka link affiliate → Form pendaftaran (multi-step)
  Step 1: Data Diri (nama, email, password, batch)
  Step 2: Kontak (telepon, alamat)
  Step 3: Pembayaran (nominal, kupon, bukti upload)
    ↓
System: validasi kupon → upload bukti → buat User (KANDIDAT) → buat Pendaftar (pending)
    ↓
Admin: lihat di /pendaftar → approve atau reject
    ↓
Approve → System: buat record Siswa → catat KomisiAffiliate
    ↓
Siswa dapat login ke dashboard siswa
```

### 8.2 Alur Affiliate

```
Admin buat link affiliate (pilih affiliate + produk)
  → Generate kode unik
  → Copy link (http://localhost:5173/daftar/{kode})
    ↓
Affiliate sebarkan link → orang daftar via link
    ↓
Admin approve pendaftar → komisi otomatis tercatat (pending)
    ↓
Affiliate lihat komisi di dashboard affiliate (pending & paid)
```

### 8.3 Alur Absensi Karyawan

```
Karyawan login → dashboard mobile → klik Absen
  → Cek shift (jadwal tetap/rotating)
  → Geofencing validasi radius cabang
  → Face recognition / QR scan / foto
  → Check-in (jam_masuk tercatat)
    ↓
Check-out → jam_keluar tercatat
    ↓
Status otomatis: HADIR/TELAT (berdasarkan jam_masuk vs jam_shift)
```

### 8.4 Alur Penilaian

```
Admin setup:
  → Buat AssessmentCategory per level
  → Buat AssessmentComponent per kategori
    ↓
Guru (via mobile dashboard):
  → Pilih kelas → lihat daftar siswa
  → Input nilai per komponen
  → Simpan StudentAssessment
    ↓
Admin lihat matrix penilaian:
  → Filter batch + level + tanggal
  → Lihat total per siswa + per komponen
```

### 8.5 Alur LMS

```
Admin buat Course (nama, deskripsi, gambar, batch, level)
  → Tambah Lesson per Course (judul, konten, urutan)
  → Upload file lampiran (opsional)
    ↓
Siswa login → Dashboard Siswa → LMS
  → Lihat daftar Course (berdasarkan batch/level)
  → Buka Course → lihat daftar Lesson
  → Buka Lesson → baca materi
  → Klik "Selesai" → progress tercatat
    ↓
Admin monitor progress siswa via Rekap Siswa
```

### 8.6 Alur Keuangan

```
Admin/HR akses Keuangan:
  → Dashboard: lihat grafik pengeluaran bulanan, perbandingan vs pendapatan
  → Kelola Kategori Pengeluaran (tambah/hapus)
  → Input Pengeluaran (judul, nominal, kategori, tanggal, upload bukti)
    ↓
Rekap tahunan: lihat total per bulan
Dashboard: profit/loss = pendapatan (total pembayaran) - pengeluaran
```

---

## 9. Frontend Routing

### 9.1 Public Routes

| Path | Component | Deskripsi |
|------|-----------|-----------|
| `/login` | Login | Halaman login |
| `/forgot-password` | ForgotPassword | Lupa password |
| `/daftar/:kode` | DaftarAffiliate | Daftar via link affiliate |
| `/daftar-affiliate` | DaftarAffiliateBaru | Register affiliate baru |
| `/daftar-program` / `/:id` | DaftarProgram | Daftar langsung program |

### 9.2 Admin Routes (MANAGER, HR, ADMIN)

| Path | Component | Menu |
|------|-----------|------|
| `/` | DashboardHome | Pusat Dashboard |
| `/dashboard-absensi` | DashboardAbsensi | Dashboard absensi |
| `/dashboard-akademik` | DashboardAkademik | Dashboard akademik |
| `/dashboard-kandidat` | DashboardKandidat | Dashboard kandidat |
| `/dashboard-management` | DashboardManagement | Dashboard management |
| `/dashboard-keuangan` | DashboardKeuangan | Dashboard keuangan |
| `/data-kandidat` | DataKandidat | Manajemen Kandidat → Data Kandidat |
| `/pendaftar` | Pendaftar | Manajemen Kandidat → Pendaftaran |
| `/pendaftar/:id/invoice` | InvoicePendaftar | Manajemen Kandidat → Invoice |
| `/data-matching-job` | DataMatchingJob | Manajemen Kandidat → Matching Job |
| `/tagihan` | Tagihan | Manajemen Kandidat → Tagihan |
| `/pembayaran` | Pembayaran | Manajemen Kandidat → Pembayaran |
| `/rekap-per-batch` | RekapBatch | Manajemen Kandidat → Rekap Per Batch |
| `/affiliate-dashboard` | AffiliateDashboard | Affiliate Dashboard (HR, MANAGER disembunyikan) |
| `/data-affiliate` | DataAffiliate | Program & Affiliate → Data Affiliate |
| `/data-product` | DataProduct | Program & Affiliate → Program |
| `/data-coupon` | DataCoupon | Program & Affiliate → Data Coupon |
| `/data-biaya-kategori` | DataBiayaKategori | Program & Affiliate → Kategori Bayar |
| `/guru` | Guru | Akademik → Data Guru |
| `/kelas-sensei` | KelasSensei | Akademik → Kelas Sensei |
| `/jadwal-level` | JadwalLevel | Akademik → Jadwal Level |
| `/siswa` | Siswa | Akademik → Data Siswa |
| `/batches` | Batches | Akademik → Batch |
| `/rekap-siswa` | RekapSiswa | Akademik → Rekap Siswa |
| `/penilaian` | Penilaian | Akademik → Penilaian Siswa |
| `/lms` | DataCourse | Akademik → LMS |
| `/lms/:courseId/lessons` | DataLesson | Akademik → LMS → Lessons |
| `/data-kehadiran` | DataKehadiran | Manajemen Absensi → Kehadiran |
| `/data-kehadiran-khusus` | DataKehadiranKhusus | Manajemen Absensi → Kehadiran Khusus |
| `/izin-cuti` | IzinCuti | Manajemen Absensi → Izin & Cuti |
| `/approval-lembur` | ApprovalLembur | Manajemen Absensi → Approval Lembur |
| `/hari-libur` | HariLibur | Manajemen Absensi → Hari Libur |
| `/rekap-absensi` | RekapAbsensi | Manajemen Absensi → Rekap Absensi |
| `/rekap-jadwal-shift` | RekapJadwalShift | Manajemen Absensi → Rekap Jadwal Shift |
| `/monitoring-lokasi` | MonitoringLokasi | Manajemen Absensi → Monitoring Lokasi |
| `/data-agenda` | DataAgenda | Manajemen Absensi → Data Agenda |
| `/data-kehadiran-sensei` | DataKehadiranSensei | Manajemen Absensi → Kehadiran Sensei |
| `/rekap-kehadiran-sensei` | RekapKehadiranSensei | Manajemen Absensi → Rekap Kehadiran Sensei |
| `/absensi-siswa` | AbsensiSiswa | Manajemen Absensi → Absensi Siswa |
| `/absensi-guru-shift` | AbsensiGuruShift | Manajemen Absensi → Absensi Guru Shift |
| `/absensi-guru-cabang` | AbsensiGuruCabang | Manajemen Absensi → Absensi Guru Cabang |
| `/karyawan` | Karyawan | HR & Operasional → Data Karyawan |
| `/divisi` | Divisi | HR & Operasional → Divisi |
| `/cabang` | Cabang | HR & Operasional → Cabang |
| `/shift` | Shift | HR & Operasional → Shift Kerja |
| `/jadwal-shift` | JadwalShift | HR & Operasional → Jadwal Shift |
| `/pengaturan-shift` | PengaturanShift | HR & Operasional → Pengaturan Shift |
| `/daftar-user` | DaftarUser | HR & Operasional → Daftar User |
| `/pengaturan-perusahaan` | CompanyProfile | HR & Operasional → Profil Perusahaan |
| `/pengaturan` | Pengaturan | HR & Operasional → Manajemen Akun |
| `/kategori-pengeluaran` | DataKategoriPengeluaran | Keuangan → Kategori Pengeluaran |
| `/pengeluaran` | DataPengeluaran | Keuangan → Data Pengeluaran |
| `/ai-chat` | AiChat | AI & Automasi → AI Chat |
| `/pengaturan-wa` | PengaturanWa | AI & Automasi → Notifikasi WA |

### 9.3 Role-Specific Routes

| Path | Role | Component |
|------|------|-----------|
| `/affiliate-dashboard` | AFFILIATE | AffiliateDashboard |
| `/siswa-dashboard` | KANDIDAT | SiswaDashboard |
| `/siswa-dashboard/data-diri` | KANDIDAT | DataDiri |
| `/siswa-dashboard/absensi` | KANDIDAT | AbsensiSaya |
| `/siswa-dashboard/pembayaran` | KANDIDAT | PembayaranSiswa |
| `/siswa-dashboard/lms` | KANDIDAT | LMS |
| `/guru-dashboard` | GURU | GuruDashboard |
| `/guru-data-siswa` | GURU | GuruDataSiswa |
| `/guru-profil` | GURU | GuruProfil |
| `/dashboard-karyawan` | KARYAWAN | KaryawanDashboard |
| `/riwayat-absensi-karyawan` | KARYAWAN | RiwayatAbsensiKaryawan |
| `/pengajuan-izin` | KARYAWAN | PengajuanIzin |
| `/lembur-karyawan` | KARYAWAN | LemburKaryawan |
| `/jadwal-karyawan` | KARYAWAN | JadwalKaryawan |
| `/profil-karyawan` | KARYAWAN | ProfilKaryawan |
| `/admin-cabang` | ADMIN_CABANG | AdminCabangDashboard |
| `/admin-cabang/kandidat` | ADMIN_CABANG | AdminCabangDataKandidat |
| `/admin-cabang/pendaftar` | ADMIN_CABANG | AdminCabangPendaftaran |
| `/admin-cabang/tagihan` | ADMIN_CABANG | AdminCabangTagihan |
| `/admin-cabang/rekap-per-batch` | ADMIN_CABANG | RekapBatch |
