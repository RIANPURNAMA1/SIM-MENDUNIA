<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Profil & Keamanan</title>
         {{-- <link rel="icon" href="{{ asset('assets/compiled/png/LOGO/logo4.png') }}" type="image/x-icon"> --}}
    <link rel="icon" href="{{ asset('assets/images/logo/logo-sm.png') }}" type="image/png"  style="width: 40px">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
</head>

<body class="bg-gray-50 pb-20">

    <div class="bg-white px-5 pt-10 pb-6 shadow-sm flex items-center gap-4 sticky top-0 z-10">
        <button onclick="window.history.back()"
            class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center active:scale-90 transition">
            <i data-lucide="arrow-left" class="w-5 h-5 text-gray-700"></i>
        </button>
        <h1 class="text-lg font-bold text-gray-900">Edit Profil</h1>
    </div>

    @if ($errors->any() || session('error'))
        <div id="errorAlert" class="fixed top-5 inset-x-5 z-[100] transform transition-all duration-500 translate-y-0">
            <div
                class="bg-red-500 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between border border-red-400/20 backdrop-blur-sm bg-opacity-95">
                <div class="flex items-start gap-3">
                    <div class="bg-white/20 p-2 rounded-xl flex-shrink-0">
                        <i data-lucide="alert-circle" class="w-5 h-5 text-white"></i>
                    </div>
                    <div>
                        <p class="text-[8px] font-bold uppercase tracking-wider opacity-80 text-red-100">Gagal</p>
                        <div class="text-sm font-medium">
                            @if (session('error'))
                                {{ session('error') }}
                            @else
                                <ul class="list-disc list-inside">
                                    @foreach ($errors->all() as $error)
                                        <li>{{ $error }}</li>
                                    @endforeach
                                </ul>
                            @endif
                        </div>
                    </div>
                </div>
                <button onclick="closeErrorAlert()" class="p-1 hover:bg-white/10 rounded-lg transition self-start">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
    @endif
    @if (session('success'))
        <div id="successAlert"
            class="fixed top-5 inset-x-5 z-[100] transform transition-all duration-500 translate-y-0">
            <div
                class="bg-emerald-500 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between border border-emerald-400/20 backdrop-blur-sm bg-opacity-95">
                <div class="flex items-center gap-3">
                    <div class="bg-white/20 p-2 rounded-xl">
                        <i data-lucide="check-circle" class="w-5 h-5 text-white"></i>
                    </div>
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wider opacity-80 text-emerald-100"
                            style="font-size: 8px;">Berhasil</p>
                        <p class="text-sm font-medium">{{ session('success') }}</p>
                    </div>
                </div>
                <button onclick="closeAlert()" class="p-1 hover:bg-white/10 rounded-lg transition">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
    @endif

    <form action="{{ route('profile.update') }}" method="POST" enctype="multipart/form-data">
        @csrf
        @method('PUT')

        <div class="px-5 py-8">
            <div class="flex flex-col items-center mb-10">
                <div class="relative">
                    <div class="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-200">
                        <img id="previewFoto"
                            src="{{ auth()->user()->foto_profil ? asset('uploads/foto_profil/' . auth()->user()->foto_profil) : 'https://ui-avatars.com/api/?name=' . urlencode(auth()->user()->name) }}"
                            class="w-full h-full object-cover">
                    </div>
                    <label for="foto_profil"
                        class="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white border-4 border-white cursor-pointer active:scale-90 transition">
                        <i data-lucide="camera" class="w-5 h-5"></i>
                        <input type="file" name="foto_profil" id="foto_profil" class="hidden" accept="image/*"
                            onchange="previewImage(this)">
                    </label>
                </div>
                <p class="text-[10px] text-gray-400 mt-3 uppercase font-bold tracking-widest">Ketuk kamera untuk ubah
                    foto</p>
                @error('foto_profil')
                    <p class="text-red-500 text-[10px] mt-1">{{ $message }}</p>
                @enderror
            </div>

            <h3 class="text-sm font-black text-gray-800 mb-4 px-1">Informasi Pribadi</h3>
            <div class="space-y-5 mb-10">
                <div>
                    <label class="text-[11px] font-bold text-gray-500 ml-1 uppercase">Nama Lengkap</label>
                    <div class="relative mt-1">
                        <i data-lucide="user" class="absolute left-4 top-4 w-5 h-5 text-gray-400"></i>
                        <input type="text" name="name" value="{{ old('name', auth()->user()->name) }}" required
                            class="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm">
                    </div>
                </div>

                <div>
                    <label class="text-[11px] font-bold text-gray-500 ml-1 uppercase">Nomor WhatsApp</label>
                    <div class="relative mt-1">
                        <i data-lucide="phone" class="absolute left-4 top-4 w-5 h-5 text-gray-400"></i>
                        <input type="text" name="no_hp" value="{{ old('no_hp', auth()->user()->no_hp) }}"
                            class="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm"
                            placeholder="0812xxxx">
                    </div>
                </div>

                <div>
                    <label class="text-[11px] font-bold text-gray-500 ml-1 uppercase">Alamat Domisili</label>
                    <div class="relative mt-1">
                        <i data-lucide="map-pin" class="absolute left-4 top-4 w-5 h-5 text-gray-400"></i>
                        <textarea name="alamat" rows="3"
                            class="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm">{{ old('alamat', auth()->user()->alamat) }}</textarea>
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-2 mb-4 px-1">
                <h3 class="text-sm font-black text-gray-800">Keamanan</h3>
                <span
                    class="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">Opsional</span>
            </div>

            <div class="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-6 flex gap-3">
                <i data-lucide="info" class="w-5 h-5 text-blue-600 flex-shrink-0"></i>
                <p class="text-[10px] text-blue-700 leading-relaxed font-medium">
                    Kosongkan kolom di bawah ini jika Anda **tidak ingin** mengubah password saat ini.
                </p>
            </div>

            <div class="space-y-5">
                <div>
                    <label class="text-[11px] font-bold text-gray-500 ml-1 uppercase">Password Baru</label>
                    <div class="relative mt-1">
                        <i data-lucide="lock" class="absolute left-4 top-4 w-5 h-5 text-gray-400"></i>
                        <input type="password" name="password"
                            class="w-full bg-white border {{ $errors->has('password') ? 'border-red-500' : 'border-gray-200' }} rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm"
                            placeholder="Minimal 8 karakter">
                    </div>
                    @error('password')
                        <p class="text-red-500 text-[10px] mt-1 ml-1">{{ $message }}</p>
                    @enderror
                </div>

                <div>
                    <label class="text-[11px] font-bold text-gray-500 ml-1 uppercase">Konfirmasi Password Baru</label>
                    <div class="relative mt-1">
                        <i data-lucide="shield-check" class="absolute left-4 top-4 w-5 h-5 text-gray-400"></i>
                        <input type="password" name="password_confirmation"
                            class="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm"
                            placeholder="Ulangi password baru">
                    </div>
                </div>
            </div>

            <button type="submit"
                class="w-full bg-gray-900 text-white py-5 rounded-3xl font-bold text-base shadow-xl mt-12 active:scale-95 transition flex items-center justify-center gap-3">
                <i data-lucide="check-circle-2" class="w-6 h-6 text-blue-400"></i>
                Simpan Semua Perubahan
            </button>
        </div>
    </form>


      @include('components.bottom_Nav')
    <script>
        lucide.createIcons();

        // Preview Foto Profil sebelum upload
        function previewImage(input) {
            if (input.files && input.files[0]) {
                var reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('previewFoto').src = e.target.result;
                }
                reader.readAsDataURL(input.files[0]);
            }
        }


        // Fungsi tutup alert sukses
        function closeAlert() {
            const alert = document.getElementById('successAlert');
            if (alert) {
                alert.classList.add('-translate-y-24', 'opacity-0');
                setTimeout(() => alert.remove(), 500);
            }
        }

        // Fungsi tutup alert error
        function closeErrorAlert() {
            const alert = document.getElementById('errorAlert');
            if (alert) {
                alert.classList.add('-translate-y-24', 'opacity-0');
                setTimeout(() => alert.remove(), 500);
            }
        }

        document.addEventListener('DOMContentLoaded', function() {
            // Auto-hide sukses (3.5 detik)
            if (document.getElementById('successAlert')) {
                setTimeout(closeAlert, 3500);
            }

            // Auto-hide error (5 detik - lebih lama agar user sempat baca kesalahannya)
            if (document.getElementById('errorAlert')) {
                setTimeout(closeErrorAlert, 5000);
            }

            lucide.createIcons();
        });

        // Fungsi untuk menutup alert secara manual
        function closeAlert() {
            const alert = document.getElementById('successAlert');
            if (alert) {
                alert.classList.add('-translate-y-24'); // Geser ke atas
                alert.classList.add('opacity-0'); // Hilangkan
                setTimeout(() => alert.remove(), 500); // Hapus dari DOM
            }
        }

        // Auto close setelah 3 detik
        document.addEventListener('DOMContentLoaded', function() {
            const alert = document.getElementById('successAlert');
            if (alert) {
                // Re-init icons for the alert
                lucide.createIcons();

                setTimeout(() => {
                    closeAlert();
                }, 3500);
            }
        });
    </script>
</body>

</html>
