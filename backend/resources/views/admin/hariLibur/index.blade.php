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

    <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
            <h5 class="mb-0" style="font-weight: 700; font-size: 16px;">Manajemen Hari Libur</h5>
            <small class="text-muted">Kelola tanggal libur nasional</small>
        </div>
        <button class="btn btn-success btn-sm" data-bs-toggle="modal" data-bs-target="#modalTambah">
            <i class="ph ph-plus me-1"></i>Tambah Libur
        </button>
    </div>

    <div class="rounded-3">
        <div class="p-3 border-bottom" style="border-bottom-color: #f0f0f0 !important;">
            <div class="d-flex align-items-center justify-content-between">
                <span class="fw-semibold" style="font-size: 13px;"></span>
                <span class="text-muted" style="font-size: 11px;">{{ $hariLiburs->total() }} data</span>
            </div>
        </div>
        <div class="table-responsive">
            <table id="hariLiburTable" class="table table-hover text-nowrap mb-0">
                <thead>
                    <tr>
                        <th scope="col">No</th>
                        <th scope="col">Tanggal</th>
                        <th scope="col">Hari</th>
                        <th scope="col">Keterangan</th>
                        <th scope="col" class="text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($hariLiburs as $libur)
                        <tr>
                            <td class="text-muted">{{ $hariLiburs->firstItem() + $loop->index }}</td>
                            <td>
                                <span class="fw-medium" style="font-size: 13px;">
                                    {{ \Carbon\Carbon::parse($libur->tanggal)->format('d F Y') }}
                                </span>
                            </td>
                            <td>
                                <span class="badge bg-danger-subtle text-danger rounded-pill fw-normal px-2 py-1">
                                    {{ \Carbon\Carbon::parse($libur->tanggal)->isoFormat('dddd') }}
                                </span>
                            </td>
                            <td style="font-size: 13px;">{{ $libur->keterangan }}</td>
                            <td class="text-center">
                                <form action="{{ route('hari-libur.destroy', $libur->id) }}" method="POST"
                                    class="form-delete d-inline">
                                    @csrf
                                    @method('DELETE')
                                    <button type="button" class="btn btn-sm btn-outline-secondary border-0 btn-delete">
                                        <i class="ph ph-trash"></i>
                                    </button>
                                </form>
                            </td>
                        </tr>
                   
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</div>

{{-- Modal Tambah Hari Libur --}}
<div class="modal fade" id="modalTambah" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
            <div class="modal-header border-0 text-white" style="background: linear-gradient(135deg, #2a5298 0%, #1e3c72 100%);">
                <h5 class="modal-title text-white fw-bold"><i class="ph ph-plus-circle me-2"></i>Tambah Libur Nasional</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <form action="{{ route('hari-libur.store') }}" method="POST">
                @csrf
                <div class="modal-body p-4">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Dari Tanggal <span class="text-danger">*</span></label>
                        <input type="date" name="tgl_mulai"
                            class="form-control @error('tgl_mulai') is-invalid @enderror" required>
                        @error('tgl_mulai')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-bold">Sampai Tanggal <span class="text-danger">*</span></label>
                        <input type="date" name="tgl_selesai"
                            class="form-control @error('tgl_selesai') is-invalid @enderror" required>
                        @error('tgl_selesai')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-bold">Keterangan <span class="text-danger">*</span></label>
                        <input type="text" name="keterangan" class="form-control"
                            placeholder="Contoh: Libur Lebaran" required>
                    </div>
                    <div class="alert alert-info py-2 border-0 mb-0" style="font-size:0.85rem">
                        <i class="ph ph-info me-1"></i>
                        Tanggal yang sudah terdaftar akan dilewati otomatis.
                    </div>
                </div>
                <div class="modal-footer bg-light border-0">
                    <button type="button" class="btn btn-outline-secondary px-4" data-bs-dismiss="modal"><i class="ph ph-x me-1"></i> Batal</button>
                    <button class="btn btn-dark px-4 shadow"><i class="ph ph-floppy-disk me-1"></i> Simpan</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdn.datatables.net/1.13.8/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.datatables.net/1.13.8/js/dataTables.bootstrap5.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

<script>
    $(function () {
        $('#hariLiburTable').DataTable({
            responsive: true,
            autoWidth: false,
            pageLength: 10,
            lengthMenu: [10, 25, 50, 100],
            order: [[1, 'asc']],
            language: {
                search: "Cari:",
                lengthMenu: "Tampilkan _MENU_ data",
                info: "Menampilkan _START_–_END_ dari _TOTAL_ data",
                zeroRecords: "Data tidak ditemukan",
                paginate: { first: "Awal", last: "Akhir", next: "›", previous: "‹" }
            }
        });

        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', function(e) {
                const form = this.closest('.form-delete');

                Swal.fire({
                    title: 'Hapus Tanggal Libur?',
                    text: "Data yang dihapus tidak dapat dikembalikan!",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#6e7881',
                    confirmButtonText: 'Ya, Hapus!',
                    cancelButtonText: 'Batal',
                    reverseButtons: true,
                    borderRadius: '15px'
                }).then((result) => {
                    if (result.isConfirmed) {
                        form.submit();
                    }
                });
            });
        });
    });
</script>
@endsection
