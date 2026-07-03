<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Kehadiran</title>
    <link rel="icon" href="{{ asset('assets/images/logo/logo-sm.png') }}" type="image/png">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
        .card-stats { transition: transform 0.2s ease; }
        .card-stats:active { transform: scale(0.95); }

        /* Skor Disiplin card theme */
        .bg-blue-600.rounded-3xl {
            background: #0D1F3C !important;
        }
    </style>
</head>

<body class="bg-gray-50 pb-24">

<!-- STATUS BAR -->
<div class="bg-white px-4 pt-3 pb-2">
    <div class="flex items-center justify-between text-xs text-gray-600">
        <span id="statusTime">--:--</span>
        <div class="w-4 h-3 border border-gray-400 rounded-sm relative">
            <div class="absolute inset-0.5 bg-gray-800 rounded-sm"></div>
        </div>
    </div>
</div>

<!-- HEADER -->
<div class="bg-white px-5 pt-4 pb-6 shadow-sm border-b border-gray-100">
    <div class="flex items-center justify-between mb-2">
        <button onclick="window.location='/absensi'" class="w-10 h-10 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center">
            <i data-lucide="chevron-left" class="w-6 h-6 text-gray-700"></i>
        </button>
        <h1 class="text-lg font-bold text-gray-800">Laporan Bulanan</h1>
        <div class="w-10"></div>
    </div>
    <p class="text-center text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">
        {{ \Carbon\Carbon::now()->translatedFormat('F Y') }}
    </p>
</div>

<!-- STATISTIK -->
<div class="px-5 mt-6">
    <div class="grid grid-cols-2 gap-4">

        <!-- Hadir -->
        <div class="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm card-stats">
            <div class="w-10 h-10 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                <i data-lucide="user-check" class="w-5 h-5 text-white"></i>
            </div>
            <p class="text-xs font-bold text-gray-400 uppercase">Total Hadir</p>
            <h3 class="text-2xl font-black text-gray-800 mt-1">
                {{ $stats['hadir'] }} <span class="text-xs text-gray-400">Hari</span>
            </h3>
        </div>

        <!-- Terlambat -->
        <div class="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm card-stats">
            <div class="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
                <i data-lucide="clock" class="w-5 h-5 text-amber-600"></i>
            </div>
            <p class="text-xs font-bold text-gray-400 uppercase">Terlambat</p>
            <h3 class="text-2xl font-black text-gray-800 mt-1">
                {{ $stats['terlambat'] }} <span class="text-xs text-gray-400">Kali</span>
            </h3>
        </div>

        <!-- Izin -->
        <div class="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm card-stats">
            <div class="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <i data-lucide="file-text" class="w-5 h-5 text-slate-600"></i>
            </div>
            <p class="text-xs font-bold text-gray-400 uppercase">Izin / Sakit</p>
            <h3 class="text-2xl font-black text-gray-800 mt-1">
                {{ $stats['izin'] }} <span class="text-xs text-gray-400">Hari</span>
            </h3>
        </div>

        <!-- Alpa -->
        <div class="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm card-stats">
            <div class="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center mb-4">
                <i data-lucide="user-x" class="w-5 h-5 text-rose-500"></i>
            </div>
            <p class="text-xs font-bold text-gray-400 uppercase">Tanpa Kabar</p>
            <h3 class="text-2xl font-black text-rose-600 mt-1">
                {{ $stats['alpa'] }}
            </h3>
        </div>
    </div>
</div>

<!-- SKOR -->
<div class="px-5 mt-6">
    <div class="bg-blue-600 rounded-3xl p-6 shadow-lg">
        <div class="flex items-center justify-between mb-4">
            <h4 class="text-white font-bold text-sm italic">Skor Disiplin</h4>
            <span class="bg-white/20 text-white text-[10px] px-2 py-1 rounded-lg">
                {{ $skor }}% {{ $labelSkor }}
            </span>
        </div>

        <div class="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div class="bg-white h-full rounded-full" style="width: {{ $skor }}%"></div>
        </div>

        <p class="text-slate-200 text-[10px] mt-4">
            Total hari kerja bulan ini: <b>{{ $hariKerja }}</b> hari.
        </p>
    </div>
</div>

<!-- RIWAYAT -->
<div class="px-5 mt-8 mb-10">
    <div class="flex items-center justify-between mb-4">
        <h4 class="font-bold text-gray-800">Aktivitas Terakhir</h4>
        <a href="/calendar" class="text-xs font-bold text-slate-500 uppercase">Lihat Kalender</a>
    </div>

    <div class="space-y-3">
        @forelse($riwayatTerakhir as $r)
        <div class="bg-white p-4 rounded-2xl border border-gray-50 shadow-sm flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center font-bold text-xs">
                    {{ \Carbon\Carbon::parse($r->tanggal)->format('d') }}
                </div>
                <div>
                    <p class="text-sm font-bold text-gray-800 capitalize">{{ strtolower($r->status) }}</p>
                    <p class="text-[10px] text-gray-400">
                        {{ \Carbon\Carbon::parse($r->tanggal)->translatedFormat('M Y') }} • {{ $r->jam_masuk ?? '-' }}
                    </p>
                </div>
            </div>

            @if($r->status == 'HADIR')
                <i data-lucide="check-circle-2" class="w-5 h-5 text-emerald-500"></i>
            @elseif($r->status == 'TERLAMBAT')
                <i data-lucide="alert-circle" class="w-5 h-5 text-amber-500"></i>
            @else
                <i data-lucide="file-text" class="w-5 h-5 text-slate-500"></i>
            @endif
        </div>
        @empty
        <p class="text-xs text-gray-400 text-center">Belum ada data bulan ini</p>
        @endforelse
    </div>
</div>

@include('components.bottom_Nav')
    <!-- File JS eksternal absensi -->
<script>
lucide.createIcons();
setInterval(() => {
    const n = new Date();
    document.getElementById("statusTime").textContent =
        n.getHours().toString().padStart(2,'0') + ":" +
        n.getMinutes().toString().padStart(2,'0');
}, 1000);
</script>

</body>
</html>
