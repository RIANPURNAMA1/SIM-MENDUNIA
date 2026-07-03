@extends('app')

@section('content')
<div class="container-fluid px-4 py-4">
    <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
            <h5 class="mb-0" style="font-weight: 700; font-size: 16px;">Atur Jadwal Shift</h5>
            <small class="text-muted">Kelola jadwal shift karyawan per tanggal</small>
        </div>
    </div>

    <div class="row">
        <div class="col-md-4">
            <div class="card border-0 shadow-sm rounded-3 mb-4">
                <div class="card-body p-4">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Pilih Karyawan</label>
                        <select id="selectKaryawanShift" class="form-select select2">
                            <option value="">-- Pilih Karyawan --</option>
                            @foreach($karyawan as $k)
                                <option value="{{ $k->id }}">{{ $k->name }} ({{ $k->nip }})</option>
                            @endforeach
                        </select>
                    </div>

                    <div class="mb-3">
                        <label class="form-label fw-bold">Bulan & Tahun</label>
                        <div class="row">
                            <div class="col-md-6">
                                <select id="bulanShift" class="form-select">
                                    @for($i = 1; $i <= 12; $i++)
                                        <option value="{{ $i }}" {{ $i == now()->month ? 'selected' : '' }}>{{ \Carbon\Carbon::create()->month($i)->format('F') }}</option>
                                    @endfor
                                </select>
                            </div>
                            <div class="col-md-6">
                                <select id="tahunShift" class="form-select">
                                    @for($i = now()->year - 1; $i <= now()->year + 1; $i++)
                                        <option value="{{ $i }}" {{ $i == now()->year ? 'selected' : '' }}>{{ $i }}</option>
                                    @endfor
                                </select>
                            </div>
                        </div>
                    </div>

                    <div id="selectedDatesPanel" class="d-none">
                        <hr>
                        <div class="mb-3">
                            <label class="form-label fw-bold">PILIH SHIFT:</label>
                            <select id="pilihShiftBatch" class="form-select">
                                <option value="">-- Pilih Shift --</option>
                                <option value="LIBUR" class="text-danger fw-bold">LIBUR</option>
                                @foreach($shifts as $s)
                                    <option value="{{ $s->id }}">{{ $s->nama_shift }} ({{ \Carbon\Carbon::parse($s->jam_masuk)->format('H:i') }} - {{ \Carbon\Carbon::parse($s->jam_pulang)->format('H:i') }})</option>
                                @endforeach
                            </select>
                        </div>

                        <div class="mb-3">
                            <input type="text" id="keteranganShiftBatch" class="form-control" placeholder="Keterangan (opsional)">
                        </div>

                        <div class="d-flex gap-2">
                            <button type="button" class="btn btn-danger flex-grow-1" onclick="hapusJadwalBatch()" disabled id="btnHapusBatch">
                                <i class="ph ph-trash me-1"></i> Hapus
                            </button>
                            <button type="button" class="btn btn-primary flex-grow-1" onclick="simpanJadwalBatch()" id="btnSimpanBatch">
                                <i class="ph ph-floppy-disk me-1"></i> Simpan
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card border-0 shadow-sm rounded-3">
                <div class="card-body p-4">
                    <small class="fw-bold">Legenda Shift:</small>
                    <div class="d-flex flex-wrap gap-2 mt-2" id="shiftLegend"></div>
                </div>
            </div>
        </div>

        <div class="col-md-8">
            <div class="card border-0 shadow-sm rounded-3">
                <div class="card-body p-4">
                    <div id="calendarContainer" class="d-none">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <button type="button" class="btn btn-sm btn-outline-secondary" onclick="changeMonth(-1)">
                                <i class="ph ph-caret-left"></i>
                            </button>
                            <h5 class="fw-bold mb-0" id="calendarTitle"></h5>
                            <button type="button" class="btn btn-sm btn-outline-secondary" onclick="changeMonth(1)">
                                <i class="ph ph-caret-right"></i>
                            </button>
                        </div>

                        <div class="mb-3 p-3 bg-light rounded">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <small class="fw-bold text-muted">TANGGAL DIPILIH:</small>
                                <div>
                                    <button type="button" class="btn btn-sm btn-outline-primary me-1" onclick="pilihSemuaTanggal()">Pilih Semua</button>
                                    <button type="button" class="btn btn-sm btn-outline-success me-1" onclick="pilihHariKerja()">Pilih Hari Kerja</button>
                                    <button type="button" class="btn btn-sm btn-outline-info me-1" onclick="pilihHariKerjaSetahun()">Pilih Hari Kerja Setahun</button>
                                    <button type="button" class="btn btn-sm btn-outline-secondary" onclick="clearSemuaTanggal()">Clear</button>
                                </div>
                            </div>
                            <div id="selectedDatesBadge" class="d-flex flex-wrap gap-1"></div>
                        </div>

                        <div class="table-responsive">
                            <table class="table table-bordered text-center mb-0" id="calendarTable">
                                <thead class="table-light">
                                    <tr>
                                        <th class="text-danger">Min</th>
                                        <th>Sen</th>
                                        <th>Sel</th>
                                        <th>Rab</th>
                                        <th>Kam</th>
                                        <th>Jum</th>
                                        <th class="text-primary">Sab</th>
                                    </tr>
                                </thead>
                                <tbody id="calendarDays"></tbody>
                            </table>
                        </div>

                        <div class="mt-3 p-3 bg-light rounded" id="existingScheduleInfo">
                            <small class="fw-bold">Jadwal Tersimpan:</small>
                            <div class="mt-2" id="existingScheduleList">
                                <small class="text-muted">Pilih karyawan untuk melihat jadwal</small>
                            </div>
                        </div>
                    </div>

                    <div id="jadwalKosong" class="text-center py-5 text-muted">
                        <i class="ph ph-calendar-blank" style="font-size: 3rem;"></i>
                        <p class="mt-2">Pilih karyawan untuk melihat kalender jadwal shift</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.calendar-day {
    min-height: 60px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s;
}
.calendar-day:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
#calendarTable td {
    padding: 2px;
    vertical-align: top;
}
</style>

