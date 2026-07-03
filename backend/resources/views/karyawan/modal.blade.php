   <!-- MODAL TAMBAH KARYAWAN -->
   <div class="modal fade" id="modalTambahKaryawan" tabindex="-1">
       <div class="modal-dialog modal-lg modal-dialog-centered">
           <div class="modal-content border-0 shadow-lg">

                <div class="modal-header border-0" style="background: linear-gradient(135deg, #0D1F3C 0%, #1a2d4a 100%);">
                   <h5 class="modal-title text-white fw-bold">
                       <i class="ph ph-user-plus me-2"></i>Tambah Karyawan
                   </h5>
                   <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
               </div>

               <form id="formTambahKaryawan" enctype="multipart/form-data">
                   @csrf

                   <div class="modal-body p-4">
                       <div class="row g-3">

                           <div class="col-md-6">
                               <label class="form-label fw-bold">NIK (No. KTP) <span
                                       class="text-danger">*</span></label>
                               <input type="text" name="nik" class="form-control"
                                   placeholder="Masukkan 16 digit NIK" required maxlength="16">
                           </div>

                           <div class="col-md-6">
                               <label class="form-label fw-bold">NIP</label>
                               <input type="text" name="nip" class="form-control bg-light"
                                   placeholder="Otomatis setelah simpan" readonly>
                           </div>

                           <div class="col-md-6">
                               <label class="form-label fw-bold">Nama Lengkap <span class="text-danger">*</span></label>
                               <input type="text" name="name" class="form-control" placeholder="Nama tanpa gelar"
                                   required>
                           </div>

                           <div class="col-md-6">
                               <label class="form-label fw-bold">Jabatan <span class="text-danger">*</span></label>
                               <input type="text" name="jabatan" class="form-control"
                                   placeholder="Contoh: Staff Admin" required>
                           </div>

                           <div class="col-md-12">
                               <label class="form-label fw-bold text-primary">Penempatan Cabang <span
                                       class="text-danger">*</span></label>
                               <div class="card border-primary-subtle shadow-sm">
                                   <div class="card-body p-3" style="background-color: #f8faff;">
                                       <div class="row">
                                           @foreach ($cabang as $c)
                                               <div class="col-md-4 mb-2">
                                                   <div class="form-check custom-checkbox">
                                                       <input class="form-check-input" type="checkbox"
                                                           name="cabang_ids[]" value="{{ $c->id }}"
                                                           id="cabang_{{ $c->id }}">
                                                       <label class="form-check-label fw-semibold"
                                                           for="cabang_{{ $c->id }}" style="cursor: pointer;">
                                                           {{ $c->nama_cabang }}
                                                       </label>
                                                   </div>
                                               </div>
                                           @endforeach
                                       </div>
                                       <div class="mt-2 py-1 px-2 bg-white rounded border">
                                           <small class="text-muted"><i class="ph ph-info me-1"></i>Centang satu atau
                                               lebih cabang untuk lokasi absensi karyawan.</small>
                                       </div>
                                   </div>
                               </div>
                           </div>

                           <div class="col-md-6">
                               <label class="form-label fw-bold">Divisi <span class="text-danger">*</span></label>
                               <select name="divisi_id" class="form-select" required>
                                   <option value="">-- Pilih Divisi --</option>
                                   @foreach ($divisi as $d)
                                       <option value="{{ $d->id }}">{{ $d->nama_divisi }}</option>
                                   @endforeach
                               </select>
                           </div>

