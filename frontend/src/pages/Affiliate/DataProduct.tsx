import { useState, useEffect } from 'react'
import {
  Package, Plus, Edit3, Trash2, X, Search, RotateCcw, Link as LinkIcon,
  Check, GraduationCap, ExternalLink, Tag, ChevronDown, ChevronRight, Trash,
} from 'lucide-react'
import Swal from 'sweetalert2'
import api, { productApi } from '../../services/api'

interface BiayaKategori {
  id: number
  kode: string
  nama: string
  deskripsi: string | null
  urutan: number
  parent_id: number | null
  children?: BiayaKategori[]
}

interface KategoriPrice {
  kategori_id: number
  harga: number
  komisi: number
}

interface KomisiTier {
  id?: number
  kategori_id: number | null
  min_orang: number
  max_orang: number | null
  komisi: number
  urutan: number
}

interface Product {
  id: number
  nama: string
  deskripsi: string | null
  harga: number
  komisi: number | null
  status: string
  biaya_kategoris: (BiayaKategori & { pivot: { harga: number; komisi: number } })[]
  komisi_tiers: KomisiTier[]
}

function collectAllKategoris(tree: BiayaKategori[]): BiayaKategori[] {
  const result: BiayaKategori[] = []
  function walk(items: BiayaKategori[]) {
    for (const item of items) {
      result.push(item)
      if (item.children && item.children.length > 0) walk(item.children)
    }
  }
  walk(tree)
  return result
}

