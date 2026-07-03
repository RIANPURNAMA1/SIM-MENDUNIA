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
            <h5 class="mb-0" style="font-weight: 700; font-size: 16px;">Data Akun Admin</h5>
            <small class="text-muted">Manajemen akun HR & Manager</small>
        </div>
        <div>
            <button class="btn btn-success btn-sm" data-bs-toggle="modal" data-bs-target="#modalTambahAdmin">
                <i class="ph ph-plus-circle me-1"></i> Tambah Akun
            </button>
        </div>
    </div>

    <div class="rounded-3">
        <div class="p-3 border-bottom" style="border-bottom-color: #f0f0f0 !important;">
            <div class="d-flex align-items-center justify-content-between">
                <span class="fw-semibold" style="font-size: 13px;"></span>
                <span class="text-muted" style="font-size: 11px;">{{ $admins->count() }} data</span>
            </div>
        </div>
        <div class="table-responsive">
            <table class="table table-hover text-nowrap mb-0">
                <thead>
                    <tr>
                        <th scope="col">No</th>
                        <th scope="col">Nama & Email</th>
                        <th scope="col">Role</th>
                        <th scope="col">Status</th>
                        <th scope="col" class="text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($admins as $admin)
                    <tr>
                        <td>{{ $loop->iteration }}</td>
                        <td>
                            <span class="fw-medium" style="font-size: 13px;">{{ $admin->name }}</span><br>
                            <small class="text-muted">{{ $admin->email }}</small>
                        </td>
                        <td>
                            <span class="badge {{ $admin->role == 'MANAGER' ? 'bg-dark' : 'bg-light-secondary text-dark' }} fw-normal px-2 py-1">
                                {{ $admin->role }}
                            </span>
                        </td>
                        <td>
                            <span class="badge {{ $admin->status == 'AKTIF' ? 'bg-success' : 'bg-light-secondary text-dark' }} fw-normal px-2 py-1 rounded-pill">
                                {{ $admin->status }}
                            </span>
                        </td>
                        <td class="text-center">
                            <div class="d-flex gap-1 justify-content-center">
                                <a href="javascript:void(0)" class="btn btn-sm btn-outline-secondary border-0" title="Edit"
                                    onclick="editAdmin({{ $admin }})">
                                    <i class="ph ph-note-pencil"></i>
                                </a>
                                <a href="javascript:void(0)" class="btn btn-sm btn-outline-secondary border-0" title="Hapus"
                                    onclick="deleteAdmin({{ $admin->id }})">
                                    <i class="ph ph-trash"></i>
                                </a>
                            </div>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</div>

@include('pengaturan.user.modal')
@include('pengaturan.user.edit')

<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

<script>
function editAdmin(data) {
    $('#edit_id').val(data.id);
    $('#edit_name').val(data.name);
    $('#edit_email').val(data.email);
    $('#edit_role').val(data.role);
    $('#edit_status').val(data.status);

    let url = "{{ route('pengaturan.update', ':id') }}";
    url = url.replace(':id', data.id);
    $('#formEditAdmin').attr('action', url);

    $('#modalEditAdmin').modal('show');
}

function deleteAdmin(id) {
    Swal.fire({
        title: 'Hapus akun?',
        text: 'Akses login orang ini akan dicabut sepenuhnya',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: '/pengaturan/users/' + id,
                type: 'POST',
                data: { _token: '{{ csrf_token() }}', _method: 'DELETE' },
                success: function() { location.reload(); }
            });
        }
    });
}
</script>
@endsection
