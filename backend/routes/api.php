<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\ProjectListsController;
use App\Http\Controllers\WaWebhookController;
use App\Http\Controllers\KaryawanController;
use App\Http\Controllers\DivisiController;
use App\Http\Controllers\CabangController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\ShiftJadwalController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\Absensi\AbsensiController;
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
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PengaturanController;
use App\Http\Controllers\PengaturanShiftController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductCategoryController;
use App\Http\Controllers\AffiliateLinkController;
use App\Http\Controllers\PendaftaranController;
use App\Http\Controllers\AffiliateDashboardController;
use App\Http\Controllers\BiayaController;
use App\Http\Controllers\SiswaDashboardController;
use App\Http\Controllers\GuruDashboardController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\CompanyProfileController;
use App\Http\Controllers\AdminCabangController;
use App\Http\Controllers\PengeluaranController;
use App\Http\Controllers\LmsController;

// ========== API Auth (Sanctum) ==========
Route::post('/auth/login',    [AuthController::class, 'loginApi']);
Route::post('/auth/register', [AuthController::class, 'registerApi']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPasswordApi']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/user',   [AuthController::class, 'userApi']);
    Route::post('/auth/logout',[AuthController::class, 'logoutApi']);
    Route::post('/profile/update', [ProfileController::class, 'apiUpdate']);
    Route::post('/profile/password', [ProfileController::class, 'apiChangePassword']);
});

Route::post('/auth/register-affiliate', [AuthController::class, 'registerAffiliate']);

Route::post('/logout', function (Request $request) {
    if (Auth::check()) {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }
    return response()->json(['message' => 'Logout berhasil']);
});

Route::get('/tasks', [TaskController::class, 'index']);
Route::post('/tasks/store', [TaskController::class, 'store']);

Route::post('/wa-webhook', [WaWebhookController::class, 'handle']);

// Absensi Karyawan (mobile-friendly)
Route::prefix('absensi-karyawan')->middleware('auth:sanctum')->group(function () {
    Route::get('/cek', [AbsensiController::class, 'apiCek']);
    Route::post('/masuk', [AbsensiController::class, 'apiMasuk']);
    Route::post('/pulang', [AbsensiController::class, 'apiPulang']);
    Route::get('/riwayat', [AbsensiController::class, 'apiRiwayat']);
    Route::get('/stats-hari-ini', [AbsensiController::class, 'apiStatsHariIni']);
    Route::get('/grafik-mingguan', [AbsensiController::class, 'apiGrafikMingguan']);
    Route::get('/shift-saya', [AbsensiController::class, 'apiShiftSaya']);
    Route::post('/scan-qr', [AbsensiController::class, 'scanQrApi']);
});

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
    Route::post('/', [IzinController::class, 'apiStore'])->middleware('auth:sanctum');
    Route::post('/{id}/approve', [IzinController::class, 'apiApprove']);
    Route::post('/{id}/reject', [IzinController::class, 'apiReject']);
});

