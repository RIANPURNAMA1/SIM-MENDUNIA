import { useState, useEffect } from 'react'
import {
  Wallet, Plus, Search, Trash2, X, Eye, Edit3, Filter, FileText, Images,
} from 'lucide-react'
import { pengeluaranApi, kategoriPengeluaranApi } from '../../services/api'

interface Kategori {
  id: number
  nama: string
  kode: string
}

interface PengeluaranItem {
  id: number
  tanggal: string
  nominal: number
  keterangan: string | null
  bukti: string | null
  kategori: Kategori
  user: { id: number; name: string }
  created_at: string
}

interface RekapItem {
  bulan: number
  nama_bulan: string
  total: number
  jumlah: number
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const bulanNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

export default function DataPengeluaran() {
  const [data, setData] = useState<PengeluaranItem[]>([])
  const [kategoris, setKategoris] = useState<Kategori[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const [filterKategori, setFilterKategori] = useState('')
  const [filterMulai, setFilterMulai] = useState('')
  const [filterSampai, setFilterSampai] = useState('')
  const [search, setSearch] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<PengeluaranItem | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteItem, setDeleteItem] = useState<PengeluaranItem | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [detailItem, setDetailItem] = useState<PengeluaranItem | null>(null)

  const [form, setForm] = useState({ kategori_id: '', tanggal: '', nominal: '', keterangan: '' })
  const [buktiFile, setBuktiFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const [showRekap, setShowRekap] = useState(false)
  const [rekapData, setRekapData] = useState<{ tahun: number; total_tahun: number; total_semua: number; rekap: RekapItem[] } | null>(null)
  const [rekapTahun, setRekapTahun] = useState(new Date().getFullYear())

  const [showCatatan, setShowCatatan] = useState(false)

  const fetchData = (p = page) => {
    setLoading(true)
    const params: Record<string, string | number | undefined> = { page: p, per_page: 15 }
    if (filterKategori) params.kategori_id = filterKategori
    if (filterMulai) params.tanggal_mulai = filterMulai
    if (filterSampai) params.tanggal_sampai = filterSampai
    if (search) params.search = search
    pengeluaranApi.list(params)
      .then(res => {
        setData(res.data.data)
        setTotalPages(res.data.last_page)
        setTotalItems(res.data.total)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const fetchKategoris = () => {
    kategoriPengeluaranApi.list().then(res => setKategoris(res.data)).catch(console.error)
  }

  useEffect(() => { fetchKategoris() }, [])
  useEffect(() => { fetchData(1); setPage(1) }, [filterKategori, filterMulai, filterSampai, search])

  const openCreate = () => {
    setEditItem(null)
    setForm({ kategori_id: '', tanggal: new Date().toISOString().split('T')[0], nominal: '', keterangan: '' })
    setBuktiFile(null)
    setError('')
    setShowForm(true)
  }

  const openEdit = (item: PengeluaranItem) => {
    setEditItem(item)
    setForm({
      kategori_id: String(item.kategori_id),
      tanggal: item.tanggal,
      nominal: String(item.nominal),
      keterangan: item.keterangan || '',
    })
    setBuktiFile(null)
    setError('')
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('kategori_id', form.kategori_id)
      fd.append('tanggal', form.tanggal)
      fd.append('nominal', form.nominal)
      if (form.keterangan) fd.append('keterangan', form.keterangan)
      if (buktiFile) fd.append('bukti', buktiFile)

      if (editItem) {
        await pengeluaranApi.update(editItem.id, fd)
      } else {
        await pengeluaranApi.store(fd)
      }
      setShowForm(false)
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    setDeleting(true)
    try {
      await pengeluaranApi.destroy(deleteItem.id)
      setShowDelete(false)
      setDeleteItem(null)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus')
    } finally {
      setDeleting(false)
    }
  }

  const fetchRekap = () => {
    pengeluaranApi.rekap(rekapTahun).then(res => setRekapData(res.data)).catch(console.error)
  }

  useEffect(() => { if (showRekap) fetchRekap() }, [showRekap, rekapTahun])

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] border border-blue-100">
            <Wallet size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Data Pengeluaran</h1>
            <p className="text-sm text-slate-500">{totalItems} total pengeluaran</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCatatan(!showCatatan)}
            className="inline-flex items-center gap-2 rounded-md bg-[#0D1F3C] px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#162d54]"
          >
            {showCatatan ? <FileText size={16} /> : <Images size={16} />}
            {showCatatan ? 'Tabel' : 'Catatan'}
          </button>
          <button
            onClick={() => setShowRekap(true)}
            className="inline-flex items-center gap-2 rounded-md bg-[#0D1F3C] px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#162d54]"
          >
            <FileText size={16} />
            Rekap Bulanan
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus size={16} />
            Input Pengeluaran
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari keterangan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={filterKategori}
              onChange={e => setFilterKategori(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Semua Kategori</option>
              {kategoris.map(k => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
            <input
              type="date"
              value={filterMulai}
              onChange={e => setFilterMulai(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Dari tanggal"
            />
            <span className="text-slate-400 text-sm">-</span>
            <input
              type="date"
              value={filterSampai}
              onChange={e => setFilterSampai(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Sampai tanggal"
            />
          </div>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        {!showCatatan ? (
        <table className="w-full min-w-full border-collapse text-left text-sm text-slate-700">
          <thead className="text-sm text-slate-600">
            <tr>
              <th className="border border-slate-200 px-4 py-3 font-medium">Tanggal</th>
              <th className="border border-slate-200 px-4 py-3 font-medium">Kategori</th>
              <th className="border border-slate-200 px-4 py-3 font-medium">Keterangan</th>
              <th className="border border-slate-200 px-4 py-3 text-right font-medium">Nominal</th>
              <th className="border border-slate-200 px-4 py-3 font-medium">Oleh</th>
              <th className="border border-slate-200 px-4 py-3 text-center font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="border border-slate-200 px-4 py-3">
                    <div className="h-3 bg-slate-200/70 rounded w-full animate-pulse" />
                  </td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={6} className="border border-slate-200 px-6 py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Wallet size={24} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-600">Belum ada pengeluaran</p>
                </td>
              </tr>
            ) : (
              data.map(item => (
                <tr key={item.id} className="bg-white transition hover:bg-slate-50">
                  <td className="border border-slate-200 px-4 py-3 text-sm whitespace-nowrap">
                    {new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="border border-slate-200 px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-1 bg-orange-50 text-orange-700 text-xs font-semibold rounded-lg">
                      {item.kategori?.kode}
                    </span>
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-sm max-w-[200px] truncate">
                    {item.keterangan || '-'}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-right font-semibold text-red-600 whitespace-nowrap">
                    {formatRupiah(item.nominal)}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-slate-500">
                    {item.user?.name}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => { setDetailItem(item); setShowDetail(true) }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Detail"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => { setDeleteItem(item); setShowDelete(true) }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-slate-200 rounded-xl overflow-hidden animate-pulse">
                <div className="h-40 bg-slate-200/70" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-slate-200/70 rounded w-1/3" />
                  <div className="h-4 bg-slate-200/70 rounded w-1/2" />
                  <div className="h-3 bg-slate-200/70 rounded w-2/3" />
                </div>
              </div>
            ))
          ) : data.length === 0 ? (
            <div className="col-span-full text-center py-10 text-sm text-slate-400">Belum ada catatan</div>
          ) : (
            data.map(item => (
              <div key={item.id} className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white">
                {item.bukti ? (
                  item.bukti.endsWith('.pdf') ? (
                    <a href={`http://localhost:8000/storage/${item.bukti}`} target="_blank" rel="noreferrer" className="block h-40 bg-slate-100 flex items-center justify-center">
                      <FileText size={32} className="text-slate-400" />
                    </a>
                  ) : (
                    <img
                      src={`http://localhost:8000/storage/${item.bukti}`}
                      alt="Bukti"
                      className="w-full h-40 object-cover cursor-pointer"
                      onClick={() => { setDetailItem(item); setShowDetail(true) }}
                    />
                  )
                ) : (
                  <div className="h-40 bg-slate-100 flex items-center justify-center">
                    <Wallet size={32} className="text-slate-300" />
                  </div>
                )}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="inline-flex px-2 py-0.5 bg-orange-50 text-orange-700 text-[10px] font-semibold rounded">
                      {item.kategori?.kode}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-red-600 mt-1">{formatRupiah(item.nominal)}</p>
                  <p className="text-xs text-slate-500 mt-1 truncate">{item.keterangan || 'Tanpa keterangan'}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#0D1F3C] flex items-center justify-center text-[10px] font-bold text-white">
                        {item.user?.name?.charAt(0)}
                      </div>
                      <span className="text-xs text-slate-600">{item.user?.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => { setDeleteItem(item); setShowDelete(true) }}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">Halaman {page} dari {totalPages}</p>
          <div className="flex gap-1">
            <button
              onClick={() => { setPage(p => Math.max(1, p - 1)); fetchData(Math.max(1, page - 1)) }}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); fetchData(Math.min(totalPages, page + 1)) }}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-10 p-3 sm:p-4" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSave}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                <div>
                  <h5 className="font-bold text-gray-900 m-0">
                    {editItem ? 'Edit Pengeluaran' : 'Input Pengeluaran'}
                  </h5>
                  <span className="text-[11px] text-orange-600 font-medium">
                    {editItem ? 'Perbarui data pengeluaran' : 'Catat pengeluaran baru'}
                  </span>
                </div>
                <button type="button" onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={form.kategori_id}
                    onChange={e => setForm({ ...form, kategori_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    <option value="">Pilih Kategori</option>
                    {kategoris.map(k => (
                      <option key={k.id} value={k.id}>{k.nama} ({k.kode})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tanggal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.tanggal}
                    onChange={e => setForm({ ...form, tanggal: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nominal (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.nominal}
                    onChange={e => setForm({ ...form, nominal: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Keterangan</label>
                  <textarea
                    value={form.keterangan}
                    onChange={e => setForm({ ...form, keterangan: e.target.value })}
                    placeholder="Keterangan pengeluaran..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Bukti (opsional)</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={e => setBuktiFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                    Batal
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                    {saving ? 'Menyimpan...' : editItem ? 'Simpan' : 'Catat'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail && detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowDetail(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl p-5 sm:p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Detail Pengeluaran</h3>
              <button onClick={() => setShowDetail(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal</span>
                <span className="font-medium">{new Date(detailItem.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kategori</span>
                <span className="font-medium px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-xs">{detailItem.kategori?.nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nominal</span>
                <span className="font-bold text-red-600">{formatRupiah(detailItem.nominal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Keterangan</span>
                <span className="font-medium text-right max-w-[200px]">{detailItem.keterangan || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dicatat oleh</span>
                <span className="font-medium">{detailItem.user?.name}</span>
              </div>
              {detailItem.bukti && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-slate-500 mb-2">Bukti:</p>
                  {detailItem.bukti.endsWith('.pdf') ? (
                    <a href={`http://localhost:8000/storage/${detailItem.bukti}`} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">Lihat PDF</a>
                  ) : (
                    <img src={`http://localhost:8000/storage/${detailItem.bukti}`} alt="Bukti" className="max-w-full rounded-lg border" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showDelete && deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowDelete(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-xl p-5 sm:p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Hapus Pengeluaran</h3>
            <p className="text-sm text-gray-500 mb-2">
              Yakin ingin menghapus pengeluaran ini?
            </p>
            <p className="text-sm font-semibold text-red-600 mb-5">
              {formatRupiah(deleteItem.nominal)} - {deleteItem.kategori?.nama}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                {deleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRekap && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-10 p-3 sm:p-4" onClick={() => setShowRekap(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h5 className="font-bold text-gray-900">Rekap Pengeluaran</h5>
              <button onClick={() => setShowRekap(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <label className="text-sm font-medium text-slate-600">Tahun:</label>
                <select
                  value={rekapTahun}
                  onChange={e => setRekapTahun(Number(e.target.value))}
                  className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {rekapData && (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-lg bg-red-50 p-3 text-center">
                      <p className="text-xs text-slate-500 mb-1">Total {rekapData.tahun}</p>
                      <p className="text-lg font-bold text-red-600">{formatRupiah(rekapData.total_tahun)}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3 text-center">
                      <p className="text-xs text-slate-500 mb-1">Total Semua</p>
                      <p className="text-lg font-bold text-slate-700">{formatRupiah(rekapData.total_semua)}</p>
                    </div>
                  </div>

                  {rekapData.rekap.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500 border-b">
                          <th className="pb-2 font-medium">Bulan</th>
                          <th className="pb-2 font-medium text-center">Jumlah</th>
                          <th className="pb-2 font-medium text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rekapData.rekap.map(r => (
                          <tr key={r.bulan} className="border-b border-slate-100">
                            <td className="py-2 font-medium">{r.nama_bulan}</td>
                            <td className="py-2 text-center text-slate-500">{r.jumlah} transaksi</td>
                            <td className="py-2 text-right font-semibold text-red-600">{formatRupiah(r.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-sm text-center text-slate-400 py-4">Tidak ada data pengeluaran tahun ini</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
