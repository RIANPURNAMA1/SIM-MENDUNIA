<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Absensi Karyawan</title>
    {{-- <link rel="icon" href="{{ asset('assets/compiled/png/LOGO/logo4.png') }}" type="image/x-icon"> --}}
    <link rel="icon" href="{{ asset('assets/images/logo/logo-sm.png') }}" type="image/png" style="width: 40px">

    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Lucide Icons CDN -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <!-- Face-api.js CDN - WAJIB ADA -->
    <script defer src="https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js"></script>
    <style>
        .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom);
        }
    </style>
    <style>
        #loaderFace {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.8);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 60;
        }
    </style>
    <style>
        /* === ABSENSI THEME: 0D1F3C === */
        /* Shift card / status card gradient */
        .from-\[\#00c0ff\] { background: linear-gradient(135deg, #0D1F3C, #1a2d4a) !important; }
        .to-blue-700 { background: linear-gradient(135deg, #0D1F3C, #1a2d4a) !important; }

        /* Status card untuk absensi - Dateng Pagi etc */
        .bg-gradient-to-br.from-\[\#00c0ff\].to-blue-700 {
            background: linear-gradient(135deg, #0D1F3C, #1a2d4a) !important;
        }

        /* Status badge pada riwayat dengan warna yang sesuai tema */
        .border-l-4.border-blue-500 { border-left-color: #089CF3 !important; }
    </style>
</head>

<body class="bg-gray-50 pb-24">

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
    <div class="bg-white px-5 pt-4 pb-6 shadow-sm absensi-header">
        <div class="flex items-center justify-between mb-4">
            <!-- PROFILE INFO (CLICKABLE) -->
            <a href="/absensi/profile" class="flex items-center gap-3 hover:opacity-80 transition">
                <!-- FOTO PROFIL (DINAMIS DARI BACKEND) -->
                <div class="w-10 h-10 rounded-full overflow-hidden border border-blue-500">
                    <img src="{{ auth()->user() && auth()->user()->foto_profil
                        ? asset('uploads/foto_profil/' . auth()->user()->foto_profil)
                        : 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png' }}"
                        alt="Foto Karyawan" class="w-full h-full object-cover">
                </div>

                <!-- NAMA & DIVISI -->
                <div class="leading-tight">
                    <p class="text-sm font-semibold text-gray-800">
                        {{ auth()->user()->name ?? auth()->user()->name }}
                    </p>

                    <p class="text-xs text-black font-medium">
                        @if(isset($isSiswa) && $isSiswa)
                            {{ $siswaRecord->kelasRelasi->nama_kelas ?? $siswaRecord->kelas ?? 'Kelas belum diatur' }}
                        @else
                            {{ auth()->user()->divisi->nama_divisi ?? 'Divisi belum diatur' }}
                        @endif
                    </p>
                </div>
            </a>


            <button class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center relative">
                <i data-lucide="bell" class="w-4 h-4 text-gray-700"></i>
                <span
                    class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">3</span>
            </button>
        </div>
        {{-- <div class="flex justify-center py-5 ">

            <img src="{{ asset('assets/images/logo/logo.png') }}" alt="logo image" class="logo-lg" width="200" />
        </div> --}}

        <!-- SEARCH BAR -->
        {{-- <div class="relative mb-8 px-2">
            <div class="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-32 bg-blue-100/50 rounded-full blur-3xl -z-10">
            </div>

            <div class="flex flex-col items-center justify-center text-center">
                <div
                    class="p-4transition-all duration-300 group">
                    <img src="{{ asset('assets/images/logo/logo.png') }}" alt="logo image"
                        class="logo-lg object-contain group-hover:scale-105 transition-transform duration-300"
                        width="180" />
                </div>
            </div>
        </div> --}}
    </div>

    <div class="px-5 py-5">
        <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
                <h2 class="text-base font-bold text-gray-900">Jadwal Shift Hari Ini</h2>
                <div class="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                    <span class="text-blue-600 text-xs font-bold">!</span>
                </div>
            </div>
            <button class="text-blue-600 text-sm font-semibold">See All</button>
        </div>

        @php
            $userShifts = isset($userShifts) ? $userShifts : collect();
            $firstShift = $userShifts->first();
        @endphp

        @if ($userShifts && $userShifts->count() > 0)
            <div class="bg-gradient-to-br from-[#00c0ff] to-blue-700 rounded-2xl p-5 text-white shadow-lg">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                            <i data-lucide="clock" class="w-6 h-6"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-base">{{ $firstShift->nama_shift }}</h3>
                            <p class="text-blue-100 text-sm">Status: {{ $firstShift->status }}</p>
                            @if ($userShifts->count() > 1)
                                <p class="text-blue-200 text-xs mt-1">+ {{ $userShifts->count() - 1 }} shift lainnya</p>
                            @endif
                        </div>
                    </div>
                    <div class="flex flex-col items-end gap-1">
                        <span class="text-3xl font-bold font-mono tabular-nums leading-none" id="liveClock">
                            {{ now()->format('H:i:s') }}
                        </span>
                        <span class="text-blue-200 text-[10px] uppercase tracking-wider">Jam Sekarang</span>
                    </div>
                </div>

                <div class="flex items-center gap-6">
                    <div class="flex items-center gap-2">
                        <i data-lucide="calendar" class="w-4 h-4 text-blue-200"></i>
                        <span class="text-sm">{{ \Carbon\Carbon::now()->translatedFormat('l, d M') }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <i data-lucide="clock" class="w-4 h-4 text-blue-200"></i>
                        <span class="text-sm">
                            {{ \Carbon\Carbon::parse($firstShift->jam_masuk)->format('H:i') }} -
                            {{ \Carbon\Carbon::parse($firstShift->jam_pulang)->format('H:i') }}
                        </span>
                    </div>
                </div>
            </div>
        @else
            <div class="bg-gray-100 rounded-2xl p-5 text-gray-500 border-2 border-dashed border-gray-200 text-center">
                <p class="text-sm">Jadwal shift belum ditentukan.</p>
            </div>
        @endif
    </div>

    @if(isset($isSiswa) && $isSiswa && $siswaRecord)
    <div class="px-5 pb-3">
        <h2 class="text-base font-bold text-gray-900 mb-3">Kelas Saya</h2>
        <div class="space-y-2">
            @if($siswaKelasSensei && $siswaKelasSensei->count() > 0)
            @foreach ($siswaKelasSensei as $ks)
            @php
                $now = \Carbon\Carbon::now();
                $mulai = \Carbon\Carbon::parse($ks->tanggal_mulai);
                $selesai = \Carbon\Carbon::parse($ks->tanggal_selesai);
                $isActive = $now->between($mulai, $selesai);
            @endphp
            <a href="{{ route('absensi.riwayat-kelas', $ks->id) }}"
               class="block rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform
                   {{ $isActive ? 'bg-gradient-to-br from-[#0D1F3C] to-[#1a2d4a] border border-emerald-400/30' : 'bg-white border border-blue-100' }}">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                        {{ $isActive ? 'bg-emerald-900/40' : 'bg-blue-100' }}">
                        <i data-lucide="book-open" class="w-5 h-5 {{ $isActive ? 'text-emerald-300' : 'text-blue-600' }}"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <p class="text-sm font-semibold {{ $isActive ? 'text-white' : 'text-gray-900' }}">{{ $ks->nama_kelas }}</p>
                            @if($isActive)
                                <span class="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Aktif</span>
                            @endif
                        </div>
                        <p class="text-xs {{ $isActive ? 'text-emerald-200/70' : 'text-gray-500' }}">{{ $ks->batchRelasi->nama_batch ?? '-' }} &middot; Level {{ $ks->level }}</p>
                        <p class="text-xs {{ $isActive ? 'text-white/50' : 'text-gray-400' }}">Sensei: {{ $ks->user->name ?? $ks->user->nama ?? '-' }}</p>
                        <p class="text-xs {{ $isActive ? 'text-white/50' : 'text-gray-400' }}">{{ $ks->tanggal_mulai->format('d/m/Y') }} - {{ $ks->tanggal_selesai->format('d/m/Y') }}</p>
                    </div>
                    @if($isActive)
                        <div class="flex flex-col items-center gap-1">
                            <div class="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                <i data-lucide="camera" class="w-4 h-4 text-emerald-300"></i>
                            </div>
                            <span class="text-[9px] font-bold uppercase tracking-wider text-emerald-300">Absen</span>
                        </div>
                    @else
                        <i data-lucide="chevron-right" class="w-4 h-4 {{ $isActive ? 'text-white/30' : 'text-gray-300' }} flex-shrink-0"></i>
                    @endif
                </div>
            </a>
            @endforeach
            @else
            <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center text-gray-400 text-sm">
                Belum ada kelas
            </div>
            @endif
        </div>
    </div>
    @endif

    <div class="px-5 pb-5">
        <div class="flex items-center justify-between mb-3">
            <h2 class="text-base font-bold text-gray-900">Quick Actions</h2>
        </div>

        @if(!$isSiswa)
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            @if(Auth::user()->can_access_khusus)
            <a href="{{ route('absensi.khusus') }}"
                class="flex flex-col items-center gap-1 bg-white rounded-xl p-3 shadow-sm active:scale-95 transition">
                <div class="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <i data-lucide="timer" class="w-5 h-5 text-emerald-600"></i>
                </div>
                <span class="text-[11px] font-medium text-gray-700">Absen Khusus</span>
            </a>
            @endif

            <button type="button" onclick="mulaiAbsenFoto()"
                class="flex flex-col items-center gap-1 bg-white rounded-xl p-3 shadow-sm active:scale-95 transition">
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i data-lucide="qr-code" class="w-5 h-5 text-blue-600"></i>
                </div>
                <span class="text-[11px] font-medium text-gray-700">Scan QR</span>
            </button>

            <button onclick="location.href='/absensi/izin'"
                class="flex flex-col items-center gap-1 bg-white rounded-xl p-3 shadow-sm active:scale-95 transition">
                <div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <i data-lucide="file-text" class="w-5 h-5 text-indigo-600"></i>
                </div>
                <span class="text-[11px] font-medium text-gray-700">Izin/Sakit</span>
            </button>

            <button onclick="location.href='/absensi/riwayat'"
                class="flex flex-col items-center gap-1 bg-white rounded-xl p-3 shadow-sm active:scale-95 transition">
                <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <i data-lucide="history" class="w-5 h-5 text-amber-600"></i>
                </div>
                <span class="text-[11px] font-medium text-gray-700">Riwayat</span>
            </button>

            <button  onclick="location.href= '/absensi/lembur'"
                class="flex flex-col items-center gap-1 bg-white rounded-xl p-3 shadow-sm active:scale-95 transition">
                <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <i data-lucide="clock-alert" class="w-5 h-5 text-red-600"></i>
                </div>
                <span class="text-[11px] font-medium text-gray-700">Lembur</span>
            </button>

            <button onclick="toggleModalJadwal(true)"
                class="flex flex-col items-center gap-1 bg-white rounded-xl p-3 shadow-sm active:scale-95 transition">
                <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <i data-lucide="calendar-range" class="w-5 h-5 text-purple-600"></i>
                </div>
                <span class="text-[11px] font-medium text-gray-700">Jadwal</span>
            </button>
            @if(isset($isGuru) && $isGuru)
            <button onclick="openModalSensei()"
                class="flex flex-col items-center gap-1 bg-white rounded-xl p-3 shadow-sm active:scale-95 transition">
                <div class="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                    <i data-lucide="graduation-cap" class="w-5 h-5 text-violet-600"></i>
                </div>
                <span class="text-[11px] font-medium text-gray-700">Guru</span>
            </button>
            @endif

            <button onclick="openModalAgenda()"
                class="flex flex-col items-center gap-1 bg-white rounded-xl p-3 shadow-sm active:scale-95 transition">
                <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <i data-lucide="calendar-check" class="w-5 h-5 text-amber-600"></i>
                </div>
                <span class="text-[11px] font-medium text-gray-700">Agenda</span>
            </button>

            @if(isset($isGuru) && $isGuru)
            <a href="{{ route('absensi.siswa') }}"
                class="flex flex-col items-center gap-1 bg-white rounded-xl p-3 shadow-sm active:scale-95 transition">
                <div class="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                    <i data-lucide="users" class="w-5 h-5 text-cyan-600"></i>
                </div>
                <span class="text-[11px] font-medium text-gray-700">Data Siswa</span>
            </a>
            @endif

            @php
                $userAbs = auth()->user();
                $penilaianAktif = \App\Models\PenilaianSetting::where('divisi_id', $userAbs->divisi_id)
                    ->where('penilaian_aktif', true)->exists();
            @endphp

            @if($penilaianAktif)
            <a href="/penilaian-karyawan"
                class="flex flex-col items-center gap-1 bg-white rounded-xl p-3 shadow-sm active:scale-95 transition">
                <div class="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <i data-lucide="graduation-cap" class="w-5 h-5 text-teal-600"></i>
                </div>
                <span class="text-[11px] font-medium text-gray-700">Penilaian</span>
            </a>
            @endif
        </div>
        @else
        <div class="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
            <a href="{{ route('absensi.scan') }}"
                class="flex flex-col items-center gap-3 bg-white rounded-2xl p-6 shadow-sm active:scale-95 transition border-2 border-blue-100 hover:border-blue-300 hover:shadow-md">
                <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <i data-lucide="qr-code" class="w-8 h-8 text-blue-600"></i>
                </div>
                <span class="text-sm font-semibold text-gray-800">Scan QR Code</span>
                <span class="text-xs text-gray-500 text-center">Scan untuk absensi</span>
            </a>
            <button onclick="toggleModalJadwal(true)"
                class="flex flex-col items-center gap-3 bg-white rounded-2xl p-6 shadow-sm active:scale-95 transition border-2 border-purple-100 hover:border-purple-300 hover:shadow-md">
                <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                    <i data-lucide="calendar-range" class="w-8 h-8 text-purple-600"></i>
                </div>
                <span class="text-sm font-semibold text-gray-800">Lihat Jadwal</span>
                <span class="text-xs text-gray-500 text-center">Cek jadwal shift Anda</span>
            </button>
        </div>
        @endif
    </div>

    @if(isset($isSiswa) && $isSiswa && $riwayatAbsensiSiswa && $riwayatAbsensiSiswa->count() > 0)
    <div class="px-5 pb-5">
        <div class="flex items-center justify-between mb-3">
            <h2 class="text-base font-bold text-gray-900">Riwayat Absensi</h2>
            <a href="{{ route('absensi.riwayat') }}" class="text-blue-600 text-sm font-semibold">Lihat Semua</a>
        </div>
        <div class="space-y-2">
            @foreach ($riwayatAbsensiSiswa as $ra)
            @php
                $statusColor = match($ra->status) {
                    'HADIR' => 'text-green-600 bg-green-100',
                    'TERLAMBAT' => 'text-yellow-600 bg-yellow-100',
                    'IZIN' => 'text-blue-600 bg-blue-100',
                    'SAKIT' => 'text-red-600 bg-red-100',
                    'ALPA' => 'text-gray-600 bg-gray-100',
                    default => 'text-gray-600 bg-gray-100',
                };
            @endphp
            <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 {{ explode(' ', $statusColor)[1] }}">
                        <span class="text-sm font-bold {{ explode(' ', $statusColor)[0] }}">
                            {{ \Carbon\Carbon::parse($ra->tanggal)->format('d') }}
                        </span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <p class="text-sm font-semibold text-gray-900">
                                {{ \Carbon\Carbon::parse($ra->tanggal)->translatedFormat('l, d M Y') }}
                            </p>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full {{ $statusColor }}">
                                {{ $ra->status }}
                            </span>
                        </div>
                        <p class="text-xs text-gray-400">
                            {{ $ra->jam_masuk ? \Carbon\Carbon::parse($ra->jam_masuk)->format('H:i') : '--:--' }}
                            -
                            {{ $ra->jam_keluar ? \Carbon\Carbon::parse($ra->jam_keluar)->format('H:i') : '--:--' }}
                            @if($ra->cabang)
                                &middot; {{ $ra->cabang->nama_cabang }}
                            @endif
                        </p>
                    </div>
                    <i data-lucide="chevron-right" class="w-4 h-4 text-gray-300 flex-shrink-0"></i>
                </div>
            </div>
            @endforeach
        </div>
    </div>
    @endif

    @if(isset($isGuru) && $isGuru)
    <!-- KELAS SENSEI AKTIF -->
    <div class="px-5 pb-5" id="sectionKelasSensei">
        <div class="flex items-center justify-between mb-3">
            <h2 class="text-base font-bold text-gray-900">Kelas Sensei</h2>
            @if(!$isLibur)
            <button onclick="openModalSensei()" class="text-violet-600 text-sm font-semibold flex items-center gap-1">
                <i data-lucide="plus" class="w-4 h-4"></i> Tambah Kelas
            </button>
            @endif
        </div>

        <div id="kelasSenseiContainer" class="space-y-3">
            <!-- Loaded via JS -->
        </div>
        @if($isLibur)
            <div id="serverKelasSensei" class="text-center py-8 text-gray-400 bg-gray-50 rounded-2xl">
                <i data-lucide="calendar-off" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
                <p class="text-sm">Hari ini sedang libur</p>
                <p class="text-xs mt-1">Absensi sensei tidak tersedia</p>
            </div>
        @elseif($kelasSenseiAktif && $kelasSenseiAktif->count() > 0)
            <div id="serverKelasSensei" class="space-y-3">
                @foreach($kelasSenseiAktif as $kelas)
                    @php
                        $absensiHariIni = $kelas->absensi->first();
                        $sudahMasuk = $absensiHariIni && $absensiHariIni->jam_masuk;
                        $sudahPulang = $absensiHariIni && $absensiHariIni->jam_keluar;
                        $kelasSelesai = \Carbon\Carbon::parse($kelas->tanggal_selesai)->endOfDay()->isPast();
                    @endphp
                    <div class="bg-white rounded-2xl p-4 shadow-sm border border-violet-100" data-kelas-id="{{ $kelas->id }}">
                        <div class="flex items-start justify-between mb-3">
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                                    <i data-lucide="graduation-cap" class="w-6 h-6 text-white"></i>
                                </div>
                                <div>
                                    <h3 class="font-bold text-gray-900">{{ $kelas->nama_kelas }}</h3>
                                    <p class="text-xs text-gray-500">Level {{ $kelas->level }} - {{ \Carbon\Carbon::parse($kelas->tanggal_mulai)->format('d M') }} - {{ \Carbon\Carbon::parse($kelas->tanggal_selesai)->format('d M') }}</p>
                                </div>
                            </div>
                            @if($kelasSelesai)
                                <span class="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">SELESAI</span>
                            @elseif($sudahMasuk && !$sudahPulang)
                                <span class="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">HADIR</span>
                            @elseif($sudahMasuk && $sudahPulang)
                                <span class="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-full">SELESAI</span>
                            @endif
                        </div>
                        <div class="flex gap-2">
                            @if($kelasSelesai)
                                <div class="flex-1 py-2.5 bg-green-100 text-green-700 rounded-xl text-sm font-bold text-center">
                                    Kelas Sudah Selesai
                                </div>
                            @elseif(!$sudahMasuk)
                                <button onclick="absenSenseiMasuk({{ $kelas->id }})" class="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold active:scale-95 transition">
                                    Absen Masuk
                                </button>
                            @elseif(!$sudahPulang)
                                <button onclick="absenSenseiPulang({{ $kelas->id }})" class="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-bold active:scale-95 transition">
                                    Absen Pulang
                                </button>
                            @else
                                <div class="flex-1 py-2.5 bg-gray-100 text-gray-500 rounded-xl text-sm font-semibold text-center">
                                    {{ $absensiHariIni->jam_masuk }} - {{ $absensiHariIni->jam_keluar }}
                                </div>
                            @endif
                        </div>
                    </div>
                @endforeach
            </div>
        @else
            <div class="text-center py-8 text-gray-400" id="serverEmptyKelasSensei">
                <i data-lucide="book-open" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
                <p class="text-sm">Belum ada kelas aktif</p>
                <p class="text-xs mt-1">Tambahkan kelas baru untuk mulai absen</p>
            </div>
        @endif
    </div>
    @endif

    {{-- Modal Jadwal Dinamis --}}
    <div id="modalJadwal" class="fixed inset-0 z-50 hidden">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" onclick="toggleModalJadwal(false)"></div>

        <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-6 shadow-2xl transition-transform duration-300 translate-y-full"
            id="modalContent">
            <div class="flex flex-col items-center">
                <div class="w-12 h-1.5 bg-gray-200 rounded-full mb-6"></div>

                <div class="flex justify-between items-center w-full mb-4 text-center">
                    <div class="text-left">
                        <h2 class="text-lg font-black text-gray-900">Jadwal Shift Kerja</h2>
                        <p class="text-[10px] text-gray-400">Kalender shift {{ now()->translatedFormat('F Y') }}</p>
                    </div>
                    <button onclick="toggleModalJadwal(false)" class="p-2 bg-gray-100 rounded-full text-gray-500">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>

                <div class="w-full max-h-[65vh] overflow-y-auto pr-1">
                    <table class="w-full text-center text-xs">
                        <thead>
                            <tr>
                                <th class="text-red-500 py-2">Min</th>
                                <th class="py-2">Sen</th>
                                <th class="py-2">Sel</th>
                                <th class="py-2">Rab</th>
                                <th class="py-2">Kam</th>
                                <th class="py-2">Jum</th>
                                <th class="text-blue-500 py-2">Sab</th>
                            </tr>
                        </thead>
                        <tbody id="kalenderShiftBody">
                            @php
                                $today = now()->day;
                                $firstDay = now()->startOfMonth()->dayOfWeek;
                                $daysInMonth = now()->daysInMonth;
                                $row = '<tr>';
                                for ($i = 0; $i < $firstDay; $i++) {
                                    $row .= '<td></td>';
                                }
                                for ($day = 1; $day <= $daysInMonth; $day++) {
                                    $dateStr = now()->format('Y-m') . '-' . str_pad($day, 2, '0', STR_PAD_LEFT);
                                    $jadwals = $shiftJadwalKalender[$dateStr] ?? collect();
                                    $isToday = $day == $today;
                                    $cellClass = $isToday ? 'ring-2 ring-blue-500 rounded-lg' : '';
                                    $row .= '<td class="p-1 ' . $cellClass . '">';
                                    $row .= '<div class="py-1 font-bold text-gray-800">' . $day . '</div>';
                                    foreach ($jadwals as $j) {
                                        if ($j->shift) {
                                            $row .= '<div class="text-[8px] bg-blue-100 text-blue-700 rounded px-1 py-0.5 mb-0.5 font-medium">' . $j->shift->nama_shift . '</div>';
                                        }
                                    }
                                    $row .= '</td>';
                                    $dayOfWeek = now()->startOfMonth()->addDays($day - 1)->dayOfWeek;
                                    if ($dayOfWeek == 6) {
                                        $row .= '</tr><tr>';
                                    }
                                }
                                $row .= '</tr>';
                            @endphp
                            {!! $row !!}
                        </tbody>
                    </table>
                </div>

                <button onclick="toggleModalJadwal(false)"
                    class="w-full mt-4 bg-gray-900 text-white py-3 rounded-2xl font-bold text-sm active:scale-95 transition">
                    Tutup
                </button>
            </div>
        </div>
    </div>


    @if(!isset($isSiswa) || !$isSiswa)
    <!-- RIWAYAT ABSENSI -->
    <div class="px-5 pb-24">
        <div class="flex items-center justify-between mb-3">
            <h2 class="text-base font-bold text-gray-900">Riwayat Absensi</h2>
            <button class="text-blue-600 text-sm font-semibold">See All</button>
        </div>

        <div class="space-y-3">
            <div id="riwayatContainer">
                @if(isset($isGuru) && $isGuru)
                {{-- Riwayat Sensei --}}
                @forelse ($riwayatSensei as $a)
                    <a href="{{ route('absensi.detailSensei', ['tanggal' => $a->tanggal, 'kelasId' => $a->kelas_sensei_id]) }}"
                        class="block bg-white rounded-xl p-3 border border-gray-100">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                <span class="text-sm font-semibold text-blue-600">{{ \Carbon\Carbon::parse($a->tanggal)->format('d') }}</span>
                            </div>
                            <div class="flex-1">
                                <div class="flex items-center gap-2">
                                    <span class="text-xs font-medium text-blue-500">SENSEI</span>
                                    <span class="text-xs text-gray-400">{{ $a->kelasSensei->nama_kelas ?? '-' }}</span>
                                </div>
                                <div class="text-xs text-gray-400">
                                    {{ $a->jam_masuk ?? '-' }} - {{ $a->jam_keluar ?? '-' }}
                                </div>
                            </div>
                            <i data-lucide="chevron-right" class="w-4 h-4 text-gray-300"></i>
                        </div>
                    </a>
                @empty
                    <div class="text-center text-gray-500 text-sm">
                        Belum ada riwayat absensi
                    </div>
                @endforelse
                @else
                {{-- Riwayat Karyawan --}}
                @forelse ($riwayat as $a)
                    <a href="{{ route('absensi.riwayat') }}"
                        class="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm active:scale-95 transition">
                        <div class="text-center">
                            <div class="text-[10px] font-medium text-blue-600">
                                {{ \Carbon\Carbon::parse($a->tanggal)->translatedFormat('D') }}
                            </div>
                            <div class="text-lg font-bold text-blue-700">
                                {{ \Carbon\Carbon::parse($a->tanggal)->format('d') }}
                            </div>
                        </div>

                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <span class="text-[9px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">{{ $a->shift->nama_shift ?? '-' }}</span>
                                <span class="text-xs font-semibold {{ $a->status == 'TERLAMBAT' ? 'text-red-600' : 'text-gray-800' }}">{{ $a->status }}</span>
                            </div>
                            <div class="text-[11px] text-gray-500 mt-0.5">
                                In: {{ $a->jam_masuk ? \Carbon\Carbon::parse($a->jam_masuk)->format('H:i') : '-' }}
                                &middot; Out: {{ $a->jam_keluar ? \Carbon\Carbon::parse($a->jam_keluar)->format('H:i') : '-' }}
                            </div>
                        </div>

                        <i data-lucide="chevron-right" class="w-4 h-4 text-gray-300 flex-shrink-0"></i>
                    </a>
                @empty
                    <div class="text-center text-gray-500 text-sm">
                        Belum ada riwayat absensi
                    </div>
                @endforelse
                @endif

                {{-- Riwayat Agenda --}}
                @if(isset($riwayatAgenda) && $riwayatAgenda->count() > 0)
                @foreach($riwayatAgenda as $ag)
                <div class="bg-white rounded-xl p-3 shadow-sm border border-amber-100">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <i data-lucide="calendar-check" class="w-5 h-5 text-amber-600"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <span class="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">AGENDA</span>
                                <span class="text-xs font-semibold text-gray-800 truncate">{{ $ag->judul }}</span>
                            </div>
                            <div class="text-[11px] text-gray-500 mt-0.5">
                                {{ \Carbon\Carbon::parse($ag->tanggal)->translatedFormat('l, d M') }}
                                &middot; {{ $ag->jam_absen_masuk ? \Carbon\Carbon::parse($ag->jam_absen_masuk)->format('H:i') : '-' }}
                                - {{ $ag->jam_absen_keluar ? \Carbon\Carbon::parse($ag->jam_absen_keluar)->format('H:i') : '-' }}
                            </div>
                        </div>
                        <i data-lucide="chevron-right" class="w-4 h-4 text-gray-300 flex-shrink-0"></i>
                    </div>
                </div>
                @endforeach
                @endif
            </div>

        </div>
    </div>

@endif

<!-- BOTTOM NAV -->
    @include('components.bottom_Nav')
    @include('absensi.modal_manual')
    @include('absensi.modal_sensei')
    @include('absensi.modal_agenda')

    <!-- Modal Kamera untuk Agenda -->
    <div id="modalKameraAgenda" class="fixed inset-0 z-[9999] bg-black hidden">
        <video id="videoPreviewAgenda" class="w-full h-full object-cover transform scale-x-[-1]" autoplay playsinline muted></video>
        
        <div class="absolute inset-0 flex flex-col justify-between items-center p-6">
            <div class="w-full flex justify-end">
                <button onclick="hentikanKameraAgenda()" class="bg-black/50 backdrop-blur-md p-3 rounded-full text-white">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>
            
            <div class="flex flex-col items-center gap-6 pb-12">
                <button onclick="ambilFotoAgenda()" class="group relative w-20 h-20 bg-white rounded-full p-1 shadow-[0_0_30px_rgba(255,255,255,0.6)] active:scale-95">
                    <div class="w-full h-full rounded-full border-[3px] border-gray-800"></div>
                </button>
            </div>
        </div>
    </div>
    <canvas id="canvasAgenda" class="hidden"></canvas>

    <!-- Modal Kamera Absensi - FIXED VERSION -->
    <div id="modalKameraAbsen" class="fixed inset-0 z-[9999] bg-black hidden items-center justify-center">

        <!-- Video Preview - PERBAIKAN: Hapus absolute, gunakan relative -->
        <video id="videoPreviewAbsen" class="w-full h-full object-cover transform scale-x-[-1]" autoplay playsinline
            muted>
        </video>



        <!-- UI Controls Overlay -->
        <div class="absolute inset-0 flex flex-col justify-between items-center p-6 pointer-events-none">

            <!-- Top Bar - Close Button -->
            <div class="w-full flex justify-end pointer-events-auto">
                <button onclick="hentikanKameraAbsen()"
                    class="bg-black/50 backdrop-blur-md p-3 rounded-full text-white shadow-lg hover:bg-black/70 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <!-- Bottom Bar - Instruction & Shutter -->
            <div class="flex flex-col items-center gap-6 pb-12 pointer-events-auto">
                <!-- Instruction Text -->
                <!-- Shutter Button -->
                <button id="btnShutterAbsen" onclick="eksekusiAmbilFoto()"
                    class="group relative w-20 h-20 bg-white rounded-full p-1 shadow-[0_0_30px_rgba(255,255,255,0.6)] active:scale-95 transition-transform">
                    <div
                        class="w-full h-full rounded-full border-[3px] border-gray-800 group-active:border-gray-600 transition-colors">
                    </div>
                </button>
            </div>
        </div>
    </div>

    <!-- Canvas tersembunyi untuk capture -->
    <canvas id="canvasSimpanFoto" class="hidden"></canvas>

    <style>
        /* Pastikan video selalu tampil penuh */
        #videoPreviewAbsen {
            min-width: 100%;
            min-height: 100%;
            width: auto;
            height: auto;
        }

        /* Animasi untuk shutter button */
        @keyframes pulse-ring {
            0% {
                box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
            }

            70% {
                box-shadow: 0 0 0 20px rgba(255, 255, 255, 0);
            }

            100% {
                box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
            }
        }

        #btnShutterAbsen:hover {
            animation: pulse-ring 1.5s infinite;
        }

        /* Smooth transitions */
        #modalKameraAbsen {
            transition: opacity 0.3s ease;
        }

        #modalKameraAbsen.hidden {
            opacity: 0;
            pointer-events: none;
        }

        #modalKameraAbsen:not(.hidden) {
            opacity: 1;
        }
    </style>
    {{-- MODAL REGISTRASI WAJAH
    <div id="modalRegistrasiWajah"
        class="hidden fixed inset-0 bg-black/80 items-center justify-center z-[60] p-4 backdrop-blur-sm">
        <div class="bg-white rounded-3xl p-6 relative w-full max-w-sm flex flex-col items-center shadow-2xl">



            <div id="mainContentReg" class="hidden w-full flex flex-col items-center">
                <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <i data-lucide="user-check" id="statusIcon" class="w-8 h-8 text-blue-600"></i>
                </div>

                <h3 class="font-bold text-xl text-gray-900 mb-1 text-center">Pendaftaran Wajah</h3>
                <p id="instructionText" class="text-gray-500 text-sm text-center mb-5">
                    Posisikan wajah di tengah lingkaran dan diam sebentar...
                </p>

                <div
                    class="relative w-full aspect-square max-w-[280px] bg-gray-900 rounded-full overflow-hidden border-4 border-blue-100 shadow-xl mx-auto">
                    <video id="videoReg" autoplay muted playsinline
                        class="w-full h-full object-cover scale-x-[-1]"></video>
                    <canvas id="canvasReg" class="absolute inset-0 w-full h-full"></canvas>

                    <svg class="absolute inset-0 w-full h-full pointer-events-none -rotate-90">
                        <circle cx="140" cy="140" r="135" stroke="currentColor" stroke-width="8"
                            fill="transparent" class="text-blue-600/30" />
                        <circle id="progressCircle" cx="140" cy="140" r="135" stroke="currentColor"
                            stroke-width="8" fill="transparent" stroke-dasharray="848" stroke-dashoffset="848"
                            class="text-blue-600 transition-all duration-200 ease-linear" />
                    </svg>
                </div>

                <div class="mt-6 w-full">
                    <p id="timerText" class="text-center font-bold text-blue-600 text-lg h-7"></p>
                    <p class="text-[10px] text-center text-gray-400 italic">Sistem akan mengambil foto otomatis saat
                        posisi stabil</p>
                </div>
            </div>
        </div>
    </div> --}}


    <!-- IMPORTANT: Include Html5Qrcode Library BEFORE your script -->
    <script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
    <!-- Face API dan SweetAlert CDN -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://cdn.jsdelivr.net/npm/face-api.js"></script>

    <!-- Lucide Icons -->
    <script src="https://cdn.jsdelivr.net/npm/lucide@latest/dist/lucide.min.js"></script>

    <!-- File JS eksternal absensi -->
    <script src="{{ asset('js/absensi.js') }}" defer></script>

    <script>
        function showUnderDevelopment() {
            Swal.fire({
                title: 'Fitur Dalam Pengembangan',
                text: 'Mohon maaf, fitur Scan QR saat ini sedang dalam tahap pengembangan.',
                icon: 'info',
                confirmButtonText: 'Oke, Mengerti',
                confirmButtonColor: '#2563eb', // Warna biru menyesuaikan tema tombol Anda
                showClass: {
                    popup: 'animate__animated animate__fadeInUp'
                },
                hideClass: {
                    popup: 'animate__animated animate__fadeOutDown'
                }
            });
        }
        // ============================================
        // QR CODE SCANNER - TAILWIND VERSION (NO BOOTSTRAP)
        // ============================================
        // function closeAbsenManual() {
        //     const modal = document.getElementById("modalAbsenManual");
        //     modal.classList.add("hidden");
        //     modal.classList.remove("flex");

        //     if (stream) stream.getTracks().forEach((track) => track.stop());
        //     if (detectionInterval) clearInterval(detectionInterval);

        //     // reset state
        //     faceDetectedCount = 0;
        //     absensiProcessing = false;
        //     document.getElementById("instructionTextAbsen").textContent =
        //         "Posisikan wajah Anda di depan kamera...";
        // }

        // ============================================
        // CLOSE MODAL - VANILLA JS (NO JQUERY MODAL)
        // ============================================

        function closeAbsenManual() {
            if (isModalClosing) return;

            isModalClosing = true;
            const modal = document.getElementById("modalAbsenManual");
            const card = modal.querySelector(".modal-card");

            // Start fade out animation
            card.classList.remove("modal-fade-in");
            card.classList.add("modal-fade-out");

            // Cleanup resources
            setTimeout(() => {
                stopAllIntervals();
                stopStream();

                // HIDE MODAL - VANILLA JS ONLY!
                modal.classList.add("hidden");
                modal.classList.remove("flex");

                // Restore body scroll
                document.body.style.overflow = "auto";

                // Reset state
                resetModalState();

                // Reset flag
                isModalClosing = false;
            }, 250);
        }


        // Tambahkan sisa fungsi (sendAbsensiData, playBeepSound) dari kode Anda sebelumnya di sini...
        // Tangkap tombol
        const btnOvertime = document.getElementById('btnOvertime');

        btnOvertime.addEventListener('click', function(e) {
            e.preventDefault(); // cegah redirect / href

            Swal.fire({
                icon: 'info',
                title: 'Fitur Dalam Pengembangan',
                text: 'Fitur Lembur sedang dikembangkan, silakan coba nanti.',
                confirmButtonText: 'Oke',
                confirmButtonColor: '#2563eb',
                customClass: {
                    popup: 'rounded-2xl',
                    title: 'text-lg font-bold',
                    htmlContainer: 'text-sm'
                }
            });
        });

        // Menjaga session tetap aktif selama tab browser masih terbuka
        setInterval(function() {
            fetch('/keep-alive')
                .then(response => response.json())
                .then(data => console.log('Session refreshed'));
        }, 15 * 60 * 1000); // Setiap 15 menit


        $(document).ready(async function() {
            // Ambil status face_embedding dari Laravel
            const hasFace = @json(auth()->user()->face_embedding != null);

            initFaceEngine().then(() => {
                if (!hasFace) {
                    showModalRegistrasi();
                }
            });
        });

        // 🔥 DATA CABANG DARI SERVER
        const CABANG = {
            nama: "{{ $namaCabang }}",
            lat: {{ $cabangLat }},
            long: {{ $cabangLong }},
            radius: {{ $radiusMeter }}
        };

        // 🔥 DATA VALIDASI SENSEI
        window.HAS_UNABSENSED_SENSEI = @json($hasUnabsensedSensei ?? false);

        window.routes = {
            updateFace: "{{ route('user.update-face') }}",
            absensiStatus: "{{ url('/absensi/status') }}",
            absenMasuk: "{{ url('/absensi/masuk') }}",
            absenPulang: "{{ url('/absensi/pulang') }}"
        };

        // Sensei Functions
        function loadKelasAktif() {
            // Hide server-rendered content first
            const serverContent = document.getElementById('serverKelasSensei');
            const serverEmpty = document.getElementById('serverEmptyKelasSensei');
            if (serverContent) serverContent.classList.add('hidden');
            if (serverEmpty) serverEmpty.classList.add('hidden');

            // Add cache-busting timestamp
            const timestamp = new Date().getTime();
            fetch('/absensi/sensei/kelas-aktif?_=' + timestamp)
                .then(res => res.json())
                .then(data => {
                    const container = document.getElementById('kelasSenseiContainer');
                    
                    if (!data || data.length === 0) {
                        if (container) {
                            container.innerHTML = `<div class="text-center py-8 text-gray-400">
                                <i data-lucide="book-open" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
                                <p class="text-sm">Belum ada kelas aktif</p>
                                <p class="text-xs mt-1">Tambahkan kelas baru untuk mulai absen</p>
                            </div>`;
                            lucide.createIcons();
                        }
                        return;
                    }

                    let html = '';
                    data.forEach(kelas => {
                        const absensi = kelas.absensi && kelas.absensi[0] ? kelas.absensi[0] : null;
                        const sudahMasuk = absensi && absensi.jam_masuk;
                        const sudahPulang = absensi && absensi.jam_keluar;
                        const status = absensi ? absensi.status : '';
                        const kelasSelesai = kelas.tanggal_selesai && new Date(kelas.tanggal_selesai + 'T23:59:59') < new Date();

                        let statusBadge = '';
                        let buttonHtml = '';

                        const statusConfig = {
                            'HADIR': { bg: 'bg-green-100', text: 'text-green-700', label: 'HADIR' },
                            'TERLAMBAT': { bg: 'bg-red-100', text: 'text-red-700', label: 'TERLAMBAT' },
                            'PULANG LEBIH AWAL': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'PULANG LEBIH AWAL' },
                            'TIDAK ABSEN PULANG': { bg: 'bg-red-100', text: 'text-red-700', label: 'TIDAK ABSEN PULANG' }
                        };

                        if (kelasSelesai) {
                            statusBadge = '<span class="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">SELESAI</span>';
                            buttonHtml = '<div class="flex-1 py-2.5 bg-green-100 text-green-700 rounded-xl text-sm font-bold text-center">Kelas Sudah Selesai</div>';
                        } else if (sudahMasuk && !sudahPulang) {
                            const cfg = statusConfig[status] || statusConfig['HADIR'];
                            statusBadge = `<span class="px-2 py-1 ${cfg.bg} ${cfg.text} text-[10px] font-bold rounded-full">${cfg.label}</span>`;
                            buttonHtml = `<button onclick="absenSenseiPulang(${kelas.id})" class="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-bold active:scale-95 transition">Absen Pulang</button>`;
                        } else if (sudahMasuk && sudahPulang) {
                            const cfg = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-600', label: status };
                            statusBadge = `<span class="px-2 py-1 ${cfg.bg} ${cfg.text} text-[10px] font-bold rounded-full">${cfg.label}</span>`;
                            buttonHtml = `<div class="flex-1 py-2.5 bg-gray-100 text-gray-500 rounded-xl text-sm font-semibold text-center">${absensi.jam_masuk} - ${absensi.jam_keluar}</div>`;
                        } else {
                            buttonHtml = `<button onclick="absenSenseiMasuk(${kelas.id})" class="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-bold active:scale-95 transition">Absen Masuk</button>`;
                        }

                        const levelLabels = {
                            'pemula': 'Pemula',
                            'menengah': 'Menengah',
                            'mahir': 'Mahir',
                            'lanjutan': 'Lanjutan'
                        };

                        const tglMulai = new Date(kelas.tanggal_mulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                        const tglSelesai = new Date(kelas.tanggal_selesai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });

                        html += `
                            <div class="bg-white rounded-2xl p-4 shadow-sm border border-violet-100" data-kelas-id="${kelas.id}">
                                <div class="flex items-start justify-between mb-3">
                                    <div class="flex items-center gap-3">
                                        <div class="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                                            <i data-lucide="graduation-cap" class="w-6 h-6 text-white"></i>
                                        </div>
                                        <div>
                                            <h3 class="font-bold text-gray-900">${kelas.nama_kelas}</h3>
                                            <p class="text-xs text-gray-500">${levelLabels[kelas.level] || kelas.level} - ${tglMulai} - ${tglSelesai}</p>
                                        </div>
                                    </div>
                                    ${statusBadge}
                                </div>
                                <div class="flex gap-2">
                                    ${buttonHtml}
                                </div>
                            </div>
                        `;
                    });

                    if (container) {
                        container.innerHTML = html;
                        lucide.createIcons();
                    }
                });
        }

        function absenSenseiMasuk(kelasId) {
            openModalAbsenSensei(kelasId, 'masuk');
        }

        function absenSenseiPulang(kelasId) {
            openModalAbsenSensei(kelasId, 'pulang');
        }

        // Load kelas aktif saat halaman load
        document.addEventListener('DOMContentLoaded', function() {
            loadKelasAktif();
        });

        function loadRiwayatRealtime() {
            $.ajax({
                url: "{{ route('absensi.riwayat.json') }}",
                method: "GET",
                cache: false, // penting biar gak ambil cache lama
                success: function(response) {
                    const dataKaryawan = response.karyawan || [];
                    const dataSensei = response.sensei || [];

                    let html = '';

                    if ((!dataKaryawan || dataKaryawan.length === 0) && (!dataSensei || dataSensei.length === 0)) {
                        html = `<div class="text-center text-gray-500 text-sm">
                            Belum ada riwayat absensi
                        </div>`;
                    } else {
                        // Karyawan
                        dataKaryawan.forEach(a => {
                            const date = new Date(a.tanggal);
                            const day = date.toLocaleDateString('id-ID', {
                                weekday: 'short'
                            });
                            const dayNumber = String(date.getDate()).padStart(2, '0');

                            const jamMasuk = a.jam_masuk ? a.jam_masuk : '-';
                            const jamKeluar = a.jam_keluar ? a.jam_keluar : '-';

                            html += `
                            <div class="bg-white rounded-2xl p-4 mb-2 shadow-sm flex items-center gap-4 border-l-4 border-blue-500 animate-fadeIn">
                                <a href="/absensi/riwayat"
                                   class="flex items-center gap-4 p-4 hover:bg-gray-50 transition w-full">

                                    <div class="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center">
                                        <div class="text-center">
                                            <div class="text-xs text-blue-600 font-medium">${day}</div>
                                            <div class="text-xl font-bold text-blue-700">${dayNumber}</div>
                                        </div>
                                    </div>

                                    <div class="flex-1">
                                        <div class="flex items-center gap-2 mb-1">
                                            <span class="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">KARYAWAN</span>
                                            ${a.shift ? `<span class="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">${a.shift.nama_shift}</span>` : ''}
                                        </div>
                                        <h3 class="font-semibold text-gray-900 mb-1">${a.status || '-'}</h3>
                                        <div class="flex gap-4 text-xs text-gray-500">
                                            <span>In: ${jamMasuk}</span>
                                            <span>Out: ${jamKeluar}</span>
                                        </div>
                                    </div>

                                    <i class="w-5 h-5 text-gray-400" data-lucide="chevron-right"></i>
                                </a>
                            </div>`;
                        });

                        // Sensei
                        dataSensei.forEach(a => {
                            const date = new Date(a.tanggal);
                            const day = date.toLocaleDateString('id-ID', {
                                weekday: 'short'
                            });
                            const dayNumber = String(date.getDate()).padStart(2, '0');

                            const jamMasuk = a.jam_masuk ? a.jam_masuk : '-';
                            const jamKeluar = a.jam_keluar ? a.jam_keluar : '-';
                            const kelasNama = a.kelas_sensei ? a.kelas_sensei.nama_kelas : '-';

                            html += `
                            <div class="bg-white rounded-2xl p-4 mb-2 shadow-sm flex items-center gap-4 border-l-4 border-violet-500 animate-fadeIn">
                                <a href="/absensi/riwayat"
                                   class="flex items-center gap-4 p-4 hover:bg-gray-50 transition w-full">

                                    <div class="w-16 h-16 bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl flex items-center justify-center">
                                        <div class="text-center">
                                            <div class="text-xs text-violet-600 font-medium">${day}</div>
                                            <div class="text-xl font-bold text-violet-700">${dayNumber}</div>
                                        </div>
                                    </div>

                                    <div class="flex-1">
                                        <div class="flex items-center gap-2 mb-1">
                                            <span class="text-[10px] font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded">SENSEI</span>
                                            <span class="text-xs text-gray-500">${kelasNama}</span>
                                        </div>
                                        <h3 class="font-semibold text-gray-900 mb-1">${a.status || '-'}</h3>
                                        <div class="flex gap-4 text-xs text-gray-500">
                                            <span>In: ${jamMasuk}</span>
                                            <span>Out: ${jamKeluar}</span>
                                        </div>
                                    </div>

                                    <i class="w-5 h-5 text-gray-400" data-lucide="chevron-right"></i>
                                </a>
                            </div>`;
                        });
                    }

                    $('#riwayatContainer').fadeOut(100, function() {
                        $(this).html(html).fadeIn(200);
                        if (window.lucide) lucide.createIcons();
                    });
                }
            });
        }
    </script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Ambil data dari Laravel Controller
            const showNotif = "{{ $showNotification }}";
            const message = "{{ $notifMessage }}";

            console.log("Status Notifikasi:", showNotif); // Cek di F12 (Console)

            if (showNotif == "1") {
                // 1. Minta Izin ke User
                if (Notification.permission === "default") {
                    Notification.requestPermission().then(permission => {
                        if (permission === "granted") {
                            playNotif(message);
                        }
                    });
                }
                // 2. Jika sudah diizinkan, langsung jalankan
                else if (Notification.permission === "granted") {
                    playNotif(message);
                }
                // 3. Jika diblokir
                else {
                    console.warn("Notifikasi diblokir oleh user.");
                }
            }
        });

        function playNotif(msg) {
            const options = {
                body: msg,
                icon: "https://cdn-icons-png.flaticon.com/512/1827/1827347.png", // Icon sementara
                vibrate: [200, 100, 200],
                requireInteraction: true
            };

            const n = new Notification("PENGINGAT ABSENSI", options);

            n.onclick = function() {
                window.focus();
                this.close();
            };
                }
            }
        });
    </script>

    <script>
        window.absenAgendaPulang = function(id) {
            fetch('/absensi/agenda/absen-pulang', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': '{{ csrf_token() }}',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ id: id })
            })
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    Swal.fire('Berhasil', 'Absen pulang agenda berhasil', 'success').then(() => {
                        location.reload();
                    });
                }
            })
            .catch(err => {
                console.error(err);
                Swal.fire('Error', 'Gagal absen pulang', 'error');
            });
        };
    </script>

    <script>
        function toggleModalJadwal(show) {
            const modal = document.getElementById('modalJadwal');
            const content = document.getElementById('modalContent');
            if (show) {
                modal.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
                setTimeout(() => content.classList.remove('translate-y-full'), 10);
            } else {
                content.classList.add('translate-y-full');
                setTimeout(() => {
                    modal.classList.add('hidden');
                    document.body.style.overflow = 'auto';
                }, 300);
            }
        }
    </script>

    <script>
        // Agenda functions - globally accessible
        function openModalAgenda() {
            const modal = document.getElementById('modalAgenda');
            if (modal) {
                modal.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
                startAgendaCamera();
            }
        }

        function closeModalAgenda() {
            const modal = document.getElementById('modalAgenda');
            if (modal) {
                modal.classList.add('hidden');
                document.body.style.overflow = 'auto';
                stopAgendaCamera();
            }
        }

        function startAgendaCamera() {
            const video = document.getElementById('videoAgenda');
            if (video && !video.srcObject) {
                navigator.mediaDevices.getUserMedia({ video: true })
                    .then(s => {
                        window.streamAgenda = s;
                        video.srcObject = s;
                    })
                    .catch(err => {
                        console.error('Kamera error:', err);
                        if (typeof Swal !== 'undefined') {
                            Swal.fire('Error', 'Tidak dapat akses kamera', 'error');
                        }
                    });
            }
        }

        function stopAgendaCamera() {
            if (window.streamAgenda) {
                window.streamAgenda.getTracks().forEach(track => track.stop());
                window.streamAgenda = null;
            }
        }

        function captureAgendaPhoto() {
            const video = document.getElementById('videoAgenda');
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            return canvas.toDataURL('image/jpeg', 0.8);
        }

        function handleAmbilFoto() {
            const photoData = captureAgendaPhoto();
            stopAgendaCamera();
            
            const photoPreview = document.getElementById('agendaPhotoPreview');
            const previewImg = document.getElementById('previewAgendaImg');
            const cameraPreview = document.getElementById('agendaCameraPreview');
            const btnSimpan = document.getElementById('btnSimpanAgenda');
            
            if (photoPreview && previewImg) {
                previewImg.src = photoData;
                photoPreview.classList.remove('hidden');
                cameraPreview.classList.add('hidden');
                
                // Hide Ambil Foto button, show Simpan button
                const btnAmbil = document.querySelector('button[onclick="startAgendaCamera()"]');
                if (btnAmbil) btnAmbil.classList.add('hidden');
                if (btnSimpan) btnSimpan.classList.remove('hidden');
                
                // Save to hidden input
                fetch(photoData)
                    .then(res => res.blob())
                    .then(blob => {
                        const file = new File([blob], 'agenda_foto.jpg', { type: 'image/jpeg' });
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(file);
                        const fotoInput = document.getElementById('agendaFotoInput');
                        if (fotoInput) fotoInput.files = dataTransfer.files;
                    });
            }
        }

        function retakeAgendaPhoto() {
            const photoPreview = document.getElementById('agendaPhotoPreview');
            const cameraPreview = document.getElementById('agendaCameraPreview');
            const btnAmbil = document.querySelector('button[onclick="startAgendaCamera()"]');
            const btnSimpan = document.getElementById('btnSimpanAgenda');
            
            if (photoPreview) photoPreview.classList.add('hidden');
            if (cameraPreview) cameraPreview.classList.remove('hidden');
            if (btnAmbil) btnAmbil.classList.remove('hidden');
            if (btnSimpan) btnSimpan.classList.add('hidden');
            
            startAgendaCamera();
        }

        // Override button onclick after page load
        document.addEventListener('DOMContentLoaded', function() {
            const btnAmbil = document.querySelector('button[onclick="startAgendaCamera()"]');
            if (btnAmbil) {
                btnAmbil.onclick = handleAmbilFoto;
            }
            
            // Agenda form submit handler
            const agendaForm = document.getElementById('agendaForm');
            if (agendaForm) {
                agendaForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    const formData = new FormData(this);
                    
                    fetch('/absensi/agenda/store', {
                        method: 'POST',
                        headers: { 
                            'X-CSRF-TOKEN': '{{ csrf_token() }}',
                            'X-Requested-With': 'XMLHttpRequest',
                            'Accept': 'application/json'
                        },
                        body: formData
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            closeModalAgenda();
                            Swal.fire('Berhasil', 'Agenda berhasil disimpan', 'success').then(() => {
                                location.reload();
                            });
                        } else {
                            Swal.fire('Peringatan', data.message, 'warning');
                        }
                    })
                    .catch(err => {
                        console.error('Error:', err);
                        Swal.fire('Error', 'Gagal menyimpan agenda', 'error');
                    });
                });
            }
        });
    </script>

    @include('absensi.modal_absen_sensei')

    <script>
        function updateLiveClock() {
            const now = new Date();
            const h = String(now.getHours()).padStart(2, '0');
            const m = String(now.getMinutes()).padStart(2, '0');
            const s = String(now.getSeconds()).padStart(2, '0');
            const el = document.getElementById('liveClock');
            if (el) el.textContent = h + ':' + m + ':' + s;
        }
        setInterval(updateLiveClock, 1000);
        updateLiveClock();
    </script>

</body>

</html>
