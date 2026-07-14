import { useState, useEffect } from 'react'
import { waSettingApi } from '../../services/api'
import {
  Settings,
  Bell,
  BellOff,
  Clock,
  Save,
  MessageSquare,
  Calendar,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Loader2,
  Package,
  X,
  Eye,
} from 'lucide-react'

interface KategoriSetting {
  kategori_id: number
  nama: string
  kode: string
  harga: number
  komisi: number
  jatuh_tempo_hari: number
  reminder_days: number[]
  is_enabled: boolean
  template_pesan: string | null
}

interface ProductSetting {
  id: number
  nama: string
  deskripsi: string | null
  total: number
  status: string
  kategori_count: number
  kategoris: KategoriSetting[]
}

interface GlobalSetting {
  key: string
  description: string
  is_enabled: boolean
  value?: string
}

const REMINDER_DAY_OPTIONS = [1, 2, 3, 5, 7, 10, 14, 21, 30]

const TEMPLATE_EXAMPLES = [
  {
    label: 'Pengingat Standar',
    template: 'Halo {nama},\n\nTagihan {kategori} sebesar {jumlah} akan jatuh tempo {hari}.\n\nSilakan lakukan pembayaran.\n\n- SIM Mendunia',
  },
  {
    label: 'Pengingat Formal',
    template: 'Yth. {nama},\n\nDengan ini kami informasikan bahwa tagihan {kategori} sebesar {jumlah} akan jatuh tempo {hari}.\n\nMohon segera melakukan pembayaran untuk menghindari keterlambatan.\n\nTerima kasih.\n- SIM Mendunia',
  },
  {
    label: 'Pengingat Singkat',
    template: 'Halo {nama}, pengingat: tagihan {kategori} ({jumlah}) jatuh tempo {hari}. Segera bayar ya.',
  },
  {
    label: 'Dengan Link',
    template: 'Halo {nama},\n\nTagihan {kategori} sebesar {jumlah} jatuh tempo {hari}.\n\nBayar sekarang: {link}\n\n- SIM Mendunia',
  },
]

const TEMPLATE_VARS = [
  { var: '{nama}', desc: 'Nama kandidat' },
  { var: '{kategori}', desc: 'Nama kategori pembayaran' },
  { var: '{jumlah}', desc: 'Jumlah tagihan (format Rp)' },
  { var: '{hari}', desc: 'Keterangan hari (misal: "besok", "3 hari")' },
  { var: '{link}', desc: 'Link invoice' },
]

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