<script>
let jadwalShiftData = {};
let currentMonth = parseInt('{{ now()->month }}');
let currentYear = parseInt('{{ now()->year }}');
let selectedTanggalList = [];
let allShifts = @json($shifts);

const shiftColors = {
    1: 'bg-success',
    2: 'bg-info', 
    3: 'bg-warning',
    4: 'bg-danger',
    5: 'bg-primary',
    6: 'bg-secondary',
    7: 'bg-dark'
};

$('#selectKaryawanShift, #bulanShift, #tahunShift').on('change', function() {
    loadJadwalShift();
});

function loadJadwalShift() {
    const userId = $('#selectKaryawanShift').val();
    const bulan = $('#bulanShift').val();
    const tahun = $('#tahunShift').val();

    if (!userId) {
        $('#calendarContainer').addClass('d-none');
        $('#selectedDatesPanel').addClass('d-none');
        $('#jadwalKosong').removeClass('d-none');
        $('#existingScheduleList').html('<small class="text-muted">Pilih karyawan untuk melihat jadwal</small>');
        return;
    }

    currentMonth = parseInt(bulan);
    currentYear = parseInt(tahun);

    $.ajax({
        url: `/shift-jadwal/${userId}?bulan=${bulan}&tahun=${tahun}`,
        type: 'GET',
        success: function(res) {
            if (res.success) {
                jadwalShiftData = res.jadwals;
                selectedTanggalList = [];
                renderCalendar();
                renderLegend();
                renderExistingSchedule();
                updateSelectedDatesDisplay();
                $('#calendarContainer').removeClass('d-none');
                $('#selectedDatesPanel').removeClass('d-none');
                $('#jadwalKosong').addClass('d-none');
            }
        }
    });
}

