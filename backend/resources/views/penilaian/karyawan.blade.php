<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Penilaian Siswa</title>
    <link rel="icon" href="{{ asset('assets/images/logo/logo-sm.png') }}" type="image/png">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <meta name="csrf-token" content="{{ csrf_token() }}">
</head>
<body class="bg-gray-50 pb-24">

    {{-- Header --}}
    <div class="bg-white px-5 pt-4 pb-5 shadow-sm">
        <div class="flex items-center gap-3">
            <a href="/absensi" class="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center active:scale-95 transition">
                <i data-lucide="arrow-left" class="w-5 h-5 text-gray-700"></i>
            </a>
            <div>
                <h1 class="text-lg font-bold text-gray-900">Penilaian Siswa</h1>
                <p class="text-xs text-gray-500">Kelola nilai dan evaluasi siswa</p>
            </div>
        </div>
    </div>

    @if(session('success'))
    <div class="mx-5 mt-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
        <i data-lucide="check-circle" class="w-5 h-5 text-green-500 flex-shrink-0"></i>
        {{ session('success') }}
    </div>
    @endif

    {{-- Stats Cards --}}
    <div class="px-5 pt-5">
        <div class="grid grid-cols-2 gap-3">
            <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <i data-lucide="users" class="w-5 h-5 text-blue-600"></i>
                    </div>
                    <div>
                        <p class="text-[10px] text-gray-500">Siswa Dinilai</p>
                        <p class="text-xl font-bold text-gray-900">{{ $penilaians->count() }}</p>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <i data-lucide="trending-up" class="w-5 h-5 text-emerald-600"></i>
                    </div>
                    <div>
                        <p class="text-[10px] text-gray-500">Rata-rata Nilai</p>
                        <p class="text-xl font-bold text-gray-900">{{ $penilaians->avg('nilai') ? number_format($penilaians->avg('nilai'), 1) : '-' }}</p>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <i data-lucide="book-open" class="w-5 h-5 text-purple-600"></i>
                    </div>
                    <div>
                        <p class="text-[10px] text-gray-500">Mapel</p>
                        <p class="text-xl font-bold text-gray-900">{{ $penilaians->pluck('mata_pelajaran')->unique()->filter()->count() }}</p>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                        <i data-lucide="layers" class="w-5 h-5 text-amber-600"></i>
                    </div>
                    <div>
                        <p class="text-[10px] text-gray-500">Kelas</p>
                        <p class="text-xl font-bold text-gray-900">{{ $penilaians->pluck('kelas')->unique()->filter()->count() }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    {{-- Daftar Penilaian --}}
    <div class="px-5 pt-5">
        <div class="flex items-center justify-between mb-3">
            <h2 class="text-base font-bold text-gray-900">Daftar Penilaian</h2>
            <span class="text-xs text-gray-400">{{ $penilaians->count() }} data</span>
        </div>

        <div class="space-y-3">
            @forelse($penilaians as $p)
            @php
                $nilai = $p->nilai;
                if ($nilai >= 90) $warna = 'text-green-600 bg-green-100';
                elseif ($nilai >= 75) $warna = 'text-blue-600 bg-blue-100';
                elseif ($nilai >= 60) $warna = 'text-amber-600 bg-amber-100';
                elseif ($nilai) $warna = 'text-red-600 bg-red-100';
                else $warna = 'text-gray-400 bg-gray-100';
            @endphp
            <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <h3 class="font-bold text-gray-900">{{ $p->nama_siswa }}</h3>
                            @if($p->nilai)
                            <span class="text-xs font-bold px-2 py-0.5 rounded-full {{ $warna }}">{{ number_format($nilai, 0) }}</span>
                            @endif
                        </div>
                        <div class="flex flex-wrap gap-2 text-[10px] text-gray-500">
                            @if($p->kelas)
                            <span class="flex items-center gap-1"><i data-lucide="layers" class="w-3 h-3"></i>{{ $p->kelas }}</span>
                            @endif
                            @if($p->mata_pelajaran)
                            <span class="flex items-center gap-1"><i data-lucide="book-open" class="w-3 h-3"></i>{{ $p->mata_pelajaran }}</span>
                            @endif
                            <span class="flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3"></i>{{ $p->tanggal_penilaian->format('d/m/Y') }}</span>
                        </div>
                        @if($p->keterangan)
                        <p class="text-xs text-gray-400 mt-2">{{ $p->keterangan }}</p>
                        @endif
                    </div>
                    <div class="flex gap-1">
                        <button onclick="editPenilaian({{ $p->id }}, '{{ $p->nama_siswa }}', '{{ $p->kelas }}', '{{ $p->mata_pelajaran }}', '{{ $p->nilai }}', '{{ $p->keterangan }}', '{{ $p->tanggal_penilaian->format('Y-m-d') }}')"
                            class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center active:scale-95 transition">
                            <i data-lucide="pencil" class="w-4 h-4 text-gray-600"></i>
                        </button>
                        <button onclick="deletePenilaian({{ $p->id }})"
                            class="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center active:scale-95 transition">
                            <i data-lucide="trash-2" class="w-4 h-4 text-red-500"></i>
                        </button>
                    </div>
                </div>
            </div>
            @empty
            <div class="text-center py-12 text-gray-400">
                <i data-lucide="notebook" class="w-16 h-16 mx-auto mb-3 opacity-50"></i>
                <p class="text-sm font-medium">Belum ada data penilaian</p>
                <p class="text-xs mt-1">Klik tombol + untuk menambahkan</p>
            </div>
            @endforelse
        </div>
    </div>

    {{-- FAB Tambah --}}
    <button onclick="openTambahModal()"
        class="fixed bottom-24 right-5 w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition z-40">
        <i data-lucide="plus" class="w-7 h-7 text-white"></i>
    </button>

    {{-- Modal Tambah --}}
    <div id="modalTambah" class="fixed inset-0 z-50 hidden">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" onclick="closeModal('modalTambah')"></div>
        <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-6 shadow-2xl transition-transform duration-300 translate-y-full" id="modalTambahContent">
            <div class="flex flex-col items-center">
                <div class="w-12 h-1.5 bg-gray-200 rounded-full mb-6"></div>
                <div class="flex justify-between items-center w-full mb-4">
                    <h2 class="text-lg font-black text-gray-900">Tambah Penilaian</h2>
                    <button onclick="closeModal('modalTambah')" class="p-2 bg-gray-100 rounded-full text-gray-500">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <form id="formTambah" action="{{ route('penilaian.store') }}" method="POST" class="w-full space-y-4">
                    @csrf
                    <div>
                        <label class="text-xs font-semibold text-gray-700 mb-1 block">Nama Siswa <span class="text-red-500">*</span></label>
                        <input type="text" name="nama_siswa" required
                            class="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-xs font-semibold text-gray-700 mb-1 block">Kelas <span class="text-red-500">*</span></label>
                            <select name="kelas" required
                                class="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none">
                                <option value="">Pilih Kelas</option>
                                @foreach($kelasList as $kelas)
                                <option value="{{ $kelas->nama_kelas }}">{{ $kelas->nama_kelas }} (Level {{ $kelas->level }})</option>
                                @endforeach
                            </select>
                        </div>
                        <div>
                            <label class="text-xs font-semibold text-gray-700 mb-1 block">Nilai</label>
                            <input type="number" name="nilai" min="0" max="100" step="0.01" placeholder="0-100"
                                class="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none">
                        </div>
                    </div>
                    <div>
                        <label class="text-xs font-semibold text-gray-700 mb-1 block">Mata Pelajaran</label>
                        <input type="text" name="mata_pelajaran" placeholder="Matematika"
                            class="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none">
                    </div>
                    <div>
                        <label class="text-xs font-semibold text-gray-700 mb-1 block">Tanggal Penilaian <span class="text-red-500">*</span></label>
                        <input type="date" name="tanggal_penilaian" value="{{ date('Y-m-d') }}" required
                            class="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none">
                    </div>
                    <div>
                        <label class="text-xs font-semibold text-gray-700 mb-1 block">Keterangan</label>
                        <textarea name="keterangan" rows="2" placeholder="Catatan tambahan..."
                            class="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"></textarea>
                    </div>
                    <button type="submit"
                        class="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-2xl font-bold text-sm active:scale-95 transition">
                        Simpan Penilaian
                    </button>
                </form>
            </div>
        </div>
    </div>

    {{-- Modal Edit --}}
    <div id="modalEdit" class="fixed inset-0 z-50 hidden">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" onclick="closeModal('modalEdit')"></div>
        <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-6 shadow-2xl transition-transform duration-300 translate-y-full" id="modalEditContent">
            <div class="flex flex-col items-center">
                <div class="w-12 h-1.5 bg-gray-200 rounded-full mb-6"></div>
                <div class="flex justify-between items-center w-full mb-4">
                    <h2 class="text-lg font-black text-gray-900">Edit Penilaian</h2>
                    <button onclick="closeModal('modalEdit')" class="p-2 bg-gray-100 rounded-full text-gray-500">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <form id="formEdit" method="POST" class="w-full space-y-4">
                    @csrf
                    @method('PUT')
                    <div>
                        <label class="text-xs font-semibold text-gray-700 mb-1 block">Nama Siswa <span class="text-red-500">*</span></label>
                        <input type="text" name="nama_siswa" id="edit_nama_siswa" required
                            class="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-xs font-semibold text-gray-700 mb-1 block">Kelas <span class="text-red-500">*</span></label>
                            <select name="kelas" id="edit_kelas" required
                                class="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none">
                                <option value="">Pilih Kelas</option>
                                @foreach($kelasList as $kelas)
                                <option value="{{ $kelas->nama_kelas }}">{{ $kelas->nama_kelas }} (Level {{ $kelas->level }})</option>
                                @endforeach
                            </select>
                        </div>
                        <div>
                            <label class="text-xs font-semibold text-gray-700 mb-1 block">Nilai</label>
                            <input type="number" name="nilai" id="edit_nilai" min="0" max="100" step="0.01"
                                class="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none">
                        </div>
                    </div>
                    <div>
                        <label class="text-xs font-semibold text-gray-700 mb-1 block">Mata Pelajaran</label>
                        <input type="text" name="mata_pelajaran" id="edit_mata_pelajaran"
                            class="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none">
                    </div>
                    <div>
                        <label class="text-xs font-semibold text-gray-700 mb-1 block">Tanggal Penilaian <span class="text-red-500">*</span></label>
                        <input type="date" name="tanggal_penilaian" id="edit_tanggal" required
                            class="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none">
                    </div>
                    <div>
                        <label class="text-xs font-semibold text-gray-700 mb-1 block">Keterangan</label>
                        <textarea name="keterangan" id="edit_keterangan" rows="2"
                            class="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"></textarea>
                    </div>
                    <button type="submit"
                        class="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-2xl font-bold text-sm active:scale-95 transition">
                        Simpan Perubahan
                    </button>
                </form>
            </div>
        </div>
    </div>

    {{-- Bottom Nav --}}
    @include('components.bottom_Nav')

    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script>
        lucide.createIcons();

        function openTambahModal() {
            const modal = document.getElementById('modalTambah');
            const content = document.getElementById('modalTambahContent');
            modal.classList.remove('hidden');
            setTimeout(() => {
                content.classList.remove('translate-y-full');
                content.classList.add('translate-y-0');
            }, 10);
        }

        function closeModal(id) {
            const content = document.getElementById(id + 'Content');
            content.classList.remove('translate-y-0');
            content.classList.add('translate-y-full');
            setTimeout(() => {
                document.getElementById(id).classList.add('hidden');
            }, 300);
        }

        function editPenilaian(id, nama, kelas, mapel, nilai, keterangan, tanggal) {
            document.getElementById('edit_nama_siswa').value = nama;
            document.getElementById('edit_kelas').value = kelas === '-' ? '' : kelas;
            document.getElementById('edit_mata_pelajaran').value = mapel === '-' ? '' : mapel;
            document.getElementById('edit_nilai').value = nilai === '-' ? '' : nilai;
            document.getElementById('edit_keterangan').value = keterangan === '-' ? '' : keterangan;
            document.getElementById('edit_tanggal').value = tanggal;

            let url = '{{ route("penilaian.update", ":id") }}';
            url = url.replace(':id', id);
            document.getElementById('formEdit').action = url;

            const modal = document.getElementById('modalEdit');
            const content = document.getElementById('modalEditContent');
            modal.classList.remove('hidden');
            setTimeout(() => {
                content.classList.remove('translate-y-full');
                content.classList.add('translate-y-0');
            }, 10);
        }

        function deletePenilaian(id) {
            Swal.fire({
                title: 'Hapus penilaian?',
                text: 'Data akan dihapus permanen',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Ya, Hapus',
                cancelButtonText: 'Batal',
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#6b7280',
            }).then((result) => {
                if (result.isConfirmed) {
                    fetch('/penilaian/' + id, {
                        method: 'POST',
                        headers: {
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                            'Accept': 'application/json',
                        },
                        body: new URLSearchParams({ _method: 'DELETE' })
                    }).then(() => location.reload());
                }
            });
        }
    </script>
</body>
</html>
