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
   - [6.5 Absensi & Kehadiran](#65-absensi--kehadiran)
   - [6.6 HR & Operasional](#66-hr--operasional)
   - [6.7 AI & Automasi](#67-ai--automasi)
7. [API Endpoints](#7-api-endpoints)
8. [Alur Penting](#8-alur-penting)
9. [Frontend Routing](#9-frontend-routing)

---

## 1. Gambaran Umum

SIM Mendunia adalah sistem informasi manajemen terpadu untuk lembaga pelatihan dan penempatan kerja luar negeri (Jepang & Korea Selatan). Sistem mencakup manajemen pendaftaran kandidat, program affiliate, akademik (kelas, guru, siswa), absensi (karyawan, sensei, siswa), HR & operasional, serta AI Chat.

---

## 2. Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Backend** | Laravel 11 + PHP 8.2 |
| **Database** | MySQL / MariaDB |
| **Auth** | Laravel Sanctum (token-based) |
| **Styling** | Tailwind CSS |
| **Charts** | Chart.js + react-chartjs-2 |
| **Maps** | Leaflet (react-leaflet) |
| **Icons** | Lucide React |
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
    DashboardLayout.tsx  - Layout admin (Sidebar + Header)
    AffiliateLayout.tsx  - Layout affiliate
    GuruLayout.tsx       - Layout guru
    SiswaLayout.tsx      - Layout siswa/kandidat
  components/
    Sidebar.tsx          - Navigasi sidebar admin
    Header.tsx           - Top navbar admin
    AffiliateSidebar.tsx - Sidebar affiliate
    SiswaSidebar.tsx     - Sidebar siswa
    KaryawanBottomNav.tsx - Bottom nav mobile
    LocationTracker.tsx  - Peta Leaflet
  pages/
    Login.tsx
    AiChat.tsx
    SiswaDashboard.tsx
    Dashboard/            - Halaman dashboard
    Absensi/              - Modul absensi
    Akademik/             - Akademik dashboard
    Karyawan/             - Modul HR/karyawan
    Sensei/               - Kelola guru & kelas sensei
    Siswa/                - Manajemen siswa
    Pendaftaran/          - Pendaftaran kandidat
    Affiliate/            - Program & affiliate
    Pengaturan/           - Settings & user management
    Guru/                 - Mobile dashboard guru
```

### 3.2 Struktur Backend

```
backend/app/
  Http/Controllers/
    AuthController.php        - Login/logout/register API
    PendaftaranController.php - Pendaftaran, pembayaran, approve/reject
    ProductController.php     - CRUD produk/program
    AffiliateLinkController.php  - CRUD link affiliate
    DashboardController.php   - Dashboard admin utama
    SiswaDashboardController.php
    GuruDashboardController.php
    AffiliateDashboardController.php
    Absensi/
      AbsensiController.php     - Absensi karyawan
      AbsensiSiswaController.php
      KehadiranController.php
      KehadiranKhususController.php
      KehadiranSenseiController.php
      RekapKehadiranSenseiController.php
      RekapJadwalShiftController.php
      JadwalLevelController.php
    Api/
      CouponController.php     - CRUD kupon
    (controllers lain untuk Karyawan, Divisi, Cabang, Shift, dll)
  Models/
    User, Product, AffiliateLink, Pendaftar, KomisiAffiliate,
    Pembayaran, Coupon, Siswa, Batch, Kelas, KelasSensei,
    Absensi, AbsensiSiswa, AbsensiSensei, AbsensiKhusus,
    Shift, ShiftJadwal, Cabang, Divisi, Izin, Lembur,
    HariLibur, Guru, Penilaian, AssessmentCategory,
    AssessmentComponent, StudentAssessment,
    DailyAssessmentStatus, Agenda, dll.
```

---

## 4. Role & Hak Akses

| Role | Akses |
|------|-------|
| **ADMIN** | Semua fitur admin |
| **MANAGER** | Semua fitur admin (kecuali Affiliate Dashboard) |
| **HR** | Semua fitur admin (kecuali Affiliate Dashboard) |
| **KARYAWAN** | Halaman mobile: dashboard, absensi, izin, lembur, jadwal, profil |
| **GURU** | Mobile dashboard guru: kelas, absensi, penilaian harian |
| **KANDIDAT** | Dashboard siswa: profil, absensi, pembayaran, LMS |
| **AFFILIATE** | Dashboard affiliate: link, pendaftar, komisi |

Rule di frontend (`App.tsx`):
- Route `/` dan admin lainnya diblokir untuk `KANDIDAT`, `AFFILIATE`, `KARYAWAN`, `GURU`
- Route `/affiliate-dashboard` hanya untuk `AFFILIATE`
- Route `/siswa-dashboard/*` hanya untuk `KANDIDAT`
- Route `/guru-dashboard/*` hanya untuk `GURU`
- Route `/dashboard-karyawan/*` khusus `KARYAWAN`

---

## 5. Struktur Database

### 5.1 Core Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts (all roles) |
| `products` | Program/produk (nama, harga, komisi) |
| `affiliate_links` | Link affiliate per produk (kode unik, views, pendaftar_count) |
| `pendaftar` | Pendaftar (dari link affiliate atau direct) |
| `komisi_affiliates` | Komisi yang dihasilkan per pendaftar di-approve |
| `pembayaran` | Riwayat pembayaran pendaftar |
| `coupons` | Kupon diskon |
| `batches` | Batch/angkatan |
| `kelas_sensei` | Kelas yang diajar sensei (guru) |
| `siswas` | Data siswa |
| `gurus` | Data guru |
| `kelas` | Master kelas |

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

**Komisi:**
- Komisi dibuat otomatis saat admin approve pendaftar yang berasal dari link affiliate
- Jumlah komisi = `product.komisi`
- Status komisi: `pending` (default), `paid`
- Dashboard affiliate menampilkan total komisi pending & paid

**Kupon Diskon:**
- CRUD kupon: tipe (persen/nominal), nilai, min_pembelian, maks_penggunaan, masa berlaku
- Validasi kupon: cek status, tanggal berlaku, kuota, product_id, min_pembelian

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

### 6.5 Absensi & Kehadiran

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

### 6.6 HR & Operasional

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
- CRUD user (ADMIN, MANAGER, HR, AFFILIATE, KANDIDAT, GURU, KARYAWAN)
- Toggle status aktif/nonaktif
- Role-based access control

**Hari Libur:**
- Kelola hari libur + auto-detect weekend

**Approval:**
- Izin/cuti dengan approve/reject + notifikasi WA
- Lembur dengan approve/reject

**Rekap:**
- Rekap absensi (filter cabang, divisi, date)
- Rekap jadwal shift (kalender bulanan per user)
- Export Excel, PDF

### 6.7 AI & Automasi

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
| GET | `/guru-dashboard` | Dashboard guru |
| GET | `/affiliates/stats` | Statistik affiliate (dgn komisi) |
| CRUD | `/products`, `/affiliate-links`, `/coupons`, `/batches` | Master data |
| CRUD | `/divisi`, `/cabang`, `/shift`, `/karyawan`, `/user` | HR data |
| CRUD | `/siswa`, `/guru`, `/kelas-sensei` | Akademik data |
| CRUD | `/absensi-siswa`, `/absensi-karyawan/*` | Absensi |
| GET | `/rekap-absensi`, `/penilaian`, `/data-agenda` | Reports |

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

---

## 9. Frontend Routing

### 9.1 Public Routes

| Path | Component | Deskripsi |
|------|-----------|-----------|
| `/login` | Login | Halaman login |
| `/daftar/:kode` | DaftarAffiliate | Daftar via link affiliate |
| `/daftar-affiliate` | DaftarAffiliateBaru | Register affiliate baru |
| `/daftar-program` / `/:id` | DaftarProgram | Daftar langsung program |

### 9.2 Admin Routes (MANAGER, HR, ADMIN)

| Path | Component | Menu |
|------|-----------|------|
| `/` | DashboardHome | Dashboard utama |
| `/dashboard-absensi` | Dashboard | Dashboard absensi |
| `/dashboard-akademik` | DashboardAkademik | Dashboard akademik |
| `/dashboard-kandidat` | DashboardKandidat | Dashboard kandidat |
| `/dashboard-management` | DashboardManagement | Dashboard management |
| `/data-kandidat` | DataKandidat | Manajemen Kandidat → Data Kandidat |
| `/pendaftar` | Pendaftar | Manajemen Kandidat → Pendaftaran |
| `/pendaftar/:id/invoice` | InvoicePendaftar | Manajemen Kandidat → Invoice |
| `/data-matching-job` | DataMatchingJob | Manajemen Kandidat → Matching Job |
| `/tagihan` | Tagihan | Manajemen Kandidat → Tagihan |
| `/pembayaran` | Pembayaran | Manajemen Kandidat → Pembayaran |
| `/affiliate-dashboard` | AffiliateDashboard | Affiliate Dashboard (untuk HR, MANAGER disembunyikan) |
| `/data-affiliate` | DataAffiliate | Program & Affiliate → Data Affiliate |
| `/data-product` | DataProduct | Program & Affiliate → Program |
| `/data-coupon` | DataCoupon | Program & Affiliate → Data Coupon |
| `/guru` | Guru | Akademik → Data Guru |
| `/kelas-sensei` | KelasSensei | Akademik → Kelas Sensei |
| `/jadwal-level` | JadwalLevel | Akademik → Jadwal Level |
| `/siswa` | Siswa | Akademik → Data Siswa |
| `/batches` | Batches | Akademik → Batch |
| `/rekap-siswa` | RekapSiswa | Akademik → Rekap Siswa |
| `/penilaian` | Penilaian | Akademik → Penilaian Siswa |
| `/absensi` | AbsensiKaryawan | Manajemen Absensi → Dashboard Absensi (telah dihapus) |
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
| `/absensi-guru-shift` | AbsensiGuruShift | (Manajemen Shift) |
| `/absensi-guru-cabang` | AbsensiGuruCabang | (Manajemen Cabang) |
| `/karyawan` | Karyawan | HR & Operasional → Data Karyawan |
| `/divisi` | Divisi | HR & Operasional → Divisi |
| `/cabang` | Cabang | HR & Operasional → Cabang |
| `/shift` | Shift | HR & Operasional → Shift Kerja |
| `/jadwal-shift` | JadwalShift | HR & Operasional → Jadwal Shift |
| `/daftar-user` | DaftarUser | HR & Operasional → Daftar User |
| `/pengaturan-shift` | PengaturanShift | HR & Operasional → Pengaturan Shift |
| `/pengaturan` | Pengaturan | HR & Operasional → Manajemen Akun |
| `/ai-chat` | AiChat | AI & Automasi → AI Chat |
| `/pengaturan-wa` | PengaturanWa | AI & Automasi → Notifikasi WA |

### 9.3 Role-Specific Routes

| Path | Role | Component |
|------|------|-----------|
| `/affiliate-dashboard` | AFFILIATE | AffiliateDashboard |
| `/siswa-dashboard` | KANDIDAT | SiswaDashboard |
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
