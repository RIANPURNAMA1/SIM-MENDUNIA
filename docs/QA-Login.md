# QA Documentation — Fitur Login (Black Box Testing)

| Meta | Detail |
|---|---|
| **Aplikasi** | SIM Mendunia |
| **Fitur** | Login |
| **Endpoint** | `POST /api/auth/login` |
| **Halaman** | `/login` |
| **Tgl Pengujian** | |
| **Penguji** | |

---

## 1. Skenario Pengujian

### 1.1 Positive Test Cases

| ID | Skenario | Langkah | Data Uji | Hasil yang Diharapkan |
|---|---|---|---|---|
| **TC-L-001** | Login dengan email dan password valid (role AFFILIATE) | 1. Buka `/login`<br>2. Isi email<br>3. Isi password<br>4. Isi captcha<br>5. Klik "Masuk" | email: `affiliate@test.com`<br>password: `password123`<br>captcha: sesuai gambar | Redirect ke `/affiliate-dashboard`<br>Menampilkan dashboard affiliate |
| **TC-L-002** | Login dengan email dan password valid (role KANDIDAT) | Sama seperti di atas | email: `kandidat@test.com`<br>password: `password123` | Redirect ke `/siswa-dashboard` |
| **TC-L-003** | Login dengan email dan password valid (role GURU) | Sama seperti di atas | email: `guru@test.com`<br>password: `password123` | Redirect ke `/guru-dashboard` |
| **TC-L-004** | Login dengan email dan password valid (role ADMIN_CABANG) | Sama seperti di atas | email: `admincabang@test.com`<br>password: `password123` | Redirect ke `/admin-cabang` |
| **TC-L-005** | Login dengan email dan password valid (role ACCOUNTING) | Sama seperti di atas | email: `accounting@test.com`<br>password: `password123` | Redirect ke `/dashboard-keuangan` |
| **TC-L-006** | Login dengan email dan password valid (role MANAGER / HR / ADMIN) | Sama seperti di atas | email: `manager@test.com`<br>password: `password123` | Redirect ke `/` (halaman utama) |
| **TC-L-007** | Login menggunakan **nama** (bukan email) | 1. Isi field dengan nama user<br>2. Isi password<br>3. Isi captcha<br>4. Klik "Masuk" | nama: `John Doe`<br>password: `password123` | Login berhasil, redirect sesuai role |
| **TC-L-008** | Login lalu logout, kemudian login kembali | 1. Login berhasil<br>2. Klik Logout<br>3. Login lagi dengan data yang sama | Email & password valid | Login berhasil kembali tanpa error |

### 1.2 Negative Test Cases — Input Validation

| ID | Skenario | Langkah | Data Uji | Hasil yang Diharapkan |
|---|---|---|---|---|
| **TC-L-009** | Login tanpa mengisi email | 1. Biarkan email kosong<br>2. Isi password<br>3. Isi captcha<br>4. Klik "Masuk" | email: `""`<br>password: `password123` | Muncul pesan error HTML5 "Isi field ini" atau validasi backend 422 |
| **TC-L-010** | Login tanpa mengisi password | 1. Isi email<br>2. Biarkan password kosong<br>3. Isi captcha<br>4. Klik "Masuk" | email: `test@test.com`<br>password: `""` | Muncul pesan error HTML5 "Isi field ini" |
| **TC-L-011** | Login tanpa mengisi captcha | 1. Isi email<br>2. Isi password<br>3. Biarkan captcha kosong<br>4. Klik "Masuk" | captcha: `""` | Muncul pesan "Kode captcha yang Anda masukkan salah" |
| **TC-L-012** | Login dengan captcha salah | 1. Isi email & password valid<br>2. Isi captcha dengan angka yang salah<br>3. Klik "Masuk" | captcha: `0000` (padahal yg benar `1234`) | Muncul pesan "Kode captcha yang Anda masukkan salah"<br>Captcha di-refresh |

### 1.3 Negative Test Cases — Authentication

| ID | Skenario | Langkah | Data Uji | Hasil yang Diharapkan |
|---|---|---|---|---|
| **TC-L-013** | Login dengan email terdaftar tapi password salah | 1. Isi email valid<br>2. Isi password salah<br>3. Isi captcha<br>4. Klik "Masuk" | email: `affiliate@test.com`<br>password: `salah123` | Muncul pesan error "Email/Nama atau password salah" |
| **TC-L-014** | Login dengan email tidak terdaftar | 1. Isi email tidak terdaftar<br>2. Isi password apapun<br>3. Isi captcha<br>4. Klik "Masuk" | email: `tidakada@test.com`<br>password: `password123` | Muncul pesan error "Email/Nama atau password salah" |
| **TC-L-015** | Login dengan user yang statusnya NONAKTIF | 1. Isi email user NONAKTIF<br>2. Isi password benar<br>3. Isi captcha<br>4. Klik "Masuk" | email: `nonaktif@test.com`<br>password: `password123` | Muncul pesan error "Akun tidak aktif" |
| **TC-L-016** | Login dengan field email diisi spasi | 1. Isi email dengan spasi<br>2. Isi password<br>3. Isi captcha<br>4. Klik "Masuk" | email: `"   "`<br>password: `password123` | Error 422 atau "Email/Nama atau password salah" |
| **TC-L-017** | Login dengan field password diisi spasi | 1. Isi email valid<br>2. Isi password dengan spasi<br>3. Isi captcha<br>4. Klik "Masuk" | email: `affiliate@test.com`<br>password: `"   "` | Error "Email/Nama atau password salah" |

