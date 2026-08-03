# Dokumentasi Dashboard Cabang (Admin Cabang)

Dokumen ini menjelaskan fitur-fitur yang tersedia pada **Dashboard Admin Cabang**.

## Overview

Dashboard Admin Cabang adalah halaman utama (`/admin-cabang`) yang digunakan oleh pengguna dengan role `ADMIN_CABANG`. Dashboard ini menampilkan ringkasan data operasional cabang dalam satu tampilan, mencakup:

- Statistik pendaftar dan kandidat
- Rekap keuangan cabang (tagihan, pembayaran, pengeluaran)
- Grafik tren 6 bulan terakhir
- Informasi batch aktif
- Aktivitas terbaru (pendaftar & pembayaran)

Data pada dashboard hanya menampilkan data yang terkait dengan cabang yang ditugaskan ke akun admin tersebut (scoping per cabang).

---

## Fitur-Fitur Dashboard

### 1. Header / Sapaan
- Menampilkan judul **"Dashboard Admin Cabang"**
- Menampilkan nama user yang sedang login sebagai sapaan selamat datang

### 2. Statistik Pendaftar (4 Kartu)
Empat kartu statistik yang menunjukkan status pendaftar:

| Kartu | Ikon | Keterangan |
|-------|------|------------|
| Total Pendaftar | Users (biru) | Jumlah seluruh pendaftar pada batch cabang |
| Disetujui | CheckCircle (hijau) | Jumlah pendaftar berstatus `disetujui` |
| Pending | Clock (kuning) | Jumlah pendaftar berstatus `pending` |
| Ditolak | UserX (merah) | Jumlah pendaftar berstatus `ditolak` |

### 3. Statistik Sekunder (3 Kartu)
- **Siswa Aktif** — jumlah siswa dengan status `AKTIF` pada batch cabang
- **Pengeluaran Bulan Ini** — total pengeluaran cabang pada bulan berjalan (format Rupiah)
- **Outstanding** — total tagihan yang belum terbayar (selisih tagihan dengan pembayaran terkumpul)

### 4. Grafik Pendaftar per Bulan (Bar Chart)
- Grafik batang berwarna biru
- Menampilkan jumlah pendaftar dalam 6 bulan terakhir (per bulan)
- Membantu memantau tren pertumbuhan pendaftar

### 5. Grafik Pembayaran per Bulan (Line Chart)
- Grafik garis berwarna hijau dengan area fill
- Menampilkan total pembayaran (Rupiah) dalam 6 bulan terakhir
- Sumbu Y otomatis menampilkan satuan ringkas (`rb` / `jt`)

### 6. Grafik Pengeluaran per Bulan (Bar Chart)
- Grafik batang berwarna oranye
- Menampilkan total pengeluaran cabang dalam 6 bulan terakhir

### 7. Grafik Pengeluaran per Kategori (Doughnut Chart)
- Grafik donat multicolor
- Menampilkan komposisi pengeluaran cabang berdasarkan kategori pengeluaran pada bulan berjalan
- Tooltip menampilkan nominal dalam format Rupiah
- Menampilkan pesan *"Belum ada data"* bila belum ada pengeluaran

### 8. Rekap Keuangan
Ringkasan keuangan cabang dalam satu panel:
- **Total Tagihan** — total biaya produk dari seluruh pendaftar
- **Terkumpul** — total pembayaran yang sudah diterima
- **Outstanding** — total tagihan yang belum dibayar
- **Persentase Terkumpul** — progress bar hijau yang menunjukkan rasio pembayaran terkumpul terhadap total tagihan

### 9. Batch Aktif
- Daftar batch yang dimiliki cabang (maksimal 5 batch ditampilkan)
- Setiap baris menampilkan nama batch dan jumlah siswa aktif
- Menampilkan pesan *"Tidak ada batch"* bila belum ada batch

### 10. Pendaftar Terbaru
- Daftar 5 pendaftar terbaru
- Menampilkan nama, batch, program, dan status pendaftaran
- Status diberi warna: hijau (`disetujui`), kuning (`pending`), merah (`ditolak`)

### 11. Pembayaran Terbaru
- Daftar 5 pembayaran terbaru
- Menampilkan nama pendaftar, batch, dan nominal pembayaran (format Rupiah)

---

## Informasi Teknis

- **Route:** `/admin-cabang`
- **Halaman:** `frontend/src/pages/AdminCabang/AdminCabangDashboard.tsx`
- **Endpoint API:** `GET /admin-cabang/dashboard`
- **Backend:** `backend/app/Http/Controllers/AdminCabangController.php` → method `dashboard()`
- **Chart Library:** Chart.js via `react-chartjs-2` (Bar, Line, Doughnut)
- **Scoping Data:** Data dibatasi berdasarkan cabang (`cabang_ids`) dan batch (`batch_id`) milik user admin cabang yang login

### Data yang Dikembalikan Endpoint

```json
{
  "user": { "name": "...", "email": "...", "role": "..." },
  "branches": [1, 2],
  "stats": {
    "total_pendaftar": 0,
    "pendaftar_disetujui": 0,
    "pendaftar_pending": 0,
    "pendaftar_ditolak": 0,
    "total_tagihan": 0,
    "total_terkumpul": 0,
    "total_outstanding": 0,
    "total_siswa_aktif": 0,
    "total_pengeluaran_bulan_ini": 0
  },
  "batches": [{ "id": 1, "nama_batch": "...", "siswas_count": 0 }],
  "recent_pendaftar": [],
  "recent_pembayaran": [],
  "charts": {
    "rekap_pendaftar": [{ "label": "Mar 2026", "total": 0 }],
    "rekap_pembayaran": [{ "label": "Mar 2026", "total": 0 }],
    "rekap_pengeluaran": [{ "label": "Mar 2026", "total": 0 }],
    "pengeluaran_per_kategori": [{ "nama": "...", "kode": "...", "total": 0, "jumlah": 0 }]
  }
}
```
