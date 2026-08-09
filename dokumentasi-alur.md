# Dokumentasi Alur Sistem — SIM MENDUNIA

Dokumen ini menjelaskan alur kerja (business flow) setiap fitur pada sistem SIM Mendunia beserta role yang terlibat.

> **Role yang berlaku di sistem:** `ADMIN`, `MANAGER`, `HR`, `ACCOUNTING`, `ADMIN_CABANG`, `GURU` (Sensei), `KARYAWAN`, `KANDIDAT` (Siswa), `AFFILIATE`.
> Pembagian hak akses diatur di `frontend/src/components/Sidebar.tsx`, `AdminCabangSidebar.tsx`, `frontend/src/App.tsx`, dan `backend/routes/api.php`.

---

## A. PENDAFTARAN & PEMASARAN

### 1. Pendaftaran Kandidat
Kandidat/Affiliate mengisi formulir pendaftaran publik → Admin/HR/Manager meninjau data pada menu **Pendaftar** → Admin/HR/Manager approve atau reject.

**Role terlibat:** Kandidat, Affiliate, Admin, HR, Manager, Admin Cabang (melihat pendaftar cabangnya)

### 2. Verifikasi Pembayaran
Kandidat mengunggah bukti bayar saat pendaftaran/tagihan → Admin/HR/Accounting/Admin Cabang memverifikasi pembayaran → status pembayaran diperbarui (lunas/pending).

**Role terlibat:** Kandidat, Admin, HR, Accounting, Admin Cabang

### 3. Link Affiliate
Admin/Manager membuat link affiliate (pilih affiliate + produk) → Affiliate menyebarkan link ke calon kandidat → sistem mencatat views & pendaftar_count otomatis.

**Role terlibat:** Admin, Manager, Affiliate, Kandidat (calon)

### 4. Komisi Affiliate
Sistem mencatat komisi otomatis saat Admin/HR/Manager approve pendaftar dari link affiliate → Manager/Admin memverifikasi & memproses pencairan komisi ke Affiliate.

**Role terlibat:** Affiliate, Admin, Manager, HR, Accounting

### 5. Kupon Diskon
Admin/Manager membuat & mengatur kupon (persen/nominal, kuota, masa berlaku) → sistem memvalidasi otomatis saat kandidat memakai kupon pada form pendaftaran.

**Role terlibat:** Admin, Manager, Kandidat

### 6. Data Batch/Angkatan
Admin/HR/Manager menginput data batch (nama, kuota, cabang) → Admin Cabang mengelola operasional batch tersebut di cabangnya masing-masing.

**Role terlibat:** Admin, HR, Manager, Admin Cabang

---

## B. AKADEMIK (PEMBELAJARAN)

### 7. Jadwal Level
Admin Cabang menginput jadwal level per batch (tanggal mulai/selesai tiap level) → diperiksa dan disetujui oleh Manager/HR/Admin sebelum berlaku.

**Role terlibat:** Admin Cabang, Manager, HR, Admin

### 8. Data Guru/Sensei
Admin Cabang/HR menginput data guru baru (nip, mata pelajaran) → Admin/Manager memverifikasi & mengaktifkan status guru.

**Role terlibat:** Admin Cabang, HR, Admin, Manager, Guru

### 9. Kelas Sensei
Admin Cabang membuat kelas & menugaskan guru per batch → Manager/HR meninjau alokasi kelas dan jadwal mengajar.

**Role terlibat:** Admin Cabang, Manager, HR, Admin, Guru

### 10. Penilaian Harian Siswa
Guru menginput nilai harian siswa per komponen melalui dashboard mobile → Admin Cabang/Akademik merekap nilai melalui matrix penilaian.

**Role terlibat:** Guru, Admin Cabang, Admin, HR, Manager

### 11. Raport Siswa
Guru menginput nilai & evaluasi per level → Admin Cabang/Akademik men-generate raport final dalam bentuk PDF untuk siswa.

**Role terlibat:** Guru, Admin Cabang, Admin, HR, Manager, Siswa

### 12. Evaluasi Instruktur
Siswa mengisi form evaluasi terhadap instruktur per level → Admin/Akademik merekap hasil evaluasi seluruh guru.

**Role terlibat:** Siswa, Admin, HR, Manager, Admin Cabang, Accounting

### 13. LMS – Course & Lesson
Admin/Guru membuat course dan lesson (materi, file, urutan) → Siswa mengakses, mempelajari, dan menandai lesson selesai.

**Role terlibat:** Admin, Guru, Admin Cabang, Siswa

### 14. LMS – Assignment
Guru membuat assignment pada course → Siswa mengumpulkan tugas (submission) → Guru memeriksa dan memberi nilai (grading).

**Role terlibat:** Guru, Siswa, Admin Cabang

### 15. Matching Job (Kandidat MJ)
Kandidat melengkapi form data diri (pengalaman, keluarga, pendidikan, dll.) → Admin/HR/MJ merekap & meninjau data kandidat untuk proses penempatan.

**Role terlibat:** Kandidat, Admin, HR, Manager, Admin Cabang

---

## C. ABSENSI & KEHADIRAN

