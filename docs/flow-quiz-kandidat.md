# Fitur Paket Soal / Quiz Kandidat

## 1. Ringkasan

Sistem quiz MCQ (Multiple Choice Question) untuk evaluasi kandidat/siswa.
- **Guru/Instruktur**: buka paket soal, kelola soal, toggle buka/tutup paket, lihat hasil + kunci jawaban + foto webcam.
- **Kandidat/Siswa**: daftar paket yang tersedia, mengerjakan quiz dengan timer, kamera pengawas, deteksi keluar aplikasi (warning → auto-submit), 3x percobaan max, nilai terbaik yang diambil, kandidat hanya melihat skor.

---

## 2. Kebutuhan Sistem

### 2.1 Database (4 tabel baru)

```
quiz_pakets
├── id
├── user_id          → users.id (guru pemilik)
├── course_id        → lms_courses.id (nullable, kaitkan ke kursus)
├── batch_id         → batches.id (nullable, scope kandidat)
├── level            → nullable (scope kandidat, string "1"-"4")
├── title
├── description      → nullable
├── time_limit_minutes → default 30
├── max_attempts     → default 3 (kandidat boleh ulang, skor terbaik)
├── max_warnings     → default 3 (keluar app → warning, max = auto-submit)
├── passing_score    → default 0 (reshold lulus)
├── shuffle_questions → boolean default false (acak urutan soal per percobaan)
├── status           → enum('aktif','nonaktif') default 'nonaktif'
├── created_at / updated_at

quiz_questions
├── id
├── quiz_paket_id    → quiz_pakets.id (cascade delete)
├── question         → text soal
├── options          → json array ["A","B","C","D"] (min 2, max 6)
├── correct_index    → integer (index kunci jawaban, 0-based)
├── points           → integer default 1 (bobot skor)
├── sort             → integer default 0 (urutan tampil)
├── created_at / updated_at

quiz_attempts (satu baris per percobaan kandidat)
├── id
├── quiz_paket_id    → quiz_pakets.id
├── siswa_id         → siswas.id
├── attempt_number   → integer (1,2,3,... unik per paket+siswa)
├── started_at       → timestamp
├── submitted_at     → nullable timestamp (saat submit / auto-submit)
├── time_limit_seconds → integer (snapshot durasi saat mulai)
├── status           → enum('in_progress','submitted')
├── score            → nullable integer (0-100, diisi saat finalize)
├── correct_count    → nullable integer
├── total_count      → nullable integer
├── warnings         → integer default 0
├── auto_submitted   → boolean default false
├── webcam_photo     → nullable string (path di storage disk 'public')
├── created_at / updated_at

quiz_answers (satu baris per soal yang sudah dijawab)
├── id
├── quiz_attempt_id  → quiz_attempts.id (cascade delete)
├── quiz_question_id → quiz_questions.id (cascade delete)
├── selected_index   → nullable integer (index jawaban kandidat, -1/null = belum dijawab)
├── is_correct       → nullable boolean (diisi saat finalize/skor)
├── created_at / updated_at
├── unique(attempt_id, question_id)
```

### 2.2 Relasi Eloquent

```
QuizPaket
  ├── belongsTo User (guru)
  ├── belongsTo Course (nullable)
  ├── belongsTo Batch (nullable)
  ├── hasMany QuizQuestion (orderBy sort)
  └── hasMany QuizAttempt

QuizQuestion
  └── belongsTo QuizPaket (with 'paket')

QuizAttempt
  ├── belongsTo QuizPaket (with 'paket' → questions)
  ├── belongsTo Siswa
  └── hasMany QuizAnswer

QuizAnswer
  ├── belongsTo QuizAttempt
  └── belongsTo QuizQuestion
```

### 2.3 Access Control

| Endpoint | Role | Scope |
|---|---|---|
| `guru/quiz/*` | GURU | Hanya akses paket milik user_id sendiri |
| `quiz/*` | KANDIDAT | Hanya akses paket `aktif` + scope `batch_id`/`level` cocok dengan siswa |

---

