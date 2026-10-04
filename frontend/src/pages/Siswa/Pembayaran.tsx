function fmt(n: number) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, Search, RotateCcw, Eye, CheckCircle, Clock, XCircle, Wallet, FileText, Images, Filter, Camera, ChevronRight, LayoutDashboard } from 'lucide-react'
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
    pending: { bg: 'bg-[#fef7e0] border-[#fdd663]', text: 'text-[#b06000]', label: 'Pending', icon: Clock },
    verified: { bg: 'bg-[#e6f4ea] border-[#a8dab5]', text: 'text-[#137333]', label: 'Verified', icon: CheckCircle },
    ditolak: { bg: 'bg-[#fce8e6] border-[#f6aea9]', text: 'text-[#c5221f]', label: 'Ditolak', icon: XCircle },
  }
  const s = map[status] || { bg: 'bg-[#f8f9fa] border-[#dadce0]', text: 'text-[#5f6368]', label: status, icon: Clock }
  const Icon = s.icon
  return (
    <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-semibold ${s.bg} ${s.text}`}>
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

  const groupedByPendaftar = useMemo(() => {
    const map = new Map<string, PaymentItem[]>()
    for (const p of filtered) {
      const pid = p.pendaftar?.id ?? p.pendaftar_id
      const key = `${pid}-${p.bukti_pembayaran || `manual-${p.id}`}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    }
    return Array.from(map.entries()).map(([key, items]) => ({
      id: key,
      pendaftar: items[0].pendaftar,
      items,
      bukti: items.find(i => i.bukti_pembayaran)?.bukti_pembayaran ?? null,
    }))
  }, [filtered])

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-[#5f6368]" aria-label="Breadcrumb">
        <Link to="/" className="flex items-center gap-1 transition-colors hover:text-[#1a73e8]">
          <LayoutDashboard size={13} />
          <span>Beranda</span>
        </Link>
        <ChevronRight size={12} className="text-[#9aa0a6]" />
        <Link to="/pendaftar" className="transition-colors hover:text-[#1a73e8]">
          Manage Kandidat
        </Link>
        <ChevronRight size={12} className="text-[#9aa0a6]" />
        <span className="font-medium text-[#3c4043]">Riwayat Pembayaran</span>
      </nav>

      <div className="mb-4 flex flex-col gap-3 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <Wallet size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Data Pembayaran</h1>
            <p className="text-sm text-[#5f6368]">{data.length} total pembayaran</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowCatatan(!showCatatan)}
            className="inline-flex items-center gap-2 bg-[#0E6187] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#1a5e6f]"
          >
            {showCatatan ? <FileText size={16} /> : <Images size={16} />}
            {showCatatan ? 'Tabel' : 'Catatan'}
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="border border-[#dadce0] bg-white p-3">
          <p className="text-xs font-medium text-[#5f6368]">Total Transaksi</p>
          <p className="text-lg font-bold text-[#202124]">{stats.count}</p>
        </div>
        <div className="border border-[#dadce0] bg-white p-3">
          <p className="text-xs font-medium text-[#5f6368]">Total Nominal</p>
          <p className="text-lg font-bold text-[#202124]">Rp {fmt(stats.total)}</p>
        </div>
        <div className="border border-[#dadce0] bg-white p-3">
          <p className="text-xs font-medium text-[#137333]">Terverifikasi</p>
          <p className="text-lg font-bold text-[#137333]">Rp {fmt(stats.verified)}</p>
        </div>
        <div className="border border-[#dadce0] bg-white p-3">
          <p className="text-xs font-medium text-[#b06000]">Pending</p>
          <p className="text-lg font-bold text-[#b06000]">{stats.pending}</p>
        </div>
      </div>

      <div className="mb-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#80868b]" />
            <input
              type="text"
              placeholder="Cari kandidat..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-[#dadce0] bg-white py-2 pl-9 pr-3 text-sm text-[#3c4043] outline-none transition placeholder:text-[#80868b] focus:border-[#1a73e8] focus:border-[#1a73e8]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={14} className="text-[#80868b]" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="border border-[#dadce0] bg-white px-2 py-2 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8] focus:border-[#1a73e8]"
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
              className="border border-[#dadce0] bg-white px-2 py-2 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8] focus:border-[#1a73e8]"
            />
            <span className="text-[#80868b] text-sm">-</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="border border-[#dadce0] bg-white px-2 py-2 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8] focus:border-[#1a73e8]"
            />
            <button
              onClick={() => { setSearch(''); setFilterStatus(''); setStartDate(''); setEndDate('') }}
              className="inline-flex items-center justify-center gap-2 border border-[#dadce0] bg-white px-3 py-2 text-sm font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
        </div>
      </div>

      {!showCatatan ? (
        <div className="overflow-x-auto border border-[#dadce0] bg-white">
          <table className="w-full min-w-full border-collapse text-left text-sm text-[#3c4043]">
            <thead className="text-sm text-[#5f6368]">
              <tr>
                <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Tanggal</th>
                <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Kategori</th>
                <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Keterangan</th>
                <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-right">Nominal</th>
                <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Status</th>
                <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Cabang</th>
                <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Oleh</th>
                <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="h-3 bg-[#e8eaed]/70 w-full animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]">
                      <CreditCard size={24} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-[#5f6368]">Belum ada pembayaran</p>
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="bg-white transition hover:bg-[#f8f9fa]">
                    <td className="border-b border-[#e8eaed] border-b border-b px-4 py-3 text-sm text-[#5f6368] whitespace-nowrap">
                      {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="border-b border-[#e8eaed] border-b border-b px-4 py-3">
                      <span className="bg-[#e8f0fe] px-2 py-0.5 text-[11px] font-semibold text-[#1967d2]">
                        {p.kategori?.nama || '-'}
                      </span>
                    </td>
                    <td className="border-b border-[#e8eaed] border-b border-b px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.pendaftar?.nama || '?')}&background=e5e7eb&color=6b7280&size=28`}
                          className="h-8 w-8 object-cover shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#202124] truncate">{p.pendaftar?.nama || '-'}</p>
                          <p className="text-xs text-[#5f6368] truncate">{p.pendaftar?.product?.nama || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-[#e8eaed] border-b border-b px-4 py-3 text-right text-sm font-bold text-[#202124] whitespace-nowrap">
                      Rp {fmt(nominalTampil(p))}
                    </td>
                    <td className="border-b border-[#e8eaed] border-b border-b px-4 py-3">
                      {statusBadge(p.status)}
                    </td>
                    <td className="border-b border-[#e8eaed] border-b border-b px-4 py-3 text-sm text-[#5f6368]">
                      {p.pendaftar?.batch?.nama_batch || <span className="text-[#9aa0a6]">-</span>}
                    </td>
                    <td className="border-b border-[#e8eaed] border-b border-b px-4 py-3">
                      <div className="text-sm text-[#3c4043]">
                        <p className="font-medium">{p.pendaftar?.nama || '-'}</p>
                        <p className="text-xs text-[#5f6368]">{p.pendaftar?.email || ''}</p>
                      </div>
                    </td>
                    <td className="border-b border-[#e8eaed] border-b border-b px-4 py-3 text-center">
                      {p.bukti_pembayaran ? (
                        <button
                          onClick={() => setPreviewImg(`${APP_URL}/storage/${p.bukti_pembayaran}`)}
                          className="inline-flex items-center gap-1.5 border border-[#dadce0] px-3 py-1.5 text-xs font-medium text-[#5f6368] transition hover:border-[#aecbfa] hover:bg-[#e8f0fe] hover:text-[#1a73e8]"
                        >
                          <Eye size={13} />
                          Lihat
                        </button>
                      ) : (
                        <span className="text-xs text-[#80868b]">Manual</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="border-t border-[#dadce0] px-4 py-3 text-sm text-[#5f6368]">
            Menampilkan {filtered.length} dari {data.length} pembayaran
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-[#dadce0] overflow-hidden animate-pulse">
                <div className="h-40 bg-[#e8eaed]/70" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-[#e8eaed]/70 w-1/3" />
                  <div className="h-4 bg-[#e8eaed]/70 w-1/2" />
                  <div className="h-3 bg-[#e8eaed]/70 w-2/3" />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-center py-10 text-sm text-[#80868b]">Belum ada catatan</div>
          ) : (
            groupedByPendaftar.map(group => (
              <div key={group.id} className="border border-[#dadce0] overflow-hidden hover: transition- bg-white">
                {group.bukti ? (
                  <img
                    src={`${APP_URL}/storage/${group.bukti}`}
                    alt="Bukti pembayaran"
                    className="w-full h-40 object-cover cursor-pointer"
                    onClick={() => setPreviewImg(`${APP_URL}/storage/${group.bukti}`)}
                  />
                ) : (
                  <div className="h-40 bg-[#f1f3f4] flex items-center justify-center">
                    <Camera size={32} className="text-[#9aa0a6]" />
                  </div>
                )}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#202124] truncate">{group.pendaftar?.nama || '-'}</p>
                      <p className="text-[10px] text-[#80868b] truncate">{group.pendaftar?.email || ''}</p>
                    </div>
                    <div className="shrink-0 ml-2">
                      {statusBadge(group.items[0]?.status || 'pending')}
                    </div>
                  </div>
                  <p className="text-xs text-[#5f6368] truncate">{group.pendaftar?.product?.nama || 'Tanpa keterangan'}</p>
                  <div className="mt-2 pt-2 border-t border-[#e8eaed] space-y-1.5">
                    {group.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-[#5f6368] truncate">
                          {item.kategori?.nama || '-'}
                          <span className="text-[#80868b]"> · {new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </span>
                        <span className="font-semibold text-[#202124] whitespace-nowrap">Rp {fmt(nominalTampil(item))}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#e8eaed] text-xs font-bold text-[#202124]">
                      <span>Total</span>
                      <span>Rp {fmt(group.items.reduce((s, item) => s + Number(nominalTampil(item)), 0))}</span>
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
          <div className="absolute inset-0 bg-[#202124]/60" />
          <div className="border border-[#dadce0] relative max-w-2xl w-full bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#dadce0]">
              <h3 className="text-sm font-semibold text-[#202124]">Bukti Pembayaran</h3>
              <button onClick={() => setPreviewImg(null)} className="p-1 text-[#80868b] hover:bg-[#f1f3f4] hover:text-[#5f6368] transition-colors">
                <XCircle size={18} />
              </button>
            </div>
            <div className="p-2">
              <img src={previewImg} alt="Preview" className="w-full h-auto object-contain max-h-[70vh]" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
