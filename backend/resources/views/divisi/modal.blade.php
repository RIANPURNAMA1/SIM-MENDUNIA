<div class="modal fade" id="modalTambahDivisi" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <form id="formTambahDivisi" action="{{ route('divisi.store') }}" method="POST">
            @csrf
            <div class="modal-content border-0 shadow-lg">
                <div class="modal-header border-0 text-white" style="background: linear-gradient(135deg, #0D1F3C 0%, #1a2d4a 100%);">
                    <h5 class="modal-title text-white fw-bold"><i class="ph ph-plus-circle me-2"></i>Tambah Divisi</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body p-4">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Kode Divisi</label>
                        <input type="text" name="kode_divisi" class="form-control" placeholder="Contoh: IT, HRD, MKT" required>
                        <small class="text-muted">Gunakan singkatan unik maksimal 10 karakter.</small>
                    </div>
                    <div class="mb-0">
                        <label class="form-label fw-bold">Nama Divisi</label>
                        <input type="text" name="nama_divisi" class="form-control" placeholder="Contoh: Information Technology" required>
                    </div>
                </div>

                <div class="modal-footer bg-light border-0">
                    <button type="button" class="btn btn-outline-secondary px-4" data-bs-dismiss="modal">Batal</button>
                    <button type="submit" class="btn btn-dark px-4 shadow" id="btnSimpanDivisi"><i class="ph ph-floppy-disk me-1"></i> Simpan Divisi</button>
                </div>
            </div>
        </form>
    </div>
</div>

<div class="modal fade" id="modalEditDivisi" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <form id="formEditDivisi" method="POST">
            @csrf
            @method('PUT')
            <input type="hidden" id="edit_id">

            <div class="modal-content border-0 shadow-lg">
                <div class="modal-header border-0 text-white" style="background: linear-gradient(135deg, #0D1F3C 0%, #1a2d4a 100%);">
                    <h5 class="modal-title text-white fw-bold"><i class="ph ph-pencil-line me-2"></i>Edit Divisi</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body p-4">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Kode Divisi</label>
                        <input type="text" name="kode_divisi" id="edit_kode_divisi" class="form-control" required>
                    </div>
                    <div class="mb-0">
                        <label class="form-label fw-bold">Nama Divisi</label>
                        <input type="text" name="nama_divisi" id="edit_nama_divisi" class="form-control" required>
                    </div>
                </div>

                <div class="modal-footer bg-light border-0">
                    <button type="button" class="btn btn-outline-secondary px-4" data-bs-dismiss="modal">Batal</button>
                    <button type="submit" class="btn btn-dark px-4 shadow" id="btnUpdateDivisi"><i class="ph ph-floppy-disk me-1"></i> Update Divisi</button>
                </div>
            </div>
        </form>
    </div>
</div>

<script>
    $(document).ready(function() {
        $('#formTambahDivisi').on('submit', function(e) {
            e.preventDefault();
            let form = $(this);

            $.ajax({
                url: form.attr('action'),
                type: 'POST',
                data: form.serialize(),
                beforeSend: function() {
                    $('#btnSimpanDivisi').prop('disabled', true);
                    Swal.fire({
                        title: 'Menyimpan...',
                        allowOutsideClick: false,
                        didOpen: () => Swal.showLoading()
                    });
                },
                success: function(response) {
                    $('#modalTambahDivisi').modal('hide');
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil',
                        text: 'Divisi baru telah ditambahkan',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    setTimeout(() => location.reload(), 1500);
                },
                error: function(xhr) {
                    $('#btnSimpanDivisi').prop('disabled', false);
                    let errorMsg = xhr.responseJSON?.message || 'Terjadi kesalahan server';

                    if (xhr.responseJSON?.errors) {
                        errorMsg = Object.values(xhr.responseJSON.errors).map(v => v[0]).join('<br>');
                    }

                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal Menyimpan',
                        html: errorMsg
                    });
                }
            });
        });

        $('#formEditDivisi').on('submit', function(e) {
            e.preventDefault();
            let form = $(this);

            $.ajax({
                url: form.attr('action'),
                type: 'POST',
                data: form.serialize(),
                beforeSend: function() {
                    $('#btnUpdateDivisi').prop('disabled', true);
                    Swal.fire({
                        title: 'Memperbarui...',
                        allowOutsideClick: false,
                        didOpen: () => Swal.showLoading()
                    });
                },
                success: function(response) {
                    $('#modalEditDivisi').modal('hide');
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil',
                        text: 'Data divisi telah diperbarui',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    setTimeout(() => location.reload(), 1500);
                },
                error: function(xhr) {
                    $('#btnUpdateDivisi').prop('disabled', false);
                    let errorMsg = xhr.responseJSON?.message || 'Gagal memperbarui data';

                    if (xhr.responseJSON?.errors) {
                        errorMsg = Object.values(xhr.responseJSON.errors).map(v => v[0]).join('<br>');
                    }

                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal Update',
                        html: errorMsg
                    });
                }
            });
        });
    });
</script>
