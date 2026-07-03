@extends('app')

@section('content')
<link rel="stylesheet" href="https://cdn.datatables.net/1.13.8/css/dataTables.bootstrap5.min.css">
<div class="container-fluid px-4 py-4">
    <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
            <h5 class="mb-0" style="font-weight: 700; font-size: 16px;">Data Kelas</h5>
            <small class="text-muted">Master data kelas untuk siswa</small>
        </div>
        <div class="d-flex gap-2">
            <button class="btn btn-success btn-sm" data-bs-toggle="modal" data-bs-target="#modalTambahKelas">
                <i class="ph ph-plus-circle me-1"></i> Tambah Kelas
            </button>
        </div>
    </div>

    <div class="rounded-3">
        <div class="p-3 border-bottom" style="border-bottom-color: #f0f0f0 !important;">
            <div class="d-flex align-items-center justify-content-between">
                <span class="fw-semibold" style="font-size: 13px;"></span>
                <span class="text-muted" style="font-size: 11px;">{{ $kelas->count() }} data</span>
            </div>
        </div>
        <div class="table-responsive">
            <table id="kelasTable" class="table table-hover text-nowrap mb-0">
                <thead>
                    <tr>
                        <th scope="col" width="5%">No</th>
                        <th scope="col">Nama Kelas</th>
                        <th scope="col" width="10%" class="text-center">Status</th>
                        <th scope="col" width="10%" class="text-center">Jumlah Siswa</th>
                        <th scope="col" width="15%" class="text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($kelas as $k)
                        <tr>
                            <td>{{ $loop->iteration }}</td>
                            <td>
                                <span class="fw-medium" style="font-size: 13px;">{{ $k->nama_kelas }}</span>
                            </td>
                            <td class="text-center">
                                @if ($k->status === 'AKTIF')
                                    <span class="badge bg-success">AKTIF</span>
                                @else
                                    <span class="badge bg-secondary">NONAKTIF</span>
                                @endif
                            </td>
                            <td class="text-center">
                                <span class="badge bg-info">{{ $k->siswas()->count() }}</span>
                            </td>
                            <td class="text-center">
                                <div class="d-flex gap-1 justify-content-center">
                                    <button class="btn btn-sm btn-outline-warning edit-kelas"
                                        data-id="{{ $k->id }}"
                                        data-nama="{{ $k->nama_kelas }}">
                                        <i class="ph ph-pencil-simple"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger hapus-kelas"
                                        data-id="{{ $k->id }}"
                                        data-nama="{{ $k->nama_kelas }}">
                                        <i class="ph ph-trash"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-secondary toggle-status-kelas"
                                        data-id="{{ $k->id }}"
                                        data-nama="{{ $k->nama_kelas }}"
                                        data-status="{{ $k->status }}">
                                        <i class="ph ph-toggle"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Modal Tambah -->
<div class="modal fade" id="modalTambahKelas" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <form id="formTambahKelas">
                @csrf
                <div class="modal-header">
                    <h6 class="modal-title">Tambah Kelas</h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">Nama Kelas <span class="text-danger">*</span></label>
                        <input type="text" name="nama_kelas" class="form-control form-control-sm" placeholder="Contoh: XII IPA 1" required>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Batal</button>
                    <button type="submit" class="btn btn-sm btn-success">Simpan</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Modal Edit -->
<div class="modal fade" id="modalEditKelas" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <form id="formEditKelas">
                @csrf
                @method('PUT')
                <input type="hidden" name="id" id="edit_id">
                <div class="modal-header">
                    <h6 class="modal-title">Edit Kelas</h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">Nama Kelas <span class="text-danger">*</span></label>
                        <input type="text" name="nama_kelas" id="edit_nama_kelas" class="form-control form-control-sm" required>
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
    $('#kelasTable').DataTable({
        paging: true,
        pageLength: 25,
        ordering: true,
        info: false,
        searching: true,
        lengthChange: false,
        columnDefs: [{ orderable: false, targets: [4] }],
        language: {
            emptyTable: 'Belum ada data kelas'
        }
    });

    $('#formTambahKelas').on('submit', function(e) {
        e.preventDefault();
        $.ajax({
            url: '{{ route("kelas.store") }}',
            type: 'POST',
            data: $(this).serialize(),
            success: function(res) {
                Swal.fire({ icon: 'success', title: 'Berhasil', text: res.message, timer: 1500, showConfirmButton: false });
                $('#modalTambahKelas').modal('hide');
                setTimeout(() => location.reload(), 1500);
            },
            error: function(xhr) {
                var msg = xhr.responseJSON?.message || 'Gagal menyimpan data';
                Swal.fire({ icon: 'error', title: 'Gagal', text: msg });
            }
        });
    });

    $(document).on('click', '.edit-kelas', function() {
        var btn = $(this);
        $('#edit_id').val(btn.data('id'));
        $('#edit_nama_kelas').val(btn.data('nama'));
        $('#modalEditKelas').modal('show');
    });

    $('#formEditKelas').on('submit', function(e) {
        e.preventDefault();
        var id = $('#edit_id').val();
        $.ajax({
            url: '/kelas/' + id,
            type: 'POST',
            data: $(this).serialize() + '&_method=PUT',
            success: function(res) {
                Swal.fire({ icon: 'success', title: 'Berhasil', text: res.message, timer: 1500, showConfirmButton: false });
                $('#modalEditKelas').modal('hide');
                setTimeout(() => location.reload(), 1500);
            },
            error: function(xhr) {
                var msg = xhr.responseJSON?.message || 'Gagal mengupdate data';
                Swal.fire({ icon: 'error', title: 'Gagal', text: msg });
            }
        });
    });

    $(document).on('click', '.hapus-kelas', function() {
        var id = $(this).data('id');
        var nama = $(this).data('nama');
        Swal.fire({
            title: 'Hapus ' + nama + '?',
            text: 'Data kelas akan dihapus permanen',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: '/kelas/' + id,
                    type: 'DELETE',
                    data: { _token: '{{ csrf_token() }}' },
                    success: function(res) {
                        Swal.fire({ icon: 'success', title: 'Berhasil', text: res.message, timer: 1500, showConfirmButton: false });
                        setTimeout(() => location.reload(), 1500);
                    },
                    error: function(xhr) {
                        var msg = xhr.responseJSON?.message || 'Gagal menghapus kelas';
                        Swal.fire({ icon: 'error', title: 'Gagal', text: msg });
                    }
                });
            }
        });
    });

    $(document).on('click', '.toggle-status-kelas', function() {
        var id = $(this).data('id');
        var nama = $(this).data('nama');
        var status = $(this).data('status');
        var newStatus = status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
        Swal.fire({
            title: 'Ubah status ' + nama + '?',
            text: 'Status akan menjadi ' + newStatus,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, ubah!',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: '/kelas/' + id + '/toggle-status',
                    type: 'POST',
                    data: { _token: '{{ csrf_token() }}' },
                    success: function(res) {
                        Swal.fire({ icon: 'success', title: 'Berhasil', text: res.message, timer: 1500, showConfirmButton: false });
                        setTimeout(() => location.reload(), 1500);
                    }
                });
            }
        });
    });
});
</script>
@endpush
