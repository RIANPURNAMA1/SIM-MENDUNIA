<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Riwayat Pengajuan Izin</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        /* Menghilangkan scrollbar pada filter tabs */
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* Animasi halus saat filter */
        .izin-card { transition: all 0.3s ease; }
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

    <div class="bg-white px-5 pt-4 pb-6 shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div class="flex items-center justify-between">
            <button onclick="window.location='/absensi'"
                class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center active:scale-90 transition">
                <i data-lucide="arrow-left" class="w-5 h-5 text-gray-700"></i>
            </button>
            <h1 class="text-lg font-bold text-gray-900">Riwayat Izin</h1>
            <a href="{{ route('izin.create') }}"
                class="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center active:scale-90 transition">
                <i data-lucide="plus" class="w-5 h-5"></i>
            </a>
        </div>
    </div>

    <div class="px-5 py-4" id="filterTabs">
        <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button onclick="filterData('semua')"
                class="filter-btn px-4 py-2 bg-blue-600 text-white rounded-xl font-medium text-sm whitespace-nowrap transition-colors"
                data-filter="semua">
                Semua
            </button>

            <button onclick="filterData('PENDING')"
                class="filter-btn px-4 py-2 bg-white rounded-xl font-medium text-sm whitespace-nowrap border border-gray-200 transition-colors"
                data-filter="PENDING">
                Pending
            </button>

            <button onclick="filterData('APPROVED')"
                class="filter-btn px-4 py-2 bg-white rounded-xl font-medium text-sm whitespace-nowrap border border-gray-200 transition-colors"
                data-filter="APPROVED">
                Disetujui
            </button>

            <button onclick="filterData('REJECTED')"
                class="filter-btn px-4 py-2 bg-white rounded-xl font-medium text-sm whitespace-nowrap border border-gray-200 transition-colors"
                data-filter="REJECTED">
                Ditolak
            </button>
        </div>
    </div>

    <div class="px-5 pt-2 pb-10">
        <div class="space-y-4" id="container-izin">
            @forelse($riwayatIzin as $izin)
                <div class="izin-card bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 transition active:bg-gray-50"
                    data-status="{{ $izin->status }}">
                    
                    <div class="w-12 h-12 {{ $izin->jenis_izin == 'sakit' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600' }} rounded-2xl flex items-center justify-center shrink-0">
                        <i data-lucide="{{ $izin->jenis_izin == 'sakit' ? 'thermometer' : 'palmtree' }}" class="w-6 h-6"></i>
                    </div>

                    <div class="flex-1">
                        <div class="flex justify-between items-start mb-1">
                            <h3 class="font-bold text-gray-900 capitalize">{{ $izin->jenis_izin }}</h3>
                            @if ($izin->status == 'PENDING')
                                <span class="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full border border-amber-100 uppercase tracking-wider">Menunggu</span>
                            @elseif($izin->status == 'APPROVED')
                                <span class="px-2.5 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-full border border-green-100 uppercase tracking-wider">Disetujui</span>
                            @else
                                <span class="px-2.5 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-full border border-red-100 uppercase tracking-wider">Ditolak</span>
                            @endif
                        </div>

                        <p class="text-xs text-gray-500 mb-2 leading-relaxed">
                            {{ \Illuminate\Support\Str::words($izin->alasan, 6, '...') }}
                        </p>

                        <div class="flex items-center gap-3 text-[11px] font-medium text-gray-400">
                            <div class="flex items-center gap-1">
                                <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
                                {{ \Carbon\Carbon::parse($izin->tgl_mulai)->format('d M') }} -
                                {{ \Carbon\Carbon::parse($izin->tgl_selesai)->format('d M Y') }}
                            </div>
                            @if ($izin->lampiran)
                                <div class="flex items-center gap-1 text-blue-500">
                                    <i data-lucide="paperclip" class="w-3.5 h-3.5"></i>
                                    Ada Lampiran
                                </div>
                            @endif
                        </div>
                    </div>
                </div>
            @empty
                <div class="flex flex-col items-center justify-center pt-20 text-center">
                    <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <i data-lucide="clipboard-list" class="w-10 h-10 text-gray-300"></i>
                    </div>
                    <h3 class="text-gray-900 font-bold italic">Belum ada pengajuan</h3>
                    <p class="text-gray-500 text-xs px-10 mt-1">Semua data pengajuan izin Anda akan muncul di sini.</p>
                </div>
            @endforelse
        </div>

        <div id="filterEmptyState" class="hidden flex flex-col items-center justify-center pt-20 text-center">
            <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i data-lucide="calendar-x" class="w-12 h-12 text-gray-400"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Belum Ada Data</h3>
            <p class="text-gray-500 text-sm">Belum ada riwayat izin</p>
        </div>

        
    </div>

    <script>
        lucide.createIcons();

        function updateTime() {
            const now = new Date();
            document.getElementById('statusTime').innerText = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
        }
        setInterval(updateTime, 1000);
        updateTime();
    
        function filterData(status) {
            const cards = document.querySelectorAll('.izin-card');
            const buttons = document.querySelectorAll('.filter-btn');
            const emptyState = document.getElementById('filterEmptyState');
            let foundData = false;

            // 1. Update Styling Tombol
            buttons.forEach(btn => {
                btn.classList.remove('bg-blue-600', 'text-white');
                btn.classList.add('bg-white');
            });

            const activeBtn = document.querySelector(`[data-filter="${status}"]`);
            if (activeBtn) {
                activeBtn.classList.remove('bg-white');
                activeBtn.classList.add('bg-blue-600', 'text-white');
            }

            // 2. Filter Card & Cek Ketersediaan Data
            cards.forEach(card => {
                const cardStatus = card.getAttribute('data-status');
                if (status === 'semua' || cardStatus === status) {
                    card.style.display = 'flex';
                    foundData = true; // Menandai bahwa ada data yang tampil
                } else {
                    card.style.display = 'none';
                }
            });

            // 3. Tampilkan Pesan Jika Data Kosong
            if (!foundData) {
                emptyState.classList.remove('hidden');
                // Refresh icon lucide di dalam empty state
                lucide.createIcons();
            } else {
                emptyState.classList.add('hidden');
            }
        }
    </script>
</body>
</html>