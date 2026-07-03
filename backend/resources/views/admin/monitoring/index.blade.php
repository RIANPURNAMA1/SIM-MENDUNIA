@extends('app')

@section('content')
    <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css"/>
    <link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/dataTables.bootstrap5.min.css">

    <style>
        .label-monitor {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 3px 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,.1);
            font-family: inherit;
            line-height: 1.5;
            white-space: nowrap;
        }
        .label-monitor::before { display: none; }
    </style>

    <div class="container-fluid px-4 py-4">
        <div class="d-flex align-items-center justify-content-between mb-4">
            <div>
                <h5 class="mb-0" style="font-weight: 700; font-size: 16px;">Monitoring Lokasi Absensi</h5>
                <small class="text-muted">Pantau sebaran lokasi absensi karyawan</small>
            </div>
        </div>

        <div class="rounded-3 mb-4">
            <div class="p-3 border-bottom" style="border-bottom-color: #f0f0f0 !important;">
                <form method="GET" class="row g-2 align-items-end">
                    <div class="col-md-3">
                        <label class="form-label fw-semibold mb-1" style="font-size: 12px;">Dari Tanggal</label>
                        <input type="date" name="tgl_mulai" value="{{ $tglMulai }}" class="form-control form-control-sm">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label fw-semibold mb-1" style="font-size: 12px;">Sampai Tanggal</label>
                        <input type="date" name="tgl_selesai" value="{{ $tglSelesai }}" class="form-control form-control-sm">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label fw-semibold mb-1" style="font-size: 12px;">Cabang</label>
                        <select name="cabang_id" class="form-select form-select-sm">
                            <option value="">Semua Cabang</option>
                            @foreach ($cabangs as $cab)
                                <option value="{{ $cab->id }}" {{ $cabangId == $cab->id ? 'selected' : '' }}>{{ $cab->nama_cabang }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="col-md-3 d-flex gap-1">
                        <button type="submit" class="btn btn-primary btn-sm w-100">
                            <i class="ph ph-magnifying-glass me-1"></i> Filter
                        </button>
                        <a href="{{ url()->current() }}" class="btn btn-outline-secondary btn-sm w-100">
                            <i class="ph ph-arrow-counter-clockwise me-1"></i> Reset
                        </a>
                    </div>
                </form>
            </div>
        </div>

        <div class="d-flex align-items-center gap-3 mb-3">
            <span class="badge bg-success px-3 py-2" style="font-size:12px">
                <i class="ph ph-circle me-1"></i> Masuk
            </span>
            <span class="badge bg-primary px-3 py-2" style="font-size:12px">
                <i class="ph ph-circle me-1"></i> Pulang
            </span>
            <span class="text-muted" style="font-size:13px">
                Total: <strong>{{ $absensis->count() }}</strong> titik lokasi
                | Periode: <strong>{{ \Carbon\Carbon::parse($tglMulai)->format('d M Y') }}</strong>
                s/d <strong>{{ \Carbon\Carbon::parse($tglSelesai)->format('d M Y') }}</strong>
            </span>
        </div>

        <div class="rounded-3 mb-4 overflow-hidden border">
            <div class="p-3 border-bottom d-flex align-items-center justify-content-between" style="border-bottom-color: #f0f0f0 !important;">
                <span class="fw-semibold" style="font-size: 13px;">Sebaran Lokasi Absensi</span>
            </div>
            <div id="map" style="height:480px;"></div>
        </div>

        <div class="rounded-3">
            <div class="p-3 border-bottom" style="border-bottom-color: #f0f0f0 !important;">
                <div class="d-flex align-items-center justify-content-between">
                    <span class="fw-semibold" style="font-size: 13px;">Detail Absensi</span>
                    <span class="text-muted" style="font-size: 11px;">{{ $absensis->count() }} data</span>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-hover text-nowrap mb-0" id="monitorTable">
                    <thead>
                        <tr>
                            <th scope="col">Karyawan</th>
                            <th scope="col">Tanggal</th>
                            <th scope="col" class="text-center">Jam Masuk</th>
                            <th scope="col" class="text-center">Jam Pulang</th>
                            <th scope="col">Cabang</th>
                            <th scope="col" class="text-center">Status</th>
                            <th scope="col" class="text-center">Lokasi</th>
                            <th scope="col" class="text-center">Foto</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($absensis as $a)
                            <tr>
                                <td>
                                    <span class="fw-medium" style="font-size: 13px;">{{ $a->user->name }}</span>
                                    <small class="d-block text-muted">{{ $a->user->nip ?? '' }}</small>
                                </td>
                                <td>
                                    <div style="font-size: 12px;">
                                        <div class="fw-medium">{{ \Carbon\Carbon::parse($a->tanggal)->format('d M Y') }}</div>
                                        <div class="text-muted" style="font-size: 11px;">{{ \Carbon\Carbon::parse($a->tanggal)->isoFormat('dddd') }}</div>
                                    </div>
                                </td>
                                <td class="text-center font-monospace">
                                    {{ $a->jam_masuk ? \Carbon\Carbon::parse($a->jam_masuk)->format('H:i') : '--:--' }}
                                </td>
                                <td class="text-center font-monospace">
                                    {{ $a->jam_keluar ? \Carbon\Carbon::parse($a->jam_keluar)->format('H:i') : '--:--' }}
                                </td>
                                <td>{{ $a->cabang->nama_cabang ?? '-' }}</td>
                                <td class="text-center">
                                    @php
                                        $statusClass = match($a->status) {
                                            'HADIR' => 'bg-success-subtle text-success',
                                            'TERLAMBAT' => 'bg-warning-subtle text-warning',
                                            'IZIN' => 'bg-info-subtle text-info',
                                            'ALPA' => 'bg-danger-subtle text-danger',
                                            'LIBUR' => 'bg-secondary-subtle text-secondary',
                                            default => 'bg-light text-muted',
                                        };
                                    @endphp
                                    <span class="badge {{ $statusClass }} rounded-pill fw-normal px-2 py-1">
                                        {{ $a->status }}
                                    </span>
                                </td>
                                <td class="text-center">
                                    @if($a->lat_masuk)
                                        <span class="badge bg-success-subtle text-success rounded-pill fw-normal px-2 py-1 mb-1 d-block">
                                            <i class="ph ph-map-pin me-1"></i>Masuk
                                        </span>
                                    @endif
                                    @if($a->lat_pulang)
                                        <span class="badge bg-primary-subtle text-primary rounded-pill fw-normal px-2 py-1 d-block">
                                            <i class="ph ph-map-pin me-1"></i>Pulang
                                        </span>
                                    @endif
                                </td>
                                <td class="text-center">
                                    <div class="d-flex gap-1 justify-content-center">
                                        @if($a->foto_masuk)
                                            <img src="{{ asset('storage/'.$a->foto_masuk) }}"
                                                 class="rounded shadow-sm"
                                                 style="width:30px;height:30px;object-fit:cover;cursor:pointer"
                                                 onclick="viewImg('{{ asset('storage/'.$a->foto_masuk) }}', 'Masuk')">
                                        @endif
                                        @if($a->foto_pulang)
                                            <img src="{{ asset('storage/'.$a->foto_pulang) }}"
                                                 class="rounded shadow-sm"
                                                 style="width:30px;height:30px;object-fit:cover;cursor:pointer"
                                                 onclick="viewImg('{{ asset('storage/'.$a->foto_pulang) }}', 'Pulang')">
                                        @endif
                                        @if(!$a->foto_masuk && !$a->foto_pulang)
                                            <span class="text-muted">—</span>
                                        @endif
                                    </div>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalFoto" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0">
                <div class="modal-header border-0 pb-0">
                    <h6 class="modal-title fw-bold" id="modalFotoLabel">Foto Absensi</h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body text-center p-2">
                    <img id="imgPreview" src="" class="w-100 rounded shadow-sm">
                </div>
            </div>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.6/js/dataTables.bootstrap5.min.js"></script>
    <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>

    <script>
        function viewImg(url, tipe) {
            $('#imgPreview').attr('src', url);
            $('#modalFotoLabel').text('Foto Absensi ' + tipe);
            $('#modalFoto').modal('show');
        }

        $(function () {
            $('#monitorTable').DataTable({
                responsive: true,
                autoWidth: false,
                pageLength: 10,
                lengthMenu: [10, 25, 50, 100],
                order: [[1, 'desc']],
                language: {
                    search: "Cari:",
                    lengthMenu: "Tampilkan _MENU_ data",
                    info: "Menampilkan _START_–_END_ dari _TOTAL_ data",
                    zeroRecords: "Data tidak ditemukan",
                    paginate: { first:"Awal", last:"Akhir", next:"›", previous:"‹" }
                }
            });
        });

        var bounds = [];

        var masukIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize:[25,41], iconAnchor:[12,41], popupAnchor:[1,-34], shadowSize:[41,41]
        });
        var pulangIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize:[25,41], iconAnchor:[12,41], popupAnchor:[1,-34], shadowSize:[41,41]
        });

        var map = L.map('map');
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
        }).addTo(map);

        @foreach ($absensis as $a)
            @if ($a->lat_masuk && $a->long_masuk)
                (function(){
                    var ll = [{{ $a->lat_masuk }}, {{ $a->long_masuk }}];
                    bounds.push(ll);
                    L.marker(ll, { icon: masukIcon })
                        .addTo(map)
                        .bindTooltip(
                            '<b style="font-size:11px">{{ addslashes($a->user->name) }}</b><br>' +
                            '<span style="font-size:10px;color:#6b7280">🟢 Masuk · {{ $a->jam_masuk ? \Carbon\Carbon::parse($a->jam_masuk)->format("H:i") : "--" }} · {{ \Carbon\Carbon::parse($a->tanggal)->format("d M") }}</span>',
                            { permanent: true, direction:'top', offset:[0,-38], className:'label-monitor' }
                        )
                        .bindPopup(
                            '<div style="min-width:160px">' +
                            '<p style="font-weight:700;font-size:13px;margin-bottom:6px">{{ addslashes($a->user->name) }}</p>' +
                            '<p style="font-size:12px">🟢 <b>Absen Masuk</b></p>' +
                            '<p style="font-size:12px;color:#6b7280">⏰ {{ $a->jam_masuk ?? "--" }}</p>' +
                            '<p style="font-size:12px;color:#6b7280">📅 {{ \Carbon\Carbon::parse($a->tanggal)->format("d M Y") }}</p>' +
                            '<p style="font-size:12px;color:#6b7280">🏢 {{ addslashes($a->cabang->nama_cabang ?? "--") }}</p>' +
                            '</div>'
                        );
                })();
            @endif
            @if ($a->lat_pulang && $a->long_pulang)
                (function(){
                    var ll = [{{ $a->lat_pulang }}, {{ $a->long_pulang }}];
                    bounds.push(ll);
                    L.marker(ll, { icon: pulangIcon })
                        .addTo(map)
                        .bindTooltip(
                            '<b style="font-size:11px">{{ addslashes($a->user->name) }}</b><br>' +
                            '<span style="font-size:10px;color:#6b7280">🔵 Pulang · {{ $a->jam_keluar ? \Carbon\Carbon::parse($a->jam_keluar)->format("H:i") : "--" }} · {{ \Carbon\Carbon::parse($a->tanggal)->format("d M") }}</span>',
                            { permanent: true, direction:'top', offset:[0,-38], className:'label-monitor' }
                        )
                        .bindPopup(
                            '<div style="min-width:160px">' +
                            '<p style="font-weight:700;font-size:13px;margin-bottom:6px">{{ addslashes($a->user->name) }}</p>' +
                            '<p style="font-size:12px">🔵 <b>Absen Pulang</b></p>' +
                            '<p style="font-size:12px;color:#6b7280">⏰ {{ $a->jam_keluar ?? "--" }}</p>' +
                            '<p style="font-size:12px;color:#6b7280">📅 {{ \Carbon\Carbon::parse($a->tanggal)->format("d M Y") }}</p>' +
                            '<p style="font-size:12px;color:#6b7280">🏢 {{ addslashes($a->cabang->nama_cabang ?? "--") }}</p>' +
                            '</div>'
                        );
                })();
            @endif
        @endforeach

        if (bounds.length > 0) {
            map.fitBounds(bounds, { padding:[60,60], maxZoom:16 });
        } else {
            map.setView([-6.2, 106.8], 12);
        }
    </script>
@endsection
