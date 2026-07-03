@extends('app')

@section('content')
<link rel="stylesheet" href="https://cdn.datatables.net/1.13.8/css/dataTables.bootstrap5.min.css">
<div class="container-fluid px-4 py-4">
    <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
            <h5 class="mb-0" style="font-weight: 700; font-size: 16px;">Data Kehadiran</h5>
            <small class="text-muted">Pantau absensi harian karyawan</small>
        </div>
    </div>

    <form method="GET" action="" class="mb-4">
        <div class="row g-2">
            <div class="col-auto">
                <select name="cabang_id" class="form-select form-select-sm">
                    <option value="">Semua Cabang</option>
                    @foreach ($list_cabang as $c)
                        <option value="{{ $c->id }}" {{ request('cabang_id') == $c->id ? 'selected' : '' }}>{{ $c->nama_cabang }}</option>
                    @endforeach
                </select>
            </div>
            <div class="col-auto">
                <select name="divisi_id" class="form-select form-select-sm">
                    <option value="">Semua Divisi</option>
                    @foreach ($list_divisi as $d)
                        <option value="{{ $d->id }}" {{ request('divisi_id') == $d->id ? 'selected' : '' }}>{{ $d->nama_divisi }}</option>
                    @endforeach
                </select>
            </div>
            <div class="col-auto">
                <select name="status" class="form-select form-select-sm">
                    <option value="">Semua Status</option>
                    @php $statuses = ['HADIR','TERLAMBAT','IZIN','ALPA','PULANG LEBIH AWAL','TIDAK ABSEN PULANG','LIBUR']; @endphp
                    @foreach ($statuses as $s)
                        <option value="{{ $s }}" {{ request('status') == $s ? 'selected' : '' }}>{{ $s }}</option>
                    @endforeach
                </select>
            </div>
            <div class="col-auto">
                <input type="date" name="start_date" value="{{ $start_date }}" class="form-control form-control-sm" style="width: 140px;">
            </div>
            <div class="col-auto">
                <input type="date" name="end_date" value="{{ $end_date }}" class="form-control form-control-sm" style="width: 140px;">
            </div>
            <div class="col-auto">
                <button type="submit" class="btn btn-dark btn-sm"><i class="ph ph-funnel me-1"></i>Filter</button>
            </div>
            <div class="col-auto">
                <a href="{{ url('data-kehadiran') }}" class="btn btn-outline-secondary btn-sm"><i class="ph ph-arrow-counter-clockwise me-1"></i>Reset</a>
            </div>
        </div>
    </form>

    <div class=" rounded-3">
        <div class="p-3 border-bottom" style="border-bottom-color: #f0f0f0 !important;">
            <div class="d-flex align-items-center justify-content-between">
                <span class="fw-semibold" style="font-size: 13px;"></span>
                <small class="text-muted">{{ \Carbon\Carbon::parse($start_date)->translatedFormat('d M') }} — {{ \Carbon\Carbon::parse($end_date)->translatedFormat('d M Y') }} &middot; {{ $absensis->count() }} data</small>
            </div>
        </div>
        <div class="table-responsive">
            <table id="absensiTable" class="table table-hover text-nowrap mb-0">
                <thead>
                    <tr>
                        <th scope="col">Karyawan</th>
                        <th scope="col">Shift</th>
                        <th scope="col" class="text-center">Masuk</th>
                        <th scope="col" class="text-center">Pulang</th>
                        <th scope="col">Jam Masuk</th>
                        <th scope="col">Jam Pulang</th>
                        <th scope="col">Cabang</th>
                        <th scope="col">Status</th>
                        <th scope="col" class="text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($absensis as $a)
                        <tr>
                            <td>
                                <div class="d-flex align-items-center gap-2">
                                    <img src="{{ $a->user->foto_profil && file_exists(public_path('uploads/foto_profil/' . $a->user->foto_profil))
                                        ? asset('uploads/foto_profil/' . $a->user->foto_profil)
                                        : 'https://ui-avatars.com/api/?name=' . urlencode($a->user->name) . '&background=e5e7eb&color=6b7280&size=32' }}"
                                        class="rounded-circle" style="width: 28px; height: 28px; object-fit: cover;">
                                    <div>
                                        <span class="fw-medium" style="font-size: 13px;">{{ $a->user->name }}</span>
                                        <small class="d-block text-muted">{{ $a->user->nip }}</small>
                                    </div>
                                </div>
                            </td>
                            <td class="text-muted">{{ $a->shift->nama_shift ?? '-' }}</td>
                            <td class="text-center">
                                @if ($a->foto_masuk)
                                    <img src="{{ asset('storage/' . $a->foto_masuk) }}" class="rounded" style="width: 30px; height: 30px; object-fit: cover; cursor: pointer;" onclick="window.open(this.src)">
                                @else
                                    <span class="text-muted">—</span>
                                @endif
                            </td>
                            <td class="text-center">
                                @php $fp = $a->foto_pulang ?? $a->foto_keluar; @endphp
                                @if ($fp)
                                    <img src="{{ asset('storage/' . $fp) }}" class="rounded" style="width: 30px; height: 30px; object-fit: cover; cursor: pointer;" onclick="window.open(this.src)">
                                @else
                                    <span class="text-muted">—</span>
                                @endif
                            </td>
                            <td>{{ $a->jam_masuk ? date('H:i', strtotime($a->jam_masuk)) : '-' }}</td>
                            <td>{{ $a->jam_keluar ? date('H:i', strtotime($a->jam_keluar)) : '-' }}</td>
                            <td class="text-muted">{{ $a->cabang->nama_cabang ?? '-' }}</td>
                            <td>
                                @php
                                    $badge = match($a->status) {
                                        'HADIR' => 'bg-success-subtle text-success',
                                        'TERLAMBAT' => 'bg-warning-subtle text-warning',
                                        'IZIN' => 'bg-info-subtle text-info',
                                        'ALPA' => 'bg-danger-subtle text-danger',
                                        'PULANG LEBIH AWAL' => 'bg-warning-subtle text-warning-emphasis',
                                        'TIDAK ABSEN PULANG' => 'bg-purple-subtle text-purple',
                                        'LIBUR' => 'bg-secondary-subtle text-secondary',
                                        default => 'bg-light text-muted',
                                    };
                                @endphp
                                <span class="badge {{ $badge }} rounded-pill fw-normal px-2 py-1">{{ $a->status }}</span>
                            </td>
                            <td class="text-center">
                                <button class="btn btn-sm btn-outline-secondary border-0" onclick="ubahStatus('{{ $a->id }}','{{ $a->status }}')">
                                    <i class="ph ph-pencil-simple"></i>
                                </button>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</div>