## 3. Flow Guru / Instruktur

### 3.1 Menu

Akses dari **GuruDashboard → Menu Cepat → "Paket Soal"** → route `/guru-paket-soal`

### 3.2 CRUD Paket Soal

```
[GBUAT PAKET]
├── Judul (wajib)
├── Deskripsi (opsional)
├── Batch (opsional) → filter kandidat mana yang bisa lihat
├── Level (opsional, depend ke batch) → filter kandidat
├── Kursus LMS (opsional) → kaitkan paket ke pelajaran
├── Durasi (menit) → default 30
├── Maks Percobaan → default 3
├── Maks Peringatan → default 3
├── Nilai Lulus (0-100) → default 0
├── Acak Soal (toggle) → default off
├── Status: Buka / Tutup (toggle)
└── SIMPAN

[KELOLA SOAL]
├── List soal (nomor, pertanyaan, opsi, kunci hijau, poin)
├── Tambah Soal: teks + opsi (min 2, max 6) + pilih kunci + poin
├── Edit / Hapus Soal
├── Sort up/down (pindah urutan)
└── Info: "Kunci jawaban hanya terlihat di sini, tidak pernah dikirim ke kandidat"

[HASIL + KUNCI JAWABAN]
├── List per peserta: nama, batch, attempts, nilai terbaik
├── Klik nama → list percobaan per kandidat
│   ├── #1: skor, jumlah benar, peringatan, waktu, status auto/manual
│   └── [FOTO WEBCAM terlampir]
└── Klik percobaan → DETAIL:
    ├── Skor akhir, benar/total, peringatan
    ├── Foto webcam (jika ada)
    └── Setiap soal:
        ├── Soal + semua opsi
        ├── Kunci jawaban (hijau + label "KUNCI")
        ├── Jawaban kandidat (merah jika salah)
        └── Status: BENAR / SALAH / TIDAK DIJAWAB
```

### 3.3 Toggle Buka/Tutup Paket

- **Tutup** (nonaktif): kandidat tidak bisa lihat / mulai quiz
- **Buka** (aktif): kandidat bisa lihat paket di daftar quiz mereka
- Toggle via switch di card paket → `POST /guru/quiz/pakets/{id}/toggle`

---

## 4. Flow Kandidat / Siswa

### 4.1 Menu

Akses dari **SiswaDashboard → Menu Cepat → "Quiz"** → route `/siswa-dashboard/quiz`

### 4.2 Daftar Paket (index)

```
GET /api/quiz/pakets → list paket aktif yang cocok dengan batch/level siswa

Response per paket:
├── title, description, course_title, batch_name
├── questions_count, time_limit_minutes, max_attempts, passing_score
├── attempts_used (sudah berapa kali dikerjakan)
├── best_score (skor terbaik, null jika belum pernah)
├── can_start (true jika attempts_used < max_attempts)
```

**Visibility rules** (backend):
- Paket harus `status = 'aktif'`
- `batch_id` paket = null ATAU = `batch_id` siswa
- `level` paket = null ATAU = `(string) level` siswa

### 4.3 Aturan & Kamera (sebelum mulai)

Setelah klik paket → halaman aturan:

```
Aturan:
├── Durasi X menit (auto-submit saat waktu habis)
├── Max N peringatan (keluar app → warning, terakhir = auto-submit)
├── Kamera pengawas aktif selama quiz
└── Max M percobaan, nilai terbaik diambil

Riwayat percobaan sebelumnya:
├── #1: 75 poin ✓
├── #2: 50 poin ✓
└── Sisa percobaan: 1×
```

### 4.4 Izin Kamera (modal)

```
[Aktifkan kamera pengawas]
├── Kamera akan merekam saat mengerjakan quiz
├── Preview video dari kamera
├── Jika izin ditolak: "Kamera diperlukan untuk mengikuti quiz"
└── [Mulai Quiz] (hanya aktif jika kamera berhasil)
```

**Catatan**: Resume percobaan lama **tidak butuh** kamera (langsung masuk quiz).

### 4.5 Mulai Quiz (start)