function renderExistingSchedule() {
    const container = $('#existingScheduleList');
    const entries = Object.entries(jadwalShiftData);
    
    if (entries.length === 0) {
        container.html('<small class="text-muted">Belum ada jadwal di bulan ini</small>');
        return;
    }

    let html = '<div class="table-responsive" style="max-height: 200px; overflow-y: auto;"><table class="table table-sm table-borderless mb-0">';
    entries.sort((a, b) => a[0].localeCompare(b[0])).forEach(([tgl, dataArr]) => {
        const tglFormatted = new Date(tgl + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
        html += `<tr><td class="text-nowrap">${tglFormatted}</td><td>`;
        (Array.isArray(dataArr) ? dataArr : [dataArr]).forEach(j => {
            if (j.is_libur) {
                html += `<span class="badge bg-danger text-white me-1">LIBUR</span>`;
            } else {
                const shift = j.shift;
                html += `<span class="badge ${shiftColors[shift?.id] || 'bg-secondary'} text-white me-1">${shift?.nama_shift || '-'}</span>`;
            }
        });
        html += '</td></tr>';
    });
    html += '</table></div>';
    container.html(html);
}

function renderCalendar() {
    const bulanNama = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    $('#calendarTitle').text(`${bulanNama[currentMonth - 1]} ${currentYear}`);

    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    const container = $('#calendarDays');
    container.empty();

    let row = $('<tr></tr>');
    for (let i = 0; i < firstDay; i++) {
        row.append('<td></td>');
    }

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() + 1 === currentMonth;

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayOfWeek = new Date(currentYear, currentMonth - 1, day).getDay();
        const jadwalArr = jadwalShiftData[dateStr];
        const shifts = Array.isArray(jadwalArr) ? jadwalArr.map(j => j.shift).filter(Boolean) : [];
        const firstShift = shifts[0];
        const isSelected = selectedTanggalList.includes(dateStr);
        const isDefaultLibur = dayOfWeek === 0 || dayOfWeek === 6;
        const hasLibur = (Array.isArray(jadwalArr) && jadwalArr.some(j => j.is_libur)) || isDefaultLibur;

        let bgClass = 'bg-light';
        let textClass = 'text-dark';
        let borderClass = '';

        if (isCurrentMonth && day === today.getDate()) {
            borderClass = 'border border-2 border-primary';
        }

        if (isSelected) {
            borderClass = 'border border-3 border-primary';
            bgClass = 'bg-primary';
            textClass = 'text-white';
        } else if (shifts.length > 0) {
            bgClass = 'bg-light';
            textClass = 'text-dark';
        } else if (hasLibur) {
            textClass = 'text-danger';
            bgClass = 'bg-light';
            borderClass = 'border border-1 border-danger';
        }

        let shiftHtml = '';
        if (!isSelected && shifts.length > 0) {
            shifts.forEach(s => {
                const color = shiftColors[s.id] || 'bg-secondary';
                shiftHtml += `<small class="badge ${color} text-white d-block mt-1" style="font-size:0.6rem;">${s.nama_shift}</small>`;
            });
        }
        if (!isSelected && shifts.length === 0 && hasLibur) {
            shiftHtml = '<small class="fw-bold text-danger d-block mt-1" style="font-size:0.6rem;">LIBUR</small>';
        }

        const cell = $(`
            <td class="p-1">
                <div class="calendar-day rounded d-flex flex-column align-items-center justify-content-center ${bgClass} ${textClass} ${borderClass}"
                     onclick="toggleTanggal('${dateStr}')"
                     style="min-height: 60px; cursor: pointer;">
                    <span class="fw-bold">${day}</span>
                    ${shiftHtml}
                    ${isSelected ? '<small><i class="ph ph-check"></i></small>' : ''}
                </div>
            </td>
        `);
        row.append(cell);

        if (dayOfWeek === 6 || day === daysInMonth) {
            container.append(row);
            if (day !== daysInMonth) {
                row = $('<tr></tr>');
            }
        }
    }
}

function renderLegend() {
    const legend = $('#shiftLegend');
    legend.empty();
    
    allShifts.forEach(function(shift) {
        const color = shiftColors[shift.id] || 'bg-secondary';
        legend.append(`
            <span class="badge ${color} text-white">
                ${shift.nama_shift} (${shift.jam_masuk.substring(0,5)}-${shift.jam_pulang.substring(0,5)})
            </span>
        `);
    });
}

function toggleTanggal(tanggal) {
    const index = selectedTanggalList.indexOf(tanggal);
    if (index > -1) {
        selectedTanggalList.splice(index, 1);
    } else {
        selectedTanggalList.push(tanggal);
    }
    renderCalendar();
    updateSelectedDatesDisplay();
}

function pilihSemuaTanggal() {
    selectedTanggalList = [];
    for (let day = 1; day <= new Date(currentYear, currentMonth, 0).getDate(); day++) {
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        selectedTanggalList.push(dateStr);
    }
    renderCalendar();
    updateSelectedDatesDisplay();
}

function pilihHariKerja() {
    selectedTanggalList = [];
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayOfWeek = new Date(currentYear, currentMonth - 1, day).getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            selectedTanggalList.push(dateStr);
        }
    }
    renderCalendar();
    updateSelectedDatesDisplay();
}

