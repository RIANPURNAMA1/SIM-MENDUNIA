@extends('app')

@section('content')
    <div class="container-fluid">

        <div class="mb-3 d-flex justify-content-between align-items-center">
            <a href="{{ route('karyawan.index') }}" class="btn btn-secondary btn-sm">
                ← Kembali
            </a>
            <span class="badge bg-primary">ID Karyawan: #{{ $karyawan->id }}</span>
        </div>

        <div class="card shadow-sm">
            <div class="card-header bg-white">
                <h5 class="mb-0">Detail Profil Karyawan</h5>
            </div>

            <div class="card-body">
                <div class="row g-4">

                    <div class="col-md-3 text-center border-end">
                        <img src="{{ $karyawan->foto_profil
                            ? asset('uploads/foto_profil/' . $karyawan->foto_profil)
                            : asset('assets/images/avatar/avatar-1.jpg') }}"
                            class="rounded-3 mb-3 shadow-sm" width="200" height="250" style="object-fit: cover; border: 5px solid #f8f9fa;">

                        <h5 class="mb-0 text-primary">{{ $karyawan->name }}</h5>
                        <p class="text-muted fw-bold">{{ $karyawan->jabatan }}</p>
                        <hr>
                        <div class="text-start ps-3">
                            <small class="text-muted d-block">Shift Kerja:</small>
                            @if(isset($shifts) && $shifts->count() > 0)
                                @foreach($shifts as $shift)
                                    <span class="badge bg-primary">{{ $shift->nama_shift }}</span>
                                @endforeach
                            @else
                                <span class="text-muted">-</span>
                            @endif
                        </div>
                    </div>

                    <div class="col-md-9">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <tr>
                                    <th width="30%" class="bg-light">NIK (No. KTP)</th>
                                    <td><strong class="text-dark">{{ $karyawan->nik ?? '-' }}</strong></td>
                                </tr>
                                <tr>
                                    <th class="bg-light">NIP</th>
                                    <td>{{ $karyawan->nip ?? '-' }}</td>
                                </tr>
                                <tr>
                                    <th class="bg-light">Pendidikan Terakhir</th>
                                    <td><span class="badge bg-info text-dark">{{ $karyawan->pendidikan_terakhir ?? '-' }}</span></td>
                                </tr>
                                <tr>
                                    <th class="bg-light">Divisi</th>
                                    <td>{{ $karyawan->divisi->nama_divisi ?? '-' }}</td>
                                </tr>
                                <tr>
                                    <th class="bg-light">Cabang</th>
                                    <td>{{ $karyawan->cabang->pluck('nama_cabang')->implode(', ') ?: '-' }}</td>
                                </tr>
                                <tr>
                                    <th class="bg-light">No HP / WhatsApp</th>
                                    <td>
                                        @if($karyawan->no_hp)
                                            <a href="https://wa.me/{{ preg_replace('/[^0-9]/', '', $karyawan->no_hp) }}" target="_blank" class="text-decoration-none">
                                                {{ $karyawan->no_hp }} <i class="ph ph-whatsapp-logo text-success"></i>
                                            </a>
                                        @else
                                            -
                                        @endif
                                    </td>
                                </tr>
                                <tr>
                                    <th class="bg-light">Email Perusahaan</th>
                                    <td>{{ $karyawan->email ?? '-' }}</td>
                                </tr>
                                <tr>
                                    <th class="bg-light">Tempat, Tanggal Lahir</th>
                                    <td>{{ $karyawan->tempat_lahir ?? '-' }},
                                        {{ $karyawan->tanggal_lahir ? \Carbon\Carbon::parse($karyawan->tanggal_lahir)->translatedFormat('d F Y') : '-' }}
                                    </td>
                                </tr>
                                <tr>
                                    <th class="bg-light">Jenis Kelamin</th>
                                    <td>{{ $karyawan->jenis_kelamin == 'L' ? 'Laki-laki' : ($karyawan->jenis_kelamin == 'P' ? 'Perempuan' : '-') }}</td>
                                </tr>
                                <tr>
                                    <th class="bg-light">Agama</th>
                                    <td>{{ $karyawan->agama ?? '-' }}</td>
                                </tr>
                                <tr>
                                    <th class="bg-light">Status Pernikahan</th>
                                    <td>{{ str_replace('_', ' ', $karyawan->status_pernikahan) ?? '-' }}</td>
                                </tr>
                                <tr>
                                    <th class="bg-light">Tanggal Masuk</th>
                                    <td>{{ $karyawan->tanggal_masuk ? \Carbon\Carbon::parse($karyawan->tanggal_masuk)->translatedFormat('d F Y') : '-' }}</td>
                                </tr>
                                <tr>
                                    <th class="bg-light">Status Kerja</th>
                                    <td>
                                        <span class="badge {{ $karyawan->status_kerja == 'TETAP' ? 'bg-success' : ($karyawan->status_kerja == 'KONTRAK' ? 'bg-warning text-dark' : 'bg-info') }}">
                                            {{ $karyawan->status_kerja ?? '-' }}
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <th class="bg-light">Alamat Lengkap</th>
                                    <td>{{ $karyawan->alamat ?? '-' }}</td>
                                </tr>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>

        <div class="row mt-4">
            <div class="col-md-6">
                <div class="card shadow-sm h-100">
                    <div class="card-header bg-white">
                        <h6 class="mb-0"><i class="ph ph-file-text me-2"></i>Berkas & Dokumen</h6>
                    </div>
                    <div class="card-body p-0">
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Foto KTP
                                {!! $karyawan->foto_ktp ? '<a href="'.asset('uploads/foto_ktp/'.$karyawan->foto_ktp).'" target="_blank" class="btn btn-xs btn-outline-primary">Lihat</a>' : '<span class="text-muted small">Tidak ada</span>' !!}
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Foto Ijazah
                                {!! $karyawan->foto_ijazah ? '<a href="'.asset('uploads/foto_ijazah/'.$karyawan->foto_ijazah).'" target="_blank" class="btn btn-xs btn-outline-primary">Lihat</a>' : '<span class="text-muted small">Tidak ada</span>' !!}
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Foto KK
                                {!! $karyawan->foto_kk ? '<a href="'.asset('uploads/foto_kk/'.$karyawan->foto_kk).'" target="_blank" class="btn btn-xs btn-outline-primary">Lihat</a>' : '<span class="text-muted small">Tidak ada</span>' !!}
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Curriculum Vitae (CV)
                                {!! $karyawan->cv_file ? '<a href="'.asset('uploads/cv_file/'.$karyawan->cv_file).'" target="_blank" class="btn btn-xs btn-outline-primary">Lihat</a>' : '<span class="text-muted small">Tidak ada</span>' !!}
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Sertifikat Lainnya
                                {!! $karyawan->sertifikat_file ? '<a href="'.asset('uploads/sertifikat_file/'.$karyawan->sertifikat_file).'" target="_blank" class="btn btn-xs btn-outline-primary">Lihat</a>' : '<span class="text-muted small">Tidak ada</span>' !!}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="col-md-6">
                <div class="card shadow-sm h-100">
                    <div class="card-header bg-white">
                        <h6 class="mb-0"><i class="ph ph-user-circle me-2"></i>Informasi Akun</h6>
                    </div>
                    <div class="card-body">
                        <table class="table table-sm">
                            <tr>
                                <th class="border-0">Email Login</th>
                                <td class="border-0">: {{ $karyawan->email }}</td>
                            </tr>
                            <tr>
                                <th class="border-0">Role Akses</th>
                                <td class="border-0">: <span class="badge bg-secondary">{{ $karyawan->role }}</span></td>
                            </tr>
                            <tr>
                                <th class="border-0">Status Akun</th>
                                <td class="border-0">: 
                                    <span class="badge {{ $karyawan->status == 'AKTIF' ? 'bg-success' : 'bg-danger' }}">
                                        {{ $karyawan->status }}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <th class="border-0">Terakhir Login</th>
                                <td class="border-0">: {{ $karyawan->last_login ? \Carbon\Carbon::parse($karyawan->last_login)->format('d M Y H:i') : 'Belum pernah login' }}</td>
                            </tr>
                        </table>
                        <div class="alert alert-info py-2 mt-2 mb-0" style="font-size: 0.8rem;">
                            <i class="ph ph-info me-1"></i> Password default karyawan adalah <code>12345678</code>.
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
@endsection