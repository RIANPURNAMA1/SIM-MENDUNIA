<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Data Siswa</title>
    <link rel="icon" href="{{ asset('assets/images/logo/logo-sm.png') }}" type="image/png" style="width: 40px">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <style>
        .safe-area-bottom { padding-bottom: env(safe-area-bottom); }
        .table-wrapper { -webkit-overflow-scrolling: touch; }
        @media (max-width: 420px) {
            .kelas-card { padding: 0.75rem; }
            .kelas-icon { width: 2.5rem; height: 2.5rem; }
        }
    </style>
</head>

<body class="bg-gray-50 pb-24">

    <div class="bg-white px-4 pt-3 pb-2">
        <div class="flex items-center justify-between text-xs text-gray-600">
            <span id="statusTime">--:--</span>
        </div>
    </div>

    <!-- HEADER -->
    <div class="px-4 sm:px-5 pt-4 pb-2 flex items-center gap-3">
        <button id="btnBack" onclick="backToBatch()"
            class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
            <i data-lucide="arrow-left" class="w-5 h-5 text-gray-600"></i>
        </button>
        <div>
            <h1 id="pageTitle" class="text-lg font-bold text-gray-900">Data Siswa</h1>
            <p id="pageSubtitle" class="text-xs text-gray-500">{{ $kelasList->count() }} kelas tersedia</p>
        </div>
    </div>

    <!-- KELAS LIST VIEW -->
    <div id="batchView" class="px-4 sm:px-5 space-y-3">
        @forelse ($kelasList as $k)
        <button onclick="pilihBatch('{{ $k->batch_id }}', '{{ $k->nama_kelas }}', {{ $k->level }}, {{ $k->id }})"
            class="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-95 transition text-left kelas-card">
            <div class="flex items-center gap-3 sm:gap-4">
                <div class="w-12 h-12 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 kelas-icon">
                    <i data-lucide="book-open" class="w-6 h-6 text-purple-600"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <h3 class="text-base font-semibold text-gray-900">{{ $k->nama_kelas }}</h3>
                    <p class="text-xs text-gray-500 mt-0.5">
                        {{ $k->batchRelasi->nama_batch ?? '-' }} &middot; Level {{ $k->level }} &middot; {{ $k->user->name ?? $k->user->nama ?? '-' }}
                    </p>
                    <p class="text-xs text-gray-400 mt-0.5">
                        {{ $k->tanggal_mulai->format('d/m') }} - {{ $k->tanggal_selesai->format('d/m') }} &middot; {{ $k->siswa_count }} siswa
                    </p>
                </div>
                <i data-lucide="chevron-right" class="w-5 h-5 text-gray-400"></i>
            </div>
        </button>
        @empty
        <div class="text-center py-12 text-gray-400">
            <i data-lucide="layers" class="w-12 h-12 mx-auto mb-3 text-gray-300"></i>
            <p class="text-sm">Belum ada kelas</p>
        </div>
        @endforelse
    </div>

    <!-- SISWA ATTENDANCE VIEW (hidden by default) -->
    <div id="siswaView" class="hidden">
        <!-- TAB NAVIGATION -->
        <div class="px-4 sm:px-5 pb-3">
            <div class="flex bg-gray-100 rounded-xl p-1">
                <button id="tabKehadiran" onclick="switchTab('kehadiran')" class="flex-1 py-2 text-xs font-bold rounded-lg bg-white text-gray-900 shadow-sm transition">Kehadiran Siswa</button>
                <button id="tabPenilaian" onclick="switchTab('penilaian')" class="flex-1 py-2 text-xs font-bold rounded-lg text-gray-500 hover:text-gray-900 transition">Penilaian Siswa</button>
            </div>
        </div>

        <!-- KEHADIRAN TAB -->
        <div id="contentKehadiran">
        <!-- PENDING IZIN SECTION -->
        <div id="pendingIzinContainer" class="px-4 sm:px-5 pb-3 hidden">
            <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div class="flex items-center gap-2 mb-3">
                    <i data-lucide="bell-ringing" class="w-5 h-5 text-amber-600"></i>
                    <h3 class="text-sm font-bold text-amber-800">Pengajuan Izin</h3>
                </div>
                <div id="pendingIzinList" class="space-y-2"></div>
            </div>
        </div>

        <div class="px-3 sm:px-5 pb-3 overflow-x-auto table-wrapper">
            <div class="flex flex-wrap gap-1 text-xs text-gray-500 mb-2">
                <span class="inline-flex items-center gap-1 mr-2"><span class="w-2.5 h-2.5 rounded bg-blue-500"></span> H</span>
                <span class="inline-flex items-center gap-1 mr-2"><span class="w-2.5 h-2.5 rounded bg-amber-500"></span> I</span>
                <span class="inline-flex items-center gap-1 mr-2"><span class="w-2.5 h-2.5 rounded bg-red-500"></span> A</span>
                <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-green-500"></span> S</span>
            </div>
            <table class="w-full text-xs border-collapse">
                <thead>
                    <tr>
                        <th class="text-left py-1.5 pr-2 sticky left-0 bg-gray-50 z-10 min-w-[100px] text-gray-700 font-semibold text-[11px]">Nama</th>
                        <th class="text-center py-1.5 px-1 text-gray-700 font-semibold w-8 text-[11px]">Lv</th>
                        @foreach ($days as $d)
                        <th class="text-center py-1.5 px-0.5 text-gray-700 font-semibold w-9">
                            <span class="text-[11px]">{{ \Carbon\Carbon::parse($d)->translatedFormat('D') }}</span>
                            <span class="text-[9px] text-gray-400 block">{{ \Carbon\Carbon::parse($d)->format('d/m') }}</span>
                        </th>
                        @endforeach
                    </tr>
                </thead>
                <tbody id="siswaTableBody">
                </tbody>
            </table>
        </div>
        <div id="siswaEmpty" class="px-5 text-center py-12 text-gray-400 hidden">
            <i data-lucide="users" class="w-12 h-12 mx-auto mb-3 text-gray-300"></i>
            <p class="text-sm">Tidak ada siswa di batch ini</p>
        </div>
    </div>

    <!-- PENILAIAN TAB -->
    <div id="contentPenilaian" class="hidden">
        <div class="px-4 sm:px-5">
            <div id="penilaianCategoryNav" class="flex flex-wrap gap-2 mb-3"></div>
        </div>
        <div class="px-3 sm:px-5 pb-3 overflow-x-auto">
            <div id="penilaianLegend" class="flex flex-wrap gap-1 text-xs text-gray-500 mb-2 hidden">
                <span class="inline-flex items-center gap-1 mr-2"><span class="w-2.5 h-2.5 rounded bg-green-500"></span> Terisi</span>
                <span class="inline-flex items-center gap-1 mr-2"><span class="w-2.5 h-2.5 rounded bg-gray-200"></span> Kosong</span>
            </div>
            <table class="w-full text-xs border-collapse">
                <thead>
                    <tr>
                        <th class="text-left py-1.5 pr-2 sticky left-0 bg-gray-50 z-10 min-w-[100px] text-gray-700 font-semibold text-[11px]">Nama Kandidat</th>
                        @foreach ($days as $d)
                        <th class="text-center py-1.5 px-0.5 text-gray-700 font-semibold w-9">
                            <span class="text-[11px]">{{ \Carbon\Carbon::parse($d)->translatedFormat('D') }}</span>
                            <span class="text-[9px] text-gray-400 block">{{ \Carbon\Carbon::parse($d)->format('d/m') }}</span>
                        </th>
                        @endforeach
                    </tr>
                </thead>
                <tbody id="penilaianTableBody">
                </tbody>
            </table>
        </div>
        <div id="penilaianEmpty" class="px-5 text-center py-12 text-gray-400 hidden">
            <i data-lucide="file-text" class="w-12 h-12 mx-auto mb-3 text-gray-300"></i>
            <p class="text-sm">Belum ada template penilaian untuk level ini</p>
        </div>
        <div id="penilaianLoading" class="px-5 text-center py-12 text-gray-400 hidden">
            <p class="text-sm">Memuat...</p>
        </div>
    </div>
