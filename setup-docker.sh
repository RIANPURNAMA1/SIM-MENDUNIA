#!/bin/bash
set -e

echo "============================================"
echo "  SIM Mendunia — Docker Setup"
echo "============================================"

# Check docker
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker belum terinstall."
    echo "Install: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "ERROR: Docker Compose belum terinstall."
    exit 1
fi

# Setup .env for backend
if [ ! -f backend/.env ]; then
    echo ""
    echo "[1/6] Copying backend .env.docker -> .env ..."
    cp backend/.env.docker backend/.env
    echo "  -> Generating APP_KEY ..."
    cd backend
    docker run --rm -v "$(pwd):/app" -w /app composer:2 install --no-interaction --no-scripts 2>/dev/null || true
    cd ..
else
    echo "[1/6] backend/.env already exists, skipping."
fi

# Generate APP_KEY if empty
if grep -q "APP_KEY=$" backend/.env 2>/dev/null; then
    echo ""
    echo "[2/6] Generating APP_KEY ..."
    cd backend
    # Generate key using php container
    KEY=$(docker run --rm php:8.2-fpm php -r "echo 'base64:'.base64_encode(random_bytes(32)).PHP_EOL;")
    sed -i "s/^APP_KEY=$/APP_KEY=${KEY}/" .env 2>/dev/null || \
    sed -i '' "s/^APP_KEY=$/APP_KEY=${KEY}/" .env 2>/dev/null || true
    cd ..
    echo "  -> APP_KEY generated."
else
    echo "[2/6] APP_KEY already set, skipping."
fi

# Stop existing containers
echo ""
echo "[3/6] Stopping existing containers ..."
docker compose down 2>/dev/null || docker-compose down 2>/dev/null || true

# Build & start
echo ""
echo "[4/6] Building and starting containers ..."
docker compose up --build -d 2>/dev/null || docker-compose up --build -d

# Wait for MySQL
echo ""
echo "[5/6] Waiting for MySQL to be ready ..."
sleep 10

# Run migrations
echo ""
echo "[6/6] Running migrations ..."
docker compose exec backend php artisan migrate --force 2>/dev/null || \
docker-compose exec backend php artisan migrate --force

# Storage link
docker compose exec backend php artisan storage:link 2>/dev/null || \
docker-compose exec backend php artisan storage:link 2>/dev/null || true

# Cache
docker compose exec backend php artisan config:cache 2>/dev/null || \
docker-compose exec backend php artisan config:cache 2>/dev/null || true

echo ""
echo "============================================"
echo "  DONE! Aplikasi berjalan di:"
echo ""
echo "  Frontend:  http://localhost"
echo "  Backend:   http://localhost/api"
echo "  MySQL:     localhost:3306"
echo ""
echo "  Database:  db_mendunia"
echo "  User DB:   mendunia / mendunia123"
echo "============================================"
echo ""
echo "  Useful commands:"
echo "  docker compose logs -f          # Lihat logs"
echo "  docker compose exec backend bash  # Masuk ke backend"
echo "  docker compose down             # Stop semua"
echo "  docker compose up --build       # Rebuild & start"
echo ""
