@extends('app')

@section('content')
<link rel="stylesheet" href="https://cdn.datatables.net/1.13.8/css/dataTables.bootstrap5.min.css">
<link rel="stylesheet" href="https://cdn.datatables.net/buttons/2.4.2/css/buttons.bootstrap5.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css">
<style>
    #rekapSiswaTable thead th {
        background-color: #fff !important;
        color: #212529 !important;
        font-weight: 700;
        padding: 10px 8px;
        border: 1px solid #dee2e6;
        vertical-align: middle;
    }
    #rekapSiswaTable tbody td {
        border: 1px solid #dee2e6;
        padding: 8px;
        vertical-align: middle;
    }
    #rekapSiswaTable { border-collapse: collapse; border: 1px solid #dee2e6; font-size: 0.85rem; }
    .cal-table td, .cal-table th {
        border: 1px solid #dee2e6;
        text-align: center;
        vertical-align: middle;
        padding: 6px 2px;
        font-size: 12px;
        width: 14.28%;
    }
    .cal-table td { height: 55px; }
    .cal-table td.today { outline: 2px solid #3b82f6; outline-offset: -2px; }
    .cal-table th { background: #f3f4f6; font-weight: 600; }
    .cal-table td .day-num { font-weight: 700; font-size: 13px; }
    .cal-badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 9px; font-weight: 600; color: #fff; margin-top: 2px; }
    .cal-badge.hadir { background: #10b981; }
    .cal-badge.telat { background: #f59e0b; }
    .cal-badge.izin { background: #3b82f6; }
    .cal-badge.sakit { background: #8b5cf6; }
    .cal-badge.alpa { background: #ef4444; }
    td.bg-hadir { background: #d1fae5; }
    td.bg-telat { background: #fef3c7; }
    td.bg-izin { background: #dbeafe; }
    td.bg-sakit { background: #ede9fe; }
    td.bg-alpa { background: #fee2e2; }
    td.bg-kosong { background: #f9fafb; }
    .cal-legend { display: flex; flex-wrap: wrap; gap: 12px; font-size: 11px; margin-top: 10px; }
    .cal-legend-item { display: flex; align-items: center; gap: 4px; }
    .cal-dot { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
    .siswa-link { cursor: pointer; }
    .siswa-link:hover { color: #0d6efd !important; }
</style>

<div class="container-fluid px-4 py-4">
    <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
            <h5 class="mb-0" style="font-weight: 700; font-size: 16px;">Rekapitulasi Siswa</h5>
            <small class="text-muted">
                Periode: {{ \Carbon\Carbon::parse($start_date)->format('d/m/Y') }}
                s/d {{ \Carbon\Carbon::parse($end_date)->format('d/m/Y') }}
            </small>
        </div>
    </div>

    <form method="GET" class="mb-4">
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
                <label class="form-label fw-semibold mb-1" style="font-size: 12px;">Kelas</label>
                <select name="kelas_sensei_id" class="form-select form-select-sm">
                    <option value="">Semua Kelas</option>
                    @foreach ($kelasList as $k)
                        <option value="{{ $k->id }}" {{ request('kelas_sensei_id') == $k->id ? 'selected' : '' }}>
                            {{ $k->nama_kelas }} - Level {{ $k->level }} ({{ $k->user->name ?? $k->user->nama ?? '-' }}) - {{ $k->batchRelasi->nama_batch ?? '-' }}
                        </option>
                    @endforeach
                </select>
            </div>
            <div class="col-md-2">
                <label class="form-label fw-semibold mb-1" style="font-size: 12px;">Batch</label>
                <select name="batch_id" class="form-select form-select-sm">
                    <option value="">Semua Batch</option>
                    @foreach ($batchList as $b)
                        <option value="{{ $b->id }}" {{ request('batch_id') == $b->id ? 'selected' : '' }}>{{ $b->nama_batch }}</option>
                    @endforeach
                </select>
            </div>
            <div class="col-md-1">
                <label class="form-label fw-semibold mb-1" style="font-size: 12px;">Level</label>
                <select name="level" class="form-select form-select-sm">
                    <option value="">Semua Level</option>
                    @foreach ($levels as $lv)
                        <option value="{{ $lv }}" {{ request('level') == $lv ? 'selected' : '' }}>{{ $lv }}</option>
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

    @if ($selectedKelasSensei)
        <div class="card border-primary mb-3">
            <div class="card-body p-3">
                <div class="row g-2 small">
                    <div class="col-md-3"><strong>Nama Kelas:</strong> {{ $selectedKelasSensei->nama_kelas }}</div>
                    <div class="col-md-3"><strong>Sensei:</strong> {{ $selectedKelasSensei->user->name ?? $selectedKelasSensei->user->nama ?? '-' }}</div>
                    <div class="col-md-2"><strong>Level:</strong> {{ $selectedKelasSensei->level }}</div>
                    <div class="col-md-2"><strong>Batch:</strong> {{ $selectedKelasSensei->batchRelasi->nama_batch ?? '-' }}</div>
                    <div class="col-md-2"><strong>Status:</strong> {{ ucfirst($selectedKelasSensei->status) }}</div>
                    <div class="col-md-3"><strong>Tgl Mulai:</strong> {{ $selectedKelasSensei->tanggal_mulai->format('d/m/Y') }}</div>
                    <div class="col-md-3"><strong>Tgl Selesai:</strong> {{ $selectedKelasSensei->tanggal_selesai->format('d/m/Y') }}</div>
                </div>
            </div>
        </div>
    @endif

    <div class="table-responsive">
        <table id="rekapSiswaTable" class="table align-middle mb-0" style="width:100%">
            <thead>
                <tr>
                    <th>Nama</th>
                    <th>Kelas</th>
                    <th class="text-center">HADIR</th>
                    <th class="text-center">TERLAMBAT</th>
                    <th class="text-center">IZIN</th>
                    <th class="text-center">SAKIT</th>
                    <th class="text-center">ALPA</th>
                    <th class="text-center">Total Hadir</th>
                    <th class="text-center">%</th>
                    <th class="text-center">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($rekap as $r)
                    <tr>
                        <td class="fw-medium siswa-link text-dark" data-id="{{ $r->id }}" data-nama="{{ $r->nama }}" data-kelas="{{ $r->kelas }}">{{ $r->nama }}</td>
                        <td>{{ $r->kelas }}</td>
                        <td class="text-center">{{ $r->hadir }}</td>
                        <td class="text-center">{{ $r->terlambat }}</td>
                        <td class="text-center">{{ $r->izin }}</td>
                        <td class="text-center">{{ $r->sakit }}</td>
                        <td class="text-center">{{ $r->alpa }}</td>
                        <td class="text-center fw-bold">{{ $r->total_hadir }}</td>
                        <td class="text-center fw-bold">{{ $r->persentase }}%</td>
                        <td class="text-center">{{ $r->total }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
</div>

<div class="modal fade" id="kalenderModal" tabindex="-1" style="z-index:9999">
    <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <div>
                    <h6 class="modal-title fw-bold">Kalender Kehadiran</h6>
                    <small class="text-muted" id="modalSiswaInfo"></small>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-3">
                <div class="d-flex align-items-center justify-content-between mb-3">
                    <button type="button" class="btn btn-outline-dark btn-sm" id="prevMonth">&larr; <span id="prevMonthLabel"></span></button>
                    <span class="fw-bold" id="currentMonthLabel" style="font-size:15px;"></span>
                    <button type="button" class="btn btn-outline-dark btn-sm" id="nextMonth"><span id="nextMonthLabel"></span> &rarr;</button>
                </div>
                <div id="kalenderContent" style="min-height:200px;">
                    <div class="text-center text-muted py-5">Memuat data...</div>
                </div>
                <div class="cal-legend">
                    <div class="cal-legend-item"><span class="cal-dot" style="background:#10b981;"></span> Hadir</div>
                    <div class="cal-legend-item"><span class="cal-dot" style="background:#f59e0b;"></span> Terlambat</div>
                    <div class="cal-legend-item"><span class="cal-dot" style="background:#3b82f6;"></span> Izin</div>
                    <div class="cal-legend-item"><span class="cal-dot" style="background:#8b5cf6;"></span> Sakit</div>
                    <div class="cal-legend-item"><span class="cal-dot" style="background:#ef4444;"></span> Alpa</div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script src="https://code.jquery.com/jquery-3.7.1.js"></script>
<script src="https://cdn.datatables.net/1.13.8/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.datatables.net/1.13.8/js/dataTables.bootstrap5.min.js"></script>
<script src="https://cdn.datatables.net/buttons/2.4.2/js/dataTables.buttons.min.js"></script>
<script src="https://cdn.datatables.net/buttons/2.4.2/js/buttons.bootstrap5.min.js"></script>
<script>
var currentSiswaId = null;
var currentMonth = {{ now()->month }};
var currentYear = {{ now()->year }};

function renderCalendar(data) {
    var h = '<table class="table mb-0 cal-table" style="border-collapse:collapse;width:100%;">';
    h += '<thead><tr><th>Min</th><th>Sen</th><th>Sel</th><th>Rab</th><th>Kam</th><th>Jum</th><th>Sab</th></tr></thead><tbody>';

    var daysInMonth = data.daysInMonth;
    var startDayOfWeek = data.startDayOfWeek;
    var totalCells = startDayOfWeek + daysInMonth;
    var rows = Math.ceil(totalCells / 7);
    var today = new Date();
    var todayStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');

    var absensiMap = {};
    data.absensi.forEach(function(a) { absensiMap[a.hari] = a.status; });

    for (var row = 0; row < rows; row++) {
        h += '<tr>';
        for (var col = 0; col < 7; col++) {
            var cellIndex = (row * 7) + col;
            var day = cellIndex - startDayOfWeek + 1;
            var isValid = day >= 1 && day <= daysInMonth;

            if (isValid) {
                var dateObj = new Date(data.year, data.month - 1, day);
                var dateStr = data.year + '-' + String(data.month).padStart(2,'0') + '-' + String(day).padStart(2,'0');
                var isToday = dateStr === todayStr;
                var status = absensiMap[day] || null;

                var bgClass = '';
                var badgeClass = '';
                var badgeText = '';
                if (status === 'HADIR') { bgClass = 'bg-hadir'; badgeClass = 'hadir'; badgeText = 'Hadir'; }
                else if (status === 'TERLAMBAT') { bgClass = 'bg-telat'; badgeClass = 'telat'; badgeText = 'Telat'; }
                else if (status === 'IZIN') { bgClass = 'bg-izin'; badgeClass = 'izin'; badgeText = 'Izin'; }
                else if (status === 'SAKIT') { bgClass = 'bg-sakit'; badgeClass = 'sakit'; badgeText = 'Sakit'; }
                else if (status === 'ALPA') { bgClass = 'bg-alpa'; badgeClass = 'alpa'; badgeText = 'Alpa'; }

                h += '<td class="' + bgClass + (isToday ? ' today' : '') + '">';
                h += '<div class="day-num">' + day + '</div>';
                if (status) h += '<span class="cal-badge ' + badgeClass + '">' + badgeText + '</span>';
                h += '</td>';
            } else {
                h += '<td class="bg-kosong"></td>';
            }
        }
        h += '</tr>';
    }
    h += '</tbody></table>';
    document.getElementById('kalenderContent').innerHTML = h;
}

function loadKalender(siswaId, month, year) {
    currentSiswaId = siswaId;
    currentMonth = month;
    currentYear = year;
    document.getElementById('kalenderContent').innerHTML = '<div class="text-center text-muted py-5">Memuat data...</div>';
    fetch('{{ url('/rekap-siswa') }}/' + siswaId + '/kalender-json?month=' + month + '&year=' + year)
        .then(function(r) { return r.json(); })
        .then(function(data) {
            document.getElementById('currentMonthLabel').textContent = data.monthName;
            var prev = new Date(data.year, data.month - 2, 1);
            var next = new Date(data.year, data.month, 1);
            document.getElementById('prevMonthLabel').textContent = prev.toLocaleString('id', { month:'long', year:'numeric' });
            document.getElementById('nextMonthLabel').textContent = next.toLocaleString('id', { month:'long', year:'numeric' });
            renderCalendar(data);
        });
}

$(document).ready(function() {
    $('#rekapSiswaTable').DataTable({
        dom: '<"d-flex justify-content-between align-items-center border-bottom p-3"Bf>t<"d-flex justify-content-between align-items-center p-3"ip>',
        buttons: [
            {
                text: '<i class="bi bi-file-earmark-excel me-1"></i> Excel',
                className: 'btn btn-sm btn-outline-success',
                action: function() {
                    var params = 'start_date={{ $start_date }}&end_date={{ $end_date }}&kelas_id={{ request('kelas_id') }}';
                    window.location.href = '{{ route("rekap-siswa.export-excel") }}?' + params;
                }
            },
            {
                text: '<i class="bi bi-file-earmark-pdf me-1"></i> PDF',
                className: 'btn btn-sm btn-outline-danger',
                action: function() {
                    var params = 'start_date={{ $start_date }}&end_date={{ $end_date }}&kelas_id={{ request('kelas_id') }}';
                    window.open('{{ route("rekap-siswa.export-pdf") }}?' + params, '_blank');
                }
            },
        ],
        pageLength: 25,
        ordering: true,
        info: false,
        searching: true,
        lengthChange: false,
        language: {
            emptyTable: 'Belum ada data rekap',
            search: "Cari:",
            info: "Data _START_–_END_ dari _TOTAL_",
            paginate: { next: "Lanjut", previous: "Kembali" }
        }
    });

    $(document).on('click', '.siswa-link', function() {
        var id = $(this).data('id');
        var nama = $(this).data('nama');
        var kelas = $(this).data('kelas');
        $('#modalSiswaInfo').text(nama + ' — ' + kelas);
        loadKalender(id, currentMonth, currentYear);
        $('#kalenderModal').modal('show');
    });

    $('#prevMonth').click(function() {
        var d = new Date(currentYear, currentMonth - 2, 1);
        loadKalender(currentSiswaId, d.getMonth() + 1, d.getFullYear());
    });

    $('#nextMonth').click(function() {
        var d = new Date(currentYear, currentMonth, 1);
        loadKalender(currentSiswaId, d.getMonth() + 1, d.getFullYear());
    });
});
</script>
@endpush
