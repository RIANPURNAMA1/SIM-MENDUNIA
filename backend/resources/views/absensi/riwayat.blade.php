<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Riwayat Absensi</title>
     {{-- <link rel="icon" href="{{ asset('assets/compiled/png/LOGO/logo4.png') }}" type="image/x-icon"> --}}
    <link rel="icon" href="{{ asset('assets/images/logo/logo-sm.png') }}" type="image/png"  style="width: 40px">
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Lucide Icons CDN -->
    <script src="https://unpkg.com/lucide@latest"></script>

    <style>
        .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom);
        }
    </style>
</head>

<body class="bg-gray-50">

    <!-- STATUS BAR -->
    <div class="bg-white px-4 pt-3 pb-2">
        <div class="flex items-center justify-between text-xs text-gray-600">
            <span id="statusTime">--:--</span>
            <div class="flex gap-1">
                <div class="w-4 h-3 border border-gray-400 rounded-sm relative">
                    <div class="absolute inset-0.5 bg-gray-800 rounded-sm"></div>
                </div>
            </div>
        </div>
    </div>

    <script>
        function updateTime() {
            const now = new Date();

            let hours = now.getHours().toString().padStart(2, '0');
            let minutes = now.getMinutes().toString().padStart(2, '0');

            document.getElementById("statusTime").textContent = `${hours}:${minutes}`;
        }

        // Jalankan pertama kali
        updateTime();

        // Update tiap 1 detik
        setInterval(updateTime, 1000);
    </script>

    <!-- HEADER -->
    <div class="bg-white px-5 pt-4 pb-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
            <button onclick="goBack()" class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <i data-lucide="arrow-left" class="w-5 h-5 text-gray-700"></i>
            </button>
            <h1 class="text-lg font-bold text-gray-900">Riwayat Absensi</h1>
            <button onclick="toggleFilter()"
                class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <i data-lucide="filter" class="w-5 h-5 text-gray-700"></i>
            </button>
        </div>

        <!-- Month Selector -->
        <div
            class="flex items-center justify-between bg-gradient-to-r from-[#0D1F3C] to-[#1a2d4a] rounded-2xl p-4 text-white">
            <button onclick="changeMonth(-1)" class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <i data-lucide="chevron-left" class="w-5 h-5"></i>
            </button>
            <div class="text-center">
                <div class="text-lg font-bold" id="currentMonth">Desember 2025</div>
                <div class="text-sm text-blue-100" id="totalHadir">0 Hari Hadir</div>
            </div>
            <button onclick="changeMonth(1)" class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <i data-lucide="chevron-right" class="w-5 h-5"></i>
            </button>
        </div>
    </div>

    <!-- FILTER TABS -->
    <div class="px-5 py-4" id="filterTabs">
        <div class="flex gap-2 overflow-x-auto pb-2">
            <button onclick="filterData('semua')"
                class="filter-btn px-4 py-2 bg-blue-600 text-white rounded-xl font-medium text-sm whitespace-nowrap"
                data-filter="semua">
                Semua
            </button>
            <button onclick="filterData('karyawan')"
                class="filter-btn px-4 py-2 bg-white text-gray-700 rounded-xl font-medium text-sm whitespace-nowrap border border-gray-200"
                data-filter="karyawan">
                Karyawan
            </button>
            <button onclick="filterData('sensei')"
                class="filter-btn px-4 py-2 bg-white text-gray-700 rounded-xl font-medium text-sm whitespace-nowrap border border-gray-200"
                data-filter="sensei">
                Sensei
            </button>
            <button onclick="filterData('hadir')"
                class="filter-btn px-4 py-2 bg-white text-gray-700 rounded-xl font-medium text-sm whitespace-nowrap border border-gray-200"
                data-filter="hadir">
                Hadir
            </button>
            <button onclick="filterData('terlambat')"
                class="filter-btn px-4 py-2 bg-white text-gray-700 rounded-xl font-medium text-sm whitespace-nowrap border border-gray-200"
                data-filter="terlambat">
                Terlambat
            </button>
            <button onclick="filterData('alpa')"
                class="filter-btn px-4 py-2 bg-white text-gray-700 rounded-xl font-medium text-sm whitespace-nowrap border border-gray-200"
                data-filter="alpa">
                Alpa
            </button>
        </div>
    </div>

    <!-- RIWAYAT LIST -->
    <div class="px-5 pb-24">
        <div class="space-y-3" id="riwayatContainer">
            <!-- Data akan diisi oleh JavaScript -->
        </div>

        <!-- Empty State -->
        <div id="emptyState" class="hidden text-center py-12">
            <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i data-lucide="calendar-x" class="w-12 h-12 text-gray-400"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Belum Ada Data</h3>
            <p class="text-gray-500 text-sm">Belum ada riwayat absensi</p>
        </div>
    </div>

    <!-- BOTTOM NAV -->
    @include('components.bottom_Nav')

    <script>
        // Initialize Lucide Icons
        lucide.createIcons();

        // Update status time
        function updateStatusTime() {
            const now = new Date();
            document.getElementById('statusTime').textContent =
                now.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
        }
        setInterval(updateStatusTime, 1000);
        updateStatusTime();

        // Data dari Laravel (akan di-replace dengan data aktual)
        let absensiData = @json($absensi);
        let absensiSenseiData = @json($absensiSensei ?? []);
        let filteredData = [...absensiData];
        let filteredSenseiData = [...absensiSenseiData];
        let currentFilter = 'semua';
        let selectedMonth = new Date().getMonth();
        let selectedYear = new Date().getFullYear();

        // Get status badge
        function getStatusBadge(status) {
            if (!status) return '';
            const statusLower = status.toLowerCase();
            const colorMap = {
                'hadir': {
                    bg: 'bg-green-100',
                    text: 'text-green-700',
                    icon: 'check-circle'
                },
                'terlambat': {
                    bg: 'bg-orange-100',
                    text: 'text-orange-700',
                    icon: 'clock'
                },
                'izin': {
                    bg: 'bg-blue-100',
                    text: 'text-blue-700',
                    icon: 'file-text'
                },
                'sakit': {
                    bg: 'bg-red-100',
                    text: 'text-red-700',
                    icon: 'heart-pulse'
                },
                'alpha':
                {
                    bg: 'bg-gray-100',
                    text: 'text-gray-700',
                    icon: 'x-circle'
                },
                'alpa': {
                    bg: 'bg-gray-100',
                    text: 'text-gray-700',
                    icon: 'x-circle'
                },
                'libur': {
                    bg: 'bg-purple-100',
                    text: 'text-purple-700',
                    icon: 'sun'
                },
                'pulang lebih awal': {
                    bg: 'bg-amber-100',
                    text: 'text-amber-700',
                    icon: 'clock'
                },
                'tidak absen pulang': {
                    bg: 'bg-red-100',
                    text: 'text-red-700',
                    icon: 'alert-circle'
                }
            };

            const colors = colorMap[statusLower] || colorMap['hadir'];

            return `
                <div class="flex items-center gap-1.5 px-3 py-1 ${colors.bg} rounded-full">
                    <i data-lucide="${colors.icon}" class="w-3 h-3 ${colors.text}"></i>
                    <span class="text-xs font-medium ${colors.text}">${status}</span>
                </div>
            `;
        }

        // Update month display
        function updateMonthDisplay() {
            const monthNames = [
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
            ];

            document.getElementById('currentMonth').textContent =
                `${monthNames[selectedMonth]} ${selectedYear}`;

            // Count hadir for selected month
            const hadirCount = filteredData.filter(a => {
                const date = new Date(a.tanggal);
                return date.getMonth() === selectedMonth &&
                    date.getFullYear() === selectedYear &&
                    a.status.toLowerCase() === 'hadir';
            }).length;

            document.getElementById('totalHadir').textContent = `${hadirCount} Hari Hadir`;
        }

        // Change month
        function changeMonth(delta) {
            selectedMonth += delta;

            if (selectedMonth > 11) {
                selectedMonth = 0;
                selectedYear++;
            } else if (selectedMonth < 0) {
                selectedMonth = 11;
                selectedYear--;
            }

            updateMonthDisplay();
            loadRiwayat();
        }

        // Filter data
        function filterData(filter) {
            currentFilter = filter;

            // Update button styles
            document.querySelectorAll('.filter-btn').forEach(btn => {
                if (btn.dataset.filter === filter) {
                    btn.className =
                        'filter-btn px-4 py-2 bg-blue-600 text-white rounded-xl font-medium text-sm whitespace-nowrap';
                } else {
                    btn.className =
                        'filter-btn px-4 py-2 bg-white text-gray-700 rounded-xl font-medium text-sm whitespace-nowrap border border-gray-200';
                }
            });

            // Filter data
            if (filter === 'semua') {
                filteredData = [...absensiData];
                filteredSenseiData = [...absensiSenseiData];
            } else if (filter === 'karyawan') {
                filteredData = [...absensiData];
                filteredSenseiData = [];
            } else if (filter === 'sensei') {
                filteredData = [];
                filteredSenseiData = [...absensiSenseiData];
            } else {
                filteredData = absensiData.filter(a =>
                    a.status && a.status.toLowerCase() === filter.toLowerCase()
                );
                filteredSenseiData = absensiSenseiData.filter(a =>
                    a.status && a.status.toLowerCase() === filter.toLowerCase()
                );
            }

            updateMonthDisplay();
            loadRiwayat();
        }

        // Load riwayat
        function loadRiwayat() {
            const container = document.getElementById('riwayatContainer');
            const emptyState = document.getElementById('emptyState');

            // Filter by selected month for Karyawan
            const monthFiltered = filteredData.filter(a => {
                const date = new Date(a.tanggal);
                return date.getMonth() === selectedMonth &&
                    date.getFullYear() === selectedYear;
            });

            // Filter by selected month for Sensei
            const monthFilteredSensei = filteredSenseiData.filter(a => {
                const date = new Date(a.tanggal);
                return date.getMonth() === selectedMonth &&
                    date.getFullYear() === selectedYear;
            });

            if (monthFiltered.length === 0 && monthFilteredSensei.length === 0) {
                container.innerHTML = '';
                emptyState.classList.remove('hidden');
                return;
            }

            emptyState.classList.add('hidden');
            container.innerHTML = '';

            // Render Karyawan data
            monthFiltered.forEach(a => {
                const date = new Date(a.tanggal);
                const dayNames = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
                const dayName = dayNames[date.getDay()];
                const dayNumber = date.getDate();

                const card = document.createElement('a');
                const d = new Date(a.tanggal);
                const tanggal =
                    d.getFullYear() + '-' +
                    String(d.getMonth() + 1).padStart(2, '0') + '-' +
                    String(d.getDate()).padStart(2, '0');

                card.href = `/absensi/detail/${tanggal}`;
                card.className = 'block';

                const shiftName = a.shift ? a.shift.nama_shift : 'Shift';
                card.innerHTML = `
                    <div class="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border-l-4 border-blue-500">
                        <div class="flex items-center gap-4">
                            <!-- Date Box -->
                            <div class="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <div class="text-center">
                                    <div class="text-xs text-blue-600 font-medium">${dayName}</div>
                                    <div class="text-xl font-bold text-blue-700">${dayNumber}</div>
                                </div>
                            </div>

                            <!-- Content -->
                            <div class="flex-1">
                                <div class="flex items-center justify-between mb-2">
                                    <div class="flex items-center gap-2">
                                        <span class="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">KARYAWAN</span>
                                        <span class="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">${shiftName}</span>
                                        <h3 class="font-semibold text-gray-900 text-sm">${date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                                    </div>
                                </div>
                                
                                <div class="flex items-center gap-3 mb-2">
                                    <div class="flex items-center gap-1.5 text-xs text-gray-600">
                                        <i data-lucide="log-in" class="w-3.5 h-3.5 text-green-600"></i>
                                        <span class="font-medium">${a.jam_masuk || '-'}</span>
                                    </div>
                                    <div class="w-1 h-1 bg-gray-300 rounded-full"></div>
                                    <div class="flex items-center gap-1.5 text-xs text-gray-600">
                                        <i data-lucide="log-out" class="w-3.5 h-3.5 text-red-600"></i>
                                        <span class="font-medium">${a.jam_keluar || '-'}</span>
                                    </div>
                                </div>

                                ${getStatusBadge(a.status)}
                            </div>

                            <!-- Arrow -->
                            <i data-lucide="chevron-right" class="w-5 h-5 text-gray-400 flex-shrink-0"></i>
                        </div>
                    </div>
                `;

                container.appendChild(card);
            });

            // Render Sensei data
            monthFilteredSensei.forEach(a => {
                const date = new Date(a.tanggal);
                const dayNames = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
                const dayName = dayNames[date.getDay()];
                const dayNumber = date.getDate();
                const kelasNama = a.kelas_sensei ? a.kelas_sensei.nama_kelas : '-';

                const card = document.createElement('a');
                card.href = `/admin/kehadiran-sensei`;
                card.className = 'block';

                card.innerHTML = `
                    <div class="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border-l-4 border-violet-500">
                        <div class="flex items-center gap-4">
                            <!-- Date Box -->
                            <div class="w-16 h-16 bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <div class="text-center">
                                    <div class="text-xs text-violet-600 font-medium">${dayName}</div>
                                    <div class="text-xl font-bold text-violet-700">${dayNumber}</div>
                                </div>
                            </div>

                            <!-- Content -->
                            <div class="flex-1">
                                <div class="flex items-center justify-between mb-2">
                                    <div class="flex items-center gap-2">
                                        <span class="text-[10px] font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded">SENSEI</span>
                                        <span class="text-xs text-gray-500">${kelasNama}</span>
                                    </div>
                                </div>
                                
                                <h3 class="font-semibold text-gray-900 text-sm mb-1">${date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                                
                                <div class="flex items-center gap-3 mb-2">
                                    <div class="flex items-center gap-1.5 text-xs text-gray-600">
                                        <i data-lucide="log-in" class="w-3.5 h-3.5 text-green-600"></i>
                                        <span class="font-medium">${a.jam_masuk || '-'}</span>
                                    </div>
                                    <div class="w-1 h-1 bg-gray-300 rounded-full"></div>
                                    <div class="flex items-center gap-1.5 text-xs text-gray-600">
                                        <i data-lucide="log-out" class="w-3.5 h-3.5 text-red-600"></i>
                                        <span class="font-medium">${a.jam_keluar || '-'}</span>
                                    </div>
                                </div>

                                ${getStatusBadge(a.status)}
                            </div>

                            <!-- Arrow -->
                            <i data-lucide="chevron-right" class="w-5 h-5 text-gray-400 flex-shrink-0"></i>
                        </div>
                    </div>
                `;

                container.appendChild(card);
            });

            lucide.createIcons();
        }

        // Toggle filter visibility
        function toggleFilter() {
            const filterTabs = document.getElementById('filterTabs');
            filterTabs.classList.toggle('hidden');
        }

        // Navigation functions
        function goBack() {
            window.location.href = '/absensi';
        }

        function goToHome() {
            window.location.href = '/absensi';
        }

        // Initialize
        updateMonthDisplay();
        loadRiwayat();
    </script>
</body>

</html>