<div class="col-md-6">
                                <label class="form-label fw-bold text-primary">Shift Kerja <span
                                        class="text-danger">*</span></label>
                                <div class="border rounded p-3" style="max-height: 150px; overflow-y: auto;">
                                    @foreach ($shifts as $s)
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" name="shift_ids[]" value="{{ $s->id }}" id="shift_{{ $s->id }}">
                                            <label class="form-check-label" for="shift_{{ $s->id }}">
                                                <span class="badge bg-primary">{{ $s->nama_shift }}</span>
                                                <small class="text-muted">({{ \Carbon\Carbon::parse($s->jam_masuk)->format('H:i') }} - {{ \Carbon\Carbon::parse($s->jam_pulang)->format('H:i') }})</small>
                                            </label>
                                        </div>
                                    @endforeach
                                </div>
                                <small class="text-muted">Centang satu atau lebih shift</small>
                            </div>

                           <div class="col-md-6">
                               <label class="form-label fw-bold">No HP <span class="text-danger">*</span></label>
                               <input type="text" name="no_hp" class="form-control" placeholder="08xxxx" required>
                           </div>

                           <div class="col-md-6">
                               <label class="form-label fw-bold">Email <span class="text-danger">*</span></label>
                               <input type="email" name="email" class="form-control"
                                   placeholder="email@perusahaan.com" required>
                           </div>

                           <div class="col-md-6">
                               <label class="form-label fw-bold">Pendidikan Terakhir <span
                                       class="text-danger">*</span></label>
                               <select name="pendidikan_terakhir" class="form-select" required>
                                   <option value="">-- Pilih Opsi --</option>
                                   <option value="SD/MI">SD/MI</option>
                                   <option value="SMP/MTS">SMP/MTS</option>
                                   <option value="SMA/SMK">SMA/SMK</option>
                                   <option value="D3">D3</option>
                                   <option value="D4">D4</option>
                                   <option value="S1">S1</option>
                                   <option value="S2">S2</option>
                                   <option value="S3">S3</option>
                               </select>
                           </div>

                           <div class="col-md-6">
                               <label class="form-label fw-bold">Status Kerja <span
                                       class="text-danger">*</span></label>
                               <select name="status_kerja" class="form-select" required>
                                   <option value="">-- Pilih Status --</option>
                                   <option value="TETAP">Tetap</option>
                                   <option value="KONTRAK">Kontrak</option>
                                   <option value="MAGANG">Magang</option>
                               </select>
                           </div>

                           <div class="col-md-4">
                               <label class="form-label fw-bold">Tanggal Masuk</label>
                               <input type="date" name="tanggal_masuk" class="form-control" required>
                           </div>

                           <div class="col-md-4">
                               <label class="form-label fw-bold">Jenis Kelamin</label>
                               <select name="jenis_kelamin" class="form-select">
                                   <option value="">-- Pilih --</option>
                                   <option value="L">Laki-laki</option>
                                   <option value="P">Perempuan</option>
                               </select>
                           </div>

                           <div class="col-md-4">
                               <label class="form-label fw-bold">Agama</label>
                               <select name="agama" class="form-select">
                                   <option value="">-- Pilih --</option>
                                   <option value="ISLAM">Islam</option>
                                   <option value="KRISTEN">Kristen</option>
                                   <option value="KATOLIK">Katolik</option>
                                   <option value="HINDU">Hindu</option>
                                   <option value="BUDDHA">Buddha</option>
                               </select>
                           </div>

                           <hr class="mt-4 mb-2">
                           <h6 class="fw-bold text-muted" style="font-size: 0.8rem; letter-spacing: 1px;">UPLOAD
                               DOKUMEN</h6>

                           <div class="col-md-4">
                               <label class="form-label small fw-bold">Foto Profil</label>
                               <input type="file" name="foto_profil" class="form-control" accept="image/*">
                           </div>

                           <div class="col-md-4">
                               <label class="form-label small fw-bold">Foto KTP</label>
                               <input type="file" name="foto_ktp" class="form-control">
                           </div>

                           <div class="col-md-4">
                               <label class="form-label small fw-bold">CV (PDF)</label>
                               <input type="file" name="cv_file" class="form-control" accept=".pdf">
                           </div>

                           <div class="col-md-12">
                               <label class="form-label fw-bold">Alamat Sesuai KTP</label>
                               <textarea name="alamat" class="form-control" rows="2" placeholder="Alamat lengkap..."></textarea>
                           </div>

                       </div>
                   </div>

                   <div class="modal-footer bg-light border-0">
                       <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal">Batal</button>
                       <button type="submit" class="btn btn-primary px-4 shadow">
                           <i class="ph ph-floppy-disk me-1"></i> Simpan Karyawan
                       </button>
                   </div>
               </form>

           </div>
       </div>
   </div>
   <div class="modal fade" id="modalEditKaryawan" tabindex="-1" aria-hidden="true">
       <div class="modal-dialog modal-lg modal-dialog-centered">
           <div class="modal-content border-0 shadow-lg">

               <div class="modal-header text-white border-0"
                    style="background: linear-gradient(135deg, #0D1F3C 0%, #1a2d4a 100%);">
                   <h5 class="modal-title fw-bold text-white">
                       <i class="ph ph-user-circle-plus me-2"></i>Edit Data Karyawan
                   </h5>
                   <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"
                       aria-label="Close"></button>
               </div>
               <form id="formEditKaryawan" enctype="multipart/form-data">
                   @csrf
                   @method('PUT')

                   <input type="hidden" id="edit_id" name="id">

                   <div class="modal-body p-4">
                       <div class="row g-3">

                           <div class="col-md-6">
                               <label class="form-label fw-semibold">NIK (No. KTP) <span
                                       class="text-danger">*</span></label>
                               <input type="text" name="nik" id="edit_nik" class="form-control" required
                                   maxlength="16">
                           </div>

                           <div class="col-md-6">
                               <label class="form-label fw-semibold">NIP <span class="text-danger">*</span></label>
                               <input type="text" name="nip" id="edit_nip" class="form-control bg-light"
                                   required>
                           </div>

                           <div class="col-md-6">
                               <label class="form-label fw-semibold">Nama Lengkap <span
                                       class="text-danger">*</span></label>
                               <input type="text" name="name" id="edit_name" class="form-control" required>
                           </div>

                           <div class="col-md-6">
                               <label class="form-label fw-semibold">Jabatan <span
                                       class="text-danger">*</span></label>
                               <input type="text" name="jabatan" id="edit_jabatan" class="form-control" required>
                           </div>

                           <div class="col-md-6">
                               <label class="form-label fw-semibold">Pendidikan Terakhir <span
                                       class="text-danger">*</span></label>
                               <select name="pendidikan_terakhir" id="edit_pendidikan_terakhir" class="form-select"
                                   required>
                                   <option value="">-- Pilih Opsi --</option>
                                   <option value="SD/MI">SD/MI</option>
                                   <option value="SMP/MTS">SMP/MTS</option>
                                   <option value="SMA/SMK">SMA/SMK</option>
                                   <option value="D3">D3</option>
                                   <option value="D4">D4</option>
                                   <option value="S1">S1</option>
                                   <option value="S2">S2</option>
                                   <option value="S3">S3</option>
                               </select>
                           </div>

                           <div class="col-md-6">
                               <label class="form-label fw-semibold">Divisi <span class="text-danger">*</span></label>
                               <select name="divisi_id" id="edit_divisi" class="form-select" required>
                                   <option value="">-- Pilih Divisi --</option>
                                   @foreach ($divisi as $d)
                                       <option value="{{ $d->id }}">{{ $d->nama_divisi }}</option>
                                   @endforeach
                               </select>
                           </div>

                           <div class="col-md-12">
                               <label class="form-label fw-semibold">Cabang Penempatan <span
                                       class="text-danger">*</span></label>
                               <div class="card border shadow-none mb-0">
                                   <div class="card-body p-3">
                                       <div class="row">
                                           @foreach ($cabang as $c)
                                               <div class="col-md-4 mb-2">
                                                   <div class="form-check">
                                                       <input class="form-check-input check-cabang-edit"
                                                           type="checkbox" name="cabang_ids[]"
                                                           value="{{ $c->id }}"
                                                           id="edit_cb_{{ $c->id }}">
                                                       <label class="form-check-label"
                                                           for="edit_cb_{{ $c->id }}">
                                                           {{ $c->nama_cabang }}
                                                       </label>
                                                   </div>
                                               </div>
                                           @endforeach
                                       </div>
                                   </div>
                               </div>
                               <small class="text-muted">Centang satu atau lebih cabang tempat karyawan
                                   bertugas.</small>
                           </div>

