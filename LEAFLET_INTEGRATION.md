# Integrasi Leaflet Maps - Dashboard Sebaran Lokasi Absensi

## Overview

Komponen **LocationTracker** telah diintegrasikan ke Dashboard untuk menampilkan peta real-time sebaran lokasi absensi karyawan menggunakan Leaflet.

## Fitur

✅ **Peta Interaktif**
- Menampilkan OpenStreetMap sebagai base layer
- Zoom otomatis ke semua markers

✅ **Markers Real-Time**
- 🟢 **Hijau**: Check-in (absen masuk) dengan icon marker
- 🔵 **Biru**: Check-out (absen pulang) dengan icon marker
- Popup info dengan nama karyawan, jam, tanggal, dan cabang

✅ **Otomatis Refresh**
- Refresh data setiap 30 detik secara default
- Bisa dikonfigurasi atau manual refresh dengan tombol

✅ **Statistik Real-Time**
- Menampilkan jumlah check-in dan check-out
- Status "Live" dengan animasi pulse

✅ **Responsive Design**
- Menyesuaikan ukuran screen (mobile, tablet, desktop)
- Loading state yang elegan

## File-File yang Diubah/Dibuat

### 1. Komponen Baru: `frontend/src/components/LocationTracker.tsx`
- Komponen React reusable untuk menampilkan peta Leaflet
- Props: `height`, `showLiveIndicator`, `autoRefresh`, `refreshInterval`
- Integrasi dengan API `/api/monitoring-lokasi`

### 2. File Diubah: `frontend/src/pages/Dashboard.tsx`
- Import komponen `LocationTracker`
- Mengganti placeholder peta dengan komponen yang fungsional
- Peta menampilkan absensi hari ini dengan real-time refresh

## Cara Kerja

### Data Flow
```
Dashboard.tsx 
  ↓ (render)
LocationTracker.tsx 
  ↓ (fetch)
monitoringLokasiApi.get() 
  ↓ (request)
Backend: /api/monitoring-lokasi 
  ↓ (query DB)
MonitoringController@apiMonitoring 
  ↓ (response JSON)
LocationTracker: render markers
  ↓ (every 30s)
auto refresh
```

### API Endpoint
**GET** `/api/monitoring-lokasi`

**Query Parameters:**
- `tgl_mulai` (YYYY-MM-DD) - Tanggal mulai
- `tgl_selesai` (YYYY-MM-DD) - Tanggal selesai
- `cabang_id` (number) - Filter cabang (opsional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "shift_id": 1,
      "cabang_id": 1,
      "tanggal": "2024-03-10",
      "jam_masuk": "08:15",
      "jam_keluar": "17:30",
      "lat_masuk": -6.2088,
      "long_masuk": 106.8456,
      "lat_pulang": -6.2089,
      "long_pulang": 106.8457,
      "status": "HADIR",
      "user": {
        "id": 1,
        "name": "John Doe",
        "nip": "001"
      },
      "cabang": {
        "id": 1,
        "nama_cabang": "Pusat"
      }
    }
  ],
  "list_cabang": [...]
}
```

## Penggunaan Komponen

### Implementasi di Dashboard
```jsx
<LocationTracker 
  height="h-72 sm:h-[400px]"
  showLiveIndicator={true}
  autoRefresh={true}
  refreshInterval={30000}  // 30 detik
/>
```

### Implementasi Standalone
```jsx
import LocationTracker from '../components/LocationTracker'

function MyPage() {
  return (
    <div>
      <h1>Sebaran Lokasi Absensi</h1>
      <LocationTracker height="h-96" />
    </div>
  )
}
```

### Props Reference
| Prop | Type | Default | Deskripsi |
|------|------|---------|-----------|
| `height` | string | `'h-72'` | Tailwind height class untuk container peta |
| `showLiveIndicator` | boolean | `true` | Tampilkan indikator "Live" |
| `autoRefresh` | boolean | `true` | Aktifkan auto-refresh |
| `refreshInterval` | number | `30000` | Interval refresh dalam milliseconds |

## Dependencies

✅ Sudah terinstall di `frontend/package.json`:
- `leaflet`: ^1.9.4
- `@types/leaflet`: ^1.9.21

## Testing

### 1. Development Mode
```bash
cd frontend
npm run dev
# Buka http://localhost:5173/
# Klik menu Dashboard untuk melihat peta
```

### 2. Verifikasi Peta Muncul
- Seharusnya muncul peta OpenStreetMap dengan markers
- Jika belum ada data absensi hari ini, akan muncul pesan "Belum ada data absensi untuk hari ini"
- Tombol "Refresh" dapat digunakan untuk manual update

### 3. Verifikasi Real-Time Update
- Buka developer console (F12)
- Perhatikan network tab untuk melihat request ke `/api/monitoring-lokasi`
- Seharusnya ada request setiap 30 detik

## Troubleshooting

### Peta tidak muncul
1. Periksa browser console untuk error
2. Pastikan Leaflet CSS ter-import dengan benar
3. Pastikan container memiliki height yang valid

### Markers tidak muncul
1. Pastikan ada data absensi dengan lat/long di database
2. Periksa network tab untuk response dari `/api/monitoring-lokasi`
3. Periksa browser console untuk warning

### Auto-refresh tidak berfungsi
1. Periksa network tab, request harus terjadi setiap 30 detik
2. Periksa apakah `autoRefresh={true}` di props
3. Cek console untuk error API

## Fitur Tambahan yang Bisa Diimplementasikan

🔄 **Saran Pengembangan:**
1. Filter cabang real-time (tanpa reload halaman)
2. Filter rentang tanggal
3. Zoom ke marker tertentu saat klik
4. Geofencing circles untuk tampilkan radius cabang
5. Heatmap untuk area dengan banyak absensi
6. Export peta sebagai image
7. Animation trail untuk karyawan tertentu
8. WebSocket untuk update yang benar-benar real-time

## Build untuk Production

```bash
cd frontend
npm run build
# Output di: dist/
```

## Performance Notes

- Component menggunakan `useRef` untuk optimalisasi
- Markers di-cleanup sebelum re-render
- Auto-refresh dapat diatur intervalnya sesuai kebutuhan
- Pada dataset besar (>500 markers), pertimbangkan clustering

---

**Dibuat**: March 2024
**Framework**: React 19 + Vite + Leaflet 1.9
**Status**: ✅ Production Ready
