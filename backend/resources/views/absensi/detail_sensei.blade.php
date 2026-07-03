<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Detail Absensi Sensei - {{ \Carbon\Carbon::parse($absensi->tanggal)->format('d M Y') }}</title>
    <link rel="icon" href="{{ asset('assets/images/logo/logo-sm.png') }}" type="image/png" style="width: 40px">
    <script src="https://cdn.tailwindcss.com"></script>
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
        updateTime();
        setInterval(updateTime, 1000);
    </script>

    <div class="bg-white px-5 pt-4 pb-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
            <a href="{{ url()->previous() }}" class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <i data-lucide="arrow-left" class="w-5 h-5 text-gray-700"></i>
            </a>
            <h1 class="text-lg font-bold text-gray-900">Detail Absensi Sensei</h1>
            <div class="w-10"></div>
        </div>
    </div>

    <div class="px-5 py-5">
        <div class="bg-[rgb(19,38,67)] rounded-3xl p-6 text-white shadow-lg mb-5">
            <div class="flex items-center gap-4 mb-4">
                <div class="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                    <i data-lucide="calendar" class="w-8 h-8"></i>
                </div>
                <div class="flex-1">
                    <div class="text-sm text-blue-100 mb-1">Tanggal Absensi</div>
                    <div class="text-xl font-bold">
                        {{ \Carbon\Carbon::parse($absensi->tanggal)->translatedFormat('l, d F Y') }}
                    </div>
                </div>
            </div>

            @php
                $statusColors = [
                    'HADIR' => 'bg-green-100 text-green-700',
                    'TERLAMBAT' => 'bg-red-100 text-red-700',
                    'PULANG LEBIH AWAL' => 'bg-amber-100 text-amber-700',
                    'TIDAK ABSEN PULANG' => 'bg-red-100 text-red-700',
                ];
                $statusIcons = [
                    'HADIR' => 'check-circle',
                    'TERLAMBAT' => 'clock',
                    'PULANG LEBIH AWAL' => 'arrow-left-circle',
                    'TIDAK ABSEN PULANG' => 'x-circle',
                ];
                $currentColor = $statusColors[$absensi->status] ?? 'bg-gray-100 text-gray-700';
                $currentIcon = $statusIcons[$absensi->status] ?? 'help-circle';
            @endphp

            <div class="flex items-center gap-2 px-4 py-3 {{ $currentColor }} rounded-2xl">
                <i data-lucide="{{ $currentIcon }}" class="w-5 h-5"></i>
                <span class="font-semibold text-base">{{ $absensi->status }}</span>
            </div>
        </div>

        <!-- Info Kelas -->
        <div class="bg-white rounded-2xl p-4 shadow-sm mb-5">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <i data-lucide="graduation-cap" class="w-6 h-6 text-blue-600"></i>
                </div>
                <div>
                    <div class="text-xs text-gray-500">Kelas</div>
                    <div class="text-lg font-bold text-gray-900">{{ $absensi->kelasSensei->nama_kelas ?? '-' }}</div>
                    <div class="text-sm text-gray-500">Level {{ $absensi->kelasSensei->level ?? '-' }}</div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-5">
            <div class="bg-white rounded-2xl p-4 shadow-sm">
                <div class="flex items-center gap-3 mb-3">
                    <div class="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                        <i data-lucide="log-in" class="w-5 h-5 text-green-600"></i>
                    </div>
                    <div class="flex-1">
                        <div class="text-xs text-gray-500">Jam Masuk</div>
                        <div class="text-xl font-bold text-gray-900">{{ $absensi->jam_masuk ?? '--:--' }}</div>
                    </div>
                </div>
                <div class="text-xs text-gray-500">WIB</div>
            </div>

            <div class="bg-white rounded-2xl p-4 shadow-sm">
                <div class="flex items-center gap-3 mb-3">
                    <div class="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                        <i data-lucide="log-out" class="w-5 h-5 text-red-600"></i>
                    </div>
                    <div class="flex-1">
                        <div class="text-xs text-gray-500">Jam Keluar</div>
                        <div class="text-xl font-bold text-gray-900">{{ $absensi->jam_keluar ?? '--:--' }}</div>
                    </div>
                </div>
                <div class="text-xs text-gray-500">WIB</div>
            </div>
        </div>

        @if ($absensi->jam_masuk && $absensi->jam_keluar)
            <div class="bg-white rounded-2xl p-5 shadow-sm mb-5">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <i data-lucide="clock" class="w-6 h-6 text-purple-600"></i>
                    </div>
                    <div class="flex-1">
                        <div class="text-sm text-gray-500 mb-1">Total Waktu Kelas</div>
                        <div class="text-2xl font-bold text-gray-900">
                            @php
                                $masuk = \Carbon\Carbon::parse($absensi->jam_masuk);
                                $keluar = \Carbon\Carbon::parse($absensi->jam_keluar);
                                $durasi = $masuk->diff($keluar);
                                echo $durasi->format('%h Jam %i Menit');
                            @endphp
                        </div>
                    </div>
                </div>
            </div>
        @endif

        @if ($absensi->catatan)
        <div class="bg-white rounded-2xl p-5 shadow-sm mb-5">
            <div class="flex items-start gap-3">
                <div class="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                    <i data-lucide="file-text" class="w-5 h-5 text-orange-600"></i>
                </div>
                <div>
                    <div class="text-xs text-gray-500">Keterangan</div>
                    <p class="text-sm text-gray-600 leading-relaxed">{{ $absensi->catatan }}</p>
                </div>
            </div>
        </div>
        @endif

        <div class="bg-white rounded-2xl p-5 shadow-sm mb-5">
            <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                    <i data-lucide="camera" class="w-5 h-5 text-teal-600"></i>
                </div>
                <h3 class="font-semibold text-gray-900">Bukti Foto</h3>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div>
                    <div class="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-2">
                        @if ($absensi->foto_masuk)
                            <img src="{{ asset('storage/' . $absensi->foto_masuk) }}" class="w-full h-full object-cover" alt="Foto Masuk">
                        @else
                            <div class="w-full h-full flex items-center justify-center text-gray-400">
                                <i data-lucide="image-off"></i>
                            </div>
                        @endif
                    </div>
                    <p class="text-xs text-gray-500 text-center">Foto Masuk</p>
                </div>

                <div>
                    <div class="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-2">
                        @if ($absensi->foto_pulang)
                            <img src="{{ asset('storage/' . $absensi->foto_pulang) }}" class="w-full h-full object-cover" alt="Foto Keluar">
                        @else
                            <div class="w-full h-full flex items-center justify-center text-gray-400">
                                <i data-lucide="image-off"></i>
                            </div>
                        @endif
                    </div>
                    <p class="text-xs text-gray-500 text-center">Foto Pulang</p>
                </div>
            </div>
        </div>

    </div>

    @include('components.bottom_Nav')

    <script>
        lucide.createIcons();
    </script>
</body>

</html>