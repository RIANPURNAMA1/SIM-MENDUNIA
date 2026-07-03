@extends('app')

@section('content')
<style>
#gridTable td {
    padding: 3px 2px !important;
    vertical-align: top;
    min-width: 42px;
    width: 42px;
    height: 50px;
}
#gridTable th {
    padding: 4px 2px !important;
    font-size: 0.6rem;
    text-align: center;
}
.grid-cell {
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    font-weight: 700;
    font-size: 0.65rem;
    cursor: default;
    margin: 0 auto;
}
.date-number {
    font-size: 0.65rem;
    color: #6c757d;
    text-align: center;
    line-height: 1.2;
    margin-bottom: 1px;
    font-weight: 600;
}
.legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
}
.legend-box {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    flex-shrink: 0;
}
#gridTable tbody tr:first-child td {
    border-top: none;
}
</style>

<div class="container-fluid px-4 py-4">
    <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
            <h5 class="mb-0" style="font-weight: 700; font-size: 16px;">Rekap Kehadiran Sensei</h5>
            <small class="text-muted">Rekap kehadiran sensei berdasarkan kelas</small>
        </div>
    </div>

    <div class="card border-0 shadow-sm rounded-3 mb-4">
        <div class="card-body p-4">
            <div class="row g-3 align-items-end">
                <div class="col-md-4">
                    <label class="form-label fw-bold">Pilih Sensei</label>
                    <select id="selectSensei" class="form-select select2">
                        <option value="">-- Pilih Sensei --</option>
                        @foreach($sensei as $s)
                            <option value="{{ $s->id }}">{{ $s->name }} ({{ $s->nip }})</option>
                        @endforeach
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label fw-bold">Bulan</label>
                    <select id="selectBulan" class="form-select">
                        @for($i = 1; $i <= 12; $i++)
                            <option value="{{ $i }}" {{ $i == now()->month ? 'selected' : '' }}>{{ \Carbon\Carbon::create()->month($i)->format('F') }}</option>
                        @endfor
                    </select>
                </div>
                <div class="col-md-2">
                    <label class="form-label fw-bold">Tahun</label>
                    <select id="selectTahun" class="form-select">
                        @for($i = now()->year - 1; $i <= now()->year + 1; $i++)
                            <option value="{{ $i }}" {{ $i == now()->year ? 'selected' : '' }}>{{ $i }}</option>
                        @endfor
                    </select>
                </div>
                <div class="col-md-3">
                    <button type="button" class="btn btn-primary w-100" onclick="loadData()">
                        <i class="ph ph-magnifying-glass me-1"></i> Tampilkan
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div id="rekapContainer" class="d-none">
        <div class="card border-0 shadow-sm rounded-3 mb-3">
            <div class="card-body p-3">
                <div class="d-flex flex-wrap gap-3">
                    <div class="legend-item"><div class="legend-box bg-success"></div> Hadir</div>
                    <div class="legend-item"><div class="legend-box bg-warning"></div> Terlambat</div>
                    <div class="legend-item"><div class="legend-box bg-danger"></div> Alpa</div>
                    <div class="legend-item"><div class="legend-box bg-info"></div> Pulang Cepat</div>
                    <div class="legend-item"><div class="legend-box bg-light border"></div> Belum Absen</div>
                    <div class="legend-item"><div class="legend-box bg-secondary"></div> Libur</div>
                    <div class="legend-item"><div class="legend-box" style="background:#fff3cd;"></div> Rentang Kelas</div>
                </div>
            </div>
        </div>

        <div id="kelasInfoContainer"></div>

        <div class="card border-0 shadow-sm rounded-3">
            <div class="card-body p-4">
                <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <h6 class="fw-bold mb-0" id="rekapTitle"></h6>
                    <div id="countBadges" class="d-flex gap-2"></div>
                </div>
                <div class="table-responsive">
                    <table class="table table-bordered mb-0 text-center" id="gridTable">
                        <thead class="table-light">
                            <tr>
                                <th style="width:22px; font-size:0.55rem;">#</th>
                                <th class="text-danger">Min</th>
                                <th>Sen</th>
                                <th>Sel</th>
                                <th>Rab</th>
                                <th>Kam</th>
                                <th>Jum</th>
                                <th class="text-primary">Sab</th>
                            </tr>
                        </thead>
                        <tbody id="gridBody"></tbody>
                    </table>
                </div>
                <div id="emptyState" class="text-center py-5 text-muted d-none">
                    <i class="ph ph-calendar-blank" style="font-size: 2rem;"></i>
                    <p class="mt-2 mb-0">Tidak ada jadwal kelas di bulan ini</p>
                </div>
            </div>
        </div>

        <div class="card border-0 shadow-sm rounded-3 mt-3">
            <div class="card-body p-4">
                <h6 class="fw-bold mb-3">Ringkasan</h6>
                <div class="row g-3" id="summaryCards"></div>
            </div>
        </div>
    </div>

    <div id="emptyStateNoSelect" class="text-center py-5 text-muted">
        <i class="ph ph-magnifying-glass" style="font-size: 2rem;"></i>
        <p class="mt-2 mb-0">Pilih sensei dan klik Tampilkan</p>
    </div>
