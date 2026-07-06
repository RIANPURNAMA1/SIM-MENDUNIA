<?php

use App\Http\Controllers\Absensi\AbsensiController;
use App\Http\Controllers\Absensi\AbsensiSiswaController;
use App\Http\Controllers\Absensi\JadwalLevelController;
use App\Http\Controllers\Absensi\KehadiranController;
use App\Http\Controllers\Absensi\KehadiranKhususController;
use App\Http\Controllers\Absensi\KehadiranSenseiController;
use App\Http\Controllers\Absensi\RekapController;
use App\Http\Controllers\Absensi\RekapJadwalShiftController;
use App\Http\Controllers\Absensi\RekapKehadiranSenseiController;
use App\Http\Controllers\Absensi\SenseiController;
use App\Http\Controllers\AgendaController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CabangController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DivisiController;
use App\Http\Controllers\IzinController;
use App\Http\Controllers\KaryawanController;
use App\Http\Controllers\LemburController;
use App\Http\Controllers\MonitoringController;
use App\Http\Controllers\PengaturanController;
use App\Http\Controllers\PengaturanShiftController;
use App\Http\Controllers\PenilaianController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\ShiftJadwalController;
use App\Http\Controllers\BatchController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/keep-alive', function () {
    return response()->json(['status' => 'active']);
})->middleware('auth');
/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/

// Tampilkan form lupa password / ubah password
Route::get('/forgot-password', [AuthController::class, 'show'])->name('password.request');

// Proses ubah password langsung (submit email + password baru)
Route::post('/forgot-password', [AuthController::class, 'reset'])->name('password.update');

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'loginForm'])->name('login');
    Route::post('/login/process', [AuthController::class, 'login'])->name('login.process');
    Route::get('/register', [AuthController::class, 'registerForm'])->name('register');
    Route::post('/register', [AuthController::class, 'register']);
});

Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::get('/logout-app', function () {
    if (Auth::check()) {
        Auth::logout();
        request()->session()->invalidate();
        request()->session()->regenerateToken();
    }
    return redirect('http://localhost:5173/login');
});

