<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Scan QR Absensi - Mendunia.id</title>
    <link rel="icon" href="{{ asset('assets/images/logo/logo-sm.png') }}" type="image/png">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
    <style>
        #reader {
            width: 100%;
            max-width: 360px;
            margin: 0 auto;
        }
        #reader video {
            border-radius: 24px !important;
        }
        #reader__dashboard_section {
            padding: 0 !important;
            margin-top: 12px !important;
        }
        #reader__dashboard_section_swaplink {
            color: #00c0ff !important;
            font-weight: 600 !important;
            font-size: 13px !important;
            background: rgba(0,0,0,0.3) !important;
            padding: 8px 20px !important;
            border-radius: 999px !important;
            display: inline-block !important;
        }
        #reader__scan_region {
            min-height: 280px !important;
            border-radius: 24px !important;
            overflow: hidden !important;
        }
        #reader__dashboard_section_fsr {
            display: none !important;
        }
        .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom);
        }
        @keyframes pulse-border {
            0%, 100% { border-color: rgba(0, 192, 255, 0.8); }
            50% { border-color: rgba(0, 192, 255, 0.3); }
        }
        .scan-overlay {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 220px;
            height: 220px;
            border: 3px solid rgba(0, 192, 255, 0.8);
            border-radius: 24px;
            animation: pulse-border 2s ease-in-out infinite;
            pointer-events: none;
            z-index: 10;
            box-shadow: 0 0 40px rgba(0, 192, 255, 0.15), inset 0 0 40px rgba(0, 192, 255, 0.05);
        }
        .scan-corner {
            position: absolute;
            width: 28px;
            height: 28px;
            border-color: #00c0ff;
            border-style: solid;
        }
        .scan-corner-tl { top: -2px; left: -2px; border-width: 4px 0 0 4px; border-radius: 12px 0 0 0; }
        .scan-corner-tr { top: -2px; right: -2px; border-width: 4px 4px 0 0; border-radius: 0 12px 0 0; }
        .scan-corner-bl { bottom: -2px; left: -2px; border-width: 0 0 4px 4px; border-radius: 0 0 0 12px; }
        .scan-corner-br { bottom: -2px; right: -2px; border-width: 0 4px 4px 0; border-radius: 0 0 12px 0; }
        .scan-line {
            position: absolute;
            left: 8px;
            right: 8px;
            height: 2px;
            background: linear-gradient(90deg, transparent, #00c0ff, transparent);
            animation: scanMove 2s ease-in-out infinite;
            z-index: 11;
            border-radius: 1px;
            filter: blur(1px);
        }
        @keyframes scanMove {
            0% { top: 12px; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: calc(100% - 12px); opacity: 0; }
        }
        #reader__dashboard_section {
            background: transparent !important;
        }
        #reader__dashboard_section_csr button {
            background: rgba(255,255,255,0.1) !important;
            color: white !important;
            border: 1px solid rgba(255,255,255,0.2) !important;
            border-radius: 999px !important;
            padding: 8px 20px !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
        }
        #reader__dashboard_section_csr button:hover {
            background: rgba(255,255,255,0.2) !important;
        }
        #reader__dashboard_section_csr span {
            color: rgba(255,255,255,0.5) !important;
            font-size: 12px !important;
        }
    </style>
</head>

