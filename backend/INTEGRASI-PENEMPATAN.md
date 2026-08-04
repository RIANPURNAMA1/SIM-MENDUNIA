# Panduan Integrasi API — Sistem SIM Mendunia

Dokumen ini untuk tim developer **sim-mendunia** agar bisa mengambil data kandidat
dari Sistem Penempatan (job.mendunia.id / api.penempatan.mendunia.id).

---

## 1. Informasi Umum

| Item            | Nilai |
|-----------------|-------|
| Base URL        | `https://api.penempatan.mendunia.id` |
| Format          | JSON |
| Auth            | Header `x-api-key` (tidak perlu login/token) |
| API Key         | `mendunia_eb5e66a28fda2f2159f9a2516bd5ed26fe3e4c5d3807a145` |
| Masa berlaku    | Permanent (selama tidak di-regenerate/dihapus/dinonaktifkan) |

> API key bersifat permanent. Jangan disimpan di kode frontend yang publik;
> simpan di server/backend sim-mendunia.

---

## 2. Cara Autentikasi

Setiap request **wajib** menyertakan header:

```
x-api-key: mendunia_eb5e66a28fda2f2159f9a2516bd5ed26fe3e4c5d3807a145
```

Jika key tidak ada / salah / nonaktif, respon:

```json
{
  "success": false,
  "message": "API key tidak valid"
}
```

HTTP Status: `401`

---

## 3. Endpoint

### 3.1 Daftar Kandidat (dengan pagination & filter)

```
GET /api/integrasi/kandidat
```

**Query Parameter (semua opsional):**

| Parameter       | Tipe    | Keterangan |
|-----------------|---------|------------|
| `page`          | number  | Nomor halaman (default `1`) |
| `limit`         | number  | Jumlah per halaman (default `50`, maks `200`) |
| `search`        | string  | Cari berdasarkan `nama_romaji` atau `nama_katakana` (partial match) |
| `status`        | string  | Filter `status_formulir` |
| `status_progres`| string  | Filter `status_progres` |
| `jenis_kelamin` | string  | Filter jenis kelamin (contoh: `Laki-laki` / `Perempuan`) |
| `cabang_id`     | number  | Filter per cabang |
| `bidang_ssw`    | string  | Filter `sertifikat_ssw` (partial match) |
| `jenjang`       | string  | Filter `pendidikan_terakhir` |

**Contoh Request:**

```bash
curl -H "x-api-key: mendunia_eb5e66a28fda2f2159f9a2516bd5ed26fe3e4c5d3807a145" \
  "https://api.penempatan.mendunia.id/api/integrasi/kandidat?page=1&limit=10&search=sato"
```

**Contoh Respon:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nama_katakana": "サトウ",
      "nama_romaji": "Sato Taro",
      "tempat_lahir": "Jakarta",
      "tanggal_lahir": "1998-05-14",
      "umur": 26,
      "jenis_kelamin": "Laki-laki",
      "status_pernikahan": "Lajang",
      "jumlah_anak": 0,
      "agama": "Islam",
      "tinggi_badan": 170,
      "berat_badan": 65,
      "golongan_darah": "A",
      "nomor_hp": "081234567890",
      "email_kontak": "sato@example.com",
      "alamat_lengkap": "Jl. Merdeka No. 1, Jakarta",
      "pendidikan_terakhir": "SMA/SMK",
      "level_jlpt": "N3",
      "level_jft": null,
      "sertifikat_ssw": "Teknik Mesin",
      "level_bahasa_jepang": "Menengah",
      "status_formulir": "Lengkap",
      "status_progres": "Seleksi",
      "status_keberangkatan": "Belum Berangkat",
      "nama_perusahaan": "PT. Jepang Maju",
      "bidang_ssw": "Teknik Mesin",
      "institusi": null,
      "created_at": "2024-01-10T09:30:00.000Z",
      "updated_at": "2024-02-01T12:00:00.000Z",
      "nama_cabang": "Jakarta"
    }
  ],
  "pagination": {
    "total": 125,
    "page": 1,
    "limit": 10,
    "total_pages": 13
  }
}
```

---

### 3.2 Detail Kandidat per ID

```
GET /api/integrasi/kandidat/:id
```

**Contoh Request:**

```bash
curl -H "x-api-key: mendunia_eb5e66a28fda2f2159f9a2516bd5ed26fe3e4c5d3807a145" \
  "https://api.penempatan.mendunia.id/api/integrasi/kandidat/1"
