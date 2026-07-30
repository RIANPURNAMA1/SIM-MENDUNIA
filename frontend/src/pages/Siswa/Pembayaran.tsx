function fmt(n: number) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

import { useState, useEffect, useMemo } from 'react'
import { CreditCard, Search, RotateCcw, Eye, CheckCircle, Clock, XCircle, Wallet, FileText, Images, Plus, Filter, Camera } from 'lucide-react'
import { pembayaranApi, APP_URL } from '../../services/api'

interface PaymentItem {
  id: number
  pendaftar_id: number
  jumlah: number
  kode_unik: number
  total_transfer?: number
  status: string
  created_at: string
  bukti_pembayaran: string | null
  kategori_id: number | null
  kategori: { nama: string } | null
  pendaftar: {
    id: number
    nama: string
    email: string
    telepon: string | null
    product: { nama: string } | null
    batch: { nama_batch: string } | null
  } | null
}

const statusBadge = (status: string) => {
  const map: Record<string, { bg: string; text: string; label: string; icon: typeof Clock }> = {
    pending: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'Pending', icon: Clock },
    verified: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'Verified', icon: CheckCircle },
    ditolak: { bg: 'bg-red-50 border-red-200', text: 'text-red-600', label: 'Ditolak', icon: XCircle },
  }
  const s = map[status] || { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-600', label: status, icon: Clock }
  const Icon = s.icon
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${s.bg} ${s.text}`}>
      <Icon size={12} />
      {s.label}
    </span>
  )
}

export default function Pembayaran() {
  const [data, setData] = useState<PaymentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showCatatan, setShowCatatan] = useState(false)
  const [previewImg, setPreviewImg] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  function fetchData() {
    setLoading(true)
    pembayaranApi.list({})
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const filtered = useMemo(() => {
    return data.filter(p => {
      const matchSearch = !search
        || p.pendaftar?.nama?.toLowerCase().includes(search.toLowerCase())
        || p.pendaftar?.email?.toLowerCase().includes(search.toLowerCase())
      const matchStatus = !filterStatus || p.status === filterStatus
      const payDate = new Date(p.created_at)
      const matchStart = !startDate || payDate >= new Date(startDate + 'T00:00:00')
      const matchEnd = !endDate || payDate <= new Date(endDate + 'T23:59:59')
      return matchSearch && matchStatus && matchStart && matchEnd
    })
  }, [data, search, filterStatus, startDate, endDate])

  const nominalTampil = (p: PaymentItem) => p.kode_unik > 0 ? (p.total_transfer ?? p.jumlah) : p.jumlah

  const stats = useMemo(() => ({
    total: data.reduce((s, p) => s + Number(nominalTampil(p)), 0),
    count: data.length,
    verified: data.filter(p => p.status === 'verified').reduce((s, p) => s + Number(nominalTampil(p)), 0),
    pending: data.filter(p => p.status === 'pending').length,
  }), [data])

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-3 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] border border-blue-100">
            <Wallet size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Data Pembayaran</h1>
            <p className="text-sm text-slate-500">{data.length} total pembayaran</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowCatatan(!showCatatan)}
            className="inline-flex items-center gap-2 rounded-md bg-[#0E6187] px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#1a5e6f]"
          >
            {showCatatan ? <FileText size={16} /> : <Images size={16} />}
            {showCatatan ? 'Tabel' : 'Catatan'}
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Transaksi</p>
          <p className="text-lg font-bold text-slate-800">{stats.count}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Nominal</p>
          <p className="text-lg font-bold text-slate-800">Rp {fmt(stats.total)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-emerald-600">Terverifikasi</p>
          <p className="text-lg font-bold text-emerald-700">Rp {fmt(stats.verified)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-amber-600">Pending</p>
          <p className="text-lg font-bold text-amber-700">{stats.pending}</p>
        </div>
      </div>

      <div className="mb-4 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kandidat..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="ditolak">Ditolak</option>
            </select>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-slate-400 text-sm">-</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={() => { setSearch(''); setFilterStatus(''); setStartDate(''); setEndDate('') }}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
        </div>
      </div>

      {!showCatatan ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-full border-collapse text-left text-sm text-slate-700">
            <thead className="text-sm text-slate-600">
              <tr>
                <th className="border border-slate-200 px-4 py-3 font-medium">Tanggal</th>
                <th className="border border-slate-200 px-4 py-3 font-medium">Kategori</th>
                <th className="border border-slate-200 px-4 py-3 font-medium">Keterangan</th>
                <th className="border border-slate-200 px-4 py-3 text-right font-medium">Nominal</th>
                <th className="border border-slate-200 px-4 py-3 font-medium">Status</th>
                <th className="border border-slate-200 px-4 py-3 font-medium">Cabang</th>
                <th className="border border-slate-200 px-4 py-3 font-medium">Oleh</th>
                <th className="border border-slate-200 px-4 py-3 text-center font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="border border-slate-200 px-4 py-3">
                      <div className="h-3 bg-slate-200/70 rounded w-full animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="border border-slate-200 px-6 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <CreditCard size={24} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-600">Belum ada pembayaran</p>
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="bg-white transition hover:bg-slate-50">
                    <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="border border-slate-200 px-4 py-3">
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                        {p.kategori?.nama || '-'}
                      </span>
                    </td>
                    <td className="border border-slate-200 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.pendaftar?.nama || '?')}&background=e5e7eb&color=6b7280&size=28`}
                          className="h-8 w-8 rounded-full object-cover shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{p.pendaftar?.nama || '-'}</p>
                          <p className="text-xs text-slate-500 truncate">{p.pendaftar?.product?.nama || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-right text-sm font-bold text-slate-800 whitespace-nowrap">
                      Rp {fmt(nominalTampil(p))}
                    </td>
                    <td className="border border-slate-200 px-4 py-3">
                      {statusBadge(p.status)}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">
                      {p.pendaftar?.batch?.nama_batch || <span className="text-slate-300">-</span>}
                    </td>
                    <td className="border border-slate-200 px-4 py-3">
                      <div className="text-sm text-slate-700">
                        <p className="font-medium">{p.pendaftar?.nama || '-'}</p>
                        <p className="text-xs text-slate-500">{p.pendaftar?.email || ''}</p>
                      </div>
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      {p.bukti_pembayaran ? (
                        <button
                          onClick={() => setPreviewImg(`${APP_URL}/storage/${p.bukti_pembayaran}`)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Eye size={13} />
                          Lihat
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Manual</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
            Menampilkan {filtered.length} dari {data.length} pembayaran
          </div>
        </div>
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
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-center py-10 text-sm text-slate-400">Belum ada catatan</div>
          ) : (
            filtered.map(p => (
              <div key={p.id} className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white">
                {p.bukti_pembayaran ? (
                  <img
                    src={`${APP_URL}/storage/${p.bukti_pembayaran}`}
                    alt="Bukti pembayaran"
                    className="w-full h-40 object-cover cursor-pointer"
                    onClick={() => setPreviewImg(`${APP_URL}/storage/${p.bukti_pembayaran}`)}
                  />
                ) : (
                  <div className="h-40 bg-slate-100 flex items-center justify-center">
                    <Camera size={32} className="text-slate-300" />
                  </div>
                )}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="inline-flex px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded">
                      {p.kategori?.nama || '-'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(p.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 mt-1">Rp {fmt(nominalTampil(p))}</p>
                  <p className="text-xs text-slate-500 mt-1 truncate">{p.pendaftar?.product?.nama || 'Tanpa keterangan'}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-6 h-6 rounded-full bg-[#0E6187] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {p.pendaftar?.nama?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-600 truncate">{p.pendaftar?.nama}</p>
                        <p className="text-[10px] text-slate-400 truncate">{p.pendaftar?.email}</p>
                      </div>
                    </div>
                    <div className="shrink-0 ml-2">
                      {statusBadge(p.status)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {previewImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setPreviewImg(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-800">Bukti Pembayaran</h3>
              <button onClick={() => setPreviewImg(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <XCircle size={18} />
              </button>
            </div>
            <div className="p-2">
              <img src={previewImg} alt="Preview" className="w-full h-auto rounded-lg object-contain max-h-[70vh]" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
