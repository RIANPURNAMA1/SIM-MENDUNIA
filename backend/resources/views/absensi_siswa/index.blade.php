@extends('app')

@section('content')
<div class="container-fluid px-4 py-4">
    <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
            <h5 class="mb-0" style="font-weight: 700; font-size: 16px;">Absensi Siswa</h5>
            <small class="text-muted">Data kehadiran siswa harian</small>
        </div>
        <div class="d-flex gap-2">
            <button class="btn btn-success btn-sm" data-bs-toggle="modal" data-bs-target="#modalAbsensiMassal">
                <i class="ph ph-check-square me-1"></i> Absensi Massal
            </button>
            <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#modalAbsensiManual">
                <i class="ph ph-plus-circle me-1"></i> Input Manual
            </button>
        </div>
    </div>

    <form method="GET" class="mb-4">
        <div class="row g-2 align-items-end">
            <div class="col-auto">
                <label class="form-label fw-semibold mb-1" style="font-size: 12px;">Tanggal</label>
                <input type="date" name="tanggal" class="form-control form-control-sm" value="{{ request('tanggal', now()->toDateString()) }}" onchange="this.form.submit()">
            </div>
            <div class="col-auto">
                <label class="form-label fw-semibold mb-1" style="font-size: 12px;">Kelas</label>
                <select name="kelas_sensei_id" class="form-select form-select-sm" onchange="this.form.submit()">
                    <option value="">Semua Kelas</option>
                    @foreach ($kelasList as $k)
                        <option value="{{ $k->id }}" {{ request('kelas_sensei_id') == $k->id ? 'selected' : '' }}>
                            {{ $k->nama_kelas }} - Level {{ $k->level }} ({{ $k->user->name ?? $k->user->nama ?? '-' }}) - {{ $k->batchRelasi->nama_batch ?? '-' }}
                        </option>
                    @endforeach
                </select>
            </div>
            <div class="col-auto">
                <label class="form-label fw-semibold mb-1" style="font-size: 12px;">Status</label>
                <select name="status" class="form-select form-select-sm" onchange="this.form.submit()">
                    <option value="">Semua Status</option>
                    <option value="HADIR" {{ request('status') == 'HADIR' ? 'selected' : '' }}>HADIR</option>
                    <option value="TERLAMBAT" {{ request('status') == 'TERLAMBAT' ? 'selected' : '' }}>TERLAMBAT</option>
                    <option value="IZIN" {{ request('status') == 'IZIN' ? 'selected' : '' }}>IZIN</option>
                    <option value="SAKIT" {{ request('status') == 'SAKIT' ? 'selected' : '' }}>SAKIT</option>
                    <option value="ALPA" {{ request('status') == 'ALPA' ? 'selected' : '' }}>ALPA</option>
                    <option value="LIBUR" {{ request('status') == 'LIBUR' ? 'selected' : '' }}>LIBUR</option>
                </select>
            </div>
            <div class="col-auto">
                <a href="{{ route('absensi-siswa.index') }}" class="btn btn-outline-secondary btn-sm"><i class="ph ph-arrow-counter-clockwise me-1"></i>Reset</a>
            </div>
        </div>
    </form>

    <div class="rounded-3">
        <div class="p-3 border-bottom" style="border-bottom-color: #f0f0f0 !important;">
            <div class="d-flex align-items-center justify-content-between">
                <span class="fw-semibold" style="font-size: 13px;">Tanggal: {{ request('tanggal', now()->format('d/m/Y')) }}</span>
                <span class="text-muted" style="font-size: 11px;">{{ $absensi->count() }} data</span>
            </div>
        </div>
        <div class="table-responsive">
            <table class="table table-hover text-nowrap mb-0">
                <thead>
                    <tr>
                        <th scope="col">Siswa</th>
                        <th scope="col">Kelas</th>
                        <th scope="col" class="text-center">Jam Masuk</th>
                        <th scope="col" class="text-center">Jam Pulang</th>
                        <th scope="col" class="text-center">Status</th>
                        <th scope="col">Keterangan</th>
                        <th scope="col" class="text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($absensi as $a)
                        <tr>
                            <td>
                                <div class="d-flex align-items-center gap-2">
                                    <img src="{{ $a->siswa->foto && file_exists(public_path('uploads/siswa/' . $a->siswa->foto))
                                        ? asset('uploads/siswa/' . $a->siswa->foto)
                                        : 'https://ui-avatars.com/api/?name=' . urlencode($a->siswa->nama) . '&background=e5e7eb&color=6b7280&size=32' }}"
                                        class="rounded-circle" style="width: 28px; height: 28px; object-fit: cover;">
                                    <span class="fw-medium" style="font-size: 13px;">{{ $a->siswa->nama }}</span>
                                </div>
                            </td>
                            <td><span class="badge bg-info">{{ $a->siswa->kelasRelasi->nama_kelas ?? $a->siswa->kelas }}</span></td>
                            <td class="text-center">{{ $a->jam_masuk ? \Carbon\Carbon::parse($a->jam_masuk)->format('H:i') : '-' }}</td>
                            <td class="text-center">{{ $a->jam_keluar ? \Carbon\Carbon::parse($a->jam_keluar)->format('H:i') : '-' }}</td>
                            <td class="text-center">
                                @if ($a->status === 'HADIR')
                                    <span class="badge bg-success">HADIR</span>
                                @elseif ($a->status === 'TERLAMBAT')
                                    <span class="badge bg-warning text-dark">TERLAMBAT</span>
                                @elseif ($a->status === 'IZIN')
                                    <span class="badge bg-primary">IZIN</span>
                                @elseif ($a->status === 'SAKIT')
                                    <span class="badge bg-info text-dark">SAKIT</span>
                                @elseif ($a->status === 'ALPA')
                                    <span class="badge bg-danger">ALPA</span>
                                @elseif ($a->status === 'LIBUR')
                                    <span class="badge bg-secondary">LIBUR</span>
                                @endif
                            </td>
                            <td>{{ $a->keterangan ?? '-' }}</td>
                            <td class="text-center">
                                <button class="btn btn-sm btn-outline-warning edit-absensi"
                                    data-id="{{ $a->id }}"
                                    data-jam-masuk="{{ $a->jam_masuk }}"
                                    data-jam-keluar="{{ $a->jam_keluar }}"
                                    data-status="{{ $a->status }}"
                                    data-keterangan="{{ $a->keterangan }}">
                                    <i class="ph ph-pencil-simple"></i>
                                </button>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="7" class="text-center text-muted py-4">Belum ada data absensi untuk tanggal ini</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Modal Input Manual -->
