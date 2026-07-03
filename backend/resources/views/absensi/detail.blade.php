<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Detail Absensi - {{ \Carbon\Carbon::parse($absensi->tanggal)->format('d M Y') }}</title>
     {{-- <link rel="icon" href="{{ asset('assets/compiled/png/LOGO/logo4.png') }}" type="image/x-icon"> --}}
    <link rel="icon" href="{{ asset('assets/images/logo/logo-sm.png') }}" type="image/png"  style="width: 40px">
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

        // Jalankan pertama kali
        updateTime();

        // Update tiap 1 detik
        setInterval(updateTime, 1000);
    </script>

    <div class="bg-white px-5 pt-4 pb-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
            <a href="{{ url()->previous() }}"
                class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <i data-lucide="arrow-left" class="w-5 h-5 text-gray-700"></i>
            </a>
            <h1 class="text-lg font-bold text-gray-900">Detail Absensi</h1>
            <div class="w-10"></div>
        </div>
    </div>

    <div class="px-5 py-5">
        <div class="bg-gradient-to-br from-[#0D1F3C] to-[#1a2d4a] rounded-3xl p-6 text-white shadow-lg mb-5">
            <div class="flex items-center gap-4 mb-4">
                <div class="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                    <i data-lucide="calendar" class="w-8 h-8"></i>
                </div>
                <div class="flex-1">
                    <div class="text-sm text-blue-100 mb-1">Tanggal Absensi</div>
                    <div class="text-xl font-bold">
                        {{ \Carbon\Carbon::parse($absensi->tanggal)->translatedFormat('l, d F Y') }}
                    </div>
                    @if ($absensi->shift)
                        <div class="text-sm text-blue-200 mt-1">
                            Shift: {{ $absensi->shift->nama_shift }}
                        </div>
                    @endif
                </div>
            </div>

            @php
                $statusColors = [
                    'Hadir' => 'bg-green-500/20',
                    'Terlambat' => 'bg-orange-500/20',
                    'Izin' => 'bg-blue-500/20',
                    'Sakit' => 'bg-red-500/20',
                    'Alpha' => 'bg-gray-500/20',
                ];
                $statusIcons = [
                    'Hadir' => 'check-circle',
                    'Terlambat' => 'clock',
                    'Izin' => 'file-text',
                    'Sakit' => 'heart-pulse',
                    'Alpha' => 'x-circle',
                ];
                $currentColor = $statusColors[$absensi->status] ?? 'bg-gray-500/20';
                $currentIcon = $statusIcons[$absensi->status] ?? 'help-circle';
            @endphp

            <div class="flex items-center gap-2 px-4 py-3 {{ $currentColor }} backdrop-blur rounded-2xl">
                <i data-lucide="{{ $currentIcon }}" class="w-5 h-5"></i>
                <span class="font-semibold text-base">{{ $absensi->status }}</span>
            </div>
        </div>

        @if ($absensi->shift)
        <div class="bg-white rounded-2xl p-4 shadow-sm mb-5">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <i data-lucide="clock" class="w-5 h-5 text-indigo-600"></i>
                </div>
                <div class="flex-1">
                    <div class="text-xs text-gray-500">Shift Kerja</div>
                    <div class="text-lg font-bold text-gray-900">{{ $absensi->shift->nama_shift }}</div>
                    <div class="text-xs text-gray-400">
                        {{ \Carbon\Carbon::parse($absensi->shift->jam_masuk)->format('H:i') }} - 
                        {{ \Carbon\Carbon::parse($absensi->shift->jam_pulang)->format('H:i') }}
                    </div>
                </div>
            </div>
        </div>
        @endif

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
                        <div class="text-sm text-gray-500 mb-1">Total Waktu Kerja</div>
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
                <div class="relative">
                    <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                            style="width: 100%"></div>
                    </div>
                    <div class="flex justify-between mt-2 text-xs text-gray-500">
                        <span>Target: 9 Jam</span>
                        <span>Selesai</span>
                    </div>
                </div>
            </div>
        @endif

        <div class="bg-white rounded-2xl p-5 shadow-sm mb-5">
            <div class="flex items-start gap-3">
                <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                    <i data-lucide="map-pin" class="w-5 h-5 text-blue-600"></i>
                </div>
                <div>
                    <div class="text-xs text-gray-500">Lokasi</div>
                    <div class="text-sm font-semibold text-gray-900">{{ $absensi->lokasi ?? 'Lokasi tidak tercatat' }}
                    </div>
                </div>
            </div>
            <hr class="my-4 border-gray-100">
            <div class="flex items-start gap-3">
                <div class="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                    <i data-lucide="file-text" class="w-5 h-5 text-orange-600"></i>
                </div>
                <div>
                    <div class="text-xs text-gray-500">Keterangan</div>
                    <p class="text-sm text-gray-600 leading-relaxed">
                        {{ $absensi->keterangan ?? 'Tidak ada keterangan.' }}</p>
                </div>
            </div>
        </div>

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
                            <img src="{{ asset('storage/' . $absensi->foto_masuk) }}"
                                class="w-full h-full object-cover" alt="Foto Masuk">
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
                            <img src="{{ asset('storage/' . $absensi->foto_pulang) }}"
                                class="w-full h-full object-cover" alt="Foto Keluar">
                        @else
                            <div class="w-full h-full flex items-center justify-center text-gray-400">
                                <i data-lucide="image-off"></i>
                            </div>
                        @endif
                    </div>
                    <p class="text-xs text-gray-500 text-center">Foto Keluar</p>
                </div>
            </div>
        </div>

    </div>

     @include('components.bottom_Nav')
    <!-- File JS eksternal absensi -->

    <script>
        lucide.createIcons();
    </script>
</body>

</html>