### 16. Absensi Karyawan
Karyawan melakukan check-in/out mandiri (geofencing radius cabang, deteksi wajah, dan/atau scan QR) → sistem menentukan status otomatis (HADIR/TERLAMBAT) → HR memantau melalui rekap absensi.

**Role terlibat:** Karyawan, Admin, HR, Manager

### 17. Absensi Sensei
Guru melakukan check-in/out per kelas yang diajar → Admin Cabang/HR memantau rekap kehadiran sensei melalui kalender.

**Role terlibat:** Guru, Admin Cabang, HR, Admin, Manager

### 18. Absensi Siswa
Guru/Admin melakukan absensi massal per kelas (mass store) → Admin Cabang merekap kehadiran siswa dan mengekspor laporan (Excel/PDF).

**Role terlibat:** Guru, Admin, Admin Cabang, HR, Manager

### 19. Data Kehadiran & Kehadiran Khusus
Sistem mencatat kehadiran harian karyawan → Admin/HR/Manager dapat meng-update status kehadiran manual bila diperlukan.

**Role terlibat:** Admin, HR, Manager, Admin Cabang

### 20. Rekap Absensi & Rekap Jadwal Shift
Admin/HR/Manager melihat rekap absensi harian/bulanan dan rekap per shift → dapat memperbaiki status bila datanya salah.

**Role terlibat:** Admin, HR, Manager, Admin Cabang

### 21. Monitoring Lokasi
Karyawan/Guru mengirim lokasi GPS saat absen → Admin/HR meninjau posisi karyawan di peta secara real-time.

**Role terlibat:** Karyawan, Guru, Admin, HR, Manager, Admin Cabang

### 22. Hari Libur
Admin/HR/Manager membuat daftar hari libur (nasional/khusus) → sistem otomatis menonaktifkan absensi pada hari tersebut.

**Role terlibat:** Admin, HR, Manager

---

## D. HR & OPERASIONAL

### 23. Izin/Cuti Karyawan
Karyawan mengajukan izin/cuti melalui aplikasi mobile → HR/Manager menerima notifikasi & melakukan approve/reject (termasuk via WhatsApp).

**Role terlibat:** Karyawan, HR, Manager, Admin

### 24. Lembur Karyawan
Karyawan mengajukan lembur dengan bukti foto → HR/Manager meninjau dan melakukan approve/reject pengajuan lembur.

**Role terlibat:** Karyawan, HR, Manager, Admin

### 25. Data Karyawan Baru
HR menginput data karyawan baru (dokumen, divisi, cabang) → Admin memverifikasi kelengkapan data & mengaktifkan akun user.

**Role terlibat:** HR, Admin, Manager

### 26. Master Data (Divisi, Cabang, Shift)
Admin/HR menginput & mengelola master data divisi, cabang (latitude/longitude, radius), dan shift → data digunakan sebagai acuan seluruh modul absensi dan HR.

**Role terlibat:** Admin, HR, Manager

### 27. Daftar User & Manajemen Akun
Admin mengelola akun user (buat, ubah, nonaktifkan), mengatur role, password, dan status aktivasi.

**Role terlibat:** Admin, HR

### 28. Shift Kerja & Jadwal Shift
Admin/HR mengelola data shift & meng-createMultiple jadwal shift untuk karyawan → Karyawan melihat jadwal shift di dashboard.

**Role terlibat:** Admin, HR, Manager, Admin, Karyawan

### 29. Pengaturan Shift
Admin/Manager mengatur aturan shift plan (otomatis/multi) melalui halaman Pengaturan Shift.

**Role terlibat:** Admin, Manager

---

## E. KEUANGAN

### 30. Data Pengeluaran
Admin Cabang/Accounting menginput data pengeluaran dengan bukti → Manager/HR/Accounting memverifikasi melalui dashboard keuangan.

**Role terlibat:** Admin Cabang, Accounting, Admin, HR, Manager

### 31. Pembayaran & Tagihan
Admin/Accounting melihat ringkasan tagihan per batch, menandai pembayaran lunas/batal lunas, dan melihat riwayat pembayaran kandidat.

**Role terlibat:** Admin, HR, Accounting, Manager, Admin Cabang, Kandidat

### 32. Biaya Kategori & Biaya per Batch
Admin menentukan kategori biaya (pendaftaran, pelatihan, dll.) dan nominal biaya per batch → menjadi dasar tagihan kandidat.

**Role terlibat:** Admin, Manager, HR, Admin Cabang

### 33. Pengaturan Pembayaran & Bank
Admin mengatur bank tujuan, nomor rekening, dan pengaturan transfer yang ditampilkan saat kandidat membayar.

**Role terlibat:** Admin, Manager

### 34. Pencairan Komisi
Admin/Manager mengelola daftar komisi affiliate yang siap dicairkan dan memproses pembayaran.

**Role terlibat:** Admin, Manager, HR, Accounting

---

## E. NOTIFIKASI & AUTOMASI

### 35. Notifikasi WA/Email
Sistem mengirim notifikasi terjadwal secara otomatis (cron: reminder absen, keterlambatan, pembayaran, approval izin/lembur) → Admin memantau log pengiriman & status gagal/terkirim.

