@extends('app')

@section('content')
<div class="container-fluid px-4 py-4">
    @if (session('success'))
        <div class="alert alert-success alert-dismissible fade show py-2" role="alert">
            {{ session('success') }}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    @endif

    <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
            <h5 class="mb-0" style="font-weight: 700; font-size: 16px;">Data Shift</h5>
            <small class="text-muted">Master data seluruh shift kerja</small>
        </div>
        <div>
            <button class="btn btn-success btn-sm" data-bs-toggle="modal" data-bs-target="#modalTambahShift">
                <i class="ph ph-plus-circle me-1"></i> Tambah Shift
            </button>
        </div>
    </div>

    <div class="rounded-3">
        <div class="p-3 border-bottom" style="border-bottom-color: #f0f0f0 !important;">
            <div class="d-flex align-items-center justify-content-between">
                <span class="fw-semibold" style="font-size: 13px;"></span>
                <span class="text-muted" style="font-size: 11px;">{{ $shifts->count() }} data</span>
            </div>
        </div>
        <div class="table-responsive">
            <table class="table table-hover text-nowrap mb-0">
                <thead>
                    <tr>
                        <th scope="col">No</th>
                        <th scope="col">Nama Shift</th>
                        <th scope="col">Jam Masuk</th>
                        <th scope="col">Jam Pulang</th>
                        <th scope="col">Total Jam</th>
                        <th scope="col">Toleransi</th>
                        <th scope="col">Status</th>
                        <th scope="col" class="text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($shifts as $index => $shift)
                        <tr>
                            <td>{{ $index + 1 }}</td>
                            <td>
                                <span class="fw-medium" style="font-size: 13px;">{{ $shift->nama_shift }}</span>
                                @if ($shift->kode_shift)
                                    <small class="d-block text-muted">{{ $shift->kode_shift }}</small>
                                @endif
                            </td>
                            <td><span style="font-size: 13px;">{{ \Carbon\Carbon::parse($shift->jam_masuk)->format('H:i') }}</span></td>
                            <td><span style="font-size: 13px;">{{ \Carbon\Carbon::parse($shift->jam_pulang)->format('H:i') }}</span></td>
                            <td><span class="fw-medium">{{ $shift->total_jam ?? '8' }} Jam</span></td>
                            <td><span class="text-muted" style="font-size: 12px;">{{ $shift->toleransi ?? '15' }} Menit</span></td>
                            <td>
                                @if ($shift->status === 'AKTIF')
                                    <span class="badge bg-success fw-normal px-2 py-1 rounded-pill">Aktif</span>
                                @else
                                    <span class="badge bg-light-secondary text-dark fw-normal px-2 py-1 rounded-pill">Nonaktif</span>
                                @endif
                            </td>
                            <td class="text-center">
                                <div class="d-flex gap-1 justify-content-center">
                                    <a href="javascript:void(0)" class="btn btn-sm btn-outline-secondary border-0" title="Edit"
                                        onclick="editShift(
                                            {{ $shift->id }},
                                            '{{ $shift->nama_shift }}',
                                            '{{ $shift->kode_shift }}',
                                            '{{ $shift->jam_masuk }}',
                                            '{{ $shift->jam_pulang }}',
                                            '{{ $shift->total_jam }}',
                                            '{{ $shift->toleransi }}',
                                            '{{ $shift->status }}',
                                            '{{ $shift->keterangan ?? '' }}'
                                        )">
                                        <i class="ph ph-note-pencil"></i>
                                    </a>
                                    <a href="javascript:void(0)" class="btn btn-sm btn-outline-secondary border-0" title="Hapus"
                                        onclick="deleteShift({{ $shift->id }})">
                                        <i class="ph ph-trash"></i>
                                    </a>
                                </div>
                            </td>
                        </tr>
                    @endforeach

                    @if ($shifts->isEmpty())
                        <tr>
                            <td colspan="8" class="text-center text-muted py-4">
                                <i class="ph ph-timer d-block fs-2 mb-2"></i>
                                Data shift belum tersedia
                            </td>
                        </tr>
                    @endif
                </tbody>
            </table>
        </div>
    </div>
</div>

@include('shift.modal')

<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

<script>
function editShift(id, nama_shift, kode_shift, jam_masuk, jam_pulang, total_jam, toleransi, status, keterangan) {
    $('#edit_id').val(id);
    $('#edit_nama_shift').val(nama_shift);
    $('#edit_kode_shift').val(kode_shift);
    $('#edit_jam_masuk').val(jam_masuk);
    $('#edit_jam_pulang').val(jam_pulang);
    $('#edit_total_jam').val(total_jam);
    $('#edit_toleransi').val(toleransi);
    $('#edit_status').val(status);
    $('#edit_keterangan').val(keterangan);
    $('#formEditShift').attr('action', '/shift/' + id);
    $('#modalEditShift').modal('show');
}

function deleteShift(id) {
    Swal.fire({
        title: 'Hapus shift?',
        text: 'Data shift yang dihapus tidak bisa dikembalikan',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: '/shift/' + id,
                type: 'POST',
                data: { _token: '{{ csrf_token() }}', _method: 'DELETE' },
                success: function(res) {
                    Swal.fire({ icon: 'success', title: 'Berhasil', text: res.message || 'Shift berhasil dihapus', timer: 1500, showConfirmButton: false });
                    setTimeout(() => location.reload(), 1500);
                },
                error: function() {
                    Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan saat menghapus data' });
                }
            });
        }
    });
}
</script>
@endsection
