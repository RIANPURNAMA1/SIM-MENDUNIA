@extends('app')

@section('content')
<link rel="stylesheet" href="https://cdn.datatables.net/1.13.8/css/dataTables.bootstrap5.min.css">
<div class="container-fluid px-4 py-4">
    <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
            <h5 class="mb-0" style="font-weight: 700; font-size: 16px;">Jadwal Level</h5>
            <small class="text-muted">Atur tanggal mulai dan selesai setiap level per batch</small>
        </div>
    </div>

    @if ($batches->isEmpty())
    <div class="alert alert-warning">
        <i class="ph ph-warning-circle me-1"></i> Belum ada batch aktif. Silakan tambah batch terlebih dahulu.
    </div>
    @else
    <div class="card">
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-hover table-bordered" id="jadwalTable">
                    <thead>
                        <tr>
                            <th>Batch</th>
                            @foreach ($levels as $lv)
                            <th class="text-center">Level {{ $lv }}</th>
                            @endforeach
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($batches as $batch)
                        <tr>
                            <td>
                                <span class="fw-semibold">{{ $batch->nama_batch }}</span>
                            </td>
                            @foreach ($levels as $lv)
                            @php
                            $key = $batch->id . '-' . $lv;
                            $item = $jadwal->get($key);
                            @endphp
                            <td class="text-center" style="min-width: 220px;">
                                @if ($item)
                                <div class="d-flex align-items-center justify-content-center gap-2 mb-1">
                                    <span class="badge bg-success px-3 py-2">
                                        {{ $item->tanggal_mulai->format('d/m/Y') }} - {{ $item->tanggal_selesai->format('d/m/Y') }}
                                    </span>
                                </div>
                                <div class="d-flex gap-1 justify-content-center">
                                    <button class="btn btn-sm btn-outline-warning edit-jadwal"
                                        data-batch="{{ $batch->id }}"
                                        data-batch-nama="{{ $batch->nama_batch }}"
                                        data-level="{{ $lv }}"
                                        data-mulai="{{ $item->tanggal_mulai->format('Y-m-d') }}"
                                        data-selesai="{{ $item->tanggal_selesai->format('Y-m-d') }}">
                                        <i class="ph ph-pencil-simple"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger hapus-jadwal"
                                        data-batch="{{ $batch->id }}"
                                        data-batch-nama="{{ $batch->nama_batch }}"
                                        data-level="{{ $lv }}">
                                        <i class="ph ph-trash"></i>
                                    </button>
                                </div>
                                @else
                                <button class="btn btn-sm btn-outline-primary tambah-jadwal"
                                    data-batch="{{ $batch->id }}"
                                    data-batch-nama="{{ $batch->nama_batch }}"
                                    data-level="{{ $lv }}">
                                    <i class="ph ph-plus-circle me-1"></i> Atur Tanggal
                                </button>
                                @endif
                            </td>
                            @endforeach
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    @endif
</div>

<!-- Modal Atur Jadwal -->
<div class="modal fade" id="modalJadwalLevel" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <form id="formJadwalLevel">
                @csrf
                <input type="hidden" name="batch_id" id="form_batch_id">
                <input type="hidden" name="level" id="form_level">
                <div class="modal-header">
                    <h6 class="modal-title" id="modalJadwalTitle">Atur Jadwal Level</h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">Batch</label>
                        <input type="text" class="form-control form-control-sm" id="form_batch_nama" readonly>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Level</label>
                        <input type="text" class="form-control form-control-sm" id="form_level_text" readonly>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Tanggal Mulai <span class="text-danger">*</span></label>
                        <input type="date" name="tanggal_mulai" id="form_tanggal_mulai" class="form-control form-control-sm" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Tanggal Selesai <span class="text-danger">*</span></label>
                        <input type="date" name="tanggal_selesai" id="form_tanggal_selesai" class="form-control form-control-sm" required>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Batal</button>
                    <button type="submit" class="btn btn-sm btn-primary">Simpan</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script src="https://cdn.datatables.net/1.13.8/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.datatables.net/1.13.8/js/dataTables.bootstrap5.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script>
$(document).ready(function() {
    $('#jadwalTable').DataTable({
        paging: false,
        ordering: false,
        info: false,
        searching: false,
        language: {
            emptyTable: 'Belum ada data jadwal'
        }
    });

    $(document).on('click', '.tambah-jadwal', function() {
        var btn = $(this);
        $('#form_batch_id').val(btn.data('batch'));
        $('#form_level').val(btn.data('level'));
        $('#form_batch_nama').val(btn.data('batch-nama'));
        $('#form_level_text').val('Level ' + btn.data('level'));
        $('#form_tanggal_mulai').val('');
        $('#form_tanggal_selesai').val('');
        $('#modalJadwalTitle').text('Atur Jadwal - ' + btn.data('batch-nama') + ' Level ' + btn.data('level'));
        $('#modalJadwalLevel').modal('show');
    });

    $(document).on('click', '.edit-jadwal', function() {
        var btn = $(this);
        $('#form_batch_id').val(btn.data('batch'));
        $('#form_level').val(btn.data('level'));
        $('#form_batch_nama').val(btn.data('batch-nama'));
        $('#form_level_text').val('Level ' + btn.data('level'));
        $('#form_tanggal_mulai').val(btn.data('mulai'));
        $('#form_tanggal_selesai').val(btn.data('selesai'));
        $('#modalJadwalTitle').text('Edit Jadwal - ' + btn.data('batch-nama') + ' Level ' + btn.data('level'));
        $('#modalJadwalLevel').modal('show');
    });

    $('#formJadwalLevel').on('submit', function(e) {
        e.preventDefault();
        var form = $(this);
        var data = form.serialize();

        $.ajax({
            url: '{{ route("jadwal-level.store") }}',
            type: 'POST',
            data: data,
            success: function(res) {
                Swal.fire({ icon: 'success', title: 'Berhasil', text: res.message, timer: 1500, showConfirmButton: false });
                $('#modalJadwalLevel').modal('hide');
                setTimeout(() => location.reload(), 1500);
            },
            error: function(xhr) {
                var msg = xhr.responseJSON?.message || 'Gagal menyimpan jadwal';
                Swal.fire({ icon: 'error', title: 'Gagal', text: msg });
            }
        });
    });

    $(document).on('click', '.hapus-jadwal', function() {
        var btn = $(this);
        var batchId = btn.data('batch');
        var level = btn.data('level');
        var batchNama = btn.data('batch-nama');

        Swal.fire({
            title: 'Hapus Jadwal Level ' + level + '?',
            text: 'Jadwal untuk ' + batchNama + ' Level ' + level + ' akan dihapus',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: '/jadwal-level/' + batchId + '/' + level,
                    type: 'DELETE',
                    data: { _token: '{{ csrf_token() }}' },
                    success: function(res) {
                        Swal.fire({ icon: 'success', title: 'Berhasil', text: res.message, timer: 1500, showConfirmButton: false });
                        setTimeout(() => location.reload(), 1500);
                    },
                    error: function(xhr) {
                        var msg = xhr.responseJSON?.message || 'Gagal menghapus jadwal';
                        Swal.fire({ icon: 'error', title: 'Gagal', text: msg });
                    }
                });
            }
        });
    });
});
</script>
@endpush
