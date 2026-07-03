<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task Modal - Trello Style</title>
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Summernote CSS -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/summernote/0.8.20/summernote-bs5.min.css" rel="stylesheet">
    
    <!-- Bootstrap (required for Summernote) -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js"></script>
    
    <!-- jQuery (required for Summernote) -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    
    <!-- Summernote JS -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/summernote/0.8.20/summernote-bs5.min.js"></script>
    
    <style>
        /* Smooth animations */
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }

        .modal-content {
            animation: slideUp 0.3s ease-out;
        }

        #modalTask {
            animation: fadeIn 0.3s ease-out;
        }

        /* Custom scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }

        input[type="hidden"] {
            display: none;
        }

        /* Summernote Customization */
        .note-editable {
            min-height: 150px !important;
            max-height: 300px !important;
            font-size: 14px;
            line-height: 1.5;
            color: #1f2937;
        }

        .note-editor.note-frame {
            border: 1px solid #e5e7eb !important;
            border-radius: 0.5rem !important;
        }

        .note-editor.note-frame.focused {
            border: 2px solid #2563eb !important;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
        }

        .note-toolbar {
            background-color: #f9fafb !important;
            border-bottom: 1px solid #e5e7eb !important;
            padding: 8px !important;
        }

        .note-toolbar .btn-sm {
            border: none !important;
            background: transparent !important;
            color: #64748b !important;
            padding: 4px 8px !important;
        }

        .note-toolbar .btn-sm:hover {
            background-color: #f1f5f9 !important;
            border-radius: 4px !important;
        }

        .note-toolbar .btn-sm.active {
            background-color: #e0f2fe !important;
            color: #0284c7 !important;
        }

        /* Hide Bootstrap styles interfering with Tailwind */
        .note-placeholder {
            color: #9ca3af;
        }

        .note-editable:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
        }

        /* Remove Bootstrap button styling conflicts */
        .note-toolbar .btn-group {
            display: inline-flex !important;
            gap: 0 !important;
        }
    </style>
