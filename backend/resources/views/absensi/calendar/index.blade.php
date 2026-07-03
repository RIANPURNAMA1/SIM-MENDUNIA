<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kalender Kehadiran</title>
     {{-- <link rel="icon" href="{{ asset('assets/compiled/png/LOGO/logo4.png') }}" type="image/x-icon"> --}}
    <link rel="icon" href="{{ asset('assets/images/logo/logo-sm.png') }}" type="image/png"  style="width: 40px">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>

    <style>
        .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
        .calendar-dot { transition: all 0.3s ease; }
    </style>
</head>

<body class="bg-gray-50">

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

    <div class="bg-white px-5 pt-4 pb-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
            <button onclick="goBack()" class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <i data-lucide="arrow-left" class="w-5 h-5 text-gray-700"></i>
            </button>
            <h1 class="text-lg font-bold text-gray-900">Riwayat Kehadiran</h1>
            <button class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <i data-lucide="settings" class="w-5 h-5 text-gray-700"></i>
            </button>
        </div>
    </div>

    <div class="px-5 mt-4">
        <div class="bg-white rounded-3xl shadow-sm p-5 border border-gray-100">
            <div id="monthDisplay" class="text-lg font-bold text-gray-900 mb-4 text-center capitalize"></div>
            
            <div class="grid grid-cols-7 mb-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <div>Min</div><div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div>
            </div>

            <div id="calendarGrid" class="grid grid-cols-7 gap-y-2 text-center">
                </div>
        </div>

        <div id="detailSection" class="mt-6 hidden">
            <div class="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                <h3 id="txtTanggal" class="font-bold text-indigo-900 mb-3 text-sm italic"></h3>
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-white p-3 rounded-xl shadow-sm">
                        <p class="text-[10px] text-gray-400">Jam Masuk</p>
                        <p id="txtMasuk" class="text-sm font-bold text-gray-800">--:--</p>
                    </div>
                    <div class="bg-white p-3 rounded-xl shadow-sm">
                        <p class="text-[10px] text-gray-400">Jam Keluar</p>
                        <p id="txtKeluar" class="text-sm font-bold text-gray-800">--:--</p>
                    </div>
                </div>
                <div id="lblStatus" class="mt-3 inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm">
                </div>
            </div>
        </div>

        <div class="mt-6 pt-4 border-t border-gray-100 flex flex-wrap justify-center gap-x-4 gap-y-2 pb-10">
            <div class="flex items-center gap-1.5">
                <div class="w-2 h-2 rounded-full bg-green-500"></div>
                <span class="text-[10px] font-medium text-gray-500">Hadir</span>
            </div>
            <div class="flex items-center gap-1.5">
                <div class="w-2 h-2 rounded-full bg-orange-500"></div>
                <span class="text-[10px] font-medium text-gray-500">Terlambat</span>
            </div>
            <div class="flex items-center gap-1.5">
                <div class="w-2 h-2 rounded-full bg-blue-400"></div>
                <span class="text-[10px] font-medium text-gray-500">Izin</span>
            </div>
            <div class="flex items-center gap-1.5">
                <div class="w-2 h-2 rounded-full bg-red-500"></div>
                <span class="text-[10px] font-medium text-gray-500">Alpa</span>
            </div>
            <div class="flex items-center gap-1.5">
                <div class="w-2 h-2 rounded-full bg-pink-500"></div>
                <span class="text-[10px] font-medium text-gray-500">Libur</span>
            </div>
        </div>
    </div>

    @include('components.bottom_Nav')

