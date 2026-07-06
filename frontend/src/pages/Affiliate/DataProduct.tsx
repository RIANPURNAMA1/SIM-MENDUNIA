import { useState, useEffect } from 'react'
import { Package, Plus, Edit3, Trash2, X, Search, RotateCcw, Link as LinkIcon, Check, GraduationCap, ExternalLink } from 'lucide-react'
import { productApi } from '../../services/api'

interface Product {
  id: number
  nama: string
  deskripsi: string | null
  harga: number
  komisi: number | null
  status: string
}

export default function DataProduct() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState({ nama: '', deskripsi: '', harga: '', komisi: '', status: 'aktif' })
  const [copiedId, setCopiedId] = useState<number | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  function fetchProducts() {
    productApi.list().then(res => setProducts(res.data))
  }

  function openCreate() {
    setEditing(null)
    setForm({ nama: '', deskripsi: '', harga: '', komisi: '', status: 'aktif' })
    setShowModal(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setForm({ nama: p.nama, deskripsi: p.deskripsi || '', harga: String(p.harga), komisi: p.komisi ? String(p.komisi) : '', status: p.status })
    setShowModal(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = { ...form, harga: parseFloat(form.harga), komisi: form.komisi ? parseFloat(form.komisi) : null }
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

  const filtered = products.filter(p => !search || p.nama.toLowerCase().includes(search.toLowerCase()))

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
                <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Deskripsi</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-right font-medium">Harga</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-right font-medium">Komisi</th>
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
                    <td className="border border-slate-200 px-4 py-3 text-sm text-slate-500 max-w-xs truncate">{p.deskripsi || '-'}</td>
                    <td className="border border-slate-200 px-4 py-3 text-right text-sm font-semibold text-slate-800">
                      Rp {Number(p.harga).toLocaleString('id-ID')}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-right text-sm font-semibold text-emerald-600">
                      {p.komisi ? `Rp ${Number(p.komisi).toLocaleString('id-ID')}` : '-'}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">{editing ? 'Edit Produk' : 'Tambah Produk'}</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1 hover:bg-slate-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Produk <span className="text-red-500">*</span></label>
                <input type="text" required value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Deskripsi</label>
                <textarea value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} rows={3}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Harga (Rp) <span className="text-red-500">*</span></label>
                  <input type="number" required min={0} value={form.harga} onChange={e => setForm({ ...form, harga: e.target.value })}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Komisi Affiliate (Rp)</label>
                  <input type="number" min={0} value={form.komisi} onChange={e => setForm({ ...form, komisi: e.target.value })}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
              <p className="-mt-2 text-xs text-slate-400">Jumlah komisi yg diterima affiliate saat pendaftar di-approve</p>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100">Batal</button>
                <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700">{editing ? 'Simpan' : 'Tambah'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
