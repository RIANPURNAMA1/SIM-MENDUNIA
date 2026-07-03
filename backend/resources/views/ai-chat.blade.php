@php
    $title = 'AI Assistant Chat';
    $roleUser = auth()->user()->role;
@endphp

@extends('app')

@section('content')
<div class="container-fluid py-4">
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-header d-flex align-items-center justify-content-between">
                    <div>
                        <h5 class="mb-0">
                            <i class="ph ph-robot me-2"></i>AI Assistant
                        </h5>
                        <small class="text-muted">Tanyakan apapun tentang data sistem absensi</small>
                    </div>
                    <div>
                        <span class="badge bg-success">
                            <i class="ph ph-check-circle me-1"></i>Terhubung
                        </span>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div id="chatMessages" class="chat-messages p-4" style="height: 500px; overflow-y: auto; background: #f8f9fa;">
                        <div class="d-flex justify-content-start mb-4" id="welcomeMessage">
                            <div class="d-flex align-items-start">
                                <div class="flex-shrink-0 me-3">
                                    <div class="avatar-circle bg-primary text-white d-flex align-items-center justify-content-center" style="width: 40px; height: 40px; border-radius: 50%;">
                                        <i class="ph ph-robot"></i>
                                    </div>
                                </div>
                                <div class="chat-bubble bg-white p-3 rounded-3 shadow-sm" style="max-width: 75%; border-radius: 0 16px 16px 16px !important;">
                                    <strong class="d-block mb-1">AI Assistant</strong>
                                    <p class="mb-0">Halo! Saya adalah asisten AI yang mengetahui seluruh data di sistem ini. Saya bisa membantu Anda melihat dan menganalisis data:</p>
                                    <ul class="mb-0 mt-2 ps-3">
                                        <li>Data kehadiran karyawan</li>
                                        <li>Rekap absensi dan statistik</li>
                                        <li>Status izin, cuti, lembur</li>
                                        <li>Data proyek dan task management</li>
                                        <li>Informasi shift dan jadwal</li>
                                        <li>Data penilaian siswa</li>
                                        <li>Dan masih banyak lagi...</li>
                                    </ul>
                                    <small class="text-muted d-block mt-2">{{ now()->format('H:i') }}</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="chat-input p-3 border-top bg-white">
                        <form id="chatForm" class="d-flex gap-2">
                            <input type="text" id="messageInput" class="form-control" placeholder="Tanyakan sesuatu tentang data..." autocomplete="off" required>
                            <button type="submit" id="sendBtn" class="btn btn-primary px-4 d-flex align-items-center gap-2">
                                <i class="ph ph-paper-plane-right"></i>
                                <span>Kirim</span>
                            </button>
                            <button type="button" id="clearChatBtn" class="btn btn-outline-secondary" title="Hapus chat">
                                <i class="ph ph-trash"></i>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .chat-bubble {
        position: relative;
        line-height: 1.5;
    }
    .chat-bubble.user {
        background: #e3f2fd !important;
        border-radius: 16px 0 16px 16px !important;
    }
    .chat-bubble p {
        font-size: 0.925rem;
    }
    .chat-bubble ul, .chat-bubble ol {
        padding-left: 1.25rem;
    }
    .chat-bubble li {
        font-size: 0.925rem;
        margin-bottom: 0.25rem;
    }
    .avatar-circle {
        font-size: 1.2rem;
    }
    #chatMessages::-webkit-scrollbar {
        width: 6px;
    }
    #chatMessages::-webkit-scrollbar-track {
        background: #f1f1f1;
    }
    #chatMessages::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
    }
    #chatMessages::-webkit-scrollbar-thumb:hover {
        background: #a1a1a1;
    }
    .typing-indicator {
        display: inline-flex;
        gap: 4px;
        padding: 8px 0;
    }
    .typing-indicator span {
        width: 8px;
        height: 8px;
        background: #6c757d;
        border-radius: 50%;
        animation: typing 1.4s infinite ease-in-out;
    }
    .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typing {
        0%, 60%, 100% { opacity: 0.4; transform: translateY(0); }
        30% { opacity: 1; transform: translateY(-4px); }
    }
    .chat-bubble .table {
        font-size: 0.825rem;
        margin-bottom: 0;
        border-collapse: collapse;
        width: 100%;
    }
    .chat-bubble .table th,
    .chat-bubble .table td {
        border: 1px solid #dee2e6;
        padding: 8px 12px;
        text-align: left;
        vertical-align: top;
    }
    .chat-bubble .table th {
        background: #e9ecef;
        font-weight: 600;
        border-bottom: 2px solid #dee2e6;
    }
    .chat-bubble .table td {
        background: #fff;
    }
    .chat-bubble .table tr:nth-child(even) td {
        background: #f8f9fa;
    }
    .chat-bubble .table-responsive {
        margin: 8px 0;
        overflow-x: auto;
    }
    pre {
        background: #f4f4f4;
        padding: 12px;
        border-radius: 8px;
        overflow-x: auto;
        font-size: 0.85rem;
    }
    code {
        background: #f4f4f4;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.85rem;
        color: #d63384;
    }
