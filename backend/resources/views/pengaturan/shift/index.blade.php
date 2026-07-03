@extends('app')

@section('content')
<div class="container-fluid px-4 py-4">
    <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
            <h5 class="mb-0" style="font-weight: 700; font-size: 16px;">Pengaturan Shift</h5>
            <small class="text-muted">Atur mode shift yang digunakan untuk absensi karyawan</small>
        </div>
    </div>

    @if(session('success'))
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            {{ session('success') }}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    @endif

    <div class="card border-0 shadow-sm rounded-3">
        <div class="card-body p-4">
            <form method="POST" action="{{ route('pengaturan-shift.update') }}">
                @csrf

                <div class="mb-4">
                    <label class="form-label fw-bold">Mode Shift</label>
                    <p class="text-muted small mb-3">Pilih mode yang digunakan untuk menentukan shift karyawan saat absensi.</p>

                    <div class="d-flex flex-column gap-3">
                        <div class="form-check p-3 border rounded-3 {{ $mode === 'fixed' ? 'border-primary bg-primary-subtle' : '' }}">
                            <input class="form-check-input" type="radio" name="shift_mode" id="modeFixed" value="fixed" {{ $mode === 'fixed' ? 'checked' : '' }}>
                            <label class="form-check-label fw-medium" for="modeFixed">
                                <span class="d-block">Shift Tetap (Default)</span>
                                <small class="text-muted fw-normal">Karyawan menggunakan shift tetap yang ditentukan pada data karyawan. Shift Jadwal per tanggal tidak digunakan.</small>
                            </label>
                        </div>

                        <div class="form-check p-3 border rounded-3 {{ $mode === 'jadwal' ? 'border-primary bg-primary-subtle' : '' }}">
                            <input class="form-check-input" type="radio" name="shift_mode" id="modeJadwal" value="jadwal" {{ $mode === 'jadwal' ? 'checked' : '' }}>
                            <label class="form-check-label fw-medium" for="modeJadwal">
                                <span class="d-block">Jadwal Shift (Per Tanggal)</span>
                                <small class="text-muted fw-normal">Karyawan menggunakan shift berdasarkan jadwal yang telah ditentukan per tanggal di menu Jadwal Shift. Shift tetap pada data karyawan tidak digunakan.</small>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="d-flex justify-content-end">
                    <button type="submit" class="btn btn-dark px-4 shadow">
                        <i class="ph ph-floppy-disk me-1"></i> Simpan
                    </button>
                </div>
            </form>
        </div>
    </div>

    <div class="card border-0 shadow-sm rounded-3 mt-3">
        <div class="card-body p-4">
            <h6 class="fw-bold mb-3">Informasi</h6>
            <ul class="small text-muted mb-0">
                <li class="mb-1"><strong>Shift Tetap:</strong> Shift diambil dari kolom "Shift" pada data karyawan. Cocok untuk karyawan dengan jadwal tetap setiap hari.</li>
                <li class="mb-1"><strong>Jadwal Shift:</strong> Shift diambil dari pengaturan Jadwal Shift per tanggal. Cocok untuk karyawan dengan jadwal rotasi atau shift bergantian.</li>
                <li>Perubahan mode akan langsung berlaku untuk absensi selanjutnya.</li>
            </ul>
        </div>
    </div>
</div>
@endsection
