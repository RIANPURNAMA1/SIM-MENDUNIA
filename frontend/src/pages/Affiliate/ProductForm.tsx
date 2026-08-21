import { useState, useEffect, useMemo } from 'react'
import {
  Package, Plus, Trash2, Upload, Trash, ChevronDown, ChevronRight, LayoutDashboard,
  Info, Tag, Award, Users, Layers, ArrowLeft, Loader2,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import api, { productApi, APP_URL } from '../../services/api'

interface KategoriItem {
  name: string
  harga: number
  komisi: number
  children: KategoriItem[]
  trigger_type: string
  trigger_value: string | null
  due_type: string
  due_value: string | null
  reminder_setting: string[] | null
  reminder_hour: string
  channel: string
  template_pesan: string | null
  template_email: string | null
  subject_email: string | null
}

interface KomisiTier {
  id?: number
  kategori_id: number | null
  kategori_name?: string
  batch_id: number | null
  min_orang: number
  max_orang: number | null
  komisi: number
  urutan: number
}

interface Batch {
  id: number
  nama_batch: string
  warna?: string | null
}

interface BiayaKategori {
  id: number
  kode: string
  nama: string
  deskripsi: string | null
  urutan: number
  parent_id: number | null
  children?: BiayaKategori[]
  trigger_type?: string
  trigger_value?: string | null
  due_type?: string
  due_value?: string | null
  reminder_setting?: string[] | null
  reminder_hour?: string | null
  channel?: string
  template_pesan?: string | null
  template_email?: string | null
  subject_email?: string | null
}

interface Product {
  id: number
  nama: string
  slug: string
  deskripsi: string | null
  kategori_items: KategoriItem[] | null
  harga: number
  komisi: number | null
  status: string
  is_affiliable: boolean
  batch_id: number | null
  gambar: string | null
  batch?: { id: number; nama_batch: string } | null
  biaya_kategoris: (BiayaKategori & { pivot: { harga: number; komisi: number } })[]
  komisi_tiers: KomisiTier[]
}

const TEMPLATE_VARS = [
  { var: '{nama}', desc: 'Nama' },
  { var: '{kategori}', desc: 'Kategori' },
  { var: '{jumlah}', desc: 'Jumlah' },
  { var: '{deadline}', desc: 'Deadline' },
  { var: '{link}', desc: 'Link Bayar' },
]

const WA_TEMPLATES = [
  { label: 'Pengingat Standar', template: 'Halo {nama},\n\nTagihan {kategori} sebesar {jumlah} jatuh tempo {deadline}.\n\nSilakan lakukan pembayaran.\n- SIM Mendunia' },
  { label: 'Pengingat Singkat', template: 'Halo {nama}, pengingat: tagihan {kategori} ({jumlah}) jatuh tempo {deadline}. Segera bayar ya.' },
  { label: 'Dengan Link', template: 'Halo {nama},\n\nTagihan {kategori} sebesar {jumlah} jatuh tempo {deadline}.\n\nBayar sekarang: {link}\n- SIM Mendunia' },
  { label: 'Formal', template: 'Yth. {nama},\n\nKami informasikan bahwa tagihan {kategori} sebesar {jumlah} jatuh tempo {deadline}.\n\nMohon segera melakukan pembayaran.\nTerima kasih.\n- SIM Mendunia' },
]

const EMAIL_TEMPLATES = [
  { label: 'Standar', subject: 'Pengingat Pembayaran - {kategori}', body: 'Halo {nama},\n\nTagihan {kategori} sebesar {jumlah} jatuh tempo {deadline}.\n\nSilakan lakukan pembayaran melalui link berikut:\n{link}\n\nTerima kasih.\n- SIM Mendunia' },
  { label: 'Formal', subject: 'Notifikasi Pembayaran - {kategori}', body: 'Yth. {nama},\n\nDengan ini kami informasikan bahwa tagihan {kategori} sebesar {jumlah} jatuh tempo {deadline}.\n\nMohon segera melakukan pembayaran untuk menghindari keterlambatan.\n\nTerima kasih.\n- SIM Mendunia' },
]

function emptyKategoriItem(): KategoriItem {
  return { name: '', harga: 0, komisi: 0, children: [], trigger_type: 'registration', trigger_value: null, due_type: 'days_after_invoice', due_value: null, reminder_setting: null, reminder_hour: '09:00', channel: 'wa', template_pesan: null, template_email: null, subject_email: null }
}

function sumHargaDeep(item: KategoriItem): number {
  const own = item.harga || 0
  const kids = (item.children || []).reduce((s, c) => s + sumHargaDeep(c), 0)
  return own + kids
}

const inputClass = 'w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-gray-800 placeholder-slate-400 outline-none transition focus:border-[#0E6187] focus:ring-1 focus:ring-[#0E6187]'

const TABS = [
  { key: 'info' as const, label: 'Informasi Dasar', icon: Tag },
  { key: 'kategori' as const, label: 'Kategori & Harga', icon: Layers },
  { key: 'komisi' as const, label: 'Komisi', icon: Award },
]

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(isEdit)
  const [editing, setEditing] = useState<Product | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'kategori' | 'komisi'>('info')
  const [form, setForm] = useState({
    nama: '',
    deskripsi: '',
    komisi: '',
    status: 'aktif',
    is_affiliable: true,
    batch_id: '' as string,
    kategori_items: [emptyKategoriItem()] as KategoriItem[],
    komisi_tiers: [] as KomisiTier[],
  })
  const [gambarFile, setGambarFile] = useState<File | null>(null)
  const [gambarPreview, setGambarPreview] = useState<string | null>(null)
  const [hapusGambar, setHapusGambar] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [batches, setBatches] = useState<Batch[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/batches').then(res => setBatches(res.data.data || res.data)).catch(() => {})
    if (id) {
      setLoading(true)
      productApi.show(parseInt(id)).then(res => {
        applyProduct(res.data?.data || res.data)
      }).catch(() => {
        Swal.fire({ icon: 'error', title: 'Gagal', text: 'Produk tidak ditemukan.', confirmButtonColor: '#0E6187' })
        navigate('/data-product')
      }).finally(() => setLoading(false))
    }
  }, [id, navigate])

  function applyProduct(p: Product) {
    setEditing(p)
    function mapItems(items: any[]): KategoriItem[] {
      return (items || []).map(i => {
        const billingKategori = p.biaya_kategoris?.find((bk: any) => bk.nama?.toLowerCase() === (i.name || '').toLowerCase())
        return {
          name: i.name || '',
          harga: i.harga || 0,
          komisi: i.komisi || 0,
          children: mapItems(i.children || []),
          trigger_type: billingKategori?.trigger_type || i.trigger_type || 'registration',
          trigger_value: billingKategori?.trigger_value || i.trigger_value || null,
          due_type: billingKategori?.due_type || i.due_type || 'days_after_invoice',
          due_value: billingKategori?.due_value || i.due_value || null,
          reminder_setting: billingKategori?.reminder_setting || i.reminder_setting || null,
          reminder_hour: billingKategori?.reminder_hour || i.reminder_hour || '09:00',
          channel: billingKategori?.channel || i.channel || 'wa',
          template_pesan: billingKategori?.template_pesan || i.template_pesan || null,
          template_email: billingKategori?.template_email || i.template_email || null,
          subject_email: billingKategori?.subject_email || i.subject_email || null,
        }
      })
    }
    const items: KategoriItem[] = (p.kategori_items && p.kategori_items.length > 0)
      ? mapItems(p.kategori_items)
      : [emptyKategoriItem()]
    setForm({
      nama: p.nama, deskripsi: p.deskripsi || '',
      komisi: p.komisi ? String(p.komisi) : '', status: p.status,
      is_affiliable: p.is_affiliable !== false,
      batch_id: p.batch_id ? String(p.batch_id) : '',
      kategori_items: items,
      komisi_tiers: (p.komisi_tiers || []).map(t => {
        let resolvedName = t.kategori_name || ''
        if (!resolvedName && t.kategori_id && p.biaya_kategoris) {
          const bk = p.biaya_kategoris.find((bk: any) => bk.id === t.kategori_id)
          if (bk) {
            const parentMatch = p.kategori_items?.find((item: any) => item.name.toLowerCase() === bk.nama?.toLowerCase())
            if (parentMatch) resolvedName = parentMatch.name
            else resolvedName = bk.nama || ''
          }
        }
        return { ...t, batch_id: t.batch_id ?? null, kategori_name: resolvedName }
      }),
    })
    setGambarFile(null)
    setGambarPreview(p.gambar ? `${APP_URL}/storage/${p.gambar}` : null)
    setHapusGambar(false)
    setExpanded({})
    setActiveTab('info')
  }

  const totalHarga = useMemo(
    () => form.kategori_items.reduce((sum, item) => sum + sumHargaDeep(item), 0),
    [form.kategori_items]
  )

  // Navigate into nested KategoriItem tree. path[0] = items array index, subsequent = .children index
  function getItem(items: KategoriItem[], path: number[]): KategoriItem | null {
    let current: any = items
    for (let i = 0; i < path.length; i++) {
      if (i === 0) {
        current = current[path[i]]
      } else {
        current = current?.children?.[path[i]]
      }
      if (current === undefined || current === null) return null
    }
    return current
  }

  function updateItem(path: number[], field: keyof KategoriItem, value: any) {
    setForm(prev => {
      const items = JSON.parse(JSON.stringify(prev.kategori_items)) as KategoriItem[]
      const target = getItem(items, path)
      if (!target || field === 'children') return prev
      target[field] = value
      return { ...prev, kategori_items: items }
    })
  }

  function addItem(parentPath: number[]) {
    setForm(prev => {
      const items = JSON.parse(JSON.stringify(prev.kategori_items)) as KategoriItem[]
      if (parentPath.length === 0) {
        items.push(emptyKategoriItem())
      } else {
        const parent = getItem(items, parentPath)
        if (parent) {
          if (!parent.children) parent.children = []
          parent.children.push(emptyKategoriItem())
        }
      }
      return { ...prev, kategori_items: items }
    })
  }

  function removeItem(path: number[]) {
    setForm(prev => {
      const items = JSON.parse(JSON.stringify(prev.kategori_items)) as KategoriItem[]
      if (path.length === 1) {
        items.splice(path[0], 1)
      } else {
        const parent = getItem(items, path.slice(0, -1))
        if (parent && parent.children) {
          parent.children.splice(path[path.length - 1], 1)
        }
      }
      return { ...prev, kategori_items: items.length > 0 ? items : [emptyKategoriItem()] }
    })
  }

  function toggleExpand(key: string) {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function updateTier(index: number, field: string, value: any) {
    setForm(prev => {
      const tiers = [...prev.komisi_tiers]
      tiers[index] = { ...tiers[index], [field]: value }
      return { ...prev, komisi_tiers: tiers }
    })
  }

  function removeTier(index: number) {
    setForm(prev => ({ ...prev, komisi_tiers: prev.komisi_tiers.filter((_, i) => i !== index) }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validItems = form.kategori_items.filter(i => i.name.trim() !== '')
    if (validItems.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Perhatian', text: 'Tambahkan minimal satu kategori.', confirmButtonColor: '#0E6187' })
      return
    }

    function cleanItems(items: KategoriItem[]): any[] {
      return items
        .filter(i => i.name.trim() !== '')
        .map(i => ({
          name: i.name.trim(),
          harga: i.harga || 0,
          komisi: i.komisi || 0,
          trigger_type: i.trigger_type || 'registration',
          trigger_value: i.trigger_value || null,
          due_type: i.due_type || 'days_after_invoice',
          due_value: i.due_value || null,
          reminder_setting: i.reminder_setting || null,
          reminder_hour: i.reminder_hour || '09:00',
          channel: i.channel || 'wa',
          template_pesan: i.template_pesan || null,
          template_email: i.template_email || null,
          subject_email: i.subject_email || null,
          children: cleanItems(i.children || []),
        }))
    }

    const payload: Record<string, unknown> = {
      nama: form.nama, deskripsi: form.deskripsi,
      kategori_items: cleanItems(form.kategori_items),
      komisi: form.komisi ? parseFloat(form.komisi) : null,
      status: form.status,
      is_affiliable: form.is_affiliable,
      batch_id: form.batch_id ? parseInt(form.batch_id) : null,
      komisi_tiers: form.komisi_tiers.map(t => {
        let kid = t.kategori_id
        if (!kid && t.kategori_name && editing) {
          const matched = editing.biaya_kategoris?.find(
            (bk: any) => bk.nama?.toLowerCase() === t.kategori_name!.toLowerCase() || bk.kode?.toLowerCase() === t.kategori_name!.toLowerCase()
          )
          kid = matched?.id || null
        }
        return {
          kategori_id: kid, kategori_name: t.kategori_name || null,
          batch_id: t.batch_id || null,
          min_orang: t.min_orang,
          max_orang: t.max_orang || null, komisi: t.komisi, urutan: t.urutan,
        }
      }),
    }

    const send = () => {
      if (gambarFile || hapusGambar) {
        const fd = new FormData()
        if (gambarFile) fd.append('gambar', gambarFile)
        if (hapusGambar) fd.append('hapus_gambar', '1')
        Object.entries(payload).forEach(([k, v]) => {
          if (v !== null && v !== undefined) {
            fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v))
          }
        })
        if (editing) {
          fd.append('_method', 'PUT')
          return api.post(`/products/${editing.id}`, fd)
        }
        return api.post('/products', fd)
      }
      return editing ? productApi.update(editing.id, payload) : productApi.store(payload)
    }

    setSaving(true)
    send().then(() => {
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: editing ? 'Produk berhasil diperbarui.' : 'Produk berhasil ditambahkan.', confirmButtonColor: '#0E6187', timer: 2000, timerProgressBar: true, showConfirmButton: false })
      navigate('/data-product')
    }).catch((err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Terjadi kesalahan saat menyimpan data.'
      const errors = err?.response?.data?.errors
      let detail = msg
      if (errors) {
        detail = Object.entries(errors).map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`).join('\n')
      }
      Swal.fire({ icon: 'error', title: 'Gagal', text: detail, confirmButtonColor: '#0E6187' })
    }).finally(() => setSaving(false))
  }

  // Recursive render kategori row in form
  function renderKategoriRow(item: KategoriItem, path: number[], depth: number) {
    const key = path.join('-')
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expanded[key] !== false
    const ownTotal = sumHargaDeep(item)
    const billingKey = `billing-${key}`
    const isBillingOpen = expanded[billingKey] || false

    const TRIGGER_OPTIONS = [
      { value: 'registration', label: 'Saat Peserta Mendaftar' },
      { value: 'previous_paid', label: 'Setelah Kategori Sebelumnya Lunas' },
      { value: 'manual', label: 'Manual oleh Admin' },
      { value: 'fixed_date', label: 'Pada Tanggal Tertentu' },
      { value: 'schedule_start', label: 'Saat Jadwal Level Dimulai' },
    ]
    const DUE_OPTIONS = [
      { value: 'days_after_invoice', label: 'X Hari Setelah Invoice Dibuat' },
      { value: 'days_after_schedule_start', label: 'X Hari Setelah Jadwal Level Dimulai' },
      { value: 'fixed_date', label: 'Tanggal Tertentu' },
      { value: 'manual', label: 'Manual' },
      { value: 'none', label: 'Tidak Memiliki Jatuh Tempo' },
    ]
    const REMINDER_OPTIONS = ['H-7', 'H-3', 'H-1', 'Hari H', 'H+3', 'H+7']

    function updateBilling(field: string, value: any) {
      updateItem(path, field as any, value)
    }

    return (
      <div key={key} className={depth > 0 ? 'ml-4 mt-2 border-l-2 border-indigo-200 pl-3' : ''}>
        <div className={`rounded-lg border ${depth === 0 ? 'border-slate-300 bg-white shadow-sm' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-end gap-2 p-3">
            {hasChildren ? (
              <button type="button" onClick={() => toggleExpand(key)}
                className="flex-none p-1 rounded-md hover:bg-slate-100 transition mb-0.5">
                {isExpanded ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
              </button>
            ) : <span className="w-6 flex-none" />}
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-bold text-slate-600 mb-1.5">{depth === 0 ? 'Nama Kategori' : 'Nama Sub-Kategori'}</label>
              <input type="text" placeholder={depth === 0 ? 'Contoh: Level 1, SPP, Ujian...' : 'Contoh: MCU, Pembelajaran, Asrama...'}
                value={item.name}
                onChange={e => updateItem(path, 'name', e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="w-32 flex-none">
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Harga (Rp)</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                <input type="number" min={0} placeholder="0"
                  value={item.harga || ''}
                  onChange={e => updateItem(path, 'harga', parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-2 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            <div className="w-32 flex-none">
              <label className="block text-xs font-bold text-emerald-600 mb-1.5">Komisi (Rp)</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">Rp</span>
                <input type="number" min={0} placeholder="0"
                  value={item.komisi || ''}
                  onChange={e => updateItem(path, 'komisi', parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-emerald-300 bg-emerald-50 pl-9 pr-2 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
            </div>
            <button type="button" onClick={() => removeItem(path)}
              className="flex-none rounded-lg border border-slate-200 bg-white p-2 text-slate-400 transition hover:border-red-300 hover:bg-red-50 hover:text-red-500 mb-0.5">
              <Trash2 size={15} />
            </button>
          </div>

          {/* ===== Pengaturan Tagihan ===== */}
          <div className="mx-3 mb-3">
            <button type="button" onClick={() => toggleExpand(billingKey)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors">
              <span className="text-[11px] font-bold text-amber-700">Pengaturan Tagihan</span>
              <div className="flex items-center gap-1.5">
                {(item.trigger_type !== 'registration' || item.due_type !== 'days_after_invoice' || item.reminder_setting || (item.reminder_hour && item.reminder_hour !== '09:00')) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                )}
                {isBillingOpen ? <ChevronDown size={12} className="text-amber-600" /> : <ChevronRight size={12} className="text-amber-600" />}
              </div>
            </button>
            {isBillingOpen && (
              <div className="mt-2 p-3 rounded-lg border border-amber-200 bg-amber-50/50 space-y-3">
                {/* Trigger */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Trigger Pembuatan Tagihan</label>
                  <div className="space-y-1">
                    {TRIGGER_OPTIONS.map(opt => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
                        <input type="radio" name={`trigger-${key}`} value={opt.value}
                          checked={item.trigger_type === opt.value}
                          onChange={() => {
                            updateBilling('trigger_type', opt.value);
                            if (opt.value === 'schedule_start' && !item.trigger_value) {
                              const m = item.name.match(/level\s*([1-4])/i);
                              updateBilling('trigger_value', m ? m[1] : '1');
                            }
                          }}
                          className="w-3.5 h-3.5 text-amber-600 border-slate-300 focus:ring-amber-500" />
                        <span className="text-[11px] text-slate-600 group-hover:text-slate-800">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Level jadwal (untuk trigger/due berbasis jadwal level) */}
                {(item.trigger_type === 'schedule_start' || item.due_type === 'days_after_schedule_start') && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Level Jadwal</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {[1, 2, 3, 4].map(lv => (
                        <button key={lv} type="button"
                          onClick={() => updateBilling('trigger_value', String(lv))}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                            item.trigger_value === String(lv)
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'bg-white border border-amber-300 text-amber-700 hover:bg-amber-100'
                          }`}>Level {lv}</button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Tagihan mengikuti jadwal level ini di setiap batch kandidat.</p>
                  </div>
                )}

                {/* Due type */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Pengaturan Jatuh Tempo</label>
                  <div className="space-y-1.5">
                    {DUE_OPTIONS.map(opt => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
                        <input type="radio" name={`due-${key}`} value={opt.value}
                          checked={item.due_type === opt.value}
                          onChange={() => updateBilling('due_type', opt.value)}
                          className="w-3.5 h-3.5 text-amber-600 border-slate-300 focus:ring-amber-500" />
                        <span className="text-[11px] text-slate-600 group-hover:text-slate-800">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  {/* Conditional field */}
                  {(item.due_type === 'days_after_invoice' || item.due_type === 'days_after_schedule_start') && (
                    <div className="mt-2 ml-5">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Jumlah Hari</label>
                      <div className="flex gap-1.5 flex-wrap">
                        {[3, 7, 14, 30].map(d => (
                          <button key={d} type="button"
                            onClick={() => updateBilling('due_value', String(d))}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                              item.due_value === String(d)
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'bg-white border border-amber-300 text-amber-700 hover:bg-amber-100'
                            }`}>{d} Hari</button>
                        ))}
                        <button type="button"
                          onClick={() => updateBilling('due_value', '')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                            item.due_value && ![3,7,14,30].includes(Number(item.due_value))
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'bg-white border border-amber-300 text-amber-700 hover:bg-amber-100'
                          }`}>Custom</button>
                        <input type="number" min={1} placeholder="Hari"
                          value={item.due_value && ![3,7,14,30].includes(Number(item.due_value)) ? item.due_value : ''}
                          onChange={e => updateBilling('due_value', e.target.value || null)}
                          className="w-20 rounded-md border border-amber-300 bg-white px-2 py-1 text-[11px] text-slate-700 outline-none focus:ring-1 focus:ring-amber-400" />
                      </div>
                    </div>
                  )}
                  {item.due_type === 'fixed_date' && (
                    <div className="mt-2 ml-5">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Tanggal Jatuh Tempo</label>
                      <input type="date" value={item.due_value || ''}
                        onChange={e => updateBilling('due_value', e.target.value || null)}
                        className="rounded-md border border-amber-300 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 outline-none focus:ring-1 focus:ring-amber-400" />
                    </div>
                  )}
                </div>

                {/* Reminder */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Reminder Pembayaran</label>
                  <div className="flex flex-wrap gap-1.5 ml-1">
                    {REMINDER_OPTIONS.map(r => {
                      const active = item.reminder_setting?.includes(r) || false
                      return (
                        <button key={r} type="button"
                          onClick={() => {
                            const current = item.reminder_setting || []
                            const next = active ? current.filter(x => x !== r) : [...current, r]
                            updateBilling('reminder_setting', next.length > 0 ? next : null)
                          }}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${
                            active
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'bg-white border border-amber-300 text-amber-600 hover:bg-amber-100'
                          }`}>{r}</button>
                      )
                    })}
                  </div>
                  <div className="mt-2 ml-1">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Jam Pengiriman Notifikasi</label>
                    <input type="time" value={item.reminder_hour || '09:00'}
                      onChange={e => updateBilling('reminder_hour', e.target.value || '09:00')}
                      className="rounded-md border border-amber-300 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 outline-none focus:ring-1 focus:ring-amber-400" />
                  </div>
                </div>

                {/* Channel & Template */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Channel Pengiriman</label>
                  <div className="flex flex-wrap gap-1.5 ml-1 mb-3">
                    {[{ val: 'wa', label: 'WhatsApp' }, { val: 'email', label: 'Email' }, { val: 'both', label: 'Keduanya' }].map(ch => {
                      const active = (item.channel || 'wa') === ch.val
                      return (
                        <button key={ch.val} type="button"
                          onClick={() => updateBilling('channel', ch.val)}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${
                            active
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'bg-white border border-amber-300 text-amber-600 hover:bg-amber-100'
                          }`}>{ch.label}</button>
                      )
                    })}
                  </div>

                  {(item.channel === 'wa' || item.channel === 'both' || !item.channel) && (
                    <div className="mb-3">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Template Pesan WhatsApp</label>
                      <div className="flex flex-wrap gap-1 ml-1 mb-1.5">
                        {WA_TEMPLATES.map(t => (
                          <button key={t.label} type="button"
                            onClick={() => updateBilling('template_pesan', t.template)}
                            className={`px-2 py-0.5 rounded text-[9px] font-semibold transition-colors ${
                              item.template_pesan === t.template
                                ? 'bg-amber-500 text-white'
                                : 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100'
                            }`}>{t.label}</button>
                        ))}
                        <button type="button"
                          onClick={() => updateBilling('template_pesan', null)}
                          className={`px-2 py-0.5 rounded text-[9px] font-semibold transition-colors ${
                            !item.template_pesan
                              ? 'bg-slate-500 text-white'
                              : 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200'
                          }`}>Custom</button>
                      </div>
                      <div className="flex flex-wrap gap-1 ml-1 mb-1.5">
                        {TEMPLATE_VARS.map(v => (
                          <button key={v.var} type="button"
                            onClick={() => updateBilling('template_pesan', (item.template_pesan || '') + v.var)}
                            className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[9px] font-mono text-slate-600 transition-colors"
                            title={v.desc}>{v.var}</button>
                        ))}
                      </div>
                      <textarea rows={3} value={item.template_pesan || ''}
                        onChange={e => updateBilling('template_pesan', e.target.value || null)}
                        placeholder="Tulis atau pilih template di atas..."
                        className="w-full rounded-md border border-amber-300 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 outline-none focus:ring-1 focus:ring-amber-400 resize-none font-mono" />
                    </div>
                  )}

                  {(item.channel === 'email' || item.channel === 'both') && (
                    <>
                      <div className="mb-2">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Subject Email</label>
                        <div className="flex flex-wrap gap-1 ml-1 mb-1.5">
                          {TEMPLATE_VARS.map(v => (
                            <button key={v.var} type="button"
                              onClick={() => updateBilling('subject_email', (item.subject_email || '') + v.var)}
                              className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[9px] font-mono text-slate-600 transition-colors"
                              title={v.desc}>{v.var}</button>
                          ))}
                        </div>
                        <input type="text" value={item.subject_email || ''}
                          onChange={e => updateBilling('subject_email', e.target.value || null)}
                          placeholder="Contoh: Pengingat Pembayaran {kategori}"
                          className="w-full rounded-md border border-amber-300 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 outline-none focus:ring-1 focus:ring-amber-400 font-mono" />
                      </div>
                      <div className="mb-1">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Template Email</label>
                        <div className="flex flex-wrap gap-1 ml-1 mb-1.5">
                          {EMAIL_TEMPLATES.map(t => (
                            <button key={t.label} type="button"
                              onClick={() => { updateBilling('subject_email', t.subject); updateBilling('template_email', t.body) }}
                              className={`px-2 py-0.5 rounded text-[9px] font-semibold transition-colors ${
                                item.template_email === t.body
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100'
                              }`}>{t.label}</button>
                          ))}
                          <button type="button"
                            onClick={() => { updateBilling('template_email', null); updateBilling('subject_email', null) }}
                            className={`px-2 py-0.5 rounded text-[9px] font-semibold transition-colors ${
                              !item.template_email
                                ? 'bg-slate-500 text-white'
                                : 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200'
                            }`}>Custom</button>
                        </div>
                        <div className="flex flex-wrap gap-1 ml-1 mb-1.5">
                          {TEMPLATE_VARS.map(v => (
                            <button key={v.var} type="button"
                              onClick={() => updateBilling('template_email', (item.template_email || '') + v.var)}
                              className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[9px] font-mono text-slate-600 transition-colors"
                              title={v.desc}>{v.var}</button>
                          ))}
                        </div>
                        <textarea rows={4} value={item.template_email || ''}
                          onChange={e => updateBilling('template_email', e.target.value || null)}
                          placeholder="Tulis atau pilih template di atas..."
                          className="w-full rounded-md border border-amber-300 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 outline-none focus:ring-1 focus:ring-amber-400 resize-none font-mono" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Total badge for parent with children */}
          {hasChildren && depth === 0 && (
            <div className="flex items-center justify-between px-3 pb-2.5 -mt-1">
              <button type="button" onClick={() => addItem(path)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition">
                <Plus size={12} className="inline mr-0.5" /> Tambah Sub
              </button>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">
                Total: Rp {ownTotal.toLocaleString('id-ID')}
              </span>
            </div>
          )}
          {!hasChildren && depth === 0 && (
            <div className="flex justify-end px-3 pb-2.5 -mt-1">
              <button type="button" onClick={() => addItem(path)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition">
                <Plus size={12} className="inline mr-0.5" /> Tambah Sub
              </button>
            </div>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="space-y-2 mt-1">
            {item.children!.map((child, ci) => renderKategoriRow(child, [...path, ci], depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-[#0E6187]" />
      </div>
    )
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Breadcrumb */}
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-500" aria-label="Breadcrumb">
        <Link to="/" className="flex items-center gap-1 transition-colors hover:text-[#0E6187]">
          <LayoutDashboard size={13} />
          <span>Beranda</span>
        </Link>
        <ChevronRight size={12} className="text-slate-300" />
        <Link to="/data-product" className="transition-colors hover:text-[#0E6187]">Program &amp; Affiliate</Link>
        <ChevronRight size={12} className="text-slate-300" />
        <span className="font-medium text-slate-700">{isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}</span>
      </nav>

      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/data-product')}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700" title="Kembali">
            <ArrowLeft size={18} />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] text-white border border-blue-100">
            <Package size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">{isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}</h1>
            <p className="text-sm text-slate-500">{isEdit ? 'Perbarui data produk dan pengaturan komisi' : 'Lengkapi data produk untuk memulai'}</p>
          </div>
        </div>
      </div>



      <form onSubmit={handleSubmit} onKeyDown={e => {
        if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
          e.preventDefault()
        }
      }}>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Tabs (bisa diklik bebas) */}
          <div className="border-b border-slate-200 px-4 sm:px-5">
            <div className="flex gap-1 overflow-x-auto">
              {TABS.map(tab => (
                <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                  className={`flex flex-none items-center gap-1.5 whitespace-nowrap rounded-t-lg border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
                    activeTab === tab.key
                      ? 'border-[#0E6187] bg-[#0E6187]/5 text-[#0E6187]'
                      : 'border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                  }`}>
                  <tab.icon size={15} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ===== Tab: Informasi Dasar ===== */}
          {activeTab === 'info' && (
            <div className="space-y-5 p-5">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">Nama Produk <span className="text-red-500">*</span></label>
                <input type="text" required placeholder="Contoh: Program Tahfidz 2026" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })}
                  className={inputClass} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-800">Gambar Produk <span className="text-xs font-normal text-gray-400">(opsional)</span></label>
                  <div className="flex items-center gap-3">
                    {(gambarPreview || editing?.gambar) && (
                      <img src={gambarPreview || `${APP_URL}/storage/${editing?.gambar}`} alt="Preview"
                        className="h-16 w-16 rounded-lg border border-gray-200 object-cover" />
                    )}
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 transition hover:bg-gray-100">
                      <input type="file" accept="image/*" className="hidden" onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setGambarFile(file)
                          setGambarPreview(URL.createObjectURL(file))
                          setHapusGambar(false)
                        }
                      }} />
                      <Upload size={15} /> {gambarFile ? gambarFile.name : 'Pilih Gambar'}
                    </label>
                    {(gambarFile || editing?.gambar) && (
                      <button type="button" onClick={() => { setGambarFile(null); setGambarPreview(null); setHapusGambar(true) }}
                        className="text-sm text-red-500 hover:text-red-700">Hapus</button>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">Format JPG/PNG/WebP, maksimal 2MB</p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-800">Batch / Angkatan <span className="text-xs font-normal text-gray-400">(opsional)</span></label>
                  <div className="flex items-center gap-2">
                    <select value={form.batch_id} onChange={e => setForm({ ...form, batch_id: e.target.value })}
                      className={`${inputClass} appearance-none cursor-pointer`}>
                      <option value="">Tanpa Batch</option>
                      {batches.map(b => (
                        <option key={b.id} value={b.id}
                          style={{ backgroundColor: b.warna || undefined }}>
                          {b.nama_batch}
                        </option>
                      ))}
                    </select>
                    {(() => {
                      const selected = batches.find(b => String(b.id) === form.batch_id)
                      if (!selected) return null
                      const warna = selected.warna || '#3b82f6'
                      return (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-white px-2 py-1.5"
                          style={{ borderColor: warna }}>
                          <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: warna }} />
                        </span>
                      )
                    })()}
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">Pilih batch agar pendaftar otomatis masuk batch ini</p>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">Deskripsi <span className="text-xs font-normal text-gray-400">(opsional)</span></label>
                <textarea placeholder="Jelaskan tentang produk ini..." value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} rows={3}
                  className={`${inputClass} resize-none`} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-800">Komisi Global <span className="text-xs font-normal text-gray-400">(Rp)</span></label>
                  <input type="number" min={0} placeholder="0" value={form.komisi} onChange={e => setForm({ ...form, komisi: e.target.value })}
                    className={inputClass} />
                  <p className="mt-1 text-[11px] text-gray-400">Dibayarkan saat kandidat di-approve</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-800">Affiliate</label>
                  <label className="relative inline-flex cursor-pointer items-center py-2">
                    <input type="checkbox" className="peer sr-only" checked={form.is_affiliable} onChange={e => setForm({ ...form, is_affiliable: e.target.checked })} />
                    <div className="h-5 w-9 rounded-full bg-slate-300 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#0E6187]/30" />
                    <span className="ml-3 text-sm text-slate-600">{form.is_affiliable ? 'Dapat di-affiliate-kan' : 'Tidak untuk affiliate'}</span>
                  </label>
                  <p className="mt-1 text-[11px] text-gray-400">Nonaktifkan jika tidak boleh dipromosikan affiliate</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-800">Status Produk</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className={`${inputClass} appearance-none cursor-pointer`}>
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                  <p className="mt-1 text-[11px] text-gray-400">Nonaktif = tidak bisa didaftar</p>
                </div>
              </div>
            </div>
          )}

          {/* ===== Tab: Kategori & Harga ===== */}
          {activeTab === 'kategori' && (
            <div className="space-y-2 p-5">
              <p className="mb-3 text-xs text-slate-500">Definisikan tahapan pembayaran. Kategori utama bisa memiliki sub-kategori.</p>
              {form.kategori_items.map((item, idx) => renderKategoriRow(item, [idx], 0))}
              <button type="button" onClick={() => addItem([])}
                className="w-full rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 py-3 text-sm font-semibold text-slate-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600">
                <Plus size={14} className="mr-1 inline" /> Tambah Kategori Baru
              </button>
              <div className="mt-4 flex items-center justify-between rounded-lg border border-[#0E6187]/10 bg-[#0E6187]/5 px-4 py-3">
                <span className="text-sm font-bold text-slate-700">Total Harga</span>
                <span className="text-base font-bold text-[#0E6187]">Rp {totalHarga.toLocaleString('id-ID')}</span>
              </div>
            </div>
          )}

          {/* ===== Tab: Komisi ===== */}
          {activeTab === 'komisi' && (
            <div className="p-5">
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-3">
                <div className="flex items-start gap-2">
                  <Info size={14} className="mt-0.5 flex-none text-emerald-600" />
                  <div className="text-[11px] leading-relaxed text-emerald-800">
                    <p className="mb-1 font-semibold">Cara kerja:</p>
                    <ul className="list-inside list-disc space-y-0.5">
                      <li>Komisi di-trigger saat <strong>semua sub-kategori lunas</strong></li>
                      <li>Tier dihitung per batch — pilih batch spesifik atau "Semua Batch"</li>
                      <li>Komisi diterima affiliate per kandidat yang mencapai lunas</li>
                    </ul>
                  </div>
                </div>
              </div>

              {form.kategori_items.filter(i => i.children && i.children.length > 0).length === 0 ? (
                <div className="py-10 text-center">
                  <Users size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm text-slate-500">Belum ada kategori dengan sub-kategori</p>
                  <p className="mt-1 text-[11px] text-slate-400">Tambahkan sub-kategori di tab "Kategori &amp; Harga" untuk mengatur komisi tier</p>
                  <button type="button" onClick={() => setActiveTab('kategori')}
                    className="mt-3 rounded-lg bg-[#0E6187] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#0a4f66]">
                    Buka Tab Kategori
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {form.kategori_items.filter(i => i.children && i.children.length > 0).map((parent, _pIdx) => {
                    const parentIdx = form.kategori_items.indexOf(parent)
                    const parentTiers = form.komisi_tiers.filter(t => t.kategori_name?.toLowerCase() === parent.name.toLowerCase())
                    const childNames = parent.children.map(c => c.name).join(', ')

                    function addParentTier() {
                      const matched = editing?.biaya_kategoris?.find(
                        (bk: any) => bk.nama?.toLowerCase() === parent.name.toLowerCase() || bk.kode?.toLowerCase() === parent.name.toLowerCase()
                      )
                      const newTier: KomisiTier = {
                        kategori_id: matched?.id || null,
                        kategori_name: parent.name,
                        batch_id: null,
                        min_orang: parentTiers.length > 0
                          ? Math.max(...parentTiers.map(t => (t.max_orang || t.min_orang) + 1)) : 1,
                        max_orang: null, komisi: 0, urutan: parentTiers.length,
                      }
                      setForm(prev => ({
                        ...prev,
                        komisi_tiers: [...prev.komisi_tiers, newTier],
                      }))
                    }

                    return (
                      <div key={parentIdx} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800">{parent.name}</span>
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">{parentTiers.length} tier</span>
                          </div>
                          <span className="text-[11px] text-slate-400">Sub: {childNames}</span>
                        </div>

                        <div className="p-3">
                          {parentTiers.length > 0 ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-[110px_50px_50px_1fr_32px] gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                <span>Batch</span>
                                <span className="text-center">Min</span>
                                <span className="text-center">Max</span>
                                <span>Komisi/org</span>
                                <span></span>
                              </div>
                              {parentTiers.map((t, _ti) => {
                                const globalIdx = form.komisi_tiers.indexOf(t)
                                return (
                                  <div key={globalIdx} className="grid grid-cols-[110px_50px_50px_1fr_32px] items-center gap-2 rounded-lg bg-slate-50 p-1.5">
                                    <select value={t.batch_id ?? ''}
                                      onChange={e => updateTier(globalIdx, 'batch_id', e.target.value ? parseInt(e.target.value) : null)}
                                      className="truncate rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700 outline-none focus:border-[#0E6187] focus:ring-1 focus:ring-[#0E6187]/20">
                                      <option value="">Semua Batch</option>
                                      {batches.map(b => <option key={b.id} value={b.id}>{b.nama_batch}</option>)}
                                    </select>
                                    <input type="number" min={1} value={t.min_orang}
                                      onChange={e => updateTier(globalIdx, 'min_orang', parseInt(e.target.value) || 1)}
                                      className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-xs font-semibold text-slate-700 outline-none focus:border-[#0E6187] focus:ring-1 focus:ring-[#0E6187]/20" />
                                    <input type="number" min={t.min_orang} placeholder="∞" value={t.max_orang ?? ''}
                                      onChange={e => updateTier(globalIdx, 'max_orang', e.target.value ? parseInt(e.target.value) : null)}
                                      className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-xs text-slate-700 outline-none focus:border-[#0E6187] focus:ring-1 focus:ring-[#0E6187]/20" />
                                    <div className="relative">
                                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">Rp</span>
                                      <input type="number" min={0} value={t.komisi ?? 0}
                                        onChange={e => updateTier(globalIdx, 'komisi', parseFloat(e.target.value) || 0)}
                                        className="w-full rounded-lg border border-emerald-200 bg-emerald-50 pl-9 pr-2 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20" />
                                    </div>
                                    <button type="button" onClick={() => removeTier(globalIdx)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500">
                                      <Trash size={13} />
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <p className="py-3 text-center text-xs text-slate-400">Belum ada tier.</p>
                          )}
                          <button type="button" onClick={addParentTier}
                            className="mt-2 w-full rounded-lg border-2 border-dashed border-slate-200 py-2 text-xs font-semibold text-slate-500 transition-colors hover:border-[#0E6187]/30 hover:bg-[#0E6187]/5 hover:text-[#0E6187]">
                            <Plus size={13} className="mr-1 inline" /> Tambah Tier
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===== Actions ===== */}
        <div className="mt-4 flex flex-col-reverse gap-3 pb-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => navigate('/data-product')}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
            Batal
          </button>
          <button type="submit" disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0E6187] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#1a5e6f] disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? <><Loader2 size={15} className="animate-spin" /> Menyimpan...</> : editing ? 'Simpan Perubahan' : 'Buat Produk'}
          </button>
        </div>
      </form>
    </div>
  )
}
