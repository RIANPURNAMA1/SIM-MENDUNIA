@extends('app')

@section('content')
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <style>
        body { background-color: #f8fafc; font-family: 'Inter', sans-serif; }
        .card-shadow { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    </style>

    <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            
            <div class="bg-white p-5 rounded-xl border border-gray-200 card-shadow">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold text-blue-700 border-l-4 border-blue-600 pl-3 uppercase text-sm">Paket Aktif</h3>
                </div>
                <div class="space-y-3">
                    <div class="flex items-center gap-3">
                        <i class="ph ph-briefcase text-2xl text-gray-400"></i>
                        <div>
                            <p class="text-xs text-gray-500">Layanan</p>
                            <p class="font-semibold text-sm">Absenku Bimasakti</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <i class="ph ph-users-three text-2xl text-gray-400"></i>
                        <div>
                            <p class="text-xs text-gray-500">Karyawan</p>
                            <p class="font-semibold text-sm">{{ $karyawanAktif ?? 0 }} dari Maksimal 30 Karyawan</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <i class="ph ph-calendar-check text-2xl text-gray-400"></i>
                        <div>
                            <p class="text-xs text-gray-500">Masa Aktif</p>
                            <p class="font-semibold text-sm">14 Agustus 2025 - 14 Februari 2026</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white p-5 rounded-xl border border-gray-200 card-shadow">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold text-blue-700 border-l-4 border-blue-600 pl-3 uppercase text-sm">Karyawan</h3>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex items-center gap-2">
                        <i class="ph ph-gender-male text-blue-500 text-3xl"></i>
                        <div>
                            <p class="text-xs text-gray-500">Laki - Laki</p>
                            <p class="font-bold">45% <span class="text-[10px] font-normal">(9 Orang)</span></p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <i class="ph ph-gender-female text-orange-400 text-3xl"></i>
                        <div>
                            <p class="text-xs text-gray-500">Perempuan</p>
                            <p class="font-bold">55% <span class="text-[10px] font-normal">(11 Orang)</span></p>
                        </div>
                    </div>
                    <div class="mt-2 pt-2 border-t border-gray-100 col-span-2 flex justify-between items-center">
                        <span class="text-xs text-gray-500">Total Karyawan</span>
                        <span class="font-bold text-lg text-blue-800">{{ $totalKaryawan ?? 20 }} Orang</span>
                    </div>
                </div>
            </div>

            <div class="bg-white p-5 rounded-xl border border-gray-200 card-shadow">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold text-blue-700 border-l-4 border-blue-600 pl-3 uppercase text-sm">Pengaturan</h3>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs mb-4">
                    <a href="#" class="flex items-center gap-1 text-teal-600 hover:underline"><i class="ph ph-map-pin"></i> Lokasi Absensi</a>
                    <a href="#" class="flex items-center gap-1 text-teal-600 hover:underline"><i class="ph ph-check-square"></i> Approval Izin</a>
                    <a href="#" class="flex items-center gap-1 text-teal-600 hover:underline"><i class="ph ph-clock"></i> Jam Kerja</a>
                    <a href="#" class="flex items-center gap-1 text-teal-600 hover:underline"><i class="ph ph-calendar-plus"></i> Approval Lembur</a>
                </div>
                <div class="flex gap-2 border-t pt-3">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" class="h-8">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" class="h-8">
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div class="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 card-shadow">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-blue-700 border-l-4 border-blue-600 pl-3 uppercase text-sm">Rekap Absensi Hari Ini</h3>
                    <div class="text-xs text-gray-400 font-medium">{{ date('l, d F Y') }}</div>
                </div>

                <div class="flex flex-col md:flex-row items-center gap-8">
                    <div class="relative w-48 h-48">
                        <canvas id="absensiDonut"></canvas>
                        <div class="absolute inset-0 flex flex-col items-center justify-center">
                            <span class="text-gray-500 text-xs">Belum Absen</span>
                            <span class="text-2xl font-bold">{{ $belumAbsen ?? 20 }}</span>
                        </div>
                    </div>

                    <div class="flex-1 w-full text-sm">
                        <div class="grid grid-cols-1 gap-1">
                            <div class="flex justify-between p-2 border-b border-gray-50">
                                <span class="text-gray-500">Hadir</span>
                                <span class="font-bold text-blue-600">{{ $hadirHariIni ?? 0 }} <small class="font-normal text-gray-400 italic">Karyawan</small></span>
                            </div>
                            <div class="flex justify-between p-2 border-b border-gray-50">
                                <span class="text-gray-500">Terlambat</span>
                                <span class="font-bold text-orange-500">{{ $terlambat ?? 0 }} <small class="font-normal text-gray-400 italic">Karyawan</small></span>
                            </div>
                            <div class="flex justify-between p-2 border-b border-gray-50 bg-red-50/50">
                                <span class="text-gray-700 font-medium">Belum Absen</span>
                                <span class="font-bold text-red-600">{{ $belumAbsen ?? 20 }} <small class="font-normal text-gray-400 italic">Karyawan</small></span>
                            </div>
                            <div class="flex justify-between p-2 border-b border-gray-50">
                                <span class="text-gray-500">Cuti / Izin / Sakit</span>
                                <span class="font-bold text-teal-600">0 <small class="font-normal text-gray-400 italic">Karyawan</small></span>
                            </div>
                        </div>
                        <div class="mt-4 flex gap-2">
                            <button class="bg-teal-500 text-white px-3 py-1.5 rounded text-xs flex items-center gap-1 hover:bg-teal-600 transition">
                                <i class="ph ph-calendar"></i> Kalender Absensi
                            </button>
                            <button class="border border-teal-500 text-teal-600 px-3 py-1.5 rounded text-xs hover:bg-teal-50 transition">
                                Lihat Semua
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white p-6 rounded-xl border border-gray-200 card-shadow">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-blue-700 border-l-4 border-blue-600 pl-3 uppercase text-sm">Daftar Pengajuan</h3>
                </div>
                
                <div class="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    <div class="p-3 bg-gray-50 rounded-lg border-l-4 border-red-500">
                        <div class="flex justify-between items-start mb-1">
                            <p class="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                                <i class="ph ph-clock"></i> SELASA, 10 Februari 2026
                            </p>
                            <span class="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">SAKIT</span>
                        </div>
                        <p class="text-xs font-bold text-gray-700 uppercase">Lutfi Nurul Hasanah</p>
                        <p class="text-[10px] text-gray-400">Belum Disetujui oleh Admin</p>
                    </div>

                    <div class="p-3 bg-gray-50 rounded-lg border-l-4 border-teal-500">
                        <div class="flex justify-between items-start mb-1">
                            <p class="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                                <i class="ph ph-clock"></i> SENIN, 09 Februari 2026
                            </p>
                            <span class="bg-teal-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">IZIN</span>
                        </div>
                        <p class="text-xs font-bold text-gray-700 uppercase">Lutfi Nurul Hasanah</p>
                        <p class="text-[10px] text-gray-400">Belum Disetujui oleh Admin</p>
                    </div>
                </div>

                <button class="w-full mt-6 py-2 border border-blue-600 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-50 transition">
                    LIHAT SEMUA
                </button>
            </div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const ctx = document.getElementById('absensiDonut').getContext('2d');
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    datasets: [{
                        data: [0, 0, 20, 0], // Sesuai data: Hadir, Terlambat, Belum Absen, Izin
                        backgroundColor: ['#3b82f6', '#f59e0b', '#ef4444', '#10b981'],
                        borderWidth: 0,
                        cutout: '80%'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                }
            });
        });
    </script>
@endsection