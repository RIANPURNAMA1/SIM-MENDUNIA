@extends('app')

@push('styles')
<style>
    .agenda-card { transition: all 0.2s ease; cursor: pointer; }
    .agenda-card:hover { transform: translateY(-2px); }
    .time-badge { font-size: 11px; padding: 4px 8px; border-radius: 6px; }
    .agenda-foto { width: 60px; height: 60px; object-fit: cover; border-radius: 8px; }
    .agenda-foto-modal { max-width: 100%; max-height: 300px; object-fit: contain; border-radius: 12px; }
</style>
@endpush

@section('content')
<div class="min-h-screen bg-gray-50 pb-20">
    <div class="bg-white p-4 shadow-sm border-b">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-xl font-bold text-gray-900">Agenda Hari Ini</h1>
                <p class="text-sm text-gray-500">{{ now()->format('d M Y') }}</p>
            </div>
            <button onclick="openModalAgenda()" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                + Tambah
            </button>
        </div>
    </div>

    <div class="px-4 pb-20" id="agendaList">
    </div>

    <button onclick="openModalAgenda()" class="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-blue-700 transition">
        <i data-lucide="plus" class="w-6 h-6"></i>
    </button>
</div>

@include('absensi.modal_agenda')

<input type="hidden" id="agendaJamMulai" value="{{ Auth::user()->shift ? Auth::user()->shift->jam_masuk : '' }}">
<input type="hidden" id="agendaJamSelesai" value="{{ Auth::user()->shift ? Auth::user()->shift->jam_pulang : '' }}">
@endsection

@push('scripts')
<script>
function formatTime(time) {
    if (!time) return '';
    return time.substring(0, 5);
}

function renderAgenda(agendas) {
    const container = document.getElementById('agendaList');
    
    if (agendas.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <i data-lucide="calendar" class="w-8 h-8 text-gray-400"></i>
                </div>
                <p class="text-gray-500 text-sm">Belum ada agenda hari ini</p>
                <button onclick="openModalAgenda()" class="text-blue-600 text-sm font-medium mt-2">
                    + Tambah Agenda
                </button>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }
    
    let html = '';
    agendas.forEach(agenda => {
        const jamMulai = formatTime(agenda.jam_mulai);
        const jamSelesai = formatTime(agenda.jam_selesai);
        const waktu = jamMulai && jamSelesai ? `${jamMulai} - ${jamSelesai}` : (jamMulai || '');
        
        let fotoHtml = '';
        if (agenda.foto) {
            fotoHtml = `<img src="/uploads/agenda/${agenda.foto}" alt="Foto" class="agenda-foto" onerror="this.style.display='none'">`;
        }
        
        html += `
            <div class="agenda-card bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100" onclick="openDetailAgenda(${agenda.id})">
                <div class="flex items-start gap-3">
                    ${fotoHtml}
                    <div class="flex-1">
                        <h3 class="font-semibold text-gray-900">${agenda.judul}</h3>
                        ${agenda.keterangan ? `<p class="text-xs text-gray-500 mt-1">${agenda.keterangan}</p>` : ''}
                        ${waktu ? `<span class="time-badge bg-blue-50 text-blue-600 mt-2 inline-block">${waktu}</span>` : ''}
                    </div>
                    <div class="flex gap-2">
                        <button onclick="event.stopPropagation(); completeAgenda(${agenda.id})" class="p-2 text-green-600 hover:bg-green-50 rounded-full">
                            <i data-lucide="check" class="w-4 h-4"></i>
                        </button>
                        <button onclick="event.stopPropagation(); deleteAgenda(${agenda.id})" class="p-2 text-red-600 hover:bg-red-50 rounded-full">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
}

function openDetailAgenda(id) {
    fetch('/absensi/agenda/' + id)
        .then(res => res.json())
        .then(agenda => {
            let modal = document.getElementById('modalAgendaDetail');
            if (!modal) {
                const modalHtml = `
                    <div id="modalAgendaDetail" class="fixed inset-0 z-50 hidden">
                        <div class="absolute inset-0 bg-black/40" onclick="closeDetailAgenda()"></div>
                        <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
                            <div class="flex justify-between items-start mb-4">
                                <div class="flex-1">
                                    <h2 id="detailJudul" class="text-xl font-bold text-gray-900"></h2>
                                    <p id="detailWaktu" class="text-sm text-gray-500"></p>
                                </div>
                                <button onclick="closeDetailAgenda()" class="p-2">
                                    <i data-lucide="x" class="w-5 h-5"></i>
                                </button>
                            </div>
                            <img id="detailFoto" class="w-full h-64 object-cover rounded-xl mb-4 hidden">
                            <p id="detailKeterangan" class="text-gray-600"></p>
                        </div>
                    </div>
                `;
                document.body.insertAdjacentHTML('beforeend', modalHtml);
                modal = document.getElementById('modalAgendaDetail');
            }
            
            document.getElementById('detailJudul').textContent = agenda.judul;
            const jamMulai = formatTime(agenda.jam_mulai);
            const jamSelesai = formatTime(agenda.jam_selesai);
            document.getElementById('detailWaktu').textContent = jamMulai && jamSelesai ? `${jamMulai} - ${jamSelesai}` : (jamMulai || 'Sepanjang hari');
            document.getElementById('detailKeterangan').textContent = agenda.keterangan || 'Tidak ada keterangan';
            
            const fotoEl = document.getElementById('detailFoto');
            if (agenda.foto) {
                fotoEl.src = '/uploads/agenda/' + agenda.foto;
                fotoEl.classList.remove('hidden');
            } else {
                fotoEl.classList.add('hidden');
            }
            
            modal.classList.remove('hidden');
            if (window.lucide) lucide.createIcons();
        });
}

function closeDetailAgenda() {
    document.getElementById('modalAgendaDetail').classList.add('hidden');
}

function loadAgenda() {
    fetch('/absensi/agenda/by-date')
        .then(res => res.json())
        .then(renderAgenda);
}

document.addEventListener('DOMContentLoaded', function() {
    loadAgenda();
});
</script>
@endpush
