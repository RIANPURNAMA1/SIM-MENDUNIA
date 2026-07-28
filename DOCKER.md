# Panduan Docker — SIM Mendunia

Dokumentasi lengkap menjalankan aplikasi SIM Mendunia menggunakan Docker.

---

## Arsitektur

```
┌──────────────────────────────────────────────────┐
│                    PORT 80                        │
│              ┌──────────────────┐                 │
│              │   Nginx (Alpine) │                 │
│              │  - Frontend (SPA)│                 │
│              │  - Reverse Proxy │                 │
│              └───────┬──────────┘                 │
│                      │ fastcgi                    │
│              ┌───────▼──────────┐   ┌──────────┐ │
│              │  Backend         │   │  MySQL    │ │
│              │  PHP 8.2-FPM    │──▶│  8.0      │ │
│              │  (Laravel 12)   │   │  :3306    │ │
│              └──────────────────┘   └──────────┘ │
│              ┌──────────────────┐                 │
│              │  Queue Worker    │                 │
│              │  (artisan queue) │                 │
│              └──────────────────┘                 │
└──────────────────────────────────────────────────┘
```

## Service Overview

| Service        | Container           | Port    | Keterangan                    |
|----------------|---------------------|---------|-------------------------------|
| MySQL          | mendunia-mysql      | 3306    | Database                      |
| Backend        | mendunia-backend    | -       | Laravel PHP-FPM               |
| Nginx          | mendunia-nginx      | 80      | Frontend + Reverse Proxy      |
| Queue Worker   | mendunia-queue      | -       | Background job processing     |

---

## Prasyarat

