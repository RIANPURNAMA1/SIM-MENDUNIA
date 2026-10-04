import { useState, useEffect } from 'react'
import api from '../../services/api'
import {
  FileText,
  Save,
  RotateCcw,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Mail,
  MessageSquare,
  Trash2,
} from 'lucide-react'

interface Template {
  id: number
  key: string
  name: string
  description: string | null
  channel: string
  subject: string | null
  body: string
  variables: string[] | null
  is_active: boolean
}

export default function DataTemplateNotifikasi() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [previewKey, setPreviewKey] = useState<string | null>(null)
  const [channel, setChannel] = useState<'email' | 'whatsapp'>('email')

  useEffect(() => { loadTemplates() }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const res = await api.get('/notification-templates')
      setTemplates(res.data)
    } catch {
      setErrorMsg('Gagal memuat template')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (id: number, field: 'subject' | 'body', value: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t))
  }

  const handleSave = async (id: number) => {
    setSaving(true); setSuccessMsg(''); setErrorMsg('')
    const tmpl = templates.find(t => t.id === id)
    if (!tmpl) return
    try {
      await api.put(`/notification-templates/${id}`, {
        subject: tmpl.subject,
        body: tmpl.body,
      })
      setSuccessMsg(`Template "${tmpl.name}" berhasil disimpan`)
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch {
      setErrorMsg('Gagal menyimpan template')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async (id: number) => {
    if (!confirm('Yakin ingin mereset template ke bawaan default?')) return
    setSuccessMsg(''); setErrorMsg('')
    try {
      const res = await api.post(`/notification-templates/${id}/reset`)
      setTemplates(prev => prev.map(t => t.id === id ? res.data.data : t))
      setSuccessMsg('Template berhasil direset ke default')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch {
      setErrorMsg('Gagal mereset template')
    }
  }

  const handleDelete = async (tmpl: Template) => {
    if (!confirm(`Yakin ingin menghapus template "${tmpl.name}"?`)) return
    setSuccessMsg(''); setErrorMsg('')
    try {
      await api.delete(`/notification-templates/${tmpl.id}`)
      setTemplates(prev => prev.filter(t => t.id !== tmpl.id))
      setSuccessMsg(`Template "${tmpl.name}" berhasil dihapus`)
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch {
      setErrorMsg('Gagal menghapus template')
    }
  }

  const getPreview = (tmpl: Template) => {
    const vars: Record<string, string> = {
      nama: 'John Doe',
      program: 'Program Tahfiz',
      batch: 'Batch 1',
      no_registrasi: 'REG/20260728/0001',
      no_invoice: 'INV/00001/202607',
      total: '200.000',
      total_transfer: '200.048',
      kode_unik: '48',
      payment_code: 'PAY/00001/202607',
      jatuh_tempo: 'Rabu, 29 Juli 2026 pukul 23:59 WIB',
      company_name: 'MENDUNIA.ID',
      bank_nama: 'BCA',
      bank_rekening: '1235545',
      bank_pemilik: 'PT INDONESIA SUKSES MENDUNIA',
      konfirmasi_url: 'http://localhost:5173/checkout-berhasil/token',
      invoice_url: 'http://localhost:5173/pendaftar/1/invoice',
      tanggal_daftar: '28 July 2026',
      status: 'Disetujui',
      waktu: '28 July 2026 12:00',
      login_url: 'http://localhost:5173/login',
    }
    let text = ''
    if (tmpl.subject) {
      text += 'SUBJECT: ' + tmpl.subject + '\n\n'
    }
    text += tmpl.body.replace(/\{(\w+)\}/g, (_, k) => vars[k] || `{${k}}`)
    return text
  }

  const filteredTemplates = templates.filter(t => t.channel === channel)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-[#1a73e8]" size={32} />
      </div>
    )
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Template Notifikasi</h1>
            <p className="text-sm text-[#5f6368]">Kelola teks notifikasi email & WhatsApp yang dikirim ke kandidat</p>
          </div>
        </div>
      </div>

      {/* Channel Tabs */}
      <div className="mb-4 inline-flex border border-[#dadce0] bg-white p-1">
        <button
          onClick={() => setChannel('email')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${ channel === 'email' ? 'bg-[#e8f0fe] text-[#1967d2]' : 'text-[#5f6368] hover:bg-[#f8f9fa]' }`}
        >
          <Mail size={16} />
          Email
        </button>
        <button
          onClick={() => setChannel('whatsapp')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${ channel === 'whatsapp' ? 'bg-[#e8f0fe] text-[#1967d2]' : 'text-[#5f6368] hover:bg-[#f8f9fa]' }`}
        >
          <MessageSquare size={16} />
          WhatsApp
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-[#e6f4ea] border border-[#a8dab5] text-[#137333] text-sm">
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 p-4 bg-[#fce8e6] border border-[#f6aea9] text-[#a50e0e] text-sm">
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      <div className="space-y-4">
        {filteredTemplates.map(tmpl => (
          <div key={tmpl.id} className="bg-white border border-[#dadce0] overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === tmpl.id ? null : tmpl.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#f8f9fa] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border border-[#dadce0] bg-[#f1f3f4] flex items-center justify-center">
                  <FileText size={20} className="text-[#5f6368]" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-[#202124]">{tmpl.name}</p>
                  <p className="text-xs text-[#80868b] font-mono">{tmpl.key}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 ${tmpl.is_active ? 'bg-[#0E6187] text-white' : 'bg-[#f1f3f4] text-[#80868b]'}`}>
                  {tmpl.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
                {expanded === tmpl.id ? <ChevronUp size={18} className="text-[#80868b]" /> : <ChevronDown size={18} className="text-[#80868b]" />}
              </div>
            </button>

            {expanded === tmpl.id && (
              <div className="px-6 pb-6 border-t border-[#e8eaed] pt-4 space-y-4">
                {tmpl.description && (
                  <p className="text-xs text-[#5f6368] italic">{tmpl.description}</p>
                )}

                {/* Subject — only for email */}
                {channel === 'email' && (
                  <div>
                    <label className="block text-sm font-medium text-[#3c4043] mb-1.5">Subject Email</label>
                    <input
                      type="text"
                      value={tmpl.subject || ''}
                      onChange={e => handleChange(tmpl.id, 'subject', e.target.value)}
                      className="w-full px-4 py-2.5 border border-[#dadce0] text-sm focus:outline-none "
                    />
                  </div>
                )}

                {/* Body */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-[#3c4043]">Body Pesan {channel === 'whatsapp' && <span className="text-xs text-[#80868b] font-normal">(tanpa subject)</span>}</label>
                    <button
                      onClick={() => setPreviewKey(previewKey === tmpl.key ? null : tmpl.key)}
                      className="flex items-center gap-1 text-xs text-[#1a73e8] hover:underline"
                    >
                      {previewKey === tmpl.key ? <EyeOff size={14} /> : <Eye size={14} />}
                      {previewKey === tmpl.key ? 'Sembunyikan Preview' : 'Preview'}
                    </button>
                  </div>
                  <textarea
                    value={tmpl.body}
                    onChange={e => handleChange(tmpl.id, 'body', e.target.value)}
                    rows={channel === 'whatsapp' ? 8 : 12}
                    className="w-full px-4 py-3 border border-[#dadce0] text-sm font-mono focus:outline-none  resize-y"
                  />
                </div>

                {/* Variables Info */}
                {tmpl.variables && tmpl.variables.length > 0 && (
                  <div>
                    <p className="text-xs text-[#5f6368] mb-1">Variable yang tersedia:</p>
                    <div className="flex flex-wrap gap-1">
                      {tmpl.variables.map(v => (
                        <span key={v} className="text-xs bg-[#f1f3f4] text-[#5f6368] px-2 py-0.5">
                          {'{'}{v}{'}'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview */}
                {previewKey === tmpl.key && (
                  <div>
                    <p className="text-xs font-medium text-[#5f6368] mb-1">Preview:</p>
                    <pre className="w-full p-4 bg-[#f8f9fa] border border-[#dadce0] text-xs text-[#3c4043] whitespace-pre-wrap font-mono leading-relaxed">
                      {getPreview(tmpl)}
                    </pre>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => handleSave(tmpl.id)}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#0E6187] text-white text-sm font-medium hover:bg-[#1a2d4d] disabled:opacity-50 transition-colors"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Simpan
                  </button>
                  <button
                    onClick={() => handleReset(tmpl.id)}
                    className="flex items-center gap-2 px-4 py-2.5 border border-[#dadce0] text-[#5f6368] text-sm font-medium hover:bg-[#f8f9fa] transition-colors"
                  >
                    <RotateCcw size={14} />
                    Reset ke Default
                  </button>
                  <button
                    onClick={() => handleDelete(tmpl)}
                    className="flex items-center gap-2 px-4 py-2.5 border border-[#f6aea9] text-[#c5221f] text-sm font-medium hover:bg-[#fce8e6] transition-colors"
                  >
                    <Trash2 size={14} />
                    Hapus
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
