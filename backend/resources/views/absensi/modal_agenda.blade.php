<div id="modalAgenda" class="hidden fixed inset-0 bg-black z-[60] flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <i data-lucide="calendar" class="w-5 h-5 text-amber-600"></i>
            </div>
            <div>
                <h3 class="font-bold text-lg text-white" id="agendaModalTitle">Absen Agenda</h3>
                <p class="text-xs text-white/60">Ambil foto agenda hari ini</p>
            </div>
        </div>
        <button onclick="closeModalAgenda()" class="p-2 bg-white/20 rounded-full">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        </button>
    </div>

    <!-- Video Container - Full Screen -->
    <div class="flex-1 relative bg-gray-900">
        <video id="videoAgenda" autoplay muted playsinline webkit-playsinline class="w-full h-full object-cover transform scale-x-[-1]"></video>
        <canvas id="canvasAgenda" class="hidden"></canvas>
        
        <!-- Shift Info -->
        @if(Auth::user()->shift)
        <div class="absolute top-4 left-4 right-4">
            <div class="inline-flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-xl px-4 py-2">
                <i data-lucide="clock" class="w-4 h-4 text-white"></i>
                <span class="text-white text-sm font-medium">
                    {{ Auth::user()->shift->nama_shift }}: 
                    {{ \Carbon\Carbon::parse(Auth::user()->shift->jam_masuk)->format('H:i') }} - 
                    {{ \Carbon\Carbon::parse(Auth::user()->shift->jam_pulang)->format('H:i') }}
                </span>
            </div>
        </div>
        @endif
        
        <!-- Capture Button -->
        <button id="btnCaptureAgenda" onclick="capturePhotoAgenda()" 
            class="absolute bottom-8 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full shadow-2xl flex items-center justify-center border-4 border-white/50 hover:scale-105 transition">
            <div class="w-14 h-14 bg-amber-500 rounded-full border-4 border-amber-300"></div>
        </button>
    </div>

    <!-- Bottom Panel -->
    <div class="bg-white rounded-t-3xl p-4 max-h-[50vh] overflow-y-auto">
        <!-- Preview Foto -->
        <div id="agendaPhotoPreview" class="hidden mb-4">
            <div class="relative rounded-2xl overflow-hidden border border-gray-200">
                <img id="previewAgendaImg" src="" class="w-full h-48 object-cover">
                <button onclick="retakeAgendaPhoto()" class="absolute top-3 right-3 bg-white/90 rounded-full p-2 shadow-lg">
                    <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                </button>
            </div>
        </div>

        <!-- Lokasi Info -->
        <div class="mb-4 p-3 bg-gray-50 rounded-xl">
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span id="lokasiStatusAgenda" class="text-sm text-gray-500">Mendapatkan lokasi...</span>
            </div>
        </div>

        <!-- Keterangan -->
        <div class="mb-4">
            <label class="text-sm text-gray-500 font-medium">Keterangan <span class="text-red-500">*</span></label>
            <textarea id="agendaKeterangan" rows="2" placeholder="Tambahkan keterangan agenda..."
                class="w-full mt-1 p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none" required></textarea>
        </div>

        <input type="hidden" id="agendaJamMulai" value="{{ Auth::user()->shift ? Auth::user()->shift->jam_masuk : '' }}">
        <input type="hidden" id="agendaJamSelesai" value="{{ Auth::user()->shift ? Auth::user()->shift->jam_pulang : '' }}">

        <!-- Buttons -->
        <div class="flex gap-3">
            <button onclick="closeModalAgenda()" 
                class="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-sm">
                Batal
            </button>
            <button onclick="submitAgenda()" id="btnSimpanAgenda" disabled
                class="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                Simpan Agenda
            </button>
        </div>
    </div>
</div>