```

**Contoh Respon** (detail lengkap = seluruh field profil + array `pendidikan`, `pengalaman`, `keluarga`, `dokumen`):

```json
{
  "success": true,
  "data": {
    "id": 41,
    "nama_katakana": "ライハン ナウファル ヒバテゥラー",
    "nama_romaji": "Raihan Naufal Hibatullah",
    "tempat_lahir": "Tuban",
    "tanggal_lahir": "2007-03-19T17:00:00.000Z",
    "umur": 19,
    "jenis_kelamin": "Laki-laki",
    "pendidikan_terakhir": "SMA/SMK",
    "status_pernikahan": "Belum Menikah",
    "agama": "Islam",
    "tinggi_badan": 165,
    "berat_badan": 52,
    "golongan_darah": "O",
    "ukuran_baju": "L",
    "lingkar_pinggang": 77.0,
    "panjang_telapak_kaki": 26.0,
    "sim_dimiliki": "A",
    "nomor_hp": "082230737550",
    "email_kontak": "naufalraihan549@gmail.com",
    "kontak_ortu_nama": "Jiyatno",
    "kontak_ortu_hp": "0812-2914-7773",
    "alamat_lengkap": "Jl.Kerecaan Rt. 01/ Rw. 08 ...",
    "sudah_vaksin": 1,
    "penglihatan_kanan": "3",
    "penglihatan_kiri": "3",
    "berkacamata": 1,
    "lensa_kontak": 0,
    "buta_warna": 0,
    "kondisi_kesehatan": "Sehat",
    "riwayat_penyakit": "Tidak ada",
    "bertato": 0,
    "merokok": 0,
    "minum_alkohol": 0,
    "level_jlpt": "Belum ada",
    "level_jft": "A2",
    "lama_belajar_jepang": "9 bulan",
    "level_bahasa_jepang": "Menengah",
    "pernah_ke_jepang": 0,
    "keluarga_di_jepang": 0,
    "kenalan_di_jepang": 0,
    "sertifikat_ssw": "Pertanian",
    "id_prometric": null,
    "password_prometric": null,
    "tujuan_ke_jepang": "untuk mempelajari teknologi ...",
    "alasan_ke_jepang": "saya ingin melihat keindahan jepang ...",
    "cita_cita_setelah_jepang": "saat saya pulang ke Indonesia ...",
    "rencana_pengiriman_uang": 6,
    "kelebihan_diri": "saya pandai bekerja dalam tim ...",
    "kekurangan_diri": "saya memerlukan sedikit waktu ...",
    "hobi": "jogging",
    "keahlian": "bisa menyetir mobil",
    "lama_tinggal_jepang": "3-5 tahun",
    "lama_kerja_perusahaan": "1-2 tahun",
    "rencana_pulang": "3-4 kali",
    "sumber_biaya": "Dana Talang LPK",
    "biaya_disiapkan": "10-20 Juta",
    "bersedia_shift": 1,
    "bersedia_lembur": 1,
    "bersedia_hari_libur": 1,
    "penghasilan_keluarga": 4,
    "status_formulir": "draft",
    "status_progres": "lamar ke perusahaan",
    "status_keberangkatan": null,
    "nama_perusahaan": "LPK SO Sekai Indonesia",
    "bidang_ssw": "Pertanian",
    "institusi": "",
    "tgl_setsumeikai": null,
    "tgl_mensetsu_1": null,
    "tgl_mensetsu_2": null,
    "catatan_mensetsu": null,
    "biaya_pemberkasan": null,
    "adm_tahap_1": null,
    "adm_tahap_2": null,
    "dokumen_dikirim": null,
    "terbit_kontrak": null,
    "kontrak_dikirim_tsk": null,
    "terbit_paspor": null,
    "masuk_imigrasi": null,
    "coe_terbit": null,
    "ektkln_pembuatan": null,
    "dokumen_dikirim_2": null,
    "visa": null,
    "jadwal_penerbangan": null,
    "created_at": "2026-05-25T06:33:00.000Z",
    "updated_at": "2026-08-03T03:26:55.000Z",
    "nama_cabang": "Bojonegoro Sukses Mendunia",
    "pendidikan": [
      {
        "jenjang": "SMA/SMK",
        "nama_sekolah": "MAN 1 BOJONEGORO",
        "jurusan": "Ips",
        "bulan_masuk": "Juli",
        "tahun_masuk": 2022,
        "bulan_lulus": "Mei",
        "tahun_lulus": 2025
      }
    ],
    "pengalaman": [
      {
        "nama_perusahaan": "Brilink TRIATMAJA",
        "alamat_perusahaan": null,
        "posisi": "staf",
        "bulan_masuk": "Mei",
        "tahun_masuk": 2025,
        "bulan_keluar": "Agustus",
        "tahun_keluar": 2025,
        "masih_bekerja": 0,
        "deskripsi_pekerjaan": null
      }
    ],
    "keluarga": [
      {
        "hubungan": "Ayah",
        "nama": "Jiyatno",
        "usia": 47,
        "pekerjaan": "wiraswasta",
        "penghasilan": "Rp 4 / bulan"
      },
      {
        "hubungan": "Ibu",
        "nama": "Siti Lailatu Sa'adah",
        "usia": 47,
        "pekerjaan": "ibu rumahtangga",
        "penghasilan": null
      }
    ],
    "dokumen": [
      {
        "jenis_dokumen": "sertifikat_jft",
        "nama_file": "1.png",
        "path_file": "uploads/.../1.png",
        "mime_type": "image/png",
        "ukuran_file": 123456,
        "uploaded_at": "2026-01-01T00:00:00.000Z",
        "file_url": "https://api.penempatan.mendunia.id/uploads/.../1.png"
      }
    ]
  }
}
```

> `file_url` pada dokumen berisi URL lengkap file (dibangun otomatis dari host API).

Jika id tidak ditemukan:

```json
{
  "success": false,
  "message": "Data tidak ditemukan"
}
```

HTTP Status: `404`

---

## 4. Endpoint Input Data Formulir Pendaftaran

### 4.1 Buat / Isi Formulir Kandidat Baru

```
POST /api/integrasi/kandidat
Content-Type: application/json
```

Membuat kandidat baru (otomatis membuat akun `kandidat`). Jika `email` sudah
terdaftar, data profil yang sudah ada akan diperbarui.

**Body (JSON)** — field yang sama dengan form `/formulir`:

```json
{
  "nama_romaji": "Raihan Naufal Hibatullah",
  "nama_katakana": "ライハン ナウファル ヒバテゥラー",
  "email": "naufalraihan549@gmail.com",
  "tempat_lahir": "Tuban",
  "tanggal_lahir": "2007-03-20",
  "umur": 19,
  "jenis_kelamin": "Laki-laki",
  "status_pernikahan": "Belum Menikah",
  "agama": "Islam",
  "tinggi_badan": 165,
  "berat_badan": 52,
  "golongan_darah": "O",
  "ukuran_baju": "L",
  "lingkar_pinggang": 77.0,
  "panjang_telapak_kaki": 26.0,
  "sim_dimiliki": "A",
  "nomor_hp": "082230737550",
  "email_kontak": "naufalraihan549@gmail.com",
  "kontak_ortu_nama": "Jiyatno",
  "kontak_ortu_hp": "0812-2914-7773",
  "alamat_lengkap": "Jl.Kerecaan ...",
  "pendidikan_terakhir": "SMA/SMK",
  "sertifikat_ssw": "Pertanian",
  "level_jlpt": "Belum ada",
  "level_jft": "A2",
  "level_bahasa_jepang": "Menengah",
  "status_formulir": "draft",
  "status_progres": "Pending",
  "penghasilan_keluarga": 4,
  "pendidikan": [
    { "jenjang": "SD", "nama_sekolah": "MI SALAFIYAH", "jurusan": null,
      "bulan_masuk": "Juli", "tahun_masuk": 2013, "bulan_lulus": "Juli", "tahun_lulus": 2019 }
  ],
  "pengalaman": [
    { "nama_perusahaan": "Brilink TRIATMAJA", "posisi": "staf",
      "bulan_masuk": "Mei", "tahun_masuk": 2025, "bulan_keluar": "Agustus", "tahun_keluar": 2025,
      "masih_bekerja": false, "deskripsi_pekerjaan": null }
  ],
  "keluarga": [
    { "hubungan": "Ayah", "nama": "Jiyatno", "usia": 47, "pekerjaan": "wiraswasta", "penghasilan": "Rp 4 / bulan" },
    { "hubungan": "Ibu", "nama": "Siti Lailatu Sa'adah", "usia": 47, "pekerjaan": "ibu rumahtangga" }
  ]
}
```

**Contoh Request:**

```bash
curl -X POST "https://api.penempatan.mendunia.id/api/integrasi/kandidat" \
  -H "Content-Type: application/json" \
  -H "x-api-key: mendunia_eb5e66a28fda2f2159f9a2516bd5ed26fe3e4c5d3807a145" \
  -d '{ "nama_romaji": "Test Kandidat", "email": "test@example.com", "jenis_kelamin": "Laki-laki" }'
