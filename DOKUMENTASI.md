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
   - [6.11 Manajemen Proyek](#611-manajemen-proyek)
   - [6.12 Evaluasi & Raport](#612-evaluasi--raport)
   - [6.13 Notifikasi & Template](#613-notifikasi--template)
7. [API Endpoints](#7-api-endpoints)
8. [Alur Penting](#8-alur-penting)
9. [Frontend Routing](#9-frontend-routing)

---

## 1. Gambaran Umum

SIM Mendunia adalah sistem informasi manajemen terpadu untuk lembaga pelatihan dan penempatan kerja luar negeri (Jepang & Korea Selatan). Sistem mencakup manajemen pendaftaran kandidat, program affiliate, akademik (kelas, guru, siswa), LMS (Learning Management System), absensi (karyawan, sensei, siswa), HR & operasional, keuangan, admin cabang, manajemen proyek, evaluasi & raport, serta AI Chat.

---

## 2. Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | React 19 + TypeScript + Vite |
| **Backend** | Laravel 12 + PHP 8.2 |
| **Database** | MySQL / MariaDB |
| **Auth** | Laravel Sanctum (cookie-based session) |
| **Styling** | Tailwind CSS |
| **Charts** | Chart.js + react-chartjs-2 |
| **Maps** | Leaflet (react-leaflet) |
| **Icons** | Lucide React, Phosphor React |
| **HTTP Client** | Axios |
| **AI Chat** | Groq API |
| **WA Gateway** | Fonnte (WhatsApp API) |
| **Queue** | Laravel Queue (database driver) |
| **Scheduler** | Laravel Cron |

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
    Verifikasi.tsx         - Verifikasi pembayaran publik
    SyaratKetentuan.tsx    - Syarat & ketentuan
    LogLogin.tsx           - Log login user
    AiChat.tsx
    SiswaDashboard.tsx
    Bayar/
      Bayar.tsx            - Halaman pembayaran publik
    Dashboard/
      Dashboard.tsx
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
      DashboardAkademik.tsx    - Dashboard akademik
      DataAgenda.tsx           - Data agenda/event
      DataMatchingJob.tsx      - Matching job
      LMS.tsx                  - LMS (student view)
      DataCourse.tsx           - Kelola course (admin)
      DataLesson.tsx           - Kelola lesson per course (admin)
      Raport.tsx               - Raport siswa
    Karyawan/
      Karyawan.tsx             - Data karyawan
      KaryawanDashboard.tsx    - Dashboard karyawan (mobile)
      Divisi.tsx               - Divisi
      Cabang.tsx               - Cabang
      Shift.tsx                - Shift
      JadwalShift.tsx          - Jadwal shift
      PengaturanShift.tsx      - Pengaturan shift mode
      DaftarUser.tsx           - User management
      IzinCuti.tsx             - Izin & cuti
      ApprovalLembur.tsx       - Approval lembur
      HariLibur.tsx            - Hari libur
      RekapJadwalShift.tsx     - Rekap jadwal shift
      MonitoringLokasi.tsx     - Monitoring lokasi (Leaflet)
      RiwayatAbsensiKaryawan.tsx - Riwayat absensi (mobile)
      PengajuanIzin.tsx        - Pengajuan izin (mobile)
      LemburKaryawan.tsx       - Lembur (mobile)
      JadwalKaryawan.tsx       - Jadwal (mobile)
      ProfilKaryawan.tsx       - Profil (mobile)
    Sensei/
      Guru.tsx                 - Data guru
      KelasSensei.tsx          - Kelas sensei
      JadwalLevel.tsx          - Jadwal level per batch
    Siswa/
      Siswa.tsx                - Data siswa
      Batches.tsx              - Batch/angkatan
      RekapSiswa.tsx           - Rekap siswa
      RekapBatch.tsx           - Rekap per batch (biaya)
      Penilaian.tsx            - Penilaian siswa
      Tagihan.tsx              - Tagihan
      Pembayaran.tsx           - Pembayaran
      DataDiri.tsx             - Data diri siswa (mobile)
      PembayaranSiswa.tsx      - Pembayaran siswa (mobile)
      SiswaNilai.tsx           - Nilai siswa (mobile)
      EvaluasiInstruktur.tsx   - Evaluasi instruktur
    Pendaftaran/
      Pendaftar.tsx            - List pendaftar (admin)
      PendaftarDetail.tsx      - Detail pendaftar
      DataKandidat.tsx         - Data kandidat
      InvoicePendaftar.tsx     - Invoice detail
      DaftarAffiliate.tsx      - Daftar via link affiliate
      DaftarAffiliateBaru.tsx  - Register affiliate baru
      DaftarProgram.tsx        - Daftar langsung program
      CheckoutBerhasil.tsx     - Checkout berhasil
      KonfirmasiPembayaran.tsx - Konfirmasi pembayaran
    Affiliate/
      DataAffiliate.tsx        - Data affiliate
      DataProduct.tsx          - Data produk/program
      DataCoupon.tsx           - Data kupon
      DataBiayaKategori.tsx    - Kategori biaya
      AffiliateDashboard.tsx   - Dashboard affiliate
      Profile.tsx              - Profile affiliate
      ClosingPasukan.tsx       - Closing pasukan
      DataPencairanKomisi.tsx  - Pencairan komisi
      DataNotifikasi.tsx       - Log notifikasi
      DataNotifikasiSetting.tsx - Setting notifikasi
      DataTemplateNotifikasi.tsx - Template notifikasi
    Keuangan/
      DashboardKeuangan.tsx       - Dashboard keuangan
      DataKategoriPengeluaran.tsx - Kategori pengeluaran
      DataPengeluaran.tsx         - Data pengeluaran
    Pengaturan/
      Pengaturan.tsx            - Manajemen akun
      PengaturanWa.tsx          - Notifikasi WA
      CompanyProfile.tsx        - Profil perusahaan
      PengaturanPembayaran.tsx  - Pengaturan pembayaran
    Guru/
      GuruDashboard.tsx         - Dashboard guru (mobile)
      GuruDataSiswa.tsx         - Data siswa guru
      GuruProfil.tsx            - Profil guru
      GuruLMS.tsx               - LMS guru
      GuruLMSAssignment.tsx     - Assignment guru
      GuruPenilaianHarian.tsx   - Penilaian harian guru
    AdminCabang/
      AdminCabangDashboard.tsx         - Dashboard admin cabang
      AdminCabangKandidat.tsx          - Data kandidat cabang
      AdminCabangPendaftaran.tsx       - Pendaftaran cabang
      AdminCabangTagihan.tsx           - Tagihan cabang
      AdminCabangPengeluaran.tsx       - Pengeluaran cabang
      AdminCabangKategoriPengeluaran.tsx - Kategori pengeluaran cabang
```

### 3.2 Struktur Backend

```
backend/app/
  Http/Controllers/
    AuthController.php                  - Login/logout/register API
    PendaftaranController.php           - Pendaftaran, pembayaran, approve/reject
    ProductController.php               - CRUD produk/program
    ProductCategoryController.php       - CRUD kategori produk
    AffiliateLinkController.php         - CRUD link affiliate
    DashboardController.php             - Dashboard admin utama
    SiswaDashboardController.php        - Dashboard siswa
    GuruDashboardController.php         - Dashboard guru
    AffiliateDashboardController.php    - Dashboard affiliate
    AdminCabangController.php           - Admin cabang (branch admin)
    CompanyProfileController.php        - Profil perusahaan
    LmsController.php                   - LMS (courses, lessons, progress)
    PengeluaranController.php           - Keuangan (pengeluaran, kategori)
    BiayaController.php                 - Biaya & pembayaran item
    KaryawanController.php              - CRUD karyawan
    DivisiController.php                - CRUD divisi
    CabangController.php                - CRUD cabang
    ShiftController.php                 - CRUD shift
    ShiftJadwalController.php           - Jadwal shift
    PengaturanShiftController.php       - Mode shift
    JadwalKerjaController.php           - Jadwal kerja
    KelasController.php                 - CRUD kelas
    GuruController.php                  - CRUD guru
    SiswaController.php                 - CRUD siswa
    IzinController.php                  - Izin/cuti
    LemburController.php                - Lembur
    HariLiburController.php             - Hari libur
    AgendaController.php                - Agenda/event
    CalendarController.php              - Kalender
    MonitoringController.php            - Monitoring lokasi
    ReportController.php                - Report/export
    PenilaianController.php             - Penilaian siswa
    PengaturanController.php            - Pengaturan umum
    BatchController.php                 - CRUD batch
    AiChatController.php                - AI Chat (Groq)
    TaskController.php                  - Manajemen tugas
    TaskAssignmentsController.php       - Assign tugas
    ProjectsController.php              - CRUD proyek
    ProjectListsController.php          - List proyek
    ProjectActivitiesController.php     - Aktivitas proyek
    UserController.php                  - CRUD user
    ProfileController.php               - Profile user
    PaymentController.php               - Pembayaran
    RaportController.php                - Raport
    WaWebhookController.php             - Webhook WA
    WaSettingController.php             - Setting WA
    WaNotificationController.php        - Notifikasi WA
    NotificationTemplateController.php  - Template notifikasi
    Absensi/
      AbsensiController.php               - Absensi karyawan
      AbsensiSiswaController.php          - Absensi siswa
      SenseiController.php                - Absensi sensei
      KehadiranController.php             - Kehadiran
      KehadiranKhususController.php       - Kehadiran khusus (timer)
      KehadiranSenseiController.php       - Kehadiran sensei
      RekapController.php                 - Rekap absensi
      RekapJadwalShiftController.php      - Rekap jadwal shift
      RekapKehadiranSenseiController.php  - Rekap kehadiran sensei
      JadwalLevelController.php           - Jadwal level
    Api/
      CouponController.php              - CRUD kupon
      LoginLogController.php            - Log login
    Admin/
      Controller.php                    - Base admin controller
      AgendaController.php              - Agenda admin

  Models/
    User, Siswa, Guru, Kelas, KelasSensei, Batch, Divisi, Cabang,
    Shift, ShiftJadwal, JadwalKerja, PengaturanShift,
    Absensi, AbsensiSiswa, AbsensiSensei, AbsensiKhusus,
    HariLibur, Izin, IzinApproval, WaIzinApproval, Lembur,
    Agenda, Task, TaskAssignments, Projects, ProjectLists, ProjectActivities,
    Penilaian, PenilaianSetting, AssessmentCategory, AssessmentComponent,
    StudentAssessment, DailyAssessmentStatus, StudentEvaluation, LevelEvaluation,
    Course, Lesson, CourseFile, LmsAssignment, LmsSubmission, LmsProgress,
    Product, ProductCategory, Pendaftar, Pembayaran, PembayaranItem,
    BatchBiaya, BiayaKategori, BatchKategoriDeadline,
    Pengeluaran, KategoriPengeluaran,
    AffiliateLink, KomisiAffiliate, KomisiTier, Coupon,
    CompanyProfile, BankAccount, PaymentSetting,
    LoginLog, WaNotification, WaReminderSetting,
    NotificationTemplate, NotificationSetting, EmailNotification

  Services/
    WhatsAppService.php           - Pengirim notifikasi WA
    IzinApprovalService.php       - Approval izin/cuti via WA
    GroqService.php               - AI Chat (Groq API)
    EmailService.php              - Pengirim email
    DatabaseInfoService.php       - Utility database

  Console/Commands/
    GenerateAlphaAbsensi.php      - Generate alpha absensi (23:55)
    GenerateAlphaSensei.php       - Generate alpha sensei (23:55)
    CekAbsenPulang.php            - Cek absen pulang (tiap 10 menit)
    ReminderAbsen.php             - Reminder absen (tiap menit)
    NotifKeterlambatan.php        - Notif keterlambatan (tiap 15 menit)
    NotifTidakAbsenPulang.php     - Notif tidak absen pulang (tiap jam)
    SendPaymentReminders.php      - Reminder pembayaran (harian 09:00)
    SyncSiswaFromPendaftar.php    - Sinkronisasi siswa dari pendaftar
    TestWaNotification.php        - Test notifikasi WA
```

---

## 4. Role & Hak Akses

| Role | Akses |
|------|-------|
| **ADMIN** | Semua fitur admin |
| **MANAGER** | Semua fitur admin (kecuali Affiliate Dashboard) |
| **HR** | Semua fitur admin (kecuali Affiliate Dashboard) |
| **ACCOUNTING** | Dashboard keuangan, pengeluaran, kategori pengeluaran |
| **ADMIN_CABANG** | Dashboard cabang: kandidat, pendaftaran, tagihan, rekap per batch, pengeluaran, akademik (guru, kelas, jadwal level, penilaian, raport, lms) |
| **KARYAWAN** | Halaman mobile: dashboard, absensi, izin, lembur, jadwal, profil |
| **GURU** | Mobile dashboard guru: kelas, absensi, penilaian harian, LMS, assignment |
| **KANDIDAT** | Dashboard siswa: profil, absensi, pembayaran, LMS, nilai, evaluasi instruktur |
| **AFFILIATE** | Dashboard affiliate: link, pendaftar, komisi, closing, pencairan, notifikasi |

Rule di frontend (`App.tsx`):
- Route `/` dan admin lainnya diblokir untuk `KANDIDAT`, `AFFILIATE`, `KARYAWAN`, `GURU`, `ADMIN_CABANG`, `ACCOUNTING`
- Route `/affiliate-dashboard` hanya untuk `AFFILIATE`
- Route `/siswa-dashboard/*` hanya untuk `KANDIDAT`
- Route `/guru-dashboard/*` hanya untuk `GURU`
- Route `/dashboard-karyawan/*` diblokir untuk `MANAGER`, `HR`, `ADMIN`, `GURU`, `ACCOUNTING`
- Route `/admin-cabang/*` hanya untuk `ADMIN_CABANG`
- Route `/dashboard-keuangan` untuk `ACCOUNTING`, `MANAGER`, `HR`, `ADMIN`

---

## 5. Struktur Database

### 5.1 Core Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts (all roles) |
| `products` | Program/produk (nama, harga, komisi, slug, batch_id) |
| `product_categories` | Kategori produk |
| `product_biaya_kategori` | Mapping produk ke kategori biaya |
| `affiliate_links` | Link affiliate per produk (kode unik, views, pendaftar_count) |
| `pendaftar` | Pendaftar (dari link affiliate atau direct) |
| `komisi_affiliates` | Komisi yang dihasilkan per pendaftar di-approve |
| `komisi_tiers` | Tier komisi per batch |
| `pembayaran` | Riwayat pembayaran pendaftar |
| `pembayaran_items` | Item pembayaran per pendaftar |
| `coupons` | Kupon diskon |
| `batches` | Batch/angkatan |
| `kelas_sensei` | Kelas yang diajar sensei (guru) |
| `siswas` | Data siswa (dengan level_status, cuti, status_kandidat) |
| `gurus` | Data guru |
| `kelas` | Master kelas |
| `company_profiles` | Profil perusahaan (dengan bank fields) |
| `bank_accounts` | Rekening perusahaan |
| `payment_settings` | Pengaturan pembayaran |
| `login_logs` | Log login user |

### 5.2 Absensi Tables

| Table | Purpose |
|-------|---------|
| `absensis` | Absensi karyawan |
| `absensi_siswas` | Absensi siswa (dengan checkout_statuses) |
| `absensi_sensei` | Absensi sensei |
| `absensi_khusus` | Absensi khusus (timer-based) |
| `shift_jadwal` | Jadwal shift karyawan (dengan is_libur) |
| `shifts` | Master shift |
| `jadwal_kerjas` | Jadwal kerja |
| `izins` | Izin/cuti |
| `izin_approvals` | Approval izin |
| `wa_izin_approvals` | Approval izin via WA |
| `lemburs` | Lembur |

### 5.3 Master Data Tables

| Table | Purpose |
|-------|---------|
| `divisis` | Divisi (dengan kode) |
| `cabangs` | Cabang/lokasi (dengan barcode, radius) |
| `hari_liburs` | Hari libur nasional |
| `jadwal_levels` | Jadwal level per batch |
| `assessment_categories` | Kategori penilaian |
| `assessment_components` | Sub-komponen penilaian |
| `student_assessments` | Nilai siswa per komponen |
| `daily_assessment_statuses` | Status penilaian harian per siswa |
| `agendas` | Agenda/event |
| `pengaturan_shifts` | Mode shift (fixed/rotating) |
| `penilaians` | Penilaian (legacy) |
| `penilaian_settings` | Setting penilaian |
| `student_evaluations` | Evaluasi siswa per level |
| `level_evaluations` | Evaluasi level |

### 5.4 LMS Tables

| Table | Purpose |
|-------|---------|
| `lms_courses` | Course/mata pelajaran |
| `lms_lessons` | Lesson per course (dengan file columns) |
| `lms_progress` | Progress belajar siswa per lesson |
| `lms_course_files` | File lampiran course |
| `lms_assignments` | Tugas per course |
| `lms_submissions` | Pengumpulan tugas siswa |

### 5.5 Keuangan Tables

| Table | Purpose |
|-------|---------|
| `kategori_pengeluaran` | Kategori pengeluaran |
| `pengeluaran` | Data pengeluaran (dengan cabang_id) |

### 5.6 Biaya & Pembayaran Tables

| Table | Purpose |
|-------|---------|
| `biaya_kategoris` | Kategori biaya (SPP, DLL, dsb, dengan parent_id, billing_settings, template_settings) |
| `batch_biayas` | Biaya per batch per kategori |
| `batch_kategori_deadlines` | Deadline pembayaran per kategori per batch |
| `pembayaran_items` | Item pembayaran per pendaftar |

### 5.7 Notifikasi Tables

| Table | Purpose |
|-------|---------|
| `notification_settings` | Pengaturan notifikasi |
| `notification_templates` | Template notifikasi WA/Email |
| `wa_notifications` | Log notifikasi WA |
| `wa_reminder_settings` | Pengaturan reminder WA |
| `email_notifications` | Log notifikasi email |

### 5.8 Proyek Tables

| Table | Purpose |
|-------|---------|
| `projects` | Proyek |
| `project_lists` | List/task group dalam proyek |
| `tasks` | Tugas |
| `task_assignments` | Assign tugas ke user |
| `project_activities` | Log aktivitas proyek |

---

## 6. Modul & Fitur

### 6.1 Authentication

- Login via email/password
- Login di-handle oleh `AuthController@loginApi` (Sanctum session-based)
- Auto-redirect berdasarkan role setelah login
- Register affiliate publik via `AuthController@registerAffiliate`
- Lupa password via `/forgot-password`
- Log login tercatat di `login_logs`
- Verifikasi pembayaran publik via token

### 6.2 Manajemen Kandidat & Pendaftaran

**Pendaftaran Publik:**
- `POST /pendaftaran/daftar` — Daftar via link affiliate (kode unik)
- `POST /pendaftaran/daftar-langsung` — Daftar langsung pilih produk
- Multi-step form: Data Diri → Kontak → Pembayaran (upload bukti + nominal)
- Validasi kupon diskon (persen/nominal) otomatis
- User baru dibuat dengan role `KANDIDAT`
- Pendaftaran default: `status_pendaftaran = pending`, `status_pembayaran = unpaid`
- File bukti bayar max 5MB
- Halaman publik: `/bayar/:id`, `/checkout-berhasil/:token`, `/konfirmasi-pembayaran`, `/verifikasi/:noInvoice`

**Manajemen Admin:**
- `GET /pendaftar` — List pendaftar dengan filter (search, status, batch, cabang)
- `POST /pendaftar/{id}/approve` — Setujui → buat record Siswa + catat KomisiAffiliate
- `POST /pendaftar/{id}/reject` — Tolak
- `POST /pendaftar/{id}/verify-payment` — Verifikasi pembayaran
- `POST /pendaftar/{id}/bayar` — Bayar manual
- `POST /pendaftar/{id}/set-lunas` — Set lunas
- `POST /pendaftar/{id}/batal-lunas` — Batal lunas
- `GET /pendaftar/{id}/invoice` — Invoice detail
- `DELETE /pendaftar/{id}` — Hapus
- Import massal kandidat via Excel
- Bulk delete, bulk update batch kandidat

### 6.3 Affiliate & Program

**Link Affiliate:**
- CRUD link affiliate: pilih affiliate + produk, auto-generate kode unik
- Setiap link punya: views, pendaftar_count, status aktif/nonaktif
- Copy link (http://localhost:5173/daftar/{kode})

**Produk/Program:**
- CRUD produk: nama, deskripsi, harga, komisi, slug, batch_id, status
- Kategori produk via `ProductCategoryController`
- Mapping kategori biaya ke produk

**Komisi:**
- Komisi dibuat otomatis saat admin approve pendaftar dari link affiliate
- Jumlah komisi = `product.komisi`
- Komisi tier per batch
- Status komisi: `pending` (default), `paid`
- Dashboard affiliate: total komisi pending & paid, closing pasukan, pencairan komisi

**Kupon Diskon:**
- CRUD kupon: tipe (persen/nominal), nilai, min_pembelian, maks_penggunaan, masa berlaku
- Validasi kupon: cek status, tanggal berlaku, kuota, product_id, min_pembelian

**Kategori Biaya:**
- CRUD kategori biaya (SPP, DLL, dsb) dengan parent_id (sub-kategori)
- Mapping kategori biaya ke produk
- Biaya per batch per kategori
- Deadline pembayaran per kategori per batch

### 6.4 Akademik

**Guru:**
- CRUD guru: assign user_id, nama, nip, mata_pelajaran, status
- Filter guru aktif di penilaian

**Kelas Sensei:**
- CRUD kelas: linked ke user (guru) + batch
- Kelas memiliki: nama, level, tanggal_mulai, tanggal_selesai, status

**Siswa:**
- CRUD siswa (multipart foto, KTP, ijazah, KK, dll)
- Import massal via Excel
- Import via AI
- Buatkan akun user otomatis (role KANDIDAT)
- Bulk delete, bulk update shift
- Level status: aktif, cuti, graduate, drop_out
- Status kandidat

**Batch:**
- CRUD batch: nama_batch, cabang_id, warna, kuota, status, is_penuh_manual
- Setiap batch bisa memiliki jadwal level (level 1-5+ dengan tanggal mulai/selesai)

**Jadwal Level:**
- Matrix jadwal per batch: tentukan tanggal_mulai & tanggal_selesai per level

**Penilaian Siswa:**
- Setting kategori penilaian per level (Speaking, Listening, dll)
- Masing-masing kategori memiliki sub-komponen
- Penilaian harian per siswa per komponen (skala 0-100)
- Matrix view: baris = siswa, kolom = tanggal + total komponen
- Rekap penilaian

**Invoice & Tagihan:**
- Invoice detail per pendaftar (print, download PDF)
- Riwayat pembayaran
- Rekap per batch dengan breakdown kategori biaya

**Raport:**
- Generate raport siswa per level
- Export PDF

**Evaluasi Instruktur:**
- Evaluasi instruktur oleh siswa per level

### 6.5 LMS (Learning Management System)

**Admin - Kelola Course:**
- CRUD course (dengan gambar, batch, level)
- Upload file lampiran
- Kelola assignment per course

**Admin - Kelola Lesson:**
- CRUD lesson per course (judul, konten, urutan, file)
- Drag & drop reorder

**Siswa - Akses LMS:**
- List course berdasarkan batch/level siswa
- Detail course + daftar lesson
- Tandai lesson selesai
- Lihat assignment & kumpulkan tugas
- Lihat nilai LMS

**Guru - Akses LMS:**
- Kelola course, lesson, file untuk kelas yang diajar
- Buat assignment & grading
- Lihat submission siswa

**Sidebar:** Akademik > LMS (`/lms`)

### 6.6 Absensi & Kehadiran

**Absensi Karyawan:**
- Check-in/out dengan: face recognition (face embedding), geofencing (radius cabang), QR code, foto manual
- Multi-cabang, multi-shift
- Mode shift: fixed atau rotating
- Status: HADIR, TELAT, IZIN, SAKIT, ALPHA, CUTI, LIBUR, DINAS_LUAR, BELUM_ABSEN
- Overtime (lembur) terpisah dengan foto
- Izin/cuti dengan approval via WA
- Laporan: rekap absensi, grafik mingguan, riwayat
- Kalender absensi
- Fitur scan QR dari mobile

**Absensi Sensei:**
- Check-in/out per kelas (dengan foto + lokasi)
- Status: HADIR, TELAT, IZIN, SAKIT, ALPHA, LIBUR
- Grouped by kelas, expandable accordion
- Rekap kalender per sensei

**Absensi Siswa:**
- Check-in/out dengan status: HADIR, TELAT, IZIN, SAKIT, ALPHA
- Mass store (satu kelas sekaligus)
- Rekap dengan export Excel/PDF
- Absensi via mobile oleh siswa (scan QR)
- Checkout status

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
- Toggle akses khusus (can_access_khusus)

**Divisi — Cabang — Shift — Jadwal Shift:**
- CRUD master data
- QR code per cabang (barcode)
- Kalender jadwal shift (bulanan), toggle libur
- Mode shift: fixed atau rotating
- Radius geofencing per cabang

**User Management:**
- CRUD user (ADMIN, MANAGER, HR, ACCOUNTING, AFFILIATE, KANDIDAT, GURU, KARYAWAN, ADMIN_CABANG)
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
- Bank accounts: CRUD rekening perusahaan

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

**Data Pengeluaran:**
- CRUD pengeluaran dengan upload bukti
- Filter by kategori, cabang, tanggal, pencarian
- Rekap tahunan per bulan

**Sidebar:** Keuangan (khusus HR, MANAGER, ACCOUNTING):
- Kategori Pengeluaran → `/kategori-pengeluaran`
- Data Pengeluaran → `/pengeluaran`

### 6.9 Admin Cabang

**Role Admin Cabang (`ADMIN_CABANG`):**
- Role dengan layout, sidebar, dan dashboard terpisah
- Hanya melihat data untuk cabang yang ditugaskan
- Juga memiliki akses ke fitur akademik: guru, kelas sensei, jadwal level, rekap siswa, penilaian, raport, evaluasi instruktur, LMS
- Akses ke pengeluaran & kategori pengeluaran cabang

**Dashboard:**
- Statistik kandidat, pendaftar pending, tagihan pending, pembayaran pending

**Sidebar Admin Cabang:**
- Dashboard → `/admin-cabang`
- Data Kandidat → `/admin-cabang/kandidat`
- Pendaftaran → `/admin-cabang/pendaftar`
- Tagihan → `/admin-cabang/tagihan`
- Rekap Per Batch → `/admin-cabang/rekap-per-batch`
- Pengeluaran → `/admin-cabang/pengeluaran`
- Kategori Pengeluaran → `/admin-cabang/kategori-pengeluaran`
- Data Siswa → `/admin-cabang/siswa`
- Data Guru → `/admin-cabang/guru`
- Kelas Sensei → `/admin-cabang/kelas-sensei`
- Jadwal Level → `/admin-cabang/jadwal-level`
- Rekap Siswa → `/admin-cabang/rekap-siswa`
- Penilaian → `/admin-cabang/penilaian`
- Raport → `/admin-cabang/raport`
- Evaluasi Instruktur → `/admin-cabang/evaluasi-instruktur`
- LMS → `/admin-cabang/lms`

### 6.10 AI & Automasi

**AI Chat:**
- Chat dengan AI (Groq API) untuk informasi umum
- Markdown rendering, code blocks

**Notifikasi WA:**
- Pengaturan notifikasi (hadir, terlambat, izin, lembur, dll)
- Webhook untuk approval via WA
- Reminder absen & pembayaran terjadwal
- Log notifikasi WA
- Template notifikasi

**Scheduled Tasks (Cron):**
- `absensi:generate-alpha` — Generate alpha otomatis (23:55)
- `absensi:generate-alpha-sensei` — Generate alpha sensei (23:55)
- `app:cek-absen-pulang` — Cek absen pulang (tiap 10 menit)
- `app:reminder-absen` — Reminder absen (tiap menit)
- `app:notif-keterlambatan` — Notif keterlambatan (tiap 15 menit)
- `app:notif-tidak-absen-pulang` — Notif tidak absen pulang (tiap jam)
- `app:reminder-pembayaran` — Reminder pembayaran (harian 09:00)

### 6.11 Manajemen Proyek

- CRUD proyek dengan list pekerjaan
- Assign task ke karyawan
- Drag & drop reorder task
- Log aktivitas proyek
- Dashboard management proyek
- Upload file via CKEditor

### 6.12 Evaluasi & Raport

**Evaluasi Level:**
- Evaluasi per level untuk setiap siswa
- Input nilai oleh guru
- Rekap evaluasi

**Student Evaluation:**
- Evaluasi akhir siswa dengan detail
- Status kelulusan

**Raport:**
- Generate raport PDF per siswa per level
- Menampilkan nilai assessment + evaluasi

**Evaluasi Instruktur:**
- Siswa memberikan rating/evaluasi ke instruktur
- Per level

### 6.13 Notifikasi & Template

**WA Notification:**
- Kirim notifikasi WA via Fonnte API
- Log pengiriman notifikasi
- Stats notifikasi terkirim/gagal
- Manual send reminder

**WA Settings:**
- Global settings
- Reminder settings
- Batch deadline settings (per kategori biaya)
- Channel: WA, Email

**Email Notification:**
- Kirim email via SMTP
- Log email terkirim
- Template email: RegistrationApproved, PaymentStatus, PaymentReminder, NewBill

**Notification Templates:**
- Template notifikasi WA & Email
- Variable replacement dinamis

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
| GET | `/products/{slug}` | Get produk by slug |
| POST | `/coupons/validate` | Validasi kupon |
| GET | `/pendaftaran/cek-status` | Cek status pendaftaran |
| GET | `/company-profile` | Get profil perusahaan |
| GET | `/batches/aktif` | List batch aktif |
| GET | `/company-profile/batch-deadlines` | Deadline pembayaran publik |
| GET | `/verifikasi/{token}` | Verifikasi pembayaran publik |
| POST | `/auth/forgot-password` | Lupa password |

### 7.2 Auth Required (Sanctum)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/auth/user` | Get current user |
| POST | `/auth/logout` | Logout |
| GET | `/pendaftar` | List pendaftar (admin) |
| POST | `/pendaftar/{id}/approve` | Approve pendaftar |
| POST | `/pendaftar/{id}/reject` | Reject pendaftar |
| POST | `/pendaftar/{id}/verify-payment` | Verify payment |
| POST | `/pendaftar/{id}/bayar` | Bayar manual |
| POST | `/pendaftar/{id}/set-lunas` | Set lunas |
| POST | `/pendaftar/{id}/batal-lunas` | Batal lunas |
| GET | `/pendaftar/pending-count` | Count pendaftar pending |
| GET | `/pendaftar/{id}/invoice` | Invoice detail |
| DELETE | `/pendaftar/{id}` | Hapus pendaftar |
| GET | `/kandidat` | List kandidat (data diri + user) |
| POST | `/kandidat/import` | Import kandidat via Excel |
| POST | `/kandidat/bulk-delete` | Bulk delete kandidat |
| POST | `/kandidat/bulk-update-batch` | Bulk update batch |
| GET | `/affiliate-dashboard` | Dashboard affiliate |
| GET | `/siswa-dashboard` | Dashboard siswa |
| POST | `/siswa/profile` | Update profile siswa |
| GET | `/siswa/absensi-saya` | Absensi siswa (mobile) |
| GET | `/siswa/nilai-saya/{batchId}` | Nilai siswa (mobile) |
| POST | `/siswa/scan-qr` | Scan QR absensi |
| GET | `/guru-dashboard` | Dashboard guru |
| CRUD | `/guru/kelas-saya` | Kelas guru |
| GET/POST | `/guru/absen-masuk` | Absen masuk guru |
| GET/POST | `/guru/absen-pulang` | Absen pulang guru |
| GET | `/guru/data-siswa/{kelasId}` | Data siswa per kelas |
| POST | `/guru/penilaian-harian` | Simpan penilaian harian |
| GET | `/guru/profile` | Profile guru |
| GET | `/guru/batch-dan-nilai` | Batch & nilai |
| GET | `/guru/ranking/{batchId}` | Ranking siswa |
| POST | `/guru/store-level-evaluation` | Simpan evaluasi level |
| GET/POST | `/guru/assignments` | Assignment CRUD |
| GET | `/guru/assignments/{id}/submissions` | Submission siswa |
| POST | `/guru/assignments/{id}/grade` | Grade submission |
| CRUD | `/guru/lms/courses` | Course guru |
| CRUD | `/guru/lms/lessons` | Lesson guru |
| GET/POST | `/guru/lms/upload` | Upload file guru |
| GET | `/affiliates/stats` | Statistik affiliate |
| CRUD | `/products` | Produk CRUD |
| CRUD | `/product-categories` | Kategori produk CRUD |
| CRUD | `/biaya-kategori` | Kategori biaya CRUD |
| CRUD | `/affiliate-links` | Affiliate link CRUD |
| CRUD | `/coupons` | Kupon CRUD |
| CRUD | `/batches` | Batch CRUD |
| CRUD | `/divisi` | Divisi CRUD |
| CRUD | `/cabang` | Cabang CRUD |
| CRUD | `/shift` | Shift CRUD |
| CRUD | `/karyawan` | Karyawan CRUD |
| CRUD | `/user` | User CRUD |
| CRUD | `/siswa` | Siswa CRUD |
| CRUD | `/guru` | Guru CRUD |
| CRUD | `/kelas-sensei` | Kelas sensei CRUD |
| CRUD | `/absensi-siswa` | Absensi siswa CRUD |
| CRUD | `/absensi-karyawan` | Absensi karyawan |
| GET | `/absensi-karyawan/cek` | Cek status absensi |
| POST | `/absensi-karyawan/masuk` | Check-in |
| POST | `/absensi-karyawan/pulang` | Check-out |
| GET | `/absensi-karyawan/riwayat` | Riwayat absensi |
| GET | `/absensi-karyawan/stats-hari-ini` | Stats hari ini |
| GET | `/absensi-karyawan/grafik-mingguan` | Grafik mingguan |
| GET | `/absensi-karyawan/shift-saya` | Shift saya |
| POST | `/absensi-karyawan/scan-qr` | Scan QR |
| GET | `/rekap-absensi` | Rekap absensi |
| GET | `/penilaian` | Penilaian |
| GET | `/penilaian/matrix` | Matrix penilaian |
| GET | `/penilaian/day-detail` | Detail hari |
| POST | `/penilaian/store-student-assessment` | Simpan assessment |
| GET | `/penilaian/rekap` | Rekap penilaian |
| GET | `/data-agenda` | List agenda |
| CRUD | `/shifts` | Shift CRUD |
| CRUD | `/shift-jadwal` | Jadwal shift CRUD |
| GET | `/rekap-jadwal-shift` | Rekap jadwal shift |
| GET | `/monitoring-lokasi` | Monitoring lokasi |
| GET | `/kehadiran` | Kehadiran karyawan |
| GET | `/kehadiran-khusus` | Kehadiran khusus |
| POST | `/kehadiran-khusus/update-status` | Update status khusus |
| GET | `/kehadiran-sensei` | Kehadiran sensei |
| GET | `/rekap-kehadiran-sensei` | Rekap kehadiran sensei |
| GET | `/jadwal-level` | Jadwal level |
| CRUD | `/izin` | Izin CRUD |
| POST | `/izin/{id}/approve` | Approve izin |
| POST | `/izin/{id}/reject` | Reject izin |
| CRUD | `/lembur` | Lembur CRUD |
| POST | `/lembur/{id}/approve` | Approve lembur |
| POST | `/lembur/{id}/reject` | Reject lembur |
| CRUD | `/hari-libur` | Hari libur CRUD |
| GET/POST | `/pengaturan-shift` | Pengaturan shift mode |
| GET/POST | `/company-profile` | Profil perusahaan |
| CRUD | `/bank-accounts` | Rekening perusahaan |
| GET/POST | `/payment-settings` | Pengaturan pembayaran |
| CRUD | `/batch-biaya/{batchId}` | Biaya per batch |
| CRUD | `/pembayaran-item/{pendaftarId}` | Item pembayaran |
| GET | `/pembayaran` | List pembayaran |
| GET | `/pembayaran-pending` | Pembayaran pending |
| GET | `/rekap-per-batch` | Rekap per batch |
| POST | `/ai-chat` | AI Chat |
| GET | `/profile` | Get profile |
| POST | `/profile/update` | Update profile |
| POST | `/profile/change-password` | Ganti password |
| GET | `/raport/{siswaId}/{level}` | Raport siswa |
| GET | `/evaluasi-instruktur` | Evaluasi instruktur |
| POST | `/evaluasi-instruktur` | Simpan evaluasi |

### 7.3 LMS Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| **Siswa** | | |
| GET | `/lms/courses` | List course (by batch/level) |
| GET | `/lms/courses/{id}` | Detail course + lessons |
| GET | `/lms/lessons/{id}` | Detail lesson |
| POST | `/lms/lessons/{id}/complete` | Tandai selesai |
| DELETE | `/lms/lessons/{id}/complete` | Batalkan |
| GET | `/lms/assignments/{id}` | Detail assignment |
| POST | `/lms/assignments/{id}/submit` | Kumpulkan tugas |
| GET | `/lms/nilai` | Nilai LMS siswa |
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
| GET | `/admin-cabang/siswa` | Data siswa cabang |
| GET | `/admin-cabang/guru` | Data guru cabang |
| GET | `/admin-cabang/kelas-sensei` | Kelas sensei cabang |
| GET | `/admin-cabang/jadwal-level` | Jadwal level cabang |
| GET | `/admin-cabang/rekap-siswa` | Rekap siswa cabang |
| GET | `/admin-cabang/penilaian` | Penilaian cabang |
| GET | `/admin-cabang/raport` | Raport cabang |
| GET | `/admin-cabang/evaluasi-instruktur` | Evaluasi instruktur |
| GET | `/admin-cabang/lms` | LMS cabang |

---

## 8. Alur Penting

### 8.1 Alur Pendaftaran Kandidat

```
User buka link affiliate → Form pendaftaran (multi-step)
  Step 1: Data Diri (nama, email, password, batch)
  Step 2: Kontak (telepon, alamat, wilayah)
  Step 3: Pembayaran (nominal, kupon, bukti upload, bank pengirim)
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
  → Buat Assignment (opsional)
    ↓
Siswa login → Dashboard Siswa → LMS
  → Lihat daftar Course (berdasarkan batch/level)
  → Buka Course → lihat daftar Lesson
  → Buka Lesson → baca materi
  → Klik "Selesai" → progress tercatat
  → Kerjakan Assignment → upload submission
    ↓
Guru: lihat submission → beri nilai
Admin: monitor progress via Rekap Siswa
```

### 8.6 Alur Keuangan

```
Admin/HR/Accounting akses Keuangan:
  → Dashboard: lihat grafik pengeluaran bulanan, perbandingan vs pendapatan
  → Kelola Kategori Pengeluaran (tambah/hapus)
  → Input Pengeluaran (judul, nominal, kategori, cabang, tanggal, upload bukti)
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
| `/daftar-program` | DaftarProgram | Daftar langsung program |
| `/daftar-program/:slug` | DaftarProgram | Daftar program by slug |
| `/bayar/:id` | Bayar | Halaman pembayaran |
| `/checkout-berhasil/:token` | CheckoutBerhasil | Checkout berhasil |
| `/konfirmasi-pembayaran` | KonfirmasiPembayaran | Konfirmasi pembayaran |
| `/konfirmasi-pembayaran/:id` | KonfirmasiPembayaran | Konfirmasi by ID |
| `/syarat-ketentuan` | SyaratKetentuan | Syarat & ketentuan |
| `/verifikasi/:noInvoice` | Verifikasi | Verifikasi pembayaran publik |

### 9.2 Admin Routes (MANAGER, HR, ADMIN)

| Path | Component | Menu |
|------|-----------|------|
| `/` | Dashboard | Pusat Dashboard |
| `/dashboard` | DashboardHome | Dashboard Home |
| `/dashboard-absensi` | DashboardAbsensi | Dashboard absensi |
| `/dashboard-akademik` | DashboardAkademik | Dashboard akademik |
| `/dashboard-kandidat` | DashboardKandidat | Dashboard kandidat |
| `/dashboard-management` | DashboardManagement | Dashboard management |
| `/dashboard-keuangan` | DashboardKeuangan | Dashboard keuangan |
| `/data-kandidat` | DataKandidat | Manajemen Kandidat → Data Kandidat |
| `/pendaftar` | Pendaftar | Manajemen Kandidat → Pendaftaran |
| `/pendaftar/:id/invoice` | InvoicePendaftar | Manajemen Kandidat → Invoice |
| `/pendaftar/:id/detail` | PendaftarDetail | Manajemen Kandidat → Detail |
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
| `/raport` | Raport | Akademik → Raport |
| `/evaluasi-instruktur` | EvaluasiInstruktur | Akademik → Evaluasi Instruktur |
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
| `/log-login` | LogLogin | HR & Operasional → Log Login |
| `/kategori-pengeluaran` | DataKategoriPengeluaran | Keuangan → Kategori Pengeluaran |
| `/pengeluaran` | DataPengeluaran | Keuangan → Data Pengeluaran |
| `/ai-chat` | AiChat | AI & Automasi → AI Chat |
| `/pengaturan-wa` | PengaturanWa | AI & Automasi → Notifikasi WA |
| `/pengaturan-pembayaran` | PengaturanPembayaran | Pengaturan → Pembayaran |

### 9.3 Role-Specific Routes

| Path | Role | Component |
|------|------|-----------|
| `/affiliate-dashboard` | AFFILIATE | AffiliateDashboard |
| `/affiliate-profile` | AFFILIATE | Profile |
| `/siswa-dashboard` | KANDIDAT | SiswaDashboard |
| `/siswa-dashboard/data-diri` | KANDIDAT | DataDiri |
| `/siswa-dashboard/absensi` | KANDIDAT | AbsensiSaya |
| `/siswa-dashboard/pembayaran` | KANDIDAT | PembayaranSiswa |
| `/siswa-dashboard/lms` | KANDIDAT | LMS |
| `/siswa-dashboard/nilai` | KANDIDAT | SiswaNilai |
| `/guru-dashboard` | GURU | GuruDashboard |
| `/guru-data-siswa` | GURU | GuruDataSiswa |
| `/guru-profil` | GURU | GuruProfil |
| `/guru-lms` | GURU | GuruLMS |
| `/guru-lms/assignments/:courseId` | GURU | GuruLMSAssignment |
| `/guru-penilaian-harian` | GURU | GuruPenilaianHarian |
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
| `/admin-cabang/pengeluaran` | ADMIN_CABANG | AdminCabangPengeluaran |
| `/admin-cabang/kategori-pengeluaran` | ADMIN_CABANG | AdminCabangKategoriPengeluaran |
| `/admin-cabang/siswa` | ADMIN_CABANG | Siswa |
| `/admin-cabang/guru` | ADMIN_CABANG | Guru |
| `/admin-cabang/kelas-sensei` | ADMIN_CABANG | KelasSensei |
| `/admin-cabang/jadwal-level` | ADMIN_CABANG | JadwalLevel |
| `/admin-cabang/rekap-siswa` | ADMIN_CABANG | RekapSiswa |
| `/admin-cabang/penilaian` | ADMIN_CABANG | Penilaian |
| `/admin-cabang/raport` | ADMIN_CABANG | Raport |
| `/admin-cabang/evaluasi-instruktur` | ADMIN_CABANG | EvaluasiInstruktur |
| `/admin-cabang/lms` | ADMIN_CABANG | DataCourse |


coba agar terintegrasi datanya itu data matchng job itu terntergasri ke database sim mendunia 