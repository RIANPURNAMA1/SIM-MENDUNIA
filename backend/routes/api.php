<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\ProjectListsController;
use App\Http\Controllers\WaWebhookController;
use App\Http\Controllers\KaryawanController;
use App\Http\Controllers\DivisiController;
use App\Http\Controllers\CabangController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\ShiftJadwalController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\Absensi\KehadiranController;
use App\Http\Controllers\Absensi\KehadiranKhususController;
use App\Http\Controllers\Absensi\RekapController;
use App\Http\Controllers\Absensi\RekapJadwalShiftController;
use App\Http\Controllers\Absensi\RekapKehadiranSenseiController;
use App\Http\Controllers\Absensi\KehadiranSenseiController;
use App\Http\Controllers\IzinController;
use App\Http\Controllers\LemburController;
use App\Http\Controllers\HariLiburController;
use App\Http\Controllers\MonitoringController;
use App\Http\Controllers\GuruController;
use App\Http\Controllers\Admin\AgendaController as AdminAgendaController;
use App\Http\Controllers\Absensi\JadwalLevelController;
use App\Http\Controllers\SiswaController;
use App\Http\Controllers\BatchController;
use App\Http\Controllers\PenilaianController;
use App\Http\Controllers\AiChatController;
use App\Http\Controllers\Absensi\AbsensiSiswaController;
use App\Http\Controllers\PengaturanController;
use App\Http\Controllers\PengaturanShiftController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/tasks', [TaskController::class, 'index']);
Route::post('/tasks/store', [TaskController::class, 'store']);

Route::post('/wa-webhook', [WaWebhookController::class, 'handle']);

// API Karyawan (tanpa auth untuk development)
Route::prefix('karyawan')->group(function () {
    Route::get('/', [KaryawanController::class, 'apiIndex']);
    Route::get('/{id}', [KaryawanController::class, 'apiShow']);
    Route::post('/', [KaryawanController::class, 'store']);
    Route::post('/{id}', [KaryawanController::class, 'update']);
    Route::delete('/{id}', [KaryawanController::class, 'destroy']);
    Route::patch('/{id}/toggle-status', [KaryawanController::class, 'toggleStatus']);
    Route::patch('/{id}/toggle-khusus', [KaryawanController::class, 'toggleKhusus']);
});

// CRUD Divisi
Route::get('/divisi', [DivisiController::class, 'apiList']);
Route::post('/divisi', [DivisiController::class, 'store']);
Route::put('/divisi/{id}', [DivisiController::class, 'update']);
Route::delete('/divisi/{id}', [DivisiController::class, 'destroy']);

// CRUD Cabang
Route::get('/cabang', [CabangController::class, 'apiList']);
Route::post('/cabang', [CabangController::class, 'apiStore']);
Route::put('/cabang/{id}', [CabangController::class, 'apiUpdate']);
Route::delete('/cabang/{id}', [CabangController::class, 'apiDestroy']);

// CRUD Shift
Route::get('/shift', [ShiftController::class, 'apiIndex']);
Route::post('/shift', [ShiftController::class, 'store']);
Route::get('/shift/{id}', [ShiftController::class, 'show']);
Route::put('/shift/{id}', [ShiftController::class, 'update']);
Route::delete('/shift/{id}', [ShiftController::class, 'destroy']);

// CRUD ShiftJadwal
Route::prefix('shift-jadwal')->group(function () {
    Route::get('/{userId}', [ShiftJadwalController::class, 'getJadwalKaryawan']);
    Route::post('/', [ShiftJadwalController::class, 'store']);
    Route::post('/multiple', [ShiftJadwalController::class, 'createMultiple']);
    Route::delete('/{id}', [ShiftJadwalController::class, 'destroy']);
});

// User management
Route::prefix('user')->group(function () {
    Route::get('/', [UserController::class, 'apiIndex']);
    Route::post('/', [UserController::class, 'apiStore']);
    Route::put('/{id}', [UserController::class, 'apiUpdate']);
    Route::patch('/{id}/toggle-status', [KaryawanController::class, 'toggleStatus']);
    Route::delete('/{id}', [UserController::class, 'destroy']);
});

// Kehadiran
Route::prefix('kehadiran')->group(function () {
    Route::get('/', [KehadiranController::class, 'apiIndex']);
    Route::post('/update-status', [KehadiranController::class, 'updateStatusApi']);
});

// Kehadiran Khusus
Route::prefix('kehadiran-khusus')->group(function () {
    Route::get('/', [KehadiranKhususController::class, 'apiIndex']);
    Route::post('/update-status', [KehadiranKhususController::class, 'updateStatusApi']);
});

// Izin & Cuti
Route::prefix('izin')->group(function () {
    Route::get('/', [IzinController::class, 'apiIndex']);
    Route::post('/{id}/approve', [IzinController::class, 'apiApprove']);
    Route::post('/{id}/reject', [IzinController::class, 'apiReject']);
});

// Lembur
Route::prefix('lembur')->group(function () {
    Route::get('/', [LemburController::class, 'apiIndex']);
    Route::post('/{id}/status', [LemburController::class, 'apiUpdateStatus']);
});

// Hari Libur
Route::prefix('hari-libur')->group(function () {
    Route::get('/', [HariLiburController::class, 'apiIndex']);
    Route::post('/', [HariLiburController::class, 'apiStore']);
    Route::delete('/{id}', [HariLiburController::class, 'apiDestroy']);
});

// Rekap Absensi
Route::get('/rekap-absensi', [RekapController::class, 'apiRekap']);

// Rekap Jadwal Shift
Route::prefix('rekap-jadwal-shift')->group(function () {
    Route::get('/{userId}', [RekapJadwalShiftController::class, 'getData']);
    Route::post('/update-status', [RekapJadwalShiftController::class, 'updateStatus']);
});