```

**Contoh Respon:**

```json
{
  "success": true,
  "message": "Data formulir kandidat berhasil disimpan",
  "data": { "id": 42 }
}
```

**Catatan:**
- `tanggal_lahir` dikirim format `YYYY-MM-DD` (atau ISO, otomatis dinormalisasi).
- Field boolean (`sudah_vaksin`, `berkacamata`, `bersedia_shift`, dll.) terima
  `true/false`, `1/0`, atau `"1"/"0"`.
- `sertifikat_ssw` bisa string `"Pertanian"` atau array `["Pertanian"]`.
- Default password akun kandidat: `12345678` (jika email baru).

---

### 4.2 Update Data Formulir Kandidat yang Sudah Ada

```
PUT /api/integrasi/kandidat/:id
Content-Type: application/json
```

Mengupdate data profil + `pendidikan` + `pengalaman` + `keluarga` kandidat
berdasarkan ID. `pendidikan`/`pengalaman`/`keluarga` akan **diganti total** sesuai
array yang dikirim (kosongkan array untuk menghapus).

**Contoh Request:**

```bash
curl -X PUT "https://api.penempatan.mendunia.id/api/integrasi/kandidat/42" \
  -H "Content-Type: application/json" \
  -H "x-api-key: mendunia_eb5e66a28fda2f2159f9a2516bd5ed26fe3e4c5d3807a145" \
  -d '{ "level_bahasa_jepang": "Lancar", "status_progres": "lamar ke perusahaan" }'
