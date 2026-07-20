import { useState, useRef, useEffect } from "react";
import { Bot, Send, Trash2, User } from "lucide-react";
import { aiChatApi } from "../services/api";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function formatResponse(text: string): string {
  const escapeHtml = (s: string) => {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  };

  const processInline = (s: string) => {
    let r = escapeHtml(s);
    r = r.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    r = r.replace(/\*(.*?)\*/g, "<em>$1</em>");
    r = r.replace(/`([^`]+)`/g, "<code class='bg-gray-100 text-rose-600 px-1 rounded text-xs'>$1</code>");
    return r;
  };

  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let html = "";
  let inCode = false;
  let codeBuffer: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      if (inCode) {
        html += `<pre class="bg-gray-100 p-3 rounded-lg overflow-x-auto text-sm my-2"><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`;
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

    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const cells = line.split("|").filter((c) => c.trim() !== "");
      const isSep = cells.every((c) => /^[\s\-:]+$/.test(c.trim()));
      if (isSep) continue;
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      tableRows.push(cells);
      continue;
    }

    if (inTable && tableRows.length > 0) {
      html += '<div class="overflow-x-auto my-2">';
      html += '<table class="w-full text-sm border-collapse border border-gray-200">';
      html += "<thead><tr>";
      for (const c of tableRows[0]) {
        html += `<th class="border border-gray-200 bg-gray-100 px-3 py-2 text-left font-semibold">${processInline(c.trim())}</th>`;
      }
      html += "</tr></thead>";
      if (tableRows.length > 1) {
        html += "<tbody>";
        for (let r = 1; r < tableRows.length; r++) {
          html += "<tr>";
          for (const c of tableRows[r]) {
            html += `<td class="border border-gray-200 px-3 py-2">${processInline(c.trim())}</td>`;
          }
          html += "</tr>";
        }
        html += "</tbody>";
      }
      html += "</table></div>";
      inTable = false;
      tableRows = [];
    }

    const trimmed = line.trim();
    if (trimmed === "") {
      html += "<br/>";
    } else {
      html += `<span>${processInline(line)}</span><br/>`;
    }
  }

  if (inCode) {
    html += `<pre class="bg-gray-100 p-3 rounded-lg overflow-x-auto text-sm my-2"><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`;
  }
  if (inTable && tableRows.length > 0) {
    html += '<div class="overflow-x-auto my-2">';
    html += '<table class="w-full text-sm border-collapse border border-gray-200">';
    html += "<thead><tr>";
    for (const c of tableRows[0]) {
      html += `<th class="border border-gray-200 bg-gray-100 px-3 py-2 text-left font-semibold">${processInline(c.trim())}</th>`;
    }
    html += "</tr></thead>";
    if (tableRows.length > 1) {
      html += "<tbody>";
      for (let r = 1; r < tableRows.length; r++) {
        html += "<tr>";
        for (const c of tableRows[r]) {
          html += `<td class="border border-gray-200 px-3 py-2">${processInline(c.trim())}</td>`;
        }
        html += "</tr>";
      }
      html += "</tbody>";
    }
    html += "</table></div>";
  }

  return html;
}

export default function AiChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || loading) return;

    setInput("");
    const userMsg: ChatMessage = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.slice(-20).map((m) => ({ role: m.role, content: m.content }));
      const res = await aiChatApi.send({ message: msg, history });
      if (res.data.success) {
        const aiMsg: ChatMessage = { role: "assistant", content: res.data.message };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "Maaf, terjadi kesalahan. Silakan coba lagi." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Maaf, terjadi kesalahan koneksi. Silakan coba lagi." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    inputRef.current?.focus();
  };

  const timeNow = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-[#0E6187]" />
            <div>
              <h1 className="text-lg font-bold text-gray-800">AI Assistant</h1>
              <p className="text-xs text-gray-500">Tanyakan apapun tentang data sistem</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Terhubung
            </span>
            <button onClick={clearChat} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Hapus chat">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="h-[520px] overflow-y-auto p-6 bg-gray-50/50 space-y-4" style={{ scrollBehavior: "smooth" }}>
          {messages.length === 0 && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 bg-[#0E6187] text-white rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 max-w-[80%] rounded-tl-none">
                <p className="font-semibold text-sm text-gray-800 mb-1">AI Assistant</p>
                <p className="text-sm text-gray-600">Halo! Saya adalah asisten AI yang mengetahui seluruh data di sistem ini. Saya bisa membantu Anda melihat dan menganalisis data:</p>
                <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-0.5">
                  <li>Data kehadiran karyawan</li>
                  <li>Rekap absensi dan statistik</li>
                  <li>Status izin, cuti, lembur</li>
                  <li>Data proyek dan task management</li>
                  <li>Informasi shift dan jadwal</li>
                  <li>Data siswa dan penilaian</li>
                  <li>Dan masih banyak lagi...</li>
                </ul>
                <p className="text-xs text-gray-400 mt-2">{timeNow()}</p>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-gray-500 text-white" : "bg-[#0E6187] text-white"}`}>
                {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className={`rounded-xl shadow-sm p-4 max-w-[80%] ${msg.role === "user" ? "bg-blue-50 rounded-tr-none" : "bg-white rounded-tl-none"}`}>
                <p className="font-semibold text-sm text-gray-800 mb-1">{msg.role === "user" ? "Anda" : "AI Assistant"}</p>
                {msg.role === "assistant" ? (
                  <div className="text-sm text-gray-700 leading-relaxed ai-response" dangerouslySetInnerHTML={{ __html: formatResponse(msg.content) }} />
                ) : (
                  <p className="text-sm text-gray-700">{msg.content}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">{timeNow()}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 bg-[#0E6187] text-white rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 rounded-tl-none">
                <p className="font-semibold text-sm text-gray-800 mb-2">AI Assistant</p>
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanyakan sesuatu tentang data..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0E6187] focus:border-[#0E6187]"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0E6187] text-white rounded-lg hover:bg-[#1a5e6f] disabled:opacity-50 text-sm font-medium"
            >
              <Send className="w-4 h-4" />
              Kirim
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .ai-response ul { list-style: disc; padding-left: 1.25rem; margin: 0.25rem 0; }
        .ai-response ol { list-style: decimal; padding-left: 1.25rem; margin: 0.25rem 0; }
        .ai-response li { margin-bottom: 0.125rem; }
        .ai-response table { margin: 0.5rem 0; }
        .ai-response p { margin: 0.25rem 0; }
      `}</style>
    </div>
  );
}