export default function DataNotifikasiSetting() {
  const [products, setProducts] = useState<ProductSetting[]>([])
  const [globalSettings, setGlobalSettings] = useState<GlobalSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null)
  const [templateModal, setTemplateModal] = useState<{ produkId: number; kategoriId: number; current: string } | null>(null)
  const [templateDraft, setTemplateDraft] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [prodRes, globalRes] = await Promise.all([
        waSettingApi.getReminderSettings(),
        waSettingApi.getGlobalSettings(),
      ])
      setProducts(prodRes.data)
      setGlobalSettings(globalRes.data)
    } catch {
      setErrorMsg('Gagal memuat pengaturan')
    } finally {
      setLoading(false)
    }
  }

  const handleGlobalToggle = (key: string, value: boolean) => {
    setGlobalSettings(prev =>
      prev.map(s => s.key === key ? { ...s, is_enabled: value } : s)
    )
  }

  const handleGlobalValueChange = (key: string, value: string) => {
    setGlobalSettings(prev =>
      prev.map(s => s.key === key ? { ...s, value } : s)
    )
  }

  const handleKategoriToggle = (produkId: number, kategoriId: number, value: boolean) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id !== produkId) return p
        return {
          ...p,
          kategoris: p.kategoris.map(k =>
            k.kategori_id === kategoriId ? { ...k, is_enabled: value } : k
          ),
        }
      })
    )
  }

  const handleJatuhTempoChange = (produkId: number, kategoriId: number, hari: number) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id !== produkId) return p
        return {
          ...p,
          kategoris: p.kategoris.map(k =>
            k.kategori_id === kategoriId ? { ...k, jatuh_tempo_hari: hari } : k
          ),
        }
      })
    )
  }

  const handleReminderDaysToggle = (produkId: number, kategoriId: number, day: number) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id !== produkId) return p
        return {
          ...p,
          kategoris: p.kategoris.map(k => {
            if (k.kategori_id !== kategoriId) return k
            const current = k.reminder_days || []
            const newDays = current.includes(day)
              ? current.filter(d => d !== day)
              : [...current, day].sort((a, b) => b - a)
            return { ...k, reminder_days: newDays }
          }),
        }
      })
    )
  }

  const handleTemplateChange = (produkId: number, kategoriId: number, template: string) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id !== produkId) return p
        return {
          ...p,
          kategoris: p.kategoris.map(k =>
            k.kategori_id === kategoriId ? { ...k, template_pesan: template || null } : k
          ),
        }
      })
    )
  }

  const openTemplateModal = (produkId: number, kategoriId: number, current: string) => {
    setTemplateDraft(current || '')
    setTemplateModal({ produkId, kategoriId, current })
  }

  const saveTemplate = () => {
    if (templateModal) {
      handleTemplateChange(templateModal.produkId, templateModal.kategoriId, templateDraft)
      setTemplateModal(null)
    }
  }

  const applyExample = (example: string) => {
    setTemplateDraft(example)
  }

  const generatePreview = (template: string): string => {
    if (!template) return 'Halo Ahmad, tagihan DAFTAR sebesar Rp 400.000 akan jatuh tempo dalam 3 hari.\n\nSilakan lakukan pembayaran.\n\n- SIM Mendunia'
    return template
      .replace('{nama}', 'Ahmad')
      .replace('{kategori}', 'DAFTAR')
      .replace('{jumlah}', 'Rp 400.000')
      .replace('{hari}', 'dalam 3 hari')
      .replace('{link}', 'http://localhost:5173/pendaftar/1/invoice')
  }

  const saveGlobal = async () => {
    setSaving(true)
    setSuccessMsg('')
    setErrorMsg('')
    try {
      await waSettingApi.updateGlobalSettings(globalSettings)
      setSuccessMsg('Pengaturan global berhasil disimpan')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch {
      setErrorMsg('Gagal menyimpan pengaturan global')
    } finally {
      setSaving(false)
    }
  }

  const saveReminders = async () => {
    setSaving(true)
    setSuccessMsg('')
    setErrorMsg('')
    try {
      const allSettings = products.flatMap(p =>
        p.kategoris.map(k => ({
          kategori_id: k.kategori_id,
          jatuh_tempo_hari: k.jatuh_tempo_hari,
          reminder_days: k.reminder_days,
          is_enabled: k.is_enabled,
          template_pesan: k.template_pesan,
        }))
      )
      await waSettingApi.updateReminderSettings(allSettings)
      setSuccessMsg('Pengaturan reminder berhasil disimpan')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch {
      setErrorMsg('Gagal menyimpan pengaturan reminder')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-[#0D1F3C]" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0D1F3C]">Pengaturan Notifikasi WA</h1>
        <p className="text-sm text-slate-500 mt-1">
          Kelola pengiriman notifikasi WhatsApp otomatis per program
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
          <CheckCircle size={16} />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle size={16} />
          {errorMsg}
        </div>
      )}

      {/* Global Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0D1F3C]/10 flex items-center justify-center">
              <Settings size={20} className="text-[#0D1F3C]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#0D1F3C]">Pengaturan Global</h2>
              <p className="text-xs text-slate-500">Aktifkan/nonaktifkan jenis notifikasi</p>
            </div>
          </div>
          <button
            onClick={saveGlobal}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#0D1F3C] text-white rounded-xl text-sm font-medium hover:bg-[#1a2d4d] disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Simpan
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {globalSettings.map(setting => (
            <div key={setting.key} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {setting.is_enabled ? (
                  <Bell size={16} className="text-emerald-500" />
                ) : (
                  <BellOff size={16} className="text-slate-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-slate-700">{setting.description}</p>
                  <p className="text-xs text-slate-400 font-mono">{setting.key}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {setting.key === 'wa_pembayaran_admin_phones' && (
                  <input
                    type="text"
                    value={setting.value || ''}
                    onChange={e => handleGlobalValueChange(setting.key, e.target.value)}
                    placeholder="628xxxxxxxxxx,628xxxxxxxxxx"
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#0D1F3C]/20"
                  />
                )}
                <button
                  onClick={() => handleGlobalToggle(setting.key, !setting.is_enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    setting.is_enabled ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      setting.is_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-Product Reminder Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Package size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-[#0D1F3C]">Pengingat per Program</h2>
              <p className="text-xs text-slate-500">Pilih program, lalu atur pengingat per kategori pembayaran</p>
            </div>
          </div>
          <button
            onClick={saveReminders}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#0D1F3C] text-white rounded-xl text-sm font-medium hover:bg-[#1a2d4d] disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Simpan Semua
          </button>
        </div>

        {/* Table Header */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 grid grid-cols-12 gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <div className="col-span-4">Nama Produk</div>
          <div className="col-span-4">Kategori / Harga</div>
          <div className="col-span-1 text-center">Total</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-2 text-center">Aksi</div>
        </div>

        {/* Product Rows */}
        {products.length === 0 ? (
          <div className="px-6 py-8 text-center text-slate-400 text-sm">
            Tidak ada program ditemukan
          </div>
        ) : (
          products.map(product => {
            const isExpanded = expandedProduct === product.id
            const enabledCount = product.kategoris.filter(k => k.is_enabled).length

            return (
              <div key={product.id} className="border-b border-slate-100 last:border-b-0">
                {/* Product Header */}
                <div
                  className="px-6 py-4 grid grid-cols-12 gap-4 items-center cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                >
                  <div className="col-span-4 flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown size={16} className="text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight size={16} className="text-slate-400 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{product.nama}</p>
                      {product.deskripsi && (
                        <p className="text-xs text-slate-400 truncate max-w-[200px]">{product.deskripsi}</p>
                      )}
                    </div>
                  </div>
                  <div className="col-span-4">
                    {product.kategoris.slice(0, isExpanded ? 0 : 3).map(k => (
                      <div key={k.kategori_id} className="text-xs text-slate-600 flex items-center gap-1">
                        <span>{k.nama}</span>
                        <span className="text-slate-400">-</span>
                        <span>{formatRupiah(k.harga)}</span>
                      </div>
                    ))}
                    {!isExpanded && product.kategoris.length > 3 && (
                      <p className="text-[10px] text-slate-400">+{product.kategoris.length - 3} lainnya</p>
                    )}
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-sm font-semibold text-slate-700">{formatRupiah(product.total)}</span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700">
                      {enabledCount}/{product.kategori_count} aktif
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-xs text-slate-500">
                      {isExpanded ? 'Tutup' : 'Atur Pengingat'}
                    </span>
                  </div>
                </div>

                {/* Expanded: Category Settings */}
                {isExpanded && (
                  <div className="bg-slate-50/80 border-t border-slate-100">
                    {product.kategoris.map(kategori => (
                      <div
                        key={kategori.kategori_id}
                        className="px-6 py-4 ml-8 border-b border-slate-100 last:border-b-0"
                      >
                        <div className="flex items-start justify-between gap-6">
                          {/* Kategori Info */}
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${kategori.is_enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            <div>
                              <p className="text-sm font-semibold text-slate-700">{kategori.nama}</p>
                              <p className="text-xs text-slate-400">{kategori.kode} - {formatRupiah(kategori.harga)}</p>
                            </div>
                          </div>

                          {/* Settings */}
                          <div className="flex-1 grid grid-cols-12 gap-4 items-start">
                            {/* Toggle */}
                            <div className="col-span-2">
                              <label className="block text-[10px] font-medium text-slate-500 mb-1">Status</label>
                              <button
                                onClick={() => handleKategoriToggle(product.id, kategori.kategori_id, !kategori.is_enabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  kategori.is_enabled ? 'bg-emerald-500' : 'bg-slate-300'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    kategori.is_enabled ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>

                            {/* Jatuh Tempo */}
                            <div className="col-span-2">
                              <label className="block text-[10px] font-medium text-slate-500 mb-1">
                                <Calendar size={10} className="inline mr-1" />
                                Jatuh Tempo
                              </label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min={1}
                                  max={365}
                                  value={kategori.jatuh_tempo_hari}
                                  onChange={e => handleJatuhTempoChange(product.id, kategori.kategori_id, parseInt(e.target.value) || 30)}
                                  className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#0D1F3C]/20 bg-white"
                                />
                                <span className="text-[10px] text-slate-400">hari</span>
                              </div>
                            </div>

                            {/* Reminder Days */}
                            <div className="col-span-5">
                              <label className="block text-[10px] font-medium text-slate-500 mb-1">
                                <Clock size={10} className="inline mr-1" />
                                Hari Pengingat
                              </label>
                              <div className="flex flex-wrap gap-1">
                                {REMINDER_DAY_OPTIONS.map(day => {
                                  const isActive = kategori.reminder_days?.includes(day)
                                  return (
                                    <button
                                      key={day}
                                      onClick={() => handleReminderDaysToggle(product.id, kategori.kategori_id, day)}
                                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                                        isActive
                                          ? 'bg-[#0D1F3C] text-white'
                                          : 'bg-white border border-slate-200 text-slate-500 hover:border-[#0D1F3C]'
                                      }`}
                                    >
                                      H-{day}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>

                            {/* Template */}
                            <div className="col-span-3">
                              <label className="block text-[10px] font-medium text-slate-500 mb-1">
                                <MessageSquare size={10} className="inline mr-1" />
                                Template Custom
                              </label>
                              <button
                                onClick={() => openTemplateModal(product.id, kategori.kategori_id, kategori.template_pesan || '')}
                                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-left bg-white hover:border-[#0D1F3C]/50 transition-colors flex items-center justify-between gap-1"
                              >
                                <span className={`truncate ${kategori.template_pesan ? 'text-slate-700' : 'text-slate-400'}`}>
                                  {kategori.template_pesan ? 'Teredit' : 'Default'}
                                </span>
                                <MessageSquare size={10} className="text-slate-400 shrink-0" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-700">
        <p className="font-medium mb-2">Cara kerja pengingat otomatis:</p>
        <ul className="list-disc list-inside space-y-1.5 text-xs">
          <li>Pengingat dikirim setiap hari jam 09:00 via cron job <code className="bg-blue-100 px-1 rounded">php artisan app:reminder-pembayaran</code></li>
          <li>Hanya mengirim pengingat untuk kategori yang sudah diaktifkan</li>
          <li>Jatuh tempo dihitung dari tanggal pendaftaran + hari yang ditentukan</li>
          <li>Pengingat tidak akan dikirim jika kategori sudah lunas</li>
          <li>Gunakan template custom untuk pesan yang lebih personal</li>
        </ul>
      </div>

      {/* Template Modal */}
      {templateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setTemplateModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <MessageSquare size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0D1F3C]">Edit Template Pesan</h3>
                  <p className="text-xs text-slate-500">Kosongkan untuk menggunakan pesan default</p>
                </div>
              </div>
              <button
                onClick={() => setTemplateModal(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Variables */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Variabel yang Tersedia</label>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATE_VARS.map(v => (
                    <button
                      key={v.var}
                      onClick={() => setTemplateDraft(prev => prev + v.var)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-mono text-slate-700 transition-colors"
                      title={v.desc}
                    >
                      {v.var}
                      <span className="text-slate-400 ml-1 text-[10px]">{v.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Example Templates */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Contoh Template</label>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATE_EXAMPLES.map(ex => (
                    <button
                      key={ex.label}
                      onClick={() => applyExample(ex.template)}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-left hover:border-[#0D1F3C]/50 hover:bg-slate-50 transition-colors"
                    >
                      <p className="text-[10px] font-semibold text-slate-500 uppercase">{ex.label}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{ex.template.substring(0, 60)}...</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Editor */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Tulis Template</label>
                <textarea
                  rows={8}
                  value={templateDraft}
                  onChange={e => setTemplateDraft(e.target.value)}
                  placeholder="Tulis pesan custom di sini..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0D1F3C]/20 resize-none"
                />
              </div>

              {/* Preview */}
              <div>
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 mb-2">
                  <Eye size={12} />
                  Preview Pesan
                </label>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 whitespace-pre-wrap text-sm text-slate-700 font-mono leading-relaxed">
                  {generatePreview(templateDraft)}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setTemplateDraft('')}
                className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                Reset ke Default
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTemplateModal(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={saveTemplate}
                  className="px-4 py-2 bg-[#0D1F3C] text-white rounded-xl text-sm font-medium hover:bg-[#1a2d4d] transition-colors"
                >
                  Simpan Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
