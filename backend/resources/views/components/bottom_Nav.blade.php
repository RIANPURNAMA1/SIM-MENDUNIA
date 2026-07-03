    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 safe-area-bottom">
        <div class="flex items-center justify-around gap-2">
            <a href="/absensi" class="flex flex-col items-center gap-1 text-blue-700">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                <span class="text-xs font-medium">Home</span>
            </a>

            <button onclick="toggleModalJadwal(true)" class="flex flex-col items-center gap-1 text-gray-400">
                <i data-lucide="calendar-range" class="w-6 h-6"></i>
                <span class="text-xs font-medium">Jadwal Shift</span>
            </button>

            @if(auth()->user()->isSiswa())
            <a href="{{ route('absensi.scan') }}" class="flex flex-col items-center -mt-8">
                <div
                    class="w-14 h-14 bg-gradient-to-br from-[#0D1F3C] to-[#1a2d4a] rounded-full flex items-center justify-center shadow-lg">
                    <i data-lucide="qr-code" class="w-7 h-7 text-white"></i>
                </div>
                <span class="text-xs font-medium text-gray-700 mt-2">Scan QR</span>
            </a>
            @elseif(auth()->user()->role === 'GURU')
            <button onclick="senseiAlert()" class="flex flex-col items-center -mt-8">
                <div
                    class="w-14 h-14 bg-gradient-to-br from-[#0D1F3C] to-[#1a2d4a] rounded-full flex items-center justify-center shadow-lg">
                    <i data-lucide="camera" class="w-7 h-7 text-white"></i>
                </div>
                <span class="text-xs font-medium text-gray-700 mt-2">Attedance</span>
            </button>
            @else
            <button onclick="mulaiAbsenFoto()" class="flex flex-col items-center -mt-8">
                <div
                    class="w-14 h-14 bg-gradient-to-br from-[#0D1F3C] to-[#1a2d4a] rounded-full flex items-center justify-center shadow-lg">
                    <i data-lucide="camera" class="w-7 h-7 text-white"></i>
                </div>
                <span class="text-xs font-medium text-gray-700 mt-2">Attedance</span>
            </button>
            @endif

            <button onclick="window.location='/report'" class="flex flex-col items-center gap-1 text-gray-400">
                <i data-lucide="trending-up" class="w-6 h-6"></i>
                <span class="text-xs font-medium">Report</span>
            </button>

            <a href="{{route('absensi.profile')}}" class="flex flex-col items-center gap-1 text-gray-400">
                <i data-lucide="users" class="w-6 h-6"></i>
                <span class="text-xs font-medium">Profile</span>
            </a>
        </div>
    </div>
      {{-- modal absensi manual --}}
    @include('absensi.modal_manual')

    <script>
        function senseiAlert() {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'info',
                    title: 'Anda adalah Sensei',
                    text: 'Silakan absen berdasarkan kelas Anda',
                    confirmButtonColor: '#0D1F3C',
                });
            } else {
                alert('Anda adalah Sensei. Silakan absen berdasarkan kelas Anda.');
            }
        }
    </script>