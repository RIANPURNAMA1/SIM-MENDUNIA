@extends('app')

@section('content')
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>


<style>
.stat-card { transition: box-shadow 0.2s; }
.stat-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
.fade-in { animation: fadeIn .4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.dash-table th { font-size: 11px; font-weight: 600; color: #65676b; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 14px; background: #f7f8fa; border-bottom: 1px solid #e4e6eb; }
.dash-table td { padding: 10px 14px; font-size: 13px; color: #050505; border-bottom: 1px solid #f0f2f5; }
.dash-table tr:hover td { background: #f7f8fa; }
.dash-table .badge-status { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 4px; display: inline-block; }
.badge-hadir { background: #e7f3ff; color: #1877f2; }
.badge-terlambat { background: #fff5e6; color: #e67e22; }
.badge-izin { background: #e8f5e9; color: #2e7d32; }
.badge-alpa { background: #fef0f2; color: #e41e3f; }
.dataTables_filter input { border: 1px solid #e4e6eb; border-radius: 6px; padding: 6px 12px; font-size: 13px; }
.dataTables_filter input:focus { outline: none; border-color: #1877f2; }
.progress-rasio { height: 6px; border-radius: 3px; }
.progress-hadir { background: #1877f2; }
.progress-terlambat { background: #f59e0b; }
.leaflet-popup-content-wrapper { border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
.leaflet-popup-content { margin: 10px 14px; font-size: 13px; }
</style>

<div class="container px-3 py-4">

    <div class="d-flex align-items-center justify-content-between mb-4">
        <div class="d-flex align-items-center gap-3">
            <div style="position: relative; flex-shrink: 0;">
                <img src="{{ Auth::user()->foto_profil ? asset('uploads/foto_profil/' . Auth::user()->foto_profil) : 'https://ui-avatars.com/api/?name=' . urlencode(Auth::user()->name) . '&background=1877f2&color=fff&size=80' }}"
                     class="rounded-circle border border-2 border-white shadow-sm"
                     style="width: 52px; height: 52px; object-fit: cover;">
                <span style="position: absolute; bottom: 2px; right: 2px; width: 12px; height: 12px; background: #31a24c; border: 2px solid #fff; border-radius: 50%;"></span>
            </div>
            <div>
                @php
                    $jam = now()->format('H');
                    if ($jam < 12) $salam = 'Pagi';
                    elseif ($jam < 15) $salam = 'Siang';
                    elseif ($jam < 18) $salam = 'Sore';
                    else $salam = 'Malam';
                @endphp
                <h5 style="font-weight: 700; margin: 0; color: #050505; font-size: 18px;">
                    Selamat {{ $salam }}, {{ Auth::user()->name }} <span style="display: inline-block;">👋</span>
                </h5>
                <div class="d-flex align-items-center gap-2 mt-1">
                    <span class="badge" style="background: #e7f3ff; color: #1877f2; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 4px;">
                        <i class="ph ph-suitcase-simple me-1"></i>{{ Auth::user()->divisi->nama_divisi ?? Auth::user()->role ?? 'Admin' }}
                    </span>
                    <small class="text-muted" style="font-size: 11px;">
                        <i class="ph ph-calendar-blank me-1"></i>{{ \Carbon\Carbon::now()->translatedFormat('l, d F Y') }}
                    </small>
                </div>
            </div>
        </div>
        <div class="d-none d-sm-block">
            <span class="badge bg-white border text-dark px-3 py-2 rounded-pill shadow-sm" style="font-size: 12px; font-weight: 500;">
                <i class="ph ph-clock me-1"></i>{{ now()->format('H:i') }} WIB
            </span>
        </div>
    </div>

    <!-- Filter Bar -->
    <div class="bg-white border rounded-3 p-3 mb-4">
        <form method="GET" action="{{ route('dashboard') }}" class="row g-2 align-items-end">
            <div class="col-auto">
                <label class="text-muted" style="font-size: 11px; font-weight: 600; letter-spacing: 0.3px;">DARI</label>
                <input type="date" name="start_date" value="{{ $startDate ?? '' }}" class="form-control form-control-sm" style="font-size: 12px; border-color: #e4e6eb;">
            </div>
            <div class="col-auto">
                <label class="text-muted" style="font-size: 11px; font-weight: 600; letter-spacing: 0.3px;">SAMPAI</label>
                <input type="date" name="end_date" value="{{ $endDate ?? '' }}" class="form-control form-control-sm" style="font-size: 12px; border-color: #e4e6eb;">
            </div>
            <div class="col-auto">
                <label class="text-muted" style="font-size: 11px; font-weight: 600; letter-spacing: 0.3px;">DIVISI</label>
                <select name="divisi_id" class="form-select form-select-sm" style="font-size: 12px; border-color: #e4e6eb; min-width: 140px;">
                    <option value="">Semua Divisi</option>
                    @foreach($divisis as $d)
                        <option value="{{ $d->id }}" {{ $divisiId == $d->id ? 'selected' : '' }}>{{ $d->nama_divisi }}</option>
                    @endforeach
                </select>
            </div>
            <div class="col-auto">
                <label class="text-muted" style="font-size: 11px; font-weight: 600; letter-spacing: 0.3px;">CABANG</label>
                <select name="cabang_id" class="form-select form-select-sm" style="font-size: 12px; border-color: #e4e6eb; min-width: 140px;">
                    <option value="">Semua Cabang</option>
                    @foreach($cabangs as $c)
                        <option value="{{ $c->id }}" {{ $cabangId == $c->id ? 'selected' : '' }}>{{ $c->nama_cabang }}</option>
                    @endforeach
                </select>
            </div>
            <div class="col-auto">
                <label class="text-muted" style="font-size: 11px; font-weight: 600; letter-spacing: 0.3px;">&nbsp;</label>
                <button type="submit" class="btn btn-primary btn-sm" style="font-size: 12px; background: #1877f2; border: none; padding: 5px 16px;">
                    <i class="ph ph-funnel me-1"></i>Filter
                </button>
                @if($startDate || $endDate || $cabangId || $divisiId)
                    <a href="{{ route('dashboard') }}" class="btn btn-outline-secondary btn-sm" style="font-size: 12px; padding: 5px 16px;">
                        <i class="ph ph-x me-1"></i>Reset
                    </a>
                @endif
            </div>
            @if($startDate && $endDate)
                <div class="col-auto">
                    <span class="badge" style="background: #e7f3ff; color: #1877f2; font-size: 11px; padding: 5px 12px;">
                        <i class="ph ph-calendar me-1"></i>{{ \Carbon\Carbon::parse($startDate)->translatedFormat('d M Y') }} — {{ \Carbon\Carbon::parse($endDate)->translatedFormat('d M Y') }}
                    </span>
                </div>
            @endif
        </form>
    </div>

    <!-- Stats Cards -->
    <div class="row g-2 mb-4">
        <div class="col-6 col-md-3 col-xl">
            <div class="stat-card bg-white border rounded-3 p-3 h-100 fade-in">
                <div class="d-flex align-items-center gap-2 mb-1">
                    <i class="ph ph-users" style="font-size: 16px; color: #65676b;"></i>
                    <span class="text-muted" style="font-size: 11px; font-weight: 600; letter-spacing: 0.3px;">TOTAL KARYAWAN</span>
                </div>
                <div class="d-flex align-items-baseline gap-1">
                    <span style="font-size: 22px; font-weight: 700; color: #050505;">{{ $totalKaryawan ?? 0 }}</span>
                    <small class="text-muted">org</small>
                </div>
                <small class="text-muted" style="font-size: 11px;">Aktif: <strong>{{ $karyawanAktif ?? 0 }}</strong></small>
            </div>
        </div>
        <div class="col-6 col-md-3 col-xl">
            <div class="stat-card bg-white border rounded-3 p-3 h-100 fade-in">
                <div class="d-flex align-items-center gap-2 mb-1">
                    <i class="ph ph-check-circle" style="font-size: 16px; color: #1877f2;"></i>
                    <span class="text-muted" style="font-size: 11px; font-weight: 600; letter-spacing: 0.3px;">HADIR HARI INI</span>
                </div>
                <div class="d-flex align-items-baseline gap-1">
                    <span style="font-size: 22px; font-weight: 700; color: #1877f2;">{{ $hadirHariIni ?? 0 }}</span>
                    <small class="text-muted">org</small>
                </div>
                <small class="text-muted" style="font-size: 11px;">Tepat waktu: <strong class="text-primary">{{ $tepatWaktu ?? 0 }}</strong></small>
            </div>
        </div>
        <div class="col-6 col-md-3 col-xl">
            <div class="stat-card bg-white border rounded-3 p-3 h-100 fade-in">
                <div class="d-flex align-items-center gap-2 mb-1">
                    <i class="ph ph-clock" style="font-size: 16px; color: #e67e22;"></i>
                    <span class="text-muted" style="font-size: 11px; font-weight: 600; letter-spacing: 0.3px;">TERLAMBAT</span>
                </div>
                <div class="d-flex align-items-baseline gap-1">
                    <span style="font-size: 22px; font-weight: 700; color: #e67e22;">{{ $terlambat ?? 0 }}</span>
                    <small class="text-muted">org</small>
                </div>
                @php $ptg = ($totalHadirSemua ?? 0) > 0 ? round(($terlambat / $totalHadirSemua) * 100) : 0; @endphp
                <div class="progress progress-rasio mt-2">
                    <div class="progress-bar progress-terlambat" style="width: {{ min($ptg, 100) }}%"></div>
                </div>
            </div>
        </div>
        <div class="col-6 col-md-3 col-xl">
            <div class="stat-card bg-white border rounded-3 p-3 h-100 fade-in">
                <div class="d-flex align-items-center gap-2 mb-1">
                    <i class="ph ph-x-circle" style="font-size: 16px; color: #e41e3f;"></i>
                    <span class="text-muted" style="font-size: 11px; font-weight: 600; letter-spacing: 0.3px;">ALPA</span>
                </div>
                <div class="d-flex align-items-baseline gap-1">
                    <span style="font-size: 22px; font-weight: 700; color: #e41e3f;">{{ $tidakHadir ?? 0 }}</span>
                    <small class="text-muted">org</small>
                </div>
                <small class="text-muted" style="font-size: 11px;">Perlu <strong>cek</strong></small>
            </div>
        </div>
        <div class="col-6 col-md-3 col-xl">
            <div class="stat-card bg-white border rounded-3 p-3 h-100 fade-in">
                <div class="d-flex align-items-center gap-2 mb-1">
                    <i class="ph ph-file-text" style="font-size: 16px; color: #2e7d32;"></i>
                    <span class="text-muted" style="font-size: 11px; font-weight: 600; letter-spacing: 0.3px;">IZIN / SAKIT</span>
                </div>
                <div class="d-flex align-items-baseline gap-1">
                    <span style="font-size: 22px; font-weight: 700; color: #050505;">{{ $izinCuti ?? 0 }}</span>
                    <small class="text-muted">org</small>
                </div>
                <small class="text-muted" style="font-size: 11px;">Pending: <strong class="text-warning">{{ $izinPendingCount ?? 0 }}</strong></small>
            </div>
        </div>
        
    </div>

    <!-- Charts Row -->
    <div class="row g-3 mb-4">
        <div class="col-lg-8">
            <div class="bg-white border rounded-3 p-3">
                <div class="d-flex align-items-center justify-content-between mb-3">
                    <div>
                        <h6 class="mb-0" style="font-weight: 600; font-size: 14px;">Tren Kehadiran Bulanan</h6>
                        <small class="text-muted">6 bulan terakhir</small>
                    </div>
                    <div class="d-flex gap-3" style="font-size: 11px;">
                        <span><span class="rounded-circle d-inline-block me-1" style="width: 8px; height: 8px; background: #1877f2;"></span>Hadir</span>
                        <span><span class="rounded-circle d-inline-block me-1" style="width: 8px; height: 8px; background: #f59e0b;"></span>Terlambat</span>
                        <span><span class="rounded-circle d-inline-block me-1" style="width: 8px; height: 8px; background: #e41e3f;"></span>Alpa</span>
                        <span><span class="rounded-circle d-inline-block me-1" style="width: 8px; height: 8px; background: #10b981;"></span>Libur</span>
                    </div>
                </div>
                <div style="height: 260px;"><canvas id="attendanceBarChart"></canvas></div>
            </div>
        </div>
        <div class="col-lg-4">
            <div class="bg-white border rounded-3 p-3 h-100">
                <div class="d-flex align-items-center justify-content-between mb-3">
                    <div>
                        <h6 class="mb-0" style="font-weight: 600; font-size: 14px;">Komposisi{{ $startDate && $endDate ? ' Periode' : ' Hari Ini' }}</h6>
                        <small class="text-muted">{{ $startDate && $endDate ? \Carbon\Carbon::parse($startDate)->translatedFormat('d M') . ' — ' . \Carbon\Carbon::parse($endDate)->translatedFormat('d M Y') : date('d M Y') }}</small>
                    </div>
                </div>
                <div style="height: 260px;"><canvas id="compositionDonutChart"></canvas></div>
            </div>
        </div>
    </div>

    <!-- Sensei Section -->
    <div class="bg-white border rounded-3 mb-4 p-3">
        <div class="d-flex align-items-center justify-content-between mb-3">
            <div>
                <h6 class="mb-0" style="font-weight: 600; font-size: 14px;">
                    <i class="ph ph-chalkboard-teacher me-1" style="color: #8b5cf6;"></i>Kehadiran Sensei
                </h6>
                <small class="text-muted">Rekap absensi tenaga pengajar</small>
            </div>
            <div class="d-flex gap-3" style="font-size: 11px;">
                <span><span class="rounded-circle d-inline-block me-1" style="width: 8px; height: 8px; background: #8b5cf6;"></span>Hadir</span>
                <span><span class="rounded-circle d-inline-block me-1" style="width: 8px; height: 8px; background: #f59e0b;"></span>Terlambat</span>
                <span><span class="rounded-circle d-inline-block me-1" style="width: 8px; height: 8px; background: #ef4444;"></span>Alpa</span>
            </div>
        </div>
        <div class="row g-3">
            <div class="col-lg-8">
                <div style="height: 240px;"><canvas id="senseiBarChart"></canvas></div>
            </div>
            <div class="col-lg-4">
                <div class="d-flex flex-column align-items-center justify-content-center h-100">
                    <div style="height: 200px; width: 100%;"><canvas id="senseiDonutChart"></canvas></div>
                    <div class="d-flex align-items-center gap-4 mt-2 text-center">
                        <div>
                            <span class="d-block" style="font-size: 20px; font-weight: 700; color: #8b5cf6;">{{ $totalSenseiAktif }}</span>
                            <small class="text-muted">Sensei Aktif</small>
                        </div>
                        <div>
                            <span class="d-block" style="font-size: 20px; font-weight: 700; color: #050505;">{{ $kelasAktifCount }}</span>
                            <small class="text-muted">Kelas Aktif</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Rasio Keterlambatan per Divisi -->
    <div class="bg-white border rounded-3 mb-4">
        <div class="p-3 border-bottom d-flex align-items-center justify-content-between">
            <div>
                <h6 class="mb-0" style="font-weight: 600; font-size: 14px;">Rasio Keterlambatan per Divisi</h6>
                <small class="text-muted">Persentase hadir vs terlambat</small>
            </div>
        </div>
        <div class="p-3">
            @php
                $labelsRasio = $labelsRasio ?? [];
                $dataPersenHadir = $dataPersenHadir ?? [];
                $dataPersentaseTerlambat = $dataPersentaseTerlambat ?? [];
                $dataTotalKehadiran = $dataTotalKehadiran ?? [];
                $dataHadir = $dataHadir ?? [];
                $dataTerlambat = $dataTerlambat ?? [];
            @endphp
            @if (count($labelsRasio) > 0)
                <div style="height: {{ max(200, count($labelsRasio) * 40) }}px;">
                    <canvas id="rasioChart"></canvas>
                </div>
            @else
                <div class="text-center py-4 text-muted">Belum ada data divisi</div>
            @endif
        </div>
    </div>

    <!-- Map Section -->
    <div class="bg-white border rounded-3 mb-4">
        <div class="p-3 border-bottom d-flex align-items-center justify-content-between">
            <div>
                <h6 class="mb-0" style="font-weight: 600; font-size: 14px;">Sebaran Lokasi Absensi</h6>
                <small class="text-muted">Tracking real-time</small>
            </div>
            <span style="font-size: 11px; color: #1877f2;"><span class="live-dot" style="display: inline-block; width: 6px; height: 6px; background: #1877f2; border-radius: 50%; animation: pulseDot 1.8s infinite; margin-right: 4px;"></span>Live</span>
        </div>
        <div id="world-map-markers" style="height: 360px; border-radius: 0 0 8px 8px;"></div>
    </div>

    <!-- Izin & Lembur Row -->
    <div class="row g-3 mb-4">
        <div class="col-md-6">
            <div class="bg-white border rounded-3" style="max-height: 400px;">
                <div class="p-3 border-bottom d-flex align-items-center justify-content-between">
                    <h6 class="mb-0" style="font-weight: 600; font-size: 14px;">Riwayat Izin & Sakit</h6>
                    <span class="badge bg-light text-dark">{{ $dataIzinSakit->count() }}</span>
                </div>
                <div style="overflow-y: auto; max-height: 340px;">
                    <table class="table table-borderless mb-0 dash-table">
                        <tbody>
                            @forelse($dataIzinSakit as $izin)
                            <tr>
                                <td style="width: 40px;">
                                    <img src="{{ $izin->user->foto_profil ? asset('uploads/foto_profil/' . $izin->user->foto_profil) : 'https://ui-avatars.com/api/?name=' . urlencode($izin->user->name) . '&background=random' }}" class="rounded-circle" style="width: 32px; height: 32px; object-fit: cover;">
                                </td>
                                <td>
                                    <strong style="font-size: 13px;">{{ $izin->user->name }}</strong>
                                    <small class="d-block text-muted">{{ \Carbon\Carbon::parse($izin->tanggal)->format('d M Y') }} &middot; {{ $izin->cabang->nama_cabang ?? 'Pusat' }}</small>
                                </td>
                                <td class="text-end">
                                    <span class="badge-status {{ $izin->status == 'SAKIT' ? 'badge-alpa' : 'badge-izin' }}">{{ $izin->status }}</span>
                                </td>
                            </tr>
                            @empty
                            <tr><td colspan="3" class="text-center text-muted py-4">Tidak ada data</td></tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="bg-white border rounded-3" style="max-height: 400px;">
                <div class="p-3 border-bottom d-flex align-items-center justify-content-between">
                    <h6 class="mb-0" style="font-weight: 600; font-size: 14px;">Pengajuan Lembur</h6>
                    <span class="badge bg-light text-dark">{{ $notifLembur->count() }} request</span>
                </div>
                <div style="overflow-y: auto; max-height: 340px;">
                    <table class="table table-borderless mb-0 dash-table">
                        <tbody>
                            @forelse($notifLembur as $lembur)
                            <tr>
                                <td style="width: 40px;">
                                    <div style="width: 32px; height: 32px; background: #e7f3ff; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px; color: #1877f2;">{{ strtoupper(substr($lembur->user->name, 0, 2)) }}</div>
                                </td>
                                <td>
                                    <strong style="font-size: 13px;">{{ $lembur->user->name }}</strong>
                                    <small class="d-block text-muted">{{ $lembur->total_jam }} jam &middot; {{ \Carbon\Carbon::parse($lembur->tanggal)->format('d M') }}</small>
                                </td>
                                <td class="text-end">
                                    <a href="/approval-lembur" style="color: #1877f2;"><i class="ph ph-arrow-right"></i></a>
                                </td>
                            </tr>
                            @empty
                            <tr><td colspan="3" class="text-center text-muted py-4">Tidak ada pengajuan</td></tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

</div>


<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>

<script>
$(document).ready(function() {
    configCharts();

    // Leaflet Map
    var bounds = [];
    var mapAbsensi = L.map('world-map-markers');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19
    }).addTo(mapAbsensi);

    var masukIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [22, 36], iconAnchor: [11, 36], popupAnchor: [1, -30], shadowSize: [36, 36]
    });
    var pulangIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [22, 36], iconAnchor: [11, 36], popupAnchor: [1, -30], shadowSize: [36, 36]
    });

    @foreach ($absensis as $a)
        @if ($a->lat_masuk && $a->long_masuk)
        (function() {
            var ll = [{{ $a->lat_masuk }}, {{ $a->long_masuk }}];
            bounds.push(ll);
            L.marker(ll, { icon: masukIcon }).addTo(mapAbsensi)
                .bindPopup('<b>{{ addslashes($a->user->name) }}</b><br><small>Masuk: {{ $a->jam_masuk ?? '--' }}<br>{{ addslashes($a->cabang->nama_cabang ?? '--') }}</small>');
        })();
        @endif
        @if ($a->lat_pulang && $a->long_pulang)
        (function() {
            var ll = [{{ $a->lat_pulang }}, {{ $a->long_pulang }}];
            bounds.push(ll);
            L.marker(ll, { icon: pulangIcon }).addTo(mapAbsensi)
                .bindPopup('<b>{{ addslashes($a->user->name) }}</b><br><small>Pulang: {{ $a->jam_keluar ?? '--' }}</small>');
        })();
        @endif
    @endforeach

    if (bounds.length > 0) {
        mapAbsensi.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else {
        mapAbsensi.setView([-6.2, 106.8], 12);
    }
});

function configCharts() {
    // Bar Chart
    var barCtx = document.getElementById('attendanceBarChart');
    if (barCtx) {
        new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: {!! json_encode($labelsBar ?? []) !!},
                datasets: [
                    { label: 'Hadir', data: {!! json_encode($dataHadirBar ?? []) !!}, backgroundColor: '#1877f2', borderRadius: 2 },
                    { label: 'Terlambat', data: {!! json_encode($dataTerlambatBar ?? []) !!}, backgroundColor: '#f59e0b', borderRadius: 2 },
                    { label: 'Alpa', data: {!! json_encode($dataAlpaBar ?? []) !!}, backgroundColor: '#e41e3f', borderRadius: 2 },
                    { label: 'Libur', data: {!! json_encode($dataLiburBar ?? []) !!}, backgroundColor: '#10b981', borderRadius: 2 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                    y: { beginAtZero: true, grid: { color: '#f0f2f5' }, ticks: { font: { size: 11 } } }
                }
            }
        });
    }

    // Donut Chart
    var donutCtx = document.getElementById('compositionDonutChart');
    if (donutCtx) {
        new Chart(donutCtx, {
            type: 'doughnut',
            data: {
                labels: ['Hadir', 'Terlambat', 'Izin', 'Alpa'],
                datasets: [{
                    data: [{{ $donutData['hadir'] ?? 0 }}, {{ $donutData['terlambat'] ?? 0 }}, {{ $donutData['izin'] ?? 0 }}, {{ $donutData['alpa'] ?? 0 }}],
                    backgroundColor: ['#1877f2', '#f59e0b', '#2e7d32', '#e41e3f'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                cutout: '72%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { padding: 10, usePointStyle: true, font: { size: 11 } }
                    }
                }
            }
        });
    }

    // Rasio Chart — Line Chart
    var rasioCtx = document.getElementById('rasioChart');
    if (rasioCtx) {
        new Chart(rasioCtx, {
            type: 'line',
            data: {
                labels: {!! json_encode($labelsRasio ?? []) !!},
                datasets: [
                    {
                        label: 'Tepat Waktu',
                        data: {!! json_encode($dataPersenHadir ?? []) !!},
                        borderColor: '#1877f2',
                        backgroundColor: 'rgba(24, 119, 242, 0.08)',
                        pointBackgroundColor: '#1877f2',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        borderWidth: 2.5,
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Terlambat',
                        data: {!! json_encode($dataPersentaseTerlambat ?? []) !!},
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.08)',
                        pointBackgroundColor: '#f59e0b',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        borderWidth: 2.5,
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end',
                        labels: { usePointStyle: true, padding: 16, font: { size: 11 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                return ctx.dataset.label + ': ' + ctx.raw + '%';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 11 } }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: '#f0f2f5' },
                        ticks: { font: { size: 10 }, callback: function(v) { return v + '%'; } }
                    }
                }
            }
        });
    }

    // === Sensei Charts ===
    // Sensei Bar Chart
    var senseiBarCtx = document.getElementById('senseiBarChart');
    if (senseiBarCtx) {
        new Chart(senseiBarCtx, {
            type: 'bar',
            data: {
                labels: {!! json_encode($senseiLabelsBar ?? []) !!},
                datasets: [
                    { label: 'Hadir', data: {!! json_encode($senseiHadirBar ?? []) !!}, backgroundColor: '#8b5cf6', borderRadius: 2 },
                    { label: 'Terlambat', data: {!! json_encode($senseiTerlambatBar ?? []) !!}, backgroundColor: '#f59e0b', borderRadius: 2 },
                    { label: 'Alpa', data: {!! json_encode($senseiAlpaBar ?? []) !!}, backgroundColor: '#ef4444', borderRadius: 2 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                    y: { beginAtZero: true, grid: { color: '#f0f2f5' }, ticks: { font: { size: 11 } } }
                }
            }
        });
    }

    // Sensei Donut Chart
    var senseiDonutCtx = document.getElementById('senseiDonutChart');
    if (senseiDonutCtx) {
        new Chart(senseiDonutCtx, {
            type: 'doughnut',
            data: {
                labels: ['Hadir', 'Terlambat', 'Alpa', 'Izin'],
                datasets: [{
                    data: [{{ $senseiDonut['hadir'] ?? 0 }}, {{ $senseiDonut['terlambat'] ?? 0 }}, {{ $senseiDonut['alpa'] ?? 0 }}, {{ $senseiDonut['izin'] ?? 0 }}],
                    backgroundColor: ['#8b5cf6', '#f59e0b', '#ef4444', '#2e7d32'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { padding: 8, usePointStyle: true, font: { size: 10 } }
                    }
                }
            }
        });
    }
}
</script>
@endsection