<body class="min-h-screen" style="background: #0D1F3C;">
    <div class="min-h-screen flex flex-col">
        <!-- Header with Logo & Brand -->
        <div class="px-5 pt-5 pb-3">
            <div class="flex items-center justify-between">
                <button onclick="goBack()"
                    class="w-10 h-10 bg-white/10 backdrop-blur rounded-full flex items-center justify-center active:scale-90 transition">
                    <i data-lucide="arrow-left" class="w-5 h-5 text-white"></i>
                </button>
                <div class="flex items-center gap-2">
                    <img src="{{ asset('assets/images/logo/logo-sm.png') }}"
                        alt="Mendunia.id"
                        class="w-7 h-7 object-contain"
                        onerror="this.style.display='none'">
                    <span class="text-white font-bold text-sm tracking-wide">Mendunia.id</span>
                </div>
                <div class="w-10"></div>
            </div>
        </div>

        <!-- Title Section -->
        <div class="px-5 pt-2 pb-1 text-center">
            <h1 class="text-xl font-bold text-white">Scan Barcode Absensi</h1>
            <p class="text-gray-400 text-sm mt-1.5 max-w-xs mx-auto leading-relaxed">
                Arahkan kamera ke QR Code yang tersedia di cabang untuk melakukan absensi masuk
            </p>
        </div>

        <!-- Scanner Area -->
        <div class="flex-1 flex flex-col items-center justify-center px-5 py-4">
            <div class="relative w-full max-w-xs">
                <div id="reader" class="rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/10"></div>
                <div class="scan-overlay hidden md:block">
                    <div class="scan-corner scan-corner-tl"></div>
                    <div class="scan-corner scan-corner-tr"></div>
                    <div class="scan-corner scan-corner-bl"></div>
                    <div class="scan-corner scan-corner-br"></div>
                </div>
                <div class="scan-line hidden md:block"></div>
            </div>

            <div id="scanResult" class="hidden mt-5 w-full max-w-sm"></div>

            <div class="mt-6 text-center">
                <div class="flex items-center justify-center gap-2 bg-white/5 rounded-full px-5 py-2.5 backdrop-blur">
                    <i data-lucide="scan-line" class="w-4 h-4 text-blue-400"></i>
                    <span class="text-gray-400 text-xs">Tempatkan QR code di dalam bingkai</span>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="px-5 pb-6 text-center">
            <p class="text-gray-600 text-[10px]">Mendunia.id &mdash; Absensi Siswa via QR Code</p>
        </div>
    </div>

    <script>
        lucide.createIcons();

        function goBack() {
            window.location.href = '/absensi';
        }

        let html5QrCode = null;
        let lastScanned = '';

        function startScanner() {
            html5QrCode = new Html5Qrcode("reader");

            const config = {
                fps: 10,
                qrbox: { width: 240, height: 240 },
                aspectRatio: 1.0
            };

            html5QrCode.start(
                { facingMode: "environment" },
                config,
                onScanSuccess,
                onScanError
            ).catch(function(err) {
                $('#reader').html(`
                    <div class="p-8 text-center">
                        <div class="w-16 h-16 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i data-lucide="camera-off" class="w-8 h-8 text-red-400"></i>
                        </div>
                        <p class="text-red-400 text-sm font-semibold mb-1">Kamera tidak dapat diakses</p>
                        <p class="text-gray-500 text-xs">${err}</p>
                    </div>
                `);
                lucide.createIcons();
            });
        }

        function onScanSuccess(decodedText, decodedResult) {
            if (lastScanned === decodedText) return;
            lastScanned = decodedText;

            html5QrCode.pause();

            $('#scanResult').removeClass('hidden').html(`
                <div class="bg-gray-800/80 backdrop-blur rounded-2xl p-5 text-center border border-white/5">
                    <div class="w-14 h-14 bg-yellow-900/40 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i data-lucide="loader-circle" class="w-7 h-7 text-yellow-400 animate-spin"></i>
                    </div>
                    <p class="text-white font-semibold">Memproses Absensi...</p>
                    <p class="text-gray-400 text-xs mt-1">Harap tunggu sebentar</p>
                </div>
            `);
            lucide.createIcons();

            $.ajax({
                url: '{{ route("absensi.siswa.scan") }}',
                type: 'POST',
                data: {
                    _token: '{{ csrf_token() }}',
                    barcode: decodedText.trim()
                },
                success: function(res) {
                    const isPulang = res.status === 'pulang';
                    $('#scanResult').html(`
                        <div class="bg-gray-800/80 backdrop-blur rounded-2xl p-6 text-center border border-green-500/20 shadow-lg shadow-green-500/5">
                            <div class="w-16 h-16 bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i data-lucide="${isPulang ? 'log-out' : 'check-circle'}" class="w-8 h-8 text-green-400"></i>
                            </div>
                            <p class="text-green-400 font-bold text-lg">Absensi ${isPulang ? 'Pulang' : 'Masuk'} Berhasil!</p>
                            <div class="mt-3 bg-white/5 rounded-xl p-3 space-y-1">
                                <p class="text-white text-sm font-medium">${res.cabang}</p>
                                <p class="text-gray-400 text-xs">${res.jam}</p>
                            </div>
                            <div class="mt-5 flex gap-2 justify-center">
                                <button onclick="resetScanner()"
                                    class="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold active:scale-95 transition">
                                    <i data-lucide="scan-line" class="w-4 h-4 inline mr-1.5"></i>Scan Lagi
                                </button>
                                <button onclick="goToHome()"
                                    class="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl text-sm font-semibold active:scale-95 transition">
                                    Selesai
                                </button>
                            </div>
                        </div>
                    `);
                    lucide.createIcons();
                },
                error: function(xhr) {
                    let msg = xhr.responseJSON?.message || 'Gagal memproses absensi';
                    $('#scanResult').html(`
                        <div class="bg-gray-800/80 backdrop-blur rounded-2xl p-6 text-center border border-red-500/20 shadow-lg shadow-red-500/5">
                            <div class="w-16 h-16 bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i data-lucide="x-circle" class="w-8 h-8 text-red-400"></i>
                            </div>
                            <p class="text-red-400 font-bold text-lg">Absensi Gagal</p>
                            <p class="text-gray-300 text-sm mt-2">${msg}</p>
                            <div class="mt-5">
                                <button onclick="resetScanner()"
                                    class="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold active:scale-95 transition">
                                    <i data-lucide="refresh-cw" class="w-4 h-4 inline mr-1.5"></i>Coba Lagi
                                </button>
                            </div>
                        </div>
                    `);
                    lucide.createIcons();
                }
            });
        }

        function onScanError(err) {}

        function resetScanner() {
            lastScanned = '';
            $('#scanResult').addClass('hidden').html('');
            html5QrCode.resume();
        }

        function goToHome() {
            window.location.href = '/absensi';
        }

        $(document).ready(function() {
            startScanner();
        });
    </script>
</body>

</html>
