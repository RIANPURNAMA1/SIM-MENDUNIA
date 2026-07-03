@extends('app')

@section('content')
<div class="container-fluid px-4 py-4">
    @if (session('success'))
        <div class="alert alert-success alert-dismissible fade show py-2" role="alert">
            {{ session('success') }}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    @endif
    @if (session('error'))
        <div class="alert alert-danger alert-dismissible fade show py-2" role="alert">
            {{ session('error') }}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    @endif

    <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
            <h5 class="mb-0" style="font-weight: 700; font-size: 16px;">Data Divisi</h5>
            <small class="text-muted">Master data seluruh divisi kerja</small>
        </div>
        <div>
            <button class="btn btn-success btn-sm" data-bs-toggle="modal" data-bs-target="#modalTambahDivisi">
                <i class="ph ph-plus-circle me-1"></i> Tambah Divisi
            </button>
        </div>
    </div>

    <div class="rounded-3">
        <div class="p-3 border-bottom" style="border-bottom-color: #f0f0f0 !important;">
            <div class="d-flex align-items-center justify-content-between">
                <span class="fw-semibold" style="font-size: 13px;"></span>
                <span class="text-muted" style="font-size: 11px;">{{ $divisi->count() }} data</span>
            </div>
        </div>
        <div class="table-responsive">
            <table class="table table-hover text-nowrap mb-0">
                <thead>
                    <tr>
                        <th scope="col" width="5%">No</th>
                        <th scope="col" width="15%">Kode</th>
                        <th scope="col">Nama Divisi</th>
                        <th scope="col" width="15%" class="text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($divisi as $d)
                        <tr>
                            <td>{{ $loop->iteration }}</td>
                            <td><span class="badge bg-light-primary text-primary fw-normal px-2 py-1">{{ $d->kode_divisi }}</span></td>
                            <td><span class="fw-medium" style="font-size: 13px;">{{ $d->nama_divisi }}</span></td>
                            <td class="text-center">
                                <div class="d-flex gap-1 justify-content-center">
                                    <a href="javascript:void(0)" class="btn btn-sm btn-outline-secondary border-0" title="Edit"
                                        onclick="editDivisi('{{ $d->id }}', '{{ $d->kode_divisi }}', '{{ $d->nama_divisi }}')">
                                        <i class="ph ph-note-pencil"></i>
                                    </a>
                                    <a href="javascript:void(0)" class="btn btn-sm btn-outline-secondary border-0" title="Hapus"
                                        onclick="deleteDivisi({{ $d->id }})">
                                        <i class="ph ph-trash"></i>
                                    </a>
                                </div>
                            </td>
                        </tr>
                    @endforeach

                    @if ($divisi->isEmpty())
                        <tr>
                            <td colspan="4" class="text-center text-muted py-4">
                                <i class="ph ph-folder-not-found d-block fs-2 mb-2"></i>
                                Data divisi belum tersedia
                            </td>
                        </tr>
                    @endif
                </tbody>
            </table>
        </div>
    </div>
</div>

@include('divisi.modal')

<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

<script>
function editDivisi(id, kode, nama) {
    $('#edit_id').val(id);
    $('#edit_kode_divisi').val(kode);
    $('#edit_nama_divisi').val(nama);
    $('#formEditDivisi').attr('action', '/divisi/' + id);
    $('#modalEditDivisi').modal('show');
}

function deleteDivisi(id) {
    Swal.fire({
        title: 'Hapus divisi?',
        text: 'Data divisi akan dihapus permanen',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: '/divisi/' + id,
                type: 'POST',
                data: { _token: '{{ csrf_token() }}', _method: 'DELETE' },
                success: function(response) {
                    Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Divisi berhasil dihapus', timer: 1500, showConfirmButton: false });
                    setTimeout(() => location.reload(), 1500);
                },
                error: function() {
                    Swal.fire({ icon: 'error', title: 'Gagal', text: 'Divisi gagal dihapus atau masih terikat dengan data karyawan' });
                }
            });
        }
    });
}
</script>
@endsection
