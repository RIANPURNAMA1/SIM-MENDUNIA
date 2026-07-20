import { useState, useEffect } from 'react'
import { Tag, Plus, Edit3, Trash2, X, Search, Percent, DollarSign, RotateCcw, Users } from 'lucide-react'
import { couponApi, productApi } from '../../services/api'

interface Coupon {
  id: number
  kode: string
  product_id: number | null
  product: { id: number; nama: string } | null
  tipe: 'persen' | 'nominal'
  nilai: number
  min_pembelian: number
  maks_penggunaan: number | null
  penggunaan: number
  berlaku_mulai: string | null
  berlaku_sampai: string | null
  status: string
}

interface Product {
  id: number
  nama: string
}

export default function DataCoupon() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [form, setForm] = useState({
    kode: '', product_id: '', tipe: 'nominal', nilai: '',
    min_pembelian: '0', maks_penggunaan: '', berlaku_mulai: '', berlaku_sampai: '', status: 'aktif'
  })

  useEffect(() => {
    fetchCoupons()
    productApi.list().then(res => setProducts(res.data))
  }, [])

  function fetchCoupons() {
    couponApi.list().then(res => setCoupons(res.data))
  }

  function openCreate() {
    setEditing(null)
    setForm({ kode: '', product_id: '', tipe: 'nominal', nilai: '', min_pembelian: '0', maks_penggunaan: '', berlaku_mulai: '', berlaku_sampai: '', status: 'aktif' })
    setShowModal(true)
  }

  function openEdit(c: Coupon) {
    setEditing(c)
    setForm({
      kode: c.kode,
      product_id: c.product_id ? String(c.product_id) : '',
      tipe: c.tipe,
      nilai: String(c.nilai),
      min_pembelian: String(c.min_pembelian),
      maks_penggunaan: c.maks_penggunaan ? String(c.maks_penggunaan) : '',
      berlaku_mulai: c.berlaku_mulai ? c.berlaku_mulai.slice(0, 10) : '',
      berlaku_sampai: c.berlaku_sampai ? c.berlaku_sampai.slice(0, 10) : '',
      status: c.status,
    })
    setShowModal(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      ...form,
      product_id: form.product_id ? Number(form.product_id) : null,
      nilai: parseFloat(form.nilai),
      min_pembelian: parseFloat(form.min_pembelian) || 0,
      maks_penggunaan: form.maks_penggunaan ? parseInt(form.maks_penggunaan) : null,
    }
    const req = editing ? couponApi.update(editing.id, payload) : couponApi.store(payload)
    req.then(() => { setShowModal(false); fetchCoupons() })
  }

  function handleDelete(id: number) {
    if (confirm('Yakin ingin menghapus kupon ini?')) couponApi.destroy(id).then(fetchCoupons)
  }

  function resetFilter() { setSearch('') }

  const filtered = coupons.filter(c => !search || c.kode.toLowerCase().includes(search.toLowerCase()))

  const statusBadge = (status: string) => {
    const dot = status === 'aktif' ? 'bg-emerald-500' : 'bg-slate-300'
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {status === 'aktif' ? 'Aktif' : 'Nonaktif'}
      </span>
    )
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] text-white border border-blue-100">
            <Tag size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Data Coupon / Diskon</h1>
            <p className="text-sm text-slate-500">Kelola kupon diskon untuk program dan produk</p>
          </div>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1">
          <Plus size={16} /> Tambah Kupon
        </button>
      </div>

      {/* Filter */}
      <div className="mb-4 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Cari kode kupon..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
          <button onClick={resetFilter}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200">
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
                <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Kode</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Produk</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Tipe</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Nilai</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Min Beli</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Pakai</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Maks</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Masa Berlaku</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Status</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="border border-slate-200 px-6 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Tag size={24} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-600">Belum ada kupon</p>
                  </td>
                </tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id} className="bg-white transition hover:bg-slate-50">
                    <td className="border border-slate-200 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                          <Tag size={16} className="text-emerald-600" />
                        </div>
                        <span className="font-mono text-sm font-semibold text-slate-800">{c.kode}</span>
                      </div>
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">{c.product?.nama || 'Semua Produk'}</td>
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
                        {c.tipe === 'persen' ? <Percent size={12} /> : <DollarSign size={12} />}
                        {c.tipe}
                      </span>
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-800">
                      {c.tipe === 'persen' ? `${c.nilai}%` : `Rp ${Number(c.nilai).toLocaleString('id-ID')}`}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-600">
                      {c.min_pembelian > 0 ? `Rp ${Number(c.min_pembelian).toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-800">{c.penggunaan}</td>
                    <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-500">{c.maks_penggunaan ?? '~'}</td>
                    <td className="border border-slate-200 px-4 py-3 text-center text-xs text-slate-500">
                      {c.berlaku_mulai || c.berlaku_sampai
                        ? `${c.berlaku_mulai ? new Date(c.berlaku_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '~'} - ${c.berlaku_sampai ? new Date(c.berlaku_sampai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '~'}`
                        : 'Tanpa batas'}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center">{statusBadge(c.status)}</td>
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      <div className="flex justify-center gap-1.5">
                        <button onClick={() => openEdit(c)}
                          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600" title="Edit">
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => handleDelete(c.id)}
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
              <h2 className="text-lg font-bold text-gray-800">{editing ? 'Edit Kupon' : 'Tambah Kupon'}</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1 hover:bg-slate-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Kode Kupon <span className="text-red-500">*</span></label>
                  <input type="text" required value={form.kode} onChange={e => setForm({ ...form, kode: e.target.value.toUpperCase() })}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-mono text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="DISKON50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tipe Diskon</label>
                  <select value={form.tipe} onChange={e => setForm({ ...form, tipe: e.target.value })}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <option value="nominal">Nominal (Rp)</option>
                    <option value="persen">Persen (%)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nilai Diskon <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      {form.tipe === 'persen' ? '%' : 'Rp'}
                    </span>
                    <input type="number" required min={0} value={form.nilai} onChange={e => setForm({ ...form, nilai: e.target.value })}
                      className="w-full rounded-md border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Produk (opsional)</label>
                  <select value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <option value="">Semua Produk</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Min. Pembelian (Rp)</label>
                  <input type="number" min={0} value={form.min_pembelian} onChange={e => setForm({ ...form, min_pembelian: e.target.value })}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Maks. Penggunaan</label>
                  <input type="number" min={1} value={form.maks_penggunaan} onChange={e => setForm({ ...form, maks_penggunaan: e.target.value })}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Kosongkan jika tidak terbatas" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Berlaku Mulai</label>
                  <input type="date" value={form.berlaku_mulai} onChange={e => setForm({ ...form, berlaku_mulai: e.target.value })}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Berlaku Sampai</label>
                  <input type="date" value={form.berlaku_sampai} onChange={e => setForm({ ...form, berlaku_sampai: e.target.value })}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
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
