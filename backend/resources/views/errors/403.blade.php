<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Redirect ke Dashboard</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex,nofollow">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
        }
        .float-animation { animation: float 3s ease-in-out infinite; }
    </style>
</head>

<body class="min-h-screen bg-slate-50 flex items-center justify-center px-4">

    <div class="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center border border-gray-100">

        <div class="relative w-28 h-28 mx-auto mb-8">
            <div class="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-20"></div>
            
            <div class="relative w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-400 rounded-full flex items-center justify-center shadow-lg float-animation">
                <svg class="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                          d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.59 8.31m5.84 2.58a14.98 14.98 0 01-6.16 12.12A14.98 14.98 0 012.33 10.9m5.84-2.59a6 6 0 00-7.38 5.84h4.8m2.58-5.84a14.96 14.96 0 0012.12-6.16m-12.12 6.16a14.96 14.96 0 01-12.12 6.16">
                    </path>
                    <circle cx="12" cy="12" r="3" stroke-width="2"></circle>
                </svg>
            </div>
        </div>

        <h1 class="text-3xl font-extrabold text-gray-800 mb-3 tracking-tight">
            Siap Meluncur?
        </h1>

        <p class="text-base text-gray-500 mb-10 leading-relaxed">
            Halaman yang Anda tuju memerlukan navigasi ulang. Klik tombol di bawah untuk kembali ke <span class="font-semibold text-blue-600">Dashboard Utama</span>.
        </p>

        <div class="space-y-4">
            <a href="/absensi"
               class="group relative flex items-center justify-center w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg transition-all duration-300 shadow-xl shadow-blue-200 overflow-hidden active:scale-95">
               <div class="absolute inset-0 w-1/2 h-full background-transparent bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[250%] transition-transform duration-700"></div>
               
               <span class="relative flex items-center">
                   Ke Dashboard
                   <svg class="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                   </svg>
               </span>
            </a>
            
            <div class="flex items-center justify-center gap-2">
                <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <p class="text-xs text-gray-400 font-medium uppercase tracking-widest">
                    Sistem Absensi Online
                </p>
            </div>
        </div>

    </div>

</body>
</html>