@echo off
setlocal

echo ============================================
echo   SIM Mendunia — Docker Setup
echo ============================================

:: Check docker
where docker >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Docker belum terinstall.
    echo Install: https://docs.docker.com/get-docker/
    pause
    exit /b 1
)

:: Setup backend .env
if not exist "backend\.env" (
    echo.
    echo [1/4] Copying backend .env.docker to .env ...
    copy backend\.env.docker backend\.env >nul
) else (
    echo [1/4] backend\.env already exists, skipping.
)

:: Stop existing
echo.
echo [2/4] Stopping existing containers ...
docker compose down 2>nul

:: Build & start
echo.
echo [3/4] Building and starting containers ...
docker compose up --build -d

:: Wait
echo.
echo [4/4] Waiting for MySQL + running migrations ...
timeout /t 12 /nobreak >nul
docker compose exec backend php artisan migrate --force 2>nul
docker compose exec backend php artisan storage:link 2>nul

echo.
echo ============================================
echo   DONE! Aplikasi berjalan di:
echo.
echo   Frontend:  http://localhost
echo   Backend:   http://localhost/api
echo   MySQL:     localhost:3306
echo.
echo   Database:  db_mendunia
echo   User DB:   mendunia / mendunia123
echo ============================================
echo.
echo   docker compose logs -f          — Lihat logs
echo   docker compose exec backend bash — Masuk backend
echo   docker compose down             — Stop semua
echo.
pause
