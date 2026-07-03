<!doctype html>
<html lang="id">

<head>
    <meta charset="utf-8">
    <title>Ubah Password | Sistem Absensi Karyawan</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" href="{{ asset('assets/images/logo/logo-sm.png') }}" type="image/png" style="width: 40px">
    
    <!-- CSRF -->
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!-- Tailwind CDN -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Google Font -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">

    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>

    <style>
        * {
            font-family: 'Inter', sans-serif;
        }

        .gradient-bg {
            background: linear-gradient(135deg, #d8d6d6 0%, #ffffff 100%);
        }

        .glass-effect {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
        }

        .input-glow:focus {
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }

        .btn-gradient {
            background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
            position: relative;
            overflow: hidden;
        }

        .btn-gradient::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
        }

        .btn-gradient:hover::before {
            left: 100%;
        }

        .floating {
            animation: floating 3s ease-in-out infinite;
        }

        @keyframes floating {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }

        .fade-in {
            animation: fadeIn 0.6s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .logo-glow {
            filter: drop-shadow(0 4px 20px rgba(37, 99, 235, 0.3));
        }

        .alert-success {
            animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>

<body class="gradient-bg min-h-screen flex items-center justify-center p-4">
    <!-- Background Decorative Elements -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
    </div>

    <!-- Main Container -->
    <div class="w-full max-w-md relative z-10 fade-in">
        <!-- Change Password Card -->
        <div class="glass-effect rounded-3xl shadow-2xl p-8 relative overflow-hidden">
           
            <!-- Logo & Header -->
            <div class="text-center mb-8 mt-2">
                <div class="inline-block mb-6 floating">
                    <img src="{{ asset('assets/images/logo/logo.png') }}" class="mx-auto w-32 logo-glow drop-shadow-xl">
                </div>
                <h1 class="text-2xl font-bold text-gray-800 mb-2">Ubah Password</h1>
                <p class="text-gray-500 text-sm font-medium">Masukkan email dan password baru Anda</p>
            </div>

            <!-- Success Message -->
            @if(session('status'))
                <div class="alert-success bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-700 px-5 py-4 rounded-xl mb-6 flex items-start gap-3">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                            <i data-lucide="check" class="w-5 h-5 text-white"></i>
                        </div>
                    </div>
                    <div class="flex-1">
                        <p class="font-semibold text-sm">{{ session('status') }}</p>
                    </div>
                </div>
            @endif

            <!-- Change Password Form -->
            <form action="{{ route('password.update') }}" method="POST" class="space-y-5">
                @csrf

                <!-- Email Input -->
                <div class="space-y-2">
                    <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wide ml-1">
                        Alamat Email
                    </label>
                    <div class="relative group">
                        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <i data-lucide="mail" class="w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors"></i>
                        </div>
                        <input 
                            type="email" 
                            name="email" 
                            value="{{ old('email') }}" 
                            required
                            class="w-full h-14 pl-12 pr-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none transition-all text-sm font-medium text-gray-800 placeholder-gray-400 input-glow @error('email') border-red-300 focus:border-red-500 @enderror"
                            placeholder="nama@perusahaan.com"
                        >
                    </div>
                    @error('email')
                        <div class="flex items-center gap-2 mt-2 text-red-600">
                            <i data-lucide="alert-circle" class="w-4 h-4"></i>
                            <p class="text-xs font-medium">{{ $message }}</p>
                        </div>
                    @enderror
                </div>

                <!-- New Password Input -->
                <div class="space-y-2">
                    <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wide ml-1">
                        Password Baru
                    </label>
                    <div class="relative group">
                        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <i data-lucide="lock" class="w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors"></i>
                        </div>
                        <input 
                            type="password" 
                            name="password" 
                            id="password"
                            required
                            class="w-full h-14 pl-12 pr-12 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none transition-all text-sm font-medium text-gray-800 placeholder-gray-400 input-glow @error('password') border-red-300 focus:border-red-500 @enderror"
                            placeholder="••••••••••"
                        >
                        <button 
                            type="button" 
                            onclick="togglePassword('password', 'eyeIcon1')"
                            class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <i data-lucide="eye" id="eyeIcon1" class="w-5 h-5"></i>
                        </button>
                    </div>
                    @error('password')
                        <div class="flex items-center gap-2 mt-2 text-red-600">
                            <i data-lucide="alert-circle" class="w-4 h-4"></i>
                            <p class="text-xs font-medium">{{ $message }}</p>
                        </div>
                    @enderror
                </div>

                <!-- Confirm Password Input -->
                <div class="space-y-2">
                    <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wide ml-1">
                        Konfirmasi Password
                    </label>
                    <div class="relative group">
                        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <i data-lucide="shield-check" class="w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors"></i>
                        </div>
                        <input 
                            type="password" 
                            name="password_confirmation" 
                            id="password_confirmation"
                            required
                            class="w-full h-14 pl-12 pr-12 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none transition-all text-sm font-medium text-gray-800 placeholder-gray-400 input-glow"
                            placeholder="••••••••••"
                        >
                        <button 
                            type="button" 
                            onclick="togglePassword('password_confirmation', 'eyeIcon2')"
                            class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <i data-lucide="eye" id="eyeIcon2" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>

                <!-- Password Requirements Info -->
                <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div class="flex items-start gap-3">
                        <div class="flex-shrink-0">
                            <i data-lucide="info" class="w-5 h-5 text-blue-600"></i>
                        </div>
                        <div class="flex-1">
                            <p class="text-xs font-semibold text-blue-900 mb-2">Password harus mengandung:</p>
                            <ul class="text-xs text-blue-700 space-y-1">
                                <li class="flex items-center gap-2">
                                    <i data-lucide="check" class="w-3 h-3"></i>
                                    <span>Minimal 8 karakter</span>
                                </li>
                                <li class="flex items-center gap-2">
                                    <i data-lucide="check" class="w-3 h-3"></i>
                                    <span>Kombinasi huruf dan angka</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Submit Button -->
                <div class="pt-2">
                    <button 
                        type="submit"
                        class="w-full h-14 rounded-xl font-bold text-white btn-gradient hover:shadow-2xl active:scale-[0.98] transition-all text-sm uppercase tracking-wider relative overflow-hidden"
                    >
                        <span class="relative z-10">Ubah Password Sekarang</span>
                    </button>
                </div>
            </form>

            <!-- Back to Login -->
            <div class="mt-6 pt-6 border-t border-gray-100 text-center">
                <p class="text-xs text-gray-500 font-medium mb-3">Sudah ingat password lama?</p>
                <a href="{{ route('login') }}" 
                   class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors group">
                    <i data-lucide="arrow-left" class="w-4 h-4 group-hover:-translate-x-1 transition-transform"></i>
                    <span>Kembali ke Halaman Login</span>
                </a>
            </div>
        </div>

        <!-- Footer -->
        <div class="mt-8 text-center">
            <p class="text-black text-xs font-medium">
                &copy; 2026 Mendunia Absensi System. All rights reserved.
            </p>
            <div class="flex items-center justify-center gap-4 mt-3">
                <a href="#" class="text-black hover:text-white text-xs font-medium transition-colors">Kebijakan Privasi</a>
                <span class="text-black">•</span>
                <a href="#" class="text-black hover:text-white text-xs font-medium transition-colors">Syarat & Ketentuan</a>
            </div>
        </div>
    </div>

    <script>
        // Initialize Lucide icons
        lucide.createIcons();

        // Toggle password visibility
        function togglePassword(inputId, iconId) {
            const passwordInput = document.getElementById(inputId);
            const eyeIcon = document.getElementById(iconId);
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeIcon.setAttribute('data-lucide', 'eye-off');
            } else {
                passwordInput.type = 'password';
                eyeIcon.setAttribute('data-lucide', 'eye');
            }
            
            lucide.createIcons();
        }

        // Add subtle animations on input focus
        const inputs = document.querySelectorAll('input[type="email"], input[type="password"]');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.classList.add('scale-[1.02]');
            });
            
            input.addEventListener('blur', function() {
                this.parentElement.classList.remove('scale-[1.02]');
            });
        });

        // Password strength indicator (optional enhancement)
        const passwordInput = document.getElementById('password');
        const confirmInput = document.getElementById('password_confirmation');

        // Real-time password match validation
        if (confirmInput) {
            confirmInput.addEventListener('input', function() {
                if (this.value && passwordInput.value !== this.value) {
                    this.classList.add('border-red-300');
                    this.classList.remove('border-gray-200');
                } else if (this.value && passwordInput.value === this.value) {
                    this.classList.add('border-green-300');
                    this.classList.remove('border-red-300', 'border-gray-200');
                } else {
                    this.classList.remove('border-red-300', 'border-green-300');
                    this.classList.add('border-gray-200');
                }
            });
        }
    </script>

</body>

</html>