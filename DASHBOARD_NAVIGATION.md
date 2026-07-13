# Dashboard Navigation & Multi-Dashboard Setup

## Overview

Sistem navigasi dashboard yang memungkinkan user untuk memilih dan mengakses berbagai dashboard dari halaman pusat.

## Fitur

### 5 Dashboard Utama
1. **Dashboard Akademik** - Kelola data akademik siswa, guru, dan kelas
2. **Dashboard Absensi Karyawan** - Monitoring kehadiran, shift, dan lokasi absensi real-time
3. **Dashboard Kandidat** - Kelola data kandidat, pendaftaran, pembayaran, dan affiliate
4. **Dashboard Matching Job** - Manajemen lowongan pekerjaan, penempatan kandidat, dan rekrutmen
5. **Dashboard Keuangan** - Pencatatan pengeluaran, kategori biaya, dan rekap keuangan perusahaan (khusus HR & MANAGER)

### Dashboard Home (Central Hub)
- Tampilan card untuk setiap dashboard
- Filter berdasarkan role user (Dashboard Keuangan hanya untuk HR & MANAGER)
- Responsive design (1 kolom mobile, 2 kolom tablet, 3 kolom desktop)
- Hover effect dengan border highlight
- Link "Akses Sekarang" dengan animasi arrow

## File-File yang Diubah/Dibuat

| File | Jenis | Deskripsi |
|------|-------|-----------|
| `frontend/src/pages/Dashboard/DashboardHome.tsx` | Halaman pusat | 5 dashboard cards dengan role filtering |
| `frontend/src/pages/Dashboard/DashboardKandidat.tsx` | Dashboard | Dashboard kandidat |
| `frontend/src/pages/Dashboard/DashboardManagement.tsx` | Dashboard | Dashboard management |
| `frontend/src/pages/Absensi/DashboardAbsensi.tsx` | Dashboard | Dashboard absensi dengan peta Leaflet |
| `frontend/src/pages/Akademik/DashboardAkademik.tsx` | Dashboard | Dashboard akademik |
| `frontend/src/pages/Keuangan/DashboardKeuangan.tsx` | Dashboard | Dashboard keuangan (grafik pengeluaran, profit/loss) |

## Routes

```
/ (root)                     → DashboardHome (halaman pusat)
/dashboard-absensi           → DashboardAbsensi
/dashboard-akademik          → DashboardAkademik
/dashboard-kandidat          → DashboardKandidat
/dashboard-management        → DashboardManagement
/dashboard-keuangan          → DashboardKeuangan (HR & MANAGER only)
```

## Struktur Dashboard Home

```
DashboardHome
  ├── Header ("Dashboard Pusat" + subtitle)
  ├── Grid Cards (5 dashboard)
  │   ├── Card: Dashboard Akademik (BookOpen icon)
  │   ├── Card: Dashboard Absensi Karyawan (UserCheck icon)
  │   ├── Card: Dashboard Kandidat (FileText icon)
  │   ├── Card: Dashboard Matching Job (Briefcase icon)
  │   └── Card: Dashboard Keuangan (Wallet icon) ← HR & MANAGER only
  └── Footer Tip
```

## Role Filtering

```typescript
// Dashboard Keuangan hanya untuk HR & MANAGER
{
  id: 'keuangan',
  roles: ['HR', 'MANAGER'],
}
```

Jika user memiliki role selain HR/MANAGER, card Dashboard Keuangan tidak akan ditampilkan.

## Color Scheme

- **Akademik**: BookOpen icon (gray bg)
- **Absensi**: UserCheck icon (gray bg)
- **Kandidat**: FileText icon (gray bg)
- **Matching Job**: Briefcase icon (gray bg)
- **Keuangan**: Wallet icon (gray bg)

> Catatan: Menggunakan desain minimalis dengan gray background icon, bukan gradient.

## Cara Menggunakan

### 1. Akses Dashboard Home
- Dari sidebar, klik menu **"Pusat Dashboard"**
- Atau navigasi langsung ke `/`

### 2. Pilih Dashboard
- Lihat 5 card dashboard
- Klik card untuk membuka dashboard yang diinginkan
- Dashboard Keuangan hanya muncul untuk role HR & MANAGER

### 3. Navigasi Kembali
- Klik menu "Pusat Dashboard" di sidebar untuk kembali
- Atau gunakan browser back button

## Dashboard Keuangan

### Fitur
- Grafik pengeluaran bulanan (bar chart)
- Grafik perbandingan pengeluaran vs pendapatan (line chart)
- Grafik komposisi pengeluaran per kategori (doughnut chart)
- Total pengeluaran, pendapatan, dan profit/loss
- Transaksi terbaru

### Akses
- Hanya untuk role **HR** dan **MANAGER**
- Route: `/dashboard-keuangan`

## Testing

### 1. Development Mode
```bash
cd frontend
npm run dev
# Buka http://localhost:5173/
```

### 2. Akses Dashboard Home
- Klik menu "Pusat Dashboard" di sidebar
- atau buka `http://localhost:5173/`

### 3. Testing Navigation
- Klik setiap card dashboard
- Verifikasi navigasi berfungsi
- Test back button

### 4. Responsive Testing
- Test di mobile (375px)
- Test di tablet (768px)
- Test di desktop (1920px)

## Maintenance & Updates

Ketika menambah dashboard baru:

1. **Buat file halaman baru**
   ```
   frontend/src/pages/Dashboard/DashboardNama.tsx
   ```

2. **Update routes di App.tsx**
   ```tsx
   import DashboardNama from './pages/Dashboard/DashboardNama'
   <Route path="/dashboard-nama" element={<DashboardNama />} />
   ```

3. **Update DashboardHome.tsx**
   ```typescript
   const dashboards = [
     // ... existing
     {
       id: 'nama',
       title: 'Dashboard Nama',
       description: 'Deskripsi dashboard',
       path: '/dashboard-nama',
       icon: IconName,
       // roles: ['HR', 'MANAGER'], // optional: filter role
     }
   ]
   ```

4. **Update Sidebar.tsx** jika diperlukan

## Troubleshooting

### Dashboard tidak muncul di sidebar
1. Restart development server
2. Clear browser cache
3. Check console untuk error

### Navigasi tidak berfungsi
1. Verifikasi route terdaftar di App.tsx
2. Pastikan component import sudah benar
3. Check browser devtools → Network tab

### Dashboard Keuangan tidak muncul
1. Pastikan user login dengan role HR atau MANAGER
2. Role lain tidak akan melihat card ini (difilter di frontend)

### Styling tidak muncul
1. Pastikan Tailwind CSS ter-build dengan benar
2. Run `npm run build` untuk production
3. Check untuk CSS class conflicts

## Production Deployment

```bash
cd frontend
npm run build
# Output di folder 'dist/'
```

---

**Status**: Production Ready
**Version**: 2.0 (Updated Juli 2026)