```

**Contoh Respon:**

```json
{
  "success": true,
  "message": "Data formulir kandidat berhasil diupdate",
  "data": { "id": 42 }
}
```

Jika id tidak ditemukan: HTTP `404`, `{ "success": false, "message": "Kandidat tidak ditemukan" }`.

---

### 4.3 Upload Dokumen Kandidat

```
POST /api/integrasi/kandidat/:id/upload-dokumen?jenis_dokumen=<jenis>
Content-Type: multipart/form-data
```

Field multipart: `file` (file yang diupload).

Mengganti dokumen dengan jenis yang sama (file lama otomatis dihapus dari DB).

**Jenis dokumen yang didukung** (`jenis_dokumen`):

| Jenis              | Wajib? |
|--------------------|--------|
| `sertifikat_jft`   | Ya |
| `pas_foto`         | Ya |
| `foto_full_body`   | Ya |
| `kk`               | Ya |
| `ktp`              | Ya |
| `ijazah`           | Ya |
| `akte`             | Ya |
| `lainnya`          | Tidak |
| `ssw_1`, `ssw_2`, ... | Tidak (Sertifikat SSW, bisa banyak) |
| `video_perkenalan` | Tidak |

**Batas ukuran:**
- Dokumen standar & foto: **500KB**
- `foto_full_body`: **3MB**
- `video_perkenalan`: **20MB**

Format: JPG, PNG, GIF, PDF, MP4, MOV, AVI, WEBM.

**Contoh Request:**

```bash
curl -X POST "https://api.penempatan.mendunia.id/api/integrasi/kandidat/42/upload-dokumen?jenis_dokumen=pas_foto" \
  -H "x-api-key: mendunia_eb5e66a28fda2f2159f9a2516bd5ed26fe3e4c5d3807a145" \
  -F "file=@C:/foto/pas_foto.jpg"