<div class="col-md-6">
                                <label class="form-label fw-bold text-primary">Shift Kerja <span
                                        class="text-danger">*</span></label>
                                <div class="border rounded p-3" style="max-height: 150px; overflow-y: auto;">
                                    @foreach ($shifts as $s)
                                        <div class="form-check">
                                            <input class="form-check-input edit-shift-checkbox" type="checkbox" name="shift_ids[]" value="{{ $s->id }}" id="edit_shift_{{ $s->id }}">
                                            <label class="form-check-label" for="edit_shift_{{ $s->id }}">
                                                <span class="badge bg-primary">{{ $s->nama_shift }}</span>
                                                <small class="text-muted">({{ \Carbon\Carbon::parse($s->jam_masuk)->format('H:i') }} - {{ \Carbon\Carbon::parse($s->jam_pulang)->format('H:i') }})</small>
                                            </label>
                                        </div>
                                    @endforeach
                                </div>
                                <small class="text-muted">Centang satu atau lebih shift</small>
                            </div>

                           <div class="col-md-6">
                               <label class="form-label fw-semibold">Status Kerja <span
                                       class="text-danger">*</span></label>
                               <select name="status_kerja" id="edit_status_kerja" class="form-select" required>
                                   <option value="TETAP">Tetap</option>
                                   <option value="KONTRAK">Kontrak</option>
                                   <option value="MAGANG">Magang</option>
                               </select>
                           </div>

                           <div class="col-md-6">
                               <label class="form-label fw-semibold">No. HP / WhatsApp</label>
                               <input type="text" name="no_hp" id="edit_no_hp" class="form-control">
                           </div>

                           <div class="col-md-6">
                               <label class="form-label fw-semibold">Email Perusahaan</label>
                               <input type="email" name="email" id="edit_email" class="form-control">
                           </div>

                           <div class="col-md-6">
                               <label class="form-label fw-semibold">Tanggal Masuk</label>
                               <input type="date" name="tanggal_masuk" id="edit_tanggal_masuk"
                                   class="form-control">
                           </div>

                           <div class="col-md-6">
                               <label class="form-label fw-semibold">Tempat Lahir</label>
                               <input type="text" name="tempat_lahir" id="edit_tempat_lahir"
                                   class="form-control">
                           </div>

                           <div class="col-md-6">
                               <label class="form-label fw-semibold">Tanggal Lahir</label>
                               <input type="date" name="tanggal_lahir" id="edit_tanggal_lahir"
                                   class="form-control">
                           </div>

                           <div class="col-md-6">
                               <label class="form-label fw-semibold">Jenis Kelamin</label>
                               <select name="jenis_kelamin" id="edit_jenis_kelamin" class="form-select">
                                   <option value="">-- Pilih Jenis Kelamin --</option>
                                   <option value="L">Laki-laki</option>
                                   <option value="P">Perempuan</option>
                               </select>
                           </div>

                           <div class="col-md-6">
                               <label class="form-label fw-semibold">Agama</label>
                               <select name="agama" id="edit_agama" class="form-select">
                                   <option value="">-- Pilih Agama --</option>
                                   <option value="ISLAM">Islam</option>
                                   <option value="KRISTEN">Kristen</option>
                                   <option value="KATOLIK">Katolik</option>
                                   <option value="HINDU">Hindu</option>
                                   <option value="BUDDHA">Buddha</option>
                                   <option value="KONGHUCU">Konghucu</option>
                               </select>
                           </div>

                            <div class="col-md-6">
                                <div class="form-check form-switch mt-4">
                                    <input class="form-check-input" type="checkbox" name="can_access_khusus" id="edit_can_access_khusus" value="1">
                                    <label class="form-check-label fw-bold" for="edit_can_access_khusus">
                                        <i class="ph ph-timer me-1 text-emerald-600"></i>Akses Absen Khusus
                                    </label>
                                    <small class="d-block text-muted" style="font-size: 11px;">Izinkan karyawan menggunakan fitur absen khusus (timer)</small>
                                </div>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label fw-semibold">Status Pernikahan</label>
                               <select name="status_pernikahan" id="edit_status_pernikahan" class="form-select">
                                   <option value="">-- Pilih Status --</option>
                                   <option value="BELUM_MENIKAH">Belum Menikah</option>
                                   <option value="MENIKAH">Menikah</option>
                                   <option value="CERAI">Cerai</option>
                               </select>
                           </div>

                           <hr class="mt-4 mb-1">
                           <h6 class="fw-bold text-muted mt-0 mb-2" style="font-size: 0.85rem;">UPDATE DOKUMEN
                               (KOSONGKAN JIKA TIDAK DIGANTI)</h6>

                           <div class="col-md-6">
                               <label class="form-label fw-semibold">Foto Profil</label>
                               <input type="file" name="foto_profil" accept="image/*" class="form-control">
                           </div>

                           <div class="col-md-6">
                               <label class="form-label fw-semibold">Foto KTP</label>
                               <input type="file" name="foto_ktp" class="form-control">
                           </div>

                           <div class="col-md-6">
                               <label class="form-label fw-semibold">Foto Ijazah</label>
                               <input type="file" name="foto_ijazah" class="form-control">
                           </div>

                           <div class="col-md-6">
                               <label class="form-label fw-semibold">Foto KK</label>
                               <input type="file" name="foto_kk" class="form-control">
                           </div>

                           <div class="col-md-6">
                               <label class="form-label fw-semibold">CV (Update PDF)</label>
                               <input type="file" name="cv_file" class="form-control">
                           </div>

                           <div class="col-md-6">
                               <label class="form-label fw-semibold">Sertifikat</label>
                               <input type="file" name="sertifikat_file" class="form-control">
                           </div>

                           <div class="col-md-12">
                               <label class="form-label fw-semibold">Alamat Lengkap</label>
                               <textarea name="alamat" id="edit_alamat" class="form-control" rows="3"></textarea>
                           </div>

                       </div>
                   </div>

                   <div class="modal-footer bg-light border-0">
                       <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal">
                           <i class="ph ph-x me-1"></i> Batal
                       </button>
                       <button type="submit" class="btn btn-warning px-4 shadow-sm fw-bold">
                           <i class="ph ph-floppy-disk me-1"></i> Simpan Perubahan
                       </button>
                   </div>
               </form>

           </div>
       </div>
   </div>

   <script>
       $('#formTambahKaryawan').submit(function(e) {
           e.preventDefault();

           let formData = new FormData(this);

           $.ajax({
               url: "{{ route('karyawan.store') }}",
               type: "POST",
               data: formData,
               contentType: false,
               processData: false,
               beforeSend: function() {
                   $('.btn-primary').prop('disabled', true);
               },
               success: function(res) {
                   $('#modalTambahKaryawan').modal('hide');

                   Swal.fire({
                       icon: 'success',
                       title: 'Berhasil',
                       text: 'Karyawan berhasil ditambahkan',
                       timer: 1500,
                       showConfirmButton: false
                   });

                   setTimeout(() => location.reload(), 1500);
               },
               error: function(xhr) {
                   $('.btn-primary').prop('disabled', false);

                   let errors = xhr.responseJSON.errors;
                   let msg = '';

                   $.each(errors, function(key, value) {
                       msg += value[0] + '<br>';
                   });

                   Swal.fire({
                       icon: 'error',
                       title: 'Gagal',
                       html: msg
                   });
               }
           });
       });


       $('#formEditKaryawan').on('submit', function(e) {
           e.preventDefault();

           let id = $('#edit_id').val();
           let url = `/karyawan/${id}`;
           let form = document.getElementById('formEditKaryawan');
           let data = new FormData(form);

           $.ajax({
               url: url,
               type: 'POST',
               data: data,
               processData: false,
               contentType: false,
               beforeSend: function() {
                   $('#btnUpdateKaryawan').prop('disabled', true);
               },
               success: function(res) {

                   $('#btnUpdateKaryawan').prop('disabled', false);
                   $('#modalEditKaryawan').modal('hide');

                   Swal.fire({
                       icon: 'success',
                       title: 'Berhasil',
                       text: res.message,
                       timer: 1500,
                       showConfirmButton: false
                   });

                   setTimeout(() => {
                       location.reload();
                   }, 1500);
               },
               error: function(xhr) {

                   $('#btnUpdateKaryawan').prop('disabled', false);

                   let msg = 'Terjadi kesalahan';
                   if (xhr.responseJSON?.errors) {
                       msg = '';
                       $.each(xhr.responseJSON.errors, function(key, val) {
                           msg += val[0] + '<br>';
                       });
                   }

                   Swal.fire({
                       icon: 'error',
                       title: 'Gagal',
                       html: msg
                   });
               }
           });
       });
   </script>
