<div id="modalAbsenSensei" class="hidden fixed inset-0 bg-black z-[60] flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
        <h3 class="font-bold text-lg text-white" id="senseiModalTitle">Absen Sensei</h3>
        <button onclick="tutupModalSensei()" class="p-2 bg-white/20 rounded-full">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        </button>
    </div>

    <!-- Video Container - Full Screen -->
    <div class="flex-1 relative bg-gray-900">
        <video id="videoSensei" autoplay muted playsinline webkit-playsinline class="w-full h-full object-cover"></video>
        <canvas id="canvasSensei" class="hidden"></canvas>
        
        <!-- Capture Button -->
        <button id="btnCaptureSensei" onclick="capturePhotoSensei()" 
            class="absolute bottom-8 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full shadow-2xl flex items-center justify-center border-4 border-white/50 hover:scale-105 transition">
            <div class="w-14 h-14 bg-blue-700 rounded-full border-4 border-blue-400"></div>
        </button>
    </div>

    <!-- Bottom Panel -->
    <div class="bg-white rounded-t-3xl p-4 max-h-[50vh] overflow-y-auto">
        <!-- Preview Foto -->
        <div id="previewPhotoSensei" class="hidden mb-4">
            <div class="relative rounded-2xl overflow-hidden border border-gray-200">
                <img id="imgPreviewSensei" src="" class="w-full h-48 object-cover">
                <button onclick="retakePhotoSensei()" class="absolute top-3 right-3 bg-white/90 rounded-full p-2 shadow-lg">
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
                <span id="lokasiStatusSensei" class="text-sm text-gray-500">Mendapatkan lokasi...</span>
            </div>
        </div>

        <!-- Keterangan -->
        <div class="mb-4">
            <label class="text-sm text-gray-500 font-medium">Keterangan (Opsional)</label>
            <textarea id="keteranganSensei" rows="2" placeholder="Tambahkan catatan..."
                class="w-full mt-1 p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"></textarea>
        </div>

        <!-- Buttons -->
        <div class="flex gap-3">
            <button onclick="tutupModalSensei()" 
                class="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-sm">
                Batal
            </button>
            <button onclick="submitAbsenSensei()" id="btnSubmitSensei" disabled
                class="flex-1 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                Absen Sekarang
            </button>
        </div>
    </div>
</div>

<script>
    let currentKelasSenseiId = null;
    let currentAbsenType = 'masuk';
    let capturedPhotoSensei = null;
    let userLatitudeSensei = null;
    let userLongitudeSensei = null;
    let videoStreamSensei = null;

    function openModalAbsenSensei(kelasId, type) {
        currentKelasSenseiId = kelasId;
        currentAbsenType = type;
        capturedPhotoSensei = null;
        userLatitudeSensei = null;
        userLongitudeSensei = null;
        
        document.getElementById('senseiModalTitle').textContent = type === 'masuk' ? 'Absen Masuk Sensei' : 'Absen Pulang Sensei';
        document.getElementById('previewPhotoSensei').classList.add('hidden');
        document.getElementById('btnSubmitSensei').disabled = true;
        document.getElementById('btnSubmitSensei').classList.add('opacity-50');
        document.getElementById('keteranganSensei').value = '';
        document.getElementById('modalAbsenSensei').classList.remove('hidden');
        
        startCameraSensei();
        getLocationSensei();
    }

    function tutupModalSensei() {
        stopCameraSensei();
        document.getElementById('modalAbsenSensei').classList.add('hidden');
    }

    async function startCameraSensei() {
        const video = document.getElementById('videoSensei');
        try {
            videoStreamSensei = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' },
                audio: false 
            });
            video.srcObject = videoStreamSensei;
        } catch (err) {
            Swal.fire({ title: 'Gagal!', text: 'Tidak dapat mengakses kamera', icon: 'error' });
            console.error(err);
        }
    }

    function stopCameraSensei() {
        if (videoStreamSensei) {
            videoStreamSensei.getTracks().forEach(track => track.stop());
            videoStreamSensei = null;
        }
    }

    function capturePhotoSensei() {
        const video = document.getElementById('videoSensei');
        const canvas = document.getElementById('canvasSensei');
        const preview = document.getElementById('previewPhotoSensei');
        const imgPreview = document.getElementById('imgPreviewSensei');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        capturedPhotoSensei = canvas.toDataURL('image/jpeg', 0.8);
        
        imgPreview.src = capturedPhotoSensei;
        preview.classList.remove('hidden');
        
        checkReadyToSubmit();
    }

    function retakePhotoSensei() {
        capturedPhotoSensei = null;
        document.getElementById('previewPhotoSensei').classList.add('hidden');
        document.getElementById('btnSubmitSensei').disabled = true;
        document.getElementById('btnSubmitSensei').classList.add('opacity-50');
    }

    function getLocationSensei() {
        const statusEl = document.getElementById('lokasiStatusSensei');
        
        if (!navigator.geolocation) {
            statusEl.textContent = 'Geolocation tidak didukung';
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            function(position) {
                userLatitudeSensei = position.coords.latitude;
                userLongitudeSensei = position.coords.longitude;
                statusEl.textContent = 'Lokasi terdeteksi ✓';
                checkReadyToSubmit();
            },
            function(error) {
                statusEl.textContent = 'Gagal mendapatkan lokasi';
            }
        );
    }

    function checkReadyToSubmit() {
        const btn = document.getElementById('btnSubmitSensei');
        if (capturedPhotoSensei && userLatitudeSensei && userLongitudeSensei) {
            btn.disabled = false;
            btn.classList.remove('opacity-50');
        }
    }

    function submitAbsenSensei() {
        const endpoint = currentAbsenType === 'masuk' 
            ? '/absensi/sensei/absen-masuk' 
            : '/absensi/sensei/absen-pulang';
        
        const formData = new FormData();
        formData.append('kelas_sensei_id', currentKelasSenseiId);
        formData.append('latitude', userLatitudeSensei);
        formData.append('longitude', userLongitudeSensei);
        formData.append('photo', capturedPhotoSensei);
        formData.append('keterangan', document.getElementById('keteranganSensei').value);
        
        fetch(endpoint, {
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
                    text: data.message,
                    icon: 'success',
                    confirmButtonText: 'OK',
                    confirmButtonColor: data.status === 'HADIR' ? '#22c55e' : '#7c3aed'
                }).then(() => {
                    tutupModalSensei();
                    loadKelasAktif();
                });
            } else {
                Swal.fire({ title: 'Gagal!', text: data.message, icon: 'error' });
            }
        })
        .catch(err => {
            Swal.fire({ title: 'Gagal!', text: 'Terjadi kesalahan', icon: 'error' });
        });
    }
</script>