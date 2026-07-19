# Deployment Guide — SIM Mendunia

> Panduan lengkap deploy aplikasi SIM Mendunia ke VPS dengan Nginx + MySQL.

---

## Arsitektur

```
┌─────────────────────────────────────────────────────┐
│                       VPS                            │
│                                                      │
│  Nginx (443/80)                                      │
│  ├── sim.mendunia.id ──► frontend/dist/ (static)     │
│  └── api.sim.mendunia.id ──► Laravel (PHP-FPM)       │
│                                                      │
│  MySQL 8.0 ──► db_mendunia                           │
│  Supervisor ──► queue:work + scheduler               │
└─────────────────────────────────────────────────────┘
```

| Komponen | Versi |
|----------|-------|
| PHP | 8.2+ |
| MySQL | 8.0+ / MariaDB 10.3+ |
| Nginx | latest |
| Node.js | 18+ (hanya untuk build frontend) |
| Composer | 2.x |

---

## 1. Persiapan VPS

### 1.1 Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Nginx
sudo apt install -y nginx

# Install PHP 8.2 + extensions
sudo apt install -y php8.2-fpm php8.2-mysql php8.2-mbstring php8.2-xml \
  php8.2-curl php8.2-gd php8.2-zip php8.2-bcmath php8.2-intl php8.2-redis

# Install MySQL
sudo apt install -y mysql-server

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Install Node.js 18 LTS (untuk build frontend)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
php -v          # >= 8.2
mysql --version # >= 8.0
nginx -v        # latest
node -v         # >= 18
npm -v          # >= 9
```

### 1.2 Setup MySQL

```bash
sudo mysql_secure_installation
```

Login ke MySQL dan buat database + user:

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE db_mendunia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mendunia'@'localhost' IDENTIFIED BY 'GANTI_PASSWORD_YANG_KUAT';
GRANT ALL PRIVILEGES ON db_mendunia.* TO 'mendunia'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

> **Catatan:** Tabel dan data akan di-import dari `db_sim.sql` pada langkah deploy backend.

### 1.3 Setup Domain DNS

Buat A Record di DNS provider:

| Domain | Type | Value |
|--------|------|-------|
| `sim.mendunia.id` | A | `IP_VPS_ANDA` |
| `api.sim.mendunia.id` | A | `IP_VPS_ANDA` |

---

## 2. Deploy Backend (Laravel)

### 2.1 Clone & Setup

```bash
# Buat direktori
sudo mkdir -p /var/www/sim-mendunia
sudo chown $USER:$USER /var/www/sim-mendunia

# Clone repo (atau upload via SCP/SFTP)
cd /var/www/sim-mendunia
git clone https://github.com/RIANPURNAMA1/SIM-MENDUNIA.git .

# Pastikan db_sim.sql ada di project root
ls -la db_sim.sql
```

### 2.2 Install PHP Dependencies

```bash
composer install --optimize-autoloader --no-dev
```

### 2.3 Konfigurasi Environment

```bash
cp .env.example .env
```

Edit `.env` dengan production values:

```env
# ========================================
# APP
# ========================================
APP_NAME="SIM Mendunia"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://api.sim.mendunia.id
APP_LOCALE=id
APP_FALLBACK_LOCALE=en
APP_MAINTENANCE_DRIVER=file
APP_TIMEZONE=Asia/Jakarta

BCRYPT_ROUNDS=12

# ========================================
# LOG
# ========================================
LOG_CHANNEL=stack
LOG_STACK=single
LOG_LEVEL=error

# ========================================
# DATABASE (MySQL)
# ========================================
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=db_mendunia
DB_USERNAME=mendunia
DB_PASSWORD=GANTI_PASSWORD_YANG_KUAT

# ========================================
# SESSION
# ========================================
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=.mendunia.id
SESSION_SECURE_COOKIE=true

# ========================================
# CACHE & QUEUE
# ========================================
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database
CACHE_STORE=database

# ========================================
# BROADCAST
# ========================================
BROADCAST_CONNECTION=log

# ========================================
# CORS — HARUS DI ISI
# ========================================
FRONTEND_URL=https://sim.mendunia.id

# ========================================
# SANCTUM — HARUS DI ISI
# ========================================
SANCTUM_STATEFUL_DOMAINS=api.sim.mendunia.id,sim.mendunia.id

