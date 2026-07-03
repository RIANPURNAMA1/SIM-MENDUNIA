<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Absen Khusus</title>
    <link rel="icon" href="{{ asset('assets/images/logo/logo-sm.png') }}" type="image/png">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>

    <style>
        .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
        .modal-transition { transition: all 0.3s ease-in-out; }
    </style>
</head>

<body class="bg-gray-50">

    @if (session('success'))
        <div id="toast" class="fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-[90%] bg-green-600 text-white p-4 rounded-2xl shadow-lg flex items-center gap-3 animate-pulse">
            <i data-lucide="check-circle"></i>
            <span class="text-sm font-bold">{{ session('success') }}</span>
        </div>
        <script>setTimeout(() => document.getElementById('toast').remove(), 3000);</script>
    @endif

    <div class="bg-white px-5 pt-8 pb-6 shadow-sm border-b border-gray-100 rounded-b-[30px]">
        <div class="flex items-center justify-between mb-4">
            <button onclick="location.href='/absensi'" class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center active:scale-90 transition">
                <i data-lucide="arrow-left" class="w-5 h-5 text-gray-700"></i>
            </button>
            <h1 class="text-lg font-black text-gray-900 uppercase tracking-tight">Absen Khusus</h1>
            <div class="w-10"></div>
        </div>

        <div class="text-center py-2">
            <div id="statusTime" class="text-4xl font-black text-gray-800 tracking-tighter">00:00:00</div>
            <p class="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{{ now()->translatedFormat('l, d F Y') }}</p>
        </div>
    </div>

    <div class="px-5 -mt-6">
        {{-- Timer Card --}}
        <div class="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
            {{-- Hanya tampilan timer ketika ada sesi --}}
            <div id="timerDisplay" class="hidden text-center mb-6">
                <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-blue-200">
                    <i data-lucide="timer" class="w-10 h-10 text-white"></i>
                </div>
                <div id="timerClock" class="text-5xl font-black text-gray-900 tracking-tighter mt-4 font-mono">00:00:00</div>
                <p id="timerStatusLabel" class="text-xs font-bold text-green-600 mt-2 uppercase tracking-widest">Berjalan</p>
            </div>

            {{-- Tombol Mulai (jika tidak ada sesi aktif) --}}
            <div id="startSection">
                <button onclick="openModal('MASUK')"
                    class="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white p-5 rounded-2xl flex items-center justify-between active:scale-95 transition">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><i data-lucide="play-circle" class="w-6 h-6"></i></div>
                        <div class="text-left">
                            <p class="text-[10px] uppercase opacity-70 font-bold">Sesi Baru</p>
                            <p class="font-bold text-lg leading-tight">Mulai Absen Khusus</p>
                        </div>
                    </div>
                    <i data-lucide="chevron-right" class="opacity-50"></i>
                </button>
            </div>

            {{-- Kontrol sesi berjalan --}}
            <div id="activeSection" class="hidden space-y-4">
                <div id="pauseResumeRow" class="flex gap-3">
                    <button id="btnPause" onclick="pauseSesi()"
                        class="flex-1 bg-amber-500 text-white p-4 rounded-2xl flex items-center justify-center gap-2 font-bold active:scale-95 transition shadow-lg shadow-amber-200">
                        <i data-lucide="pause" class="w-5 h-5"></i> Jeda
                    </button>
                    <button onclick="openModal('KELUAR')"
                        class="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white p-4 rounded-2xl flex items-center justify-center gap-2 font-bold active:scale-95 transition shadow-lg shadow-red-200 animate-pulse">
                        <i data-lucide="stop-circle" class="w-5 h-5"></i> Selesai
                    </button>
                </div>
                <button id="btnLanjut" onclick="lanjutSesi()" class="hidden w-full bg-blue-600 text-white p-4 rounded-2xl flex items-center justify-center gap-2 font-bold active:scale-95 transition shadow-lg shadow-blue-200">
                    <i data-lucide="play" class="w-5 h-5"></i> Lanjutkan
                </button>
            </div>
        </div>

        {{-- Riwayat --}}
        <div class="mt-8 mb-24">
            <h3 class="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Riwayat Absen Khusus</h3>
            <div class="space-y-4" id="riwayatContainer">
                @forelse ($riwayat as $item)
                <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex items-center gap-3">
                            <div class="p-2 {{ $item->status == 'SELESAI' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600' }} rounded-lg">
                                <i data-lucide="clock" class="w-4 h-4"></i>
                            </div>
                            <div>
                                <p class="text-xs font-black text-gray-800">{{ $item->created_at->translatedFormat('d M Y') }}</p>
                                <p class="text-[10px] text-gray-400 font-bold uppercase">{{ $item->status }}</p>
                            </div>
                        </div>
                        <div>
                            @php
                                $jam = floor($item->total_detik / 3600);
                                $menit = floor(($item->total_detik % 3600) / 60);
                                $detik = $item->total_detik % 60;
                            @endphp
                            <span class="text-[10px] font-black px-2 py-1 rounded-md bg-blue-100 text-blue-700">
                                {{ $jam }}j {{ $menit }}m
                            </span>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-2 bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div>
                            <p class="text-[9px] font-bold text-gray-400 uppercase">Masuk</p>
                            <p class="text-sm font-bold text-gray-700">{{ $item->jam_masuk->format('H:i') }}</p>
                        </div>
                        <div>
                            <p class="text-[9px] font-bold text-gray-400 uppercase">Keluar</p>
                            <p class="text-sm font-bold text-gray-700">{{ $item->jam_keluar ? $item->jam_keluar->format('H:i') : '--:--' }}</p>
                        </div>
                    </div>
                </div>
                @empty
                <div class="text-center py-10 opacity-40">
                    <p class="text-xs font-bold uppercase">Belum ada data</p>
                </div>
                @endforelse
            </div>
        </div>
    </div>

    {{-- Modal Camera --}}
    <div id="modalKhusus" class="fixed inset-0 z-50 invisible opacity-0 modal-transition">
        <div class="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onclick="closeModal()"></div>
        <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-8 shadow-2xl modal-transition transform translate-y-full" id="modalContent">

            <div class="w-16 h-1.5 bg-gray-200 rounded-full mx-auto mb-8"></div>

            <h2 id="modalTitle" class="text-2xl font-black text-gray-900 mb-2">Mulai Absen Khusus</h2>
            <p id="modalDesc" class="text-sm text-gray-500 mb-8 font-medium">Ambil foto sebagai bukti kehadiran.</p>

            <form id="mainForm" onsubmit="return false;">
                @csrf
                <input type="hidden" name="foto_data" id="fotoData">
                <input type="hidden" name="tipe" id="tipeAbsen">

                <div class="space-y-6">
                    <div id="cameraArea">
                        <div id="cameraWrapper" class="relative rounded-[32px] overflow-hidden bg-black aspect-square mb-4 shadow-inner">
                            <video id="webcam" autoplay playsinline class="w-full h-full object-cover scale-x-[-1]"></video>
                            <canvas id="canvas" class="hidden"></canvas>
                        </div>

                        <div id="previewWrapper" class="hidden relative rounded-[32px] overflow-hidden border-4 border-blue-500 aspect-square mb-4">
                            <img id="imgPreview" class="w-full h-full object-cover">
                            <button type="button" onclick="resetCamera()" class="absolute top-4 right-4 bg-white/20 backdrop-blur text-white p-3 rounded-full shadow-lg">
                                <i data-lucide="refresh-cw"></i>
                            </button>
                        </div>

                        <button type="button" id="btnCapture" onclick="takeSnapshot()" class="w-full py-5 bg-gray-900 text-white rounded-2xl flex items-center justify-center gap-3 font-bold shadow-xl">
                            <i data-lucide="camera" class="w-6 h-6"></i> Ambil Foto
                        </button>
                    </div>

                    <div id="loadingArea" class="hidden text-center py-4">
                        <div class="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                        <p class="text-sm text-gray-500 mt-3 font-medium">Memproses...</p>
                    </div>

                    <button type="button" id="btnSubmit" class="hidden w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-200 active:scale-95 transition"
                        onclick="submitAbsen()">
                        Simpan Presensi
                    </button>
                </div>
            </form>
            <div class="safe-area-bottom h-8"></div>
        </div>
    </div>

    @include('components.bottom_Nav')

    <script>
        lucide.createIcons();

        function updateStatusTime() {
            const now = new Date();
            document.getElementById('statusTime').textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
        setInterval(updateStatusTime, 1000);
        updateStatusTime();

        // ========== State ==========
        let stream = null;
        let timerInterval = null;
        let sessionId = null;
        let elapsedDetik = 0;
        let modalTipe = '';

        // ========== Modal Camera ==========
        const modal = document.getElementById('modalKhusus');
        const content = document.getElementById('modalContent');
        const video = document.getElementById('webcam');
        const canvas = document.getElementById('canvas');
        const fotoDataInput = document.getElementById('fotoData');
        const tipeInput = document.getElementById('tipeAbsen');
        const modalTitle = document.getElementById('modalTitle');
        const modalDesc = document.getElementById('modalDesc');
        const btnSubmit = document.getElementById('btnSubmit');

        async function openModal(tipe) {
            modalTipe = tipe;
            tipeInput.value = tipe;
            modalTitle.innerText = tipe === 'MASUK' ? 'Mulai Absen Khusus' : 'Selesai Absen Khusus';
            modalDesc.innerText = tipe === 'MASUK' ? 'Ambil foto untuk memulai sesi.' : 'Ambil foto sebagai bukti penyelesaian.';

            modal.classList.remove('invisible', 'opacity-0');
            content.classList.remove('translate-y-full');

            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
                video.srcObject = stream;
            } catch (err) { alert("Kamera gagal diakses."); }
        }

        function closeModal() {
            modal.classList.add('invisible', 'opacity-0');
            content.classList.add('translate-y-full');
            if (stream) stream.getTracks().forEach(track => track.stop());
            stream = null;
            resetCamera();
        }

        function takeSnapshot() {
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataURL = canvas.toDataURL('image/jpeg');
            document.getElementById('imgPreview').src = dataURL;
            fotoDataInput.value = dataURL;

            document.getElementById('cameraWrapper').classList.add('hidden');
            document.getElementById('btnCapture').classList.add('hidden');
            document.getElementById('previewWrapper').classList.remove('hidden');
            btnSubmit.classList.remove('hidden');
        }

        function resetCamera() {
            document.getElementById('cameraWrapper').classList.remove('hidden');
            document.getElementById('btnCapture').classList.remove('hidden');
            document.getElementById('previewWrapper').classList.add('hidden');
            btnSubmit.classList.add('hidden');
            fotoDataInput.value = "";
        }

        // ========== GPS ==========
        function dapatkanLokasi() {
            return new Promise((resolve, reject) => {
                if (!navigator.geolocation) return reject('GPS tidak tersedia');
                navigator.geolocation.getCurrentPosition(
                    pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                    () => reject('Gagal dapat lokasi'),
                    { enableHighAccuracy: true, timeout: 10000 }
                );
            });
        }

        // ========== Submit ==========
        async function submitAbsen() {
            const photo = fotoDataInput.value;
            if (!photo) return alert('Ambil foto terlebih dahulu');

            document.getElementById('loadingArea').classList.remove('hidden');
            btnSubmit.disabled = true;

            try {
                const loc = await dapatkanLokasi();
                const endpoint = modalTipe === 'MASUK' ? '/absensi/khusus/mulai' : '/absensi/khusus/selesai';
                const resp = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                    },
                    body: JSON.stringify({ photo, latitude: loc.lat, longitude: loc.lng })
                });
                const data = await resp.json();
                document.getElementById('loadingArea').classList.add('hidden');
                btnSubmit.disabled = false;

                if (data.success) {
                    closeModal();
                    if (modalTipe === 'MASUK') {
                        sessionId = data.data.id;
                        elapsedDetik = 0;
                        mulaiTimer();
                        document.getElementById('startSection').classList.add('hidden');
                        document.getElementById('activeSection').classList.remove('hidden');
                        document.getElementById('timerDisplay').classList.remove('hidden');
                        document.getElementById('timerStatusLabel').textContent = 'Berjalan';
                        document.getElementById('timerStatusLabel').className = 'text-xs font-bold text-green-600 mt-2 uppercase tracking-widest';
                        document.getElementById('btnPause').classList.remove('hidden');
                        document.getElementById('btnLanjut').classList.add('hidden');
                        document.getElementById('pauseResumeRow').classList.remove('hidden');
                    } else {
                        if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
                        sessionId = null;
                        document.getElementById('timerDisplay').classList.add('hidden');
                        document.getElementById('activeSection').classList.add('hidden');
                        document.getElementById('startSection').classList.remove('hidden');
                        document.getElementById('toastSuccess').textContent = data.message;
                        document.getElementById('toastSuccess').classList.remove('hidden');
                        setTimeout(() => location.reload(), 2000);
                    }
                } else {
                    alert(data.message || 'Gagal');
                }
            } catch (err) {
                document.getElementById('loadingArea').classList.add('hidden');
                btnSubmit.disabled = false;
                alert('Error: ' + err.message);
            }
        }

        // ========== Timer ==========
        function mulaiTimer() {
            if (timerInterval) clearInterval(timerInterval);
            timerInterval = setInterval(() => {
                elapsedDetik++;
                perbaruiTimer();
            }, 1000);
            perbaruiTimer();
        }

        function perbaruiTimer() {
            const h = Math.floor(elapsedDetik / 3600);
            const m = Math.floor((elapsedDetik % 3600) / 60);
            const d = elapsedDetik % 60;
            document.getElementById('timerClock').textContent =
                String(h).padStart(2, '0') + ':' +
                String(m).padStart(2, '0') + ':' +
                String(d).padStart(2, '0');
        }

        // ========== Pause / Resume ==========
        function pauseSesi() {
            fetch('/absensi/khusus/pause', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    elapsedDetik = data.total_detik;
                    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
                    document.getElementById('timerStatusLabel').textContent = 'Dijeda';
                    document.getElementById('timerStatusLabel').className = 'text-xs font-bold text-amber-600 mt-2 uppercase tracking-widest';
                    document.getElementById('btnPause').classList.add('hidden');
                    document.getElementById('btnLanjut').classList.remove('hidden');
                } else {
                    alert(data.message || 'Gagal menjeda');
                }
            })
            .catch(err => alert('Error: ' + err.message));
        }

        function lanjutSesi() {
            fetch('/absensi/khusus/lanjut', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    elapsedDetik = data.total_detik;
                    document.getElementById('timerStatusLabel').textContent = 'Berjalan';
                    document.getElementById('timerStatusLabel').className = 'text-xs font-bold text-green-600 mt-2 uppercase tracking-widest';
                    document.getElementById('btnPause').classList.add('hidden');
                    document.getElementById('btnLanjut').classList.add('hidden');
                    mulaiTimer();
                } else {
                    alert(data.message || 'Gagal melanjutkan');
                }
            })
            .catch(err => alert('Error: ' + err.message));
        }

        // ========== Cek sesi aktif saat load ==========
        document.addEventListener('DOMContentLoaded', function() {
            fetch('/absensi/khusus/status')
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.data) {
                        sessionId = data.data.id;
                        elapsedDetik = data.data.total_detik || 0;

                        document.getElementById('startSection').classList.add('hidden');
                        document.getElementById('activeSection').classList.remove('hidden');
                        document.getElementById('timerDisplay').classList.remove('hidden');

                        if (data.data.status === 'BERJALAN') {
                            const now = new Date();
                            const [h, m, s] = data.data.jam_masuk.split(':');
                            const jamMasuk = new Date();
                            jamMasuk.setHours(parseInt(h), parseInt(m), parseInt(s), 0);
                            elapsedDetik += Math.floor((now - jamMasuk) / 1000);

                            document.getElementById('timerStatusLabel').textContent = 'Berjalan';
                            document.getElementById('timerStatusLabel').className = 'text-xs font-bold text-green-600 mt-2 uppercase tracking-widest';
                            if (data.data.total_detik > 0) {
                                document.getElementById('btnPause').classList.add('hidden');
                            } else {
                                document.getElementById('btnPause').classList.remove('hidden');
                            }
                            document.getElementById('btnLanjut').classList.add('hidden');
                            document.getElementById('pauseResumeRow').classList.remove('hidden');
                            mulaiTimer();
                        } else {
                            document.getElementById('timerStatusLabel').textContent = 'Dijeda';
                            document.getElementById('timerStatusLabel').className = 'text-xs font-bold text-amber-600 mt-2 uppercase tracking-widest';
                            document.getElementById('btnPause').classList.add('hidden');
                            document.getElementById('btnLanjut').classList.remove('hidden');
                            document.getElementById('pauseResumeRow').classList.add('hidden');
                            perbaruiTimer();
                        }
                    }
                })
                .catch(() => {});
        });
    </script>

    <div id="toastSuccess" class="hidden fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-[90%] bg-green-600 text-white p-4 rounded-2xl shadow-lg flex items-center gap-3">
        <i data-lucide="check-circle"></i>
        <span class="text-sm font-bold"></span>
    </div>

</body>
</html>
