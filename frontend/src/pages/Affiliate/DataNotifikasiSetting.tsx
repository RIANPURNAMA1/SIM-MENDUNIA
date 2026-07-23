import { useState, useEffect } from 'react'
import { waSettingApi, batchApi } from '../../services/api'
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
  X,
  Eye,
  Layers,
  Mail,

  Smartphone,
  Globe,
} from 'lucide-react'

interface BatchDeadlineItem {
  id?: number
  kategori_id: number
  kategori_nama: string
  kategori_kode: string
  tanggal_awal: string | null
  tanggal_akhir: string | null
  reminder_days: number[]
  is_enabled: boolean
  template_pesan: string | null
  channel: string
  template_email: string | null
  subject_email: string | null
}

interface BatchDeadlineGroup {
  batch_id: number
  batch_nama: string
  batch_status: string
  deadlines: BatchDeadlineItem[]
}

interface Batch {
  id: number
  nama_batch: string
  status: string
}

interface GlobalSetting {
  key: string
  description: string
  is_enabled: boolean
  value?: string
}

interface KategoriFlat {
  id: number
  nama: string
  kode: string
  urutan: number
}

const REMINDER_DAY_OPTIONS = [1, 2, 3, 5, 7, 10, 14, 21, 30]

const CHANNEL_OPTIONS = [
  { value: 'wa', label: 'WhatsApp', icon: Smartphone, color: 'text-green-600' },
  { value: 'email', label: 'Email', icon: Mail, color: 'text-blue-600' },
  { value: 'both', label: 'Keduanya', icon: Globe, color: 'text-purple-600' },
]

