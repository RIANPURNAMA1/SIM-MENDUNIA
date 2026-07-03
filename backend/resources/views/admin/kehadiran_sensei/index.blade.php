@extends('app')

@section('content')
    <link href="https://cdn.datatables.net/1.13.6/css/dataTables.bootstrap5.min.css" rel="stylesheet">

    <div class="container-fluid">
        {{-- HEADER --}}
        <div class="page-header mb-4">
            <div class="row align-items-center">
                <div class="col-md-3">
                    <h4 class="m-0 text-dark fw-bold">Kehadiran Sensei</h4>
                    <p class="text-muted small mb-0">Rekapitulasi absensi kelas & mentor</p>
                </div>

                <div class="col-md-9">
                    <form method="GET" action="">
                        <div class="row g-2 justify-content-md-end">
                            <div class="col-6 col-md-2">
                                <select name="user_id" id="filterSensei" class="form-select form-select-sm shadow-sm">
                                    <option value="">Semua Sensei</option>
                                    @foreach ($list_sensei as $sensei)
                                        <option value="{{ $sensei->id }}"
                                            {{ $user_id_selected == $sensei->id ? 'selected' : '' }}>
                                            {{ $sensei->name }}
                                        </option>
                                    @endforeach
                                </select>
                            </div>

                            <div class="col-6 col-md-2">
                                <select name="kelas_id" id="filterKelas" class="form-select form-select-sm shadow-sm">
                                    <option value="">Semua Kelas</option>
                                    @foreach($list_kelas as $kelas)
                                        <option value="{{ $kelas->id }}" {{ $kelas_id_selected == $kelas->id ? 'selected' : '' }}>
                                            {{ $kelas->nama_kelas }}
                                        </option>
                                    @endforeach
                                </select>
                            </div>

                            <div class="col-6 col-md-2">
                                <select name="status" class="form-select form-select-sm shadow-sm">
                                    <option value="">Semua Status</option>
                                    <option value="HADIR" {{ $status_selected == 'HADIR' ? 'selected' : '' }}>HADIR</option>
                                    <option value="TERLAMBAT" {{ $status_selected == 'TERLAMBAT' ? 'selected' : '' }}>TERLAMBAT</option>
                                    <option value="PULANG LEBIH AWAL" {{ $status_selected == 'PULANG LEBIH AWAL' ? 'selected' : '' }}>PULANG LEBIH AWAL</option>
                                    <option value="TIDAK ABSEN PULANG" {{ $status_selected == 'TIDAK ABSEN PULANG' ? 'selected' : '' }}>TIDAK ABSEN PULANG</option>
                                </select>
                            </div>

                            <div class="col-6 col-md-2">
                                <input type="date" name="start_date" value="{{ $start_date }}"
                                    class="form-control form-control-sm shadow-sm">
                            </div>
                            <div class="col-6 col-md-2">
                                <input type="date" name="end_date" value="{{ $end_date }}"
                                    class="form-control form-control-sm shadow-sm">
                            </div>

                            <div class="col-12 col-md-1">
                                <button type="submit" class="btn btn-primary btn-sm w-100 shadow-sm">
                                    <i class="ph ph-magnifying-glass"></i>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>


        {{-- REKAP STATISTIK --}}
        <div class="row g-3 mb-4">
            <div class="col-md-2">
                <div class="card border rounded-3 h-100">
                    <div class="card-body text-center py-3">
                        <div class="text-primary fw-bold fs-4">{{ $rekap['total'] }}</div>
                        <div class="text-muted small text-uppercase small">Total</div>
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="card border rounded-3 h-100">
                    <div class="card-body text-center py-3">
                        <div class="text-success fw-bold fs-4">{{ $rekap['hadir'] }}</div>
                        <div class="text-muted small text-uppercase small">Hadir</div>
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="card border rounded-3 h-100">
                    <div class="card-body text-center py-3">
                        <div class="text-danger fw-bold fs-4">{{ $rekap['terlambat'] }}</div>
                        <div class="text-muted small text-uppercase small">Terlambat</div>
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="card border rounded-3 h-100">
                    <div class="card-body text-center py-3">
                        <div class="text-warning fw-bold fs-4">{{ $rekap['pulang_cepat'] }}</div>
                        <div class="text-muted small text-uppercase small">Pulang Cepat</div>
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="card border rounded-3 h-100">
                    <div class="card-body text-center py-3">
                        <div class="text-secondary fw-bold fs-4">{{ $rekap['tidak_absen_pulang'] }}</div>
                        <div class="text-muted small text-uppercase small">Tidak Absen Pulang</div>
                    </div>
                </div>
            </div>
        </div>

        {{-- TABLE BY KELAS --}}
        @forelse($groupedAbsensis as $group)
            <div class="card border rounded-3 mb-4 shadow-sm">
                <div class="card-header border-bottom  py-3">
                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                            <div class="d-flex align-items-center gap-3 mb-2">
                                <h5 class="mb-0 text-dark fw-bold">{{ $group['kelas']->nama_kelas ?? '-' }}</h5>
                                <span class="badge bg-primary">{{ $group['absensis']->count() }} Absen</span>
                                <span class="badge bg-info">{{ $group['total'] ?? 0 }} Total Pertemuan</span>
                            </div>
                            <div class="d-flex gap-3 text-muted small">
                                <span><i class="ph ph-graduation-cap me-1"></i> Level {{ $group['kelas']->level ?? '-' }}</span>
                                <span><i class="ph ph-calendar-range me-1"></i> {{ \Carbon\Carbon::parse($group['kelas']->tanggal_mulai)->format('d M Y') }} - {{ \Carbon\Carbon::parse($group['kelas']->tanggal_selesai)->format('d M Y') }}</span>
                                <span><i class="ph ph-user me-1"></i> {{ $group['kelas']->user->name ?? '-' }}</span>
                            </div>
                        </div>
                        <div class="d-flex gap-3 small">
                            <span class="text-success"><i class="ph ph-check-circle me-1"></i>{{ $group['hadir'] }} Hadir</span>
                            <span class="text-danger"><i class="ph ph-x-circle me-1"></i>{{ $group['terlambat'] }} Terlambat</span>
                            <span class="text-warning"><i class="ph ph-arrow-left me-1"></i>{{ $group['pulang_cepat'] }} Pulang Cepat</span>
                            <span class="text-secondary"><i class="ph ph-minus-circle me-1"></i>{{ $group['tidak_pulang'] }} Tidak Pulang</span>
                        </div>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="table table-hover text-nowrap mb-0">
                        <thead>
                            <tr>
                                <th class="text-center" style="width: 100px;">Pertemuan</th>
                                <th>Tanggal</th>
                                <th>Jam Masuk</th>
                                <th>Jam Pulang</th>
                                <th>Status</th>
                                <th class="text-center" style="width: 80px;">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            @php $totalPertemuan = $group['total'] ?? 0; @endphp
                            @foreach($group['absensis'] as $index => $absen)
                                <tr>
                                    <td class="text-center">
                                        <div class="fw-bold" style="font-size: 13px;">{{ $absen->pertemuan_ke ?? $loop->iteration }}</div>
                                        <div class="small text-muted">dari {{ $totalPertemuan }}</div>
                                    </td>
                                    <td>
                                        <span class="fw-medium" style="font-size: 13px;">{{ \Carbon\Carbon::parse($absen->tanggal)->format('d M Y') }}</span>
                                    </td>
                                    <td>{{ $absen->jam_masuk ?? '-' }}</td>
                                    <td>{{ $absen->jam_keluar ?? '-' }}</td>
                                    <td>
                                        @php
                                            $statusStyle = [
                                                'HADIR' => 'bg-success-subtle text-success',
                                                'TERLAMBAT' => 'bg-danger-subtle text-danger',
                                                'PULANG LEBIH AWAL' => 'bg-warning-subtle text-warning',
                                                'TIDAK ABSEN PULANG' => 'bg-secondary-subtle text-secondary',
                                            ];
                                            $style = $statusStyle[$absen->status] ?? 'bg-light text-muted';
                                        @endphp
                                        <span class="badge rounded-pill {{ $style }} px-2 py-1">{{ $absen->status }}</span>
                                    </td>
                                    <td class="text-center">
                                        <div class="d-flex gap-1 justify-content-center">
                                            <button class="btn btn-sm btn-outline-secondary border-0" onclick="showRiwayat({{ $absen->user_id }}, {{ $absen->kelas_sensei_id }})" title="Riwayat">
                                                <i class="ph ph-clock-counter-clockwise"></i>
                                            </button>
                                            <button class="btn btn-sm btn-outline-secondary border-0" onclick="editStatus({{ $absen->id }}, '{{ $absen->status }}')" title="Edit Status">
                                                <i class="ph ph-pencil"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        @empty
            <div class="card border rounded-3">
                <div class="card-body text-center py-5 text-muted">
                    <i class="ph ph-calendar-x fs-1 opacity-50"></i>
                    <p class="mb-0 mt-2">Belum ada data absensi sensei</p>
                </div>
            </div>
        @endforelse
    </div>

    {{-- MODAL EDIT STATUS --}}
    <div class="modal fade" id="modalEditStatus" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Edit Status Absensi</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <form action="/admin/kehadiran-sensei/update-status" method="POST">
                    @csrf
                    <div class="modal-body">
                        <input type="hidden" name="id" id="editId">
                        <div class="mb-3">
                            <label class="form-label">Status Baru</label>
                            <select name="status" id="editStatus" class="form-select">
                                <option value="HADIR">HADIR</option>
                                <option value="TERLAMBAT">TERLAMBAT</option>
                                <option value="PULANG LEBIH AWAL">PULANG LEBIH AWAL</option>
                                <option value="TIDAK ABSEN PULANG">TIDAK ABSEN PULANG</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="submit" class="btn btn-primary">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    {{-- MODAL RIWAYAT --}}
    <div class="modal fade" id="modalRiwayat" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Riwayat Absensi</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-0">
                    <table class="table table-bordered table-sm mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>#</th>
                                <th>Tanggal</th>
                                <th>Masuk</th>
                                <th>Pulang</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="riwayatBody">
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <script>
        function editStatus(id, status) {
            document.getElementById('editId').value = id;
            document.getElementById('editStatus').value = status;
            new bootstrap.Modal(document.getElementById('modalEditStatus')).show();
        }

        function showRiwayat(userId, kelasId) {
            var groupedData = {!! json_encode($groupedAbsensis) !!};
            var kelasData = groupedData[kelasId];
            var tbody = document.getElementById('riwayatBody');
            tbody.innerHTML = '';

            if (kelasData && kelasData.absensis) {
                kelasData.absensis.forEach(function(absen, index) {
                    var statusClass = absen.status === 'HADIR' ? 'success' : (absen.status === 'TERLAMBAT' ? 'danger' : (absen.status === 'PULANG LEBIH AWAL' ? 'warning' : 'secondary'));
                    tbody.innerHTML += '<tr>' +
                        '<td class="text-center">' + (index + 1) + '</td>' +
                        '<td>' + absen.tanggal + '</td>' +
                        '<td>' + (absen.jam_masuk || '-') + '</td>' +
                        '<td>' + (absen.jam_keluar || '-') + '</td>' +
                        '<td><span class="badge bg-' + statusClass + '">' + absen.status + '</span></td>' +
                    '</tr>';
                });
            }

            new bootstrap.Modal(document.getElementById('modalRiwayat')).show();
        }
    </script>
@endsection
