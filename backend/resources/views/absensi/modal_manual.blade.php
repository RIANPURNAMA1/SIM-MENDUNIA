<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Absensi Geofencing</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://cdn.jsdelivr.net/npm/face-api.js"></script>

    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

        * {
            box-sizing: border-box;
        }

        html, body {
            margin: 0;
            padding: 0;
            overflow-x: hidden;
        }

        body {
            font-family: 'Inter', sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        /* ============================================
           PERFORMANCE OPTIMIZATIONS
           ============================================ */

        video {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
            -webkit-backface-visibility: hidden;
            backface-visibility: hidden;
            will-change: transform;
        }

        canvas {
            position: absolute;
            top: 0;
            left: 0;
            display: block;
            -webkit-backface-visibility: hidden;
            backface-visibility: hidden;
            will-change: transform;
        }

        /* Video container */
        .video-container {
            contain: layout style paint;
            background: #111;
            position: relative;
            width: 280px;
            aspect-ratio: 1;
        }

        /* Progress spinner */
        .progress-spinner {
            position: absolute;
            inset: 0;
            border-radius: 9999px;
            border: 4px solid transparent;
            border-top-color: #2563eb;
            border-right-color: #2563eb;
            animation: spin 2s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Buttons */
        button {
            will-change: background-color;
            transition: background-color 150ms ease;
        }

        button:active {
            transform: scale(0.98);
        }

        /* Modal animations */
        .modal-fade-in {
            animation: modalFadeIn 0.3s ease-out forwards;
        }

        .modal-fade-out {
            animation: modalFadeOut 0.25s ease-in forwards;
        }

        @keyframes modalFadeIn {
            from {
                opacity: 0;
                transform: scale(0.95);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }

        @keyframes modalFadeOut {
            from {
                opacity: 1;
                transform: scale(1);
            }
            to {
                opacity: 0;
                transform: scale(0.95);
            }
        }

        /* Reduce motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
            * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        }
    </style>
</head>

<body class="bg-slate-50 min-h-screen">

    <!-- TAILWIND MODAL (OPTIMIZED) -->
    <div id="modalAbsenManual" class="hidden fixed inset-0 bg-black/80 z-[60] p-4 backdrop-blur-sm flex items-center justify-center"
        style="will-change: opacity; contain: layout style paint;">
        
        <div class="modal-card bg-white rounded-3xl p-6 relative w-full max-w-sm flex flex-col items-center shadow-2xl"
            style="will-change: transform;">

            <!-- Status Icon -->
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 flex-shrink-0">
                <svg id="statusIconAbsen" class="w-8 h-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" 
                    width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <polyline points="16 11 18 13 22 9"></polyline>
                </svg>
            </div>

            <!-- Title & Instructions -->
            <h3 class="font-bold text-xl text-gray-900 mb-1 text-center">Presensi Wajah</h3>
            <p id="instructionTextAbsen" class="text-gray-500 text-sm text-center mb-5 min-h-[2.5rem]">
                Posisikan wajah di tengah lingkaran dan diam sebentar...
            </p>

            <!-- VIDEO CONTAINER -->
            <div class="video-container rounded-full overflow-hidden border-4 border-blue-100 shadow-xl mx-auto">
                <video id="videoStream" autoplay muted playsinline webkit-playsinline 
                    style="width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1);"></video>
                <canvas id="canvasStream" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></canvas>

                <!-- Progress Spinner -->
                <div class="progress-spinner"></div>
            </div>

            <!-- Timer & Info -->
            <div class="mt-6 w-full">
                <p id="timerTextAbsen" class="text-center font-bold text-blue-600 text-lg h-7"></p>
                <p class="text-[10px] text-center text-gray-400 italic">
                    Sistem akan mengambil foto otomatis saat posisi stabil
                </p>
            </div>

            <!-- Buttons -->
            <div class="mt-6 w-full space-y-3">
                <button id="btnBatalAbsen" type="button"
                    class="w-full py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold transition-colors cursor-pointer">
                    Batal
                </button>

                <button id="btnKembaliDashboard" type="button"
                    class="w-full py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold transition-colors cursor-pointer">
                    Kembali ke Dashboard
                </button>
            </div>

        </div>
    </div>


</body>

</html>