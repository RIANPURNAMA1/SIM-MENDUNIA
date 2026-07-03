@extends('app')

@section('content')
<link rel="stylesheet" href="https://cdn.datatables.net/1.13.8/css/dataTables.bootstrap5.min.css">
<div class="container-fluid px-4 py-4">
    @if (session('success'))
        <div class="alert alert-success alert-dismissible fade show py-2" role="alert">
            {{ session('success') }}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    @endif

    @if (session('error'))
        <div class="alert alert-danger alert-dismissible fade show py-2" role="alert">
            {{ session('error') }}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    @endif

    <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
            <h5 class="mb-0" style="font-weight: 700; font-size: 16px;">Data Pengajuan Izin</h5>
            <small class="text-muted">Approval pengajuan izin karyawan</small>
        </div>
    </div>

    <div class="rounded-3">
        <div class="p-3 border-bottom" style="border-bottom-color: #f0f0f0 !important;">
            <div class="d-flex align-items-center justify-content-between">
                <span class="fw-semibold" style="font-size: 13px;"></span>
                <span class="text-muted" style="font-size: 11px;">{{ $izins->count() }} data</span>
            </div>
        </div>
        <div class="table-responsive">
            <table id="izinTable" class="table table-hover text-nowrap mb-0">
                <thead>
                    <tr>
                        <th scope="col">No</th>
                        <th scope="col">Nama</th>
                        <th scope="col">Jenis Izin</th>
                        <th scope="col">Periode</th>
                        <th scope="col">Alasan</th>
                        <th scope="col" class="text-center">Lampiran</th>
                        <th scope="col" class="text-center">Status</th>
                        <th scope="col" class="text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($izins as $izin)
                        <tr>
                            <td class="text-muted">{{ $loop->iteration }}</td>

                            <td>
                                <span class="fw-medium" style="font-size: 13px;">{{ $izin->user->name }}</span>
                                <small class="d-block text-muted">{{ $izin->user->email }}</small>
                            </td>

                            <td>
                                @php
                                    $jenisColor = match($izin->jenis_izin) {
                                        'SAKIT' => 'bg-light-primary text-primary',
                                        'CUTI'  => 'bg-light-secondary text-dark',
                                        default => 'bg-light text-muted',
                                    };
                                @endphp
                                <span class="badge {{ $jenisColor }} fw-normal px-2 py-1">
                                    {{ $izin->jenis_izin }}
                                </span>
                            </td>

                            <td>
                                @php
                                    $mulai   = \Carbon\Carbon::parse($izin->tgl_mulai);
                                    $selesai = \Carbon\Carbon::parse($izin->tgl_selesai);
                                    $durasi  = $mulai->diffInDays($selesai) + 1;
                                @endphp
                                <div style="font-size: 12px;">
                                    <div class="fw-medium">{{ $mulai->format('d M Y') }}</div>
                                    <div class="text-muted" style="font-size: 11px;">s/d</div>
                                    <div class="fw-medium">{{ $selesai->format('d M Y') }}</div>
                                    <span class="badge bg-light-secondary text-dark fw-normal mt-1">{{ $durasi }} hari</span>
                                </div>
                            </td>

                            <td style="max-width: 260px; min-width: 180px;">
                                <div style="white-space: pre-wrap; word-break: break-word; line-height: 1.6; font-size: 12px;">
                                    {{ $izin->alasan }}
                                </div>
                            </td>

                            <td class="text-center">
                                @if($izin->lampiran)
                                    <a href="{{ asset('uploads/izin/' . $izin->lampiran) }}" target="_blank"
                                       class="btn btn-sm btn-outline-secondary border-0">
                                        <i class="ph ph-paperclip"></i>
                                    </a>
                                @else
                                    <span class="text-muted">—</span>
                                @endif
                            </td>

                            <td class="text-center">
                                @php
                                    $statusClass = match($izin->status) {
                                        'PENDING'  => 'bg-warning-subtle text-warning',
                                        'APPROVED' => 'bg-success-subtle text-success',
                                        default    => 'bg-danger-subtle text-danger',
                                    };
                                @endphp
                                <span class="badge {{ $statusClass }} rounded-pill fw-normal px-2 py-1">
                                    {{ $izin->status }}
                                </span>
                            </td>

                            <td class="text-center">
                                @if ($izin->status == 'PENDING')
                                    <div class="d-flex gap-1 justify-content-center">
                                        <form action="{{ route('izin.approve', $izin->id) }}" method="POST">
                                            @csrf
                                            <button class="btn btn-sm btn-dark">
                                                <i class="ph ph-check me-1"></i>Setuju
                                            </button>
                                        </form>
                                        <button class="btn btn-sm btn-outline-secondary"
                                                data-bs-toggle="modal"
                                                data-bs-target="#rejectModal{{ $izin->id }}">
                                            <i class="ph ph-x me-1"></i>Tolak
                                        </button>
                                    </div>
                                @else
                                    <span class="text-muted" style="font-size: 11px;">Sudah diproses</span>
                                @endif
                            </td>
                        </tr>

                        {{-- Modal Reject --}}
                        <div class="modal fade" id="rejectModal{{ $izin->id }}">
                            <div class="modal-dialog modal-dialog-centered">
                                <div class="modal-content border-0 shadow-lg">
                                    <div class="modal-header border-0 text-white" style="background: linear-gradient(135deg, #2a5298 0%, #1e3c72 100%);">
                                        <h5 class="modal-title text-white fw-bold"><i class="ph ph-x-circle me-2"></i>Tolak Pengajuan</h5>
                                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                                    </div>
                                    <form action="{{ route('izin.reject', $izin->id) }}" method="POST">
                                        @csrf
                                        <div class="modal-body p-4">
                                            <small class="text-muted d-block mb-3">{{ $izin->user->name }} — {{ $izin->jenis_izin }}</small>
                                            <label class="form-label fw-bold">Alasan Penolakan <span class="text-danger">*</span></label>
                                            <textarea name="catatan" class="form-control" rows="4" required
                                                      placeholder="Tulis alasan penolakan secara jelas..."></textarea>
                                        </div>
                                        <div class="modal-footer bg-light border-0">
                                            <button type="button" class="btn btn-outline-secondary px-4" data-bs-dismiss="modal"><i class="ph ph-x me-1"></i> Batal</button>
                                            <button class="btn btn-dark px-4 shadow"><i class="ph ph-x-circle me-1"></i> Tolak Izin</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    @endforeach

                    
                </tbody>
            </table>
        </div>
    </div>
</div>

<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdn.datatables.net/1.13.8/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.datatables.net/1.13.8/js/dataTables.bootstrap5.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script>
$(function () {
    $('#izinTable').DataTable({
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
</script>
@endsection