// Lembur
Route::prefix('lembur')->group(function () {
    Route::get('/', [LemburController::class, 'apiIndex']);
    Route::post('/store', [LemburController::class, 'apiStore'])->middleware('auth:sanctum');
    Route::get('/aktif', [LemburController::class, 'apiAktif'])->middleware('auth:sanctum');
    Route::get('/saya', [LemburController::class, 'apiSaya'])->middleware('auth:sanctum');
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
Route::get('/monitoring-lokasi', [MonitoringController::class, 'apiMonitoring'])->middleware('auth:sanctum');

// Data Agenda
Route::get('/data-agenda', [AdminAgendaController::class, 'apiIndex']);

// Rekap Kehadiran Sensei
Route::prefix('rekap-kehadiran-sensei')->group(function () {
    Route::get('/', [RekapKehadiranSenseiController::class, 'apiIndex']);
    Route::get('/table-data', [RekapKehadiranSenseiController::class, 'tableData']);
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
    Route::post('/bulk-delete', [SiswaController::class, 'bulkDelete']);
    Route::post('/bulk-update-shift', [SiswaController::class, 'bulkUpdateShift']);
    Route::post('/import', [SiswaController::class, 'import']);
    Route::post('/import-ai', [SiswaController::class, 'importAi']);
    Route::post('/profile', [SiswaDashboardController::class, 'updateProfile'])->middleware('auth:sanctum');
    Route::get('/absensi-saya', [SiswaDashboardController::class, 'absensiSaya'])->middleware('auth:sanctum');
    Route::get('/nilai-saya/{batchId}', [SiswaDashboardController::class, 'nilaiSaya'])->middleware('auth:sanctum');
    Route::get('/nilai-lms', [SiswaDashboardController::class, 'nilaiLms'])->middleware('auth:sanctum');
    Route::get('/evaluations', [SiswaDashboardController::class, 'evaluations'])->middleware('auth:sanctum');
    Route::post('/scan-qr', [AbsensiController::class, 'scanQrSiswa'])->middleware('auth:sanctum');
    Route::post('/{id}', [SiswaController::class, 'update']);
    Route::delete('/{id}', [SiswaController::class, 'destroy']);
    Route::post('/{id}/toggle-status', [SiswaController::class, 'toggleStatus']);
    Route::post('/{id}/buatkan-akun', [SiswaController::class, 'buatkanAkun']);
});

// Batch
Route::prefix('batches')->group(function () {
    Route::get('/', [BatchController::class, 'apiIndex']);
    Route::post('/', [BatchController::class, 'store']);
    Route::put('/{id}', [BatchController::class, 'update']);
    Route::delete('/{id}', [BatchController::class, 'destroy']);
    Route::post('/{id}/toggle-status', [BatchController::class, 'toggleStatus']);
    Route::post('/{id}/toggle-penuh', [BatchController::class, 'togglePenuh']);
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
    Route::get('/{siswa}/kalender', [AbsensiSiswaController::class, 'kalenderJson']);
});

// Penilaian
Route::prefix('penilaian')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [PenilaianController::class, 'apiIndex']);
    Route::get('/matrix', [PenilaianController::class, 'apiMatrixIndex']);
    Route::get('/day-detail', [PenilaianController::class, 'dayDetail']);
    Route::post('/', [PenilaianController::class, 'apiStore']);
    Route::get('/rekap', [PenilaianController::class, 'apiRekapPenilaian']);
    Route::post('/student-assessment/store', [PenilaianController::class, 'apiStoreStudentAssessment']);
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

// Company Profile
Route::prefix('company-profile')->group(function () {
    Route::get('/', [CompanyProfileController::class, 'show']);
    Route::post('/', [CompanyProfileController::class, 'update']);
});

// AI Chat
Route::prefix('ai-chat')->group(function () {
    Route::post('/send', [AiChatController::class, 'send']);
    Route::post('/ask', [AiChatController::class, 'ask']);
});

// Data referensi
Route::get('/shift-aktif', [ShiftController::class, 'apiAktif']);

// ========== Affiliate & Program ==========
Route::prefix('products')->group(function () {
    Route::get('/', [ProductController::class, 'index']);
    Route::post('/', [ProductController::class, 'store']);
    Route::get('/{id}', [ProductController::class, 'show']);
    Route::put('/{id}', [ProductController::class, 'update']);
    Route::delete('/{id}', [ProductController::class, 'destroy']);
});

Route::prefix('product-categories')->group(function () {
    Route::get('/', [ProductCategoryController::class, 'index']);
    Route::post('/', [ProductCategoryController::class, 'store']);
    Route::put('/{id}', [ProductCategoryController::class, 'update']);
    Route::delete('/{id}', [ProductCategoryController::class, 'destroy']);
});

Route::prefix('affiliate-links')->group(function () {
    Route::get('/', [AffiliateLinkController::class, 'index']);
    Route::post('/', [AffiliateLinkController::class, 'store']);
    Route::get('/{id}', [AffiliateLinkController::class, 'show']);
    Route::put('/{id}', [AffiliateLinkController::class, 'update']);
    Route::delete('/{id}', [AffiliateLinkController::class, 'destroy']);
});

Route::get('/affiliates/list', [AffiliateLinkController::class, 'listAffiliates']);
Route::get('/affiliates/stats', [AffiliateLinkController::class, 'affiliateStats']);
Route::get('/affiliates/{id}/detail', [AffiliateLinkController::class, 'detailAffiliate']);
// Public - daftar via affiliate link
Route::post('/pendaftaran/daftar', [PendaftaranController::class, 'daftar']);
Route::get('/affiliate-link/{kode}', [AffiliateLinkController::class, 'showByKode']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/kandidat', [PendaftaranController::class, 'kandidat']);
    Route::post('/kandidat', [PendaftaranController::class, 'storeKandidat']);
    Route::put('/kandidat/{id}', [PendaftaranController::class, 'updateKandidat']);
    Route::post('/kandidat/{id}/toggle-status', [PendaftaranController::class, 'toggleKandidatStatus']);
    Route::post('/kandidat/{id}/toggle-cuti', [PendaftaranController::class, 'toggleCuti']);

    Route::prefix('pendaftar')->group(function () {
        Route::get('/', [PendaftaranController::class, 'index']);
        Route::get('/pending-count', [PendaftaranController::class, 'pendingCount']);
        Route::get('/{id}', [PendaftaranController::class, 'show']);
        Route::get('/{id}/invoice', [PendaftaranController::class, 'invoice']);
        Route::post('/{id}/approve', [PendaftaranController::class, 'approve']);
        Route::post('/{id}/reject', [PendaftaranController::class, 'reject']);
        Route::post('/{id}/verify-payment', [PendaftaranController::class, 'verifyPayment']);
        Route::post('/pembayaran/{pembayaranId}/reject-payment', [PendaftaranController::class, 'rejectPayment']);
        Route::post('/{id}/bayar-all', [PendaftaranController::class, 'bayarAll']);
        Route::post('/{id}/bayar-manual', [PendaftaranController::class, 'bayarManual']);
        Route::get('/pending-count', [PendaftaranController::class, 'pendingCount']);
        Route::get('/{id}/riwayat-pembayaran', [PendaftaranController::class, 'riwayatPembayaran']);
        Route::delete('/{id}', [PendaftaranController::class, 'destroy']);
    });

    Route::get('/pembayaran', [PendaftaranController::class, 'allPembayaran']);
    Route::get('/pembayaran-pending', [PendaftaranController::class, 'pendingPembayaran']);
    Route::get('/rekap-per-batch', [PendaftaranController::class, 'rekapPerBatch']);
    Route::get('/biaya-kategori', [BiayaController::class, 'kategoriIndex']);
    Route::post('/biaya-kategori', [BiayaController::class, 'kategoriStore']);
    Route::put('/biaya-kategori/{id}', [BiayaController::class, 'kategoriUpdate']);
    Route::delete('/biaya-kategori/{id}', [BiayaController::class, 'kategoriDestroy']);
    Route::get('/batch-biaya/{batchId}', [BiayaController::class, 'batchBiayaIndex']);
    Route::post('/batch-biaya/{batchId}', [BiayaController::class, 'batchBiayaStore']);
    Route::get('/pembayaran-item/{pendaftarId}', [BiayaController::class, 'pembayaranItemIndex']);
    Route::post('/pembayaran-item/{pendaftarId}', [BiayaController::class, 'pembayaranItemStore']);
    Route::get('/affiliate-dashboard', [AffiliateDashboardController::class, 'index']);
    Route::post('/affiliate/my-links', [AffiliateLinkController::class, 'myLinks']);
    Route::get('/affiliate/products-aktif', [AffiliateLinkController::class, 'availableProducts']);
    Route::get('/siswa-dashboard', [SiswaDashboardController::class, 'index']);
    Route::get('/guru-dashboard', [GuruDashboardController::class, 'index']);
    Route::get('/guru/kelas-saya', [GuruDashboardController::class, 'kelasSaya']);
    Route::post('/guru/kelas-saya', [GuruDashboardController::class, 'storeKelas']);
    Route::get('/guru/absen-cek', [GuruDashboardController::class, 'cekAbsen']);
    Route::post('/guru/absen-masuk', [GuruDashboardController::class, 'absenMasuk']);
    Route::post('/guru/absen-pulang', [GuruDashboardController::class, 'absenPulang']);
    Route::get('/guru/data-siswa/{kelasId}', [GuruDashboardController::class, 'dataSiswa']);
    Route::get('/guru/penilaian-harian/{kelasId}', [GuruDashboardController::class, 'penilaianHarian']);
    Route::post('/guru/penilaian-harian', [GuruDashboardController::class, 'simpanPenilaianHarian']);
    Route::get('/guru/profile', [GuruDashboardController::class, 'profile']);
    Route::get('/guru/batch-dan-nilai', [GuruDashboardController::class, 'batchDanNilai']);
    Route::get('/guru/ranking/{batchId}', [GuruDashboardController::class, 'rankingBatch']);
    Route::post('/guru/level-evaluation', [GuruDashboardController::class, 'storeLevelEvaluation']);
    Route::get('/guru/level-evaluations/{batchId}/{level}', [GuruDashboardController::class, 'getLevelEvaluations']);

    // Guru LMS (static routes BEFORE wildcard routes)
    Route::get('/guru/lms-courses', [GuruDashboardController::class, 'lmsCourses']);
    Route::post('/guru/lms-courses', [GuruDashboardController::class, 'lmsStoreCourse']);
    Route::post('/guru/lms-courses/files', [GuruDashboardController::class, 'lmsStoreCourseFile']);
    Route::delete('/guru/lms-courses/files/{id}', [GuruDashboardController::class, 'lmsDeleteCourseFile']);
    Route::post('/guru/lms-lessons', [GuruDashboardController::class, 'guruStoreLesson']);
    Route::post('/guru/lms-lessons/{id}', [GuruDashboardController::class, 'guruUpdateLesson']);
    Route::delete('/guru/lms-lessons/{id}', [GuruDashboardController::class, 'guruDeleteLesson']);
    Route::get('/guru/lms-courses/{courseId}/files', [GuruDashboardController::class, 'lmsCourseFiles']);
    Route::get('/guru/lms-courses/{courseId}/lessons', [GuruDashboardController::class, 'guruLessons']);
    Route::get('/guru/lms-courses/{id}', [GuruDashboardController::class, 'lmsCourseDetail']);
    Route::post('/guru/lms-courses/{id}', [GuruDashboardController::class, 'lmsUpdateCourse']);
    Route::delete('/guru/lms-courses/{id}', [GuruDashboardController::class, 'lmsDeleteCourse']);

    // Guru Assignments
    Route::get('/guru/assignments/{courseId}', [GuruDashboardController::class, 'lmsAssignments']);
    Route::post('/guru/assignments', [GuruDashboardController::class, 'lmsStoreAssignment']);
    Route::post('/guru/assignments/{id}', [GuruDashboardController::class, 'lmsUpdateAssignment']);
    Route::delete('/guru/assignments/{id}', [GuruDashboardController::class, 'lmsDeleteAssignment']);
    Route::get('/guru/assignments/{id}/submissions', [GuruDashboardController::class, 'lmsAssignmentSubmissions']);
    Route::post('/guru/assignments/{id}/grade', [GuruDashboardController::class, 'lmsGradeSubmission']);

    // LMS
    Route::prefix('lms')->group(function () {
        Route::get('/courses', [LmsController::class, 'courses']);
        Route::get('/courses/{id}', [LmsController::class, 'courseDetail']);
        Route::get('/lessons/{id}', [LmsController::class, 'lessonDetail']);
        Route::post('/lessons/{id}/complete', [LmsController::class, 'completeLesson']);
        Route::delete('/lessons/{id}/complete', [LmsController::class, 'uncompleteLesson']);

        // Student Assignments
        Route::get('/courses/{courseId}/assignments', [LmsController::class, 'courseAssignments']);
        Route::post('/assignments/{assignmentId}/submit', [LmsController::class, 'submitAssignment']);
    });

    // LMS Admin
    Route::prefix('admin/lms')->group(function () {
        Route::get('/courses', [LmsController::class, 'adminCourses']);
        Route::post('/courses', [LmsController::class, 'storeCourse']);
        Route::post('/courses/{id}', [LmsController::class, 'updateCourse']);
        Route::delete('/courses/{id}', [LmsController::class, 'deleteCourse']);
        Route::get('/courses/{courseId}/lessons', [LmsController::class, 'adminLessons']);
        Route::get('/courses/{courseId}/files', [LmsController::class, 'adminCourseFiles']);
        Route::post('/lessons', [LmsController::class, 'storeLesson']);
        Route::post('/lessons/{id}', [LmsController::class, 'updateLesson']);
        Route::delete('/lessons/{id}', [LmsController::class, 'deleteLesson']);
        Route::post('/upload', [LmsController::class, 'upload']);
        Route::post('/files', [LmsController::class, 'storeCourseFile']);
        Route::delete('/files/{id}', [LmsController::class, 'deleteCourseFile']);
    });
});