**Role terlibat:** Admin, HR, Manager (penerima: Kandidat, Karyawan, Guru, Affiliate)

### 36. Template Notifikasi
Admin membuat & membersihkan template pesan WA/Email untuk berbagai event (onboarding, tagihan, absensi, dsb.).

**Role terlibat:** Admin, HR

### 37. AI Chat
Seluruh role yang berwenang terdeteksi men-akses menu AI Chat secara mandiri untuk bertanya informasi umum → tidak memerlukan proses approval.

**Role terlibat:** Admin, Manager, HR, Accounting, Admin Cabang, Guru, Karyawan

---

## F. WEBSITE & PUBLIK

### 38. Blog & Konten Website
Admin mengelola artikel blog & kategori di halaman Data Blog → konten tampil publik di `/blog` dan `/blog/:slug`.

**Role terlibat:** Admin, Publik (Kandidat/Affiliate)

### 39. Landing & Halaman Publik
Halaman landing, program, testimoni, FAQ, dan kontak ditampilkan untuk calon pendaftar.

**Role terlibat:** Publik (calon), Admin (mengelola via Perusahaan)

### 40. Visitor Counter
Sistem mencatat pengunjung website publik → ditampilkan pada statistik.

**Role terlibat:** Publik, Admin

---

## G. DASHBOARD PER ROLE

### 41. Dashboard Admin/Manager/HR/Accounting (Backoffice)
Satu aplikasi dashboard dengan menu: Manage Kandidat, Program, Affiliate vs Pasukan, Akademik, Akademik, HR & Operasional, Manajemen Absensi, Keuangan, Website, AI & Automasi, dan Pengaturan — menu di-filter sesuai role.

**Role terlibat:** Admin, Manager, HR, Accounting

### 42. Dashboard Admin Cabang
Dashboard khusus cabang: kandidat, pendaftar, tagihan, batch, kelas, rekap, akademik (jadwal level, rekap sis vamos, penilaian, evaluasi, LMS, raport), dan keuangan (pengeluaran).

**Role terlibat:** Admin Cabang

### 43. Dashboard Guru (Sensei)
Guru mengelola kelas saya, absen per kelas, penilaian harian, level evaluation, dan ranking per batch.

**Role terlibat:** Guru

### 44. Dashboard Karyawan
Karyawan absen dengan foto/QR, melihat jadwal shift, agenda, riwayat, izin, lembur, dan profil.

**Role terlibat:** Karyawan

### 45. Dashboard Siswa
Siswa mengakses data diri, absensi, pembayaran, LMS, nilai, matching job, dan profil.

**Role terlibat:** Kandidat/Siswa

### 46. Dashboard Affiliate
Affiliate melihat statistik link, produk aktif, komisi, dan membuat link baru.

**Role terlibat:** Affiliate

### 47. Pengaturan System & Profil Perusahaan
Admin mengelola profil perusahaan (logo, alamat, kontak), pengaturan WA, shift, dan pengaturan umum yang dipakai web publik.

**Role terlibat:** Admin, Manager

### 48. Penempatan Kandidat (Integrasi)
Integrasi dengan sistem penempatan (proxy API): Admin mengirim/membaca data kandidat (cabang, dokumen, dashboard penempatan) untuk proses keberangkatan kerja.

**Role terlibat:** Admin (dan sistem penempatan eksternal)

---

## A. RANGKUMAN MENU PER ROLE

| Role | Menu / Halaman utama |
|------|----------------------|
| **Admin** | Semua menu (kandidat, program, Akademik, HR, keuangan, AI, website) |
| **Manager** | Hampir semua menu kecuali kelola Affiliate Dashboard; approval dan keuangan |
| **HR** | Mirip Manager (data karyawan, absensi, izin/lembur, keuangan) |
| **ACCOUNTING** | Keuangan, Manage Kandidat (kandidat/pendaftaran/tagihan), Program, Manajemen Absensi, Akademik (hanya Evaluasi) |
| **ADMIN_CABANG** | Kandidat, Pendaftar, Tagihan, Batch, Kelas, Rekap; Akademik (Jadwal Level, Rekap, Penilaian, Evaluasi, LMS, Raport); Keuangan (Pengeluaran) |
| **GURU/SENSEI** | Dashboard Guru (absen, penilaian, LMS, kelas, profil) |
| **KARYAWAN** | Dashboard Karyawan (absen + QR/foto, izin, lembur, jadwal, riwayat, profil) |
| **KANDIDAT/SISWA** | Data Diri, Absensi, Pembayaran, LMS, Nilai, Matching Job, Profil |
| **AFFILIATE** | Dashboard Affiliate (profil, program, link, statistik, komisi) |
| **Publik (tanpa login)** | Landing, program, FAQ, kontak, blog, verifikasi, daftar, bayar |

---

*Dokumen ini disusun berdasarkan kode di `frontend/src/App.tsx`, `frontend/src/components/Sidebar.tsx`, `frontend/src/components/AdminCabangSidebar.tsx`, dan `backend/routes/api.php`. Perbarui saat ada fitur baru.*