<div class="modal fade" id="modalStatus" tabindex="-1">
    <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
            <div class="modal-header border-0 text-white" style="background: linear-gradient(135deg, #2a5298 0%, #1e3c72 100%);">
                <h5 class="modal-title text-white fw-bold"><i class="ph ph-pencil-simple me-2"></i>Ubah Status</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <form method="POST" action="{{ route('admin.absensi.updateStatus') }}">
                @csrf
                <input type="hidden" name="id" id="status_id">
                <div class="modal-body p-4">
                    <label class="form-label fw-bold">Status Absensi <span class="text-danger">*</span></label>
                    <select name="status" id="status_value" class="form-select" required>
                        <option value="HADIR">HADIR</option>
                        <option value="TERLAMBAT">TERLAMBAT</option>
                        <option value="IZIN">IZIN</option>
                        <option value="ALPA">ALPA</option>
                        <option value="PULANG LEBIH AWAL">PULANG LEBIH AWAL</option>
                        <option value="TIDAK ABSEN PULANG">TIDAK ABSEN PULANG</option>
                        <option value="LIBUR">LIBUR</option>
                    </select>
                </div>
                <div class="modal-footer bg-light border-0">
                    <button type="button" class="btn btn-outline-secondary px-3" data-bs-dismiss="modal">Batal</button>
                    <button class="btn btn-dark px-3 shadow"><i class="ph ph-floppy-disk me-1"></i> Simpan</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdn.datatables.net/1.13.8/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.datatables.net/1.13.8/js/dataTables.bootstrap5.min.js"></script>
<script>
$(function () {
    $('#absensiTable').DataTable({
        responsive: true,
        autoWidth: false,
        pageLength: 10,
        lengthMenu: [10, 25, 50, 100],
        order: [[0, 'asc']],
        language: {
            search: "Cari:",
            lengthMenu: "Tampilkan _MENU_ data",
            info: "Menampilkan _START_–_END_ dari _TOTAL_ data",
            zeroRecords: "Data tidak ditemukan",
            paginate: { first: "Awal", last: "Akhir", next: "›", previous: "‹" }
        }
    });
});

function ubahStatus(id, status) {
    document.getElementById('status_id').value = id;
    document.getElementById('status_value').value = status;
    new bootstrap.Modal(document.getElementById('modalStatus')).show();
}
</script>
@endsection