<script>
    let capturedPhotoAgenda = null;
    let userLatitudeAgenda = null;
    let userLongitudeAgenda = null;
    let videoStreamAgenda = null;

    function openModalAgenda() {
        capturedPhotoAgenda = null;
        userLatitudeAgenda = null;
        userLongitudeAgenda = null;
        
        document.getElementById('agendaPhotoPreview').classList.add('hidden');
        document.getElementById('btnSimpanAgenda').disabled = true;
        document.getElementById('btnSimpanAgenda').classList.add('opacity-50');
        document.getElementById('agendaKeterangan').value = '';
        document.getElementById('modalAgenda').classList.remove('hidden');
        
        startAgendaCamera();
        getLocationAgenda();
    }

    function closeModalAgenda() {
        stopAgendaCamera();
        document.getElementById('modalAgenda').classList.add('hidden');
    }

    async function startAgendaCamera() {
        const video = document.getElementById('videoAgenda');
        try {
            videoStreamAgenda = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' },
                audio: false 
            });
            video.srcObject = videoStreamAgenda;
        } catch (err) {
            Swal.fire({ title: 'Gagal!', text: 'Tidak dapat mengakses kamera', icon: 'error' });
            console.error(err);
        }
    }

    function stopAgendaCamera() {
        if (videoStreamAgenda) {
            videoStreamAgenda.getTracks().forEach(track => track.stop());
            videoStreamAgenda = null;
        }
    }

    function capturePhotoAgenda() {
        const video = document.getElementById('videoAgenda');
        const canvas = document.getElementById('canvasAgenda');
        const preview = document.getElementById('agendaPhotoPreview');
        const imgPreview = document.getElementById('previewAgendaImg');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        capturedPhotoAgenda = canvas.toDataURL('image/jpeg', 0.8);
        
        imgPreview.src = capturedPhotoAgenda;
        preview.classList.remove('hidden');
        
        checkReadyAgenda();
    }

    function retakeAgendaPhoto() {
        capturedPhotoAgenda = null;
        document.getElementById('agendaPhotoPreview').classList.add('hidden');
        document.getElementById('btnSimpanAgenda').disabled = true;
        document.getElementById('btnSimpanAgenda').classList.add('opacity-50');
    }

    function getLocationAgenda() {
        const statusEl = document.getElementById('lokasiStatusAgenda');
        
        if (!navigator.geolocation) {
            statusEl.textContent = 'Geolocation tidak didukung';
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            function(position) {
                userLatitudeAgenda = position.coords.latitude;
                userLongitudeAgenda = position.coords.longitude;
                statusEl.textContent = 'Lokasi terdeteksi ✓';
                checkReadyAgenda();
            },
            function(error) {
                statusEl.textContent = 'Gagal mendapatkan lokasi';
            }
        );
    }

    function checkReadyAgenda() {
        const btn = document.getElementById('btnSimpanAgenda');
        if (capturedPhotoAgenda) {
            btn.disabled = false;
            btn.classList.remove('opacity-50');
        }
    }

    function submitAgenda() {
        const keterangan = document.getElementById('agendaKeterangan').value.trim();
        
        if (!keterangan) {
            Swal.fire({ title: 'Peringatan!', text: 'Keterangan harus diisi', icon: 'warning' });
            return;
        }
        
        if (!capturedPhotoAgenda) {
            Swal.fire({ title: 'Peringatan!', text: 'Ambil foto terlebih dahulu', icon: 'warning' });
            return;
        }
        
        const jamMulaiEl = document.getElementById('agendaJamMulai');
        const jamSelesaiEl = document.getElementById('agendaJamSelesai');
        
        const formData = new FormData();
        formData.append('foto', capturedPhotoAgenda);
        formData.append('keterangan', keterangan);
        if (jamMulaiEl) formData.append('jam_mulai', jamMulaiEl.value);
        if (jamSelesaiEl) formData.append('jam_selesai', jamSelesaiEl.value);
        
        const btn = document.getElementById('btnSimpanAgenda');
        btn.disabled = true;
        btn.innerHTML = '<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> Menyimpan...';
        
        fetch('/absensi/agenda/store', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': '{{ csrf_token() }}',
                'Accept': 'application/json'
            },
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                Swal.fire({
                    title: 'Berhasil!',
                    text: data.message || 'Agenda berhasil disimpan',
                    icon: 'success',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#f59e0b'
                }).then(() => {
                    closeModalAgenda();
                    loadAgenda();
                });
            } else {
                Swal.fire({ title: 'Gagal!', text: data.message || 'Terjadi kesalahan', icon: 'error' });
                btn.disabled = false;
                btn.innerHTML = 'Simpan Agenda';
            }
        })
        .catch(err => {
            Swal.fire({ title: 'Gagal!', text: 'Terjadi kesalahan koneksi', icon: 'error' });
            btn.disabled = false;
            btn.innerHTML = 'Simpan Agenda';
        });
    }

    function loadAgenda() {
        if (typeof fetchAgendaData === 'function') {
            fetchAgendaData();
        }
    }
</script>
