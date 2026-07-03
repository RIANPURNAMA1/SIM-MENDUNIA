@extends('app')

@section('content')
<link rel="stylesheet" href="https://cdn.datatables.net/1.13.8/css/dataTables.bootstrap5.min.css">
<div class="container-fluid px-4 py-4">
    <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
            <h5 class="mb-0" style="font-weight: 700; font-size: 16px;">Data Karyawan</h5>
            <small class="text-muted">Master data seluruh karyawan</small>
        </div>
        <div class="d-flex gap-2">
            <button class="btn btn-success btn-sm" data-bs-toggle="modal" data-bs-target="#modalTambahKaryawan">
                <i class="ph ph-plus-circle me-1"></i> Tambah
            </button>
            <button class="btn btn-outline-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#modalAturShift">
                <i class="ph ph-calendar-plus me-1"></i> Atur Shift
            </button>
        </div>
    </div>

    <form action="{{ route('karyawan.index') }}" method="GET" class="mb-4">
        <div class="row g-2">
            <div class="col-auto">
                <select name="cabang_id" class="form-select form-select-sm" onchange="this.form.submit()">
                    <option value="">Semua Cabang</option>
                    @foreach ($cabang as $c)
                        <option value="{{ $c->id }}" {{ request('cabang_id') == $c->id ? 'selected' : '' }}>{{ $c->nama_cabang }}</option>
                    @endforeach
                </select>
            </div>
            <div class="col-auto">
                <select name="divisi_id" class="form-select form-select-sm" onchange="this.form.submit()">
                    <option value="">Semua Divisi</option>
                    @foreach ($divisi as $d)
                        <option value="{{ $d->id }}" {{ request('divisi_id') == $d->id ? 'selected' : '' }}>{{ $d->nama_divisi }}</option>
                    @endforeach
                </select>
            </div>
            <div class="col-auto">
                <button type="submit" class="btn btn-dark btn-sm"><i class="ph ph-funnel me-1"></i>Filter</button>
            </div>
            <div class="col-auto">
                <a href="{{ route('karyawan.index') }}" class="btn btn-outline-secondary btn-sm"><i class="ph ph-arrow-counter-clockwise me-1"></i>Reset</a>
            </div>
        </div>
    </form>

    <div class=" rounded-3">
        <div class="p-3 border-bottom" style="border-bottom-color: #f0f0f0 !important;">
            <div class="d-flex align-items-center justify-content-between">
                <span class="fw-semibold" style="font-size: 13px;"></span>
                <span class="text-muted" style="font-size: 11px;">{{ $karyawan->count() }} data</span>
            </div>
        </div>
        <div class="table-responsive">
            <table id="karyawanTable" class="table table-hover text-nowrap mb-0">
                <thead class="">
                    <tr>
                        <th scope="col">Karyawan</th>
                        <th scope="col">Cabang</th>
                        <th scope="col">Departemen</th>
                        <th scope="col">Jabatan</th>
                        <th scope="col" class="text-center">L/P</th>
                        <th scope="col" class="text-center">Status Kerja</th>
                        <th scope="col" class="text-center">Akun</th>
                        <th scope="col" class="text-center">Absen Khusus</th>
                        <th scope="col" class="text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($karyawan as $k)
                        <tr>
                            <td>
                                <div class="d-flex align-items-center gap-2">
                                    <img src="{{ $k->foto_profil && file_exists(public_path('uploads/foto_profil/' . $k->foto_profil))
                                        ? asset('uploads/foto_profil/' . $k->foto_profil)
                                        : 'https://ui-avatars.com/api/?name=' . urlencode($k->name) . '&background=e5e7eb&color=6b7280&size=32' }}"
                                        class="rounded-circle" style="width: 28px; height: 28px; object-fit: cover;">
                                    <div>
                                        <span class="fw-medium" style="font-size: 13px;">{{ $k->name }}</span>
                                        <small class="d-block text-muted">{{ $k->nip }}</small>
                                    </div>
                                </div>
                            </td>
                            <td class="text-muted">
                                @if ($k->cabang && $k->cabang->count() > 0)
                                    @foreach ($k->cabang as $c)
                                        <div>{{ $c->nama_cabang }}</div>
                                    @endforeach
                                @else
                                    <span class="text-muted">-</span>
                                @endif
                            </td>
                            <td class="text-muted">{{ $k->divisi?->nama_divisi ?? '-' }}</td>
                            <td class="text-muted">{{ $k->jabatan }}</td>
                            <td class="text-center">
                                <span class="{{ $k->jenis_kelamin == 'L' ? 'text-primary' : 'text-danger' }} fw-semibold">{{ $k->jenis_kelamin }}</span>
                            </td>
                            <td class="text-center">
                                @php
                                    $badge = match($k->status_kerja) {
                                        'TETAP' => 'bg-success-subtle text-success',
                                        'KONTRAK' => 'bg-warning-subtle text-warning',
                                        default => 'bg-info-subtle text-info',
                                    };
                                    $label = match($k->status_kerja) {
                                        'TETAP' => 'Tetap',
                                        'KONTRAK' => 'Kontrak',
                                        default => 'Magang',
                                    };
                                @endphp
                                <span class="badge {{ $badge }} rounded-pill fw-normal px-2 py-1">{{ $label }}</span>
                            </td>
                            <td class="text-center">
                                <div class="form-check form-switch d-inline-block m-0">
                                    <input class="form-check-input toggle-status" type="checkbox" role="switch"
                                        data-id="{{ $k->id }}"
                                        {{ $k->status === 'AKTIF' ? 'checked' : '' }}>
                                </div>
                                <br>
                                <small class="text-{{ $k->status === 'AKTIF' ? 'success' : 'danger' }} fw-semibold" style="font-size: 10px;">{{ $k->status }}</small>
                            </td>
                            <td class="text-center">
                                <div class="form-check form-switch d-inline-block m-0">
                                    <input class="form-check-input toggle-khusus" type="checkbox" role="switch"
                                        data-id="{{ $k->id }}"
                                        {{ $k->can_access_khusus ? 'checked' : '' }}>
                                </div>
                            </td>
                            <td class="text-center">
                                <div class="d-flex gap-1 justify-content-center">
                                    <a href="{{ route('karyawan.show', $k->id) }}" class="btn btn-sm btn-outline-secondary border-0" title="Detail">
                                        <i class="ph ph-eye"></i>
                                    </a>
                                    <a href="javascript:void(0)" class="btn btn-sm btn-outline-secondary border-0" title="Edit"
                                        onclick="editKaryawan('{{ $k->id }}','{{ $k->nik }}','{{ $k->nip }}','{{ $k->name }}','{{ $k->jabatan }}','{{ $k->pendidikan_terakhir }}','{{ $k->divisi_id }}','{{ json_encode($k->cabang_ids) }}','{{ json_encode($k->shift_ids) }}','{{ $k->status_kerja }}','{{ $k->no_hp }}','{{ $k->email }}','{{ $k->tanggal_masuk }}','{{ $k->tempat_lahir }}','{{ $k->tanggal_lahir }}','{{ $k->jenis_kelamin }}','{{ $k->agama }}','{{ $k->status_pernikahan }}','{{ $k->alamat }}','{{ $k->can_access_khusus }}')">
                                        <i class="ph ph-note-pencil"></i>
                                    </a>
                                    <a href="javascript:void(0)" class="btn btn-sm btn-outline-secondary border-0" title="Hapus"
                                        onclick="deleteKaryawan({{ $k->id }})">
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

