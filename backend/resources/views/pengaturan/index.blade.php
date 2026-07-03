@extends('app')

@section('content')
<div class="container-fluid px-4 py-4">
    @if(session('success'))
        <div class="alert alert-success alert-dismissible fade show py-2" role="alert">
            {{ session('success') }}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    @endif

    <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
            <h5 class="mb-0" style="font-weight: 700; font-size: 16px;">Pengaturan Notifikasi WhatsApp</h5>
            <small class="text-muted">Kelola notifikasi WhatsApp untuk absensi karyawan</small>
        </div>
    </div>

    <div class="rounded-3 ">
        <div class="p-3 border-bottom" style="border-bottom-color: #f0f0f0 !important;">
            <div class="d-flex align-items-center justify-content-between">
                <span class="fw-semibold" style="font-size: 13px;">Daftar Notifikasi</span>
                <span class="text-muted" style="font-size: 11px;">{{ $settings->count() }} pengaturan</span>
            </div>
        </div>
        <form action="{{ route('pengaturan-wa.update') }}" method="POST">
            @csrf
            <div class="table-responsive">
                <table class="table table-hover text-nowrap mb-0">
                    <thead>
                        <tr>
                            <th scope="col">Jenis Notifikasi</th>
                            <th scope="col">Deskripsi</th>
                            <th scope="col" class="text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($settings as $setting)
                            <tr>
                                <td>
                                    <span class="fw-medium" style="font-size: 13px;">{{ strtoupper(str_replace('_', ' ', $setting->key)) }}</span>
                                </td>
                                <td style="font-size: 13px;">{{ $setting->description }}</td>
                                <td class="text-center">
                                    <div class="d-flex align-items-center justify-content-center gap-2">
                                        <div class="form-check form-switch mb-0">
                                            <input class="form-check-input" type="checkbox" 
                                                   name="settings[{{ $setting->key }}]" 
                                                   value="1" 
                                                   id="switch-{{ $loop->index }}"
                                                   {{ $setting->is_enabled ? 'checked' : '' }}>
                                        </div>
                                        @php
                                            $badgeClass = $setting->is_enabled ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary';
                                            $label = $setting->is_enabled ? 'AKTIF' : 'NONAKTIF';
                                        @endphp
                                        <span class="badge rounded-pill {{ $badgeClass }} fw-normal px-2 py-1" style="font-size: 10px;">{{ $label }}</span>
                                    </div>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
            <div class="p-3 border-top">
                <button type="submit" class="btn btn-primary btn-sm px-4">
                    <i class="ph ph-floppy-disk me-1"></i> Simpan Pengaturan
                </button>
            </div>
        </form>
    </div>
</div>
@endsection