// Monitoring Lokasi
Route::get('/monitoring-lokasi', [MonitoringController::class, 'apiMonitoring']);

// Data Agenda
Route::get('/data-agenda', [AdminAgendaController::class, 'apiIndex']);

// Rekap Kehadiran Sensei
Route::prefix('rekap-kehadiran-sensei')->group(function () {
    Route::get('/', [RekapKehadiranSenseiController::class, 'apiIndex']);
    Route::get('/{userId}', [RekapKehadiranSenseiController::class, 'getData']);
    Route::post('/update-status', [RekapKehadiranSenseiController::class, 'updateStatus']);
});

// Kehadiran Sensei
Route::prefix('kehadiran-sensei')->group(function () {
    Route::get('/', [KehadiranSenseiController::class, 'apiIndex']);
    Route::get('/kelas/{userId}', [KehadiranSenseiController::class, 'getKelasByUser']);
    Route::post('/update-status', [KehadiranSenseiController::class, 'apiUpdateStatus']);
    Route::get('/riwayat/{userId}/{kelasId}', [KehadiranSenseiController::class, 'getRiwayat']);
});

// Guru
Route::prefix('guru')->group(function () {
    Route::get('/', [GuruController::class, 'apiIndex']);
    Route::post('/', [GuruController::class, 'store']);
    Route::delete('/{id}', [GuruController::class, 'destroy']);
});

// Kelas Sensei
Route::prefix('kelas-sensei')->group(function () {
    Route::get('/', [KehadiranSenseiController::class, 'apiKelasIndex']);
    Route::post('/', [KehadiranSenseiController::class, 'apiKelasStore']);
    Route::delete('/{id}', [KehadiranSenseiController::class, 'apiKelasDestroy']);
});

// Jadwal Level
Route::prefix('jadwal-level')->group(function () {
    Route::get('/', [JadwalLevelController::class, 'apiIndex']);
    Route::post('/', [JadwalLevelController::class, 'store']);
    Route::delete('/{batchId}/{level}', [JadwalLevelController::class, 'destroy']);
});

// Siswa
Route::prefix('siswa')->group(function () {
    Route::get('/', [SiswaController::class, 'apiIndex']);
    Route::post('/', [SiswaController::class, 'store']);
    Route::put('/{id}', [SiswaController::class, 'update']);
    Route::delete('/{id}', [SiswaController::class, 'destroy']);
    Route::post('/{id}/toggle-status', [SiswaController::class, 'toggleStatus']);
    Route::post('/{id}/buatkan-akun', [SiswaController::class, 'buatkanAkun']);
    Route::post('/bulk-delete', [SiswaController::class, 'bulkDelete']);
    Route::post('/bulk-update-shift', [SiswaController::class, 'bulkUpdateShift']);
    Route::post('/import', [SiswaController::class, 'import']);
    Route::post('/import-ai', [SiswaController::class, 'importAi']);
});

// Batch
Route::prefix('batches')->group(function () {
    Route::get('/', [BatchController::class, 'apiIndex']);
    Route::post('/', [BatchController::class, 'store']);
    Route::put('/{id}', [BatchController::class, 'update']);
    Route::delete('/{id}', [BatchController::class, 'destroy']);
    Route::post('/{id}/toggle-status', [BatchController::class, 'toggleStatus']);
});

// Absensi Siswa
Route::prefix('absensi-siswa')->group(function () {
    Route::get('/', [AbsensiSiswaController::class, 'apiIndex']);
    Route::post('/', [AbsensiSiswaController::class, 'store']);
    Route::post('/mass', [AbsensiSiswaController::class, 'massStore']);
    Route::put('/{id}', [AbsensiSiswaController::class, 'update']);
    Route::get('/siswa-by-kelas', [AbsensiSiswaController::class, 'dataSiswaByKelas']);
    Route::get('/rekap', [AbsensiSiswaController::class, 'apiRekap']);
    Route::get('/rekap/export-excel', [AbsensiSiswaController::class, 'exportExcel']);
    Route::get('/rekap/export-pdf', [AbsensiSiswaController::class, 'exportPdf']);
    Route::get('/cek', [AbsensiSiswaController::class, 'cekAbsensiSiswa']);
});

// Penilaian
Route::prefix('penilaian')->group(function () {
    Route::get('/', [PenilaianController::class, 'apiIndex']);
    Route::get('/matrix', [PenilaianController::class, 'apiMatrixIndex']);
    Route::get('/day-detail', [PenilaianController::class, 'dayDetail']);
    Route::post('/', [PenilaianController::class, 'apiStore']);
    Route::put('/{id}', [PenilaianController::class, 'apiUpdate']);
    Route::delete('/{id}', [PenilaianController::class, 'apiDestroy']);
});

// Pengaturan Shift
Route::prefix('pengaturan-shift')->group(function () {
    Route::get('/', [PengaturanShiftController::class, 'apiIndex']);
    Route::post('/', [PengaturanShiftController::class, 'apiUpdate']);
});

// Pengaturan WA
Route::prefix('pengaturan-wa')->group(function () {
    Route::get('/', [PengaturanController::class, 'apiIndex']);
    Route::post('/', [PengaturanController::class, 'apiUpdate']);
});

// AI Chat
Route::prefix('ai-chat')->group(function () {
    Route::post('/send', [AiChatController::class, 'send']);
    Route::post('/ask', [AiChatController::class, 'ask']);
});

// Data referensi
Route::get('/shift-aktif', [ShiftController::class, 'apiAktif']);

Route::middleware('auth')->group(function () {
    Route::post('/wa-izin-send-test', [WaWebhookController::class, 'sendTest']);
});