export default function DataProduct() {
  const [products, setProducts] = useState<Product[]>([])
  const [kategoriTree, setKategoriTree] = useState<BiayaKategori[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState({
    nama: '',
    deskripsi: '',
    komisi: '',
    status: 'aktif',
    kategori_prices: {} as Record<number, string>,
    kategori_komisi: {} as Record<number, string>,
    komisi_tiers: [] as KomisiTier[],
  })
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [expandedParents, setExpandedParents] = useState<Record<number, boolean>>({})

  useEffect(() => {
    fetchProducts()
    api.get('/biaya-kategori').then(res => setKategoriTree(res.data))
  }, [])

  function fetchProducts() {
    productApi.list().then(res => setProducts(res.data))
  }

  const allKategoris = collectAllKategoris(kategoriTree)
  const sortedTree = [...kategoriTree].sort((a, b) => a.urutan - b.urutan)

  function getParentTotal(parent: BiayaKategori): number {
    const own = parseFloat(form.kategori_prices[parent.id]) || 0
    if (!parent.children || parent.children.length === 0) return own
    return own + parent.children.reduce((sum, child) => sum + getParentTotal(child), 0)
  }

  function getParentKomisi(parent: BiayaKategori): number {
    const own = parseFloat(form.kategori_komisi[parent.id]) || 0
    if (!parent.children || parent.children.length === 0) return own
    return own + parent.children.reduce((sum, child) => sum + getParentKomisi(child), 0)
  }

  const totalHarga = sortedTree.reduce((sum, parent) => sum + getParentTotal(parent), 0)

  function openCreate() {
    setEditing(null)
    const prices: Record<number, string> = {}
    const komisis: Record<number, string> = {}
    allKategoris.forEach(k => { prices[k.id] = ''; komisis[k.id] = '' })
    setForm({ nama: '', deskripsi: '', komisi: '', status: 'aktif', kategori_prices: prices, kategori_komisi: komisis, komisi_tiers: [] })
    const expanded: Record<number, boolean> = {}
    kategoriTree.forEach(p => { if (p.children && p.children.length > 0) expanded[p.id] = true })
    setExpandedParents(expanded)
    setShowModal(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    const prices: Record<number, string> = {}
    const komisis: Record<number, string> = {}
    allKategoris.forEach(k => {
      const found = p.biaya_kategoris?.find(bk => bk.id === k.id)
      prices[k.id] = found ? String(found.pivot.harga) : ''
      komisis[k.id] = found?.pivot?.komisi ? String(found.pivot.komisi) : ''
    })
    setForm({
      nama: p.nama,
      deskripsi: p.deskripsi || '',
      komisi: p.komisi ? String(p.komisi) : '',
      status: p.status,
      kategori_prices: prices,
      kategori_komisi: komisis,
      komisi_tiers: p.komisi_tiers || [],
    })
    const expanded: Record<number, boolean> = {}
    kategoriTree.forEach(pg => { if (pg.children && pg.children.length > 0) expanded[pg.id] = true })
    setExpandedParents(expanded)
    setShowModal(true)
  }

  function setKatPrice(katId: number, val: string) {
    setForm(prev => ({
      ...prev,
      kategori_prices: { ...prev.kategori_prices, [katId]: val },
    }))
  }

  function setKatKomisi(katId: number, val: string) {
    setForm(prev => ({
      ...prev,
      kategori_komisi: { ...prev.kategori_komisi, [katId]: val },
    }))
  }

  function toggleParent(id: number) {
    setExpandedParents(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function addTier(kategoriId: number | null = null) {
    setForm(prev => ({
      ...prev,
      komisi_tiers: [...prev.komisi_tiers, {
        kategori_id: kategoriId,
        min_orang: prev.komisi_tiers.filter(t => t.kategori_id === kategoriId).length > 0
          ? Math.max(...prev.komisi_tiers.filter(t => t.kategori_id === kategoriId).map(t => (t.max_orang || t.min_orang) + 1))
          : 1,
        max_orang: null,
        komisi: 0,
        urutan: prev.komisi_tiers.filter(t => t.kategori_id === kategoriId).length,
      }],
    }))
  }

  function updateTier(index: number, field: string, value: any) {
    setForm(prev => {
      const tiers = [...prev.komisi_tiers]
      tiers[index] = { ...tiers[index], [field]: value }
      return { ...prev, komisi_tiers: tiers }
    })
  }

  function removeTier(index: number) {
    setForm(prev => ({
      ...prev,
      komisi_tiers: prev.komisi_tiers.filter((_, i) => i !== index),
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const kategoriPrices: KategoriPrice[] = allKategoris
      .filter(k => form.kategori_prices[k.id] !== '' && parseFloat(form.kategori_prices[k.id]) > 0)
      .map(k => ({
        kategori_id: k.id,
        harga: parseFloat(form.kategori_prices[k.id]),
        komisi: parseFloat(form.kategori_komisi[k.id]) || 0,
      }))

    const payload: any = {
      nama: form.nama,
      deskripsi: form.deskripsi,
      harga: totalHarga,
      komisi: form.komisi ? parseFloat(form.komisi) : null,
      status: form.status,
      kategori_prices: kategoriPrices,
      komisi_tiers: form.komisi_tiers.map(t => ({
        kategori_id: t.kategori_id,
        min_orang: t.min_orang,
        max_orang: t.max_orang || null,
        komisi: t.komisi,
        urutan: t.urutan,
      })),
    }

    const req = editing ? productApi.update(editing.id, payload) : productApi.store(payload)
    req.then(() => {
      setShowModal(false)
      fetchProducts()
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: editing ? 'Produk berhasil diperbarui.' : 'Produk berhasil ditambahkan.',
        confirmButtonColor: '#0D1F3C',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      })
    })
  }

  function handleDelete(id: number) {
    if (confirm('Yakin ingin menghapus produk ini?')) productApi.destroy(id).then(fetchProducts)
  }

  function copyLink(p: Product) {
    const url = `${window.location.origin}/daftar-program/${p.id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(p.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  function resetFilter() {
    setSearch('')
  }

  const filtered = products.filter(p =>
    !search || p.nama.toLowerCase().includes(search.toLowerCase())
  )

  function renderKategoriTree(bkList: (BiayaKategori & { pivot: { harga: number; komisi: number } })[]) {
    if (!bkList || bkList.length === 0) return <span className="text-xs text-slate-400">-</span>

    const priceMap = new Map<number, number>()
    const komisiMap = new Map<number, number>()
    for (const bk of bkList) {
      if (Number(bk.pivot.harga) > 0) priceMap.set(bk.id, Number(bk.pivot.harga))
      if (Number(bk.pivot.komisi) > 0) komisiMap.set(bk.id, Number(bk.pivot.komisi))
    }
    if (priceMap.size === 0) return <span className="text-xs text-slate-400">-</span>

    function sumDescendantPrices(node: BiayaKategori): number {
      let sum = 0
      for (const child of node.children || []) {
        sum += priceMap.get(child.id) || 0
        sum += sumDescendantPrices(child)
      }
      return sum
    }

    function sumDescendantKomisi(node: BiayaKategori): number {
      let sum = 0
      for (const child of node.children || []) {
        sum += komisiMap.get(child.id) || 0
        sum += sumDescendantKomisi(child)
      }
      return sum
    }

    function walk(nodes: BiayaKategori[], depth: number): any[] {
      const result: any[] = []
      for (const node of nodes) {
        const ownPrice = priceMap.get(node.id) || 0
        const ownKomisi = komisiMap.get(node.id) || 0
        const children = node.children || []
        const childResults = walk(children, depth + 1)
        const hasVisible = ownPrice > 0 || childResults.length > 0
        if (!hasVisible) continue
        const displayPrice = ownPrice > 0 ? ownPrice : sumDescendantPrices(node)
        const displayKomisi = ownKomisi > 0 ? ownKomisi : sumDescendantKomisi(node)
        result.push(
          <div key={node.id}>
            <div className={`flex items-center gap-1.5 text-[11px] ${depth > 0 ? 'ml-4 border-l-2 border-blue-100 pl-2' : ''}`}>
              <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold ${
                depth === 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {node.kode}
              </span>
              {displayPrice > 0 && (
                <span className="text-slate-500">Rp {displayPrice.toLocaleString('id-ID')}</span>
              )}
              {displayKomisi > 0 && (
                <span className="text-emerald-500 text-[10px]">(Komisi: Rp {displayKomisi.toLocaleString('id-ID')})</span>
              )}
            </div>
            {childResults}
          </div>
        )
      }
      return result
    }

    const nodes = walk(sortedTree, 0)
    return nodes.length > 0 ? <div className="space-y-0.5">{nodes}</div> : <span className="text-xs text-slate-400">-</span>
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

  function renderKategoriInputs(cat: BiayaKategori, depth: number = 0) {
    const hasChildren = cat.children && cat.children.length > 0
    const isExpanded = expandedParents[cat.id]

    return (
      <div key={cat.id} className={`${depth > 0 ? 'ml-4 border-l border-slate-200 pl-3' : ''}`}>
        <div className="rounded-lg border border-slate-200 bg-white">
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2">
            {hasChildren ? (
              <button type="button" onClick={() => toggleParent(cat.id)} className="flex-none p-0.5 rounded hover:bg-slate-100 transition">
                {isExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
              </button>
            ) : (
              <span className="w-5 flex-none" />
            )}
            <span className="text-xs font-mono font-bold text-slate-700 flex-none">{cat.kode}</span>
            <span className="text-xs text-slate-500 flex-none">{cat.nama}</span>
            {hasChildren && (
              <span className="ml-auto text-xs font-semibold text-slate-600">
                Rp {getParentTotal(cat).toLocaleString('id-ID')}
              </span>
            )}
          </div>

          {/* Inputs */}
          <div className="px-3 pb-2.5 pt-0">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-[10px] text-slate-400 mb-1">Harga</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">Rp</span>
                  <input
                    type="number" min={0} placeholder="0"
                    value={form.kategori_prices[cat.id] ?? ''}
                    onChange={e => setKatPrice(cat.id, e.target.value)}
                    className="w-full rounded-md bg-slate-50 border border-slate-200 pl-8 pr-3 py-2 text-sm text-slate-700 placeholder-slate-300 outline-none transition focus:bg-white focus:border-slate-300"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-[10px] text-emerald-500 mb-1">Komisi</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">Rp</span>
                  <input
                    type="number" min={0} placeholder="0"
                    value={form.kategori_komisi[cat.id] ?? ''}
                    onChange={e => setKatKomisi(cat.id, e.target.value)}
                    className="w-full rounded-md bg-emerald-50 border border-emerald-200 pl-8 pr-3 py-2 text-sm text-slate-700 placeholder-slate-300 outline-none transition focus:bg-white focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1.5 space-y-1.5">
            {cat.children!.map(child => renderKategoriInputs(child, depth + 1))}
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] text-white border border-blue-100">
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

      {/* Link Pendaftaran Card */}
      {activeProducts.length > 0 && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0D1F3C]">
              <LinkIcon size={14} className="text-white" />
            </div>
            <h2 className="text-sm font-bold text-slate-700">Link Pendaftaran (Non-Affiliate)</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {activeProducts.map(p => (
              <div key={p.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 hover:border-[#0D1F3C]/20 hover:bg-[#f5f6fa] transition-all group">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white shadow-sm flex-none">
                    <GraduationCap size={14} className="text-[#0D1F3C]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{p.nama}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Rp {Number(p.harga).toLocaleString('id-ID')}</p>
                  </div>
                </div>
                <button onClick={() => copyLink(p)}
                  className="flex-none rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-500 transition hover:border-[#0D1F3C]/30 hover:bg-[#0D1F3C] hover:text-white group/btn">
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
            <input
              type="text"
              placeholder="Cari produk..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={resetFilter}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full border-collapse text-left text-sm text-slate-700">
            <thead className="text-sm text-slate-600">
              <tr>
                <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Nama Produk</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Kategori / Harga</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Deskripsi</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-right font-medium">Total</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Status</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border border-slate-200 px-6 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Package size={24} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-600">Belum ada produk</p>
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="bg-white transition hover:bg-slate-50">
                    <td className="border border-slate-200 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                          <Package size={16} className="text-blue-600" />
                        </div>
                        <span className="text-sm font-semibold text-slate-800">{p.nama}</span>
                      </div>
                    </td>
                    <td className="border border-slate-200 px-4 py-3">
                      {p.biaya_kategoris && p.biaya_kategoris.length > 0 ? (
                        renderKategoriTree(p.biaya_kategoris)
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-sm text-slate-500 max-w-xs truncate">{p.deskripsi || '-'}</td>
                    <td className="border border-slate-200 px-4 py-3 text-right text-sm font-semibold text-slate-800">
                      Rp {Number(p.harga).toLocaleString('id-ID')}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center">{statusBadge(p.status)}</td>
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      <div className="flex justify-center gap-1.5">
                        <button onClick={() => openEdit(p)}
                          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600" title="Edit">
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => handleDelete(p.id)}
                          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600" title="Hapus">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[5vh] overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-2xl mb-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-lg">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{editing ? 'Edit Produk' : 'Tambah Produk'}</h2>
                <span className="text-[11px] text-slate-400 font-medium">{editing ? 'Perbarui data produk' : 'Buat produk baru'}</span>
              </div>
              <button onClick={() => setShowModal(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-500 transition hover:bg-slate-300"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 pb-5 pt-4">
              <div className="space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Nama Produk */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Produk <span className="text-red-500">*</span></label>
                  <input type="text" required placeholder="Masukkan nama produk" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })}
                    className="w-full rounded-md bg-[#f0f2f5] px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:bg-white focus:ring-1 focus:ring-blue-500" />
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Deskripsi</label>
                  <textarea placeholder="Deskripsi produk (opsional)" value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} rows={2}
                    className="w-full rounded-md bg-[#f0f2f5] px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:bg-white focus:ring-1 focus:ring-blue-500" />
                </div>

                {/* Kategori Prices */}
                <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-slate-200">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Rincian Harga per Kategori</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Isi harga dan komisi untuk setiap kategori.</p>
                  </div>
                  <div className="p-3 space-y-2">
                    {sortedTree.map(parent => (
                      <div key={parent.id}>
                        {renderKategoriInputs(parent, 0)}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200">
                    <span className="text-xs font-bold text-slate-600">Total Harga</span>
                    <span className="text-xs font-bold text-slate-800">Rp {totalHarga.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Komisi Tier per Kategori */}
                <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-slate-200">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Komisi Tier per Jumlah Orang</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Atur komisi berdasarkan jumlah pendaftar per batch.</p>
                  </div>
                  <div className="p-3 space-y-4">
                    {allKategoris.filter(k => {
                      const harga = parseFloat(form.kategori_prices[k.id]) || 0
                      return harga > 0
                    }).map(kat => {
                      const katTiers = form.komisi_tiers
                        .map((t, i) => ({ ...t, _idx: i }))
                        .filter(t => t.kategori_id === kat.id)
                        .sort((a, b) => a.min_orang - b.min_orang)
                      return (
                        <div key={kat.id} className="rounded-lg border border-slate-100 p-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-xs font-mono font-bold text-slate-700">{kat.kode}</span>
                            <span className="text-xs text-slate-500">{kat.nama}</span>
                          </div>

                          {katTiers.length > 0 && (
                            <div className="space-y-1.5 mb-2">
                              <div className="grid grid-cols-[50px_50px_1fr_28px] gap-1.5 text-[9px] font-semibold text-slate-400 px-1">
                                <span>Min</span>
                                <span>Max</span>
                                <span>Komisi (Rp)</span>
                                <span></span>
                              </div>
                              {katTiers.map(t => (
                                <div key={t._idx} className="grid grid-cols-[50px_50px_1fr_28px] gap-1.5 items-center">
                                  <input type="number" min={1} value={t.min_orang}
                                    onChange={e => updateTier(t._idx, 'min_orang', parseInt(e.target.value) || 1)}
                                    className="rounded border border-slate-200 bg-slate-50 px-1.5 py-1.5 text-xs text-slate-700 outline-none focus:border-slate-300 text-center" />
                                  <input type="number" min={t.min_orang} placeholder="∞" value={t.max_orang ?? ''}
                                    onChange={e => updateTier(t._idx, 'max_orang', e.target.value ? parseInt(e.target.value) : null)}
                                    className="rounded border border-slate-200 bg-slate-50 px-1.5 py-1.5 text-xs text-slate-700 outline-none focus:border-slate-300 text-center" />
                                  <div className="relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">Rp</span>
                                    <input type="number" min={0} value={t.komisi || ''}
                                      onChange={e => updateTier(t._idx, 'komisi', parseFloat(e.target.value) || 0)}
                                      className="w-full rounded border border-emerald-200 bg-emerald-50 pl-6 pr-1.5 py-1.5 text-xs text-slate-700 outline-none focus:border-emerald-400" />
                                  </div>
                                  <button type="button" onClick={() => removeTier(t._idx)}
                                    className="rounded p-1 text-slate-300 hover:text-red-500 transition-colors">
                                    <Trash size={13} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <button type="button" onClick={() => addTier(kat.id)}
                            className="w-full rounded border border-dashed border-emerald-200 py-1.5 text-[10px] font-semibold text-emerald-500 hover:text-emerald-700 hover:border-emerald-300 transition-colors">
                            + Tambah Tier
                          </button>
                        </div>
                      )
                    })}
                    {allKategoris.filter(k => parseFloat(form.kategori_prices[k.id]) || 0).length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4">Isi harga kategori terlebih dahulu.</p>
                    )}
                  </div>
                </div>

                {/* Global Komisi & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-emerald-600 mb-1">Komisi Global (Rp)</label>
                    <input type="number" min={0} placeholder="0" value={form.komisi} onChange={e => setForm({ ...form, komisi: e.target.value })}
                      className="w-full rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:bg-white focus:border-emerald-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                      className="w-full rounded-md bg-[#f0f2f5] px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-1 focus:ring-blue-500">
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                    </select>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">Komisi: diterima affiliate saat kategori lunas. Komisi global: diterima saat pendaftar di-approve.</p>
              </div>
              <div className="mt-5 flex gap-2">
                <button type="submit" className="flex-1 rounded-md bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">{editing ? 'Simpan' : 'Tambah'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-md bg-[#e4e6eb] py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-[#d8dadf]">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
