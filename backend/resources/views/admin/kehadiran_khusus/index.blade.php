@extends('app')

@section('content')
<link rel="stylesheet" href="https://cdn.datatables.net/1.13.8/css/dataTables.bootstrap5.min.css">
<div class="container-fluid px-4 py-4">
    <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
            <h5 class="mb-0" style="font-weight: 700; font-size: 16px;">Kehadiran Khusus</h5>
            <small class="text-muted">Pantau absen khusus karyawan (timer)</small>
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
                    @php $statuses = ['BERJALAN','DITUNDA','SELESAI']; @endphp
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
                <a href="{{ url('data-kehadiran-khusus') }}" class="btn btn-outline-secondary btn-sm"><i class="ph ph-arrow-counter-clockwise me-1"></i>Reset</a>
            </div>
        </div>
    </form>

    @if (session('success'))
        <div class="alert alert-success alert-dismissible fade show py-2" role="alert">
            {{ session('success') }}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    @endif

    <div class="rounded-3">
        <div class="p-3 border-bottom" style="border-bottom-color: #f0f0f0 !important;">
            <div class="d-flex align-items-center justify-content-between">
                <span class="fw-semibold" style="font-size: 13px;"></span>
                <small class="text-muted">{{ \Carbon\Carbon::parse($start_date)->translatedFormat('d M') }} — {{ \Carbon\Carbon::parse($end_date)->translatedFormat('d M Y') }} &middot; {{ $data->count() }} data</small>
            </div>
        </div>
        <div class="table-responsive">
            <table id="khususTable" class="table table-hover text-nowrap mb-0">
                <thead>
                    <tr>
                        <th scope="col">Karyawan</th>
                        <th scope="col">Tanggal</th>
                        <th scope="col" class="text-center">Foto Masuk</th>
                        <th scope="col" class="text-center">Foto Keluar</th>
                        <th scope="col">Jam Masuk</th>
                        <th scope="col">Jam Keluar</th>
                        <th scope="col">Durasi</th>
                        <th scope="col">Status</th>
                        <th scope="col" class="text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($data as $d)
                        <tr>
                            <td>
                                <div class="d-flex align-items-center gap-2">
                                    <img src="{{ $d->user->foto_profil && file_exists(public_path('uploads/foto_profil/' . $d->user->foto_profil))
                                        ? asset('uploads/foto_profil/' . $d->user->foto_profil)
                                        : 'https://ui-avatars.com/api/?name=' . urlencode($d->user->name) . '&background=e5e7eb&color=6b7280&size=32' }}"
                                        class="rounded-circle" style="width: 28px; height: 28px; object-fit: cover;">
                                    <div>
                                        <span class="fw-medium" style="font-size: 13px;">{{ $d->user->name }}</span>
                                        <small class="d-block text-muted">{{ $d->user->nip }}</small>
                                    </div>
                                </div>
                            </td>
                            <td>{{ $d->tanggal->format('d/m/Y') }}</td>
                            <td class="text-center">
                                @if ($d->foto_masuk)
                                    <img src="{{ asset('storage/' . $d->foto_masuk) }}" class="rounded" style="width: 30px; height: 30px; object-fit: cover; cursor: pointer;" onclick="window.open(this.src)">
                                @else
                                    <span class="text-muted">—</span>
                                @endif
                            </td>
                            <td class="text-center">
                                @if ($d->foto_keluar)
                                    <img src="{{ asset('storage/' . $d->foto_keluar) }}" class="rounded" style="width: 30px; height: 30px; object-fit: cover; cursor: pointer;" onclick="window.open(this.src)">
                                @else
                                    <span class="text-muted">—</span>
                                @endif
                            </td>
                            <td>{{ $d->jam_masuk ? $d->jam_masuk->format('H:i') : '-' }}</td>
                            <td>{{ $d->jam_keluar ? $d->jam_keluar->format('H:i') : '-' }}</td>
                            <td>
                                @php
                                    $detik = $d->total_detik;
                                    $jam = floor($detik / 3600);
                                    $menit = floor(($detik % 3600) / 60);
                                    $det = $detik % 60;
                                @endphp
                                <span class="fw-medium">{{ sprintf('%02d:%02d:%02d', $jam, $menit, $det) }}</span>
                            </td>
                            <td>
                                @php
                                    $badge = match($d->status) {
                                        'BERJALAN' => 'bg-primary-subtle text-primary',
                                        'DITUNDA' => 'bg-warning-subtle text-warning',
                                        'SELESAI' => 'bg-success-subtle text-success',
                                        default => 'bg-light text-muted',
                                    };
                                @endphp
                                <span class="badge {{ $badge }} rounded-pill fw-normal px-2 py-1">{{ $d->status }}</span>
                            </td>
                            <td class="text-center">
                                <button class="btn btn-sm btn-outline-secondary border-0" onclick="ubahStatus('{{ $d->id }}','{{ $d->status }}')">
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
            <form method="POST" action="{{ url('admin/kehadiran-khusus/update-status') }}">
                @csrf
                <input type="hidden" name="id" id="status_id">
                <div class="modal-body p-4">
                    <label class="form-label fw-bold">Status <span class="text-danger">*</span></label>
                    <select name="status" id="status_value" class="form-select" required>
                        <option value="BERJALAN">BERJALAN</option>
                        <option value="DITUNDA">DITUNDA</option>
                        <option value="SELESAI">SELESAI</option>
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
    $('#khususTable').DataTable({
        responsive: true,
        autoWidth: false,
        pageLength: 10,
        lengthMenu: [10, 25, 50, 100],
        order: [[1, 'desc']],
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