@include('karyawan.modal')
@include('karyawan.shift-jadwal-modal')

<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdn.datatables.net/1.13.8/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.datatables.net/1.13.8/js/dataTables.bootstrap5.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

<script>
$(function () {
    $('#karyawanTable').DataTable({
        responsive: true,
        autoWidth: false,
        pageLength: 10,
        lengthMenu: [10, 25, 50, 100],
        order: [[0, 'asc']],
        language: {
            search: "Cari:",
            lengthMenu: "Tampilkan _MENU_ data",
            info: "Menampilkan _START_–_END_ dari _TOTAL_ data",
            zeroRecords: "Data tidak ditemukan",
            paginate: { first: "Awal", last: "Akhir", next: "›", previous: "‹" }
        }
    });
});

function editKaryawan(
    id, nik, nip, name, jabatan, pendidikan_terakhir, divisi_id, cabang_ids, shift_ids, status_kerja,
    no_hp, email, tanggal_masuk,
    tempat_lahir, tanggal_lahir, jenis_kelamin, agama, status_pernikahan, alamat,
    can_access_khusus
) {
    $('#edit_id').val(id);
    $('#edit_nik').val(nik);
    $('#edit_nip').val(nip);
    $('#edit_name').val(name);
    $('#edit_jabatan').val(jabatan);
    $('#edit_pendidikan_terakhir').val(pendidikan_terakhir);
    $('#edit_divisi').val(divisi_id);

    const cabangArr = typeof cabang_ids === 'string' ? JSON.parse(cabang_ids) : cabang_ids;
    $('#edit_cabang').val(cabangArr).trigger('change');

    const shiftArr = typeof shift_ids === 'string' ? JSON.parse(shift_ids) : shift_ids;
    $('.edit-shift-checkbox').prop('checked', false);
    if (shiftArr && Array.isArray(shiftArr)) {
        shiftArr.forEach(function(shiftId) {
            $('.edit-shift-checkbox[value="' + shiftId + '"]').prop('checked', true);
        });
    }

    $('#edit_status_kerja').val(status_kerja);
    $('#edit_no_hp').val(no_hp);
    $('#edit_email').val(email);
    $('#edit_tanggal_masuk').val(tanggal_masuk);
    $('#edit_tempat_lahir').val(tempat_lahir);
    $('#edit_tanggal_lahir').val(tanggal_lahir);
    $('#edit_jenis_kelamin').val(jenis_kelamin);
    $('#edit_agama').val(agama);
    $('#edit_status_pernikahan').val(status_pernikahan);
    $('#edit_alamat').val(alamat);

    $('#edit_can_access_khusus').prop('checked', can_access_khusus === '1' || can_access_khusus === true);

    $('#formEditKaryawan').attr('action', '/karyawan/' + id);
    $('#modalEditKaryawan').modal('show');
}

