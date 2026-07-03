<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Absensi Lembur</title>
    <link rel="icon" href="{{ asset('assets/images/logo/logo-sm.png') }}" type="image/png" style="width: 40px">
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
            <h1 class="text-lg font-black text-gray-900 uppercase tracking-tight">Presensi Lembur</h1>
            <div class="w-10"></div>
        </div>
        
        <div class="text-center py-2">
            <div id="statusTime" class="text-4xl font-black text-gray-800 tracking-tighter">00:00:00</div>
            <p class="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{{ now()->translatedFormat('l, d F Y') }}</p>
        </div>
    </div>

    <div class="px-5 -mt-6">
        <div class="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
            @php
                $ongoingLembur = $riwayat->where('jam_keluar', null)->where('status', 'PENDING')->first();
            @endphp

            @if(!$ongoingLembur)
                <button onclick="openModal('MASUK')" 
                    class="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white p-5 rounded-2xl flex items-center justify-between active:scale-95 transition">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><i data-lucide="play-circle"></i></div>
                        <div class="text-left">
                            <p class="text-[10px] uppercase opacity-70 font-bold">Lembur Baru</p>
                            <p class="font-bold text-lg leading-tight">Mulai Lembur</p>
                        </div>
                    </div>
                    <i data-lucide="chevron-right" class="opacity-50"></i>
                </button>
            @else
                <button onclick="openModal('KELUAR')" 
                    class="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white p-5 rounded-2xl flex items-center justify-between active:scale-95 transition animate-pulse">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><i data-lucide="stop-circle"></i></div>
                        <div class="text-left">
                            <p class="text-[10px] uppercase opacity-70 font-bold">Sedang Lembur...</p>
                            <p class="font-bold text-lg leading-tight">Selesai Lembur</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-[10px] font-bold opacity-70 uppercase">Mulai Sejak</p>
                        <p class="font-bold">{{ \Carbon\Carbon::parse($ongoingLembur->jam_masuk)->format('H:i') }}</p>
                    </div>
                </button>
            @endif
        </div>

        <div class="mt-8 mb-24">
            <h3 class="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Riwayat Lembur</h3>
            <div class="space-y-4">
                @forelse ($riwayat as $item)
                <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex items-center gap-3">
                            <div class="p-2 {{ $item->jam_keluar ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600' }} rounded-lg">
                                <i data-lucide="clock" class="w-4 h-4"></i>
                            </div>
                            <div>
                                <p class="text-xs font-black text-gray-800">{{ $item->created_at->translatedFormat('d M Y') }}</p>
                                <p class="text-[10px] text-gray-400 font-bold uppercase">{{ $item->status }}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <span class="text-[10px] font-black px-2 py-1 rounded-md {{ $item->status == 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700' }}">
                                {{ $item->status }}
                            </span>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-2 mb-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div>
                            <p class="text-[9px] font-bold text-gray-400 uppercase">Masuk</p>
                            <p class="text-sm font-bold text-gray-700">{{ \Carbon\Carbon::parse($item->jam_masuk)->format('H:i') }}</p>
                        </div>
                        <div>
                            <p class="text-[9px] font-bold text-gray-400 uppercase">Keluar</p>
                            <p class="text-sm font-bold text-gray-700">{{ $item->jam_keluar ? \Carbon\Carbon::parse($item->jam_keluar)->format('H:i') : '--:--' }}</p>
                        </div>
                    </div>

                    <div class="flex items-center gap-3">
                        <img src="{{ asset('uploads/lembur/' . $item->foto) }}" class="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm">
                        <p class="text-[11px] text-gray-500 italic line-clamp-2">"{{ $item->keterangan }}"</p>
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

    <div id="modalLembur" class="fixed inset-0 z-50 invisible opacity-0 modal-transition">
        <div class="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onclick="closeModal()"></div>
        <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-8 shadow-2xl modal-transition transform translate-y-full" id="modalContent">
            
            <div class="w-16 h-1.5 bg-gray-200 rounded-full mx-auto mb-8"></div>
            
            <h2 id="modalTitle" class="text-2xl font-black text-gray-900 mb-2">Mulai Lembur</h2>
            <p id="modalDesc" class="text-sm text-gray-500 mb-8 font-medium">Ambil foto sebagai bukti kehadiran lembur.</p>

            <form action="{{ route('absensi.lembur.store') }}" method="POST" id="mainForm">
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

                    <div id="keteranganArea" class="hidden">
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Keterangan Pekerjaan</label>
                        <textarea id="keteranganInput" name="keterangan" rows="3" class="w-full bg-gray-50 border-2 border-gray-100 rounded-[24px] p-5 text-sm focus:border-blue-500 outline-none font-medium" placeholder="Apa yang akan dikerjakan?"></textarea>
                    </div>

                    <button type="submit" id="btnSubmit" class="hidden w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-200">
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

        function goBack() { window.history.back(); }

        const modal = document.getElementById('modalLembur');
        const content = document.getElementById('modalContent');
        const video = document.getElementById('webcam');
        const canvas = document.getElementById('canvas');
        const fotoDataInput = document.getElementById('fotoData');
        const tipeInput = document.getElementById('tipeAbsen');
        const modalTitle = document.getElementById('modalTitle');
        const modalDesc = document.getElementById('modalDesc');
        const ketArea = document.getElementById('keteranganArea');
        const ketInput = document.getElementById('keteranganInput');
        const btnSubmit = document.getElementById('btnSubmit');

        let stream = null;

        async function openModal(tipe) {
            tipeInput.value = tipe;
            modalTitle.innerText = tipe === 'MASUK' ? 'Mulai Lembur' : 'Selesai Lembur';
            modalDesc.innerText = tipe === 'MASUK' ? 'Masukkan keterangan dan ambil foto.' : 'Cukup ambil foto bukti untuk selesai lembur.';
            
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

            if (tipeInput.value === 'MASUK') {
                ketArea.classList.remove('hidden');
                ketInput.required = true;
                btnSubmit.classList.remove('hidden');
            } else {
                // Jika KELUAR, keterangan otomatis diisi, tidak perlu input lagi
                ketArea.classList.add('hidden');
                ketInput.required = false;
                ketInput.value = "Selesai Lembur"; 
                btnSubmit.classList.remove('hidden');
            }
        }

        function resetCamera() {
            document.getElementById('cameraWrapper').classList.remove('hidden');
            document.getElementById('btnCapture').classList.remove('hidden');
            document.getElementById('previewWrapper').classList.add('hidden');
            ketArea.classList.add('hidden');
            btnSubmit.classList.add('hidden');
            fotoDataInput.value = "";
            ketInput.value = "";
        }
    </script>
</body>
</html>