- [Docker](https://docs.docker.com/get-docker/) >= 20.10
- [Docker Compose](https://docs.docker.com/compose/install/) >= 2.0
- Port **80** dan **3306** tidak sedang digunakan proses lain
- File `db_sim.sql` ada di root project (database seed)

---

## Instalasi (Otomatis)

### Windows

```bash
setup-docker.bat
```

### Linux / macOS

```bash
chmod +x setup-docker.sh
./setup-docker.sh
```

Script otomatis akan:
1. Copy `.env.docker` ke `backend/.env`
2. Generate `APP_KEY`
3. Build & start semua container
4. Tunggu MySQL ready
5. Jalankan migrasi database
6. Buat storage link
7. Cache configuration

---

## Instalasi (Manual)

### 1. Copy environment file

```bash
cp backend/.env.docker backend/.env
```

### 2. Build & start containers

```bash
docker compose up --build -d
```

### 3. Tunggu MySQL siap

```bash
docker compose exec mysql mysqladmin ping -h localhost --wait=30
```

### 4. Jalankan migrasi

```bash
docker compose exec backend php artisan migrate --force
```

### 5. Buat storage link

```bash
docker compose exec backend php artisan storage:link
```

### 6. Cache configuration

```bash
docker compose exec backend php artisan config:cache
```

---

## Akses Aplikasi

| URL                        | Keterangan              |
|----------------------------|-------------------------|
| `http://localhost`         | Frontend (SPA)          |
| `http://localhost/api`     | Backend API             |
| `localhost:3306`           | MySQL (direct access)   |

### Default Database

| Field      | Value        |
|------------|--------------|
| Host       | `mysql` (dari dalam container) / `localhost:3306` (dari luar) |
| Database   | `db_mendunia`|
| Username   | `mendunia`   |
| Password   | `mendunia123`|
| Root Pass  | `rootsecret` |

---

## Perintah Berguna

### Melihat logs

```bash
# Semua service
docker compose logs -f

# Service tertentu
docker compose logs -f backend
docker compose logs -f nginx
docker compose logs -f mysql
docker compose logs -f queue
```

### Masuk ke container

```bash
# Backend (Laravel)
docker compose exec backend bash

# MySQL
docker compose exec mysql mysql -u mendunia -pmendunia123 db_mendunia

# Nginx
docker compose exec nginx sh
```

### Jalankan artisan commands

```bash
docker compose exec backend php artisan <command>
```

Contoh:
```bash
# Migrasi
docker compose exec backend php artisan migrate

# Seed database
docker compose exec backend php artisan db:seed

# Buat user admin
docker compose exec backend php artisan tinker

# Clear cache
docker compose exec backend php artisan cache:clear
docker compose exec backend php artisan config:clear

# Storage link
docker compose exec backend php artisan storage:link
```

### Restart / Stop / Rebuild

```bash
# Stop semua
docker compose down

# Stop & hapus volumes (reset database)
docker compose down -v

# Rebuild & start
docker compose up --build -d

# Restart service tertentu
docker compose restart backend
docker compose restart nginx
```

---

## Struktur File Docker

```
.
├── docker-compose.yml              # Service definitions
├── setup-docker.sh                 # Auto setup (Linux/macOS)
├── setup-docker.bat                # Auto setup (Windows)
├── db_sim.sql                      # Database seed (auto-import)
├── backend/
│   ├── Dockerfile                  # PHP 8.2-FPM
│   └── .env.docker                 # Environment untuk Docker
└── docker/
    └── nginx/
        ├── Dockerfile              # Multi-stage: Node build + Nginx
        └── default.conf            # Nginx configuration
```

---

## Environment Variables

### backend/.env.docker

Variabel penting yang bisa diubah:

```env
# App
APP_NAME="SIM Mendunia"
APP_URL=http://localhost
APP_DEBUG=true
APP_TIMEZONE=Asia/Jakarta

# Database
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=db_mendunia
DB_USERNAME=mendunia
DB_PASSWORD=mendunia123

# Frontend URL (untuk CORS)
FRONTEND_URL=http://localhost
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:80,127.0.0.1
```

### Nginx Build Args (docker-compose.yml)

```yaml
args:
  - VITE_API_URL=http://localhost/api
  - VITE_APP_URL=http://localhost
```

Untuk production/ganti domain, ubah values di `docker-compose.yml` bagian `nginx.build.args`.

---

## Troubleshooting

### Port 80 sudah digunakan

```bash
# Cari proses yang menggunakan port 80
# Windows:
netstat -ano | findstr :80

# Linux/macOS:
lsof -i :80
```

Ubah port di `docker-compose.yml`:
```yaml
ports:
  - "8080:80"   # Ubah ke port lain
```

### MySQL tidak bisa connect

```bash
# Cek status MySQL
docker compose logs mysql

# Tunggu MySQL health check
docker compose exec mysql mysqladmin ping -h localhost
```

### Frontend build gagal

```bash
# Bersihkan build cache
docker compose down
docker compose up --build --force-recreate nginx
```

### Migrasi gagal / database sudah ada

```bash
# Reset database
docker compose down -v
docker compose up --build -d
sleep 15
docker compose exec backend php artisan migrate --force
docker compose exec backend php artisan db:seed
```

### Queue worker error

```bash
# Cek logs queue
docker compose logs -f queue

# Restart queue worker
docker compose restart queue
```

### Permission denied pada storage

```bash
docker compose exec backend chmod -R 775 storage bootstrap/cache
docker compose exec backend chown -R www-data:www-data storage bootstrap/cache
```

---

## Deployment Production

Untuk deployment ke VPS/production, lihat panduan lengkap di [deployment.md](./deployment.md).

Ringkasan perbedaan Docker vs Production:

| Aspek          | Docker (Development)         | Production (VPS)              |
|----------------|------------------------------|-------------------------------|
| Web Server     | Nginx (Alpine container)     | Nginx (system) + PHP-FPM sock |
| Frontend       | Pre-built dalam image        | Static build di VPS           |
| Database       | Container MySQL 8.0          | MySQL di VPS                  |
| Queue          | Container worker             | Supervisor di VPS             |
| SSL            | Tidak ada (HTTP)             | Let's Encrypt (HTTPS)         |
| Domain         | `localhost`                  | `sim.mendunia.id`             |
