function fmt(n: number) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

import { useState, useEffect, useMemo } from 'react'
import { CreditCard, Search, RotateCcw, Eye, CheckCircle, Clock, XCircle, Loader, UserCheck } from 'lucide-react'
import { pembayaranApi, APP_URL } from '../../services/api'

interface PaymentItem {
  id: number
  pendaftar_id: number
  jumlah: number
  status: string
  created_at: string
  bukti_pembayaran: string | null
  pendaftar: {
    id: number
    nama: string
    email: string
    telepon: string | null
    product: { nama: string } | null
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
      return matchSearch && matchStatus
    })
  }, [data, search, filterStatus])

  const stats = useMemo(() => ({
    total: data.reduce((s, p) => s + Number(p.jumlah), 0),
    count: data.length,
    verified: data.filter(p => p.status === 'verified').reduce((s, p) => s + Number(p.jumlah), 0),
    pending: data.filter(p => p.status === 'pending').length,
  }), [data])

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] border border-blue-100">
            <CreditCard size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Pembayaran</h1>
            <p className="text-sm text-slate-500">Riwayat pembayaran dari kandidat</p>
          </div>
        </div>
      </div>

      {/* Stats */}
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

      {/* Filter */}
      <div className="mb-4 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama/email kandidat..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="ditolak">Ditolak</option>
          </select>
          <button
            onClick={() => { setSearch(''); setFilterStatus('') }}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-full border-collapse text-left text-sm text-slate-700">
          <thead className="text-sm text-slate-600">
            <tr>
              <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Kandidat</th>
              <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Program</th>
              <th scope="col" className="border border-slate-200 px-4 py-3 text-right font-medium">Jumlah</th>
              <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Status</th>
              <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Tanggal</th>
              <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Sumber</th>
              <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Bukti</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="border border-slate-200 px-4 py-20">
                  <div className="flex items-center justify-center">
                    <div className="relative w-14 h-14 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0D1F3C] animate-spin" />
                      <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
                    </div>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="border border-slate-200 px-6 py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <CreditCard size={24} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-600">Belum ada riwayat pembayaran</p>
                </td>
              </tr>
            ) : (
              filtered.map(p => (
                <tr key={p.id} className="bg-white transition hover:bg-slate-50">
                  <td className="border border-slate-200 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.pendaftar?.nama || '?')}&background=e5e7eb&color=6b7280&size=28`}
                        className="h-8 w-8 rounded-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{p.pendaftar?.nama || '-'}</div>
                        <div className="text-xs text-slate-500">{p.pendaftar?.email || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">
                    {p.pendaftar?.product?.nama || '-'}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-right text-sm font-bold text-slate-800">
                    Rp {fmt(Number(p.jumlah))}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-center">
                    {statusBadge(p.status)}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">
                    {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.bukti_pembayaran ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                      {p.bukti_pembayaran ? 'Online' : 'Manual'}
                    </span>
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-center">
                    {p.bukti_pembayaran ? (
                      <a
                        href={`${APP_URL}/storage/${p.bukti_pembayaran}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Eye size={13} />
                        Lihat
                      </a>
                    ) : (
                      <span className="text-xs text-slate-300">-</span>
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
    </div>
  )
}
