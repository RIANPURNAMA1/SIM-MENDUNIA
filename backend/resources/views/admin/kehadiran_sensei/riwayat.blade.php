@extends('app')

@section('content')
 <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <div class="min-h-screen bg-gray-50 py-6">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div class="mb-6">
                <a href="/data-kehadiran-sensei" class="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-4">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                    </svg>
                    <span>Kembali</span>
                </a>
                <h1 class="text-2xl font-bold text-gray-900">Riwayat Absensi Sensei</h1>
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                    <div>
                        <h2 class="text-xl font-bold text-gray-900 mb-2">{{ $kelas->nama_kelas }}</h2>
                        <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span class="inline-flex items-center gap-1.5">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                                </svg>
                                Level: {{ $kelas->level }}
                            </span>
                            <span class="inline-flex items-center gap-1.5">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                </svg>
                                Sensei: {{ $kelas->user->name ?? '-' }}
                            </span>
                            <span class="inline-flex items-center gap-1.5">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                                {{ \Carbon\Carbon::parse($kelas->tanggal_mulai)->format('d M Y') }} - {{ \Carbon\Carbon::parse($kelas->tanggal_selesai)->format('d M Y') }}
                            </span>
                        </div>
                    </div>
                    <div class="flex flex-wrap items-center gap-4">
                        <span class="inline-flex items-center gap-1.5 text-sm text-green-600">
                            <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                            {{ $stats['hadir'] }} Hadir
                        </span>
                        <span class="inline-flex items-center gap-1.5 text-sm text-red-600">
                            <span class="w-2 h-2 bg-red-500 rounded-full"></span>
                            {{ $stats['terlambat'] }} Terlambat
                        </span>
                        <span class="inline-flex items-center gap-1.5 text-sm text-amber-600">
                            <span class="w-2 h-2 bg-amber-500 rounded-full"></span>
                            {{ $stats['pulang_cepat'] }} Pulang Cepat
                        </span>
                        <span class="inline-flex items-center gap-1.5 text-sm text-gray-500">
                            <span class="w-2 h-2 bg-gray-400 rounded-full"></span>
                            {{ $stats['tidak_pulang'] }} Tidak Pulang
                        </span>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="px-6 py-4 border-b border-gray-100">
                    <h3 class="font-semibold text-gray-900">Detail Pertemuan ({{ $absensis->count() }} / {{ $totalPertemuan }} Pertemuan)</h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pertemuan</th>
                                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jam Masuk</th>
                                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jam Pulang</th>
                                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th class="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            @forelse($absensis as $absen)
                                <tr class="hover:bg-gray-50 transition">
                                    <td class="px-6 py-4 text-center">
                                        <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold">
                                            {{ $absen->pertemuan_ke }}
                                        </span>
                                        <p class="text-xs text-gray-400 mt-1">dari {{ $totalPertemuan }}</p>
                                    </td>
                                    <td class="px-6 py-4 text-sm text-gray-900">
                                        {{ \Carbon\Carbon::parse($absen->tanggal)->format('d M Y') }}
                                    </td>
                                    <td class="px-6 py-4 text-sm text-gray-900">
                                        {{ $absen->jam_masuk ?? '-' }}
                                    </td>
                                    <td class="px-6 py-4 text-sm text-gray-900">
                                        {{ $absen->jam_keluar ?? '-' }}
                                    </td>
                                    <td class="px-6 py-4">
                                        @php
                                            $statusBadge = [
                                                'HADIR' => 'bg-green-100 text-green-700',
                                                'TERLAMBAT' => 'bg-red-100 text-red-700',
                                                'PULANG LEBIH AWAL' => 'bg-amber-100 text-amber-700',
                                                'TIDAK ABSEN PULANG' => 'bg-gray-100 text-gray-700',
                                            ];
                                            $badgeClass = $statusBadge[$absen->status] ?? 'bg-gray-100 text-gray-700';
                                        @endphp
                                        <span class="inline-flex px-3 py-1 text-xs font-semibold rounded-full {{ $badgeClass }}">
                                            {{ $absen->status }}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-center">
                                        <button onclick="editStatus({{ $absen->id }}, '{{ $absen->status }}')" class="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="6" class="px-6 py-12 text-center">
                                        <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                        </svg>
                                        <p class="text-gray-500">Belum ada data absensi</p>
                                    </td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <div id="modalEditStatus" class="fixed inset-0 z-50 hidden">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" onclick="closeModal()"></div>
        <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 shadow-2xl">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-lg font-bold text-gray-900">Edit Status Absensi</h3>
                <button onclick="closeModal()" class="p-2 hover:bg-gray-100 rounded-full transition">
                    <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <form action="/admin/kehadiran-sensei/update-status" method="POST">
                @csrf
                <input type="hidden" name="id" id="editId">
                <div class="mb-6">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Status Baru</label>
                    <select name="status" id="editStatus" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                        <option value="HADIR">HADIR</option>
                        <option value="TERLAMBAT">TERLAMBAT</option>
                        <option value="PULANG LEBIH AWAL">PULANG LEBIH AWAL</option>
                        <option value="TIDAK ABSEN PULANG">TIDAK ABSEN PULANG</option>
                    </select>
                </div>
                <div class="flex gap-3">
                    <button type="button" onclick="closeModal()" class="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition">
                        Batal
                    </button>
                    <button type="submit" class="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
                        Simpan
                    </button>
                </div>
            </form>
        </div>
    </div>

    @if(session('success'))
        <div id="successToast" class="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <span>{{ session('success') }}</span>
        </div>
        <script>
            setTimeout(() => {
                document.getElementById('successToast').style.display = 'none';
            }, 3000);
        </script>
    @endif

    <script>
        function editStatus(id, status) {
            document.getElementById('editId').value = id;
            document.getElementById('editStatus').value = status;
            document.getElementById('modalEditStatus').classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            document.getElementById('modalEditStatus').classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    </script>
@endsection