</div>

<!-- Modal Ubah Status -->
<div class="modal fade" id="modalStatus" tabindex="-1">
    <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
            <div class="modal-header border-0 text-white" style="background: linear-gradient(135deg, #2a5298 0%, #1e3c72 100%);">
                <h5 class="modal-title text-white fw-bold"><i class="ph ph-pencil-simple me-2"></i>Ubah Status</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
                <div class="mb-3">
                    <small class="text-muted">Tanggal: <span id="modalTanggal" class="fw-bold text-dark"></span></small>
                    <br>
                    <small class="text-muted">Kelas: <span id="modalKelas" class="fw-bold text-dark"></span></small>
                </div>
                <label class="form-label fw-bold">Status <span class="text-danger">*</span></label>
                <select id="modalStatusSelect" class="form-select">
                    <option value="HADIR">HADIR</option>
                    <option value="TERLAMBAT">TERLAMBAT</option>
                    <option value="PULANG LEBIH AWAL">PULANG LEBIH AWAL</option>
                    <option value="TIDAK ABSEN PULANG">TIDAK ABSEN PULANG</option>
                    <option value="ALPA">ALPA</option>
                    <option value="LIBUR">LIBUR</option>
                </select>
            </div>
            <div class="modal-footer bg-light border-0">
                <button type="button" class="btn btn-outline-secondary px-3" data-bs-dismiss="modal">Batal</button>
                <button type="button" class="btn btn-dark px-3 shadow" onclick="simpanStatus()">
                    <i class="ph ph-floppy-disk me-1"></i> Simpan
                </button>
            </div>
        </div>
    </div>
</div>

<script>
function loadData() {
    const userId = $('#selectSensei').val();
    const bulan = $('#selectBulan').val();
    const tahun = $('#selectTahun').val();

    if (!userId) {
        Swal.fire({ icon: 'warning', title: 'Pilih Sensei', text: 'Silakan pilih sensei terlebih dahulu' });
        return;
    }

    $('#rekapContainer').addClass('d-none');
    $('#emptyStateNoSelect').addClass('d-none');

    $.ajax({
        url: `/rekap-kehadiran-sensei/${userId}?bulan=${bulan}&tahun=${tahun}`,
        type: 'GET',
        success: function(res) {
            if (res.success) {
                const days = Object.keys(res.data).length;
                if (days === 0) {
                    $('#rekapContainer').removeClass('d-none');
                    $('#gridBody').empty();
                    $('#emptyState').removeClass('d-none');
                    $('#summaryCards').empty();
                    return;
                }
                renderKelasInfo(res.kelas_list);
                renderGrid(res.data, bulan, tahun, res.kelas_list);
                renderSummary(res.data);
                $('#rekapContainer').removeClass('d-none');
                $('#emptyState').addClass('d-none');
            }
        },
        error: function() {
            Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan saat memuat data' });
        }
    });
}

