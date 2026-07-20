import { useState, useEffect, useMemo } from 'react'
import {
  Package, Plus, Edit3, Trash2, X, Search, RotateCcw, Link as LinkIcon,
  Check, GraduationCap, ExternalLink, Trash, ChevronDown, ChevronRight,
  Info, Tag, DollarSign, Award, Users, Layers,
} from 'lucide-react'
import Swal from 'sweetalert2'
import api, { productApi } from '../../services/api'

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
}

interface BiayaKategori {
  id: number
  kode: string
  nama: string
  deskripsi: string | null
  urutan: number
  parent_id: number | null
  children?: BiayaKategori[]
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
  batch_id: number | null
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
  return { name: '', harga: 0, komisi: 0, children: [], trigger_type: 'registration', trigger_value: null, due_type: 'days_after_invoice', due_value: null, reminder_setting: null, channel: 'wa', template_pesan: null, template_email: null, subject_email: null }
}

function sumHargaDeep(item: KategoriItem): number {
  const own = item.harga || 0
  const kids = (item.children || []).reduce((s, c) => s + sumHargaDeep(c), 0)
  return own + kids
}

export default function DataProduct() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'kategori' | 'komisi'>('info')
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState({
    nama: '',
    deskripsi: '',
    komisi: '',
    status: 'aktif',
    batch_id: '' as string,
    kategori_items: [emptyKategoriItem()] as KategoriItem[],
    komisi_tiers: [] as KomisiTier[],
  })
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [batches, setBatches] = useState<Batch[]>([])

  useEffect(() => { fetchProducts(); fetchBatches() }, [])
  function fetchProducts() { productApi.list().then(res => setProducts(res.data)) }
  function fetchBatches() { api.get('/batches').then(res => setBatches(res.data.data || res.data)).catch(() => {}) }

  const totalHarga = useMemo(
    () => form.kategori_items.reduce((sum, item) => sum + sumHargaDeep(item), 0),
    [form.kategori_items]
  )

  function openCreate() {
    setEditing(null)
    setForm({
      nama: '', deskripsi: '', komisi: '', status: 'aktif', batch_id: '',
      kategori_items: [emptyKategoriItem()], komisi_tiers: [],
    })
    setExpanded({})
    setActiveTab('info')
    setShowModal(true)
  }

  function openEdit(p: Product) {
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
    setExpanded({})
    setActiveTab('info')
    setShowModal(true)
  }

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
          channel: i.channel || 'wa',
          template_pesan: i.template_pesan || null,
          template_email: i.template_email || null,
          subject_email: i.subject_email || null,
          children: cleanItems(i.children || []),
        }))
    }

    const payload = {
      nama: form.nama, deskripsi: form.deskripsi,
      kategori_items: cleanItems(form.kategori_items),
      komisi: form.komisi ? parseFloat(form.komisi) : null,
      status: form.status,
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

    const req = editing ? productApi.update(editing.id, payload) : productApi.store(payload)
    req.then(() => {
      setShowModal(false); fetchProducts()
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: editing ? 'Produk berhasil diperbarui.' : 'Produk berhasil ditambahkan.', confirmButtonColor: '#0E6187', timer: 2000, timerProgressBar: true, showConfirmButton: false })
    }).catch(() => {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan saat menyimpan data.', confirmButtonColor: '#0E6187' })
    })
  }

  function handleDelete(id: number) {
    if (confirm('Yakin ingin menghapus produk ini?')) productApi.destroy(id).then(fetchProducts)
  }

  function copyLink(p: Product) {
    navigator.clipboard.writeText(`${window.location.origin}/daftar-program/${p.slug}`).then(() => {
      setCopiedId(p.id); setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const filtered = products.filter(p => !search || p.nama.toLowerCase().includes(search.toLowerCase()))

  function renderKategoriDisplay(p: Product) {
    const items = p.kategori_items && p.kategori_items.length > 0 ? p.kategori_items : []
    if (items.length === 0) return <span className="text-xs text-slate-400">-</span>
    return (
      <div className="space-y-0.5">
        {items.slice(0, 4).map((item, idx) => {
          const total = sumHargaDeep(item)
          return (
            <div key={idx} className="text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 font-semibold text-blue-700">{item.name}</span>
                {total > 0 && <span className="text-slate-500">Rp {total.toLocaleString('id-ID')}</span>}
              </div>
              {item.children && item.children.length > 0 && (
                <div className="ml-3 border-l border-slate-200 pl-1.5 space-y-0.5">
                  {item.children.filter(c => c.harga > 0).slice(0, 3).map((c, ci) => (
                    <div key={ci} className="flex items-center gap-1 text-[10px] text-slate-400">
                      <span>{c.name}</span>
                      <span>Rp {c.harga.toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {items.length > 4 && <span className="text-[10px] text-slate-400">+{items.length - 4} lainnya</span>}
      </div>
    )
  }

  const statusBadge = (status: string) => {
    const dot = status === 'aktif' ? 'bg-emerald-500' : 'bg-slate-300'
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {status === 'aktif' ? 'Aktif' : 'Nonaktif'}
      </span>
    )
  }

  const activeProducts = products.filter(p => p.status === 'aktif')

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
    ]
    const DUE_OPTIONS = [
      { value: 'days_after_invoice', label: 'X Hari Setelah Invoice Dibuat' },
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
                {(item.trigger_type !== 'registration' || item.due_type !== 'days_after_invoice' || item.reminder_setting) && (
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
                          onChange={() => updateBilling('trigger_type', opt.value)}
                          className="w-3.5 h-3.5 text-amber-600 border-slate-300 focus:ring-amber-500" />
                        <span className="text-[11px] text-slate-600 group-hover:text-slate-800">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

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
                  {item.due_type === 'days_after_invoice' && (
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

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] text-white border border-blue-100">
            <Package size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Data Product / Program</h1>
            <p className="text-sm text-slate-500">Kelola program dan produk affiliate</p>
          </div>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1">
          <Plus size={16} /> Tambah Produk
        </button>
      </div>

      {/* Link Pendaftaran */}
      {activeProducts.length > 0 && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0E6187]">
              <LinkIcon size={14} className="text-white" />
            </div>
            <h2 className="text-sm font-bold text-slate-700">Link Pendaftaran (Non-Affiliate)</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {activeProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 hover:border-[#0E6187]/20 hover:bg-[#f5f6fa] transition-all group">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white shadow-sm flex-none">
                    <GraduationCap size={14} className="text-[#0E6187]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{p.nama}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {p.batch && <span className="text-[9px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-full">{p.batch.nama_batch}</span>}
                      <p className="text-[10px] text-slate-400 font-medium">Rp {Number(p.harga).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </div>
                <button onClick={() => copyLink(p)}
                  className="flex-none rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-500 transition hover:border-[#0E6187]/30 hover:bg-[#0E6187] hover:text-white group/btn">
                  {copiedId === p.id ? (
                    <span className="text-emerald-600 group-hover/btn:text-white flex items-center gap-1"><Check size={11} /> Tersalin</span>
                  ) : (
                    <span className="flex items-center gap-1"><ExternalLink size={11} /> Salin Link</span>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="mb-4 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
          <button onClick={() => setSearch('')}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full border-collapse text-left text-sm text-slate-700">
            <thead className="text-sm text-slate-600">
              <tr>
                <th className="border border-slate-200 px-4 py-3 font-medium">Nama Produk</th>
                <th className="border border-slate-200 px-4 py-3 font-medium">Batch</th>
                <th className="border border-slate-200 px-4 py-3 font-medium">Kategori / Harga</th>
                <th className="border border-slate-200 px-4 py-3 font-medium">Deskripsi</th>
                <th className="border border-slate-200 px-4 py-3 font-medium">Komisi Tier</th>
                <th className="border border-slate-200 px-4 py-3 text-right font-medium">Total</th>
                <th className="border border-slate-200 px-4 py-3 text-center font-medium">Status</th>
                <th className="border border-slate-200 px-4 py-3 text-center font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="border border-slate-200 px-6 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Package size={24} /></div>
                    <p className="mt-3 text-sm font-medium text-slate-600">Belum ada produk</p>
                  </td>
                </tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="bg-white transition hover:bg-slate-50">
                  <td className="border border-slate-200 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50"><Package size={16} className="text-blue-600" /></div>
                      <span className="text-sm font-semibold text-slate-800">{p.nama}</span>
                    </div>
                  </td>
                  <td className="border border-slate-200 px-4 py-3">
                    {p.batch ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700">
                        <Layers size={11} /> {p.batch.nama_batch}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                  <td className="border border-slate-200 px-4 py-3">{renderKategoriDisplay(p)}</td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-slate-500 max-w-xs truncate">{p.deskripsi || '-'}</td>
                  <td className="border border-slate-200 px-4 py-3">
                    {p.komisi_tiers && p.komisi_tiers.length > 0 ? (
                      <div className="space-y-1">
                        {(() => {
                          const grouped: Record<string, typeof p.komisi_tiers> = {}
                          p.komisi_tiers.forEach(t => {
                            let key = 'Global'
                            if (t.kategori_id && p.biaya_kategoris) {
                              const bk = p.biaya_kategoris.find((bk: any) => bk.id === t.kategori_id)
                              if (bk) {
                                const parentMatch = p.kategori_items?.find((item: any) => item.name.toLowerCase() === bk.nama?.toLowerCase())
                                key = parentMatch?.name || bk.nama || 'Global'
                              }
                            } else if (t.kategori_name) {
                              key = t.kategori_name
                            }
                            if (!grouped[key]) grouped[key] = []
                            const isDuplicate = grouped[key].some(
                              g => g.min_orang === t.min_orang && g.max_orang === t.max_orang && g.komisi === t.komisi
                            )
                            if (!isDuplicate) grouped[key].push(t)
                          })
                          return Object.entries(grouped).map(([name, tiers]) => (
                            <div key={name} className="text-[11px]">
                              <span className="font-semibold text-emerald-700">{name}</span>
                              <div className="ml-1 space-y-0.5">
                                {tiers.map((t, i) => (
                                  <div key={i} className="flex items-center gap-1 text-slate-500">
                                    <span className="text-[10px]">{t.min_orang}-{t.max_orang || '∞'} org:</span>
                                    <span className="font-medium text-amber-600">Rp {Number(t.komisi).toLocaleString('id-ID')}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        })()}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-right text-sm font-semibold text-slate-800">Rp {Number(p.harga).toLocaleString('id-ID')}</td>
                  <td className="border border-slate-200 px-4 py-3 text-center">{statusBadge(p.status)}</td>
                  <td className="border border-slate-200 px-4 py-3 text-center">
                    <div className="flex justify-center gap-1.5">
                      <button onClick={() => openEdit(p)} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600" title="Edit"><Edit3 size={15} /></button>
                      <button onClick={() => handleDelete(p.id)} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600" title="Hapus"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[4vh] overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-5xl rounded-lg bg-white shadow-2xl mb-4" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] text-white">
                  <Package size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{editing ? 'Perbarui data produk dan pengaturan komisi' : 'Lengkapi data produk untuk memulai'}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"><X size={18} /></button>
            </div>

            {/* Tabs */}
            <div className="px-6 pt-3 border-b border-slate-100">
              <div className="flex gap-1">
                {[
                  { key: 'info' as const, label: 'Informasi Dasar', icon: Tag },
                  { key: 'kategori' as const, label: 'Kategori & Harga', icon: Layers },
                  { key: 'komisi' as const, label: 'Komisi', icon: Award },
                ].map(tab => (
                  <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all border-b-2 -mb-px ${
                      activeTab === tab.key
                        ? 'text-[#0E6187] border-[#0E6187] bg-[#0E6187]/5'
                        : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'
                    }`}>
                    <tab.icon size={15} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col max-h-[78vh]">

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">

                {/* ===== Tab 1: Informasi Dasar ===== */}
                {activeTab === 'info' && (
                  <div className="max-w-2xl mx-auto space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Produk <span className="text-red-500">*</span></label>
                      <input type="text" required placeholder="Contoh: Program Tahfidz 2026" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:bg-white focus:ring-2 focus:ring-[#0E6187]/20 focus:border-[#0E6187]" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Deskripsi <span className="text-slate-400 font-normal">(opsional)</span></label>
                      <textarea placeholder="Jelaskan tentang produk ini..." value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} rows={3}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:bg-white focus:ring-2 focus:ring-[#0E6187]/20 focus:border-[#0E6187] resize-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Batch / Angkatan <span className="text-slate-400 font-normal">(opsional)</span></label>
                      <select value={form.batch_id} onChange={e => setForm({ ...form, batch_id: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-2 focus:ring-[#0E6187]/20 focus:border-[#0E6187] appearance-none cursor-pointer">
                        <option value="">Tanpa Batch</option>
                        {batches.map(b => <option key={b.id} value={b.id}>{b.nama_batch}</option>)}
                      </select>
                      <p className="text-[11px] text-slate-400 mt-1.5">Pilih batch agar pendaftar otomatis masuk batch ini</p>
                    </div>

                    {/* Status */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Komisi Global <span className="text-slate-400 font-normal">(Rp)</span></label>
                        <input type="number" min={0} placeholder="0" value={form.komisi} onChange={e => setForm({ ...form, komisi: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:bg-white focus:ring-2 focus:ring-[#0E6187]/20 focus:border-[#0E6187]" />
                        <p className="text-[11px] text-slate-400 mt-1">Dibayarkan saat kandidat di-approve</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status Produk</label>
                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-2 focus:ring-[#0E6187]/20 focus:border-[#0E6187] appearance-none cursor-pointer">
                          <option value="aktif">Aktif</option>
                          <option value="nonaktif">Nonaktif</option>
                        </select>
                        <p className="text-[11px] text-slate-400 mt-1">Nonaktif = tidak bisa didaftar</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ===== Tab 2: Kategori & Harga ===== */}
                {activeTab === 'kategori' && (
                  <div>
                    <p className="text-xs text-slate-500 mb-4">Definisikan tahapan pembayaran. Kategori utama bisa memiliki sub-kategori.</p>
                    <div className="space-y-2">
                      {form.kategori_items.map((item, idx) => renderKategoriRow(item, [idx], 0))}
                      <button type="button" onClick={() => addItem([])}
                        className="w-full rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 py-3 text-sm font-semibold text-slate-500 transition hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600">
                        <Plus size={14} className="inline mr-1" /> Tambah Kategori Baru
                      </button>
                    </div>
                    <div className="mt-4 flex items-center justify-between px-4 py-3 rounded-lg bg-[#0E6187]/5 border border-[#0E6187]/10">
                      <span className="text-sm font-bold text-slate-700">Total Harga</span>
                      <span className="text-base font-bold text-[#0E6187]">Rp {totalHarga.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                )}

                {/* ===== Tab 3: Komisi ===== */}
                {activeTab === 'komisi' && (
                  <div>
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-3 mb-4">
                      <div className="flex items-start gap-2">
                        <Info size={14} className="text-emerald-600 mt-0.5 flex-none" />
                        <div className="text-[11px] text-emerald-800 leading-relaxed">
                          <p className="font-semibold mb-1">Cara kerja:</p>
                          <ul className="space-y-0.5 list-disc list-inside">
                            <li>Komisi di-trigger saat <strong>semua sub-kategori lunas</strong></li>
                            <li>Tier dihitung per batch — pilih batch spesifik atau "Semua Batch"</li>
                            <li>Komisi diterima affiliate per kandidat yang mencapai lunas</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {form.kategori_items.filter(i => i.children && i.children.length > 0).length === 0 ? (
                      <div className="text-center py-12">
                        <Users size={32} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-sm text-slate-500">Belum ada kategori dengan sub-kategori</p>
                        <p className="text-[11px] text-slate-400 mt-1">Tambahkan sub-kategori di tab "Kategori & Harga" untuk mengatur komisi tier</p>
                        <button type="button" onClick={() => setActiveTab('kategori')}
                          className="mt-3 px-4 py-2 rounded-lg bg-[#0E6187] text-white text-xs font-semibold hover:bg-[#0a4f66] transition">
                          Buka Tab Kategori
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {form.kategori_items.filter(i => i.children && i.children.length > 0).map((parent, pIdx) => {
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
                            <div key={parentIdx} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-slate-800">{parent.name}</span>
                                  <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">{parentTiers.length} tier</span>
                                </div>
                                <span className="text-[11px] text-slate-400">Sub: {childNames}</span>
                              </div>

                              <div className="p-3">
                                {parentTiers.length > 0 ? (
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-[110px_50px_50px_1fr_32px] gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                                      <span>Batch</span>
                                      <span className="text-center">Min</span>
                                      <span className="text-center">Max</span>
                                      <span>Komisi/org</span>
                                      <span></span>
                                    </div>
                                    {parentTiers.map((t, ti) => {
                                      const globalIdx = form.komisi_tiers.indexOf(t)
                                      return (
                                        <div key={globalIdx} className="grid grid-cols-[110px_50px_50px_1fr_32px] gap-2 items-center bg-slate-50 rounded-lg p-1.5">
                                          <select value={t.batch_id ?? ''}
                                            onChange={e => updateTier(globalIdx, 'batch_id', e.target.value ? parseInt(e.target.value) : null)}
                                            className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700 outline-none focus:border-[#0E6187] focus:ring-1 focus:ring-[#0E6187]/20 truncate">
                                            <option value="">Semua Batch</option>
                                            {batches.map(b => <option key={b.id} value={b.id}>{b.nama_batch}</option>)}
                                          </select>
                                          <input type="number" min={1} value={t.min_orang}
                                            onChange={e => updateTier(globalIdx, 'min_orang', parseInt(e.target.value) || 1)}
                                            className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700 outline-none focus:border-[#0E6187] focus:ring-1 focus:ring-[#0E6187]/20 text-center font-semibold" />
                                          <input type="number" min={t.min_orang} placeholder="∞" value={t.max_orang ?? ''}
                                            onChange={e => updateTier(globalIdx, 'max_orang', e.target.value ? parseInt(e.target.value) : null)}
                                            className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700 outline-none focus:border-[#0E6187] focus:ring-1 focus:ring-[#0E6187]/20 text-center" />
                                          <div className="relative">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">Rp</span>
                                            <input type="number" min={0} value={t.komisi ?? 0}
                                              onChange={e => updateTier(globalIdx, 'komisi', parseFloat(e.target.value) || 0)}
                                              className="w-full rounded-lg border border-emerald-200 bg-emerald-50 pl-9 pr-2 py-2 text-xs text-slate-800 font-semibold outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20" />
                                          </div>
                                          <button type="button" onClick={() => removeTier(globalIdx)} className="rounded-lg p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                            <Trash size={13} />
                                          </button>
                                        </div>
                                      )
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-400 text-center py-3">Belum ada tier.</p>
                                )}
                                <button type="button" onClick={addParentTier}
                                  className="mt-2 w-full rounded-lg border-2 border-dashed border-slate-200 py-2 text-xs font-semibold text-slate-500 hover:text-[#0E6187] hover:border-[#0E6187]/30 hover:bg-[#0E6187]/5 transition-colors">
                                  <Plus size={13} className="inline mr-1" /> Tambah Tier
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

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
                <button type="submit" className="flex-1 rounded-lg bg-[#0E6187] py-3 text-sm font-bold text-white transition hover:bg-[#0a4f66] shadow-sm">
                  {editing ? 'Simpan Perubahan' : 'Buat Produk'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-lg bg-slate-100 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-200 hover:text-slate-800">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