```

**Contoh Respon:**

```json
{
  "success": true,
  "message": "Dokumen berhasil diupload",
  "path": "42/1234567890-ab12.jpg",
  "size": "245.10 KB"
}
```

---

### 4.4 Hapus Dokumen Kandidat

```
DELETE /api/integrasi/kandidat/:id/dokumen?jenis_dokumen=pas_foto
```

**Contoh Request:**

```bash
curl -X DELETE "https://api.penempatan.mendunia.id/api/integrasi/kandidat/42/dokumen?jenis_dokumen=pas_foto" \
  -H "x-api-key: mendunia_eb5e66a28fda2f2159f9a2516bd5ed26fe3e4c5d3807a145"
```

**Contoh Respon:**

```json
{ "success": true, "message": "Dokumen berhasil dihapus" }
```

Jika dokumen tidak ada: HTTP `404`.

---

### 4.5 Daftar Cabang

```
GET /api/integrasi/cabang
```

**Query Parameter (opsional):**

| Parameter | Tipe   | Keterangan |
|-----------|--------|------------|
| `search`  | string | Cari `nama_cabang`, `kode_cabang`, `kota`, atau `provinsi` |
| `status`  | string | Filter `aktif` / `nonaktif` |

**Contoh Request:**

```bash
curl -H "x-api-key: mendunia_eb5e66a28fda2f2159f9a2516bd5ed26fe3e4c5d3807a145" \
  "https://api.penempatan.mendunia.id/api/integrasi/cabang?search=bojonegoro"
```

**Contoh Respon:**

```json
{
  "success": true,
  "data": [
    {
      "id": 6,
      "nama_cabang": "Bojonegoro Sukses Mendunia",
      "kode_cabang": "BJsm",
      "alamat": "Jl. Madrasah RT 003 RW 005 Sidodadi Sukosewu Bojonegoro Jawa Timur",
      "kota": "Bojonegoro",
      "provinsi": "Jawa Timur",
      "telepon": "081234916191",
      "email": "bojonegoromendunia@gmail.com",
      "status": "aktif"
    }
  ]
}
```

### 4.6 Detail Cabang

```
GET /api/integrasi/cabang/:id
```

**Contoh Request:**

```bash
curl -H "x-api-key: mendunia_eb5e66a28fda2f2159f9a2516bd5ed26fe3e4c5d3807a145" \
  "https://api.penempatan.mendunia.id/api/integrasi/cabang/6"