# ========================================
# MAIL (opsional)
# ========================================
MAIL_MAILER=log
MAIL_FROM_ADDRESS="no-reply@mendunia.id"
MAIL_FROM_NAME="${APP_NAME}"
```

### 2.4 Import Database

File database sudah tersedia di `db_sim.sql` (project root). Import langsung ke MySQL:

```bash
# Generate app key
php artisan key:generate

# Import database dari file SQL (sudah berisi seluruh struktur + data)
 

# Verifikasi tabel
php artisan tinker --execute="echo \ Illuminate\Support\Facades\Schema::getTables()->pluck('name')->implode(', ');"
```

> **Catatan:** Tidak perlu menjalankan `php artisan migrate` karena seluruh struktur database sudah ada di `db_sim.sql`. Cukup import sekali saat pertama kali deploy.

### 2.5 Storage Link & Cache

```bash
# Symlink storage untuk akses file publik
php artisan storage:link

# Cache semua konfigurasi untuk performa
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

### 2.6 Set Permissions

```bash
sudo chown -R www-data:www-data /var/www/SIM-MENDUNIA/backend/storage
sudo chown -R www-data:www-data /var/www/SIM-MENDUNIA/backend/bootstrap/cache
sudo chmod -R 775 /var/www/SIM-MENDUNIA/backend/storage
sudo chmod -R 775 /var/www/SIM-MENDUNIA/backend/bootstrap/cache
```

---

## 3. Deploy Frontend (React + Vite)

### 3.1 Build di Lokal atau di VPS

Jika build di **lokal**, upload `dist/` ke VPS. Jika build di **VPS**:

```bash
cd /var/www/sim-mendunia/frontend
npm install
```

Buat `frontend/.env` untuk production:

```env
VITE_API_URL=https://api.sim.mendunia.id/api
VITE_APP_URL=https://api.sim.mendunia.id
```

Build:

```bash
npm run build
```

Output statik ada di `frontend/dist/`.

### 3.2 Set Permissions

```bash
sudo chown -R www-data:www-data /var/www/SIM-MENDUNIA/frontend/dist
sudo chmod -R 755 /var/www/SIM-MENDUNIA/frontend/dist
```

---

## 4. Konfigurasi Nginx

### 4.1 Frontend — `sim.mendunia.id`

```bash
sudo nano /etc/nginx/sites-available/sim.mendunia.id
```

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name sim.mendunia.id www.sim.mendunia.id;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name sim.mendunia.id www.sim.mendunia.id;

    root /var/www/sim-mendunia/frontend/dist;
    index index.html;

    # SSL
    ssl_certificate     /etc/letsencrypt/live/sim.mendunia.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sim.mendunia.id/privkey.pem;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
    gzip_min_length 256;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # SPA fallback — semua route ke index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 4.2 Backend — `api.sim.mendunia.id`

```bash
sudo nano /etc/nginx/sites-available/api.sim.mendunia.id
```

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.sim.mendunia.id;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.sim.mendunia.id;

    root /var/www/sim-mendunia/backend/public;
    index index.php;

    # SSL
    ssl_certificate     /etc/letsencrypt/live/api.sim.mendunia.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.sim.mendunia.id/privkey.pem;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    # Upload limit — sesuaikan kebutuhan
    client_max_body_size 20M;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Laravel routing
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP-FPM
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    # Block access ke file tersembunyi
    location ~ /\. {
        deny all;
    }

    # Cache static assets di public
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 7d;
        add_header Cache-Control "public, no-transform";
    }
}
```

### 4.3 Aktifkan Site & Restart Nginx

```bash
sudo ln -s /etc/nginx/sites-available/sim.mendunia.id /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/api.sim.mendunia.id /etc/nginx/sites-enabled/

# Hapus default jika ada
sudo rm -f /etc/nginx/sites-enabled/default

# Test konfigurasi
sudo nginx -t

# Restart
sudo systemctl restart nginx
```

---

## 5. SSL Certificate (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx

# Dapatkan sertifikat untuk kedua domain
sudo certbot --nginx -d sim.mendunia.id -d www.sim.mendunia.id
sudo certbot --nginx -d api.sim.mendunia.id

# Auto-renewal sudah di-setup otomatis oleh certbot
# Test renewal:
sudo certbot renew --dry-run
```

