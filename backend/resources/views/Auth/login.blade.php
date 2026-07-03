<!doctype html>
<html lang="id">

<head>
    <meta charset="utf-8">
    <title>Login | Sistem Absensi Mendunia.id</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" href="{{ asset('assets/images/logo/logo-sm.png') }}" type="image/png">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>

    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Plus Jakarta Sans', 'sans-serif'],
                    },
                    colors: {
                        // Warna biru yang disesuaikan dengan standar logo profesional
                        brand: '#2563eb',
                    }
                }
            }
        }
    </script>

    <style>
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .bg-brand-gradient {
            background: linear-gradient(135deg, #0D1F3C 0%, #1a2d4a 100%);
        }

        .floating-element {
            animation: floating 6s ease-in-out infinite;
        }

        @keyframes floating {

            0%,
            100% {
                transform: translateY(0px) rotate(0deg);
            }

            50% {
                transform: translateY(-20px) rotate(2deg);
            }
        }

        .logo-glow {
            filter: drop-shadow(0 0 15px rgba(37, 99, 235, 0.2));
        }
    </style>
</head>

<body class="bg-white min-h-screen flex">

    <div class="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-20 xl:px-32 py-12">
        {{-- 
        <div class="mb-12">
            <img src="{{ asset('assets/images/logo/logo.png') }}" class="w-40 logo-glow">
        </div> --}}

        <div class="max-w-md w-full mx-auto lg:mx-0">
            <h1 class="text-3xl font-extrabold text-slate-900 mb-2">Login ke Akun Anda</h1>
            <p class="text-slate-500 mb-8 font-medium">Selamat datang kembali di <span
                    class="text-brand font-bold">Mendunia.id</span></p>

            @if (session('status'))
                <div
                    class="mb-6 p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-semibold flex items-center gap-2">
                    <i data-lucide="check-circle" class="w-4 h-4"></i> {{ session('status') }}
                </div>
            @endif

            <form id="login" action="/login/process" method="POST" class="space-y-6">
                @csrf
                <div class="space-y-2">
                    <label class="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Email atau Nama</label>
                    <div class="relative">
                        <i data-lucide="mail"
                            class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"></i>
                        <input type="text" name="email" required
                            class="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-brand outline-none transition-all font-medium text-slate-800 placeholder-slate-400"
                            placeholder="nama@email.com / Nama Siswa">
                    </div>
                </div>

                <div class="space-y-2">
                    <div class="flex justify-between items-center">
                        <label class="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Kata
                            Sandi</label>
                        <a href="/forgot-password" class="text-xs font-bold text-brand hover:underline">Lupa
                            Password?</a>
                    </div>
                    <div class="relative">
                        <i data-lucide="lock"
                            class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"></i>
                        <input type="password" name="password" id="password" required
                            class="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-brand outline-none transition-all font-medium text-slate-800 placeholder-slate-400"
                            placeholder="Masukkan kata sandi">
                        <button type="button" onclick="togglePassword()"
                            class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <i data-lucide="eye" id="eyeIcon" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>

                <div class="flex items-center">
                    <label class="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox"
                            class="w-5 h-5 rounded-lg border-slate-300 text-brand focus:ring-brand transition-all">
                        <span class="text-sm font-semibold text-slate-600 group-hover:text-slate-900">Ingat saya di
                            perangkat ini</span>
                    </label>
                </div>

                <div class="space-y-2 mb-6">
                    <label class="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Verifikasi
                        Keamanan</label>
                    <div class="flex gap-3">
                        <div
                            class="flex-none w-32 h-14 bg-slate-100 rounded-2xl border-2 border-slate-200 border-dashed flex items-center justify-center select-none relative overflow-hidden group">
                            <span id="captchaCode"
                                class="text-xl font-black tracking-[0.3em] text-slate-700 italic flex gap-1">
                            </span>
                            <button type="button" onclick="generateCaptcha()"
                                class="absolute inset-0 bg-brand/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                <i data-lucide="refresh-cw" class="w-3 h-3"></i> Refresh
                            </button>
                        </div>
                        <div class="relative flex-1">
                            <i data-lucide="shield-check"
                                class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"></i>
                            <input type="text" id="captchaInput" required
                                class="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-brand outline-none transition-all font-bold text-slate-800 placeholder-slate-400"
                                placeholder="Isi angka">
                        </div>
                    </div>
                </div>

                <button type="submit" id="btnLogin"
                    class="w-full py-4 bg-[#0D1F3C] text-white rounded-2xl font-bold shadow-xl shadow-blue-900/20 hover:bg-[#1a2d4a] hover:shadow-blue-900/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-sm">
                    <span>Masuk Dashboard</span>
                    <i data-lucide="arrow-right" class="w-4 h-4"></i>
                </button>
            </form>

            <div
                class="mt-10 flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <i data-lucide="shield-check" class="w-6 h-6 text-brand"></i>
                </div>
                <div>
                    <p class="text-xs font-bold text-slate-800">Sistem Keamanan Aktif</p>
                    <p class="text-[10px] text-slate-500 font-medium">Geolokasi & Presensi Terenkripsi</p>
                </div>
            </div>
        </div>
    </div>

    <div class="hidden lg:flex lg:w-1/2 bg-brand-gradient relative items-center justify-center overflow-hidden">
        <div class="absolute inset-0 opacity-10"
            style="background-image: radial-gradient(#fff 1px, transparent 1px); background-size: 30px 30px;"></div>

        <div class="relative z-10 text-center px-12">
            <div class="mb-12 relative floating-element">
                <div
                    class="bg-white/10 backdrop-blur-xl p-6 rounded-[3rem] border border-white/20 shadow-2xl inline-block">
                    <div class="bg-white rounded-[2rem] p-4 shadow-inner relative overflow-hidden w-[320px]">
                        <div class="flex items-center justify-between mb-4 px-2">
                            <div class="flex gap-1.5">
                                <div class="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                                <div class="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                                <div class="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                            </div>
                            <div class="w-16 h-2 bg-slate-100 rounded-full"></div>
                        </div>

                        <div class="space-y-3">
                            <div class="p-3 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3">
                                <div class="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-md">
                                    <i data-lucide="map-pin" class="w-5 h-5 text-white"></i>
                                </div>
                                <div class="text-left">
                                    <p class="text-[10px] font-bold text-slate-800 uppercase">Kelola Presensi</p>
                                    <p class="text-[9px] text-slate-500 font-medium">Geolokasi Terverifikasi</p>
                                </div>
                                <div
                                    class="ml-auto w-8 h-4 bg-green-100 rounded-full flex items-center justify-center">
                                    <div class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                </div>
                            </div>

                            <div class="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                                <div class="flex items-center gap-2 mb-1">
                                    <i data-lucide="layout-list" class="w-4 h-4 text-brand"></i>
                                    <p class="text-[10px] font-bold text-slate-800 uppercase tracking-tight">Task
                                        Management</p>
                                </div>
                                <div class="flex items-center gap-3">
                                    <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                        <div class="bg-brand h-full w-[75%] rounded-full"></div>
                                    </div>
                                    <span class="text-[9px] font-bold text-slate-600">75%</span>
                                </div>
                                <div class="flex -space-x-2">
                                    <div class="w-5 h-5 rounded-full border-2 border-white bg-slate-300"></div>
                                    <div class="w-5 h-5 rounded-full border-2 border-white bg-slate-400"></div>
                                    <div
                                        class="w-5 h-5 rounded-full border-2 border-white bg-brand flex items-center justify-center">
                                        <span class="text-[8px] text-white font-bold">+3</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <h2 class="text-4xl font-extrabold text-white mb-6 leading-tight">Kelola SDM Mendunia <br> dalam Satu
                Genggaman</h2>
            <p class="text-blue-100 text-lg font-medium max-w-sm mx-auto opacity-90 leading-relaxed">
                Dari <b>Kelola Presensi</b> berbasis GPS hingga <b>Task Management</b> yang terorganisir, semua ada di
                System Dashboard
                Mendunia.id.
            </p>

            <div class="flex justify-center gap-3 mt-12">
                <div class="h-1.5 w-12 bg-white rounded-full"></div>
                <div class="h-1.5 w-2 bg-white/40 rounded-full"></div>
                <div class="h-1.5 w-2 bg-white/40 rounded-full"></div>
            </div>
        </div>

        <div class="absolute bottom-8 text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
            Sistem Absensi Mendunia.id v2.0
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script>
        lucide.createIcons();

        function togglePassword() {
            const passwordInput = document.getElementById('password');
            const eyeIcon = document.getElementById('eyeIcon');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeIcon.setAttribute('data-lucide', 'eye-off');
            } else {
                passwordInput.type = 'password';
                eyeIcon.setAttribute('data-lucide', 'eye');
            }
            lucide.createIcons();
        }

        // Gunakan script AJAX Anda di sini seperti sebelumnya
        $('#login').on('submit', function(e) {
            // ... (Kode AJAX Anda)
        });
    </script>
    <!-- jQuery -->
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>

    <!-- SweetAlert -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

    <script>
        // 1. Inisialisasi Variabel Global Captcha
        let currentCaptcha = "";

        // Fungsi untuk Generate Captcha Angka Acak
        function generateCaptcha() {
            const chars = "0123456789";
            let result = "";
            for (let i = 0; i < 4; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            currentCaptcha = result;
            const captchaElement = document.getElementById('captchaCode');
            if (captchaElement) {
                captchaElement.innerText = result;
            }
            lucide.createIcons();
        }

        // 2. Jalankan saat dokumen siap
        $(document).ready(function() {
            lucide.createIcons();
            generateCaptcha(); // Buat captcha pertama kali

            // Setup CSRF token untuk Laravel AJAX
            $.ajaxSetup({
                headers: {
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                }
            });
        });

        // 3. Logika Toggle Show/Hide Password
        function togglePassword() {
            const passwordInput = document.getElementById('password');
            const eyeIcon = document.getElementById('eyeIcon');

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeIcon.setAttribute('data-lucide', 'eye-off');
            } else {
                passwordInput.type = 'password';
                eyeIcon.setAttribute('data-lucide', 'eye');
            }
            lucide.createIcons();
        }

        // 4. AJAX LOGIN dengan Validasi Captcha
        $('#login').on('submit', function(e) {
            e.preventDefault();

            let form = $(this);
            let btn = $('#btnLogin');
            let originalText = btn.html();

            // Ambil input captcha dari user
            let userInputCaptcha = $('#captchaInput').val();

            // Cek Captcha secara Client-side sebelum kirim AJAX
            if (userInputCaptcha !== currentCaptcha) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Verifikasi Gagal',
                    text: 'Kode captcha yang Anda masukkan salah. Silakan coba lagi.',
                    confirmButtonColor: '#2563eb',
                    customClass: {
                        popup: 'rounded-2xl',
                        title: 'text-xl font-bold'
                    }
                });
                generateCaptcha(); // Reset captcha jika salah
                $('#captchaInput').val(''); // Kosongkan input
                return false;
            }

            $.ajax({
                url: form.attr('action'),
                type: 'POST',
                data: form.serialize(),
                beforeSend() {
                    btn.prop('disabled', true).html(`
                        <svg class="animate-spin h-5 w-5 mx-auto text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    `);
                },
                success(res) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Login Berhasil',
                        text: res.message ?? 'Akses diterima. Selamat datang kembali!',
                        timer: 1500,
                        showConfirmButton: false,
                        customClass: {
                            popup: 'rounded-2xl',
                            title: 'text-xl font-bold'
                        }
                    });

                    setTimeout(() => {
                        window.location.href = res.redirect ?? '/absensi';
                    }, 1500);
                },
                error(xhr) {
                    let msg = 'Email/Nama atau password salah';
                    if (xhr.responseJSON?.message) msg = xhr.responseJSON.message;

                    Swal.fire({
                        icon: 'error',
                        title: 'Login Gagal',
                        text: msg,
                        confirmButtonColor: '#2563eb',
                        customClass: {
                            popup: 'rounded-2xl',
                            title: 'text-xl font-bold'
                        }
                    });

                    btn.prop('disabled', false).html(originalText);
                    generateCaptcha(); // Ganti captcha jika login gagal (keamanan ekstra)
                    $('#captchaInput').val('');
                },
                complete() {
                    lucide.createIcons();
                }
            });
        });

        // 5. Animasi Input Focus (Visual Enhancement)
        const inputs = document.querySelectorAll('input[name="email"], input[type="password"], #captchaInput');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.classList.add('scale-[1.01]');
                this.parentElement.style.transition = "all 0.2s ease";
            });

            input.addEventListener('blur', function() {
                this.parentElement.classList.remove('scale-[1.01]');
            });
        });

        // 6. Prevent Form Resubmission
        if (window.history.replaceState) {
            window.history.replaceState(null, null, window.location.href);
        }
    </script>
</body>

</html>