</style>
@endsection

<script>
    document.addEventListener('DOMContentLoaded', function() {
        const chatMessages = document.getElementById('chatMessages');
        const chatForm = document.getElementById('chatForm');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const clearChatBtn = document.getElementById('clearChatBtn');

        let chatHistory = [];

        chatForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const message = messageInput.value.trim();
            if (!message) return;

            addUserMessage(message);
            messageInput.value = '';
            sendBtn.disabled = true;
            sendBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>...';

            showTypingIndicator();

            fetch('{{ route("ai.chat.send") }}', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify({
                    message: message,
                    history: chatHistory.slice(-20),
                }),
            })
            .then(res => res.json())
            .then(data => {
                removeTypingIndicator();
                sendBtn.disabled = false;
                sendBtn.innerHTML = '<i class="ph ph-paper-plane-right"></i><span>Kirim</span>';

                if (data.success) {
                    addAiMessage(data.message);
                    chatHistory.push({ role: 'user', content: message });
                    chatHistory.push({ role: 'assistant', content: data.message });
                } else {
                    addAiMessage('Maaf, terjadi kesalahan. Silakan coba lagi.');
                }
            })
            .catch(() => {
                removeTypingIndicator();
                sendBtn.disabled = false;
                sendBtn.innerHTML = '<i class="ph ph-paper-plane-right"></i><span>Kirim</span>';
                addAiMessage('Maaf, terjadi kesalahan koneksi. Silakan coba lagi.');
            });
        });

        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                chatForm.dispatchEvent(new Event('submit'));
            }
        });

        clearChatBtn.addEventListener('click', function() {
            chatHistory = [];
            document.querySelectorAll('.chat-message-dynamic').forEach(el => el.remove());
            document.getElementById('welcomeMessage').style.display = 'flex';
        });

        function addUserMessage(text) {
            document.getElementById('welcomeMessage').style.display = 'none';
            const div = document.createElement('div');
            div.className = 'd-flex justify-content-end mb-4 chat-message-dynamic';
            div.innerHTML = `
                <div class="d-flex align-items-start flex-row-reverse">
                    <div class="flex-shrink-0 ms-3">
                        <div class="avatar-circle bg-secondary text-white d-flex align-items-center justify-content-center" style="width: 40px; height: 40px; border-radius: 50%;">
                            <i class="ph ph-user"></i>
                        </div>
                    </div>
                    <div class="chat-bubble user p-3 shadow-sm" style="max-width: 75%; border-radius: 16px 0 16px 16px !important;">
                        <strong class="d-block mb-1">Anda</strong>
                        <p class="mb-0">${escapeHtml(text)}</p>
                        <small class="text-muted d-block mt-2">${getTime()}</small>
                    </div>
                </div>
            `;
            chatMessages.appendChild(div);
            scrollToBottom();
        }

        function addAiMessage(text) {
            const div = document.createElement('div');
            div.className = 'd-flex justify-content-start mb-4 chat-message-dynamic';
            div.innerHTML = `
                <div class="d-flex align-items-start">
                    <div class="flex-shrink-0 me-3">
                        <div class="avatar-circle bg-primary text-white d-flex align-items-center justify-content-center" style="width: 40px; height: 40px; border-radius: 50%;">
                            <i class="ph ph-robot"></i>
                        </div>
                    </div>
                    <div class="chat-bubble bg-white p-3 rounded-3 shadow-sm" style="max-width: 75%; border-radius: 0 16px 16px 16px !important;">
                        <strong class="d-block mb-1">AI Assistant</strong>
                        <div class="mb-0 ai-response">${formatResponse(text)}</div>
                        <small class="text-muted d-block mt-2">${getTime()}</small>
                    </div>
                </div>
            `;
            chatMessages.appendChild(div);
            scrollToBottom();
        }

        function showTypingIndicator() {
            const div = document.createElement('div');
            div.className = 'd-flex justify-content-start mb-4 chat-message-dynamic';
            div.id = 'typingIndicator';
            div.innerHTML = `
                <div class="d-flex align-items-start">
                    <div class="flex-shrink-0 me-3">
                        <div class="avatar-circle bg-primary text-white d-flex align-items-center justify-content-center" style="width: 40px; height: 40px; border-radius: 50%;">
                            <i class="ph ph-robot"></i>
                        </div>
                    </div>
                    <div class="chat-bubble bg-white p-3 rounded-3 shadow-sm" style="border-radius: 0 16px 16px 16px !important;">
                        <strong class="d-block mb-1">AI Assistant</strong>
                        <div class="typing-indicator">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                </div>
            `;
            chatMessages.appendChild(div);
            scrollToBottom();
        }

        function removeTypingIndicator() {
            const el = document.getElementById('typingIndicator');
            if (el) el.remove();
        }

        function scrollToBottom() {
            setTimeout(() => {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 50);
        }

        function getTime() {
            const now = new Date();
            return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        }

        function escapeHtml(text) {
            const d = document.createElement('div');
            d.textContent = text;
            return d.innerHTML;
        }

        function formatResponse(text) {
            let lines = text.replace(/\r\n/g, '\n').split('\n');
            let html = '';
            let inTable = false;
            let inCode = false;
            let tableRowCount = 0;
            let codeBuffer = [];
            let tableRows = [];

            const escapeHtml = function(s) {
                const d = document.createElement('div');
                d.textContent = s;
                return d.innerHTML;
            };

            const processInline = function(s) {
                let r = escapeHtml(s);
                r = r.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                r = r.replace(/\*(.*?)\*/g, '<em>$1</em>');
                r = r.replace(/`([^`]+)`/g, '<code>$1</code>');
                return r;
            };

            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];

                if (line.trim().startsWith('```')) {
                    if (inCode) {
                        html += '<pre><code>' + escapeHtml(codeBuffer.join('\n')) + '</code></pre>';
                        codeBuffer = [];
                        inCode = false;
                    } else {
                        inCode = true;
                        codeBuffer = [];
                    }
                    continue;
                }

                if (inCode) {
                    codeBuffer.push(line);
                    continue;
                }

                if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
                    let cells = line.split('|').filter(c => c.trim() !== '');
                    let isSeparator = cells.every(c => /^[\s\-:]+$/.test(c.trim()));

                    if (isSeparator) continue;

                    if (!inTable) {
                        inTable = true;
                        tableRowCount = 0;
                        tableRows = [];
                    }

                    tableRows.push(cells);
                    tableRowCount++;
                    continue;
                }

                if (inTable) {
                    if (tableRows.length > 0) {
                        html += '<div class="table-responsive"><table class="table table-sm mb-0">';
                        html += '<thead><tr>';
                        for (let c of tableRows[0]) {
                            html += '<th>' + processInline(c.trim()) + '</th>';
                        }
                        html += '</tr></thead>';
                        if (tableRows.length > 1) {
                            html += '<tbody>';
                            for (let r = 1; r < tableRows.length; r++) {
                                html += '<tr>';
                                for (let c of tableRows[r]) {
                                    html += '<td>' + processInline(c.trim()) + '</td>';
                                }
                                html += '</tr>';
                            }
                            html += '</tbody>';
                        }
                        html += '</table></div>';
                    }
                    inTable = false;
                    tableRows = [];
                }

                let trimmed = line.trim();
                if (trimmed === '') {
                    html += '<br>';
                } else {
                    html += processInline(line) + '<br>';
                }
            }

            if (inCode) {
                html += '<pre><code>' + escapeHtml(codeBuffer.join('\n')) + '</code></pre>';
            }
            if (inTable && tableRows.length > 0) {
                html += '<div class="table-responsive"><table class="table table-sm mb-0">';
                html += '<thead><tr>';
                for (let c of tableRows[0]) {
                    html += '<th>' + processInline(c.trim()) + '</th>';
                }
                html += '</tr></thead>';
                if (tableRows.length > 1) {
                    html += '<tbody>';
                    for (let r = 1; r < tableRows.length; r++) {
                        html += '<tr>';
                        for (let c of tableRows[r]) {
                            html += '<td>' + processInline(c.trim()) + '</td>';
                        }
                        html += '</tr>';
                    }
                    html += '</tbody>';
                }
                html += '</table></div>';
            }

            return html;
        }
    });
</script>

