# Deploy WhatsApp Gateway (wa-gateway)

> Panduan deploy service **mendunia-wa-gateway** (Node.js + Baileys) di VPS.
> **Tanpa Docker** — langsung install & jalankan sebagai service systemd di VPS.
> Service ini berdiri sendiri, terpisah dari Laravel, dan diakses backend via REST API
> dengan token (`x-gateway-token`). Tidak perlu diexpose ke publik.

---

## Arsitektur

```
Browser ── HTTPS ──► Nginx ──► frontend/dist/ (React)

                         │
                         ▼
               api.sim.mendunia.id ──► Laravel (PHP-FPM)
                                            │  HTTP (token: x-gateway-token)
                                            ▼
                          WA Gateway ─► Node 4300 (tidak perlu dipublikasikan)
                          (Baileys WhatsApp, satu koneksi per device)
                                            │  webhook (X-Webhook-Secret)
                                            ▼
                                     Laravel /api/wa-gateway/webhook
```

| Komponen | Keterangan |
|----------|------------|
| Node.js | >= 18 |
| Port default | `4300` (HTTP, internal) |
| Sesi device | `SESSION_DIR/<slug>/` (baileys multi-file auth) |
| Manajemen device | lewat halaman **WhatsApp Gateway** di frontend |

---

## 1. Prasyarat

```bash
# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

node -v   # >= 18
npm -v
```

---

## 2. Instalasi

Struktur folder di VPS:

```
/var/www/SIM-MENDUNIA/
├── backend/      # Laravel API
├── frontend/     # React + Vite
├── wa-gateway/   # service ini (Node.js + Baileys)
└── docs/         # dokumentasi project
```

```bash
# Letakkan project (contoh)
sudo mkdir -p /var/www/SIM-MENDUNIA/{backend,frontend,wa-gateway,docs}
sudo chown $USER:$USER /var/www/SIM-MENDUNIA
cd /var/www/SIM-MENDUNIA
# upload / clone folder wa-gateway dari repo

cd wa-gateway
npm ci --omit=dev
```

> Tidak memakai Docker sama sekali. Cukup Node.js yang terpasang langsung di VPS.

---

## 3. Konfigurasi `.env`

```bash
cp .env.example .env
nano .env
```

```env
# Port HTTP REST API (internal; jangan dibuka ke publik)
PORT=4300

# Token akses — WAJIB sama dengan WA_GATEWAY_TOKEN di .env backend Laravel.
# Gunakan string acak kuat, contoh: openssl rand -hex 32
GATEWAY_TOKEN=mendunia-gateway-token

# Base URL backend Laravel untuk pengiriman webhook
BACKEND_BASE_URL=https://api.sim.mendunia.id

# Secret webhook — WAJIB sama dengan WA_GATEWAY_WEBHOOK_SECRET di .env backend
BACKEND_WEBHOOK_SECRET=mendunia-gateway-secret

# Direktori sesi (berisi semua device + registry.json)
SESSION_DIR=./sessions

# ===== Pengamanan pengiriman (anti-flag/spam WhatsApp) =====
SEND_MIN_INTERVAL_MS=3000     # jarak min antar pesan (ms)
SEND_JITTER_MS=1000           # jitter acak tambahan (ms)
SEND_MAX_PER_MINUTE=20        # batas / menit per device
SEND_MAX_PER_HOUR=200         # batas / jam
SEND_MAX_PER_DAY=1000         # batas / hari
```

Cek ulang kredensial backend di `backend/.env` agar pasangannya sama:

```env
WA_GATEWAY_BASE_URL=http://127.0.0.1:4300     # atau IP internal jika terpisah
WA_GATEWAY_TOKEN=mendunia-gateway-token       # = GATEWAY_TOKEN
WA_GATEWAY_WEBHOOK_SECRET=mendunia-gateway-secret
WA_GATEWAY_DEFAULT_DEVICE=cs                  # slug device default
```

---

## 4. Menjalankan Sebagai Service (systemd) — disarankan

```bash
sudo nano /etc/systemd/system/mendunia-wa-gateway.service
```

```ini
[Unit]
Description=SIM Mendunia WhatsApp Gateway (Baileys)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/SIM-MENDUNIA/wa-gateway
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=5
# Log
StandardOutput=append:/var/www/SIM-MENDUNIA/wa-gateway/server.log
StandardError=append:/var/www/SIM-MENDUNIA/wa-gateway/server.log
# Path sesi aman & terpisah dari kode
Environment=SESSION_DIR=/var/www/SIM-MENDUNIA/wa-gateway/sessions

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now mendunia-wa-gateway
sudo systemctl status mendunia-wa-gateway
```

> Lokasi `node` — cek dengan `which node`. Untuk sesi root di bawah `www-data`,
> pastikan folder `sessions/` writable oleh `www-data`:
> `sudo chown -R www-data:www-data /var/www/SIM-MENDUNIA/wa-gateway/sessions`

Alternatif tanpa systemd (proses latar):

```bash
nohup npm start >> server.log 2>&1 &
```

---

## 5. Verifikasi Service