/*
|--------------------------------------------------------------------------
| Dashboard Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'role:MANAGER,HR'])->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
});

Route::middleware(['auth', 'role:HR'])->group(function () {
    Route::get('/hr/dashboard', fn () => view('dashboard'))->name('hr.dashboard');
});

Route::middleware(['auth', 'role:MANAGER'])->group(function () {
    Route::get('/manager/dashboard', fn () => view('dashboard'))->name('manager.dashboard');
});

Route::middleware(['auth', 'role:KARYAWAN'])->group(function () {
    Route::get('/karyawan/dashboard', fn () => view('karyawan.dashboard'))->name('karyawan.dashboard');
});

/*
|--------------------------------------------------------------------------
| HR & Manager Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'role:HR,MANAGER'])->group(function () {

    // Karyawan Management
    Route::get('/karyawan', [KaryawanController::class, 'index'])->name('karyawan.index');
    Route::post('/karyawan', [KaryawanController::class, 'store'])->name('karyawan.store');
    Route::get('/karyawan/{id}', [KaryawanController::class, 'show'])->name('karyawan.show');
    Route::put('/karyawan/{id}', [KaryawanController::class, 'update'])->name('karyawan.update');
    Route::delete('/karyawan/{id}', [KaryawanController::class, 'destroy'])->name('karyawan.destroy');
    Route::post('/karyawan/{id}/toggle-khusus', [KaryawanController::class, 'toggleKhusus']);
    Route::post('/karyawan/{id}/toggle-status', [KaryawanController::class, 'toggleStatus']);

    // Divisi Management
    Route::resource('divisi', DivisiController::class)->only(['index', 'store', 'update', 'destroy']);

    // Shift Management
    Route::resource('shift', ShiftController::class);

    // Shift Jadwal (per tanggal per karyawan)
    Route::get('/shift-jadwal/{userId}', [ShiftJadwalController::class, 'getJadwalKaryawan'])->name('shift-jadwal.get');
    Route::post('/shift-jadwal', [ShiftJadwalController::class, 'store'])->name('shift-jadwal.store');
    Route::post('/shift-jadwal/multiple', [ShiftJadwalController::class, 'createMultiple'])->name('shift-jadwal.multiple');
    Route::delete('/shift-jadwal/{id}', [ShiftJadwalController::class, 'destroy'])->name('shift-jadwal.destroy');
    Route::get('/jadwal-shift', [ShiftJadwalController::class, 'indexPage'])->name('shift-jadwal.page');

    // Cabang Management
    Route::get('/cabang', [CabangController::class, 'index'])->name('cabang.index');
    Route::post('/cabang', [CabangController::class, 'store'])->name('cabang.store');
    Route::put('/cabang/{id}', [CabangController::class, 'update'])->name('cabang.update');
    Route::delete('/cabang/{id}', [CabangController::class, 'destroy'])->name('cabang.destroy');

    // Kelas Management
    Route::get('/kelas', [\App\Http\Controllers\KelasController::class, 'index'])->name('kelas.index');
    Route::post('/kelas', [\App\Http\Controllers\KelasController::class, 'store'])->name('kelas.store');
    Route::put('/kelas/{id}', [\App\Http\Controllers\KelasController::class, 'update'])->name('kelas.update');
    Route::delete('/kelas/{id}', [\App\Http\Controllers\KelasController::class, 'destroy'])->name('kelas.destroy');
    Route::post('/kelas/{id}/toggle-status', [\App\Http\Controllers\KelasController::class, 'toggleStatus']);

    // Batch Management
    Route::get('/batches', [BatchController::class, 'index'])->name('batches.index');
    Route::post('/batches', [BatchController::class, 'store'])->name('batches.store');
    Route::put('/batches/{id}', [BatchController::class, 'update'])->name('batches.update');
    Route::delete('/batches/{id}', [BatchController::class, 'destroy'])->name('batches.destroy');
    Route::post('/batches/{id}/toggle-status', [BatchController::class, 'toggleStatus']);

    // Jadwal Level (admin atur tanggal per level)
    Route::get('/jadwal-level', [JadwalLevelController::class, 'index'])->name('jadwal-level.index');
    Route::post('/jadwal-level', [JadwalLevelController::class, 'store'])->name('jadwal-level.store');
    Route::delete('/jadwal-level/{batchId}/{level}', [JadwalLevelController::class, 'destroy'])->name('jadwal-level.destroy');

    // Guru Management
    Route::get('/guru', [\App\Http\Controllers\GuruController::class, 'index'])->name('guru.index');
    Route::post('/guru', [\App\Http\Controllers\GuruController::class, 'store'])->name('guru.store');
    Route::delete('/guru/{id}', [\App\Http\Controllers\GuruController::class, 'destroy'])->name('guru.destroy');

    // Kehadiran & Monitoring
    Route::get('/data-kehadiran', [KehadiranController::class, 'index']);
    Route::post('/admin/absensi/update-status', [KehadiranController::class, 'updateStatus'])->name('admin.absensi.updateStatus');
    Route::get('/data-kehadiran-khusus', [KehadiranKhususController::class, 'index']);
    Route::post('/admin/kehadiran-khusus/update-status', [KehadiranKhususController::class, 'updateStatus']);
    Route::get('/rekap-absensi', [RekapController::class, 'rekap'])->name('absensi.rekap');
    Route::get('/rekap-absensi/hidden-divisi', [RekapController::class, 'getHiddenDivisi']);
    Route::post('/rekap-absensi/hidden-divisi', [RekapController::class, 'setHiddenDivisi']);
    Route::get('/rekap-jadwal-shift', [RekapJadwalShiftController::class, 'index']);
    Route::get('/rekap-jadwal-shift/{userId}', [RekapJadwalShiftController::class, 'getData']);
    Route::post('/rekap-jadwal-shift/update-status', [RekapJadwalShiftController::class, 'updateStatus']);

    // Kehadiran Sensei
    Route::get('/data-kehadiran-sensei', [KehadiranSenseiController::class, 'index']);
    Route::get('/admin/kehadiran-sensei/riwayat/{userId}/{kelasId}', [KehadiranSenseiController::class, 'getRiwayat']);
    Route::get('/admin/kehadiran-sensei/kelas/{userId}', [KehadiranSenseiController::class, 'getKelasByUser']);
    Route::post('/admin/kehadiran-sensei/update-status', [KehadiranSenseiController::class, 'updateStatus']);

    // Rekap Kehadiran Sensei
    Route::get('/rekap-kehadiran-sensei', [RekapKehadiranSenseiController::class, 'index']);
    Route::get('/rekap-kehadiran-sensei/{userId}', [RekapKehadiranSenseiController::class, 'getData']);
    Route::post('/rekap-kehadiran-sensei/update-status', [RekapKehadiranSenseiController::class, 'updateStatus']);

    // Kelas Sensei (menu terpisah)
    Route::get('/kelas-sensei', [KehadiranSenseiController::class, 'kelasIndex']);
    Route::delete('/kelas-sensei/{id}', [KehadiranSenseiController::class, 'destroy'])->name('kelas-sensei.destroy');

    // Agenda
    Route::get('/data-agenda', [App\Http\Controllers\Admin\AgendaController::class, 'index'])->name('admin.agenda.index');

    // Monitoring
    Route::get('/monitoring-lokasi', [MonitoringController::class, 'monitoring']);

    // User Management
    Route::get('/daftar-user', [UserController::class, 'userKaryawan'])->name('user.karyawan');
    Route::prefix('/daftar-user')->group(function () {
        Route::post('/store', [UserController::class, 'store'])->name('user.karyawan.store');
        Route::get('/edit/{id}', [UserController::class, 'edit'])->name('user.karyawan.edit');
        Route::post('/update/{id}', [UserController::class, 'update'])->name('user.karyawan.update');
        Route::delete('/delete/{id}', [UserController::class, 'destroy'])->name('user.karyawan.delete');
    });

    // Pengaturan Notifikasi WA
    Route::get('/pengaturan-wa', [PengaturanController::class, 'index'])->name('pengaturan-wa.index');
    Route::post('/pengaturan-wa', [PengaturanController::class, 'update'])->name('pengaturan-wa.update');

    // Pengaturan Shift Mode
    Route::get('/pengaturan-shift', [PengaturanShiftController::class, 'index'])->name('pengaturan-shift.index');
    Route::post('/pengaturan-shift', [PengaturanShiftController::class, 'update'])->name('pengaturan-shift.update');

    // Manajemen Akun Admin (HR / MANAGER)
    Route::get('/pengaturan', [UserController::class, 'index'])->name('pengaturan.index');
    Route::post('/pengaturan', [UserController::class, 'store'])->name('users.store');
    Route::put('/pengaturan/{id}', [UserController::class, 'update'])->name('pengaturan.update');
    Route::delete('/pengaturan/users/{id}', [UserController::class, 'destroyAdmin']);

    // Pengaturan Penilaian
    Route::get('/pengaturan-penilaian', [PenilaianController::class, 'settingsIndex'])->name('penilaian.settings');
    Route::post('/pengaturan-penilaian', [PenilaianController::class, 'updateSettings'])->name('penilaian.settings.update');

    // lembur
    Route::get('/approval-lembur', [LemburController::class, 'approvalIndex'])->name('lembur.approval');
    Route::post('/approval-lembur/{id}/status', [LemburController::class, 'updateStatus'])->name('lembur.status');
});

/*
|--------------------------------------------------------------------------
| Penilaian Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'role:HR,MANAGER,KARYAWAN,GURU'])->group(function () {
    Route::get('/penilaian', [PenilaianController::class, 'index'])->name('penilaian.index');
    Route::get('/penilaian/day-detail', [PenilaianController::class, 'dayDetail'])->name('penilaian.day-detail');
    Route::get('/penilaian-karyawan', [PenilaianController::class, 'karyawanIndex'])->name('penilaian.karyawan');
});

Route::middleware(['auth', 'role:HR,MANAGER,KARYAWAN'])->group(function () {
    Route::post('/penilaian', [PenilaianController::class, 'store'])->name('penilaian.store');
    Route::put('/penilaian/{id}', [PenilaianController::class, 'update'])->name('penilaian.update');
    Route::delete('/penilaian/{id}', [PenilaianController::class, 'destroy'])->name('penilaian.destroy');
});

/*
|--------------------------------------------------------------------------
| Izin/Cuti Routes (All Roles)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'role:HR,MANAGER,KARYAWAN,GURU'])->group(function () {
    Route::get('/izin-cuti', [IzinController::class, 'approvalList'])->name('izin.approval.list');
    Route::post('/izin/{id}/approve', [IzinController::class, 'approve'])->name('izin.approve');
    Route::post('/izin/{id}/reject', [IzinController::class, 'reject'])->name('izin.reject');
    Route::get('/lampiran/{filename}', [IzinController::class, 'lihatLampiran'])->name('izin.lampiran');
    Route::get('/izin/pending-by-batch/{batchId}', [IzinController::class, 'pendingByBatch'])->name('izin.pendingByBatch');
});

/*
|--------------------------------------------------------------------------
| Karyawan Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'role:KARYAWAN,SISWA,GURU'])->group(function () {
    Route::get('/absensi', [AbsensiController::class, 'index'])->name('absensi.index');

    // absensi foto
    Route::post('/absensi/foto/proses', [AbsensiController::class, 'absenFoto'])->middleware('auth');

    // Absensi
    Route::get('/absensi/mobile', fn () => view('absensi.mobile'))->name('absensi.mobile');
    Route::post('/absen/masuk', [AbsensiController::class, 'absenMasuk'])->name('absen.masuk');
    Route::post('/absensi/masuk', [AbsensiController::class, 'absenMasuk']);
    Route::post('/absensi/pulang', [AbsensiController::class, 'absenPulang'])->name('absen.pulang');
    Route::post('/absensi/manual', [AbsensiController::class, 'manual']);
    Route::post('/absensi/status', [AbsensiController::class, 'statusAbsensi'])->name('statusAbsensi');
    Route::post('/absensi/deteksi', [AbsensiController::class, 'deteksiWajah'])->name('absensi.deteksi');

    // Absensi Khusus (timer with pause/resume)
    Route::get('/absensi/khusus', [AbsensiController::class, 'khususIndex'])->name('absensi.khusus');
    Route::get('/absensi/khusus/status', [AbsensiController::class, 'absenKhususStatus']);
    Route::post('/absensi/khusus/mulai', [AbsensiController::class, 'absenKhususMulai']);
    Route::post('/absensi/khusus/pause', [AbsensiController::class, 'absenKhususPause']);
    Route::post('/absensi/khusus/lanjut', [AbsensiController::class, 'absenKhususLanjut']);
    Route::post('/absensi/khusus/selesai', [AbsensiController::class, 'absenKhususSelesai']);

    // Riwayat Absensi
    Route::get('/absensi/history', [AbsensiController::class, 'history'])->name('absensi.history');
    Route::get('/absensi/riwayat', [AbsensiController::class, 'riwayat'])->name('absensi.riwayat');
    Route::get('/absensi/riwayat-terbaru', [AbsensiController::class, 'riwayatTerbaru']);
    Route::get('/absensi/riwayat-json', [AbsensiController::class, 'riwayatJson'])->name('absensi.riwayat.json');
    Route::get('/absensi/detail/{tanggal}', [AbsensiController::class, 'detail'])->name('absensi.detail');
    Route::get('/absensi/detail-sensei/{tanggal}/{kelasId}', [AbsensiController::class, 'detailSensei'])->name('absensi.detailSensei');
    Route::get('/absensi/riwayat-kelas/{kelasSensei}', [AbsensiController::class, 'riwayatKelas'])->name('absensi.riwayat-kelas');

    // Scan QR untuk absensi siswa
    Route::get('/absensi/scan', [AbsensiController::class, 'scanQr'])->name('absensi.scan');
    Route::post('/absensi/scan/proses', [AbsensiController::class, 'prosesScan'])->name('absensi.siswa.scan');

    // Profile
    Route::get('/absensi/profile', [AbsensiController::class, 'profile'])->name('absensi.profile');
    Route::get('/profile/edit', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::put('/profile/update', [ProfileController::class, 'update'])->name('profile.update');
    Route::get('/profile/password', [ProfileController::class, 'changePassword'])->name('password.change');
    Route::put('/profile/password', [ProfileController::class, 'updatePassword'])->name('password.update');

    // Izin/Cuti
    Route::get('/izin/create', [IzinController::class, 'create'])->name('izin.create');
    Route::post('/izin/store', [IzinController::class, 'store'])->name('izin.store');
    Route::get('/absensi/izin', [IzinController::class, 'index'])->name('izin.index');

    // Calendar
    Route::get('/calendar', [CalendarController::class, 'index']);
    Route::get('/absensi/riwayat-kalender', [CalendarController::class, 'getRiwayatKalender'])->name('riwayatKalender');

    // lembur
    Route::get('/absensi/lembur', [LemburController::class, 'index'])->name('lembur.index');
    Route::post('/absensi/lembur/store', [LemburController::class, 'store'])->name('absensi.lembur.store');

    // Sensei
    Route::get('/absensi/sensei', [SenseiController::class, 'index'])->name('sensei.index');
    Route::post('/absensi/sensei/store-kelas', [SenseiController::class, 'storeKelas'])->name('sensei.storeKelas');
    Route::get('/absensi/sensei/kelas-aktif', [SenseiController::class, 'getKelasAktif'])->name('sensei.kelasAktif');
    Route::post('/absensi/sensei/absen-masuk', [SenseiController::class, 'absenMasuk'])->name('sensei.absenMasuk');
    Route::post('/absensi/sensei/absen-pulang', [SenseiController::class, 'absenPulang'])->name('sensei.absenPulang');
    Route::delete('/absensi/sensei/{id}', [SenseiController::class, 'destroy'])->name('sensei.destroy');
    Route::get('/absensi/sensei/get-jadwal-level', [SenseiController::class, 'getJadwalLevel'])->name('sensei.getJadwalLevel');

    // Agenda
    Route::get('/absensi/agenda', [AgendaController::class, 'index'])->name('agenda.index');
    Route::get('/absensi/agenda/test', function () {
        return response()->json(['test' => 'oke']);
    });

    Route::get('/absensi/agenda/{id}', [AgendaController::class, 'show']);
    Route::post('/absensi/agenda/store', [AgendaController::class, 'store'])->name('agenda.store');
    Route::put('/absensi/agenda/{id}', [AgendaController::class, 'update'])->name('agenda.update');
    Route::delete('/absensi/agenda/{id}', [AgendaController::class, 'destroy'])->name('agenda.destroy');
    Route::post('/absensi/agenda/{id}/complete', [AgendaController::class, 'complete'])->name('agenda.complete');
    Route::get('/absensi/agenda/by-date', [AgendaController::class, 'getByDate'])->name('agenda.byDate');
    Route::post('/absensi/agenda/absen-masuk', [AgendaController::class, 'absenMasuk'])->name('agenda.absenMasuk');
    Route::post('/absensi/agenda/absen-pulang', [AgendaController::class, 'absenPulang'])->name('agenda.absenPulang');
});

Route::middleware(['auth', 'role:GURU'])->group(function () {
    Route::get('/absensi/siswa', [AbsensiController::class, 'siswaIndex'])->name('absensi.siswa');
    Route::get('/absensi/siswa/attendance/{kelasSenseiId}', [AbsensiController::class, 'getSiswaAttendance'])->name('absensi.siswa.attendance');
    Route::post('/absensi/siswa/update-status', [AbsensiController::class, 'updateSiswaStatus'])->name('absensi.siswa.update-status');
    Route::get('/absensi/siswa/riwayat/{siswa}', [AbsensiController::class, 'riwayatSiswaJson'])->name('absensi.siswa.riwayat');
    Route::get('/absensi/siswa/penilaian/{batchId}', [AbsensiController::class, 'penilaianSiswaJson'])->name('absensi.siswa.penilaian');
    Route::get('/absensi/siswa/penilaian-template/{kelasSenseiId}', [AbsensiController::class, 'assessmentTemplate'])->name('absensi.siswa.penilaian.template');
    Route::post('/absensi/siswa/penilaian-day', [AbsensiController::class, 'getDayAssessments'])->name('absensi.siswa.penilaian.day');
    Route::post('/absensi/siswa/penilaian-save', [AbsensiController::class, 'saveAssessments'])->name('absensi.siswa.penilaian.save');
});

/*
|--------------------------------------------------------------------------
| General Authenticated Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth')->group(function () {
    Route::post('/user/update-face', [AbsensiController::class, 'updateFace'])->name('user.update-face');
});

// hari libur
use App\Http\Controllers\HariLiburController;
use App\Http\Controllers\ProjectListsController;
use App\Http\Controllers\AiChatController;

Route::get('/hari-libur', [HariLiburController::class, 'index'])->name('hari-libur.index');
Route::post('/hari-libur', [HariLiburController::class, 'store'])->name('hari-libur.store');
Route::delete('/hari-libur/{id}', [HariLiburController::class, 'destroy'])->name('hari-libur.destroy');

use App\Http\Controllers\ReportController;
use App\Http\Controllers\TaskController;

Route::middleware(['auth'])->group(function () {
    // View Utama Report
    Route::get('/report', [ReportController::class, 'index'])->name('report.index');

    // API untuk data kalender (jika diperlukan oleh script kalender)
    Route::get('/api/report/calendar', [ReportController::class, 'getCalendarData'])->name('report.calendar');
});

// Pastikan dibungkus middleware auth
Route::middleware(['auth'])->group(function () {
    // task management
    Route::get('/project/dashboard', [TaskController::class, 'index']);
    // Rute untuk menyimpan tugas baru (form modal)
    Route::post('/tasks/store', [TaskController::class, 'store'])->name('tasks.store');
    Route::post('/project-lists', [ProjectListsController::class, 'store'])->name('project-lists.store');
    Route::post('/tasks/update-order', [TaskController::class, 'updateOrder'])->name('tasks.update-order');
    // Route untuk handle upload dari CKEditor
    Route::post('/tasks/upload-image', [TaskController::class, 'uploadImage'])->name('tasks.upload-image');

});




Route::middleware(['auth'])->group(function () {
    Route::get('/ai-chat', [AiChatController::class, 'index'])->name('ai.chat');
    Route::post('/ai-chat/send', [AiChatController::class, 'send'])->name('ai.chat.send');
});

/*
|--------------------------------------------------------------------------
| Siswa Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'role:HR,MANAGER'])->group(function () {
    Route::get('/siswa', [\App\Http\Controllers\SiswaController::class, 'index'])->name('siswa.index');
    Route::post('/siswa', [\App\Http\Controllers\SiswaController::class, 'store'])->name('siswa.store');
    Route::put('/siswa/{id}', [\App\Http\Controllers\SiswaController::class, 'update'])->name('siswa.update');
    Route::delete('/siswa/{id}', [\App\Http\Controllers\SiswaController::class, 'destroy'])->name('siswa.destroy');
    Route::post('/siswa/{id}/toggle-status', [\App\Http\Controllers\SiswaController::class, 'toggleStatus']);
    Route::post('/siswa/{id}/buatkan-akun', [\App\Http\Controllers\SiswaController::class, 'buatkanAkun']);
    Route::post('/siswa/import', [\App\Http\Controllers\SiswaController::class, 'import'])->name('siswa.import');
    Route::post('/siswa/import-ai', [\App\Http\Controllers\SiswaController::class, 'importAi'])->name('siswa.import-ai');
    Route::post('/siswa/bulk-update-shift', [\App\Http\Controllers\SiswaController::class, 'bulkUpdateShift'])->name('siswa.bulk-update-shift');
    Route::post('/siswa/bulk-delete', [\App\Http\Controllers\SiswaController::class, 'bulkDelete'])->name('siswa.bulk-delete');
});

Route::middleware(['auth', 'role:HR,MANAGER,GURU'])->group(function () {
    Route::get('/absensi-siswa', [AbsensiSiswaController::class, 'index'])->name('absensi-siswa.index');
    Route::post('/absensi-siswa', [AbsensiSiswaController::class, 'store'])->name('absensi-siswa.store');
    Route::post('/absensi-siswa/mass', [AbsensiSiswaController::class, 'massStore'])->name('absensi-siswa.mass');
    Route::put('/absensi-siswa/{id}', [AbsensiSiswaController::class, 'update'])->name('absensi-siswa.update');
    Route::get('/absensi-siswa/siswa-by-kelas', [AbsensiSiswaController::class, 'dataSiswaByKelas'])->name('absensi-siswa.siswa-by-kelas');
    Route::get('/absensi-siswa/cek', [AbsensiSiswaController::class, 'cekAbsensiSiswa']);

    Route::get('/rekap-siswa', [AbsensiSiswaController::class, 'rekap'])->name('rekap-siswa.index');
    Route::get('/rekap-siswa/export-excel', [AbsensiSiswaController::class, 'exportExcel'])->name('rekap-siswa.export-excel');
    Route::get('/rekap-siswa/export-pdf', [AbsensiSiswaController::class, 'exportPdf'])->name('rekap-siswa.export-pdf');
    Route::get('/rekap-siswa/{siswa}/kalender-json', [AbsensiSiswaController::class, 'kalenderJson'])->name('rekap-siswa.kalender-json');
});

Route::get('/test-wa/{status}', function($status) {
    $user = \App\Models\User::whereNotNull('no_hp')->first();
    $wa = new \App\Services\WhatsAppService();
    $absensi = new \App\Models\Absensi();
    $absensi->jam_masuk = now()->format('H:i:s');
    $absensi->shift = $user->shift;
    
    $result = $wa->sendAbsensiNotification($user, strtoupper($status), $absensi);
    
    return response()->json([
        'success' => $result,
        'message' => $result ? 'WA terkirim' : 'Gagal kirim WA',
        'user' => $user->name,
        'phone' => $user->no_hp,
        'status' => $status
    ]);
})->middleware('auth');