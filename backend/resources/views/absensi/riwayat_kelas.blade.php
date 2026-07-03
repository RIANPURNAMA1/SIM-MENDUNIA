<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Riwayat Kelas - {{ $kelasSensei->nama_kelas }}</title>
    <link rel="icon" href="{{ asset('assets/images/logo/logo-sm.png') }}" type="image/png">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
        /* Header card theme */
        .bg-gradient-to-br.from-blue-500.to-blue-700 {
            background: linear-gradient(135deg, #0D1F3C, #1a2d4a) !important;
        }
    </style>
</head>
<body class="bg-gray-50 pb-24">

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
            document.getElementById('statusTime').textContent = hours + ':' + minutes;
        }
        updateTime();
        setInterval(updateTime, 1000);
    </script>

    <div class="px-5 py-5">
        <div class="flex items-center gap-3 mb-5">
            <a href="{{ route('absensi.index') }}" class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <i data-lucide="arrow-left" class="w-4 h-4 text-gray-700"></i>
            </a>
            <div>
                <h1 class="text-lg font-bold text-gray-900">Riwayat Kelas</h1>
            </div>
        </div>

        <div class="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 text-white shadow-lg mb-5">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <i data-lucide="book-open" class="w-6 h-6"></i>
                </div>
                <div>
                    <h2 class="text-xl font-bold">{{ $kelasSensei->nama_kelas }}</h2>
                    <p class="text-blue-100 text-sm">Level {{ $kelasSensei->level }} &middot; {{ $kelasSensei->batchRelasi->nama_batch ?? '-' }}</p>
                </div>
            </div>
            <div class="flex items-center gap-4 text-sm text-blue-100">
                <div class="flex items-center gap-1">
                    <i data-lucide="user" class="w-4 h-4"></i>
                    <span>{{ $kelasSensei->user->name ?? $kelasSensei->user->nama ?? '-' }}</span>
                </div>
                <div class="flex items-center gap-1">
                    <i data-lucide="calendar" class="w-4 h-4"></i>
                    <span>{{ $kelasSensei->tanggal_mulai->format('d/m/Y') }} - {{ $kelasSensei->tanggal_selesai->format('d/m/Y') }}</span>
                </div>
            </div>
        </div>

        <div class="flex items-center justify-between mb-3">
            <h2 class="text-base font-bold text-gray-900">Riwayat Absensi</h2>
            <span class="text-xs text-gray-500">{{ $absensi->count() }} pertemuan</span>
        </div>

        @if($absensi->count() > 0)
        <div class="space-y-2">
            @foreach ($absensi as $a)
            <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                        @switch($a->status)
                            @case('HADIR') bg-green-100 @break
                            @case('TERLAMBAT') bg-yellow-100 @break
                            @case('IZIN') bg-blue-100 @break
                            @case('SAKIT') bg-red-100 @break
                            @case('ALPA') bg-gray-100 @break
                            @default bg-gray-100
                        @endswitch
                    ">
                        <span class="text-sm font-bold
                            @switch($a->status)
                                @case('HADIR') text-green-600 @break
                                @case('TERLAMBAT') text-yellow-600 @break
                                @case('IZIN') text-blue-600 @break
                                @case('SAKIT') text-red-600 @break
                                @case('ALPA') text-gray-600 @break
                                @default text-gray-600
                            @endswitch
                        ">{{ \Carbon\Carbon::parse($a->tanggal)->format('d') }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <p class="text-sm font-semibold text-gray-900">
                                {{ \Carbon\Carbon::parse($a->tanggal)->format('l, d M Y') }}
                            </p>
                            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full
                                @switch($a->status)
                                    @case('HADIR') bg-green-100 text-green-700 @break
                                    @case('TERLAMBAT') bg-yellow-100 text-yellow-700 @break
                                    @case('IZIN') bg-blue-100 text-blue-700 @break
                                    @case('SAKIT') bg-red-100 text-red-700 @break
                                    @case('ALPA') bg-gray-100 text-gray-700 @break
                                    @default bg-gray-100 text-gray-700
                                @endswitch
                            ">{{ $a->status }}</span>
                        </div>
                        <div class="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                            <span>Masuk: {{ $a->jam_masuk ? \Carbon\Carbon::parse($a->jam_masuk)->format('H:i') : '-' }}</span>
                            <span>Pulang: {{ $a->jam_keluar ? \Carbon\Carbon::parse($a->jam_keluar)->format('H:i') : '-' }}</span>
                            @if($a->cabang)
                            <span>{{ $a->cabang->nama_cabang ?? '' }}</span>
                            @endif
                        </div>
                        @if($a->keterangan)
                        <p class="text-xs text-gray-400 mt-0.5">{{ $a->keterangan }}</p>
                        @endif
                    </div>
                </div>
            </div>
            @endforeach
        </div>
        @else
        <div class="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i data-lucide="calendar-x" class="w-8 h-8 text-gray-400"></i>
            </div>
            <p class="text-sm text-gray-500">Belum ada absensi pada kelas ini</p>
        </div>
        @endif
    </div>

    @include('components.bottom_Nav')

    <script>
        lucide.createIcons();
    </script>
</body>
</html>