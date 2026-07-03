@extends('app')

@section('content')
<div class="container-fluid px-4 py-4">
    <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
            <h5 class="mb-0" style="font-weight: 700; font-size: 16px;">Data Sensei</h5>
            <small class="text-muted">Kelola data sensei dari pengguna yang terdaftar</small>
        </div>
        <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#modalTambahGuru">
            <i class="ph ph-plus-circle me-1"></i> Tambah Sensei
        </button>
    </div>

    <div class="table-responsive">
        <table class="table table-hover align-middle">
            <thead>
                <tr>
                    <th>Nama</th>
                    <th>NIP</th>
                    <th>Mata Pelajaran</th>
                    <th>No. HP</th>
                    <th>Status</th>
                    <th class="text-center">Aksi</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($gurus as $g)
                <tr>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <img src="{{ $g->user->foto_profil && file_exists(public_path('uploads/profil/' . $g->user->foto_profil))
                                ? asset('uploads/profil/' . $g->user->foto_profil)
                                : 'https://ui-avatars.com/api/?name=' . urlencode($g->nama) . '&background=e5e7eb&color=6b7280&size=32' }}"
                                class="rounded-circle" style="width: 28px; height: 28px; object-fit: cover;">
                            <span class="fw-medium" style="font-size: 13px;">{{ $g->nama }}</span>
                        </div>
                    </td>
                    <td>{{ $g->nip ?? '-' }}</td>
                    <td>{{ $g->mata_pelajaran ?? '-' }}</td>
                    <td>{{ $g->no_hp ?? '-' }}</td>
                    <td>
                        @if ($g->status === 'AKTIF')
                            <span class="badge bg-success">AKTIF</span>
                        @else
                            <span class="badge bg-danger">NONAKTIF</span>
                        @endif
                    </td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-danger hapus-guru" data-id="{{ $g->id }}" data-nama="{{ $g->nama }}">
                            <i class="ph ph-trash"></i>
                        </button>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">Belum ada data sensei</td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

<!-- Modal Tambah Sensei -->
<div class="modal fade" id="modalTambahGuru" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <form id="formTambahGuru">
                @csrf
                <div class="modal-header">
                    <h6 class="modal-title">Tambah Sensei dari Pengguna</h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p class="text-muted small mb-3">Centang pengguna yang ingin dijadikan sensei:</p>
                    <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                        <table class="table table-sm table-hover">
                            <thead>
                                <tr>
                                    <th style="width: 40px;">
                                        <input type="checkbox" id="checkAll">
                                    </th>
                                    <th>Nama</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach ($users as $u)
                                <tr>
                                    <td>
                                        <input type="checkbox" name="user_ids[]" value="{{ $u->id }}" class="user-checkbox"
                                            {{ $gurus->pluck('user_id')->contains($u->id) ? 'disabled' : '' }}>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center gap-2">
                                            <img src="{{ $u->foto_profil && file_exists(public_path('uploads/profil/' . $u->foto_profil))
                                                ? asset('uploads/profil/' . $u->foto_profil)
                                                : 'https://ui-avatars.com/api/?name=' . urlencode($u->name) . '&background=e5e7eb&color=6b7280&size=24' }}"
                                                class="rounded-circle" style="width: 24px; height: 24px; object-fit: cover;">
                                            <span>{{ $u->name }}</span>
                                            @if ($gurus->pluck('user_id')->contains($u->id))
                                                <span class="badge bg-secondary">Sudah jadi sensei</span>
                                            @endif
                                        </div>
                                    </td>
                                    <td>{{ $u->email }}</td>
                                    <td><span class="badge bg-info">{{ $u->role }}</span></td>
                                </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Batal</button>
                    <button type="submit" class="btn btn-sm btn-primary">Simpan Sensei</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script>
$(document).ready(function() {
    $('#checkAll').on('change', function() {
        $('.user-checkbox:not(:disabled)').prop('checked', this.checked);
    });

    $('#formTambahGuru').on('submit', function(e) {
        e.preventDefault();
        var selected = $('.user-checkbox:checked').length;
        if (selected === 0) {
            Swal.fire({ icon: 'warning', title: 'Pilih minimal satu pengguna' });
            return;
        }
        $.ajax({
            url: '{{ route("guru.store") }}',
            type: 'POST',
            data: $(this).serialize(),
            success: function(res) {
                Swal.fire({ icon: 'success', title: 'Berhasil', text: res.message, timer: 1500, showConfirmButton: false });
                $('#modalTambahGuru').modal('hide');
                setTimeout(() => location.reload(), 1500);
            },
            error: function(xhr) {
                var msg = xhr.responseJSON?.message || 'Gagal menyimpan';
                Swal.fire({ icon: 'error', title: 'Gagal', text: msg });
            }
        });
    });

    $(document).on('click', '.hapus-guru', function() {
        var id = $(this).data('id');
        var nama = $(this).data('nama');
        Swal.fire({
            title: 'Hapus Sensei?',
            text: 'Yakin ingin menghapus ' + nama + ' dari data sensei?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonText: 'Batal',
            confirmButtonText: 'Ya, hapus!',
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: '/guru/' + id,
                    type: 'DELETE',
                    data: { _token: '{{ csrf_token() }}' },
                    success: function(res) {
                        Swal.fire({ icon: 'success', title: 'Berhasil', text: res.message, timer: 1500, showConfirmButton: false });
                        setTimeout(() => location.reload(), 1500);
                    },
                    error: function(xhr) {
                        var msg = xhr.responseJSON?.message || 'Gagal menghapus';
                        Swal.fire({ icon: 'error', title: 'Gagal', text: msg });
                    }
                });
            }
        });
    });
});
</script>
@endpush