$(document).on('change', '.toggle-status', function() {
    var id = $(this).data('id');
    var cb = this;
    $.ajax({
        url: '/karyawan/' + id + '/toggle-status',
        type: 'POST',
        data: { _token: '{{ csrf_token() }}' },
        success: function(res) {
            var label = $(cb).closest('td').find('small');
            if (res.user_status === 'AKTIF') {
                label.text('AKTIF').removeClass('text-danger').addClass('text-success');
            } else {
                label.text('NONAKTIF').removeClass('text-success').addClass('text-danger');
            }
            Swal.fire({
                icon: 'success',
                title: 'Berhasil',
                text: res.message,
                timer: 1200,
                showConfirmButton: false
            });
        },
        error: function() {
            $(cb).prop('checked', !$(cb).prop('checked'));
            Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan' });
        }
    });
});

$(document).on('change', '.toggle-khusus', function() {
    var id = $(this).data('id');
    var cb = this;
    $.ajax({
        url: '/karyawan/' + id + '/toggle-khusus',
        type: 'POST',
        data: { _token: '{{ csrf_token() }}' },
        success: function(res) {
            Swal.fire({
                icon: 'success',
                title: 'Berhasil',
                text: res.message,
                timer: 1200,
                showConfirmButton: false
            });
        },
        error: function() {
            $(cb).prop('checked', !$(cb).prop('checked'));
            Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan' });
        }
    });
});

function deleteKaryawan(id) {
    Swal.fire({
        title: 'Hapus karyawan?',
        text: 'Data yang dihapus tidak bisa dikembalikan',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `/karyawan/${id}`,
                type: 'POST',
                data: { _token: '{{ csrf_token() }}', _method: 'DELETE' },
                success: function(res) {
                    Swal.fire({ icon: 'success', title: 'Berhasil', text: res.message, timer: 1500, showConfirmButton: false });
                    setTimeout(() => location.reload(), 1500);
                },
                error: function() {
                    Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan saat menghapus data' });
                }
            });
        }
    });
}
</script>
@endsection