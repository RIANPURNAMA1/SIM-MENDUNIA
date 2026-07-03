<div class="modal fade" id="modalTambahCabang" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
            <div class="modal-header border-1 text-white" style="background: linear-gradient(135deg, #0D1F3C 0%, #1a2d4a 100%);">
                <h5 class="modal-title text-white fw-bold"><i class="ph ph-map-pin-plus me-2"></i>Tambah Cabang Baru</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <form id="formTambahCabang" action="{{ route('cabang.store') }}" method="POST">
                @csrf
                <div class="modal-body p-4">
                    <div class="row g-3 mb-3">
                        <div class="col-md-4">
                            <label class="form-label fw-bold">Kode</label>
                            <input type="text" name="kode_cabang" class="form-control" placeholder="PST" required>
                        </div>
                        <div class="col-md-8">
                            <label class="form-label fw-bold">Nama Cabang</label>
                            <input type="text" name="nama_cabang" class="form-control" placeholder="Contoh: Kantor Pusat" required>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label fw-bold">Status Kantor</label>
                        <select name="status_pusat" class="form-select" required>
                            <option value="CABANG">CABANG</option>
                            <option value="PUSAT">PUSAT</option>
                        </select>
                    </div>

                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Latitude</label>
                            <input type="text" name="latitude" id="add_lat" class="form-control" placeholder="-6.12345" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Longitude</label>
                            <input type="text" name="longitude" id="add_lng" class="form-control" placeholder="106.12345" required>
                        </div>
                    </div>

                    <div class="mt-2 mb-3">
                        <button type="button" class="btn btn-sm btn-outline-secondary w-100" onclick="getCurrentLocation('add')">
                            <i class="ph ph-navigation-arrow me-1"></i> Gunakan Lokasi Saya Saat Ini
                        </button>
                    </div>

                    <div class="mb-3">
                        <label class="form-label fw-bold text-danger">Radius Absensi (Meter)</label>
                        <div class="input-group">
                            <input type="number" name="radius" class="form-control border-danger text-danger fw-bold" value="100" required>
                            <span class="input-group-text bg-danger text-white">Meter</span>
                        </div>
                    </div>

                    <div class="mb-0">
                        <label class="form-label fw-bold">Alamat Lengkap</label>
                        <textarea name="alamat" class="form-control" rows="2" placeholder="Jl. Raya Utama No. 123..."></textarea>
                    </div>
                </div>
                <div class="modal-footer bg-light border-0">
                    <button type="button" class="btn btn-outline-secondary px-4" data-bs-dismiss="modal"><i class="ph ph-x me-1"></i> Batal</button>
                    <button type="submit" class="btn btn-dark px-4 shadow"><i class="ph ph-floppy-disk me-1"></i> Simpan Cabang</button>
                </div>
            </form>
        </div>
    </div>
</div>

