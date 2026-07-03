<div class="modal fade" id="modalTambahShift" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
            <div class="modal-header border-1 text-white" style="background: linear-gradient(135deg, #0D1F3C 0%, #1a2d4a 100%);">
                <h5 class="modal-title text-white fw-bold"><i class="ph ph-plus-circle me-2"></i>Tambah Shift Kerja</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>

            <form id="formTambahShift">
                @csrf

                <div class="modal-body p-4">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Nama Shift <span class="text-danger">*</span></label>
                            <input type="text" name="nama_shift" class="form-control" placeholder="Contoh: Shift Pagi" required>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label fw-bold">Kode Shift</label>
                            <input type="text" name="kode_shift" class="form-control" placeholder="Contoh: PAGI" style="text-transform: uppercase;">
                            <small class="text-muted">Opsional - Kode unik untuk shift</small>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label fw-bold">Jam Masuk <span class="text-danger">*</span></label>
                            <input type="time" name="jam_masuk" id="jam_masuk" class="form-control" required>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label fw-bold">Jam Pulang <span class="text-danger">*</span></label>
                            <input type="time" name="jam_pulang" id="jam_pulang" class="form-control" required>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label fw-bold">Toleransi Keterlambatan <span class="text-danger">*</span></label>
                            <div class="input-group">
                                <input type="number" name="toleransi" class="form-control" min="0" max="60" value="15" required>
                                <span class="input-group-text">Menit</span>
                            </div>
                            <small class="text-muted">Maksimal 60 menit</small>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label fw-bold">Status <span class="text-danger">*</span></label>
                            <select name="status" class="form-select" required>
                                <option value="AKTIF" selected>Aktif</option>
                                <option value="NONAKTIF">Nonaktif</option>
                            </select>
                        </div>

                        <div class="col-md-12">
                            <label class="form-label fw-bold">Keterangan</label>
                            <textarea name="keterangan" class="form-control" rows="3" placeholder="Tambahkan catatan untuk shift ini (opsional)"></textarea>
                            <div class="mt-2">
                                <small class="text-info"><i class="ph ph-info"></i> Total jam kerja akan dihitung secara otomatis oleh sistem.</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer bg-light border-0">
                    <button type="button" class="btn btn-outline-secondary px-4" data-bs-dismiss="modal"><i class="ph ph-x me-1"></i> Batal</button>
                    <button type="submit" class="btn btn-dark px-4 shadow" id="btnSimpanShift"><i class="ph ph-floppy-disk me-1"></i> Simpan Shift</button>
                </div>
            </form>
        </div>
    </div>
</div>