// Public — daftar langsung tanpa affiliate
Route::post('/pendaftaran/daftar-langsung', [PendaftaranController::class, 'daftarLangsung']);
Route::get('/pendaftaran/bayar/{id}', [PendaftaranController::class, 'bayarInfo']);
Route::post('/pendaftar/{id}/bayar', [PendaftaranController::class, 'bayar']);
Route::get('/banks', [PendaftaranController::class, 'banks']);

// Public — biaya kategori flat for registration page
Route::get('/biaya-kategori-flat', [BiayaController::class, 'kategoriIndexFlat']);

// ========== Coupon / Diskon ==========
Route::prefix('coupons')->group(function () {
    Route::get('/', [CouponController::class, 'index']);
    Route::post('/', [CouponController::class, 'store']);
    Route::get('/{id}', [CouponController::class, 'show']);
    Route::put('/{id}', [CouponController::class, 'update']);
    Route::delete('/{id}', [CouponController::class, 'destroy']);
});
Route::post('/coupons/validate', [CouponController::class, 'validate']);

Route::middleware('auth')->group(function () {
    Route::post('/wa-izin-send-test', [WaWebhookController::class, 'sendTest']);
});

// ========== Admin Cabang Routes ==========
Route::prefix('admin-cabang')->middleware(['auth:sanctum'])->group(function () {
    Route::get('/dashboard', [AdminCabangController::class, 'dashboard']);
    Route::get('/pendaftar', [AdminCabangController::class, 'pendaftar']);
    Route::get('/tagihan', [AdminCabangController::class, 'tagihan']);
    Route::get('/kandidat', [AdminCabangController::class, 'kandidat']);
    Route::get('/batches', [AdminCabangController::class, 'batches']);
    Route::get('/pending-count', [AdminCabangController::class, 'pendingCount']);
    Route::get('/pending-pembayaran', [AdminCabangController::class, 'pendingPembayaran']);
    Route::get('/rekap-per-batch', [AdminCabangController::class, 'rekapPerBatch']);
    Route::get('/my-branches', [AdminCabangController::class, 'myBranches']);

    // Reuse existing endpoints for payment operations
    Route::get('/pembayaran-item/{pendaftarId}', [BiayaController::class, 'pembayaranItemIndex']);
    Route::post('/pembayaran-item/{pendaftarId}', [BiayaController::class, 'pembayaranItemStore']);
    Route::post('/pendaftar/{id}/verify-payment', [PendaftaranController::class, 'verifyPayment']);
    Route::post('/pendaftar/pembayaran/{pembayaranId}/reject-payment', [PendaftaranController::class, 'rejectPayment']);
    Route::get('/pendaftar/{id}/invoice', [PendaftaranController::class, 'invoice']);
    Route::get('/pendaftar/{id}/riwayat-pembayaran', [PendaftaranController::class, 'riwayatPembayaran']);
    Route::post('/pendaftar/{id}/bayar-manual', [PendaftaranController::class, 'bayarManual']);
    Route::post('/pendaftar/{id}/bayar-all', [PendaftaranController::class, 'bayarAll']);
    Route::post('/pendaftar/{id}/update-kandidat', [PendaftaranController::class, 'updateKandidat']);

    // Biaya & Batch Biaya
    Route::get('/biaya-kategori', [BiayaController::class, 'kategoriIndexFlat']);
    Route::get('/batch-biaya/{batchId}', [BiayaController::class, 'batchBiayaIndex']);
});

