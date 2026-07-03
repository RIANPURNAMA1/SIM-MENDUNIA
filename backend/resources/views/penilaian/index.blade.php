@extends('app')

@section('content')
<style>
.modal-open .container-fluid {
    filter: blur(4px);
    transition: filter 0.2s ease;
}
</style>
<div class="container-fluid px-4 py-4">
    @if(session('success'))
        <div class="alert alert-success alert-dismissible fade show py-2" role="alert">
            {{ session('success') }}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    @endif

    <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
            <h5 class="mb-0" style="font-weight: 700; font-size: 16px;">Rekap Penilaian Siswa</h5>
            <small class="text-muted">Ceklis = sudah diisi oleh sensei</small>
        </div>
    </div>

    {{-- Filters --}}
    <form method="GET" action="{{ route('penilaian.index') }}" id="filterForm">
        <div class="card border-0 shadow-sm mb-4">
            <div class="card-body">
                <div class="row g-3 align-items-end">
                    <div class="col-md-3">
                        <label class="form-label">Level</label>
                        <select name="level" class="form-select" onchange="this.form.submit()">
                            <option value="">Semua Level</option>
                            @foreach($levels as $lvl)
                                <option value="{{ $lvl }}" {{ $level == $lvl ? 'selected' : '' }}>Level {{ $lvl }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Guru</label>
                        <select name="guru_id" class="form-select" onchange="this.form.submit()" {{ auth()->user()->role === 'GURU' ? 'disabled' : '' }}>
                            @if(auth()->user()->role === 'GURU')
                                <option value="{{ auth()->id() }}" selected>{{ auth()->user()->name }}</option>
                            @else
                                <option value="">Semua Guru</option>
                                @foreach($gurus as $guru)
                                    <option value="{{ $guru->id }}" {{ $guruId == $guru->id ? 'selected' : '' }}>{{ $guru->name }}</option>
                                @endforeach
                            @endif
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Kelas</label>
                        <select name="kelas_sensei_id" class="form-select" onchange="this.form.submit()">
                            <option value="">Pilih Kelas</option>
                            @foreach($kelasList as $k)
                                <option value="{{ $k->id }}" {{ ($kelas->id ?? null) == $k->id ? 'selected' : '' }}>
                                    {{ $k->nama_kelas }} - {{ $k->batchRelasi->nama_batch ?? 'Batch #'.$k->batch_id }}
                                </option>
                            @endforeach
                        </select>
                    </div>
                    <div class="col-md-2">
                        <a href="{{ route('penilaian.index') }}" class="btn btn-outline-secondary w-100">Reset</a>
                    </div>
                </div>
            </div>
        </div>
    </form>

    @if(isset($kelas) && $categories->isNotEmpty())
        {{-- Week Navigation --}}
        <div class="d-flex align-items-center justify-content-between mb-3">
            <h6 class="fw-semibold mb-0" style="font-size: 14px;">
                {{ \Carbon\Carbon::parse($days[0])->format('d/m') }} - {{ \Carbon\Carbon::parse($days[4])->format('d/m/Y') }}
            </h6>
            <div class="d-flex align-items-center gap-2">
                <a href="{{ route('penilaian.index', array_merge(request()->query(), ['week' => $prevWeek])) }}" class="btn btn-sm btn-outline-secondary border-0">&larr;</a>
                <a href="{{ route('penilaian.index', array_merge(request()->query(), ['week' => $nextWeek])) }}" class="btn btn-sm btn-outline-secondary border-0">&rarr;</a>
            </div>
        </div>

        {{-- Legend --}}
        <div class="d-flex gap-3 mb-3" style="font-size: 11px;">
            <span class="text-muted">&#10003; Terisi</span>
            <span class="text-muted">&ndash; Kosong</span>
        </div>

        {{-- Week Table --}}
        <div class="card border-0 shadow-sm">
            <div class="table-responsive">
                <table class="table table-hover text-nowrap mb-0">
                    <thead>
                        <tr>
                            <th scope="col" style="position: sticky; left: 0; background: #fff; z-index: 1; min-width: 140px;">Nama Siswa</th>
                            <th scope="col" style="min-width: 100px;">Kelas</th>
                            @foreach($days as $d)
                                @php $carbon = \Carbon\Carbon::parse($d); @endphp
                                <th scope="col" class="text-center" style="min-width: 70px;">
                                    <span style="font-size: 11px;">{{ $carbon->translatedFormat('D') }}</span>
                                    <span class="text-muted d-block" style="font-size: 10px;">{{ $carbon->format('d/m') }}</span>
                                </th>
                            @endforeach
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($students as $student)
                            <tr>
                                <td style="position: sticky; left: 0; background: #fff; z-index: 1;">
                                    <span class="fw-medium" style="font-size: 13px;">{{ $student->nama }}</span>
                                </td>
                                <td>
                                    @if(isset($kelas))
                                        <span style="font-size: 12px;">{{ $kelas->nama_kelas }}</span>
                                        <small class="d-block text-muted" style="font-size: 10px;">Level {{ $kelas->level }} - {{ $kelas->tanggal_mulai->format('d M') }} s/d {{ $kelas->tanggal_selesai->format('d M') }}</small>
                                    @else
                                        <span style="font-size: 12px;">{{ $student->kelasRelasi->nama_kelas ?? $student->kelas }}</span>
                                    @endif
                                </td>
                                @foreach($days as $d)
                                    @php
                                        $key = $student->id . '_' . $d;
                                        $hasAssessment = $assessmentCheck[$key] ?? false;
                                    @endphp
                                    <td class="text-center">
                                        @if($hasAssessment)
                                            <a href="javascript:void(0)"
                                                onclick="openSummaryModal({{ $student->id }}, '{{ $student->nama }}', {{ $batchId }}, '{{ $level }}', {{ $guruId }}, {{ $kelas->id ?? 'null' }})"
                                                class="text-decoration-none">
                                                <span class="badge bg-success fw-normal px-2 py-1" style="font-size: 13px; cursor: pointer;">&#10003;</span>
                                            </a>
                                        @else
                                            <span class="text-muted" style="font-size: 13px;">-</span>
                                        @endif
                                    </td>
                                @endforeach
                            </tr>
                        @endforeach

                        @if($students->isEmpty())
                            <tr>
                                <td colspan="{{ 2 + count($days) }}" class="text-center text-muted py-4">
                                    <i class="ph ph-notebook d-block fs-2 mb-2"></i>
                                    Tidak ada siswa aktif di batch ini.
                                </td>
                            </tr>
                        @endif
                    </tbody>
                </table>
            </div>
        </div>

    @elseif(isset($kelas))
        <div class="text-center text-muted py-5">
            <i class="ph ph-warning-circle d-block fs-1 mb-2"></i>
            Belum ada kategori penilaian untuk level ini.
        </div>
    @else
        <div class="text-center text-muted py-5">
            <i class="ph ph-funnel d-block fs-1 mb-2"></i>
            Pilih Level, Guru, dan Kelas untuk melihat rekap penilaian.
        </div>
    @endif
</div>

{{-- Summary Modal --}}
<div class="modal fade" id="summaryModal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
    <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" style="max-width: 95%;">
        <div class="modal-content">
            <div class="modal-header">
                <div>
                    <h6 class="modal-title fw-bold" id="summaryModalTitle"></h6>
                    <small class="text-muted" id="summaryModalSubtitle"></small>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body" id="summaryModalBody">
                <div class="text-center text-muted py-3">Memuat...</div>
            </div>
        </div>
    </div>
</div>

<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script>
function getResikoBadge(avg) {
    var cls, text;
    if (avg >= 85) { cls = 'success'; text = '🟢 Sangat Siap'; }
    else if (avg >= 75) { cls = 'success'; text = '🟢 Siap'; }
    else if (avg >= 65) { cls = 'warning'; text = '🟡 Perlu Pendampingan'; }
    else { cls = 'danger'; text = '🔴 Berisiko'; }
    return '<span class="badge bg-' + cls + ' fw-normal">' + text + '</span>';
}

function openSummaryModal(siswaId, namaSiswa, batchId, level, guruId, kelasSenseiId) {
    $('#summaryModalTitle').text(namaSiswa);
    $('#summaryModalSubtitle').text('');
    $('#summaryModalBody').html('<div class="text-center text-muted py-3">Memuat...</div>');
    $('#summaryModal').modal('show');

    var data = { siswa_id: siswaId, batch_id: batchId, level: level, guru_id: guruId };
    if (kelasSenseiId) data.kelas_sensei_id = kelasSenseiId;

    $.ajax({
        url: '{{ route('penilaian.day-detail') }}',
        data: data,
        success: function(res) {
            $('#summaryModalSubtitle').text(res.total_pertemuan + ' pertemuan');

            var html = '';
            var isRekapAkhir = res.level === '2' || res.level === '3' || res.level === '4';

            $.each(res.categories, function(i, cat) {
                if (!cat.summary || cat.summary.nilai_akhir === null) return;

                html += '<div class="mb-4">';
                html += '<h6 class="fw-semibold mb-2" style="font-size: 13px;">' + cat.nama_kategori + '</h6>';

                html += '<div class="table-responsive">';
                html += '<table class="table table-sm table-bordered mb-0" style="font-size: 12px;">';

                if (isRekapAkhir) {
                    // --- Level 2/3 REKAP AKHIR ---
                    var nComp = cat.components.length;
                    var teoriIndices = [];
                    var praktekIndices = [];
                    for (var idx = 0; idx < nComp; idx++) {
                        if (idx < nComp - 2) teoriIndices.push(idx);
                        else praktekIndices.push(idx);
                    }

                    // Compute aggregate from latest (last pertemuan)
                    var latestScores = [];
                    var latestPertemuanKe = 0;
                    if (cat.pertemuan.length > 0) {
                        var lastPt = cat.pertemuan[cat.pertemuan.length - 1];
                        latestScores = lastPt.scores;
                        latestPertemuanKe = lastPt.pertemuan_ke || 0;
                    }
                    var semuaScores = latestScores.filter(function(s) { return s !== null; });
                    var rataRata = semuaScores.length > 0 ? semuaScores.reduce(function(a, b) { return a + b; }, 0) / semuaScores.length : null;
                    var totalTeori = 0, countTeori = 0, totalPraktek = 0, countPraktek = 0;
                    $.each(latestScores, function(j, s) {
                        if (s !== null) {
                            if (teoriIndices.indexOf(j) !== -1) { totalTeori += s; countTeori++; }
                            if (praktekIndices.indexOf(j) !== -1) { totalPraktek += s; countPraktek++; }
                        }
                    });
                    var nilaiTeori = countTeori > 0 ? totalTeori : null;
                    var nilaiPraktek = countPraktek > 0 ? totalPraktek : null;

                    html += '<thead style="background-color: #d4a017; color: #fff;">';
                    html += '<tr><th colspan="' + (cat.components.length + 4) + '" class="text-center">TOTAL NILAI</th>';
                    html += '</tr><tr>';
                    $.each(cat.components, function(j, comp) {
                        var label = comp.nama;
                        if (comp.nama === 'Simulasi' && latestPertemuanKe > 0) {
                            var week = Math.ceil(latestPertemuanKe / 5);
                            label = 'Simulasi ' + week;
                        }
                        html += '<th class="text-center" style="font-size: 11px;">' + label + '</th>';
                    });
                    html += '<th class="text-center" style="min-width:80px;border-top:none;">NILAI TEORI</th>';
                    html += '<th class="text-center" style="min-width:90px;border-top:none;">NILAI PRAKTEK</th>';
                    html += '<th class="text-center" style="min-width:100px;border-top:none;">NILAI RATA-RATA</th>';
                    html += '<th class="text-center" style="min-width:80px;border-top:none;">RESIKO</th>';
                    html += '</tr></thead><tbody><tr>';
                    $.each(cat.components, function(j, comp) {
                        var s = (j < latestScores.length) ? latestScores[j] : null;
                        if (s !== null) {
                            var badge = s >= 90 ? 'success' : (s >= 75 ? 'primary' : (s >= 60 ? 'warning' : 'danger'));
                            html += '<td class="text-center"><span class="badge bg-' + badge + ' fw-normal px-2 py-1" style="font-size: 10px;">' + Math.round(s) + '</span></td>';
                        } else {
                            html += '<td class="text-center text-muted">-</td>';
                        }
                    });
                    html += '<td class="text-center fw-bold">' + (nilaiTeori !== null ? nilaiTeori.toFixed(1) : '-') + '</td>';
                    html += '<td class="text-center fw-bold">' + (nilaiPraktek !== null ? nilaiPraktek.toFixed(1) : '-') + '</td>';
                    html += '<td class="text-center fw-bold">' + (rataRata !== null ? rataRata.toFixed(1) : '-') + '</td>';
                    html += '<td class="text-center">' + (rataRata !== null ? getResikoBadge(rataRata) : '-') + '</td>';
                    html += '</tr></tbody></table></div>';

                    // Per-date detail: Tampilkan PR, Hafalan, Kanji, Ulangan, Shoukai, Translate + Rata-Rata
                    html += '<details class="mt-2"><summary class="text-muted" style="font-size: 11px; cursor: pointer;">Detail per pertemuan</summary>';
                    html += '<div class="table-responsive mt-1"><table class="table table-sm table-bordered mb-0" style="font-size: 11px;">';
                    html += '<thead style="background-color: #d4a017; color: #fff;"><tr><th>Tanggal</th>';
                    $.each(cat.components, function(j, comp) {
                        html += '<th class="text-center">' + comp.nama + '</th>';
                    });
                    html += '<th class="text-center">Rata-Rata</th></tr></thead><tbody>';
                    $.each(cat.pertemuan, function(k, pt) {
                        html += '<tr><td>' + pt.hari + ', ' + pt.tanggal + '</td>';
                        var total = 0, count = 0;
                        $.each(pt.scores, function(j, s) {
                            if (s !== null) { total += s; count++; }
                            var badge = 'secondary';
                            if (s !== null) {
                                if (s >= 90) badge = 'success';
                                else if (s >= 75) badge = 'primary';
                                else if (s >= 60) badge = 'warning';
                                else badge = 'danger';
                                html += '<td class="text-center"><span class="badge bg-' + badge + ' fw-normal px-2 py-1" style="font-size: 10px;">' + Math.round(s) + '</span></td>';
                            } else {
                                html += '<td class="text-center text-muted">-</td>';
                            }
                        });
                        var avg = count > 0 ? (total / count) : null;
                        html += '<td class="text-center fw-bold">' + (avg !== null ? avg.toFixed(1) : '-') + '</td></tr>';
                    });
                    html += '</tbody></table></div></details>';

                } else {
                    // --- Level 1 Rata-Rata / Peningkatan ---
                    html += '<thead style="background-color: #d4a017; color: #fff;"><tr><th rowspan="2">No</th><th rowspan="2">Nama Siswa</th>';
                    html += '<th colspan="' + cat.components.length + '" class="text-center">Nilai Rata-Rata</th>';
                    html += '<th colspan="' + cat.components.length + '" class="text-center">Peningkatan</th>';
                    html += '<th rowspan="2" class="text-center">Nilai Akhir</th>';
                    html += '<th rowspan="2" class="text-center">Resiko</th>';
                    html += '</tr><tr>';
                    $.each(cat.components, function(j, comp) {
                        html += '<th class="text-center" style="font-size: 11px;">' + comp.nama + '</th>';
                    });
                    $.each(cat.components, function(j, comp) {
                        html += '<th class="text-center" style="font-size: 11px;">' + comp.nama + '</th>';
                    });
                    html += '</tr></thead><tbody>';
                    html += '<tr><td>1</td><td>' + res.siswa + '</td>';

                    $.each(cat.components, function(j, comp) {
                        var avg = cat.summary.averages[comp.id];
                        html += '<td class="text-center">' + (avg !== null ? avg.toFixed(1) : '-') + '</td>';
                    });
                    $.each(cat.components, function(j, comp) {
                        var imp = cat.summary.improvements[comp.id];
                        if (imp !== null) {
                            var cls = imp < 0 ? 'text-danger' : (imp > 0 ? 'text-success' : '');
                            html += '<td class="text-center ' + cls + '">' + (imp > 0 ? '+' : '') + imp.toFixed(1) + '</td>';
                        } else {
                            html += '<td class="text-center">-</td>';
                        }
                    });
                    html += '<td class="text-center fw-bold">' + cat.summary.nilai_akhir.toFixed(1) + '</td>';
                    html += '<td class="text-center"><span class="badge bg-' + cat.summary.resiko_class + ' fw-normal">' + cat.summary.resiko + '</span></td>';
                    html += '</tr></tbody></table></div>';

                    // Per-date detail below (Level 1)
                    html += '<details class="mt-2"><summary class="text-muted" style="font-size: 11px; cursor: pointer;">Detail per pertemuan</summary>';
                    html += '<div class="table-responsive mt-1"><table class="table table-sm table-bordered mb-0" style="font-size: 11px;">';
                    html += '<thead style="background-color: #d4a017; color: #fff;"><tr><th>Tanggal</th>';
                    $.each(cat.components, function(j, comp) {
                        html += '<th class="text-center">' + comp.nama + '</th>';
                    });
                    html += '<th class="text-center">Rata-Rata</th></tr></thead><tbody>';
                    $.each(cat.pertemuan, function(k, pt) {
                        html += '<tr><td>' + pt.hari + ', ' + pt.tanggal + '</td>';
                        var total = 0, count = 0;
                        $.each(pt.scores, function(j, s) {
                            if (s !== null) { total += s; count++; }
                            var badge = 'secondary';
                            if (s !== null) {
                                if (s >= 90) badge = 'success';
                                else if (s >= 75) badge = 'primary';
                                else if (s >= 60) badge = 'warning';
                                else badge = 'danger';
                                html += '<td class="text-center"><span class="badge bg-' + badge + ' fw-normal px-2 py-1" style="font-size: 10px;">' + Math.round(s) + '</span></td>';
                            } else {
                                html += '<td class="text-center text-muted">-</td>';
                            }
                        });
                        var avg = count > 0 ? (total / count) : null;
                        html += '<td class="text-center fw-bold">' + (avg !== null ? avg.toFixed(1) : '-') + '</td></tr>';
                    });
                    html += '</tbody></table></div></details>';
                }

                html += '</div>';
            });

            if (html === '') {
                html = '<div class="text-center text-muted py-3">Belum ada data penilaian untuk siswa ini.</div>';
            }

            $('#summaryModalBody').html(html);
        },
        error: function() {
            $('#summaryModalBody').html('<div class="text-center text-danger py-3">Gagal memuat data penilaian.</div>');
        }
    });
}
</script>
@endsection