<div class="modal fade" id="modalEditShift" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
            <div class="modal-header border-0 text-white" style="background: linear-gradient(135deg, #0D1F3C 0%, #1a2d4a 100%);">
                <h5 class="modal-title text-white fw-bold"><i class="ph ph-pencil-line me-2"></i>Edit Shift Kerja</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>

            <form id="formEditShift">
                @csrf
                @method('PUT')
                <input type="hidden" id="edit_id" name="id">

                <div class="modal-body p-4">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Nama Shift <span class="text-danger">*</span></label>
                            <input type="text" name="nama_shift" id="edit_nama_shift" class="form-control" required>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label fw-bold">Kode Shift</label>
                            <input type="text" name="kode_shift" id="edit_kode_shift" class="form-control" style="text-transform: uppercase;">
                            <small class="text-muted">Contoh: PAGI, MALAM, dsb.</small>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label fw-bold">Jam Masuk <span class="text-danger">*</span></label>
                            <input type="time" name="jam_masuk" id="edit_jam_masuk" class="form-control" required>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label fw-bold">Jam Pulang <span class="text-danger">*</span></label>
                            <input type="time" name="jam_pulang" id="edit_jam_pulang" class="form-control" required>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label fw-bold">Toleransi Keterlambatan <span class="text-danger">*</span></label>
                            <div class="input-group">
                                <input type="number" name="toleransi" id="edit_toleransi" class="form-control" min="0" max="60" required>
                                <span class="input-group-text">Menit</span>
                            </div>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label fw-bold">Status <span class="text-danger">*</span></label>
                            <select name="status" id="edit_status" class="form-select" required>
                                <option value="AKTIF">Aktif</option>
                                <option value="NONAKTIF">Nonaktif</option>
                            </select>
                        </div>

                        <div class="col-md-12">
                            <label class="form-label fw-bold">Keterangan</label>
                            <textarea name="keterangan" id="edit_keterangan" class="form-control" rows="3" placeholder="Tambahkan catatan..."></textarea>
                            <div class="mt-2 alert alert-sm alert-soft-info py-2 mb-0">
                                <small><i class="ph ph-info"></i> <strong>Sistem Otomatis:</strong> Total jam kerja akan diperbarui secara otomatis jika Anda mengubah Jam Masuk atau Jam Pulang.</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer bg-light border-0">
                    <button type="button" class="btn btn-outline-secondary px-4" data-bs-dismiss="modal"><i class="ph ph-x me-1"></i> Batal</button>
                    <button type="submit" class="btn btn-dark px-4 shadow" id="btnUpdateShift"><i class="ph ph-floppy-disk me-1"></i> Simpan Perubahan</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
    $(document).ready(function() {
        $('#formTambahShift').submit(function(e) {
            e.preventDefault();
            let formData = new FormData(this);

            $.ajax({
                url: "{{ route('shift.store') }}",
                type: "POST",
                data: formData,
                contentType: false,
                processData: false,
                beforeSend: function() {
                    $('#btnSimpanShift').prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span> Menyimpan...');
                },
                success: function(res) {
                    $('#modalTambahShift').modal('hide');
                    $('#formTambahShift')[0].reset();
                    Swal.fire({ icon: 'success', title: 'Berhasil', text: res.message || 'Shift berhasil ditambahkan', timer: 1500, showConfirmButton: false });
                    setTimeout(() => location.reload(), 1500);
                },
                error: function(xhr) {
                    let msg = '';
                    if (xhr.responseJSON?.errors) {
                        $.each(xhr.responseJSON.errors, function(key, value) { msg += value[0] + '<br>'; });
                    } else {
                        msg = xhr.responseJSON?.message || 'Terjadi kesalahan saat menyimpan data';
                    }
                    Swal.fire({ icon: 'error', title: 'Gagal', html: msg });
                },
                complete: function() {
                    $('#btnSimpanShift').prop('disabled', false).html('<i class="ph ph-floppy-disk me-1"></i> Simpan Shift');
                }
            });
        });

        $('#formEditShift').on('submit', function(e) {
            e.preventDefault();
            let id = $('#edit_id').val();
            let url = '/shift/' + id;
            let formData = new FormData(this);

            $.ajax({
                url: url,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                beforeSend: function() {
                    $('#btnUpdateShift').prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span> Menyimpan...');
                },
                success: function(res) {
                    $('#modalEditShift').modal('hide');
                    $('#formEditShift')[0].reset();
                    Swal.fire({ icon: 'success', title: 'Berhasil', text: res.message || 'Shift berhasil diperbarui', timer: 1500, showConfirmButton: false });
                    setTimeout(() => location.reload(), 1500);
                },
                error: function(xhr) {
                    let msg = '';
                    if (xhr.responseJSON?.errors) {
                        $.each(xhr.responseJSON.errors, function(key, val) { msg += val[0] + '<br>'; });
                    } else if (xhr.responseJSON?.message) {
                        msg = xhr.responseJSON.message;
                    } else {
                        msg = 'Terjadi kesalahan';
                    }
                    Swal.fire({ icon: 'error', title: 'Gagal', html: msg });
                },
                complete: function() {
                    $('#btnUpdateShift').prop('disabled', false).html('<i class="ph ph-floppy-disk me-1"></i> Simpan Perubahan');
                }
            });
        });

        $('input[name="kode_shift"]').on('input', function() {
            this.value = this.value.toUpperCase();
        });
    });
</script>
