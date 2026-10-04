import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Tag, Plus, Edit3, Trash2, X, Search, Percent, DollarSign, RotateCcw, Users, ChevronRight, LayoutDashboard } from 'lucide-react'
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
    const dot = status === 'aktif' ? 'bg-[#188038]' : 'bg-[#e8eaed]'
    return (
      <span className="inline-flex items-center gap-1.5 border border-[#dadce0] bg-white px-2 py-1 text-[11px] font-medium text-[#5f6368] ">
        <span className={`h-1.5 w-1.5 ${dot}`} />
        {status === 'aktif' ? 'Aktif' : 'Nonaktif'}
      </span>
    )
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-[#5f6368]" aria-label="Breadcrumb">
        <Link to="/" className="flex items-center gap-1 transition-colors hover:text-[#1a73e8]">
          <LayoutDashboard size={13} />
          <span>Beranda</span>
        </Link>
        <ChevronRight size={12} className="text-[#9aa0a6]" />
        <Link to="/affiliate-dashboard" className="transition-colors hover:text-[#1a73e8]">
          Dashboard
        </Link>
        <ChevronRight size={12} className="text-[#9aa0a6]" />
        <span className="font-medium text-[#3c4043]">Data Coupon</span>
      </nav>

      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <Tag size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Data Coupon / Diskon</h1>
            <p className="text-sm text-[#5f6368]">Kelola kupon diskon untuk program dan produk</p>
          </div>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 bg-[#0E6187] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#084c63] focus:outline-none focus:border-[#188038]">
          <Plus size={16} /> Tambah Kupon
        </button>
      </div>

      {/* Filter */}
      <div className="mb-4 p-4 ">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#80868b]" />
            <input type="text" placeholder="Cari kode kupon..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full border border-[#dadce0] bg-white py-2 pl-9 pr-3 text-sm text-[#3c4043] outline-none transition placeholder:text-[#80868b] focus:border-[#1a73e8] focus:border-[#1a73e8]" />
          </div>
          <button onClick={resetFilter}
            className="inline-flex items-center justify-center gap-2 border border-[#dadce0] bg-white px-3 py-2 text-sm font-medium text-[#3c4043] transition hover:bg-[#f8f9fa] focus:outline-none focus:border-[#1a73e8]">
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden border border-[#dadce0] bg-white ">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full border-collapse text-left text-sm text-[#3c4043]">
            <thead className="text-sm text-[#5f6368]">
              <tr>
                <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3">Kode</th>
                <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3">Produk</th>
                <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Tipe</th>
                <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Nilai</th>
                <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Min Beli</th>
                <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Pakai</th>
                <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Maks</th>
                <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Masa Berlaku</th>
                <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Status</th>
                <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]">
                      <Tag size={24} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-[#5f6368]">Belum ada kupon</p>
                  </td>
                </tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id} className="bg-white transition hover:bg-[#f8f9fa]">
                    <td className="border-b border-[#e8eaed] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center bg-[#e6f4ea]">
                          <Tag size={16} className="text-[#137333]" />
                        </div>
                        <span className="font-mono text-sm font-semibold text-[#202124]">{c.kode}</span>
                      </div>
                    </td>
                    <td className="border-b border-[#e8eaed] px-4 py-3 text-sm text-[#5f6368]">{c.product?.nama || 'Semua Produk'}</td>
                    <td className="border-b border-[#e8eaed] px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 border border-[#dadce0] bg-white px-2 py-1 text-[11px] font-medium text-[#5f6368] ">
                        {c.tipe === 'persen' ? <Percent size={12} /> : <DollarSign size={12} />}
                        {c.tipe}
                      </span>
                    </td>
                    <td className="border-b border-[#e8eaed] px-4 py-3 text-center text-sm font-semibold text-[#202124]">
                      {c.tipe === 'persen' ? `${c.nilai}%` : `Rp ${Number(c.nilai).toLocaleString('id-ID')}`}
                    </td>
                    <td className="border-b border-[#e8eaed] px-4 py-3 text-center text-sm text-[#5f6368]">
                      {c.min_pembelian > 0 ? `Rp ${Number(c.min_pembelian).toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="border-b border-[#e8eaed] px-4 py-3 text-center text-sm font-medium text-[#202124]">{c.penggunaan}</td>
                    <td className="border-b border-[#e8eaed] px-4 py-3 text-center text-sm text-[#5f6368]">{c.maks_penggunaan ?? '~'}</td>
                    <td className="border-b border-[#e8eaed] px-4 py-3 text-center text-xs text-[#5f6368]">
                      {c.berlaku_mulai || c.berlaku_sampai
                        ? `${c.berlaku_mulai ? new Date(c.berlaku_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '~'} - ${c.berlaku_sampai ? new Date(c.berlaku_sampai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '~'}`
                        : 'Tanpa batas'}
                    </td>
                    <td className="border-b border-[#e8eaed] px-4 py-3 text-center">{statusBadge(c.status)}</td>
                    <td className="border-b border-[#e8eaed] px-4 py-3 text-center">
                      <div className="flex justify-center gap-1.5">
                        <button onClick={() => openEdit(c)}
                          className="border border-[#dadce0] bg-white p-2 text-[#5f6368] transition hover:border-[#fdd663] hover:bg-[#fef7e0] hover:text-[#b06000]" title="Edit">
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => handleDelete(c.id)}
                          className="border border-[#dadce0] bg-white p-2 text-[#5f6368] transition hover:border-[#f6aea9] hover:bg-[#fce8e6] hover:text-[#c5221f]" title="Hapus">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/50 p-4" onClick={() => setShowModal(false)}>
          <div className="border border-[#dadce0] w-full max-w-lg bg-white p-6 shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)]" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#202124]">{editing ? 'Edit Kupon' : 'Tambah Kupon'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-[#f1f3f4]"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#3c4043] mb-1">Kode Kupon <span className="text-[#d93025]">*</span></label>
                  <input type="text" required value={form.kode} onChange={e => setForm({ ...form, kode: e.target.value.toUpperCase() })}
                    className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm font-mono text-[#3c4043] outline-none focus:border-[#1a73e8] focus:border-[#1a73e8]" placeholder="DISKON50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3c4043] mb-1">Tipe Diskon</label>
                  <select value={form.tipe} onChange={e => setForm({ ...form, tipe: e.target.value })}
                    className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8] focus:border-[#1a73e8]">
                    <option value="nominal">Nominal (Rp)</option>
                    <option value="persen">Persen (%)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#3c4043] mb-1">Nilai Diskon <span className="text-[#d93025]">*</span></label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#80868b]">
                      {form.tipe === 'persen' ? '%' : 'Rp'}
                    </span>
                    <input type="number" required min={0} value={form.nilai} onChange={e => setForm({ ...form, nilai: e.target.value })}
                      className="w-full border border-[#dadce0] bg-white py-2 pl-8 pr-3 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8] focus:border-[#1a73e8]" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3c4043] mb-1">Produk (opsional)</label>
                  <select value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}
                    className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8] focus:border-[#1a73e8]">
                    <option value="">Semua Produk</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#3c4043] mb-1">Min. Pembelian (Rp)</label>
                  <input type="number" min={0} value={form.min_pembelian} onChange={e => setForm({ ...form, min_pembelian: e.target.value })}
                    className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8] focus:border-[#1a73e8]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3c4043] mb-1">Maks. Penggunaan</label>
                  <input type="number" min={1} value={form.maks_penggunaan} onChange={e => setForm({ ...form, maks_penggunaan: e.target.value })}
                    className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8] focus:border-[#1a73e8]" placeholder="Kosongkan jika tidak terbatas" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#3c4043] mb-1">Berlaku Mulai</label>
                  <input type="date" value={form.berlaku_mulai} onChange={e => setForm({ ...form, berlaku_mulai: e.target.value })}
                    className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8] focus:border-[#1a73e8]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3c4043] mb-1">Berlaku Sampai</label>
                  <input type="date" value={form.berlaku_sampai} onChange={e => setForm({ ...form, berlaku_sampai: e.target.value })}
                    className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8] focus:border-[#1a73e8]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3c4043] mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8] focus:border-[#1a73e8]">
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-[#5f6368] transition hover:bg-[#f1f3f4]">Batal</button>
                <button type="submit" className="bg-[#0E6187] px-4 py-2 text-sm text-white transition hover:bg-[#084c63]">{editing ? 'Simpan' : 'Tambah'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