```

Jika id tidak ditemukan: HTTP `404`, `{ "success": false, "message": "Cabang tidak ditemukan" }`.

---

### 4.7 Dashboard / Statistik Kandidat

```
GET /api/integrasi/dashboard
```

Menampilkan statistik keseluruhan (sama dengan dashboard admin).

**Query Parameter (opsional):**

| Parameter     | Tipe   | Keterangan |
|---------------|--------|------------|
| `filter_type` | string | `today`, `yesterday`, `week`, `month` (filter berdasarkan tanggal dibuat) |
| `start_date`  | string | Format `YYYY-MM-DD` (awal rentang, wajib disertai `end_date`) |
| `end_date`    | string | Format `YYYY-MM-DD` |
| `cabang_id`   | number | Filter hanya satu cabang |

**Contoh Request:**

```bash
curl -H "x-api-key: mendunia_eb5e66a28fda2f2159f9a2516bd5ed26fe3e4c5d3807a145" \
  "https://api.penempatan.mendunia.id/api/integrasi/dashboard"
```

**Struktur Respon:**

```json
{
  "success": true,
  "data": {
    "total": 385,
    "byStatus": [
      { "status_formulir": "draft", "count": 268 },
      { "status_formulir": "submitted", "count": 30 },
      { "status_formulir": "reviewed", "count": 41 },
      { "status_formulir": "approved", "count": 45 }
    ],
    "byCabang": [
      { "nama_cabang": "Bojonegoro Sukses Mendunia", "count": 12 }
    ],
    "bySSWGender": [
      { "ssw": "Pertanian", "laki": 11, "perempuan": 7, "total": 18 }
    ],
    "bySSWProgres": [
      { "ssw": "Pertanian", "progres": [ { "status": "Job Matching", "count": 5 } ] }
    ],
    "byCabangProgres": [
      { "nama_cabang": "Bojonegoro Sukses Mendunia", "status_progres": "Interview", "count": 1 }
    ],
    "jftByGender": [
      { "jenis_kelamin": "Laki-laki", "has_jft": 187, "no_jft": 22 }
    ],
    "jftByCabang": [
      { "nama_cabang": "Bojonegoro Sukses Mendunia", "has_jft": 10, "no_jft": 2 }
    ],
    "sswByGender": [
      { "jenis_kelamin": "Laki-laki", "has_ssw": 21, "no_ssw": 188 }
    ],
    "sswByCabang": [
      { "nama_cabang": "Bojonegoro Sukses Mendunia", "has_ssw": 3, "no_ssw": 9 }
    ],
    "interviewByCabang": [
      { "nama_cabang": "Bojonegoro Sukses Mendunia", "interview_laki": 1, "interview_perempuan": 0, "jadwalkan_laki": 0, "jadwalkan_perempuan": 0, "lulus_laki": 0, "lulus_perempuan": 0 }
    ],
    "interviewByGender": [
      { "jenis_kelamin": "Laki-laki", "interview": 1, "lulus": 0 }
    ]
  }
}
```

**Catatan:**
- `byStatus` berisi jumlah kandidat per `status_formulir` (`draft`, `submitted`, `reviewed`, `approved`, `rejected`). Dari sini sim-mendunia bisa hitung "Terkirim", "Direview", "Disetujui", dan "Draft".
- `bySSWGender` = statistik per bidang SSW (berdasarkan kandidat `approved`).
- `jftByGender`/`sswByGender` = jumlah punya/belum sertifikat JFT & SSW per gender.
- `interviewByCabang`/`interviewByGender` = jumlah interview & lulus interview (berdasarkan histori perubahan status).

---

## 5. Daftar Field yang Dikembalikan

**List:** field dasar kandidat.
**Detail:** seluruh kolom profil + array `pendidikan`, `pengalaman`, `keluarga`, dan `dokumen`.

`id`, `nama_katakana`, `nama_romaji`, `tempat_lahir`, `tanggal_lahir`, `umur`,
`jenis_kelamin`, `status_pernikahan`, `jumlah_anak`, `agama`, `tinggi_badan`,
`berat_badan`, `golongan_darah`, `nomor_hp`, `email_kontak`, `alamat_lengkap`,
`pendidikan_terakhir`, `level_jlpt`, `level_jft`, `sertifikat_ssw`,
`level_bahasa_jepang`, `status_formulir`, `status_progres`,
`status_keberangkatan`, `nama_perusahaan`, `bidang_ssw`, `institusi`,
`created_at`, `updated_at`, `nama_cabang`

---

## 6. Kode Error

| HTTP Status | Keterangan |
|-------------|------------|
| `200`       | Sukses |
| `201`       | Kandidat berhasil dibuat |
| `400`       | Data tidak valid (mis. nama kosong, ID tidak valid) |
| `401`       | API key tidak ditemukan / tidak valid / nonaktif |
| `404`       | Data kandidat tidak ditemukan |
| `500`       | Server error |

---

## 7. Contoh Implementasi

### Node.js / Axios

```js
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://api.penempatan.mendunia.id',
  headers: {
    'x-api-key': 'mendunia_eb5e66a28fda2f2159f9a2516bd5ed26fe3e4c5d3807a145',
  },
});