</div>

    <!-- PENILAIAN MODAL -->
    <div id="penilaianModalOverlay" class="fixed inset-0 z-[70] bg-black/30 hidden" onclick="closePenilaianModal()"></div>
    <div id="penilaianModal" class="fixed inset-0 z-[80] hidden flex items-center justify-center p-5">
        <div class="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-gray-200 p-5 max-h-[80vh] overflow-y-auto" onclick="event.stopPropagation()">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h3 id="penilaianModalTitle" class="text-sm font-bold text-gray-900"></h3>
                    <p id="penilaianModalDate" class="text-xs text-gray-400"></p>
                </div>
                <button onclick="closePenilaianModal()" class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition"><i data-lucide="x" class="w-4 h-4 text-gray-400"></i></button>
            </div>
            <div id="penilaianModalBody" class="space-y-3"></div>
            <div class="flex gap-2 mt-5">
                <button onclick="closePenilaianModal()" class="flex-1 py-2.5 text-xs font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition">Batal</button>
                <button id="penilaianModalSave" onclick="savePenilaianModal()" class="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition">Simpan</button>
            </div>
        </div>
    </div>

    <!-- META CSRF -->
    <meta name="csrf-token" content="{{ csrf_token() }}">

    @include('components.bottom_Nav')

    <!-- STATUS PICKER MODAL -->
    <div id="statusPickerOverlay" class="fixed inset-0 z-[70] bg-black/30 hidden" onclick="closeStatusPicker()"></div>
    <div id="statusPicker" class="fixed inset-0 z-[80] hidden flex items-center justify-center p-5">
        <div class="bg-white w-full max-w-xs rounded-2xl shadow-xl border border-gray-200 p-6" onclick="event.stopPropagation()">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-bold text-gray-900">Ubah Status</h3>
                <button onclick="closeStatusPicker()" class="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                    <i data-lucide="x" class="w-4 h-4 text-gray-500"></i>
                </button>
            </div>
            <div class="grid grid-cols-5 gap-2">
                <button onclick="pickStatus('HADIR')" class="flex flex-col items-center gap-1 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 active:scale-95 transition">
                    <span class="w-9 h-9 rounded-xl bg-blue-500 text-white font-bold text-sm flex items-center justify-center">H</span>
                    <span class="text-[10px] font-medium text-blue-700">Hadir</span>
                </button>
                <button onclick="pickStatus('IZIN')" class="flex flex-col items-center gap-1 p-3 rounded-xl bg-amber-50 hover:bg-amber-100 active:scale-95 transition">
                    <span class="w-9 h-9 rounded-xl bg-amber-500 text-white font-bold text-sm flex items-center justify-center">I</span>
                    <span class="text-[10px] font-medium text-amber-700">Izin</span>
                </button>
                <button onclick="pickStatus('ALPA')" class="flex flex-col items-center gap-1 p-3 rounded-xl bg-red-50 hover:bg-red-100 active:scale-95 transition">
                    <span class="w-9 h-9 rounded-xl bg-red-500 text-white font-bold text-sm flex items-center justify-center">A</span>
                    <span class="text-[10px] font-medium text-red-700">Alpa</span>
                </button>
                <button onclick="pickStatus('SAKIT')" class="flex flex-col items-center gap-1 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:scale-95 transition">
                    <span class="w-9 h-9 rounded-xl bg-emerald-500 text-white font-bold text-sm flex items-center justify-center">S</span>
                    <span class="text-[10px] font-medium text-emerald-700">Sakit</span>
                </button>
                <button onclick="pickStatus(null)" class="flex flex-col items-center gap-1 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 active:scale-95 transition">
                    <span class="w-9 h-9 rounded-xl bg-gray-300 text-white font-bold text-sm flex items-center justify-center">-</span>
                    <span class="text-[10px] font-medium text-gray-600">Kosong</span>
                </button>
            </div>
        </div>
    </div>

    <!-- RIWAYAT SISWA MODAL -->
    <div id="riwayatModalOverlay" class="fixed inset-0 z-50 bg-black/30 hidden" onclick="closeRiwayatModal()"></div>
    <div id="riwayatModal" class="fixed inset-0 z-50 hidden flex items-end sm:items-center justify-center">
        <div class="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[85vh] overflow-y-auto safe-area-bottom" onclick="event.stopPropagation()">
            <div class="sticky top-0 bg-white z-10 border-b border-gray-100 px-5 py-4 flex items-center gap-3">
                <button onclick="closeRiwayatModal()" class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <i data-lucide="x" class="w-4 h-4 text-gray-500"></i>
                </button>
                <div class="flex items-center gap-3 flex-1 min-w-0">
                    <img id="riwayatFoto" src="" class="w-10 h-10 rounded-full object-cover flex-shrink-0">
                    <div class="min-w-0">
                        <h3 id="riwayatNama" class="text-sm font-bold text-gray-900 truncate"></h3>
                        <p id="riwayatKelas" class="text-xs text-gray-500"></p>
                    </div>
                </div>
            </div>
            <div class="px-5 py-4">
                <div class="flex items-center justify-between mb-4">
                    <button onclick="riwayatPrevMonth()" class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
                        <i data-lucide="chevron-left" class="w-4 h-4 text-gray-600"></i>
                    </button>
                    <h4 id="riwayatBulan" class="text-sm font-bold text-gray-800"></h4>
                    <button onclick="riwayatNextMonth()" class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
                        <i data-lucide="chevron-right" class="w-4 h-4 text-gray-600"></i>
                    </button>
                </div>
                <div class="flex gap-1 text-[10px] text-gray-500 mb-3 flex-wrap">
                    <span class="inline-flex items-center gap-1 mr-2"><span class="w-2 h-2 rounded bg-blue-500"></span> H</span>
                    <span class="inline-flex items-center gap-1 mr-2"><span class="w-2 h-2 rounded bg-amber-500"></span> I</span>
                    <span class="inline-flex items-center gap-1 mr-2"><span class="w-2 h-2 rounded bg-red-500"></span> A</span>
                    <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded bg-green-500"></span> S</span>
                </div>
                <div id="riwayatCalendar" class="grid grid-cols-7 gap-1"></div>
                <div id="riwayatLoading" class="text-center py-8 text-gray-400 text-sm">Memuat...</div>
            </div>
        </div>
    </div>

    <script>
        function updateTime() {
            const now = new Date();
            document.getElementById('statusTime').textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        }
        updateTime();
        setInterval(updateTime, 1000);
        lucide.createIcons();

        let isDrillDown = false;
        let _activeBatchId = null;
        let _kelasSenseiId = null;
        let _penilaianData = null;
        let _selectedCategoryId = null;

        function switchTab(tab) {
            document.getElementById('contentKehadiran').classList.toggle('hidden', tab !== 'kehadiran');
            document.getElementById('contentPenilaian').classList.toggle('hidden', tab !== 'penilaian');
            document.getElementById('tabKehadiran').className = tab === 'kehadiran'
                ? 'flex-1 py-2 text-xs font-bold rounded-lg bg-white text-gray-900 shadow-sm transition'
                : 'flex-1 py-2 text-xs font-bold rounded-lg text-gray-500 hover:text-gray-900 transition';
            document.getElementById('tabPenilaian').className = tab === 'penilaian'
                ? 'flex-1 py-2 text-xs font-bold rounded-lg bg-white text-gray-900 shadow-sm transition'
                : 'flex-1 py-2 text-xs font-bold rounded-lg text-gray-500 hover:text-gray-900 transition';
            if (tab === 'penilaian' && _kelasSenseiId) {
                loadPenilaianTemplate(_kelasSenseiId);
            }
        }

        function loadPenilaianTemplate(kelasSenseiId) {
            const loading = document.getElementById('penilaianLoading');
            const empty = document.getElementById('penilaianEmpty');
            const nav = document.getElementById('penilaianCategoryNav');
            const legend = document.getElementById('penilaianLegend');
            const tbody = document.getElementById('penilaianTableBody');

            loading.classList.remove('hidden');
            empty.classList.add('hidden');
            nav.classList.add('hidden');
            legend.classList.add('hidden');
            tbody.innerHTML = '';

            fetch('/absensi/siswa/penilaian-template/' + kelasSenseiId)
                .then(res => res.json())
                .then(data => {
                    loading.classList.add('hidden');
                    if (!data.categories || data.categories.length === 0) {
                        empty.classList.remove('hidden');
                        lucide.createIcons();
                        return;
                    }
                    _penilaianData = data;
                    renderPenilaianCategories(data.categories, data);
                    if (!_selectedCategoryId || !data.categories.find(c => c.id === _selectedCategoryId)) {
                        _selectedCategoryId = data.categories[0].id;
                    }
                    renderPenilaianTable(_selectedCategoryId, data);
                })
                .catch(() => {
                    loading.classList.add('hidden');
                    empty.classList.remove('hidden');
                    empty.querySelector('p').textContent = 'Gagal memuat data penilaian';
                });
        }

        function renderPenilaianCategories(categories, data) {
            const nav = document.getElementById('penilaianCategoryNav');
            nav.innerHTML = '';
            nav.classList.remove('hidden');
            categories.forEach(cat => {
                const btn = document.createElement('button');
                btn.className = cat.id === _selectedCategoryId
                    ? 'px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white transition'
                    : 'px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition';
                btn.textContent = cat.nama_kategori;
                btn.onclick = () => {
                    _selectedCategoryId = cat.id;
                    renderPenilaianCategories(data.categories, data);
                    renderPenilaianTable(cat.id, data);
                };
                nav.appendChild(btn);
            });
        }

        function renderPenilaianTable(categoryId, data) {
            const legend = document.getElementById('penilaianLegend');
            const tbody = document.getElementById('penilaianTableBody');
            legend.classList.remove('hidden');
            tbody.innerHTML = '';

            const cat = data.categories.find(c => c.id === categoryId);
            if (!cat) return;

            const comps = cat.components;
            const dates = @json($days);

            // fetch all assessments for this batch for the week
            const promises = dates.map(tgl =>
                fetch('/absensi/siswa/penilaian-day', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content },
                    body: JSON.stringify({ batch_id: _activeBatchId, tanggal: tgl, kelas_sensei_id: _kelasSenseiId })
                }).then(r => r.json())
            );

            Promise.all(promises).then(results => {
                const dayAssessments = {};
                dates.forEach((tgl, i) => {
                    const map = {};
                    (results[i].assessments || []).forEach(a => {
                        const key = a.siswa_id + '_' + a.component_id;
                        map[key] = a.nilai;
                    });
                    dayAssessments[tgl] = map;
                });

                data.students.forEach(s => {
                    let row = '<tr class="border-b border-gray-100">';
                    row += '<td class="py-1.5 pr-2 sticky left-0 bg-white"><div class="flex items-center gap-1.5"><img src="' + s.foto + '" class="w-5 h-5 rounded-full object-cover flex-shrink-0"><span class="text-[11px] font-medium text-gray-900 truncate">' + s.nama + '</span></div></td>';
                    dates.forEach(tgl => {
                        const map = dayAssessments[tgl] || {};
                        let filled = 0;
                        comps.forEach(c => {
                            if (map[s.id + '_' + c.id] !== undefined) filled++;
                        });
                        const total = comps.length;
                        let cellClass = 'text-center py-2 px-0.5 cursor-pointer hover:bg-gray-100 transition rounded-lg';
                        let content = '<span class="text-[11px] text-gray-300">-</span>';
                        let badgeClass = '';
                        if (filled === total && total > 0) {
                            content = '<span class="text-[11px] font-bold text-green-600">&#10003;</span>';
                        } else if (filled > 0) {
                            content = '<span class="text-[11px] font-semibold text-amber-600">' + filled + '/' + total + '</span>';
                        }
                        row += '<td class="' + cellClass + '" onclick="openPenilaianModal(' + s.id + ', \'' + tgl + '\', ' + categoryId + ')">' + content + '</td>';
                    });
                    row += '</tr>';
                    tbody.innerHTML += row;
                });
                lucide.createIcons();
            });
        }

        // PENILAIAN MODAL
        let _penilaianModalSiswaId = null;
        let _penilaianModalTanggal = null;
        let _penilaianModalCategoryId = null;

        function openPenilaianModal(siswaId, tanggal, categoryId) {
            _penilaianModalSiswaId = siswaId;
            _penilaianModalTanggal = tanggal;
            _penilaianModalCategoryId = categoryId;

            const cat = _penilaianData.categories.find(c => c.id === categoryId);
            if (!cat) return;

            const siswa = _penilaianData.students.find(s => s.id == siswaId);
            if (!siswa) return;

            document.getElementById('penilaianModalTitle').textContent = siswa.nama;
            const d = new Date(tanggal + 'T00:00:00');
            const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][d.getDay()];
            document.getElementById('penilaianModalDate').textContent = hari + ', ' + d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

            const body = document.getElementById('penilaianModalBody');
            body.innerHTML = '<div class="text-center py-4 text-gray-400 text-sm">Memuat...</div>';

            document.getElementById('penilaianModalOverlay').classList.remove('hidden');
            document.getElementById('penilaianModal').classList.remove('hidden');

            fetch('/absensi/siswa/penilaian-day', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content },
                body: JSON.stringify({ batch_id: _activeBatchId, tanggal: tanggal, kelas_sensei_id: _kelasSenseiId })
            })
            .then(r => r.json())
            .then(data => {
                const map = {};
                (data.assessments || []).forEach(a => {
                    if (a.siswa_id == siswaId) {
                        map[a.component_id] = a.nilai;
                    }
                });

                let html = '';
                cat.components.forEach(c => {
                    const val = map[c.id] !== undefined ? map[c.id] : '';
                    html += '<div class="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">';
                    html += '<label class="text-xs font-medium text-gray-700">' + c.sub_komponen + '</label>';
                    html += '<input type="number" min="0" max="100" step="0.01" id="penilaianInput_' + c.id + '" value="' + val + '" class="w-16 text-center text-xs border border-gray-200 rounded-lg py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">';
                    html += '</div>';
                });
                body.innerHTML = html;
                lucide.createIcons();
            });
        }

        function savePenilaianModal() {
            if (!_penilaianModalSiswaId || !_penilaianModalTanggal) return;

            const btn = document.getElementById('penilaianModalSave');
            btn.textContent = 'Menyimpan...';
            btn.disabled = true;

            const cat = _penilaianData.categories.find(c => c.id === _penilaianModalCategoryId);
            if (!cat) return;

            const nilai = {};
            cat.components.forEach(c => {
                const inp = document.getElementById('penilaianInput_' + c.id);
                nilai[c.id] = inp && inp.value !== '' ? inp.value : null;
            });

            fetch('/absensi/siswa/penilaian-save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content },
                body: JSON.stringify({ batch_id: _activeBatchId, tanggal: _penilaianModalTanggal, siswa_id: _penilaianModalSiswaId, nilai: nilai })
            })
            .then(res => res.json())
            .then(data => {
                btn.textContent = 'Tersimpan';
                btn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                btn.classList.add('bg-green-500');
                setTimeout(() => {
                    closePenilaianModal();
                    renderPenilaianTable(_selectedCategoryId, _penilaianData);
                }, 800);
            })
            .catch(() => {
                btn.textContent = 'Simpan';
                btn.disabled = false;
                btn.classList.add('bg-blue-600', 'hover:bg-blue-700');
            });
        }

        function closePenilaianModal() {
            document.getElementById('penilaianModalOverlay').classList.add('hidden');
            document.getElementById('penilaianModal').classList.add('hidden');
            document.getElementById('penilaianModalSave').textContent = 'Simpan';
            document.getElementById('penilaianModalSave').disabled = false;
            document.getElementById('penilaianModalSave').classList.add('bg-blue-600', 'hover:bg-blue-700');
        }

        function pilihBatch(batchId, batchNama, kelasLevel, kelasSenseiId) {
            isDrillDown = true;
            _activeBatchId = batchId;
            _kelasSenseiId = kelasSenseiId;
            _penilaianData = null;
            _selectedCategoryId = null;
            document.getElementById('batchView').classList.add('hidden');
            document.getElementById('siswaView').classList.remove('hidden');
            document.getElementById('pageTitle').textContent = batchNama;

            const tbody = document.getElementById('siswaTableBody');
            const empty = document.getElementById('siswaEmpty');
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-400 text-sm">Memuat...</td></tr>';
            empty.classList.add('hidden');

            fetch('/absensi/siswa/attendance/' + kelasSenseiId)
                .then(res => res.json())
                .then(data => {
                    let rows = '';
                    let count = 0;

                    data.siswa.forEach(s => {
                        count++;
                        let cells = '';
                        s.attendance.forEach((status, idx) => {
                            const cell = getStatusCell(status);
                            const tgl = data.days[idx];
                            cells += `<td class="text-center py-1.5 px-0.5 cursor-pointer hover:bg-gray-100 transition" onclick="openStatusPicker(this, '${s.id}', '${tgl}')">${cell}</td>`;
                        });
                        rows += `
                            <tr class="border-b border-gray-100">
                                <td class="py-1.5 pr-2 sticky left-0 bg-white">
                                    <div class="flex items-center gap-1.5">
                                        <img src="${s.foto}" class="w-5 h-5 rounded-full object-cover flex-shrink-0">
                                        <span class="text-[11px] font-medium text-gray-900 truncate max-w-[80px] sm:max-w-none cursor-pointer hover:text-blue-600 transition" onclick="openRiwayatModal('${s.id}')" title="Lihat riwayat">${s.nama}</span>
                                        <span id="izinBadge_${s.nama.replace(/\s+/g, '_')}" class="hidden">
                                            <span class="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[8px] font-bold">
                                                <span class="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                                                IZIN
                                            </span>
                                        </span>
                                    </div>
                                </td>
                                <td class="text-center py-2 px-2 text-xs text-gray-600">${kelasLevel}</td>
                                ${cells}
                            </tr>
                        `;
                    });

                    document.getElementById('pageSubtitle').textContent = count + ' siswa';
                    tbody.innerHTML = rows;

                    if (count === 0) {
                        empty.classList.remove('hidden');
                    } else {
                        empty.classList.add('hidden');
                    }

                    loadPendingIzin(batchId);
                })
                .catch(() => {
                    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-red-400 text-sm">Gagal memuat data</td></tr>';
                });
        }

        function loadPendingIzin(batchId) {
            const container = document.getElementById('pendingIzinContainer');
            const list = document.getElementById('pendingIzinList');

            fetch('/izin/pending-by-batch/' + batchId)
                .then(res => res.json())
                .then(data => {
                    if (data.length === 0) {
                        container.classList.add('hidden');
                        return;
                    }
                    container.classList.remove('hidden');
                    list.innerHTML = '';
                    data.forEach(izin => {
                        const badgeColor = izin.jenis_izin === 'SAKIT' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
                        const badgeLabel = izin.jenis_izin === 'SAKIT' ? 'SAKIT' : 'IZIN';
                        const namaKey = izin.nama.replace(/\s+/g, '_');
                        const badge = document.getElementById('izinBadge_' + namaKey);
                        if (badge) badge.classList.remove('hidden');

                        list.innerHTML += `
                            <div class="flex items-start justify-between bg-white rounded-xl p-3 shadow-sm border border-amber-100 gap-2">
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-1.5 flex-wrap">
                                        <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeColor}">${badgeLabel}</span>
                                        <span class="text-xs font-semibold text-gray-800">${izin.nama}</span>
                                    </div>
                                    <p class="text-[11px] text-gray-500 mt-0.5 truncate">${izin.alasan}</p>
                                    <p class="text-[10px] text-gray-400">${izin.tgl_mulai}${izin.tgl_selesai !== izin.tgl_mulai ? ' s/d '+izin.tgl_selesai : ''}</p>
                                </div>
                                <div class="flex flex-col gap-1.5 flex-shrink-0">
                                    <form method="POST" action="/izin/${izin.id}/approve" class="inline">
                                        <input type="hidden" name="_token" value="{{ csrf_token() }}">
                                        <button type="submit" class="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg active:scale-95 transition w-full">Setuju</button>
                                    </form>
                                    <button onclick="rejectIzin(${izin.id})" class="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg active:scale-95 transition">Tolak</button>
                                </div>
                            </div>
                        `;
                    });
                })
                .catch(err => {
                    console.error('Gagal muat izin:', err);
                    container.classList.add('hidden');
                });
        }

        function rejectIzin(id) {
            const catatan = prompt('Alasan penolakan (opsional):');
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/izin/' + id + '/reject';
            const csrf = document.createElement('input');
            csrf.type = 'hidden';
            csrf.name = '_token';
            csrf.value = '{{ csrf_token() }}';
            form.appendChild(csrf);
            if (catatan !== null) {
                const note = document.createElement('input');
                note.type = 'hidden';
                note.name = 'catatan';
                note.value = catatan;
                form.appendChild(note);
            }
            document.body.appendChild(form);
            form.submit();
        }

        function getStatusCell(status) {
            const map = {
                'HADIR': 'H',
                'TERLAMBAT': 'H',
                'IZIN': 'I',
                'SAKIT': 'S',
                'ALPA': 'A',
                'LIBUR': 'L',
            };
            const colorMap = {
                'HADIR': 'bg-blue-500 text-white',
                'TERLAMBAT': 'bg-orange-400 text-white',
                'IZIN': 'bg-amber-500 text-white',
                'SAKIT': 'bg-emerald-500 text-white',
                'ALPA': 'bg-red-500 text-white',
                'LIBUR': 'bg-gray-400 text-white',
            };
            const label = map[status] || '-';
            if (label === '-') return '<span class="text-gray-300 text-[10px]">-</span>';
            const color = colorMap[status] || 'bg-gray-100 text-gray-500';
            return `<span class="inline-flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-bold ${color}">${label}</span>`;
        }

        let _pickerSiswaId = null;
        let _pickerTanggal = null;
        let _pickerCell = null;

        function openStatusPicker(cell, siswaId, tanggal) {
            _pickerSiswaId = siswaId;
            _pickerTanggal = tanggal;
            _pickerCell = cell;
            document.getElementById('statusPickerOverlay').classList.remove('hidden');
            document.getElementById('statusPicker').classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }

        function closeStatusPicker() {
            document.getElementById('statusPickerOverlay').classList.add('hidden');
            document.getElementById('statusPicker').classList.add('hidden');
            document.body.style.overflow = '';
        }

        function pickStatus(status) {
            closeStatusPicker();
            if (!_pickerSiswaId || !_pickerTanggal) return;

            const cell = _pickerCell;
            cell.innerHTML = '<span class="inline-flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-bold text-gray-400"><span class="animate-spin w-2.5 h-2.5 border-2 border-gray-400 border-t-transparent rounded-full"></span></span>';

            const formData = new FormData();
            formData.append('siswa_id', _pickerSiswaId);
            formData.append('tanggal', _pickerTanggal);
            formData.append('status', status || 'ALPA');
            formData.append('kelas_sensei_id', _kelasSenseiId);

            fetch('{{ route("absensi.siswa.update-status") }}', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': '{{ csrf_token() }}',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    cell.innerHTML = getStatusCell(status || 'ALPA');
                } else {
                    Swal.fire('Gagal', data.message || 'Terjadi kesalahan', 'error');
                }
            })
            .catch(() => {
                Swal.fire('Error', 'Gagal menyimpan perubahan', 'error');
            });
        }

        let _riwayatSiswaId = null;
        let _riwayatBulan = null;
        let _riwayatTahun = null;

        function openRiwayatModal(siswaId) {
            _riwayatSiswaId = siswaId;
            const now = new Date();
            _riwayatBulan = now.getMonth() + 1;
            _riwayatTahun = now.getFullYear();
            document.getElementById('riwayatModalOverlay').classList.remove('hidden');
            document.getElementById('riwayatModal').classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            loadRiwayat();
        }

        function closeRiwayatModal() {
            document.getElementById('riwayatModalOverlay').classList.add('hidden');
            document.getElementById('riwayatModal').classList.add('hidden');
            document.body.style.overflow = 'auto';
        }

        function riwayatPrevMonth() {
            _riwayatBulan--;
            if (_riwayatBulan < 1) { _riwayatBulan = 12; _riwayatTahun--; }
            loadRiwayat();
        }

        function riwayatNextMonth() {
            _riwayatBulan++;
            if (_riwayatBulan > 12) { _riwayatBulan = 1; _riwayatTahun++; }
            loadRiwayat();
        }

        function loadRiwayat() {
            const cal = document.getElementById('riwayatCalendar');
            const loading = document.getElementById('riwayatLoading');
            loading.classList.remove('hidden');
            cal.innerHTML = '';

            fetch(`/absensi/siswa/riwayat/${_riwayatSiswaId}?bulan=${_riwayatBulan}&tahun=${_riwayatTahun}`)
                .then(res => res.json())
                .then(d => {
                    loading.classList.add('hidden');
                    document.getElementById('riwayatNama').textContent = d.nama;
                    document.getElementById('riwayatFoto').src = d.foto;
                    document.getElementById('riwayatKelas').textContent = d.kelas;
                    document.getElementById('riwayatBulan').textContent = d.bulan;

                    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
                    dayNames.forEach(n => {
                        cal.innerHTML += `<div class="text-center text-[10px] font-semibold text-gray-400 py-1">${n}</div>`;
                    });

                    for (let i = 0; i < d.startOfWeek; i++) {
                        cal.innerHTML += `<div></div>`;
                    }

                    d.days.forEach(day => {
                        const colorMap = {
                            'HADIR': 'bg-blue-500 text-white',
                            'TERLAMBAT': 'bg-orange-400 text-white',
                            'IZIN': 'bg-amber-500 text-white',
                            'SAKIT': 'bg-emerald-500 text-white',
                            'ALPA': 'bg-red-500 text-white',
                            'LIBUR': 'bg-gray-400 text-white',
                        };
                        const labelMap = {
                            'HADIR': 'H', 'TERLAMBAT': 'H', 'IZIN': 'I', 'SAKIT': 'S', 'ALPA': 'A', 'LIBUR': 'L'
                        };
                        const s = day.status;
                        let cellClass = 'text-gray-400';
                        let label = day.day;
                        if (s && labelMap[s]) {
                            cellClass = colorMap[s] || 'text-gray-400';
                            label = labelMap[s];
                        }
                        const isToday = new Date().getDate() === day.day && _riwayatBulan === (new Date().getMonth() + 1) && _riwayatTahun === new Date().getFullYear();
                        const tgl = `${_riwayatTahun}-${String(_riwayatBulan).padStart(2,'0')}-${String(day.day).padStart(2,'0')}`;
                        cal.innerHTML += `
                            <div class="aspect-square rounded-lg flex flex-col items-center justify-center ${cellClass} ${isToday ? 'ring-2 ring-blue-400' : ''} text-center cursor-pointer hover:opacity-80 transition" onclick="openStatusPicker(this, ${_riwayatSiswaId}, '${tgl}')">
                                <span class="text-[11px] font-bold leading-none">${label}</span>
                                ${s && labelMap[s] ? `<span class="text-[7px] opacity-70 mt-0.5">${day.day}</span>` : ''}
                            </div>
                        `;
                    });
                    lucide.createIcons();
                })
                .catch(() => {
                    loading.classList.add('hidden');
                    cal.innerHTML = '<div class="col-span-7 text-center py-4 text-gray-400 text-sm">Gagal memuat data</div>';
                });
        }

        function backToBatch() {
            if (isDrillDown) {
                isDrillDown = false;
                _kelasSenseiId = null;
                _penilaianData = null;
                _selectedCategoryId = null;
                document.getElementById('batchView').classList.remove('hidden');
                document.getElementById('siswaView').classList.add('hidden');
                document.getElementById('pageTitle').textContent = 'Data Siswa';
                document.getElementById('pageSubtitle').textContent = '{{ $kelasList->count() }} kelas tersedia';
                document.getElementById('pendingIzinContainer').classList.add('hidden');
                // reset penilaian tabs to kehadiran
                switchTab('kehadiran');
            } else {
                window.location.href = '/absensi';
            }
        }
        function toggleModalJadwal(v) {}
        function mulaiAbsenFoto() { window.location.href = '/absensi'; }
    </script>
</body>
</html>