```
POST /api/quiz/pakets/{id}/start

Backend:
├── Cek paket aktif + visible untuk siswa
├── Jika ada attempt in_progress → return 422 + attempt_id (resume)
├── Jika used >= max_attempts → 422 "Batas percobaan tercapai"
├── Buat QuizAttempt baru (attempt_number = used + 1)
├── Load soal (dari relasi paket)
├── Jika shuffle_questions ON → acak urutan soal
├── Kirim tanpa correct_index (anti-leak)
└── Response: { attempt: {id, attempt_number, started_at, time_limit_seconds, max_warnings}, questions: [...] }
```

### 4.6 Pengerjaan Quiz

```
[Timer] ←── countdown dari started_at + time_limit_seconds
[Peringatan banner] ←── muncul saat keluar app
[Kamera] ←── foto live + snapshot dikirim tiap 25 detik

Soal 1: [Pertanyaan]
  (A) Opsi A      ←── klik = jawab, klik lagi = batalkan
  (B) Opsi B
  (C) Opsi C
  (D) Opsi D

Soal 2: ...
...
```

**Autosave**: Setiap kali kandidat memilih/membatalkan jawaban → langsung `POST /api/quiz/attempts/{id}/answer`

```
answer flow:
├── Simpan/hapus selected_index di quiz_answers
├── Jika soal tidak valid → 422
├── Jika attempt sudah submitted → 422
└── Response: { question_id, selected_index }
```

### 4.7 Deteksi Keluar Aplikasi (Anti-Cheat)

```
visibilitychange → document.hidden = true
│
├── POST /api/quiz/attempts/{id}/warn
│   ├── warnings += 1
│   ├── Jika warnings >= max_warnings → finalize(auto) → submit otomatis
│   └── Response: { warnings, max_warnings, auto_submitted, status }
│
└── Frontend tampilkan banner:
    "Peringatan #N: Anda meninggalkan halaman quiz.
     Keluar lagi akan mengumpulkan quiz otomatis."
```

### 4.8 Submit (Manual / Otomatis)

**Manual**: Klik "Selesai & Kumpulkan" → konfirmasi SweetAlert → submit

**Otomatis**: Waktu habis (timer 0) ATAU warnings mencapai max

```
finalize(attempt):
├── Load semua jawaban (keyed by question_id)
├── Untuk setiap soal:
│   ├── total_points += poin soal
│   ├── Jika selected_index == correct_index → benar, points earned += poin
│   └── Update is_correct di quiz_answers
├── Skor = round(points_earned * 100 / total_points)
└── Update attempt: status=submitted, score, correct_count, total_count, auto_submitted

Response:
{
  attempt: {
    attempt_id, attempt_number, status, score (0-100),
    correct_count, total_count, answered_count,
    warnings, max_warnings, auto_submitted,
    started_at, submitted_at, time_limit_seconds, passing_score
  }
}
```

### 4.9 Halaman Hasil

```
[Selamat, Anda lulus!] / [Quiz Selesai]

Nilai: 75 (lulus jika ≥ 60)

├── Benar: 3/4
├── Terjawab: 4
└── Peringatan: 1

Kunci jawaban hanya dapat dilihat oleh instruktur/guru.
[Selesai] → kembali ke daftar paket
```

---

## 5. API Endpoints