---

## 6. Queue Worker & Scheduler

### 6.1 Supervisor untuk Queue Worker

```bash
sudo apt install -y supervisor

sudo nano /etc/supervisor/conf.d/mendunia-worker.conf
```

```ini
[program:mendunia-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/SIM-MENDUNIA/backend/artisan queue:work --sleep=3 --tries=1 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/log/supervisor/mendunia-worker.log
stopwaitsecs=3600
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start mendunia-worker:*
```

### 6.2 Cron Scheduler

```bash
sudo crontab -e
```

Tambahkan baris ini:

```cron
* * * * * cd /var/www/sim-mendunia/backend && php artisan schedule:run >> /dev/null 2>&1
```

---

## 7. Firewall

```bash
# UFW
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

---

## 8. Checklist Deployment

| # | Task | Status |
|---|------|--------|
| 1 | VPS di-setup (Nginx, PHP 8.2, MySQL, Node.js) | ☐ |
| 2 | Database `db_mendunia` dibuat di MySQL | ☐ |
| 3 | User MySQL `mendunia` dengan GRANT ALL dibuat | ☐ |
| 4 | DNS A Record untuk `sim.mendunia.id` & `api.sim.mendunia.id` | ☐ |
| 5 | Backend code di-upload ke `/var/www/sim-mendunia/backend` | ☐ |
| 6 | `composer install --optimize-autoloader --no-dev` | ☐ |
| 7 | `.env` dikonfigurasi dengan data production | ☐ |
| 8 | `php artisan key:generate` | ☐ |
| 9 | `db_sim.sql` di-import ke MySQL | ☐ |
| 10 | `php artisan storage:link` | ☐ |
| 11 | `php artisan config:cache && route:cache && view:cache` | ☐ |
| 12 | Permissions `storage/` & `bootstrap/cache/` ke `www-data` | ☐ |
| 13 | Frontend di-build dengan `VITE_API_URL` production | ☐ |
| 14 | `frontend/dist/` di-upload atau di-build di VPS | ☐ |
| 15 | Nginx config untuk kedua domain | ☐ |
| 16 | SSL certificate (Let's Encrypt) | ☐ |
| 17 | Supervisor queue worker aktif | ☐ |
| 18 | Cron scheduler aktif | ☐ |
| 19 | Firewall (UFW) diaktifkan | ☐ |
| 20 | Test login, bayar, upload bukti di production | ☐ |

---

## 9. Perintah Cepat (Full Deploy)

```bash
# ==========================================
# FULL DEPLOY COMMANDS — COPY PASTE
# ==========================================

cd /var/www/sim-mendunia/backend

# Pull latest code
git pull origin main

# Backend
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
php artisan storage:link --force
sudo chown -R www-data:www-data storage bootstrap/cache

# Frontend
cd /var/www/sim-mendunia/frontend
npm install
npm run build
sudo chown -R www-data:www-data dist

# Restart services
sudo systemctl restart nginx
sudo systemctl restart php8.2-fpm
sudo supervisorctl restart mendunia-worker:*
```

> **Catatan:** `php artisan migrate` tidak dijalankan di sini karena database sudah di-import langsung dari `db_sim.sql` saat pertama kali deploy.

---

## 10. Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `502 Bad Gateway` | Cek PHP-FPM: `sudo systemctl status php8.2-fpm` |
| CORS error | Pastikan `FRONTEND_URL=https://sim.mendunia.id` di `.env` backend |
| Sanctum 401 | Pastikan `SANCTUM_STATEFUL_DOMAINS` berisi kedua domain |
| File upload gagal | Cek `client_max_body_size` di Nginx + permissions `storage/` |
| Queue tidak jalan | `sudo supervisorctl status` + cek log `/var/log/supervisor/` |
| Database tidak ada tabel | Import `db_sim.sql`: `mysql -u mendunia -p db_mendunia < db_sim.sql` |
| SSL error | `sudo certbot renew --dry-run` + cek DNS propagation |
| Session hilang | Pastikan `SESSION_DOMAIN=.mendunia.id` + `SESSION_SECURE_COOKIE=true` |
| `storage:link` gagal | `sudo ln -s /var/www/sim-mendunia/backend/storage/app/public /var/www/sim-mendunia/backend/public/storage` |
