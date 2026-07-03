@extends('app')

@section('content')
    <div class="container-fluid px-4 py-4">
        <div class="d-flex align-items-center justify-content-between mb-4">
            <div>
                <h5 class="mb-0" style="font-weight: 700; font-size: 16px;">Kelas Sensei</h5>
                <small class="text-muted">Daftar kelas yang dibuat oleh Sensei</small>
            </div>
        </div>

        <div class="rounded-3 mb-4">
            <div class="p-3 border-bottom" style="border-bottom-color: #f0f0f0 !important;">
                <form method="GET" action="">
                    <div class="row g-2 align-items-end">
                        <div class="col-md-2">
                            <label class="form-label fw-semibold mb-1" style="font-size: 12px;">Dari Tanggal</label>
                            <input type="date" name="start_date" class="form-control form-control-sm"
                                   value="{{ $start_date ?? '' }}">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label fw-semibold mb-1" style="font-size: 12px;">Sampai Tanggal</label>
                            <input type="date" name="end_date" class="form-control form-control-sm"
                                   value="{{ $end_date ?? '' }}">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label fw-semibold mb-1" style="font-size: 12px;">Sensei</label>
                            <select name="user_id" class="form-select form-select-sm">
                                <option value="">Semua Sensei</option>
                                @foreach ($list_sensei as $sensei)
                                    <option value="{{ $sensei->id }}"
                                        {{ $user_id_selected == $sensei->id ? 'selected' : '' }}>
                                        {{ $sensei->name }}
                                    </option>
                                @endforeach
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label fw-semibold mb-1" style="font-size: 12px;">Batch</label>
                            <select name="batch_id" class="form-select form-select-sm">
                                <option value="">Semua Batch</option>
                                @foreach ($list_batch as $batch)
                                    <option value="{{ $batch->id }}"
                                        {{ $batch_id_selected == $batch->id ? 'selected' : '' }}>
                                        {{ $batch->nama_batch }}
                                    </option>
                                @endforeach
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label fw-semibold mb-1" style="font-size: 12px;">Status</label>
                            <select name="status" class="form-select form-select-sm">
                                <option value="">Semua Status</option>
                                <option value="aktif" {{ $status_selected == 'aktif' ? 'selected' : '' }}>Aktif</option>
                                <option value="selesai" {{ $status_selected == 'selesai' ? 'selected' : '' }}>Selesai</option>
                                <option value="dibatalkan" {{ $status_selected == 'dibatalkan' ? 'selected' : '' }}>Dibatalkan</option>
                            </select>
                        </div>
                        <div class="col-md-2 d-flex gap-1">
                            <button type="submit" class="btn btn-dark btn-sm w-100">
                                <i class="ph ph-magnifying-glass me-1"></i> Filter
                            </button>
                            <a href="{{ url()->current() }}" class="btn btn-outline-secondary btn-sm">
                                <i class="ph ph-arrow-counter-clockwise"></i>
                            </a>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        @if($kelas->count() > 0)
        <div class="">
            <div class="p-3 border-bottom" style="border-bottom-color: #f0f0f0 !important;">
                <div class="d-flex align-items-center justify-content-between">
                    <span class="fw-semibold" style="font-size: 13px;"></span>
                    <span class="text-muted" style="font-size: 11px;">{{ $kelas->count() }} data</span>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-hover text-nowrap mb-0">
                    <thead>
                        <tr>
                            <th scope="col" class="text-center" style="width: 50px;">No</th>
                            <th scope="col">Nama Kelas</th>
                            <th scope="col">Batch</th>
                            <th scope="col">Level</th>
                            <th scope="col">Nama Sensei</th>
                            <th scope="col">Tanggal Mulai</th>
                            <th scope="col">Tanggal Selesai</th>
                            <th scope="col" class="text-center">Total Pertemuan</th>
                            <th scope="col" class="text-center">Absen Terisi</th>
                            <th scope="col" class="text-center">Alpa</th>
                            <th scope="col" class="text-center">Izin</th>
                            <th scope="col">Status</th>
                            <th scope="col" class="text-center" style="width: 80px;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        @php $no = 1; @endphp
                        @foreach($kelas as $kelasItem)
                            <tr>
                                <td class="text-center text-muted">{{ $no++ }}</td>
                                <td>
                                    <span class="fw-medium" style="font-size: 13px;">{{ $kelasItem->nama_kelas }}</span>
                                </td>
                                <td>
                                    <span class="badge bg-info-subtle text-info rounded-pill fw-normal px-2 py-1">{{ $kelasItem->batchRelasi->nama_batch ?? '-' }}</span>
                                </td>
                                <td>
                                    <span class="badge bg-secondary-subtle text-secondary rounded-pill fw-normal px-2 py-1">{{ $kelasItem->level }}</span>
                                </td>
                                <td>{{ $kelasItem->user->name ?? '-' }}</td>
                                <td>{{ \Carbon\Carbon::parse($kelasItem->tanggal_mulai)->format('d M Y') }}</td>
                                <td>{{ \Carbon\Carbon::parse($kelasItem->tanggal_selesai)->format('d M Y') }}</td>
                                <td class="text-center">{{ $kelasItem->total_pertemuan }}</td>
                                <td class="text-center">{{ $kelasItem->jumlah_absen }}</td>
                                <td class="text-center">{{ $kelasItem->jumlah_alpa ?? 0 }}</td>
                                <td class="text-center">{{ $kelasItem->jumlah_izin ?? 0 }}</td>
                                <td>
                                    @php
                                        $badgeClass = [
                                            'aktif' => 'bg-success-subtle text-success',
                                            'selesai' => 'bg-primary-subtle text-primary',
                                            'dibatalkan' => 'bg-danger-subtle text-danger',
                                        ];
                                        $class = $badgeClass[$kelasItem->status] ?? 'bg-light text-muted';
                                    @endphp
                                    <span class="badge rounded-pill {{ $class }} fw-normal px-2 py-1">
                                        {{ ucfirst($kelasItem->status) }}
                                    </span>
                                </td>
                                <td class="text-center">
                                    <form method="POST" action="{{ route('kelas-sensei.destroy', $kelasItem->id) }}" class="delete-form-{{ $kelasItem->id }}">
                                        @csrf
                                        @method('DELETE')
                                        <button type="button" class="btn btn-sm btn-outline-secondary border-0 delete-btn" data-id="{{ $kelasItem->id }}">
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
        @endif
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Handle delete buttons with SweetAlert
            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', function(e) {
                    const classId = this.getAttribute('data-id');
                    const form = document.querySelector(`.delete-form-${classId}`);
                    
                    Swal.fire({
                        title: 'Apakah Anda yakin?',
                        text: "Kelas ini akan dihapus secara permanen!",
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Ya, hapus!',
                        cancelButtonText: 'Batal'
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