// ========== Pengeluaran (HR, MANAGER, ACCOUNTING & ADMIN CABANG) ==========
Route::middleware(['auth:sanctum', 'role:HR,MANAGER,ACCOUNTING,ADMIN_CABANG'])->prefix('pengeluaran')->group(function () {
    Route::get('/kategori', [PengeluaranController::class, 'kategoriIndex']);
    Route::post('/kategori', [PengeluaranController::class, 'kategoriStore']);
    Route::put('/kategori/{id}', [PengeluaranController::class, 'kategoriUpdate']);
    Route::delete('/kategori/{id}', [PengeluaranController::class, 'kategoriDestroy']);

    Route::get('/', [PengeluaranController::class, 'index']);
    Route::post('/', [PengeluaranController::class, 'store']);
    Route::get('/dashboard', [PengeluaranController::class, 'dashboard']);
    Route::get('/rekap', [PengeluaranController::class, 'rekap']);
    Route::get('/{id}', [PengeluaranController::class, 'show']);
    Route::put('/{id}', [PengeluaranController::class, 'update']);
    Route::delete('/{id}', [PengeluaranController::class, 'destroy']);
});

// ========== WhatsApp Notification Log ==========
Route::middleware(['auth:sanctum'])->prefix('wa-notifications')->group(function () {
    Route::get('/', [\App\Http\Controllers\WaNotificationController::class, 'index']);
    Route::get('/stats', [\App\Http\Controllers\WaNotificationController::class, 'stats']);
    Route::post('/send-reminder/{pendaftarId}', [\App\Http\Controllers\WaNotificationController::class, 'sendReminder']);
});

// ========== WhatsApp Notification Settings ==========
Route::middleware(['auth:sanctum'])->prefix('wa-settings')->group(function () {
    Route::get('/reminder', [\App\Http\Controllers\WaSettingController::class, 'reminderIndex']);
    Route::put('/reminder', [\App\Http\Controllers\WaSettingController::class, 'reminderUpdate']);
    Route::get('/global', [\App\Http\Controllers\WaSettingController::class, 'globalIndex']);
    Route::put('/global', [\App\Http\Controllers\WaSettingController::class, 'globalUpdate']);
});