</head>
<body class="bg-gray-100">

    <!-- Modal -->
    <div id="modalTask" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="modal-content bg-white w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            
            <!-- Header -->
            <div class="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200 shrink-0">
                <div class="flex items-center gap-3">
                    <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                    <div>
                        <h3 id="modalTitle" class="font-bold text-lg text-gray-900">Detail Tugas</h3>
                        <p class="text-xs text-gray-500 uppercase tracking-wider mt-1">Daftar: <span class="font-bold text-blue-600">Pengerjaan</span></p>
                    </div>
                </div>
                <button onclick="toggleModal()" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>

            <!-- Main Content -->
            <div class="flex-1 overflow-hidden flex flex-col md:flex-row gap-0">
                
                <!-- Left Side: Form (8/12) -->
                <div class="w-full md:w-2/3 overflow-y-auto custom-scrollbar p-6 bg-white border-r border-gray-200">
                    <form action="{{ route('tasks.store') }}" method="POST" id="taskForm" class="space-y-6">
                        @csrf
                        <input type="hidden" name="project_list_id" id="target_list_id">

                        <!-- Judul Tugas -->
                        <div>
                            <label class="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"></path>
                                </svg>
                                Judul Tugas
                            </label>
                            <input type="text" name="judul_tugas" id="judul_tugas" required
                                class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-semibold text-gray-900"
                                placeholder="Masukkan judul tugas...">
                        </div>

                        <!-- Prioritas & Deadline -->
                        <div class="grid grid-cols-2 gap-4">
                            <!-- Prioritas -->
                            <div>
                                <label class="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path>
                                    </svg>
                                    Prioritas
                                </label>
                                <select name="prioritas" id="prioritas"
                                    class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer text-gray-900">
                                    <option value="RENDAH">🟢 Rendah</option>
                                    <option value="SEDANG" selected>🟡 Sedang</option>
                                    <option value="TINGGI">🟠 Tinggi</option>
                                    <option value="DARURAT">🔴 Darurat</option>
                                </select>
                            </div>

                            <!-- Deadline -->
                            <div>
                                <label class="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v2h16V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5H4v8a2 2 0 002 2h8a2 2 0 002-2V7h-2v1a1 1 0 11-2 0V7H8v1a1 1 0 11-2 0V7z" clip-rule="evenodd"></path>
                                    </svg>
                                    Deadline
                                </label>
                                <input type="date" name="tgl_selesai_tugas" id="tgl_selesai_tugas"
                                    class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900">
                            </div>
                        </div>

                        <!-- Deskripsi dengan Summernote -->
                        <div>
                            <label class="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"></path>
                                </svg>
                                Deskripsi & Lampiran
                            </label>
                            <textarea name="deskripsi_tugas" id="deskripsi_tugas" 
                                class="summernote"
                                placeholder="Tambahkan detail instruksi atau lampirkan gambar..."></textarea>
                        </div>

                        <!-- Personel Terlibat -->
                        <div>
                            <label class="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10.5 1.5H4.5A2.5 2.5 0 002 4v12a2.5 2.5 0 002.5 2.5h11A2.5 2.5 0 0018 16V9.5m-11-4a2 2 0 110 4 2 2 0 010-4zm5.5 6.5a.5.5 0 100-1 .5.5 0 000 1z"></path>
                                </svg>
                                Personel Terlibat
                            </label>
                            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-40 overflow-y-auto custom-scrollbar">
                                <div class="grid grid-cols-2 gap-3">
                                    @foreach ($users as $user)
                                        <label class="flex items-center p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 cursor-pointer transition-all group">
                                            <input type="checkbox" name="user_ids[]" value="{{ $user->id }}"
                                                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300 cursor-pointer">
                                            <span class="ml-3 text-sm text-gray-700 group-hover:text-gray-900 capitalize">{{ strtolower($user->name) }}</span>
                                        </label>
                                    @endforeach
                                </div>
                            </div>
                        </div>

                        <!-- Divider -->
                        <div class="border-t border-gray-200 pt-6"></div>

                        <!-- Buttons -->
                        <div class="flex gap-3">
                            <button type="submit"
                                class="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md hover:shadow-lg">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                                </svg>
                                Simpan Update
                            </button>
                            <button type="button" onclick="toggleModal()"
                                class="px-6 py-3 bg-gray-100 text-gray-900 rounded-lg font-bold text-sm hover:bg-gray-200 transition-all">
                                Batal
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Right Side: Activity (4/12) -->
                <div class="w-full md:w-1/3 bg-gray-50 flex flex-col overflow-hidden border-t md:border-t-0 md:border-l border-gray-200">
                    
                    <!-- Activity Header -->
                    <div class="px-6 py-4 border-b border-gray-200 bg-white">
                        <h4 class="text-xs font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z"></path>
                            </svg>
                            Aktivitas Tim
                        </h4>
                    </div>

                    <!-- Activity List -->
                    <div class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        <!-- Activity Item Example -->
                        <div class="flex gap-3">
                            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex-shrink-0 flex items-center justify-center text-xs text-white font-bold">
                                LP
                            </div>
                            <div class="flex-1">
                                <div class="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                    <p class="text-sm text-gray-700 leading-relaxed">Pastikan aset gambar sudah ter-kompres ya sebelum diupload ke sini.</p>
                                </div>
                                <span class="text-xs text-gray-500 mt-1 block ml-1">Lutfi • 2 jam lalu</span>
                            </div>
                        </div>
                    </div>

                    <!-- Comment Input -->
                    <div class="p-4 border-t border-gray-200 bg-white">
                        <div class="space-y-3">
                            <textarea placeholder="Tulis komentar..."
                                class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none min-h-20"
                            ></textarea>
                            <div class="flex justify-end">
                                <button type="button"
                                    class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all">
                                    Kirim
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        $(document).ready(function() {
            // Inisialisasi Summernote
            $('#deskripsi_tugas').summernote({
                height: 200,
                minHeight: 150,
                maxHeight: 300,
                focus: false,
                toolbar: [
                    ['style', ['style']],
                    ['font', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
                    ['fontsize', ['fontsize']],
                    ['color', ['color']],
                    ['para', ['ul', 'ol', 'paragraph']],
                    ['table', ['table']],
                    ['insert', ['link', 'picture', 'video']],
                    ['view', ['fullscreen', 'codeview', 'help']],
                ],
                fontSizes: ['12', '14', '16', '18', '20'],
                buttons: {
                    image: function () {
                        // Custom image upload handler
                    }
                },
                lang: 'id-ID'
            });

            // Handle form reset
            function resetForm() {
                document.getElementById('taskForm').reset();
                $('#deskripsi_tugas').summernote('reset');
            }

            // Expose reset function globally
            window.resetTaskForm = resetForm;
        });

        // Open Modal
        function openTaskModal(listId) {
            const modal = document.getElementById('modalTask');
            document.getElementById('target_list_id').value = listId;

            // Reset form dan editor
            document.getElementById('taskForm').reset();
            $('#deskripsi_tugas').summernote('reset');

            modal.classList.remove('hidden');
            modal.classList.add('flex');

            // Focus ke judul
            setTimeout(() => {
                document.getElementById('judul_tugas').focus();
            }, 300);
        }

        // Toggle Modal
        function toggleModal() {
            const modal = document.getElementById('modalTask');
            modal.classList.toggle('hidden');
            modal.classList.toggle('flex');
        }

        // Close modal on outside click
        window.onclick = function(event) {
            const modal = document.getElementById('modalTask');
            if (event.target === modal) {
                toggleModal();
            }
        }

        // Handle form submission
        document.getElementById('taskForm').addEventListener('submit', function(e) {
            // Summernote otomatis menyimpan ke textarea
        });
    </script>
</body>
</html>