### 5.1 Guru (`/api/guru/quiz/*`)

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/guru/quiz/meta` | Batch, level, course untuk form paket |
| GET | `/guru/quiz/pakets` | Daftar paket milik guru + stats |
| POST | `/guru/quiz/pakets` | Buat paket baru |
| POST | `/guru/quiz/pakets/{id}` | Update paket |
| DELETE | `/guru/quiz/pakets/{id}` | Hapus paket + semua data |
| POST | `/guru/quiz/pakets/{id}/toggle` | Toggle aktif/nonaktif |
| GET | `/guru/quiz/pakets/{id}/questions` | Daftar soal paket |
| POST | `/guru/quiz/pakets/{id}/questions` | Tambah soal |
| POST | `/guru/quiz/questions/{id}` | Update soal |
| DELETE | `/guru/quiz/questions/{id}` | Hapus soal |
| GET | `/guru/quiz/pakets/{id}/results` | Hasil + kunci jawaban + webcam per peserta |
| GET | `/guru/quiz/attempts/{id}` | Detail percobaan: soal+kunci+jawaban siswa |

### 5.2 Kandidat (`/api/quiz/*`)

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/quiz/pakets` | Daftar paket aktif yang visible |
| GET | `/quiz/pakets/{id}` | Detail paket + riwayat percobaan |
| POST | `/quiz/pakets/{id}/start` | Mulai / resume percobaan |
| GET | `/quiz/attempts/{id}` | Ambil attempt (resume) / lihat hasil |
| POST | `/quiz/attempts/{id}/answer` | Simpan jawaban per soal |
| POST | `/quiz/attempts/{id}/warn` | Laporkan keluar aplikasi |
| POST | `/quiz/attempts/{id}/submit` | Submit + hitung skor |
| POST | `/quiz/attempts/{id}/webcam` | Upload foto webcam (jpg/png, max 3MB) |

---

## 6. Skor & Penilaian

```
Skor = round(total_poin_jawaban_benar × 100 / total_poin_semua_soal)

Contoh:
├── Soal A: 2 poin (jawab benar) → 2
├── Soal B: 1 poin (jawab salah) → 0
├── Soal C: 1 poin (tidak dijawab) → 0
└── Skor = round(2 × 100 / 4) = 50

Nilai lulus: passing_score (default 0, maks 100)
Nilai terbaik: diambil dari max score di antara semua percobaan
```

---

## 7. Flow Resume (Lanjutkan Percobaan)

```
Kandidat keluar quiz (browser tutup / pindah tab / reload)

Saat buka kembali → klik paket → halaman aturan
├── Riwayat menunjukkan: #3 [Status: LANJUTKAN*]
└── Klik "Lanjutkan Percobaan"

POST /api/quiz/pakets/{id}/start
├── Deteksi ada attempt in_progress
├── Return 422 + { attempt_id }
├── Frontend langsung GET /api/quiz/attempts/{attempt_id}
└── Response: attempt data + soal + selected_index yang sudah ada

Atau: expired? (started_at + time_limit_seconds + 5 detik grace period)
├── attempt otomatis di-submitted (finalize auto)
├── Return attempt yang sudah submitted (skor sudah ada)
└── Frontend tampilkan halaman hasil
```

---

## 8. Shuffle Soal

- Server mengacak urutan soal di `start()` saat `shuffle_questions = true`
- Jawaban di-map berdasarkan `question_id`, bukan index → aman
- Setiap percobaan bisa beda urutan

---

## 9. Upload Webcam

- Tersimpan ke disk `public` → path `quiz/webcam/`
- Dikirim via `POST /quiz/attempts/{id}/webcam` (FormData, field `photo`)
- Snapshot otomatis setiap 25 detik saat quiz berlangsung (kamera aktif)
- Hanya guru yang bisa melihat foto (di halaman hasil + detail percobaan)
- Saat delete percobaan → foto juga terhapus (cascade)

---

## 10. Frontend Pages

| Route | Halaman | Akses |
|---|---|---|
| `/guru-paket-soal` | `GuruPaketSoal.tsx` | GURU |
| `/siswa-dashboard/quiz` | `QuizKandidat.tsx` | KANDIDAT |

### GuruPaketSoal.tsx (3 views)
- **list**: daftar paket + statistik + toggle + tombol soal/hasil
- **questions**: list soal + tambah/edit/hapus + sort + tampilkan kunci hijau
- **results**: per peserta → list percobaan → detail dengan kunci + foto webcam

### QuizKandidat.tsx (4 views)
- **list**: daftar paket aktif yang cocok + status percobaan
- **rules**: aturan + riwayat + izin kamera (modal)
- **play**: soal + timer + autosave jawaban + deteksi keluar app
- **result**: skor saja (tidak ada kunci)
