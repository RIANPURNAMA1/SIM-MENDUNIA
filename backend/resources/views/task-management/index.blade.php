@extends('app')

@section('contentTask')
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>

    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Plus Jakarta Sans', 'sans-serif']
                    },
                    colors: {
                        brand: '#0067a3',
                        trelloGray: '#ebedf0',
                        trelloList: '#f1f2f4'
                    }
                }
            }
        }
    </script>

    <style>
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #bcc1c8;
            border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #a5adba;
        }

        .board-bg {
            background-color: #003e62;
            background-image: linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0) 100%);
        }

        /* --- SMOOTH ANIMATION CORE --- */
        .sortable-ghost {
            opacity: 0.2;
            background-color: #000 !important;
            border-radius: 8px;
        }

        .sortable-drag {
            cursor: grabbing !important;
            transform: rotate(2deg);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
            border-radius: 8px;
        }

        .task-card {
            transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s;
            user-select: none;
        }

        .task-container {
            min-height: 50px;
            /* Biar gampang naruh kartu di list kosong */
        }
    </style>

    <div class="h-screen flex flex-col board-bg font-sans overflow-hidden">

        {{-- Header --}}
        <div class="px-6 py-3 bg-black/20 backdrop-blur-md flex items-center justify-between shrink-0">
            <div class="flex items-center gap-6">
                <div class="flex items-center gap-2 border-r border-white/20 pr-6">
                    <i data-lucide="layout" class="w-5 h-5 text-white"></i>
                    <h1 class="text-lg font-bold text-white tracking-tight">{{ $project->nama_proyek ?? 'Project Name' }}
                    </h1>
                </div>

                <div class="flex items-center gap-3">
                    <div class="flex -space-x-2">
                        @foreach ($users->take(4) as $u)
                            <div class="w-8 h-8 rounded-full border-2 border-brand bg-slate-200 flex items-center justify-center text-[10px] font-bold"
                                title="{{ $u->name }}">
                                {{ strtoupper(substr($u->name, 0, 2)) }}
                            </div>
                        @endforeach
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-4 text-white">
                <i data-lucide="settings" class="w-5 h-5 cursor-pointer opacity-80 hover:opacity-100"></i>
            </div>
        </div>

        {{-- Board Area --}}
        <div class="flex-1 overflow-x-auto p-4 custom-scrollbar">
            <div id="board-container" class="flex items-start gap-3 h-full inline-flex min-w-full">

                @foreach ($project->lists as $list)
                    <div
                        class="w-[272px] flex-shrink-0 flex flex-col bg-trelloList rounded-xl shadow-md max-h-full overflow-hidden">
                        {{-- List Header --}}
                        <div class="p-3 pb-2 flex items-center justify-between">
                            <h3 class="px-2 font-bold text-slate-700 text-[13px]">{{ $list->nama_list }}</h3>
                            <i data-lucide="more-horizontal" class="w-4 h-4 text-slate-500 cursor-pointer"></i>
                        </div>

                        {{-- Area Container Kartu --}}
                        <div class="task-container flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar"
                            data-list-id="{{ $list->id }}">
                            @foreach ($list->tasks as $task)
                                <div class="task-card bg-white p-3 rounded-lg shadow-sm border-b border-slate-300 cursor-grab active:cursor-grabbing group"
                                    data-task-id="{{ $task->id }}">

                                    <div class="flex flex-wrap gap-1 mb-2">
                                        @php
                                            // Mapping warna berdasarkan status prioritas dari database
                                            $color = match ($task->prioritas) {
                                                'DARURAT' => 'bg-red-500',
                                                'TINGGI' => 'bg-orange-500',
                                                'SEDANG' => 'bg-yellow-400',
                                                'RENDAH' => 'bg-green-500',
                                                default => 'bg-blue-500',
                                            };
                                        @endphp

                                        {{-- Garis warna kecil khas Trello --}}
                                        <span class="h-1.5 w-10 rounded-full {{ $color }}"
                                            title="{{ $task->prioritas }}"></span>

                                        {{-- Opsional: Tambahkan teks kecil jika ingin lebih jelas --}}
                                        <span
                                            class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{{ $task->prioritas }}</span>
                                    </div>
                                    <h4 class="text-[14px] text-slate-800 leading-snug font-medium">{{ $task->judul_tugas }}
                                    </h4>

                                    <div class="flex items-center justify-between mt-3 text-slate-400">
                                        <div
                                            class="flex items-center gap-1 text-[10px] font-bold {{ $task->tgl_selesai_tugas ? 'bg-green-100 text-green-700' : '' }} px-1.5 py-0.5 rounded">
                                            @if ($task->tgl_selesai_tugas)
                                                <i data-lucide="clock" class="w-3 h-3"></i>
                                                {{ $task->tgl_selesai_tugas->format('d M') }}
                                            @endif
                                        </div>
                                        <div
                                            class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold group-hover:bg-brand group-hover:text-white uppercase transition-colors">
                                            {{ substr($task->users->first()->name ?? 'U', 0, 1) }}
                                        </div>
                                    </div>
                                </div>
                            @endforeach
                        </div>

                        <div class="p-2">
                            <button onclick="openTaskModal({{ $list->id }})"
                                class="w-full flex items-center gap-2 px-2 py-2 text-slate-600 hover:bg-slate-300/50 hover:text-slate-800 rounded-lg transition-all text-[13px] font-semibold">
                                <i data-lucide="plus" class="w-4 h-4"></i> Tambah kartu
                            </button>
                        </div>
                    </div>
                @endforeach

                {{-- Add List Button --}}
                <div class="w-[272px] flex-shrink-0">
                    <div id="newListContainer"
                        class="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-2 transition-all cursor-pointer">
                        <button id="showListForm"
                            class="w-full flex items-center gap-2 px-3 py-2 text-white font-bold text-sm">
                            <i data-lucide="plus" class="w-5 h-5 text-white"></i> Tambah daftar lain
                        </button>
                        <form id="listForm" action="{{ route('project-lists.store') }}" method="POST"
                            class="hidden space-y-2 p-1">
                            @csrf
                            <input type="hidden" name="project_id" value="{{ $project->id }}">
                            <input type="text" name="nama_list" placeholder="Judul daftar..."
                                class="w-full px-3 py-2 text-sm rounded-md border-2 border-brand focus:outline-none"
                                autofocus required>
                            <div class="flex items-center gap-2">
                                <button type="submit"
                                    class="bg-brand text-white px-4 py-1.5 rounded font-bold text-xs">Simpan</button>
                                <button type="button" id="hideListForm"
                                    class="text-white hover:bg-white/10 p-1.5 rounded"><i data-lucide="x"
                                        class="w-5 h-5"></i></button>
                            </div>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    </div>

    @include('task-management.modal-task')

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            lucide.createIcons();

            const containers = document.querySelectorAll('.task-container');

            containers.forEach(container => {
                new Sortable(container, {
                    group: 'tasks',
                    animation: 250, // Durasi animasi lebih lambat (lebih smooth)
                    easing: "cubic-bezier(1, 0, 0, 1)", // Easing premium
                    ghostClass: 'sortable-ghost',
                    dragClass: 'sortable-drag',
                    fallbackOnBody: true,
                    swapThreshold: 0.65, // Deteksi perpindahan lebih akurat
                    onEnd: function(evt) {
                        // Jika tidak ada perubahan posisi, jangan kirim request
                        if (evt.from === evt.to && evt.oldIndex === evt.newIndex) return;

                        const taskId = evt.item.getAttribute('data-task-id');
                        const targetListId = evt.to.getAttribute('data-list-id');
                        const newIndex = evt.newIndex;

                        updateTaskPosition(taskId, targetListId, newIndex);
                    },
                });
            });

            function updateTaskPosition(taskId, listId, index) {
                fetch("{{ route('tasks.update-order') }}", {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': '{{ csrf_token() }}',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            task_id: taskId,
                            list_id: listId,
                            position: index
                        })
                    })
                    .then(async res => {
                        if (!res.ok) throw new Error("Gagal menyimpan ke database");
                        return res.json();
                    })
                    .then(data => {
                        console.log("Database Sync: Success");
                    })
                    .catch(err => {
                        console.error("Sync Error:", err);
                        Swal.fire({
                            icon: 'error',
                            title: 'Koneksi Terputus',
                            text: 'Urutan tidak tersimpan!',
                            toast: true,
                            position: 'top-end',
                            showConfirmButton: false,
                            timer: 3000
                        });
                    });
            }

            // UI Form Toggle Logic
            const newListBtn = document.getElementById('showListForm');
            const hideListBtn = document.getElementById('hideListForm');
            const listForm = document.getElementById('listForm');

            newListBtn?.addEventListener('click', () => {
                newListBtn.parentElement.classList.replace('bg-white/20', 'bg-trelloList');
                newListBtn.classList.add('hidden');
                listForm.classList.remove('hidden');
                listForm.querySelector('input').focus();
            });

            hideListBtn?.addEventListener('click', () => {
                newListBtn.parentElement.classList.replace('bg-trelloList', 'bg-white/20');
                newListBtn.classList.remove('hidden');
                listForm.classList.add('hidden');
            });
        });

        function openTaskModal(listId) {
            const inputListId = document.getElementById('target_list_id');
            const modal = document.getElementById('modalTask');
            if (inputListId) inputListId.value = listId;
            if (modal) modal.classList.remove('hidden');
        }
    </script>
@endsection
