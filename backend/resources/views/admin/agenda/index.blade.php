@extends('app')

@section('content')
    <div class="container-fluid px-4 py-4">
        <div class="d-flex align-items-center justify-content-between mb-4">
            <div>
                <h5 class="mb-0" style="font-weight: 700; font-size: 16px;">Data Agenda Karyawan</h5>
                <small class="text-muted">Riwayat agenda harian seluruh staf</small>
            </div>
        </div>

        <div class="rounded-3 mb-4">
            <div class="p-3 border-bottom" style="border-bottom-color: #f0f0f0 !important;">
                <form method="GET" action="" class="row g-2 align-items-end">
                    <div class="col-md-2">
                        <label class="form-label fw-semibold mb-1" style="font-size: 12px;">Cabang</label>
                        <select name="cabang_id" class="form-select form-select-sm">
                            <option value="">Semua Cabang</option>
                            @foreach($cabangs as $cabang)
                                <option value="{{ $cabang->id }}" {{ $cabang_id == $cabang->id ? 'selected' : '' }}>
                                    {{ $cabang->nama_cabang }}
                                </option>
                            @endforeach
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label fw-semibold mb-1" style="font-size: 12px;">Divisi</label>
                        <select name="divisi_id" class="form-select form-select-sm">
                            <option value="">Semua Divisi</option>
                            @foreach($divisis as $divisi)
                                <option value="{{ $divisi->id }}" {{ $divisi_id == $divisi->id ? 'selected' : '' }}>
                                    {{ $divisi->nama_divisi }}
                                </option>
                            @endforeach
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label fw-semibold mb-1" style="font-size: 12px;">Dari Tanggal</label>
                        <input type="date" name="start_date" class="form-control form-control-sm" value="{{ $start_date }}">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label fw-semibold mb-1" style="font-size: 12px;">Sampai Tanggal</label>
                        <input type="date" name="end_date" class="form-control form-control-sm" value="{{ $end_date }}">
                    </div>
                    <div class="col-md-2 d-flex gap-1">
                        <button type="submit" class="btn btn-dark btn-sm w-100">Filter</button>
                        <a href="{{ route('admin.agenda.index') }}" class="btn btn-outline-secondary btn-sm w-100">Reset</a>
                    </div>
                </form>
            </div>
        </div>

        <div class="rounded-3 ">
            <div class="p-3 border-bottom" style="border-bottom-color: #f0f0f0 !important;">
                <div class="d-flex align-items-center justify-content-between">
                    <span class="fw-semibold" style="font-size: 13px;"></span>
                    <span class="text-muted" style="font-size: 11px;">{{ $agendas->total() }} data</span>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-hover text-nowrap mb-0">
                    <thead>
                        <tr>
                            <th scope="col" class="text-center">No</th>
                            <th scope="col">Tanggal</th>
                            <th scope="col">Karyawan</th>
                            <th scope="col">Cabang</th>
                            <th scope="col">Divisi</th>
                            <th scope="col">Keterangan</th>
                            <th scope="col" class="text-center">Foto</th>
                            <th scope="col" class="text-center">Jam Absen</th>
                            <th scope="col" class="text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($agendas as $index => $agenda)
                        <tr>
                            <td class="text-center text-muted">{{ $index + 1 + ($agendas->currentPage() - 1) * $agendas->perPage() }}</td>
                            <td>
                                <span class="fw-medium" style="font-size: 13px;">{{ \Carbon\Carbon::parse($agenda->tanggal)->format('d M Y') }}</span>
                            </td>
                            <td>
                                <span class="fw-medium" style="font-size: 13px;">{{ $agenda->user->name ?? '-' }}</span>
                            </td>
                            <td>
                                @forelse($agenda->user->cabang as $cabang)
                                    <span class="badge bg-info-subtle text-info rounded-pill fw-normal px-2 py-1">{{ $cabang->nama_cabang }}</span>
                                @empty
                                    <span class="text-muted">-</span>
                                @endforelse
                            </td>
                            <td>{{ $agenda->user->divisi->nama_divisi ?? '-' }}</td>
                            <td style="max-width: 260px; min-width: 180px;">
                                <div style="white-space: pre-wrap; word-break: break-word; line-height: 1.6; font-size: 12px;">
                                    {{ $agenda->keterangan ?? '-' }}
                                </div>
                            </td>
                            <td class="text-center">
                                @if($agenda->foto)
                                <img src="{{ asset('uploads/agenda/'.$agenda->foto) }}" 
                                    class="rounded shadow-sm" style="width: 30px; height: 30px; object-fit: cover;">
                                @else
                                <span class="text-muted">—</span>
                                @endif
                            </td>
                            <td class="text-center">
                                @if($agenda->jam_absen_masuk)
                                    <span class="text-success">{{ \Carbon\Carbon::parse($agenda->jam_absen_masuk)->format('H:i') }}</span>
                                @endif
                                @if($agenda->jam_absen_keluar)
                                    <span class="text-danger"> - {{ \Carbon\Carbon::parse($agenda->jam_absen_keluar)->format('H:i') }}</span>
                                @endif
                            </td>
                            <td class="text-center">
                                @php
                                    $statusBadge = match(true) {
                                        $agenda->status_absen == 'hadir' && $agenda->jam_absen_keluar => 'bg-success-subtle text-success',
                                        $agenda->status_absen == 'hadir' => 'bg-primary-subtle text-primary',
                                        default => 'bg-secondary-subtle text-secondary',
                                    };
                                @endphp
                                <span class="badge rounded-pill {{ $statusBadge }} fw-normal px-2 py-1">
                                    {{ $agenda->status_absen == 'hadir' && $agenda->jam_absen_keluar ? 'Selesai' : ($agenda->status_absen == 'hadir' ? 'Hadir' : 'Terjadwal') }}
                                </span>
                            </td>
                        </tr>
                        @empty
                        <tr>
                            <td colspan="9" class="text-center text-muted py-4">
                                <i class="ph ph-file-text d-block fs-2 mb-2"></i>
                                Tidak ada data agenda
                            </td>
                        </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>

            @if ($agendas->hasPages())
            <div class="d-flex justify-content-between align-items-center px-4 py-3 border-top">
                <small class="text-muted">
                    Menampilkan {{ $agendas->firstItem() }}–{{ $agendas->lastItem() }}
                    dari {{ $agendas->total() }} data
                </small>
                {{ $agendas->appends(['cabang_id' => $cabang_id, 'divisi_id' => $divisi_id, 'start_date' => $start_date, 'end_date' => $end_date])->links('pagination::bootstrap-5') }}
            </div>
            @endif
        </div>
    </div>
@endsection