### 1.4 Boundary & Edge Cases

| ID | Skenario | Langkah | Data Uji | Hasil yang Diharapkan |
|---|---|---|---|---|
| **TC-L-018** | Login dengan email yang mengandung karakter spesial | 1. Isi email dengan karakter `+`<br>2. Isi password benar<br>3. Isi captcha<br>4. Klik "Masuk" | email: `test+1@test.com`<br>password: `password123` | Login berhasil jika user terdaftar |
| **TC-L-019** | Login menggunakan huruf kapital pada email | 1. Isi email dengan huruf kapital<br>2. Isi password<br>3. Isi captcha<br>4. Klik "Masuk" | email: `Affiliate@Test.Com`<br>password: `password123` | Login berhasil (case-sensitive query, sesuaikan dengan data) |
| **TC-L-020** | Akses halaman dashboard tanpa login | 1. Buka URL `/affiliate-dashboard`<br>2. Belum login | - | Redirect ke halaman `/login` |
| **TC-L-021** | Akses halaman login setelah login | 1. Login berhasil<br>2. Buka `/login` lagi | - | Redirect ke dashboard sesuai role |
| **TC-L-022** | Login sebanyak 10+ kali berturut-turut | 1. Login-logout berulang kali | Email & password valid | Semua login berhasil, login log tercatat setiap kali |

### 1.5 Security Test Cases

| ID | Skenario | Langkah | Data Uji | Hasil yang Diharapkan |
|---|---|---|---|---|
| **TC-L-023** | SQL Injection pada field email | 1. Isi email dengan payload SQL Injection<br>2. Isi password<br>3. Klik "Masuk" | email: `' OR 1=1 --`<br>password: `apa saja` | Login gagal, tidak ada data bocor |
| **TC-L-024** | SQL Injection pada field password | 1. Isi email valid<br>2. Isi password dengan payload SQL Injection | password: `' OR '1'='1` | Login gagal |
| **TC-L-025** | XSS pada field email | 1. Isi email dengan script tag<br>2. Isi password<br>3. Klik "Masuk" | email: `<script>alert('xss')</script>` | Script tidak tereksekusi, tetap aman |
| **TC-L-026** | Brute force attempt (20x login cepat) | 1. Otomatis login 20x dengan password salah dalam waktu singkat | Email valid, password salah | Tidak ada rate limiting (catatan: belum ada proteksi di backend) |
| **TC-L-027** | Login dengan token/credentials dari response API | 1. Login sukses via Postman<br>2. Cek response API | - | Response hanya berisi `message` dan `user`, tidak ada token JWT/sanctum yang diekspos |

---

## 2. Matriks Hasil Pengujian

| ID | Skenario | Status (PASS/FAIL) | Catatan / Bug |
|---|---|---|---|
| TC-L-001 | Login AFFILIATE valid | | |
| TC-L-002 | Login KANDIDAT valid | | |
| TC-L-003 | Login GURU valid | | |
| TC-L-004 | Login ADMIN_CABANG valid | | |
| TC-L-005 | Login ACCOUNTING valid | | |
| TC-L-006 | Login MANAGER/HR/ADMIN valid | | |
| TC-L-007 | Login menggunakan nama | | |
| TC-L-008 | Login setelah logout | | |
| TC-L-009 | Email kosong | | |
| TC-L-010 | Password kosong | | |
| TC-L-011 | Captcha kosong | | |
| TC-L-012 | Captcha salah | | |
| TC-L-013 | Password salah | | |
| TC-L-014 | Email tidak terdaftar | | |
| TC-L-015 | User NONAKTIF | | |
| TC-L-016 | Email hanya spasi | | |
| TC-L-017 | Password hanya spasi | | |
| TC-L-018 | Karakter spesial email | | |
| TC-L-019 | Huruf kapital email | | |
| TC-L-020 | Akses tanpa login | | |
| TC-L-021 | Akses login setelah login | | |
| TC-L-022 | Login berulang 10x | | |
| TC-L-023 | SQL Injection email | | |
| TC-L-024 | SQL Injection password | | |
| TC-L-025 | XSS email | | |
| TC-L-026 | Brute force 20x | | |
| TC-L-027 | Response API token | | |

---

## 3. Ringkasan

| Item | Jumlah |
|---|---|
| Total Test Case | 27 |
| Positive | 8 |
| Negative — Input Validation | 4 |
| Negative — Authentication | 5 |
| Boundary & Edge | 5 |
| Security | 5 |
| **PASS** | |
| **FAIL** | |

---

## 4. Catatan & Temuan

- *(Diisi setelah pengujian)*
