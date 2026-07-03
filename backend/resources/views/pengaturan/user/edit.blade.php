<div class="modal fade" id="modalEditAdmin" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <form id="formEditAdmin" action="" method="POST" class="modal-content border-0 shadow-lg">
            @csrf
            @method('PUT')
            <div class="modal-header border-0 text-white" style="background: linear-gradient(135deg, #2a5298 0%, #1e3c72 100%);">
                <h5 class="modal-title text-white fw-bold"><i class="ph ph-pencil-line me-2"></i>Edit Akun Admin</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div class="modal-body p-4">
                <input type="hidden" name="id" id="edit_id">

                <div class="mb-3">
                    <label class="form-label fw-bold">Nama Lengkap <span class="text-danger">*</span></label>
                    <input type="text" name="name" id="edit_name" class="form-control" required>
                </div>

                <div class="mb-3">
                    <label class="form-label fw-bold">Email <span class="text-danger">*</span></label>
                    <input type="email" name="email" id="edit_email" class="form-control" required>
                </div>

                <div class="mb-3">
                    <label class="form-label fw-bold">Password</label>
                    <input type="password" name="password" class="form-control" placeholder="Kosongkan jika tidak ingin ganti">
                </div>

                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-bold">Role <span class="text-danger">*</span></label>
                        <select name="role" id="edit_role" class="form-select">
                            <option value="HR">HR</option>
                            <option value="MANAGER">MANAGER</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-bold">Status <span class="text-danger">*</span></label>
                        <select name="status" id="edit_status" class="form-select">
                            <option value="AKTIF">AKTIF</option>
                            <option value="NONAKTIF">NONAKTIF</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="modal-footer bg-light border-0">
                <button type="button" class="btn btn-outline-secondary px-4" data-bs-dismiss="modal"><i class="ph ph-x me-1"></i> Batal</button>
                <button type="submit" class="btn btn-dark px-4 shadow"><i class="ph ph-floppy-disk me-1"></i> Update Akun</button>
            </div>
        </form>
    </div>
</div>