function renderKelasInfo(kelasList) {
    if (!kelasList || kelasList.length === 0) {
        $('#kelasInfoContainer').empty();
        return;
    }

    let html = '';
    kelasList.forEach(k => {
        const tglMulai = new Date(k.tanggal_mulai + 'T00:00:00');
        const tglSelesai = new Date(k.tanggal_selesai + 'T00:00:00');
        const fmtMulai = tglMulai.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        const fmtSelesai = tglSelesai.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

        html += `
        <div class="card border-0 shadow-sm rounded-3 mb-3">
            <div class="card-body p-3">
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div>
                        <div class="d-flex align-items-center gap-3 mb-1">
                            <h6 class="mb-0 text-dark fw-bold">${k.nama_kelas}</h6>
                            <span class="badge bg-primary">${k.jumlah_absen} Absen</span>
                            <span class="badge bg-info">${k.total_pertemuan} Total Pertemuan</span>
                        </div>
                        <div class="d-flex gap-3 text-muted small">
                            <span><i class="ph ph-graduation-cap me-1"></i> Level ${k.level}</span>
                            <span><i class="ph ph-calendar-range me-1"></i> ${fmtMulai} - ${fmtSelesai}</span>
                            <span><i class="ph ph-user me-1"></i> ${k.sensei}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    });

    $('#kelasInfoContainer').html(html);
}

function renderGrid(data, bulan, tahun, kelasList) {
    const daysInMonth = new Date(tahun, bulan, 0).getDate();
    const firstDay = new Date(tahun, bulan - 1, 1).getDay();
    const bulanNama = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                       'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const senseiName = $('#selectSensei option:selected').text();
    $('#rekapTitle').text(`Rekap ${senseiName} - ${bulanNama[bulan - 1]} ${tahun}`);

    let totalHadir = 0, totalTerlambat = 0, totalAlpa = 0;
    Object.values(data).forEach(dayData => {
        dayData.entries.forEach(s => {
            if (s.status === 'HADIR') totalHadir++;
            else if (s.status === 'TERLAMBAT') totalTerlambat++;
            else if (s.status === 'ALPA' || s.status === 'TIDAK ABSEN PULANG') totalAlpa++;
        });
    });
    $('#countBadges').html(`
        <span class="badge bg-success">H:${totalHadir}</span>
        <span class="badge bg-warning text-dark">T:${totalTerlambat}</span>
        <span class="badge bg-danger">A:${totalAlpa}</span>
    `);

    const container = $('#gridBody');
    container.empty();

    let row = $('<tr></tr>');
    let weekNum = 1;
    row.append(`<td class="fw-bold text-muted small">${weekNum}</td>`);

    for (let i = 0; i < firstDay; i++) {
        row.append('<td></td>');
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${tahun}-${String(bulan).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayOfWeek = new Date(tahun, bulan - 1, day).getDay();
        const cellData = data[dateStr];

        let inClassRange = false;
        if (kelasList) {
            kelasList.forEach(k => {
                if (dateStr >= k.tanggal_mulai && dateStr <= k.tanggal_selesai) {
                    inClassRange = true;
                }
            });
        }

        let cellHtml = '';
        if (cellData && cellData.entries && cellData.entries.length > 0) {
            const entries = cellData.entries;
            let boxes = '';
            entries.forEach(s => {
                boxes += `<div class="grid-cell ${s.color} ${s.text_color} status-cell" title="${s.kelas_nama}: ${s.status}" data-tanggal="${dateStr}" data-absensi-id="${s.absensi_id || ''}" data-status="${s.status}" data-kelas-nama="${s.kelas_nama}" data-initial="${s.initial}" style="cursor:pointer;">${s.initial}</div>`;
            });
            cellHtml = `<div class="date-number">${day}</div><div class="d-flex flex-wrap justify-content-center gap-1">${boxes}</div>`;
        } else {
            cellHtml = `<div class="date-number">${day}</div>`;
        }

        const cellStyle = inClassRange ? ' style="background-color:#fff3cd;"' : '';
        const cell = $(`<td${cellStyle}>${cellHtml}</td>`);
        row.append(cell);

        if (dayOfWeek === 6 || day === daysInMonth) {
            container.append(row);
            if (day !== daysInMonth) {
                weekNum++;
                row = $('<tr></tr>');
                    row.append(`<td class="fw-bold text-muted" style="font-size:0.5rem;">${weekNum}</td>`);
            }
        }
    }
}

function renderSummary(data) {
    let hadir = 0, terlambat = 0, alpa = 0, pulangCepat = 0, libur = 0, belumAbsen = 0;
    let totalEntries = 0;

    Object.values(data).forEach(dayData => {
        dayData.entries.forEach(s => {
            totalEntries++;
            switch (s.status) {
                case 'HADIR': hadir++; break;
                case 'TERLAMBAT': terlambat++; break;
                case 'ALPA':
                case 'TIDAK ABSEN PULANG': alpa++; break;
                case 'PULANG LEBIH AWAL': pulangCepat++; break;
                case 'LIBUR': libur++; break;
                default: belumAbsen++; break;
            }
        });
    });

    const cards = [
        { label: 'Hadir', count: hadir, color: 'success', icon: 'ph-check-circle' },
        { label: 'Terlambat', count: terlambat, color: 'warning', icon: 'ph-clock' },
        { label: 'Alpa', count: alpa, color: 'danger', icon: 'ph-x-circle' },
        { label: 'Pulang Cepat', count: pulangCepat, color: 'info', icon: 'ph-arrow-left' },
        { label: 'Libur', count: libur, color: 'secondary', icon: 'ph-bed' },
        { label: 'Belum Absen', count: belumAbsen, color: 'light', icon: 'ph-minus-circle' },
    ];

    const colClass = 'col-md-2 col-4';

    let html = '';
    cards.forEach(c => {
        html += `
            <div class="${colClass}">
                <div class="card border-0 shadow-sm rounded-3 text-center p-3">
                    <div class="text-${c.color} mb-1"><i class="ph ${c.icon}" style="font-size:1.5rem;"></i></div>
                    <h4 class="fw-bold mb-0 text-${c.color}">${c.count}</h4>
                    <small class="text-muted">${c.label}</small>
                </div>
            </div>
        `;
    });

    $('#summaryCards').html(html);
}

let modalData = {};

$(document).on('click', '.status-cell', function() {
    const el = $(this);
    modalData = {
        tanggal: el.data('tanggal'),
        absensiId: el.data('absensi-id'),
        status: el.data('status'),
        kelasNama: el.data('kelas-nama'),
        initial: el.data('initial'),
    };

    const d = new Date(modalData.tanggal + 'T00:00:00');
    const formatted = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    $('#modalTanggal').text(formatted);
    $('#modalKelas').text(modalData.kelasNama + ' (' + modalData.initial + ')');
    $('#modalStatusSelect').val(modalData.status === 'BELUM ABSEN' ? '' : modalData.status);

    new bootstrap.Modal(document.getElementById('modalStatus')).show();
});

function simpanStatus() {
    const status = $('#modalStatusSelect').val();
    if (!status) {
        Swal.fire({ icon: 'warning', title: 'Pilih Status', text: 'Silakan pilih status terlebih dahulu' });
        return;
    }

    if (!modalData.absensiId) {
        Swal.fire({ icon: 'error', title: 'Gagal', text: 'Data absensi tidak ditemukan' });
        return;
    }

    $.ajax({
        url: '/rekap-kehadiran-sensei/update-status',
        type: 'POST',
        data: {
            _token: '{{ csrf_token() }}',
            id: modalData.absensiId,
            status: status,
        },
        success: function() {
            bootstrap.Modal.getInstance(document.getElementById('modalStatus')).hide();
            Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Status kehadiran diperbarui', timer: 1500, showConfirmButton: false });
            loadData();
        },
        error: function(xhr) {
            Swal.fire({ icon: 'error', title: 'Gagal', text: xhr.responseJSON?.message || 'Terjadi kesalahan' });
        }
    });
}

$(document).ready(function() {
    if ($.fn.select2) {
        $('#selectSensei').select2({ theme: 'bootstrap-5', width: '100%' });
    }
});
</script>
@endsection