```bash
# Health check (tidak butuh token)
curl http://127.0.0.1:4300/api/health

# Karena diakses backend, cukup cek dari sisi backend:
cd /var/www/SIM-MENDUNIA/backend
php artisan tinker --execute="echo app(\App\Services\WaGatewayClient::class)->isConfigured() ? 'ok' : 'no';"
```

Kemudian buka halaman **WhatsApp Gateway** di frontend:
- Status harus **online**.
- Buat/tambahkan device, lalu **Scan QR** dari HP.
- Device menjadi `connected` dan siap dipakai kirim notifikasi.

---

## 6. Keamanan Jaringan

Gateway cukup diakses backend (juga di VPS yang sama). **Jangan expose port 4300 ke internet.**

```bash
# UFW — blok 4300 dari luar; kita hanya perlu 80/443 & SSH
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status
```

Kalau backend dan gateway di VPS berbeda, batasi akses ke IP backend saja:

```bash
sudo ufw allow from IP_BACKEND to any port 4300 proto tcp
```

Tambahan: ubah `app.listen(config.port, ...)` di `src/server.js` menjadi
`app.listen(config.port, '127.0.0.1', ...)` jika keduanya di VPS yang sama
(aman karena diakses lokal; webhook dari HP tetap berjalan).

---

## 7. Sesi WhatsApp (Backup & Restore)

Sesi tiap device = folder `SESSION_DIR/<slug>/` yang berisi file auth Baileys.
Seluruh data sesi tersimpan di sini; **backup folder ini** agar tidak perlu scan ulang.

```bash
# Backup
tar -czf wa-sessions-$(date +%F).tar.gz -C /var/www/SIM-MENDUNIA/wa-gateway sessions

# Restore
tar -xzf wa-sessions-BACKUP.tar.gz -C /var/www/SIM-MENDUNIA/wa-gateway
sudo systemctl restart mendunia-wa-gateway
```

Catatan:
- `registry.json` menyimpan daftar device terdaftar (agar tidak hilang saat restart).
- Logout / hapus device menghapus folder sesi-nya.
- WhatsApp hanya mengizinkan satu koneksi aktif per nomor — jangan scan nomor yang sama di device lain.

---

## 8. Update/Patch Service

```bash
cd /var/www/SIM-MENDUNIA/wa-gateway
git pull origin main        # atau upload ulang file src yang baru
npm ci --omit=dev
sudo systemctl restart mendunia-wa-gateway
sudo systemctl status mendunia-wa-gateway
tail -f server.log
```

Jangan lupa sinkronkan nilai `GATEWAY_TOKEN` & `BACKEND_WEBHOOK_SECRET` jika diubah.

---

## 9. Monitoring

```bash
# Status sistem
sudo systemctl status mendunia-wa-gateway

# Log realtime
sudo journalctl -u mendunia-wa-gateway -f
tail -f /var/www/SIM-MENDUNIA/wa-gateway/server.log

# Cek device via API (perlu token header)
curl -H "X-Gateway-Token: <GATEWAY_TOKEN>" http://127.0.0.1:4300/api/devices
```

Tambahkan alert (opsional): cron yang cek `/api/health` dan restart bila down.

---

## 10. Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Frontend tampil "Gateway belum dikonfigurasi" | Isi `WA_GATEWAY_BASE_URL` & `WA_GATEWAY_TOKEN` di Pengaturan Notifikasi / `.env` backend; pastikan `notification_settings` di DB tidak kosong. |
| `GET /api/devices/{slug}/qr` → 404 | Device tidak terdaftar di gateway. Buat ulang device lewat halaman WhatsApp Gateway (minimal `SEND_*` default aktif). |
| `409 Device belum terhubung` saat kirim | Sesi belum `connected` / nomor logout; scan ulang QR |
| QR tidak muncul saat scan | Refresh halaman, restart gateway, pastikan browser punya akses websocket/interval polling |
| No response dari gateway | Cek `server.log`, pastikan port & health check OK |
| Pesan terkirim pelan / delay lama | Wajar karena antrian aman `SEND_MIN_INTERVAL_MS`; naikkan interval hanya bila nomor sudah "hangat" |
| Nomor diblokir/tidak kirim sama sekali | Turunkan batas (`SEND_MAX_PER_*`), hindari blast massal, gunakan nomor yang stabil |

---

## 11. Checklist Deploy WA Gateway

| # | Task | Status |
|---|------|--------|
| 1 | Node.js >= 18 terpasang | ☐ |
| 2 | `npm ci --omit=dev` berhasil | ☐ |
| 3 | `.env` terisi (token & secret sama dengan backend) | ☐ |
| 4 | systemd service aktif & auto-start | ☐ |
| 5 | `/api/health` merespons | ☐ |
| 6 | Backend `isConfigured()` = true & terhubung | ☐ |
| 7 | Port 4300 tidak terbuka ke publik (UFW) | ☐ |
| 8 | `sessions/` di-backup | ☐ |
| 9 | Device di-scan & status `connected` | ☐ |
| 10 | Kirim test pesan sukses | ☐ |