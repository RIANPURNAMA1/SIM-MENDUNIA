import { useState, useEffect } from 'react'
import {
  Package, Plus, Edit3, Trash2, X, Search, RotateCcw, Link as LinkIcon,
  Check, GraduationCap, ExternalLink, Tag,
} from 'lucide-react'
import api, { productApi } from '../../services/api'

interface BiayaKategori {
  id: number
  kode: string
  nama: string
  urutan: number
}

interface KategoriPrice {
  kategori_id: number
  harga: number
  komisi: number
}

interface Product {
  id: number
  nama: string
  deskripsi: string | null
  harga: number
  komisi: number | null
  status: string
  biaya_kategoris: (BiayaKategori & { pivot: { harga: number; komisi: number } })[]
}

export default function DataProduct() {
  const [products, setProducts] = useState<Product[]>([])
  const [biayaKategoris, setBiayaKategoris] = useState<BiayaKategori[]>([])
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
  })
  const [copiedId, setCopiedId] = useState<number | null>(null)

  useEffect(() => {
    fetchProducts()
    api.get('/biaya-kategori').then(res => setBiayaKategoris(res.data))
  }, [])

  function fetchProducts() {
    productApi.list().then(res => setProducts(res.data))
  }

  const sortedKat = [...biayaKategoris].sort((a, b) => a.urutan - b.urutan)

  const totalHarga = Object.values(form.kategori_prices).reduce(
    (sum, v) => sum + (parseFloat(v) || 0), 0
  )

  function openCreate() {
    setEditing(null)
    const prices: Record<number, string> = {}
    const komisis: Record<number, string> = {}
    sortedKat.forEach(k => { prices[k.id] = ''; komisis[k.id] = '' })
    setForm({ nama: '', deskripsi: '', komisi: '', status: 'aktif', kategori_prices: prices, kategori_komisi: komisis })
    setShowModal(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    const prices: Record<number, string> = {}
    const komisis: Record<number, string> = {}
    sortedKat.forEach(k => {
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
    })
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const kategoriPrices: KategoriPrice[] = Object.entries(form.kategori_prices)
      .filter(([_, v]) => v !== '' && parseFloat(v) > 0)
      .map(([k, v]) => ({
        kategori_id: Number(k),
        harga: parseFloat(v),
        komisi: parseFloat(form.kategori_komisi[k]) || 0,
      }))

    const payload: any = {
      nama: form.nama,
      deskripsi: form.deskripsi,
      harga: totalHarga,
      komisi: form.komisi ? parseFloat(form.komisi) : null,
      status: form.status,
      kategori_prices: kategoriPrices,
    }

    const req = editing ? productApi.update(editing.id, payload) : productApi.store(payload)
    req.then(() => { setShowModal(false); fetchProducts() })
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
                <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Kategori / Harga / Komisi</th>
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
                        <div className="space-y-1">
                          {p.biaya_kategoris.map(bk => (
                            <div key={bk.id} className="flex items-center gap-1.5 text-[11px]">
                              <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 font-medium text-blue-700">
                                <Tag size={10} />
                                {bk.kode}
                              </span>
                              <span className="text-slate-500">Rp {Number(bk.pivot.harga).toLocaleString('id-ID')}</span>
                              {bk.pivot.komisi > 0 && (
                                <span className="text-emerald-600 font-medium">+ Rp {Number(bk.pivot.komisi).toLocaleString('id-ID')}</span>
                              )}
                            </div>
                          ))}
                        </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg rounded-lg bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">{editing ? 'Edit Produk' : 'Tambah Produk'}</h2>
              <button onClick={() => setShowModal(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-500 transition hover:bg-slate-300"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-4 pb-4 pt-2">
              <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                <div>
                  <input type="text" required placeholder="Nama Produk *" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })}
                    className="w-full rounded-md bg-[#f0f2f5] px-3 py-2.5 text-sm text-slate-800 placeholder-slate-500 outline-none transition focus:bg-white focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <textarea placeholder="Deskripsi" value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} rows={2}
                    className="w-full rounded-md bg-[#f0f2f5] px-3 py-2.5 text-sm text-slate-800 placeholder-slate-500 outline-none transition focus:bg-white focus:ring-1 focus:ring-blue-500" />
                </div>

                {/* Kategori Prices */}
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rincian Harga per Kategori</p>
                  <div className="space-y-2">
                    {sortedKat.map(k => (
                      <div key={k.id}>
                        <div className="flex items-center gap-2">
                          <span className="w-20 text-xs font-semibold text-slate-600 flex-none">{k.kode}</span>
                          <span className="text-[10px] text-slate-400 flex-none w-12">{k.nama}</span>
                          <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">Rp</span>
                            <input
                              type="number" min={0} placeholder="0"
                              value={form.kategori_prices[k.id] ?? ''}
                              onChange={e => setKatPrice(k.id, e.target.value)}
                              className="w-full rounded-md bg-white border border-slate-200 px-8 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="w-20 text-[10px] font-medium text-slate-400 flex-none text-right pr-1">Komisi</span>
                          <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium">Rp</span>
                            <input
                              type="number" min={0} placeholder="0"
                              value={form.kategori_komisi[k.id] ?? ''}
                              onChange={e => setKatKomisi(k.id, e.target.value)}
                              className="w-full rounded-md bg-emerald-50 border border-emerald-200 px-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200">
                    <span className="text-sm font-bold text-slate-700">Total Harga</span>
                    <span className="text-sm font-bold text-[#0D1F3C]">Rp {totalHarga.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Komisi Global (Rp)</label>
                    <input type="number" min={0} placeholder="0" value={form.komisi} onChange={e => setForm({ ...form, komisi: e.target.value })}
                      className="w-full rounded-md bg-[#f0f2f5] px-3 py-2.5 text-sm text-slate-800 placeholder-slate-500 outline-none transition focus:bg-white focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                      className="w-full rounded-md bg-[#f0f2f5] px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-1 focus:ring-blue-500">
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                    </select>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">Komisi per kategori: diterima affiliate saat kategori tersebut lunas. Komisi global: diterima saat pendaftar di-approve.</p>
              </div>
              <div className="mt-4 flex gap-2">
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
