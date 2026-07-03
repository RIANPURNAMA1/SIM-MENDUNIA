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
            <h5 class="mb-0" style="font-weight: 700; font-size: 16px;">Pengaturan Penilaian</h5>
            <small class="text-muted">Aktifkan fitur penilaian siswa untuk divisi tertentu</small>
        </div>
    </div>

    <div class="rounded-3">
        <div class="p-3 border-bottom" style="border-bottom-color: #f0f0f0 !important;">
            <div class="d-flex align-items-center justify-content-between">
                <span class="fw-semibold" style="font-size: 13px;">Daftar Divisi</span>
                <span class="text-muted" style="font-size: 11px;">{{ $divisis->count() }} divisi</span>
            </div>
        </div>
        <form action="{{ route('penilaian.settings.update') }}" method="POST">
            @csrf
            <div class="table-responsive">
                <table class="table table-hover text-nowrap mb-0">
                    <thead>
                        <tr>
                            <th scope="col">Divisi</th>
                            <th scope="col" class="text-center">Fitur Penilaian</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($divisis as $divisi)
                            <tr>
                                <td>
                                    <span class="fw-medium" style="font-size: 13px;">{{ $divisi->nama_divisi }}</span>
                                    <br>
                                    <small class="text-muted">{{ $divisi->kode_divisi }}</small>
                                </td>
                                <td class="text-center">
                                    <div class="d-flex align-items-center justify-content-center gap-2">
                                        <div class="form-check form-switch mb-0">
                                            <input class="form-check-input" type="checkbox"
                                                   name="penilaian_aktif[{{ $divisi->id }}]"
                                                   value="1"
                                                   id="switch-{{ $divisi->id }}"
                                                   {{ isset($settings[$divisi->id]) && $settings[$divisi->id] ? 'checked' : '' }}>
                                        </div>
                                        @php
                                            $aktif = isset($settings[$divisi->id]) && $settings[$divisi->id];
                                            $badgeClass = $aktif ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary';
                                            $label = $aktif ? 'AKTIF' : 'NONAKTIF';
                                        @endphp
                                        <span class="badge rounded-pill {{ $badgeClass }} fw-normal px-2 py-1" style="font-size: 10px;">{{ $label }}</span>
                                    </div>
                                </td>
                            </tr>
                        @endforeach
                        @if($divisis->isEmpty())
                            <tr>
                                <td colspan="2" class="text-center text-muted py-4">
                                    <i class="ph ph-buildings d-block fs-2 mb-2"></i>
                                    Belum ada divisi. Tambah divisi terlebih dahulu.
                                </td>
                            </tr>
                        @endif
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