<div class="modal fade" id="modalAbsensiManual" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <form id="formAbsensiManual">
                @csrf
                <div class="modal-header">
                    <h6 class="modal-title">Input Absensi Manual</h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">Siswa <span class="text-danger">*</span></label>
                        <select name="siswa_id" class="form-select form-select-sm" required>
                            <option value="">- Pilih Siswa -</option>
                            @foreach (\App\Models\Siswa::where('status', 'AKTIF')->orderBy('nama')->get() as $s)
                                <option value="{{ $s->id }}">{{ $s->nama }} ({{ $s->kelasRelasi->nama_kelas ?? $s->kelas }})</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Tanggal <span class="text-danger">*</span></label>
                            <input type="date" name="tanggal" class="form-control form-control-sm" value="{{ now()->toDateString() }}" required>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Jam Masuk</label>
                            <input type="time" name="jam_masuk" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Jam Pulang</label>
                            <input type="time" name="jam_keluar" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Status <span class="text-danger">*</span></label>
                            <select name="status" class="form-select form-select-sm" required>
                                <option value="HADIR">HADIR</option>
                                <option value="TERLAMBAT">TERLAMBAT</option>
                                <option value="IZIN">IZIN</option>
                                <option value="SAKIT">SAKIT</option>
                                <option value="ALPA">ALPA</option>
                                <option value="LIBUR">LIBUR</option>
                            </select>
                        </div>
                        <div class="col-12">
                            <label class="form-label">Keterangan</label>
                            <textarea name="keterangan" class="form-control form-control-sm" rows="2"></textarea>
                        </div>
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