// List kandidat
const res = await api.get('/api/integrasi/kandidat', {
  params: { page: 1, limit: 50, search: 'sato' },
});
console.log(res.data.data, res.data.pagination);

// Detail kandidat
const detail = await api.get('/api/integrasi/kandidat/1');
console.log(detail.data.data);

// Buat / isi formulir kandidat
const created = await api.post('/api/integrasi/kandidat', {
  nama_romaji: 'Raihan Naufal Hibatullah',
  email: 'naufalraihan549@gmail.com',
  jenis_kelamin: 'Laki-laki',
  pendidikan_terakhir: 'SMA/SMK',
  keluarga: [
    { hubungan: 'Ayah', nama: 'Jiyatno', usia: 47, pekerjaan: 'wiraswasta' },
  ],
});
console.log('Kandidat ID:', created.data.data.id);

// Update formulir kandidat by id
await api.put('/api/integrasi/kandidat/42', {
  level_bahasa_jepang: 'Lancar',
  status_progres: 'lamar ke perusahaan',
});

// Upload dokumen (multipart/form-data)
const FormData = require('form-data');
const fs = require('fs');
const fd = new FormData();
fd.append('file', fs.createReadStream('pas_foto.jpg'));
await api.post('/api/integrasi/kandidat/42/upload-dokumen?jenis_dokumen=pas_foto', fd, {
  headers: fd.getHeaders(),
});

// List cabang
const cabang = await api.get('/api/integrasi/cabang');
console.log(cabang.data.data);

// Dashboard statistik
const dashboard = await api.get('/api/integrasi/dashboard');
console.log(dashboard.data.data.total, dashboard.data.data.byStatus);
```

### PHP / cURL

```php
$ch = curl_init('https://api.penempatan.mendunia.id/api/integrasi/kandidat?page=1&limit=10');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'x-api-key: mendunia_eb5e66a28fda2f2159f9a2516bd5ed26fe3e4c5d3807a145',
]);
$response = curl_exec($ch);
curl_close($ch);
$data = json_decode($response, true);
```

---

## 8. Catatan

1. **HTTPS wajib** — jangan panggil endpoint pakai `http://` (akan diblokir browser sebagai mixed content).
2. **Rate limit:** tidak ada saat ini, tapi mohon pakai `page`/`limit` agar efisien.
3. API key bersifat permanent; untuk pembaruan/perubahan key, hubungi admin Sistem Penempatan.