function pilihHariKerjaSetahun() {
    selectedTanggalList = [];
    const tahun = parseInt($('#tahunShift').val());
    for (let bulan = 1; bulan <= 12; bulan++) {
        const daysInMonth = new Date(tahun, bulan, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const dayOfWeek = new Date(tahun, bulan - 1, day).getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                const dateStr = `${tahun}-${String(bulan).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                selectedTanggalList.push(dateStr);
            }
        }
    }
    renderCalendar();
    updateSelectedDatesDisplay();
    Swal.fire({ icon: 'success', title: 'Terpilih', text: `${selectedTanggalList.length} hari kerja dalam setahun`, timer: 2000, showConfirmButton: false });
}

function clearSemuaTanggal() {
    selectedTanggalList = [];
    renderCalendar();
    updateSelectedDatesDisplay();
}

function updateSelectedDatesDisplay() {
    const container = $('#selectedDatesBadge');
    container.empty();
    
    if (selectedTanggalList.length === 0) {
        container.append('<small class="text-muted">Belum ada tanggal dipilih</small>');
        $('#btnSimpanBatch').prop('disabled', true);
        $('#btnHapusBatch').prop('disabled', true);
    } else if (selectedTanggalList.length > 100) {
        container.append(`<span class="badge bg-primary">${selectedTanggalList.length} tanggal terpilih</span>`);
        $('#btnSimpanBatch').prop('disabled', false);
        $('#btnHapusBatch').prop('disabled', false);
    } else {
        const sorted = [...selectedTanggalList].sort();
        sorted.forEach(function(tgl) {
            const d = new Date(tgl + 'T00:00:00');
            const formatted = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
            container.append(`<span class="badge bg-primary">${formatted}</span>`);
        });
        $('#btnSimpanBatch').prop('disabled', false);
        $('#btnHapusBatch').prop('disabled', false);
    }
}

function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
    } else if (currentMonth < 1) {
        currentMonth = 12;
        currentYear--;
    }
    $('#bulanShift').val(currentMonth);
    $('#tahunShift').val(currentYear);
    selectedTanggalList = [];
    loadJadwalShift();
}

function simpanJadwalBatch() {
    const userId = $('#selectKaryawanShift').val();
    const shiftVal = $('#pilihShiftBatch').val();
    const keterangan = $('#keteranganShiftBatch').val();
    const isLibur = shiftVal === 'LIBUR';

    if (!userId || !shiftVal) {
        Swal.fire({ icon: 'warning', title: 'Pilih Shift', text: 'Silakan pilih shift terlebih dahulu' });
        return;
    }

    if (selectedTanggalList.length === 0) {
        Swal.fire({ icon: 'warning', title: 'Pilih Tanggal', text: 'Silakan pilih minimal 1 tanggal' });
        return;
    }

    const reqData = {
        _token: '{{ csrf_token() }}',
        user_id: userId,
        tanggal_list: selectedTanggalList,
        keterangan: keterangan
    };

    if (isLibur) {
        reqData.is_libur = 1;
    } else {
        reqData.shift_id = shiftVal;
    }

    $.ajax({
        url: '{{ route("shift-jadwal.multiple") }}',
        type: 'POST',
        data: reqData,
        success: function(res) {
            Swal.fire({ icon: 'success', title: 'Berhasil', text: res.message });
            selectedTanggalList = [];
            $('#pilihShiftBatch').val('');
            $('#keteranganShiftBatch').val('');
            loadJadwalShift();
        },
        error: function(xhr) {
            Swal.fire({ icon: 'error', title: 'Gagal', text: xhr.responseJSON?.message || 'Terjadi kesalahan' });
        }
    });
}

function hapusJadwalBatch() {
    const userId = $('#selectKaryawanShift').val();

    if (selectedTanggalList.length === 0) {
        Swal.fire({ icon: 'warning', title: 'Pilih Tanggal', text: 'Silakan pilih minimal 1 tanggal' });
        return;
    }

    const datesWithJadwal = selectedTanggalList.filter(tgl => {
        const arr = jadwalShiftData[tgl];
        return Array.isArray(arr) && arr.length > 0;
    });
    if (datesWithJadwal.length === 0) {
        Swal.fire({ icon: 'warning', title: 'Tidak Ada Jadwal', text: 'Tidak ada jadwal shift di tanggal yang dipilih' });
        return;
    }

    let totalCount = 0;
    datesWithJadwal.forEach(tgl => {
        totalCount += jadwalShiftData[tgl].length;
    });

    Swal.fire({
        title: 'Hapus Jadwal?',
        text: `Akan menghapus ${totalCount} jadwal shift dari ${datesWithJadwal.length} hari`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, hapus!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            let deleted = 0;
            const allIds = [];
            datesWithJadwal.forEach(tgl => {
                jadwalShiftData[tgl].forEach(j => {
                    if (j.id) allIds.push(j.id);
                });
            });
            Promise.all(allIds.map(id => {
                return $.ajax({
                    url: `/shift-jadwal/${id}`,
                    type: 'DELETE',
                    data: { _token: '{{ csrf_token() }}' }
                }).then(() => deleted++);
            })).then(() => {
                Swal.fire({ icon: 'success', title: 'Berhasil', text: `${deleted} jadwal dihapus` });
                selectedTanggalList = [];
                loadJadwalShift();
            });
        }
    });
}

$(document).ready(function() {
    if ($.fn.select2) {
        $('#selectKaryawanShift').select2({ theme: 'bootstrap-5', width: '100%' });
    }
    renderLegend();
});
</script>
@endsection