<!-- Modal Absensi Massal -->
<div class="modal fade" id="modalAbsensiMassal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <form id="formAbsensiMassal">
                @csrf
                <div class="modal-header">
                    <h6 class="modal-title">Absensi Massal per Kelas</h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row g-3 mb-3">
                        <div class="col-md-4">
                            <label class="form-label">Kelas <span class="text-danger">*</span></label>
                            <select id="massal_kelas" class="form-select form-select-sm" required>
                                <option value="">- Pilih Kelas -</option>
                                @foreach ($kelasList as $k)
                                    <option value="{{ $k->id }}">{{ $k->nama_kelas }} - Level {{ $k->level }} ({{ $k->user->name ?? $k->user->nama ?? '-' }}) - {{ $k->batchRelasi->nama_batch ?? '-' }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Tanggal <span class="text-danger">*</span></label>
                            <input type="date" id="massal_tanggal" class="form-control form-control-sm" value="{{ now()->toDateString() }}">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Jam Masuk</label>
                            <input type="time" id="massal_jam_masuk" class="form-control form-control-sm" value="07:30">
                        </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-info mb-3" id="btnLoadSiswa">
                        <i class="ph ph-arrow-clockwise me-1"></i> Load Siswa
                    </button>
                    <div class="table-responsive">
                        <table class="table table-bordered table-sm" id="tableMassal">
                            <thead>
                                <tr>
                                    <th>Nama</th>
                                    <th>Status</th>
                                    <th>Keterangan</th>
                                </tr>
                            </thead>
                            <tbody id="massalBody">
                                <tr><td colspan="3" class="text-center text-muted">Pilih kelas dan klik "Load Siswa"</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Batal</button>
                    <button type="submit" class="btn btn-sm btn-success">Simpan Semua</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Modal Edit -->
<div class="modal fade" id="modalEditAbsensi" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <form id="formEditAbsensi">
                @csrf
                @method('PUT')
                <input type="hidden" name="id" id="edit_absensi_id">
                <div class="modal-header">
                    <h6 class="modal-title">Edit Absensi</h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Jam Masuk</label>
                            <input type="time" name="jam_masuk" id="edit_jam_masuk" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Jam Pulang</label>
                            <input type="time" name="jam_keluar" id="edit_jam_keluar" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Status <span class="text-danger">*</span></label>
                            <select name="status" id="edit_status" class="form-select form-select-sm" required>
                                <option value="HADIR">HADIR</option>
                                <option value="TERLAMBAT">TERLAMBAT</option>
                                <option value="IZIN">IZIN</option>
                                <option value="SAKIT">SAKIT</option>
                                <option value="ALPA">ALPA</option>
                                <option value="LIBUR">LIBUR</option>
                            </select>
                        </div>
                        <div class="col-12">
                            <label class="form-label">Keterangan</label>
                            <textarea name="keterangan" id="edit_keterangan" class="form-control form-control-sm" rows="2"></textarea>
                        </div>
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
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script>
$(document).ready(function() {
    $('#formAbsensiManual').on('submit', function(e) {
        e.preventDefault();
        var data = $(this).serialize();
        $.ajax({
            url: '{{ route("absensi-siswa.store") }}',
            type: 'POST',
            data: data,
            success: function(res) {
                Swal.fire({ icon: 'success', title: 'Berhasil', text: res.message, timer: 1500, showConfirmButton: false });
                $('#modalAbsensiManual').modal('hide');
                setTimeout(() => location.reload(), 1500);
            },
            error: function(xhr) {
                var msg = xhr.responseJSON?.message || 'Gagal menyimpan';
                Swal.fire({ icon: 'error', title: 'Gagal', text: msg });
            }
        });
    });

    $('#btnLoadSiswa').on('click', function() {
        var kelas = $('#massal_kelas').val();
        if (!kelas) {
            Swal.fire({ icon: 'warning', title: 'Pilih kelas terlebih dahulu' });
            return;
        }
        $.ajax({
            url: '{{ route("absensi-siswa.siswa-by-kelas") }}',
            type: 'GET',
            data: { kelas_id: kelas },
            success: function(data) {
                var html = '';
                var tanggal = $('#massal_tanggal').val();
                data.forEach(function(s) {
                    html += '<tr>';
                    html += '<td>' + s.nama + '</td>';
                    html += '<td>';
                    html += '<select name="data[' + s.id + '][status]" class="form-select form-select-sm">';
                    html += '<option value="HADIR">HADIR</option>';
                    html += '<option value="TERLAMBAT">TERLAMBAT</option>';
                    html += '<option value="IZIN">IZIN</option>';
                    html += '<option value="SAKIT">SAKIT</option>';
                    html += '<option value="ALPA">ALPA</option>';
                    html += '<option value="LIBUR">LIBUR</option>';
                    html += '</select>';
                    html += '<input type="hidden" name="data[' + s.id + '][siswa_id]" value="' + s.id + '">';
                    html += '</td>';
                    html += '<td><input type="text" name="data[' + s.id + '][keterangan]" class="form-control form-control-sm" placeholder="Opsional"></td>';
                    html += '</tr>';
                });
                $('#massalBody').html(html);
            }
        });
    });

    $('#formAbsensiMassal').on('submit', function(e) {
        e.preventDefault();
        var tanggal = $('#massal_tanggal').val();
        var jamMasuk = $('#massal_jam_masuk').val();
        var dataArray = [];

        $('#massalBody tr').each(function() {
            var siswaId = $(this).find('input[name*="[siswa_id]"]').val();
            var status = $(this).find('select[name*="[status]"]').val();
            var keterangan = $(this).find('input[name*="[keterangan]"]').val();
            if (siswaId) {
                dataArray.push({
                    siswa_id: siswaId,
                    status: status,
                    keterangan: keterangan || ''
                });
            }
        });

        if (dataArray.length === 0) {
            Swal.fire({ icon: 'warning', title: 'Tidak ada data siswa' });
            return;
        }

        $.ajax({
            url: '{{ route("absensi-siswa.mass") }}',
            type: 'POST',
            data: {
                _token: '{{ csrf_token() }}',
                tanggal: tanggal,
                jam_masuk: jamMasuk,
                data: dataArray
            },
            success: function(res) {
                Swal.fire({ icon: 'success', title: 'Berhasil', text: res.message, timer: 1500, showConfirmButton: false });
                $('#modalAbsensiMassal').modal('hide');
                setTimeout(() => location.reload(), 1500);
            },
            error: function(xhr) {
                var msg = xhr.responseJSON?.message || 'Gagal menyimpan';
                Swal.fire({ icon: 'error', title: 'Gagal', text: msg });
            }
        });
    });

    $(document).on('click', '.edit-absensi', function() {
        var btn = $(this);
        $('#edit_absensi_id').val(btn.data('id'));
        $('#edit_jam_masuk').val(btn.data('jam-masuk'));
        $('#edit_jam_keluar').val(btn.data('jam-keluar'));
        $('#edit_status').val(btn.data('status'));
        $('#edit_keterangan').val(btn.data('keterangan'));
        $('#modalEditAbsensi').modal('show');
    });

    $('#formEditAbsensi').on('submit', function(e) {
        e.preventDefault();
        var id = $('#edit_absensi_id').val();
        var data = $(this).serialize();
        $.ajax({
            url: '/absensi-siswa/' + id,
            type: 'POST',
            data: data + '&_method=PUT',
            success: function(res) {
                Swal.fire({ icon: 'success', title: 'Berhasil', text: res.message, timer: 1500, showConfirmButton: false });
                $('#modalEditAbsensi').modal('hide');
                setTimeout(() => location.reload(), 1500);
            },
            error: function(xhr) {
                var msg = xhr.responseJSON?.message || 'Gagal mengupdate';
                Swal.fire({ icon: 'error', title: 'Gagal', text: msg });
            }
        });
    });
});
</script>
@endpush
