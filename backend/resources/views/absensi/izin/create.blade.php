<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pengajuan Izin</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <style>
        .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom);
        }

        /* Animasi loading untuk tombol */
        .btn-loading {
            opacity: 0.7;
            pointer-events: none;
        }
    </style>
</head>

<body class="bg-gray-50">

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

    <div class="bg-white px-5 pt-4 pb-6 shadow-sm border-b border-gray-100">
        <div class="flex items-center justify-between">
            <button onclick="location.href='/absensi/izin'"
                class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center active:scale-90 transition">
                <i data-lucide="arrow-left" class="w-5 h-5 text-gray-700"></i>
            </button>
            <h1 class="text-lg font-bold text-gray-900">Pengajuan Izin</h1>
            <div class="w-10"></div>
        </div>
    </div>

    <div class="px-5 pt-6 pb-24">
        <form id="formIzin" enctype="multipart/form-data">
            @csrf
            <div class="space-y-5">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Jenis Izin</label>
                    <div class="grid grid-cols-3 gap-3">

                        <!-- SAKIT -->
                        <label class="relative cursor-pointer">
                            <input type="radio" name="jenis_izin" value="SAKIT" class="peer sr-only" checked>
                            <div
                                class="p-3 text-center bg-white border border-gray-200 rounded-2xl 
                    peer-checked:border-blue-600 peer-checked:bg-blue-50 transition-all">
                                <i data-lucide="thermometer"
                                    class="w-5 h-5 mx-auto mb-1 text-gray-400 peer-checked:text-blue-600"></i>
                                <span class="text-xs font-semibold text-gray-600 peer-checked:text-blue-600">
                                    Sakit
                                </span>
                            </div>
                        </label>

                        <!-- CUTI -->
                        <label class="relative cursor-pointer">
                            <input type="radio" name="jenis_izin" value="CUTI" class="peer sr-only">
                            <div
                                class="p-3 text-center bg-white border border-gray-200 rounded-2xl 
                    peer-checked:border-blue-600 peer-checked:bg-blue-50 transition-all">
                                <i data-lucide="palmtree"
                                    class="w-5 h-5 mx-auto mb-1 text-gray-400 peer-checked:text-blue-600"></i>
                                <span class="text-xs font-semibold text-gray-600 peer-checked:text-blue-600">
                                    Cuti
                                </span>
                            </div>
                        </label>

                        <!-- IZIN -->
                        <label class="relative cursor-pointer">
                            <input type="radio" name="jenis_izin" value="IZIN" class="peer sr-only">
                            <div
                                class="p-3 text-center bg-white border border-gray-200 rounded-2xl 
                    peer-checked:border-blue-600 peer-checked:bg-blue-50 transition-all">
                                <i data-lucide="file-text"
                                    class="w-5 h-5 mx-auto mb-1 text-gray-400 peer-checked:text-blue-600"></i>
                                <span class="text-xs font-semibold text-gray-600 peer-checked:text-blue-600">
                                    Izin
                                </span>
                            </div>
                        </label>

                    </div>

                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">Mulai</label>
                        <input type="date" name="tgl_mulai" required
                            class="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">Berakhir</label>
                        <input type="date" name="tgl_selesai" required
                            class="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Alasan</label>
                    <textarea name="alasan" rows="4" placeholder="Jelaskan alasan pengajuan Anda..." required
                        class="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Lampiran (Foto/PDF)</label>
                    <div
                        class="relative border-2 border-dashed border-gray-200 rounded-2xl p-6 bg-white flex flex-col items-center justify-center">
                        <input type="file" name="lampiran" id="file_input"
                            class="absolute inset-0 opacity-0 cursor-pointer">
                        <i data-lucide="upload-cloud" class="w-6 h-6 text-blue-600 mb-2"></i>
                        <p class="text-xs text-gray-500 font-medium" id="file_name">Klik untuk upload bukti</p>
                    </div>
                </div>
            </div>

            <div class="fixed bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100 safe-area-bottom">
                <button type="submit" id="btnSubmit"
                    class="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition flex items-center justify-center gap-2">
                    Kirim Pengajuan
                </button>
            </div>
        </form>
    </div>
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

    <script>
        lucide.createIcons();

        $(document).ready(function() {
            $('#formIzin').on('submit', function(e) {
                e.preventDefault();

                // Animasi Loading
                let btn = $('#btnSubmit');
                let originalText = btn.text();
                btn.prop('disabled', true).addClass('btn-loading').html(
                    '<span class="animate-spin text-lg inline-block mr-2">⏳</span> Mengirim...');

                // FormData digunakan karena ada upload file
                let formData = new FormData(this);

                $.ajax({
                    url: "{{ route('izin.store') }}",
                    type: "POST",
                    data: formData,
                    contentType: false,
                    processData: false,
                    success: function(response) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Berhasil!',
                            text: response.message ||
                                'Pengajuan izin Anda telah dikirim.',
                            showConfirmButton: false,
                            timer: 2000
                        }).then(() => {
                            window.location.href = "{{ route('izin.index') }}";
                        });
                    },
                    error: function(xhr) {
                        btn.prop('disabled', false).removeClass('btn-loading').text(
                            originalText);

                        let errorMsg = "Terjadi kesalahan pada sistem.";

                        // 1. Cek jika ada pesan error kustom (Pesan "Sudah Absen" atau "Sudah Input Hari Ini")
                        if (xhr.responseJSON && xhr.responseJSON.message) {
                            errorMsg = xhr.responseJSON.message;
                        }
                        // 2. Cek jika ada error validasi Laravel (Input kosong, file terlalu besar, dll)
                        else if (xhr.status === 422 && xhr.responseJSON.errors) {
                            let errors = xhr.responseJSON.errors;
                            errorMsg = Object.values(errors)[0][0];
                        }

                        Swal.fire({
                            icon: 'error',
                            title: 'Oops...',
                            text: errorMsg,
                            confirmButtonColor: '#3b82f6'
                        });
                    }
                });
            });

            // Update tampilan nama file saat dipilih
            $('#file_input').on('change', function() {
                if (this.files.length > 0) {
                    $('#file_name').text(this.files[0].name).addClass('text-blue-600 font-medium');
                }
            });
        });
    </script>
</body>

</html>
