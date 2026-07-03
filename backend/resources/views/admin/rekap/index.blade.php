@extends('app')

@section('content')
    <link rel="stylesheet" href="https://cdn.datatables.net/1.13.8/css/dataTables.bootstrap5.min.css">
    <link rel="stylesheet" href="https://cdn.datatables.net/buttons/2.4.2/css/buttons.bootstrap5.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css">

    <style>
        #rekapTable {
            border-collapse: collapse;
            border: 1px solid #dee2e6;
            font-size: 0.85rem;
        }
        #rekapTable thead th {
            background-color: #fff !important;
            color: #212529 !important;
            font-weight: 700;
            padding: 10px 8px;
            border: 1px solid #dee2e6;
            vertical-align: middle;
        }
        #rekapTable tbody td {
            border: 1px solid #dee2e6;
            padding: 8px;
            vertical-align: middle;
        }
        #rekapTable tbody tr:hover { background-color: #f8f9fa !important; }
        .text-xs { font-size: 0.75rem; }
    </style>

    <div class="container-fluid px-4 py-4">
        <div class="d-flex align-items-center justify-content-between mb-4">
            <div>
                <h5 class="mb-0" style="font-weight: 700; font-size: 16px;">Rekapitulasi Absensi</h5>
                <small class="text-muted">
                    Periode: {{ \Carbon\Carbon::parse($start_date)->format('d/m/Y') }}
                    s/d {{ \Carbon\Carbon::parse($end_date)->format('d/m/Y') }}
                </small>
            </div>
        </div>

        <div class="rounded-3 mb-4">
            <div class="p-3 border-bottom" style="border-bottom-color: #f0f0f0 !important;">
                <form method="GET">
                    <div class="row g-2 align-items-end">
                        <div class="col-md-2">
                            <label class="form-label fw-semibold mb-1" style="font-size: 12px;">Mulai Tanggal</label>
                            <input type="date" name="start_date" class="form-control form-control-sm" value="{{ $start_date }}">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label fw-semibold mb-1" style="font-size: 12px;">Sampai Tanggal</label>
                            <input type="date" name="end_date" class="form-control form-control-sm" value="{{ $end_date }}">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label fw-semibold mb-1" style="font-size: 12px;">Cabang</label>
                            <select name="cabang_id" class="form-select form-select-sm">
                                <option value="">Semua Cabang</option>
                                @foreach ($list_cabang as $c)
                                    <option value="{{ $c->id }}" {{ request('cabang_id') == $c->id ? 'selected' : '' }}>{{ $c->nama_cabang }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label fw-semibold mb-1" style="font-size: 12px;">Divisi</label>
                            <select name="divisi_id" class="form-select form-select-sm">
                                <option value="">Semua Divisi</option>
                                @foreach ($list_divisi as $d)
                                    <option value="{{ $d->id }}" {{ request('divisi_id') == $d->id ? 'selected' : '' }}>{{ $d->nama_divisi }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div class="col-md-2">
                            <div class="d-flex gap-1">
                                <button type="submit" class="btn btn-primary btn-sm w-100">
                                    <i class="bi bi-search me-1"></i> Cari
                                </button>
                                <a href="{{ url()->current() }}" class="btn btn-outline-secondary btn-sm" title="Reset">
                                    <i class="bi bi-arrow-clockwise"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="p-3 border-bottom" style="border-bottom-color: #f0f0f0 !important;">
                <div class="d-flex align-items-center gap-3 flex-wrap">
                    <span class="fw-semibold" style="font-size: 12px;">Sembunyikan Divisi:</span>
                    <div class="d-flex align-items-center gap-2 flex-wrap" id="divisiCheckboxList">
                        @foreach ($list_divisi as $d)
                        <div class="form-check form-check-inline mb-0">
                            <input class="form-check-input divisi-hide-cb" type="checkbox" value="{{ $d->id }}" id="hideDivisi{{ $d->id }}" {{ in_array($d->id, $hiddenDivisi) ? 'checked' : '' }}>
                            <label class="form-check-label" for="hideDivisi{{ $d->id }}" style="font-size: 12px;">{{ $d->nama_divisi }}</label>
                        </div>
                        @endforeach
                    </div>
                    <button class="btn btn-sm btn-outline-dark" id="btnHideDivisi"><i class="bi bi-eye-slash me-1"></i>Hide</button>
                    <button class="btn btn-sm btn-outline-secondary" id="btnShowAllDivisi"><i class="bi bi-eye me-1"></i>Show All</button>
                </div>
            </div>
        </div>

        <div class="table-responsive">
            <table id="rekapTable" class="table align-middle mb-0" style="width:100%">
                <thead>
                    <tr>
                        <th class="text-center">No</th>
                        <th class="text-start">Karyawan</th>
                        <th class="text-center">Cabang</th>
                        <th class="text-center">Hadir</th>
                        <th class="text-center">Late</th>
                        <th class="text-center">Izin</th>
                        <th class="text-center">Alpa</th>
                        <th class="text-center">P.Awal</th>
                        <th class="text-center">Lembur</th>
                        <th class="text-center">Jam Lembur</th>
                        <th class="text-center">Kehadiran Sensei</th>
                        <th class="text-center">Kehadiran Khusus</th>
                        <th class="text-center">Jam Khusus</th>
                        <th class="text-center">Total Agenda</th>
                        <th class="text-center">Jam Kerja</th>
                        <th class="text-center">Grand Total</th>
                        <th class="text-center">Total Kehadiran</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($rekap as $index => $r)
                        <tr>
                            <td class="text-center text-muted">{{ $index + 1 }}</td>
                            <td>
                                <div class="fw-bold text-dark" style="font-size: 13px;">{{ $r->nama }}</div>
                                <div class="text-xs text-muted text-uppercase">{{ $r->jabatan }}</div>
                            </td>
                            <td class="text-center">{{ $r->cabang }}</td>
                            <td class="text-center">{{ $r->hadir }}</td>
                            <td class="text-center {{ $r->terlambat > 0 ? 'text-danger fw-bold' : '' }}">
                                {{ $r->terlambat }}
                            </td>
                            <td class="text-center">{{ $r->izin }}</td>
                            <td class="text-center {{ $r->alpa > 0 ? 'text-danger fw-bold' : '' }}">
                                {{ $r->alpa }}
                            </td>
                            <td class="text-center">{{ $r->pulang_awal }}</td>
                            <td class="text-center fw-bold">{{ $r->jumlah_lembur }}<span class="text-xs">x</span></td>
                            <td class="text-center">{{ $r->total_jam_lembur }}</td>
                            <td class="text-center fw-bold">{{ $r->sensei_kehadiran }}<span class="text-xs">x</span></td>
                            <td class="text-center fw-bold">{{ $r->khusus }}<span class="text-xs">x</span></td>
                            <td class="text-center">{{ $r->jam_khusus }}</td>
                            <td class="text-center fw-bold">{{ $r->total_agenda }}</td>
                            <td class="text-center fw-bold">{{ $r->total_jam_kerja }}</td>
                            <td class="text-center fw-bold">{{ $r->grand_total_jam }}</td>
                            <td class="text-center fw-bold">{{ $r->total_kehadiran }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.7.1.js"></script>
    <script src="https://cdn.datatables.net/1.13.8/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.8/js/dataTables.bootstrap5.min.js"></script>
    <script src="https://cdn.datatables.net/buttons/2.4.2/js/dataTables.buttons.min.js"></script>
    <script src="https://cdn.datatables.net/buttons/2.4.2/js/buttons.bootstrap5.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js"></script>
    <script src="https://cdn.datatables.net/buttons/2.4.2/js/buttons.html5.min.js"></script>
    <script src="https://cdn.datatables.net/buttons/2.4.2/js/buttons.print.min.js"></script>

    <script>
        $(function () {
            $('#rekapTable').DataTable({
                dom: '<"d-flex justify-content-between align-items-center border-bottom p-3"Bf>t<"d-flex justify-content-between align-items-center p-3"ip>',
                buttons: [
                    {
                        extend:'excel',
                        className:'btn btn-sm btn-outline-success',
                        text:'<i class="bi bi-file-earmark-excel me-1"></i> Excel',
                        title: 'Rekapitulasi Absensi Karyawan',
                        messageTop: 'Periode: {{ \Carbon\Carbon::parse($start_date)->format("d/m/Y") }} - {{ \Carbon\Carbon::parse($end_date)->format("d/m/Y") }}',
                        exportOptions: { columns: ':visible' }
                    },
                    {
                        extend:'pdf',
                        className:'btn btn-sm btn-outline-danger',
                        text:'<i class="bi bi-file-earmark-pdf me-1"></i> PDF',
                        title: 'Rekapitulasi Absensi Karyawan',
                        messageTop: 'Periode: {{ \Carbon\Carbon::parse($start_date)->format("d/m/Y") }} - {{ \Carbon\Carbon::parse($end_date)->format("d/m/Y") }}',
                        orientation: 'landscape',
                        exportOptions: { columns: ':visible' }
                    },
                    {
                        extend:'print',
                        className:'btn btn-sm btn-outline-primary',
                        text:'<i class="bi bi-printer me-1"></i> Cetak',
                        title: 'Rekapitulasi Absensi Karyawan',
                        messageTop: 'Periode: {{ \Carbon\Carbon::parse($start_date)->format("d/m/Y") }} - {{ \Carbon\Carbon::parse($end_date)->format("d/m/Y") }}',
                        exportOptions: { columns: ':visible' }
                    },
                ],
                pageLength: 25,
                language: {
                    search: "Cari:",
                    info: "Data _START_–_END_ dari _TOTAL_",
                    paginate: { next:"Lanjut", previous:"Kembali" }
                }
            });

            // Hide Divisi
            $('#btnHideDivisi').on('click', function() {
                var ids = [];
                $('.divisi-hide-cb:checked').each(function() { ids.push($(this).val()); });
                $.post('/rekap-absensi/hidden-divisi', {
                    _token: '{{ csrf_token() }}',
                    ids: ids
                }, function() {
                    location.reload();
                });
            });

            $('#btnShowAllDivisi').on('click', function() {
                $.post('/rekap-absensi/hidden-divisi', {
                    _token: '{{ csrf_token() }}',
                    ids: []
                }, function() {
                    location.reload();
                });
            });
        });
    </script>
@endsection