const TEMPLATE_EXAMPLES = [
  {
    label: 'Pengingat Standar',
    template: 'Halo {nama},\n\nTagihan {kategori} sebesar {jumlah} akan jatuh tempo {hari}.\n\nSilakan lakukan pembayaran.\n\n- SIM Mendunia',
  },
  {
    label: 'Pengingat Formal',
    template: 'Yth. {nama},\n\nDengan ini kami informasikan bahwa tagihan {kategori} sebesar {jumlah} akan jatuh tempo {hari}.\n\nMohon segera melakukan pembayaran.\n\nTerima kasih.\n- SIM Mendunia',
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

const EMAIL_TEMPLATE_EXAMPLES = [
  {
    label: 'Standar',
    subject: 'Pengingat Pembayaran - {kategori}',
    body: 'Halo {nama},\n\nTagihan {kategori} sebesar {jumlah} akan jatuh tempo {hari}.\n\nSilakan lakukan pembayaran melalui link berikut:\n{link}\n\nTerima kasih.\n- SIM Mendunia',
  },
  {
    label: 'Formal',
    subject: 'Notifikasi Pembayaran - {kategori}',
    body: 'Yth. {nama},\n\nDengan ini kami informasikan bahwa tagihan {kategori} sebesar {jumlah} akan jatuh tempo {hari}.\n\nMohon segera melakukan pembayaran untuk menghindari keterlambatan.\n\nTerima kasih.\n- SIM Mendunia',
  },
]

const TEMPLATE_VARS = [
  { var: '{nama}', desc: 'Nama kandidat' },
  { var: '{kategori}', desc: 'Nama kategori' },
  { var: '{jumlah}', desc: 'Jumlah tagihan' },
  { var: '{hari}', desc: 'Keterangan hari' },
  { var: '{link}', desc: 'Link invoice' },
]

export default function DataNotifikasiSetting() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null)
  const [allKategoris, setAllKategoris] = useState<KategoriFlat[]>([])
  const [deadlines, setDeadlines] = useState<BatchDeadlineItem[]>([])
  const [globalSettings, setGlobalSettings] = useState<GlobalSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [expandedKategori, setExpandedKategori] = useState<number | null>(null)
  const [waTemplateModal, setWaTemplateModal] = useState<{ kategoriId: number; current: string } | null>(null)
  const [emailTemplateModal, setEmailTemplateModal] = useState<{ kategoriId: number; currentTemplate: string; currentSubject: string } | null>(null)
  const [waDraft, setWaDraft] = useState('')
  const [emailDraft, setEmailDraft] = useState('')
  const [emailSubjectDraft, setEmailSubjectDraft] = useState('')
  const [activeTab, setActiveTab] = useState<'global' | 'batch'>('global')

  useEffect(() => { loadInitialData() }, [])

  useEffect(() => {
    if (selectedBatchId) loadBatchDeadlines(selectedBatchId)
  }, [selectedBatchId])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [batchRes, kategoriRes, globalRes, existingRes] = await Promise.all([
        batchApi.list(),
        waSettingApi.getReminderSettings(),
        waSettingApi.getGlobalSettings(),
        waSettingApi.getBatchDeadlines(),
      ])
      const batchList = Array.isArray(batchRes.data) ? batchRes.data : (batchRes.data?.data || [])
      setBatches(batchList)
      setGlobalSettings(globalRes.data)

      const katList: KategoriFlat[] = []
      const seenIds = new Set<number>()
      for (const product of (Array.isArray(kategoriRes.data) ? kategoriRes.data : []) as any[]) {
        if (product.kategoris) {
          for (const k of product.kategoris) {
            if (!seenIds.has(k.kategori_id)) {
              seenIds.add(k.kategori_id)
              katList.push({ id: k.kategori_id, nama: k.nama, kode: k.kode, urutan: 0 })
            }
          }
        }
      }
      setAllKategoris(katList)

      if (batchList.length > 0 && !selectedBatchId) {
        setSelectedBatchId(batchList[0].id)
      }
    } catch {
      setErrorMsg('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const loadBatchDeadlines = async (batchId: number) => {
    try {
      const res = await waSettingApi.getBatchDeadlines(batchId)
      const groups: BatchDeadlineGroup[] = res.data
      const group = groups.find(g => g.batch_id === batchId)
      setDeadlines(group ? group.deadlines : [])
    } catch { setDeadlines([]) }
  }

  const ensureAllKategoris = () => {
    const existing = new Map(deadlines.map(d => [d.kategori_id, d]))
    return allKategoris.map(k => {
      if (existing.has(k.id)) return existing.get(k.id)!
      return {
        kategori_id: k.id, kategori_nama: k.nama, kategori_kode: k.kode,
        tanggal_awal: null, tanggal_akhir: null, reminder_days: [7, 3, 1],
        is_enabled: true, template_pesan: null, channel: 'wa',
        template_email: null, subject_email: null,
      }
    })
  }

  const displayDeadlines = ensureAllKategoris()

  const updateDeadline = (kategoriId: number, field: string, value: any) => {
    setDeadlines(prev => {
      const existing = prev.find(d => d.kategori_id === kategoriId)
      if (existing) return prev.map(d => d.kategori_id === kategoriId ? { ...d, [field]: value } : d)
      const kat = allKategoris.find(k => k.id === kategoriId)
      return [...prev, {
        kategori_id: kategoriId, kategori_nama: kat?.nama ?? '-', kategori_kode: kat?.kode ?? '-',
        tanggal_awal: null, tanggal_akhir: null, reminder_days: [7, 3, 1],
        is_enabled: true, template_pesan: null, channel: 'wa',
        template_email: null, subject_email: null, [field]: value,
      }]
    })
  }

  const handleReminderDaysToggle = (kategoriId: number, day: number) => {
    const current = deadlines.find(d => d.kategori_id === kategoriId)
    const days = current?.reminder_days || []
    const newDays = days.includes(day) ? days.filter(d => d !== day) : [...days, day].sort((a, b) => b - a)
    updateDeadline(kategoriId, 'reminder_days', newDays)
  }

  const saveBatchDeadlines = async () => {
    if (!selectedBatchId) return
    setSaving(true); setSuccessMsg(''); setErrorMsg('')
    try {
      const payload = displayDeadlines.map(d => ({
        batch_id: selectedBatchId!, kategori_id: d.kategori_id,
        tanggal_awal: d.tanggal_awal || null, tanggal_akhir: d.tanggal_akhir || null,
        reminder_days: d.reminder_days, is_enabled: d.is_enabled,
        template_pesan: d.template_pesan, channel: d.channel,
        template_email: d.template_email, subject_email: d.subject_email,
      }))
      await waSettingApi.saveBatchDeadlines(payload)
      setSuccessMsg('Pengaturan notifikasi berhasil disimpan')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch { setErrorMsg('Gagal menyimpan') } finally { setSaving(false) }
  }

  const saveGlobal = async () => {
    setSaving(true); setSuccessMsg(''); setErrorMsg('')
    try {
      await waSettingApi.updateGlobalSettings(globalSettings)
      setSuccessMsg('Pengaturan global berhasil disimpan')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch { setErrorMsg('Gagal menyimpan') } finally { setSaving(false) }
  }

  const handleGlobalToggle = (key: string, value: boolean) => {
    setGlobalSettings(prev => prev.map(s => s.key === key ? { ...s, is_enabled: value } : s))
  }

  const handleGlobalValueChange = (key: string, value: string) => {
    setGlobalSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s))
  }

  const openWaTemplate = (kategoriId: number, current: string) => {
    setWaDraft(current || '')
    setWaTemplateModal({ kategoriId, current })
  }

  const openEmailTemplate = (kategoriId: number, template: string, subject: string) => {
    setEmailDraft(template || '')
    setEmailSubjectDraft(subject || '')
    setEmailTemplateModal({ kategoriId, currentTemplate: template, currentSubject: subject })
  }

  const saveWaTemplate = () => {
    if (waTemplateModal) {
      updateDeadline(waTemplateModal.kategoriId, 'template_pesan', waDraft || null)
      setWaTemplateModal(null)
    }
  }

  const saveEmailTemplate = () => {
    if (emailTemplateModal) {
      updateDeadline(emailTemplateModal.kategoriId, 'template_email', emailDraft || null)
      updateDeadline(emailTemplateModal.kategoriId, 'subject_email', emailSubjectDraft || null)
      setEmailTemplateModal(null)
    }
  }

  const generateWaPreview = (template: string): string => {
    if (!template) return 'Halo Ahmad, tagihan DAFTAR sebesar Rp 400.000 akan jatuh tempo dalam 3 hari.\n\nSilakan lakukan pembayaran.\n\n- SIM Mendunia'
    return template.replace('{nama}', 'Ahmad').replace('{kategori}', 'DAFTAR').replace('{jumlah}', 'Rp 400.000').replace('{hari}', 'dalam 3 hari').replace('{link}', `${window.location.origin}/pendaftar/1/invoice`)
  }

  const generateEmailPreview = (subject: string, body: string): { subject: string; body: string } => {
    const s = (subject || 'Pengingat Pembayaran - {kategori}').replace('{kategori}', 'DAFTAR')
    const b = (!body ? 'Halo Ahmad,\n\nTagihan DAFTAR sebesar Rp 400.000 akan jatuh tempo dalam 3 hari.\n\nSilakan lakukan pembayaran.\n\n- SIM Mendunia' : body)
      .replace('{nama}', 'Ahmad').replace('{kategori}', 'DAFTAR').replace('{jumlah}', 'Rp 400.000').replace('{hari}', 'dalam 3 hari').replace('{link}', `${window.location.origin}/pendaftar/1/invoice`)
    return { subject: s, body: b }
  }

  const selectedBatch = batches.find(b => b.id === selectedBatchId)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-[#0E6187]" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0E6187]">Pengaturan Notifikasi</h1>
        <p className="text-sm text-slate-500 mt-1">
          Kelola pengiriman notifikasi WhatsApp & Email otomatis
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('global')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'global' ? 'bg-white text-[#0E6187] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Settings size={14} className="inline mr-1.5" />
          Pengaturan Global
        </button>
        <button
          onClick={() => setActiveTab('batch')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'batch' ? 'bg-white text-[#0E6187] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Layers size={14} className="inline mr-1.5" />
          Deadline per Batch
        </button>
      </div>

      {/* Global Settings */}
      {activeTab === 'global' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0E6187]/10 flex items-center justify-center">
                <Settings size={20} className="text-[#0E6187]" />
              </div>
              <div>
                <h2 className="font-semibold text-[#0E6187]">Pengaturan Global</h2>
                <p className="text-xs text-slate-500">Aktifkan/nonaktifkan jenis notifikasi</p>
              </div>
            </div>
            <button onClick={saveGlobal} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#0E6187] text-white rounded-xl text-sm font-medium hover:bg-[#1a2d4d] disabled:opacity-50 transition-colors">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Simpan
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {globalSettings.map(setting => (
              <div key={setting.key} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {setting.key.includes('email') ? <Mail size={16} className="text-blue-500" /> :
                   setting.is_enabled ? <Bell size={16} className="text-emerald-500" /> : <BellOff size={16} className="text-slate-400" />}
                  <div>
                    <p className="text-sm font-medium text-slate-700">{setting.description}</p>
                    <p className="text-xs text-slate-400 font-mono">{setting.key}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {setting.key === 'wa_pembayaran_admin_phones' && (
                    <input type="text" value={setting.value || ''}
                      onChange={e => handleGlobalValueChange(setting.key, e.target.value)}
                      placeholder="628xxxxxxxxxx"
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#0E6187]/20" />
                  )}
                  {setting.key === 'email_pembayaran_admin_addresses' && (
                    <input type="text" value={setting.value || ''}
                      onChange={e => handleGlobalValueChange(setting.key, e.target.value)}
                      placeholder="admin@example.com"
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#0E6187]/20" />
                  )}
                  <button onClick={() => handleGlobalToggle(setting.key, !setting.is_enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${setting.is_enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${setting.is_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Batch Deadline Settings */}
      {activeTab === 'batch' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Layers size={20} className="text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-[#0E6187]">Deadline per Batch</h2>
                <p className="text-xs text-slate-500">Atur channel (WA/Email), tanggal, dan template per kategori</p>
              </div>
            </div>
            <button onClick={saveBatchDeadlines} disabled={saving || !selectedBatchId}
              className="flex items-center gap-2 px-4 py-2 bg-[#0E6187] text-white rounded-xl text-sm font-medium hover:bg-[#1a2d4d] disabled:opacity-50 transition-colors">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Simpan
            </button>
          </div>

          {/* Batch Selector */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <label className="block text-xs font-semibold text-slate-600 mb-2">Pilih Batch</label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <select value={selectedBatchId ?? ''}
                  onChange={e => setSelectedBatchId(Number(e.target.value) || null)}
                  className="w-full appearance-none px-4 py-2.5 pr-10 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0E6187]/20">
                  <option value="">-- Pilih Batch --</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.nama_batch} ({b.status})</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              {selectedBatch && (
                <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                  {selectedBatch.nama_batch} &middot; {displayDeadlines.length} kategori
                </span>
              )}
            </div>
          </div>

          {/* Table Header */}
          {selectedBatchId && (
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 grid grid-cols-12 gap-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <div className="col-span-2">Kategori</div>
              <div className="col-span-1 text-center">Aktif</div>
              <div className="col-span-2">Channel</div>
              <div className="col-span-2"><Calendar size={10} className="inline mr-1" />Awal</div>
              <div className="col-span-2"><Calendar size={10} className="inline mr-1" />Akhir</div>
              <div className="col-span-1">Hari</div>
              <div className="col-span-2 text-center">Template</div>
            </div>
          )}

          {!selectedBatchId ? (
            <div className="px-6 py-8 text-center text-slate-400 text-sm">Pilih batch terlebih dahulu</div>
          ) : displayDeadlines.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-400 text-sm">Tidak ada kategori</div>
          ) : (
            displayDeadlines.map(item => {
              const isExpanded = expandedKategori === item.kategori_id
              return (
                <div key={item.kategori_id} className="border-b border-slate-100 last:border-b-0">
                  <div className="px-6 py-3 grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-2 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${item.is_enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{item.kategori_nama}</p>
                        <p className="text-[10px] text-slate-400">{item.kategori_kode}</p>
                      </div>
                    </div>

                    <div className="col-span-1 flex justify-center">
                      <button onClick={() => updateDeadline(item.kategori_id, 'is_enabled', !item.is_enabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.is_enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.is_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    {/* Channel Selector */}
                    <div className="col-span-2">
                      <div className="flex gap-1">
                        {CHANNEL_OPTIONS.map(opt => {
                          const Icon = opt.icon
                          const isActive = item.channel === opt.value
                          return (
                            <button key={opt.value}
                              onClick={() => updateDeadline(item.kategori_id, 'channel', opt.value)}
                              title={opt.label}
                              className={`p-1.5 rounded-lg text-[10px] font-medium transition-colors flex items-center gap-1 ${
                                isActive ? `bg-[#0E6187] text-white` : 'bg-white border border-slate-200 text-slate-500 hover:border-[#0E6187]'
                              }`}>
                              <Icon size={10} />
                              <span className="hidden sm:inline">{opt.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <input type="date" value={item.tanggal_awal || ''}
                        onChange={e => updateDeadline(item.kategori_id, 'tanggal_awal', e.target.value || null)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0E6187]/20" />
                    </div>

                    <div className="col-span-2">
                      <input type="date" value={item.tanggal_akhir || ''}
                        onChange={e => updateDeadline(item.kategori_id, 'tanggal_akhir', e.target.value || null)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0E6187]/20" />
                    </div>

                    <div className="col-span-1">
                      {isExpanded ? (
                        <div className="flex flex-wrap gap-0.5">
                          {REMINDER_DAY_OPTIONS.slice(0, 5).map(day => (
                            <button key={day}
                              onClick={() => handleReminderDaysToggle(item.kategori_id, day)}
                              className={`px-1 py-0.5 rounded text-[9px] font-medium transition-colors ${
                                item.reminder_days?.includes(day) ? 'bg-[#0E6187] text-white' : 'bg-white border border-slate-200 text-slate-500'
                              }`}>H-{day}</button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-0.5">
                          {(item.reminder_days || []).sort((a, b) => b - a).slice(0, 3).map(d => (
                            <span key={d} className="px-1 py-0.5 bg-[#0E6187]/10 text-[#0E6187] rounded text-[9px] font-medium">H-{d}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="col-span-2 flex items-center justify-center gap-1">
                      {(item.channel === 'wa' || item.channel === 'both') && (
                        <button onClick={() => openWaTemplate(item.kategori_id, item.template_pesan || '')}
                          className="p-1.5 hover:bg-green-50 rounded-lg transition-colors" title="Template WhatsApp">
                          <MessageSquare size={12} className="text-green-600" />
                        </button>
                      )}
                      {(item.channel === 'email' || item.channel === 'both') && (
                        <button onClick={() => openEmailTemplate(item.kategori_id, item.template_email || '', item.subject_email || '')}
                          className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors" title="Template Email">
                          <Mail size={12} className="text-blue-600" />
                        </button>
                      )}
                      <button onClick={() => setExpandedKategori(isExpanded ? null : item.kategori_id)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="Detail">
                        {isExpanded ? <ChevronDown size={12} className="text-slate-400" /> : <ChevronRight size={12} className="text-slate-400" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="bg-slate-50/80 border-t border-slate-100 px-6 py-4 ml-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-2"><Clock size={10} className="inline mr-1" />Hari Pengingat</label>
                          <div className="flex flex-wrap gap-1.5">
                            {REMINDER_DAY_OPTIONS.map(day => (
                              <button key={day}
                                onClick={() => handleReminderDaysToggle(item.kategori_id, day)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                  item.reminder_days?.includes(day) ? 'bg-[#0E6187] text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-[#0E6187]'
                                }`}>H-{day}</button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3">
                          {(item.channel === 'wa' || item.channel === 'both') && (
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1"><MessageSquare size={10} className="inline mr-1" />Template WhatsApp</label>
                              <button onClick={() => openWaTemplate(item.kategori_id, item.template_pesan || '')}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-left bg-white hover:border-green-400 transition-colors flex items-center justify-between">
                                <span className={`truncate ${item.template_pesan ? 'text-slate-700' : 'text-slate-400'}`}>
                                  {item.template_pesan ? 'Template custom' : 'Default'}
                                </span>
                                <MessageSquare size={12} className="text-slate-400 shrink-0" />
                              </button>
                            </div>
                          )}
                          {(item.channel === 'email' || item.channel === 'both') && (
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1"><Mail size={10} className="inline mr-1" />Template Email</label>
                              <button onClick={() => openEmailTemplate(item.kategori_id, item.template_email || '', item.subject_email || '')}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-left bg-white hover:border-blue-400 transition-colors flex items-center justify-between">
                                <span className={`truncate ${item.template_email ? 'text-slate-700' : 'text-slate-400'}`}>
                                  {item.template_email ? item.subject_email || 'Template custom' : 'Default'}
                                </span>
                                <Mail size={12} className="text-slate-400 shrink-0" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-700">
        <p className="font-medium mb-2">Cara kerja notifikasi otomatis:</p>
        <ul className="list-disc list-inside space-y-1.5 text-xs">
          <li><strong>Channel</strong>: Pilih WhatsApp, Email, atau Keduanya per kategori</li>
          <li>Pengingat dikirim setiap hari jam 09:00 via <code className="bg-blue-100 px-1 rounded">php artisan app:reminder-pembayaran</code></li>
          <li>Email memerlukan konfigurasi SMTP di <code className="bg-blue-100 px-1 rounded">.env</code> (MAIL_MAILER, MAIL_HOST, dll)</li>
          <li>Jika SMTP belum dikonfigurasi, email akan di-log saja (tidak terkirim)</li>
          <li>Pengingat tidak akan dikirim jika kategori sudah lunas</li>
        </ul>
      </div>

      {/* WA Template Modal */}
      {waTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setWaTemplateModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center"><MessageSquare size={20} className="text-green-600" /></div>
                <div>
                  <h3 className="font-semibold text-[#0E6187]">Template WhatsApp</h3>
                  <p className="text-xs text-slate-500">Kosongkan untuk default</p>
                </div>
              </div>
              <button onClick={() => setWaTemplateModal(null)} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Variabel</label>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATE_VARS.map(v => (
                    <button key={v.var} onClick={() => setWaDraft(prev => prev + v.var)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-mono text-slate-700 transition-colors" title={v.desc}>
                      {v.var} <span className="text-slate-400 ml-1 text-[10px]">{v.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Contoh</label>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATE_EXAMPLES.map(ex => (
                    <button key={ex.label} onClick={() => setWaDraft(ex.template)}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-left hover:border-green-400 hover:bg-slate-50 transition-colors">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase">{ex.label}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{ex.template.substring(0, 50)}...</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Tulis Template</label>
                <textarea rows={6} value={waDraft} onChange={e => setWaDraft(e.target.value)}
                  placeholder="Tulis pesan..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0E6187]/20 resize-none" />
              </div>
              <div>
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 mb-2"><Eye size={12} />Preview</label>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 whitespace-pre-wrap text-sm text-slate-700 font-mono leading-relaxed">
                  {generateWaPreview(waDraft)}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <button onClick={() => setWaDraft('')} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">Reset</button>
              <div className="flex items-center gap-2">
                <button onClick={() => setWaTemplateModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl">Batal</button>
                <button onClick={saveWaTemplate} className="px-4 py-2 bg-[#0E6187] text-white rounded-xl text-sm font-medium hover:bg-[#1a2d4d]">Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Template Modal */}
      {emailTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEmailTemplateModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Mail size={20} className="text-blue-600" /></div>
                <div>
                  <h3 className="font-semibold text-[#0E6187]">Template Email</h3>
                  <p className="text-xs text-slate-500">Kosongkan untuk default HTML</p>
                </div>
              </div>
              <button onClick={() => setEmailTemplateModal(null)} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Variabel (klik untuk sisipkan)</label>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATE_VARS.map(v => (
                    <button key={v.var} onClick={() => setEmailDraft(prev => prev + v.var)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-mono text-slate-700 transition-colors" title={v.desc}>
                      {v.var} <span className="text-slate-400 ml-1 text-[10px]">{v.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Subject Email</label>
                <input type="text" value={emailSubjectDraft} onChange={e => setEmailSubjectDraft(e.target.value)}
                  placeholder="Pengingat Pembayaran - {kategori}"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0E6187]/20" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Contoh Template</label>
                <div className="grid grid-cols-2 gap-2">
                  {EMAIL_TEMPLATE_EXAMPLES.map(ex => (
                    <button key={ex.label} onClick={() => { setEmailSubjectDraft(ex.subject); setEmailDraft(ex.body) }}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-left hover:border-blue-400 hover:bg-slate-50 transition-colors">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase">{ex.label}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{ex.body.substring(0, 50)}...</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Body (teks biasa, akan di-wrap HTML otomatis)</label>
                <textarea rows={8} value={emailDraft} onChange={e => setEmailDraft(e.target.value)}
                  placeholder="Tulis isi email..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0E6187]/20 resize-none" />
              </div>
              <div>
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 mb-2"><Eye size={12} />Preview</label>
                <div className="bg-blue-50 border border-blue-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2 bg-blue-100 text-xs font-semibold text-blue-700">
                    Subject: {generateEmailPreview(emailSubjectDraft, emailDraft).subject}
                  </div>
                  <div className="p-4 whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                    {generateEmailPreview(emailSubjectDraft, emailDraft).body}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <button onClick={() => { setEmailDraft(''); setEmailSubjectDraft('') }} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">Reset</button>
              <div className="flex items-center gap-2">
                <button onClick={() => setEmailTemplateModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl">Batal</button>
                <button onClick={saveEmailTemplate} className="px-4 py-2 bg-[#0E6187] text-white rounded-xl text-sm font-medium hover:bg-[#1a2d4d]">Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