<script>
    // 1. Konfigurasi Route (Laravel)
    window.routes = {
        riwayatKalender: "{{ route('riwayatKalender') }}"
    };

    let riwayatAbsensi = []; 

    // Update Jam Status Bar
    function updateTime() {
        const now = new Date();
        document.getElementById("statusTime").textContent = 
            now.getHours().toString().padStart(2, '0') + ":" + 
            now.getMinutes().toString().padStart(2, '0');
    }
    setInterval(updateTime, 1000);
    updateTime();

    async function renderCalendar() {
        lucide.createIcons();
        const grid = document.getElementById('calendarGrid');
        const monthDisplay = document.getElementById('monthDisplay');
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        monthDisplay.innerText = now.toLocaleString('id-ID', { month: 'long', year: 'numeric' });

        try {
            const response = await fetch(`${window.routes.riwayatKalender}?bulan=${month + 1}&tahun=${year}`);
            riwayatAbsensi = await response.json();

            grid.innerHTML = '';
            const firstDayOfMonth = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            // Slot kosong awal bulan
            for (let i = 0; i < firstDayOfMonth; i++) {
                grid.innerHTML += `<div></div>`;
            }

            // Loop Tanggal
            for (let d = 1; d <= daysInMonth; d++) {
                const dataHariIni = riwayatAbsensi.find(item => {
                    const tglString = item.tanggal.includes('T') ? item.tanggal.split('T')[0] : item.tanggal;
                    return parseInt(tglString.split('-')[2]) === d;
                });

                const dateObj = new Date(year, month, d);
                const isWeekend = (dateObj.getDay() === 0 || dateObj.getDay() === 6); // Minggu=0, Sabtu=6

                let dotColor = 'bg-transparent';
                let textColor = isWeekend ? 'text-red-500' : 'text-gray-700';

                if (dataHariIni) {
                    const colors = {
                        'HADIR': 'bg-green-500',
                        'TERLAMBAT': 'bg-orange-500',
                        'IZIN': 'bg-blue-400',
                        'ALPA': 'bg-red-500',
                        'LIBUR': 'bg-pink-500' // Dot warna pink untuk libur
                    };
                    dotColor = colors[dataHariIni.status] || 'bg-transparent';
                }

                const isToday = new Date().getDate() === d && new Date().getMonth() === month;

                grid.innerHTML += `
                    <div onclick="tampilkanDetail(${d})" class="flex flex-col items-center py-2 cursor-pointer hover:bg-gray-100 rounded-2xl transition-all">
                        <span class="text-sm ${isToday ? 'bg-indigo-600 text-white w-7 h-7 flex items-center justify-center rounded-full font-bold shadow-sm' : textColor + ' font-medium'}">
                            ${d}
                        </span>
                        <div class="w-1.5 h-1.5 rounded-full ${dotColor} mt-1 calendar-dot"></div>
                    </div>
                `;
            }
        } catch (error) {
            console.error("Gagal memuat data:", error);
            grid.innerHTML = `<div class="col-span-7 text-red-500 text-[10px] text-center">Gagal memuat data kehadiran.</div>`;
        }
    }

    function tampilkanDetail(tgl) {
        const data = riwayatAbsensi.find(item => {
            const tglString = item.tanggal.includes('T') ? item.tanggal.split('T')[0] : item.tanggal;
            return parseInt(tglString.split('-')[2]) === tgl;
        });

        const section = document.getElementById('detailSection');
        const lbl = document.getElementById('lblStatus');

        if (data) {
            section.classList.remove('hidden');
            document.getElementById('txtTanggal').innerText = `Detail Kehadiran: ${tgl} ${document.getElementById('monthDisplay').innerText}`;
            
            // Logika jam untuk status LIBUR
            if (data.status === 'LIBUR') {
                document.getElementById('txtMasuk').innerText = '---';
                document.getElementById('txtKeluar').innerText = '---';
            } else {
                document.getElementById('txtMasuk').innerText = data.jam_masuk ?? '--:--';
                document.getElementById('txtKeluar').innerText = data.jam_keluar ?? '--:--';
            }

            lbl.innerText = data.status;
            const statusColors = {
                'HADIR': 'bg-green-100 text-green-600',
                'TERLAMBAT': 'bg-orange-100 text-orange-600',
                'IZIN': 'bg-blue-100 text-blue-600',
                'ALPA': 'bg-red-100 text-red-600',
                'LIBUR': 'bg-pink-100 text-pink-600'
            };
            lbl.className = `mt-3 inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase ${statusColors[data.status] || 'bg-gray-100 text-gray-600'}`;
            
            section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            // Cek jika tidak ada di DB tapi hari Minggu/Sabtu
            const now = new Date();
            const checkDate = new Date(now.getFullYear(), now.getMonth(), tgl);
            if (checkDate.getDay() === 0 || checkDate.getDay() === 6) {
                section.classList.remove('hidden');
                document.getElementById('txtTanggal').innerText = `Detail: ${tgl} ${document.getElementById('monthDisplay').innerText}`;
                document.getElementById('txtMasuk').innerText = '---';
                document.getElementById('txtKeluar').innerText = '---';
                lbl.innerText = 'AKHIR PEKAN';
                lbl.className = 'mt-3 inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-pink-50 text-pink-500';
            } else {
                section.classList.add('hidden');
            }
        }
    }

    function goBack() { window.history.back(); }
    document.addEventListener('DOMContentLoaded', renderCalendar);
</script>
</body>
</html>