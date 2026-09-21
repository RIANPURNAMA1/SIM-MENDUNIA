# SIM Mendunia — WhatsApp Gateway (Baileys)

Gateway WhatsApp mandiri berbasis [`@whiskeysockets/baileys`](https://github.com/Whiskeysockets/Baileys)
yang menggantikan penyedia pihak ketiga (StarSender). Mendukung multi-device,
scan QR, reconnect otomatis, serta REST API untuk dikonsumsi backend Laravel.

## Cara menjalankan

```bash
cd wa-gateway
cp .env.example .env   # sesuaikan nilainya
npm install
npm start              # atau npm run dev (auto-reload)
```

Server berjalan di `http://0.0.0.0:4300`.

## REST API

Semua endpoint (kecuali `/api/health`) wajib mengirim header:

```
x-gateway-token: <GATEWAY_TOKEN>
```

| Method | Endpoint | Deskripsi |
| --- | --- | --- |
| `GET` | `/api/health` | Status kesehatan gateway |
| `GET` | `/api/devices` | Daftar device |
| `POST` | `/api/devices` | Daftarkan device baru (body: `{ name }`) |
| `GET` | `/api/devices/:slug` | Detail device |
| `GET` | `/api/devices/:slug/qr` | Status + QR device (`qr` string & `qrImage` data-URL) |
| `PATCH` | `/api/devices/:slug` | Ubah nama device (body: `{ name }`) |
| `POST` | `/api/devices/:slug/send` | Kirim pesan (body: `{ to, message }` atau `{ to, fileUrl, caption, type }`) |
| `POST` | `/api/devices/:slug/logout` | Logout device (hapus sesi) |
| `DELETE` | `/api/devices/:slug` | Hapus device |

## Webhook ke backend

Gateway mengirim event ke `BACKEND_BASE_URL/api/wa-gateway/webhook` dengan
header `X-Webhook-Secret: <BACKEND_WEBHOOK_SECRET>`. Event:

- `status` — perubahan status device (connecting/connected/disconnected/loggedOut)
- `qr` — QR baru tersedia
- `message` — pesan masuk (otomatis diproses backend, mis. balasan KONFIRMASI/BATAL)

## Sesi

Sesi tiap device disimpan di `SESSION_DIR/<slug>/` (dipakai `useMultiFileAuthState`).
Meta data device (nama) disimpan di `<slug>/device.json`. Saat gateway start,
semua sesi tersimpan dimuat ulang dan dicoba koneksi otomatis.

## Pengiriman aman (anti-block)

Semua pengiriman melewati antrian per-device agar tidak diblokir WhatsApp:

- Satu pesan per waktu (serial), dengan jarak minimum `SEND_MIN_INTERVAL_MS` (default 3s) + jitter acak `SEND_JITTER_MS`.
- Batas laju per menit/jam/hari (`SEND_MAX_PER_MINUTE`, `SEND_MAX_PER_HOUR`, `SEND_MAX_PER_DAY`).
  Jika batas tercapai, pesan ditunda hingga jendela waktu reset — tidak dibuang.
- Jika antrian sedang panjang, API `/send` merespons `202 { queued: true }` agar
  request tidak menggantung melebihi timeout backend, lalu kirim berjalan di latar belakang.

⚠️ Gunakan nomor baru yang masih "hangat" untuk device aktif, hindari blast ke banyak kontak
dalam sekali kirim, dan pertahankan volume di bawah batas WhatsApp. Ini lapisan pengaman aplikasi,
bukan jaminan bebas ban.