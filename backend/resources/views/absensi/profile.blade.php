<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@if(auth()->user()->isSiswa()) Profil Siswa @else Profil Karyawan @endif</title>
    {{-- <link rel="icon" href="{{ asset('assets/compiled/png/LOGO/logo4.png') }}" type="image/x-icon"> --}}
    <link rel="icon" href="{{ asset('assets/images/logo/logo-sm.png') }}" type="image/png" style="width: 40px">
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Lucide Icons CDN -->
    <script src="https://unpkg.com/lucide@latest"></script>

    <style>
        .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom);
        }

        /* === PROFILE THEME: 0D1F3C === */
        /* Hanya kartu header gradient (Foto Profil + stats) */
        .from-\[\#00c0ff\] {
            background: linear-gradient(135deg, #0D1F3C, #1a2d4a) !important;
        }
        .to-blue-700 {
            background: linear-gradient(135deg, #0D1F3C, #1a2d4a) !important;
        }
        .bg-gradient-to-br.from-\[\#00c0ff\].to-blue-700 {
            background: linear-gradient(135deg, #0D1F3C, #1a2d4a) !important;
        }

        /* Tombol Edit Profil & Keamanan */
        .bg-gradient-to-r.from-\[\#00c0ff\].to-blue-700 {
            background: linear-gradient(135deg, #0D1F3C, #1a2d4a) !important;
        }
        .space-y-3 a.bg-gradient-to-r.from-\[\#00c0ff\].to-blue-700 {
            background: linear-gradient(135deg, #0D1F3C, #1a2d4a) !important;
        }
        .bg-gradient-to-r .text-white { color: #fff !important; }
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
    <div class="bg-white px-5 pt-4 pb-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
            <button onclick="goBack()" class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <i data-lucide="arrow-left" class="w-5 h-5 text-gray-700"></i>
            </button>
            <h1 class="text-lg font-bold text-gray-900">Profil Saya</h1>
            <button class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <i data-lucide="settings" class="w-5 h-5 text-gray-700"></i>
            </button>
        </div>
    </div>


    <div class="px-5 py-6">
        <div class="bg-gradient-to-br from-[#00c0ff] to-blue-700 rounded-3xl p-6 text-white shadow-lg mb-6">
            <div class="flex items-center gap-4 mb-4">
                <div class="w-20 h-20 rounded-full overflow-hidden border-4 border-white/30 shadow-inner">
                    <img id="previewFoto"
                        src="{{ auth()->user()->foto_profil && file_exists(public_path('uploads/foto_profil/' . auth()->user()->foto_profil))
                            ? asset('uploads/foto_profil/' . auth()->user()->foto_profil)
                            : 'https://ui-avatars.com/api/?name=' . urlencode(auth()->user()->name) . '&background=random' }}"
                        class="w-full h-full object-cover" alt="Foto Profil">
                </div>

                <div class="flex-1">
                    <h2 class="text-xl font-bold mb-1">{{ $user->name }}</h2>
                    @if(auth()->user()->isSiswa())
                    <p class="text-blue-100 text-sm">
                        {{ auth()->user()->siswa->kelas ?? 'Kelas' }}
                    </p>
                    <div class="flex items-center gap-2 mt-2">
                        <div
                            class="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-[10px] font-bold uppercase tracking-wider">
                            Siswa
                        </div>
                    </div>
                    @else
                    <p class="text-blue-100 text-sm">
                        {{ $user->divisi->nama_divisi ?? 'Staff' }}
                    </p>
                    <div class="flex items-center gap-2 mt-2">
                        <div
                            class="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-[10px] font-bold uppercase tracking-wider">
                            {{ $user->status_kerja ?? 'Karyawan Tetap' }}
                        </div>
                    </div>
                    @endif
                </div>
            </div>

            <div class="grid grid-cols-3 gap-3 pt-4 border-t border-white/20">
                <div class="text-center">
                    <div class="text-2xl font-bold">{{ $stats['hadir'] ?? 0 }}</div>
                    <div class="text-[10px] text-blue-100 uppercase font-medium">Hadir</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold">{{ $stats['izin'] ?? 0 }}</div>
                    <div class="text-[10px] text-blue-100 uppercase font-medium">Izin</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-orange-300">{{ $stats['terlambat'] ?? 0 }}</div>
                    <div class="text-[10px] text-blue-100 uppercase font-medium">Telat</div>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm p-5 mb-6 border border-gray-50">
            <h3 class="text-sm font-bold text-gray-900 mb-4">Informasi Kontak</h3>
            <div class="space-y-4">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <i data-lucide="mail" class="w-4 h-4"></i>
                    </div>
                    <div class="flex-1">
                        <p class="text-[10px] text-gray-400">Email</p>
                        <p class="text-sm font-medium text-gray-800">{{ $user->email }}</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                        <i data-lucide="phone" class="w-4 h-4"></i>
                    </div>
                    <div class="flex-1">
                        <p class="text-[10px] text-gray-400">No. HP</p>
                        <p class="text-sm font-medium text-gray-800">{{ $user->no_hp ?? '-' }}</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                        <i data-lucide="map-pin" class="w-4 h-4"></i>
                    </div>
                    <div class="flex-1">
                        <p class="text-[10px] text-gray-400">Alamat</p>
                        <p class="text-sm font-medium text-gray-800 leading-tight">
                            {{ $user->alamat ?? 'Alamat belum diisi' }}</p>
                    </div>
                </div>
            </div>
        </div>

        @if(auth()->user()->isSiswa())
        <div class="bg-white rounded-2xl shadow-sm p-5 mb-6 border border-gray-50">
            <h3 class="text-sm font-bold text-gray-900 mb-4">Informasi Siswa</h3>
            <div class="space-y-4">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                        <i data-lucide="book-open" class="w-4 h-4"></i>
                    </div>
                    <div class="flex-1">
                        <p class="text-[10px] text-gray-400">Kelas</p>
                        <p class="text-sm font-medium text-gray-800">{{ auth()->user()->siswa->kelas ?? '-' }}</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                        <i data-lucide="calendar" class="w-4 h-4"></i>
                    </div>
                    <div class="flex-1">
                        <p class="text-[10px] text-gray-400">Tanggal Bergabung</p>
                        <p class="text-sm font-medium text-gray-800">
                            {{ $user->created_at ? $user->created_at->translatedFormat('d F Y') : '-' }}</p>
                    </div>
                </div>
            </div>
        </div>
        @else
        <div class="bg-white rounded-2xl shadow-sm p-5 mb-6 border border-gray-50">
            <h3 class="text-sm font-bold text-gray-900 mb-4">Informasi Kepegawaian</h3>
            <div class="space-y-4">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                        <i data-lucide="id-card" class="w-4 h-4"></i>
                    </div>
                    <div class="flex-1">
                        <p class="text-[10px] text-gray-400">ID Karyawan</p>
                        <p class="text-sm font-medium text-gray-800">{{ $user->nip ?? 'EMP-' . $user->id }}</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                        <i data-lucide="calendar" class="w-4 h-4"></i>
                    </div>
                    <div class="flex-1">
                        <p class="text-[10px] text-gray-400">Tanggal Bergabung</p>
                        <p class="text-sm font-medium text-gray-800">
                            {{ $user->created_at ? $user->created_at->translatedFormat('d F Y') : '-' }}</p>
                    </div>
                </div>
            </div>
        </div>
        @endif
        <div class="space-y-3 mb-20">
            <a href="{{ route('profile.edit') }}"
                class="w-full bg-gradient-to-r from-[#00c0ff] to-blue-700 text-white py-4 rounded-2xl font-semibold text-base shadow-lg active:scale-95 transition flex items-center justify-center gap-2">
                <div class="flex items-center gap-2">
                    <i data-lucide="user-cog" class="w-5 h-5"></i>
                    <span>Edit Profil & Keamanan</span>
                </div>
            </a>
            <form id="logoutForm" action="{{ route('logout') }}" method="POST" class="hidden">
                @csrf
            </form>

            <button type="button" id="btnLogout" onclick="confirmLogout()"
                class="w-full bg-white text-red-600 py-4 rounded-2xl font-semibold text-base shadow-sm border border-gray-200 active:scale-95 transition flex items-center justify-center gap-2">
                <i data-lucide="log-out" class="w-5 h-5"></i>
                Logout
            </button>
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

            // Navigation functions
            function goBack() {
                window.history.back();
            }

            function goToHome() {
                window.location.href = '/';
            }
        </script>

        <!-- jQuery -->
        <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
        <!-- SweetAlert2 -->
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

        <script>
            // Menjaga session tetap aktif selama tab browser masih terbuka
            setInterval(function() {
                fetch('/keep-alive')
                    .then(response => response.json())
                    .then(data => console.log('Session refreshed'));
            }, 15 * 60 * 1000); // Setiap 15 menit

            $(document).ready(function() {

                $('#btnLogout').on('click', function(e) {
                    e.preventDefault();

                    Swal.fire({
                        title: 'Apakah Anda yakin?',
                        text: 'Anda akan keluar dari sistem',
                        showCancelButton: true,
                        confirmButtonText: 'Ya, Logout',
                        cancelButtonText: 'Batal',
                        confirmButtonColor: '#00c0ff', // MERAH (logout)
                        cancelButtonColor: '#6b7280' // ABU-ABU

                    }).then((result) => {
                        if (result.isConfirmed) {

                            $.ajax({
                                url: $('#logoutForm').attr('action'),
                                type: 'POST',
                                data: $('#logoutForm').serialize(), // <-- CSRF ikut terkirim
                                success: function() {
                                    Swal.fire({
                                        icon: 'success',
                                        title: 'Berhasil',
                                        text: 'Logout berhasil',
                                        timer: 1200,
                                        showConfirmButton: false
                                    });

                                    setTimeout(() => {
                                        window.location.href =
                                            "{{ route('login') }}";
                                    }, 1200);
                                },
                                error: function(xhr) {
                                    Swal.fire(
                                        'Gagal',
                                        xhr.responseJSON?.message || 'Logout gagal',
                                        'error'
                                    );
                                }
                            });

                        }
                    });
                });

            });
        </script>

</body>

</html>
