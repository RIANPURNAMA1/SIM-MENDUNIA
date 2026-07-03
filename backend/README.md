# Sistem Absensi Karyawan Mendunia

Sistem manajemen absensi karyawan berbasis web dengan fitur **face recognition**, **geofencing GPS**, **manajemen shift**, **notifikasi WhatsApp**, dan **role-based access** (HR, Manager, Karyawan). Dibangun menggunakan Laravel 12, Tailwind CSS 4, dan SQLite/MySQL.

---

## Daftar Fitur
| No | Fitur | Deskripsi |
|----|-------|-----------|
| 1 | [Absensi Reguler (Foto + GPS)](#1-absensi-reguler-foto--gps) | Absen masuk/pulang dengan selfie, verifikasi wajah, dan geolokasi |
| 2 | [Absensi Khusus (Timer)](#2-absensi-khusus-timer) | Absen berbasis timer dengan fitur pause/resume untuk pekerjaan projekt |
| 3 | [Absensi Sensei (Mengajar)](#3-absensi-sensei-mengajar) | Absen per kelas untuk pengajar/instruktur |
| 4 | [Agenda Harian](#4-agenda-harian) | Catatan agenda kerja harian dengan absen sendiri |
| 5 | [Izin / Cuti](#5-izin--cuti) | Pengajuan izin sakit, cuti, izin dengan approval HR/Manager |
| 6 | [Lembur](#6-lembur) | Pengajuan lembur dengan bukti foto dan approval |
| 7 | [Face Recognition](#7-face-recognition) | Verifikasi identitas menggunakan embedding wajah |
| 8 | [Geofencing (Radius GPS)](#8-geofencing-radius-gps) | Pembatasan lokasi absen berdasarkan radius cabang |
| 9 | [Manajemen Shift](#9-manajemen-shift) | Definisi shift kerja dengan jam masuk/pulang dan toleransi |
| 10 | [Penjadwalan Shift](#10-penjadwalan-shift) | Jadwal shift per hari per karyawan |
| 11 | [Manajemen Cabang](#11-manajemen-cabang) | Data cabang perusahaan dengan koordinat GPS |
| 12 | [Manajemen Divisi](#12-manajemen-divisi) | Data divisi/departemen |
| 13 | [Hari Libur](#13-hari-libur) | Penetapan hari libur nasional dan cuti bersama |
| 14 | [Dashboard & Statistik](#14-dashboard--statistik) | Grafik, statistik kehadiran, dan peta monitoring |
| 15 | [Rekap Absensi](#15-rekap-absensi) | Laporan rekap kehadiran per karyawan |
| 16 | [Laporan Bulanan](#16-laporan-bulanan) | Laporan pribadi karyawan dengan skor kedisiplinan |
| 17 | [Kalender Kehadiran](#17-kalender-kehadiran) | Tampilan kalender bulanan status kehadiran |
| 18 | [Monitoring Lokasi](#18-monitoring-lokasi) | Peta sebaran lokasi absen karyawan |
| 19 | [Notifikasi WhatsApp](#19-notifikasi-whatsapp) | Notifikasi otomatis via WhatsApp (StarSender API) |
| 20 | [Task / Project Management](#20-task--project-management) | Kanban board untuk manajemen tugas dan proyek |
| 21 | [Manajemen Pengguna](#21-manajemen-pengguna) | CRUD data karyawan lengkap dengan dokumen |
| 22 | [Role & Akses](#22-role--akses) | Tiga level akses: HR, Manager, Karyawan |
| 23 | [Cron Job / Tugas Terjadwal](#23-cron-job--tugas-terjadwal) | Proses otomatis harian untuk generate alpha, reminder, dan notifikasi |

---

## 1. Absensi Reguler (Foto + GPS)

**Akses:** Karyawan  
**URL:** `/absensi`  
**Controller:** `AbsensiController`

### Cara Penggunaan

1. Karyawan membuka halaman absensi
2. Sistem menampilkan:
   - Informasi shift aktif hari ini
   - Peta geofencing (radius cabang)
   - Tombol **Absen Masuk** atau **Absen Pulang**
   - Riwayat 10 absen terakhir
3. **Absen Masuk:**
   - Sistem mengecek apakah hari ini libur
   - Verifikasi wajah (face embedding) - jarak Euclidean < 0.40
   - Deteksi shift aktif (dari jadwal shift atau shift tetap)
   - Validasi lokasi GPS dalam radius cabang
   - Penentuan status: **HADIR** (tepat waktu) atau **TERLAMBAT** (melewati toleransi)
   - Foto selfie disimpan, notifikasi WA dikirim
4. **Absen Pulang:**
   - Verifikasi wajah
   - Validasi lokasi GPS
   - Jika absen sebelum jam pulang → status **PULANG LEBIH AWAL**
   - Jika melebihi 5 jam dari jam pulang → status **TIDAK ABSEN PULANG**
   - Foto selfie pulang disimpan

### Endpoint Utama

| Method | URL | Fungsi |
|--------|-----|--------|
| GET | `/absensi` | Halaman utama absensi |
| POST | `/absen/masuk` | Absen masuk (face embedding) |
| POST | `/absensi/pulang` | Absen pulang |
| POST | `/absensi/foto/proses` | Absen masuk/pulang via foto (multi-cabang) |
| POST | `/absensi/status` | Cek status absensi hari ini |
| GET | `/absensi/riwayat` | Riwayat absensi |
| GET | `/absensi/detail/{tanggal}` | Detail absen per tanggal |

---

## 2. Absensi Khusus (Timer)

**Akses:** Karyawan dengan izin `can_access_khusus = true`  
**URL:** `/absensi/khusus`  
**Controller:** `AbsensiController`  
**Model:** `AbsensiKhusus`

### Cara Penggunaan

Fitur ini untuk pekerjaan yang berbasis durasi / projekt, bukan jam tetap.

1. **Mulai:** Klik "Mulai" → foto selfie → timer berjalan (status `BERJALAN`)
2. **Jeda:** Klik "Jeda" → waktu tersimpan sementara (status `DITUNDA`). Maksimal 1 kali jeda per sesi.
3. **Lanjutkan:** Klik "Lanjut" → timer melanjutkan akumulasi waktu (status `BERJALAN`)
4. **Selesai:** Klik "Selesai" → foto selfie → total durasi ditampilkan (X jam Y menit Z detik)

### Endpoint

| Method | URL | Fungsi |
|--------|-----|--------|
| GET | `/absensi/khusus` | Halaman absensi khusus |
| GET | `/absensi/khusus/status` | Status sesi saat ini |
| POST | `/absensi/khusus/mulai` | Mulai timer |
| POST | `/absensi/khusus/pause` | Jeda timer |
| POST | `/absensi/khusus/lanjut` | Lanjutkan timer |
| POST | `/absensi/khusus/selesai` | Selesaikan timer |

---

## 3. Absensi Sensei (Mengajar)

**Akses:** Karyawan  
**URL:** `/absensi/sensei`  
**Controller:** `SenseiController`  
**Model:** `KelasSensei`, `AbsensiSensei`

### Cara Penggunaan

Khusus untuk pengajar/instruktur yang mengajar per kelas.

1. **Buat Kelas:** Nama kelas, level (1-4), rentang tanggal, catatan
2. **Absen Masuk Kelas:** Pilih kelas aktif → foto → verifikasi GPS
3. **Absen Pulang Kelas:** Pilih kelas yang sudah absen masuk → foto
4. Riwayat absensi per kelas tercatat terpisah dari absensi reguler

### Endpoint

| Method | URL | Fungsi |
|--------|-----|--------|
| GET | `/absensi/sensei` | Halaman sensei |
| POST | `/absensi/sensei/store-kelas` | Buat kelas baru |
| GET | `/absensi/sensei/kelas-aktif` | Daftar kelas aktif |
| POST | `/absensi/sensei/absen-masuk` | Absen masuk kelas |
| POST | `/absensi/sensei/absen-pulang` | Absen pulang kelas |
| DELETE | `/absensi/sensei/{id}` | Batalkan kelas |

---

## 4. Agenda Harian

**Akses:** Karyawan  
**URL:** `/absensi/agenda`  
**Controller:** `AgendaController`  
**Model:** `Agenda`

### Cara Penggunaan

Catatan agenda kerja harian (maksimal 1 agenda per hari).

1. Buat agenda dengan judul, deskripsi, jam mulai-selesai, foto
2. Agenda bisa diisi absen masuk dan absen pulang sendiri
3. Status: `TERJADWAL` → `SELESAI` / `DIBATALKAN`

### Endpoint

| Method | URL | Fungsi |
|--------|-----|--------|
| GET | `/absensi/agenda` | Halaman agenda |
| POST | `/absensi/agenda/store` | Buat agenda |
| PUT | `/absensi/agenda/{id}` | Ubah agenda |
| DELETE | `/absensi/agenda/{id}` | Hapus agenda |
| POST | `/absensi/agenda/{id}/complete` | Selesaikan agenda |
| POST | `/absensi/agenda/absen-masuk` | Absen masuk agenda |
| POST | `/absensi/agenda/absen-pulang` | Absen pulang agenda |

---

## 5. Izin / Cuti

**Akses:** Karyawan (pengajuan), HR/Manager (approval)  
**URL:** `/izin/create` (pengajuan), `/izin-cuti` (approval)  
**Controller:** `IzinController`, `IzinApprovalService`  
**Model:** `Izin`, `IzinApproval`

### Cara Penggunaan

**Pengajuan (Karyawan):**
1. Pilih jenis izin: **SAKIT**, **CUTI**, atau **IZIN**
2. Tentukan tanggal mulai dan selesai
3. Isi alasan
4. Upload lampiran (foto surat dokter, dll)
5. Submit → status `PENDING`

**Approval (HR/Manager):**
1. Buka halaman daftar izin
2. **Setujui:** Catatan absensi otomatis dibuat dengan status `IZIN` untuk setiap tanggal
3. **Tolak:** Tambahkan catatan penolakan

### Aturan
- Hanya 1 pengajuan PENDING dalam satu waktu
- Tidak bisa mengajuan jika sudah absen masuk di tanggal mulai
- Tanggal mulai harus hari ini atau masa depan
- 1x submit per hari

### Endpoint

| Method | URL | Fungsi |
|--------|-----|--------|
| GET | `/izin/create` | Form pengajuan izin |
| POST | `/izin/store` | Submit izin |
| GET | `/izin-cuti` | Daftar izin (HR/Manager) |
| POST | `/izin/{id}/approve` | Setujui izin |
| POST | `/izin/{id}/reject` | Tolak izin |

---

## 6. Lembur

**Akses:** Karyawan (pengajuan), HR/Manager (approval)  
**URL:** `/absensi/lembur`  
**Controller:** `LemburController`  
**Model:** `Lembur`

### Cara Penggunaan

1. Klik **Mulai Lembur** → foto selfie → isi keterangan → status `PENDING`
2. Klik **Selesai Lembur** → foto selfie → isi catatan akhir
3. HR/Manager menyetujui atau menolak melalui halaman approval

### Endpoint

| Method | URL | Fungsi |
|--------|-----|--------|
| GET | `/absensi/lembur` | Halaman lembur |
| POST | `/absensi/lembur/store` | Mulai lembur |
| GET | `/approval-lembur` | Approval lembur (HR/Manager) |
| POST | `/approval-lembur/{id}/status` | Update status lembur |

---

## 7. Face Recognition

**Controller:** `AbsensiController`  
**Penyimpanan:** Kolom `face_embedding` (JSON array) di tabel `users`

### Cara Kerja

- **Registrasi:** Karyawan merekam wajah → sistem menyimpan **128-dimensional embedding vector** sebagai JSON
- **Verifikasi:** Saat absen, embedding wajah baru dibandingkan dengan yang tersimpan:
  - **Euclidean Distance** < 0.40 → cocok
  - **Cosine Similarity** sebagai alternatif
- **Anti-duplikasi:** Embedding baru dicek terhadap semua pengguna lain → jika jarak < 0.40 dengan wajah orang lain, registrasi ditolak

### Endpoint

| Method | URL | Fungsi |
|--------|-----|--------|
| POST | `/user/update-face` | Registrasi/update wajah |
| POST | `/absensi/deteksi` | Deteksi wajah (placeholder) |

---

## 8. Geofencing (Radius GPS)

**Model:** `Cabang`  
**Kolom:** `latitude`, `longitude`, `radius` (meter)

### Cara Kerja

1. Setiap cabang memiliki titik koordinat pusat dan radius (meter)
2. Saat absen, sistem mengambil GPS karyawan via browser/mobile
3. Menghitung jarak menggunakan **rumus Haversine**
4. Jika jarak ≤ radius cabang → lokasi valid
5. Untuk karyawan dengan banyak cabang, sistem otomatis memilih cabang yang dalam radius
6. Jika tidak ada cabang dalam radius → absen ditolak

---

## 9. Manajemen Shift

**Akses:** HR/Manager  
**URL:** `/shift`  
**Controller:** `ShiftController`  
**Model:** `Shift`

### Cara Penggunaan

CRUD untuk mendefinisikan shift kerja:

| Field | Deskripsi |
|-------|-----------|
| Nama Shift | Misal: "Pagi", "Siang", "Malam" |
| Kode Shift | Kode unik |
| Jam Masuk | Waktu mulai kerja |
| Jam Pulang | Waktu selesai kerja |
| Toleransi | Menit keterlambatan yang ditolerir |
| Status | AKTIF / NONAKTIF |

Karyawan bisa memiliki beberapa shift (`shift_ids` JSON) yang akan diterapkan berdasarkan jadwal.

---

## 10. Penjadwalan Shift

**Akses:** HR/Manager  
**URL:** `/jadwal-shift`  
**Controller:** `ShiftJadwalController`  
**Model:** `ShiftJadwal`

### Cara Penggunaan

1. Pilih karyawan
2. Pilih tanggal (bisa bulk untuk banyak tanggal)
3. Pilih shift
4. Atau tandai sebagai **LIBUR** pada hari tertentu

**Algoritma Resolusi Shift:**
1. Cek `shift_jadwal` untuk tanggal tersebut
2. Jika tidak ada → cek `shift_id` (shift utama user)
3. Jika tidak ada → cek `shift_ids` (multi-shift user)
4. Jika tidak ada → status **TIDAK_ADA_SHIFT**

### Endpoint

| Method | URL | Fungsi |
|--------|-----|--------|
| GET | `/jadwal-shift` | Halaman jadwal shift |
| GET | `/shift-jadwal/{userId}` | Jadwal per user |
| POST | `/shift-jadwal` | Buat jadwal |
| POST | `/shift-jadwal/multiple` | Buat jadwal massal |
| DELETE | `/shift-jadwal/{id}` | Hapus jadwal |

---

## 11. Manajemen Cabang

**Akses:** HR/Manager  
**URL:** `/cabang`  
**Controller:** `CabangController`  
**Model:** `Cabang`

| Field | Deskripsi |
|-------|-----------|
| Kode Cabang | Kode unik cabang |
| Nama Cabang | Nama cabang |
| Status Pusat | Apakah cabang pusat |
| Latitude, Longitude | Koordinat GPS pusat |
| Radius | Radius geofencing (meter) |
| Alamat | Alamat lengkap |

---

## 12. Manajemen Divisi

**Akses:** HR/Manager  
**URL:** `/divisi`  
**Controller:** `DivisiController`  
**Model:** `Divisi`

CRUD sederhana untuk divisi/departemen: nama divisi dan kode divisi.

---

## 13. Hari Libur

**Akses:** HR/Manager  
**URL:** `/hari-libur`  
**Controller:** `HariLiburController`  
**Model:** `HariLibur`

### Cara Kerja

- Admin menambahkan tanggal libur nasional/cuti bersama
- Fungsi `apakahLibur()` otomatis mendeteksi:
  - Hari Sabtu dan Minggu sebagai libur
  - Tanggal yang tercatat di tabel `hari_liburs`
- Pada akhir hari, sistem mengisi status **LIBUR** untuk semua karyawan

---

## 14. Dashboard & Statistik

**Akses:** HR/Manager  
**URL:** `/`, `/hr/dashboard`, `/manager/dashboard`  
**Controller:** `DashboardController`

### Komponen Dashboard

| Komponen | Deskripsi |
|----------|-----------|
| **Card Statistik** | Total karyawan, hadir hari ini, tepat waktu, terlambat, alpa, izin, belum absen, izin pending, persentase terlambat |
| **Donat Chart** | Komposisi kehadiran (hadir, terlambat, izin, alpa, libur) |
| **Bar Chart** | Tren 6 bulan (hadir, terlambat, alpa, libur) |
| **Rasio Divisi** | Perbandingan hadir vs terlambat per divisi |
| **Statistik Sensei** | Grafik donat dan tren untuk absensi sensei |
| **Aktivitas Terbaru** | 10 izin/sakit terakhir dan 100 absen terbaru |
| **Map Markers** | Titik lokasi absen pada peta |
| **Notifikasi Lembur** | Lembur pending yang perlu approval |

Filter berdasarkan rentang tanggal, cabang, dan divisi.

---

## 15. Rekap Absensi

**Akses:** HR/Manager  
**URL:** `/rekap-absensi`  
**Controller:** `RekapController`

### Output

Rekap per karyawan dalam rentang tanggal tertentu, menampilkan:

- Total **HADIR**
- Total **TERLAMBAT**
- Total **IZIN**
- Total **ALPA**
- Total **PULANG AWAL**
- Total **LIBUR**
- Total **Jam Kerja**
- Total **Jam Lembur**
- Jumlah absen **Sensei**, **Agenda**, **Absensi Khusus**

Filter berdasarkan cabang, divisi, dan rentang tanggal.

---

## 16. Laporan Bulanan

**Akses:** Karyawan  
**URL:** `/report`  
**Controller:** `ReportController`

### Cara Penggunaan

Karyawan melihat laporan kehadiran pribadi per bulan:

- Statistik: hadir, terlambat, izin, alpa
- **Skor Kedisiplinan** (0-100%):
  - ≥ 90%: **Sangat Baik**
  - ≥ 75%: **Baik**
  - < 75%: **Perlu Peningkatan**
- 5 aktivitas terakhir bulan ini

---

## 17. Kalender Kehadiran

**Akses:** Karyawan  
**URL:** `/calendar`  
**Controller:** `CalendarController`

Tampilan kalender bulanan dengan warna status kehadiran per hari:

- 🟢 **HADIR**
- 🟡 **TERLAMBAT**
- 🔵 **IZIN**
- 🔴 **ALPA**
- ⚪ **LIBUR**

Data diambil via AJAX. Klik tanggal untuk melihat detail absen.

---

## 18. Monitoring Lokasi

**Akses:** HR/Manager  
**URL:** `/monitoring-lokasi`  
**Controller:** `MonitoringController`

Peta yang menampilkan semua titik lokasi absen masuk dan pulang karyawan. Filter berdasarkan rentang tanggal dan cabang.

---

## 19. Notifikasi WhatsApp

**Akses:** HR/Manager (pengaturan), otomatis (pengiriman)  
**Service:** `WhatsAppService` (StarSender API)  
**Model:** `NotificationSetting`

### Jenis Notifikasi

| Key | Trigger | Warna |
|-----|---------|-------|
| `wa_hadir` | Absen masuk berhasil | Hijau |
| `wa_terlambat` | Absen terlambat | Merah |
| `wa_pulang_lebih_awal` | Pulang sebelum jam shift | Kuning |
| `wa_tidak_absen_pulang` | Tidak absen pulang (5 jam setelah shift) | Merah |
| `wa_alpa` | Tidak absen seharian | Merah |
| `wa_reminder_belum_absen` | 30 menit sebelum shift | Biru |

### Pengaturan

HR/Manager dapat mengaktifkan/menonaktifkan setiap jenis notifikasi melalui halaman `/pengaturan-wa`.

**Konfigurasi:** API Key di `.env` → `STARSAPI_KEY`

---

## 20. Task / Project Management

**Akses:** Semua pengguna terautentikasi  
**URL:** `/project/dashboard`  
**Controller:** `TaskController`, `ProjectsController`, `ProjectListsController`  
**Model:** `projects`, `project_lists`, `tasks`, `task_assignments`, `project_activities`

### Fitur

- **Project:** Buat proyek dengan nama, deskripsi, deadline, status
- **List (Kolom):** Setiap proyek memiliki kolom (To Do, In Progress, Done)
- **Task (Kartu):** Kartu tugas dengan prioritas (RENDAH/SEDANG/TINGGI/DARURAT), tanggal, dan drag-and-drop reorder
- **Assign:** Tugaskan karyawan ke task
- **Activity Log:** Catat semua perubahan proyek

---

## 21. Manajemen Pengguna

**Akses:** HR/Manager  
**URL:** `/karyawan`, `/daftar-user`  
**Controller:** `KaryawanController`, `UserController`

### Data Karyawan

| Data | Deskripsi |
|------|-----------|
| NIP, NIK | Nomor induk pegawai/kependudukan |
| Biodata | Tempat/tanggal lahir, jenis kelamin, agama, status pernikahan |
| Kontak | Email, no HP, alamat |
| Dokumen | Foto profil, KTP, ijazah, KK, CV, sertifikat |
| Status Kerja | AKTIF / NONAKTIF |
| Role | HR / MANAGER / KARYAWAN |
| Akses Khusus | Toggle untuk absensi khusus (timer) |
| Divisi, Cabang, Shift | Penempatan dan jadwal |

---

## 22. Role & Akses

**Middleware:** `RoleMiddleware`

| Role | Hak Akses |
|------|-----------|
| **HR** | Full akses: dashboard, semua data, approval izin/lembur, pengaturan |
| **MANAGER** | Dashboard, data kehadiran, approval izin/lembur (tanpa pengaturan sistem) |
| **KARYAWAN** | Absensi, izin, lembur, agenda, kalender, report, profile, task |

---

## 23. Cron Job / Tugas Terjadwal

Diatur di `routes/console.php`, dijalankan oleh Laravel Scheduler.

| Perintah | Jadwal | Fungsi |
|----------|--------|--------|
| `absensi:generate-alpha` | 23:55 setiap hari | Tandai karyawan tanpa absen sebagai **ALPA** atau **LIBUR** |
| `absensi:generate-alpha-sensei` | 23:55 setiap hari | Tandai sensei tanpa absen |
| `app:cek-absen-pulang` | Setiap 10 menit | Tandai **TIDAK ABSEN PULANG** (5 jam setelah shift) |
| `app:reminder-absen` | Setiap 1 menit | Kirim pengingat WA 30 menit sebelum shift |
| `app:notif-keterlambatan` | Setiap 15 menit | Kirim notifikasi WA untuk yang terlambat |
| `app:notif-tidak-absen-pulang` | Setiap jam (+5 menit) | Kirim notifikasi WA lupa absen pulang |

### Menjalankan Scheduler

```
php artisan schedule:work
```

Atau tambahkan ke cron job server:

```
* * * * * cd /path/to/project && php artisan schedule:run >> /dev/null 2>&1
```

---

## Instalasi

### Prasyarat
- PHP ^8.2
- Composer
- Node.js & NPM
- SQLite / MySQL / PostgreSQL

### Langkah Instalasi

```bash
# Clone repository
git clone <repo-url>
cd absensi-karyawan-mendunia

# Install dependencies PHP
composer install

# Install dependencies Node
npm install

# Copy environment
cp .env.example .env
# Edit .env: atur database, STARSAPI_KEY, dll.

# Generate key
php artisan key:generate

# Jalankan migrasi
php artisan migrate

# Build frontend
npm run build

# Jalankan server
php artisan serve
```

### Konfigurasi .env

```
DB_CONNECTION=sqlite  # atau mysql/pgsql
STARSAPI_KEY=         # API Key StarSender WhatsApp
APP_URL=              # URL aplikasi
```

---

## Role & Alur Login

1. **Login:** Email + password → sistem deteksi role → redirect sesuai role
2. Jika status `NONAKTIF` → tidak bisa login
3. Session via database, lifetime 120 menit
4. Register: semua role bisa mendaftar (perlu disetujui/admin ubah role)

---

## Lisensi

Hak cipta © 2026. Dibangun dengan Laravel 12.
