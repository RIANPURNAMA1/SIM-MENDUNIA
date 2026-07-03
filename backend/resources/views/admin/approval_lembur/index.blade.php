@extends('app')

@section('content')
<div class="container-fluid px-4 py-4">
    @if (session('success'))
        <div class="alert alert-success alert-dismissible fade show py-2" role="alert">
            {{ session('success') }}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    @endif

    <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
            <h5 class="mb-0" style="font-weight: 700; font-size: 16px;">Approval Lembur</h5>
            <small class="text-muted">Pengajuan lembur karyawan</small>
        </div>
    </div>

    <div class="rounded-3">
        <div class="p-3 border-bottom" style="border-bottom-color: #f0f0f0 !important;">
            <div class="d-flex align-items-center justify-content-between">
                <span class="fw-semibold" style="font-size: 13px;"></span>
                <span class="text-muted" style="font-size: 11px;">{{ $lembur->count() }} data</span>
            </div>
        </div>
        <div class="table-responsive">
            <table class="table table-hover text-nowrap mb-0">
                <thead>
                    <tr>
                        <th scope="col">No</th>
                        <th scope="col">Karyawan</th>
                        <th scope="col">Tanggal</th>
                        <th scope="col">Keterangan</th>
                        <th scope="col" class="text-center">Bukti</th>
                        <th scope="col" class="text-center">Status</th>
                        <th scope="col" class="text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($lembur as $l)
                        <tr>
                            <td class="text-muted">{{ $loop->iteration }}</td>
                            <td>
                                <span class="fw-medium" style="font-size: 13px;">{{ $l->user->name }}</span>
                                <small class="d-block text-muted">{{ $l->user->divisi->nama_divisi ?? '-' }}</small>
                            </td>
                            <td>
                                <div style="font-size: 12px;">
                                    <div class="fw-medium">{{ $l->created_at->format('d M Y') }}</div>
                                    <div class="text-muted" style="font-size: 11px;">{{ $l->created_at->format('H:i') }} WIB</div>
                                </div>
                            </td>
                            <td style="max-width: 260px; min-width: 180px;">
                                <div style="white-space: pre-wrap; word-break: break-word; line-height: 1.6; font-size: 12px;">
                                    {{ $l->keterangan }}
                                </div>
                            </td>
                            <td class="text-center">
                                <a href="javascript:void(0)" onclick="viewImage('{{ asset('uploads/lembur/' . $l->foto) }}')">
                                    <img src="{{ asset('uploads/lembur/' . $l->foto) }}" class="rounded shadow-sm"
                                        style="width: 30px; height: 30px; object-fit: cover; cursor: pointer;">
                                </a>
                            </td>
                            <td class="text-center">
                                @php
                                    $statusClass = match($l->status) {
                                        'PENDING'  => 'bg-warning-subtle text-warning',
                                        'APPROVED' => 'bg-success-subtle text-success',
                                        default    => 'bg-danger-subtle text-danger',
                                    };
                                @endphp
                                <span class="badge {{ $statusClass }} rounded-pill fw-normal px-2 py-1">
                                    {{ $l->status }}
                                </span>
                            </td>
                            <td class="text-center">
                                @if ($l->status == 'PENDING')
                                    <div class="d-flex gap-1 justify-content-center">
                                        <button class="btn btn-sm btn-dark" onclick="updateStatus('{{ $l->id }}', 'APPROVED')">
                                            <i class="ph ph-check me-1"></i>Setuju
                                        </button>
                                        <button class="btn btn-sm btn-outline-secondary" onclick="updateStatus('{{ $l->id }}', 'REJECTED')">
                                            <i class="ph ph-x me-1"></i>Tolak
                                        </button>
                                    </div>
                                @else
                                    <span class="text-muted" style="font-size: 11px;">Sudah diproses</span>
                                @endif
                            </td>
                        </tr>
                    @endforeach

                    @if ($lembur->isEmpty())
                        <tr>
                            <td colspan="7" class="text-center text-muted py-4">
                                <i class="ph ph-file-text d-block fs-2 mb-2"></i>
                                Belum ada pengajuan lembur
                            </td>
                        </tr>
                    @endif
                </tbody>
            </table>
        </div>
    </div>
</div>

<div class="modal fade" id="modalPreview" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0">
            <div class="modal-body p-0">
                <button type="button" class="btn-close position-absolute top-0 end-0 m-3 bg-white"
                    data-bs-dismiss="modal" aria-label="Close"></button>
                <img id="imgFull" src="" class="w-100 rounded">
            </div>
        </div>
    </div>
</div>

<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script>
    function viewImage(url) {
        $('#imgFull').attr('src', url);
        $('#modalPreview').modal('show');
    }

    function updateStatus(id, status) {
        let color = status === 'APPROVED' ? '#28a745' : '#dc3545';
        let title = status === 'APPROVED' ? 'Setujui Lembur?' : 'Tolak Lembur?';

        Swal.fire({
            title: title,
            text: "Status pengajuan akan segera diperbarui",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: color,
            confirmButtonText: 'Ya, Lanjutkan',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: '/approval-lembur/' + id + '/status',
                    type: 'POST',
                    data: {
                        _token: '{{ csrf_token() }}',
                        status: status
                    },
                    success: function(response) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Berhasil',
                            text: 'Status lembur berhasil diperbarui',
                            timer: 1500,
                            showConfirmButton: false
                        });
                        setTimeout(() => location.reload(), 1500);
                    },
                    error: function() {
                        Swal.fire('Gagal', 'Terjadi kesalahan sistem', 'error');
                    }
                });
            }
        });
    }
</script>
@endsection