<div class="modal fade" id="modalEditCabang" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
            <div class="modal-header border-0 text-white" style="background: linear-gradient(135deg, #0D1F3C 0%, #1a2d4a 100%);">
                <h5 class="modal-title text-white fw-bold"><i class="ph ph-pencil-line me-2"></i>Edit Data Cabang</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <form id="formEditCabang" action="" method="POST">
                @csrf
                @method('PUT')
                <input type="hidden" id="edit_id">
                <div class="modal-body p-4">
                    <div class="row g-3 mb-3">
                        <div class="col-md-4">
                            <label class="form-label fw-bold">Kode</label>
                            <input type="text" name="kode_cabang" id="edit_kode_cabang" class="form-control" required>
                        </div>
                        <div class="col-md-8">
                            <label class="form-label fw-bold">Nama Cabang</label>
                            <input type="text" name="nama_cabang" id="edit_nama_cabang" class="form-control" required>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label fw-bold">Status Kantor</label>
                        <select name="status_pusat" id="edit_status_pusat" class="form-select" required>
                            <option value="CABANG">CABANG</option>
                            <option value="PUSAT">PUSAT</option>
                        </select>
                    </div>

                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Latitude</label>
                            <input type="text" name="latitude" id="edit_latitude" class="form-control" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Longitude</label>
                            <input type="text" name="longitude" id="edit_longitude" class="form-control" required>
                        </div>
                    </div>

                    <div class="mt-2 mb-3">
                        <button type="button" class="btn btn-sm btn-outline-secondary w-100" onclick="getCurrentLocation('edit')">
                            <i class="ph ph-navigation-arrow me-1"></i> Gunakan Lokasi Saya Saat Ini
                        </button>
                    </div>

                    <div class="mb-3">
                        <label class="form-label fw-bold">Radius Absensi (Meter)</label>
                        <div class="input-group">
                            <input type="number" name="radius" id="edit_radius" class="form-control fw-bold" required>
                            <span class="input-group-text">Meter</span>
                        </div>
                    </div>

                    <div class="mb-0">
                        <label class="form-label fw-bold">Alamat Lengkap</label>
                        <textarea name="alamat" id="edit_alamat" class="form-control" rows="2"></textarea>
                    </div>
                </div>
                <div class="modal-footer bg-light border-0">
                    <button type="button" class="btn btn-outline-secondary px-4" data-bs-dismiss="modal"><i class="ph ph-x me-1"></i> Batal</button>
                    <button type="submit" class="btn btn-dark px-4 shadow"><i class="ph ph-floppy-disk me-1"></i> Update Cabang</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
    function getCurrentLocation(type) {
        if (navigator.geolocation) {
            Swal.fire({
                title: 'Mencari Lokasi...',
                text: 'Mohon tunggu sebentar',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    Swal.close();
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;

                    if (type === 'add') {
                        $('#add_lat').val(lat);
                        $('#add_lng').val(lng);
                    } else {
                        $('#edit_latitude').val(lat);
                        $('#edit_longitude').val(lng);
                    }

                    Swal.fire({ icon: 'success', title: 'Lokasi Ditemukan!', timer: 1000, showConfirmButton: false });
                },
                (error) => {
                    Swal.close();
                    Swal.fire('Gagal', 'Pastikan GPS aktif dan izinkan akses lokasi.', 'error');
                },
                { enableHighAccuracy: true }
            );
        } else {
            Swal.fire('Error', 'Browser Anda tidak mendukung Geolocation.', 'error');
        }
    }

    $(document).ready(function() {
        $('#formTambahCabang').on('submit', function(e) {
            e.preventDefault();
            let form = $(this);
            Swal.fire({
                title: 'Menyimpan...',
                text: 'Sedang memproses data cabang',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            $.ajax({
                url: form.attr('action'),
                type: "POST",
                data: form.serialize(),
                success: function(response) {
                    Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Cabang baru telah ditambahkan', timer: 1500, showConfirmButton: false });
                    $('#modalTambahCabang').modal('hide');
                    form[0].reset();
                    setTimeout(() => { location.reload(); }, 1500);
                },
                error: function(xhr) {
                    Swal.fire({ icon: 'error', title: 'Gagal!', text: xhr.responseJSON?.message || "Terjadi kesalahan." });
                }
            });
        });

        $('#formEditCabang').on('submit', function(e) {
            e.preventDefault();
            let id = $('#edit_id').val();
            let url = "/cabang/" + id;
            let formData = new FormData(this);
            formData.append('_method', 'PUT');

            Swal.fire({ title: 'Memperbarui...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

            $.ajax({
                url: url,
                type: "POST",
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data cabang telah diperbarui', timer: 1500, showConfirmButton: false });
                    $('#modalEditCabang').modal('hide');
                    setTimeout(() => { location.reload(); }, 1500);
                },
                error: function(xhr) {
                    Swal.fire({ icon: 'error', title: 'Oops!', text: xhr.responseJSON?.message || 'Gagal memperbarui data.' });
                }
            });
        });
    });
</script>
