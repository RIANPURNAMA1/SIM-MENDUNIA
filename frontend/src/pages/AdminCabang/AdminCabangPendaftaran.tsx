import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, FileText, Eye, RotateCcw, CreditCard, X, Loader, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Users, MoreHorizontal, BadgeCheck, Ban, RefreshCw,
  Clock, CheckCircle2, Banknote, Receipt, LayoutDashboard, Landmark, UserRound,
} from 'lucide-react'
import { adminCabangApi, APP_URL } from '../../services/api'

function fmt(n: number) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function firstAmount(detail?: { biaya: number; dibayar: number; total_transfer?: number } | null): number {
  if (!detail) return 0
  const totalTransfer = Number(detail.total_transfer) || 0
  const dibayar = Number(detail.dibayar) || 0
  const biaya = Number(detail.biaya) || 0
  if (dibayar > 0) return totalTransfer > 0 ? totalTransfer : dibayar
  return biaya
}

interface PendaftarItem {
  id: number
  nama: string
  email: string
  no_registrasi: string | null
  telepon: string | null
  alamat: string | null
  provinsi: string | null
  kabupaten: string | null
  kecamatan: string | null
  desa: string | null
  nominal: number | null
  diskon: number | null
  bukti_pembayaran: string | null
  status_pendaftaran: string
  status_pembayaran: string
  created_at: string
  bank_pengirim?: string | null
  bank_asal?: string | null
  nama_pengirim?: string | null
  nama_rekening?: string | null
  product: { nama: string } | null
  user: { id: number; name: string } | null
  batch: { id: number; nama_batch: string; warna?: string | null } | null
  affiliate_link?: { affiliate: { name: string } | null } | null
  affiliateLink?: { affiliate: { name: string } | null } | null
  coupon?: { kode: string } | null
  detail?: { kategori_id: number; kode: string; nama: string; biaya: number; dibayar: number; kode_unik?: number; total_transfer?: number; tanggal_bayar?: string }[]
}

export default function AdminCabangPendaftaran() {
  const navigate = useNavigate()
  const [data, setData] = useState<PendaftarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterBatch, setFilterBatch] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [previewImg, setPreviewImg] = useState<string | null>(null)
  const [riwayatModal, setRiwayatModal] = useState<{ id: number; nama: string } | null>(null)
  const [riwayatData, setRiwayatData] = useState<any[]>([])
  const [riwayatLoading, setRiwayatLoading] = useState(false)
  const [detailModal, setDetailModal] = useState<PendaftarItem | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [openActionId, setOpenActionId] = useState<number | null>(null)
  const actionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (actionRef.current && !actionRef.current.contains(e.target as Node)) {
        setOpenActionId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function fetchData() {
    setLoading(true)
    adminCabangApi.pendaftar().then(res => {
      setData(res.data || [])
    }).catch(() => {})
    .finally(() => setLoading(false))
  }

  function openRiwayat(id: number, nama: string) {
    setRiwayatModal({ id, nama })
    setRiwayatLoading(true)
    adminCabangApi.riwayatPembayaran(id).then(res => {
      setRiwayatData(res.data)
    }).catch(() => {}).finally(() => setRiwayatLoading(false))
  }

  function resetFilter() {
    setSearch('')
    setFilterStatus('')
    setFilterBatch('')
    setFilterDateFrom('')
    setFilterDateTo('')
    setPage(1)
  }

  function statusKey(p: PendaftarItem): string {
    if (p.status_pembayaran === 'ditangguhkan') return 'ditangguhkan'
    if (p.status_pembayaran === 'verified') return 'pembayaran_dikonfirmasi'
    if (p.status_pendaftaran === 'ditolak' || p.status_pembayaran === 'ditolak') return 'batal'
    if (p.status_pembayaran === 'processing' && p.status_pendaftaran === 'pending') return 'menunggu_verifikasi'
    if (p.status_pembayaran === 'unpaid') return 'menunggu_pembayaran'
    return 'proses'
  }

  function combinedStatus(p: PendaftarItem) {
    if (p.status_pembayaran === 'ditangguhkan') return { bg: 'bg-[#e37400] text-white', label: 'Ditangguhkan' }
    if (p.status_pembayaran === 'verified') return { bg: 'bg-[#137333] text-white', label: 'Pembayaran Dikonfirmasi' }
    if (p.status_pendaftaran === 'ditolak' || p.status_pembayaran === 'ditolak') return { bg: 'bg-[#c5221f] text-white', label: 'Batal' }
    if (p.status_pembayaran === 'processing' && p.status_pendaftaran === 'pending') return { bg: 'bg-[#e37400] text-white', label: 'Menunggu Verifikasi' }
    if (p.status_pembayaran === 'unpaid') return { bg: 'bg-[#9aa0a6] text-white', label: 'Menunggu Pembayaran' }
    return { bg: 'bg-[#0E6187] text-white', label: 'Proses' }
  }

  const filtered = useMemo(() => {
    return data.filter(p => {
      const matchSearch = !search || p.nama.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase())
      const matchStatus = !filterStatus || statusKey(p) === filterStatus
      const matchBatch = !filterBatch || p.batch?.nama_batch === filterBatch
      const d = new Date(p.created_at)
      d.setHours(0, 0, 0, 0)
      const from = filterDateFrom ? new Date(filterDateFrom) : null
      if (from) from.setHours(0, 0, 0, 0)
      const to = filterDateTo ? new Date(filterDateTo) : null
      if (to) to.setHours(23, 59, 59, 999)
      const matchDate = (!from || d >= from) && (!to || d <= to)
      return matchSearch && matchStatus && matchBatch && matchDate
    })
  }, [data, search, filterStatus, filterBatch, filterDateFrom, filterDateTo])

  const batchList = useMemo(() => {
    const set = new Set<string>()
    data.forEach(p => { if (p.batch?.nama_batch) set.add(p.batch.nama_batch) })
    return Array.from(set).sort()
  }, [data])

  const stats = useMemo(() => ({
    total: data.length,
    menungguPembayaran: data.filter(p => p.status_pembayaran === 'unpaid').length,
    pendingVerifikasi: data.filter(p => p.status_pembayaran === 'processing' && p.status_pendaftaran === 'pending').length,
    proses: data.filter(p => p.status_pembayaran === 'processing' && p.status_pendaftaran === 'disetujui').length,
    selesai: data.filter(p => p.status_pembayaran === 'verified').length,
    batal: data.filter(p => p.status_pendaftaran === 'ditolak' && p.status_pembayaran !== 'ditangguhkan').length,
    ditangguhkan: data.filter(p => p.status_pembayaran === 'ditangguhkan').length,
  }), [data])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage = Math.min(page, totalPages)
  const pagedList = filtered.slice((safePage - 1) * perPage, safePage * perPage)

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-[#5f6368]" aria-label="Breadcrumb">
        <button onClick={() => navigate('/admin-cabang')} className="flex items-center gap-1 transition-colors hover:text-[#1a73e8]">
          <LayoutDashboard size={13} />
          <span>Beranda</span>
        </button>
        <ChevronRight size={12} className="text-[#9aa0a6]" />
        <button onClick={() => navigate('/admin-cabang/pendaftar')} className="transition-colors hover:text-[#1a73e8]">
          Pendaftaran
        </button>
        <ChevronRight size={12} className="text-[#9aa0a6]" />
        <span className="font-medium text-[#3c4043]">Daftar Pendaftar</span>
      </nav>

      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Pendaftaran</h1>
            <p className="text-sm text-[#5f6368]">Kelola pendaftaran cabang Anda</p>
          </div>
        </div>
      </div>

      {/* Status filter buttons */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {([
          { key: '', label: 'Pendaftar', icon: Users, chip: 'bg-[#0E6187]', count: stats.total, badgeValue: 0, badge: false as boolean },
          { key: 'menunggu_pembayaran', label: 'Menunggu Bayar', icon: Clock, chip: 'bg-[#5f6368]', count: stats.menungguPembayaran, badgeValue: 0, badge: false },
          { key: 'menunggu_verifikasi', label: 'Verifikasi', icon: BadgeCheck, chip: 'bg-[#e37400]', count: stats.pendingVerifikasi, badgeValue: stats.pendingVerifikasi, badge: true },
          { key: 'proses', label: 'Proses', icon: RefreshCw, chip: 'bg-[#0E6187]', count: stats.proses, badgeValue: 0, badge: false },
          { key: 'pembayaran_dikonfirmasi', label: 'Dikonfirmasi', icon: CheckCircle2, chip: 'bg-[#137333]', count: stats.selesai, badgeValue: 0, badge: false },
          { key: 'batal', label: 'Batal', icon: Ban, chip: 'bg-[#d93025]', count: stats.batal, badgeValue: 0, badge: false },
          { key: 'ditangguhkan', label: 'Ditangguhkan', icon: Banknote, chip: 'bg-[#e37400]', count: stats.ditangguhkan, badgeValue: 0, badge: false },
        ] as const).map(s => {
          const Icon = s.icon
          const active = (filterStatus || '') === s.key
          return (
            <button key={s.key || 'all'} onClick={() => { setFilterStatus(s.key); setPage(1) }}
              className={`relative border bg-white p-3 text-left transition ${active ? 'border-[#1a73e8] ring-2 ring-[#1a73e8]/15' : 'border-[#dadce0]'}`}>
              {s.badge && (s.badgeValue || 0) > 0 && (
                <span className="absolute -top-2 -right-2 inline-flex h-5 min-w-[20px] items-center justify-center bg-[#d93025] px-1 text-[10px] font-bold text-white">
                  {s.badgeValue}
                </span>
              )}
              <div className="flex items-center gap-2">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center text-white ${s.chip}`}>
                  <Icon size={16} />
                </span>
                <p className={`min-w-0 truncate text-[11px] font-semibold ${active ? 'text-[#1a73e8]' : 'text-[#5f6368]'}`}>{s.label}</p>
              </div>
              <p className="mt-2 text-xl font-bold text-[#202124]">{s.count}</p>
            </button>
          )
        })}
      </div>

      {/* Notifikasi Pembayaran Masuk */}
      {stats.pendingVerifikasi > 0 && (
        <div className="mb-4 flex items-start gap-3 border border-[#fdd663] bg-[#fef7e0] p-4">
          <div className="flex h-8 w-8 items-center justify-center bg-[#feefc3]">
            <Clock size={16} className="text-[#b06000]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#8f4b00]">
              {stats.pendingVerifikasi} pembayaran menunggu verifikasi
            </p>
            <p className="text-xs text-[#b06000] mt-0.5">
              Bukti pembayaran dari siswa perlu segera diverifikasi.
            </p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="mb-4 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#80868b]" />
            <input
              type="text"
              placeholder="Cari nama/email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full border border-[#dadce0] bg-white py-2 pl-9 pr-3 text-sm text-[#3c4043] outline-none transition placeholder:text-[#80868b] focus:border-[#1a73e8]"
            />
          </div>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
            className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]">
            <option value="">Semua Status</option>
            <option value="menunggu_pembayaran">Menunggu Pembayaran</option>
            <option value="menunggu_verifikasi">Menunggu Verifikasi</option>
            <option value="proses">Proses</option>
            <option value="pembayaran_dikonfirmasi">Pembayaran Dikonfirmasi</option>
            <option value="batal">Batal</option>
            <option value="ditangguhkan">Ditangguhkan</option>
          </select>
          <input type="date" value={filterDateFrom} onChange={e => { setFilterDateFrom(e.target.value); setPage(1) }}
            className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]" />
          <input type="date" value={filterDateTo} onChange={e => { setFilterDateTo(e.target.value); setPage(1) }}
            className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]" />
          <select value={filterBatch} onChange={e => { setFilterBatch(e.target.value); setPage(1) }}
            className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]">
            <option value="">Semua Batch</option>
            {batchList.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <button
            onClick={resetFilter}
            className="inline-flex items-center justify-center gap-2 border border-[#dadce0] bg-white px-3 py-2 text-sm font-medium text-[#3c4043] transition hover:bg-[#f8f9fa] focus:outline-none focus:border-[#1a73e8]"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-[#dadce0] bg-white">
        <table className="w-full border-collapse text-left text-sm text-black" style={{ tableLayout: 'fixed', minWidth: '1180px' }}>
          <colgroup>
            <col className="w-[200px]" />
            <col className="w-[120px]" />
            <col className="w-[100px]" />
            <col className="w-[130px]" />
            <col className="w-[110px]" />
            <col className="w-[100px]" />
            <col className="w-[100px]" />
            <col className="w-[80px]" />
            <col className="w-[190px]" />
            <col className="w-[56px]" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3">Nama</th>
              <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3">No. Reg</th>
              <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3">Tgl. Daftar</th>
              <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3">Program</th>
              <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3">Batch</th>
              <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3">Affiliate</th>
              <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 text-right">Nominal</th>
              <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 text-right">Diskon</th>
              <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Status</th>
              <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-[#e8eaed]/70" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-40 bg-[#e8eaed]/70" />
                        <div className="h-2.5 w-24 bg-[#f1f3f4]" />
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : pagedList.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]">
                    <Users size={24} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-[#5f6368]">Tidak ada pendaftar</p>
                </td>
              </tr>
            ) : (
              pagedList.map(p => {
                const affiliateName = p.affiliate_link?.affiliate?.name || p.affiliateLink?.affiliate?.name
                return (
                  <tr key={p.id} className="bg-white transition hover:bg-[#f8f9fa]">
                    <td className="border-b border-[#e8eaed] px-3 py-3">
                      <button onClick={() => setDetailModal(p)} className="flex items-center gap-2 overflow-hidden text-left hover:opacity-80 transition-opacity cursor-pointer w-full">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=e5e7eb&color=6b7280&size=28`}
                          className="h-8 w-8 shrink-0 object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-[#1a73e8] hover:underline">{p.nama}</div>
                          <div className="truncate text-xs font-normal text-black">{p.email}</div>
                          {(p.bank_pengirim || p.bank_asal) && (
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 bg-[#e8f0fe] px-1.5 py-0.5 text-[10px] font-medium text-[#1967d2]">
                                <Landmark size={9} /> {p.bank_pengirim || p.bank_asal}
                              </span>
                              {(p.nama_pengirim || p.nama_rekening) && (
                                <span className="inline-flex items-center gap-1 bg-[#f1f3f4] px-1.5 py-0.5 text-[10px] font-medium text-[#5f6368] truncate max-w-[140px]">
                                  <UserRound size={9} /> {p.nama_pengirim || p.nama_rekening}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </button>
                    </td>
                    <td className="border-b border-[#e8eaed] px-3 py-3 text-sm font-mono font-normal text-black">
                      <span className="block truncate">{p.no_registrasi || <span className="text-[#80868b]">-</span>}</span>
                    </td>
                    <td className="border-b border-[#e8eaed] px-3 py-3 text-sm font-normal text-black whitespace-nowrap">
                      {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="border-b border-[#e8eaed] px-3 py-3 text-sm font-normal text-black">
                      <span className="block truncate" title={p.product?.nama || '-'}>{p.product?.nama || '-'}</span>
                    </td>
                    <td className="border-b border-[#e8eaed] px-3 py-3 text-sm font-normal text-black">
                      {p.batch?.nama_batch ? (
                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-white whitespace-nowrap"
                          style={{ backgroundColor: p.batch.warna || '#3b82f6' }} title={p.batch.nama_batch}>
                          {p.batch.nama_batch}
                        </span>
                      ) : <span className="text-[#80868b]">-</span>}
                    </td>
                    <td className="border-b border-[#e8eaed] px-3 py-3 text-sm font-normal text-black">
                      <span className="block truncate">{affiliateName || <span className="text-[#80868b]">-</span>}</span>
                    </td>
                    <td className="border-b border-[#e8eaed] px-3 py-3 text-right text-sm font-normal text-black whitespace-nowrap">
                      {(() => {
                        const amt = firstAmount(p.detail?.[0])
                        if (amt > 0) return `Rp ${amt.toLocaleString('id-ID')}`
                        if (p.nominal) return `Rp ${Number(p.nominal).toLocaleString('id-ID')}`
                        return '-'
                      })()}
                    </td>
                    <td className="border-b border-[#e8eaed] px-3 py-3 text-right text-sm font-normal text-black whitespace-nowrap">
                      {p.diskon ? `Rp ${Number(p.diskon).toLocaleString('id-ID')}` : <span className="text-[#80868b]">-</span>}
                    </td>
                    <td className="border-b border-[#e8eaed] px-3 py-3 text-center whitespace-nowrap">
                      {(() => { const s = combinedStatus(p); return (<span title={s.label} className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${s.bg}`}><span className="w-1.5 h-1.5 bg-white/90 shrink-0" />{s.label}</span>) })()}
                    </td>
                    <td className="border-b border-[#e8eaed] px-2 py-3">
                      <div className="relative flex justify-center" ref={openActionId === p.id ? actionRef : undefined}>
                        <button
                          onClick={() => setOpenActionId(openActionId === p.id ? null : p.id)}
                          className="border border-[#dadce0] bg-white p-1.5 text-[#5f6368] transition hover:border-[#dadce0] hover:bg-[#f8f9fa] hover:text-[#3c4043]"
                          title="Aksi"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        {openActionId === p.id && (
                          <div className="absolute right-0 top-full z-30 mt-1 w-52 border border-[#dadce0] bg-white py-1">
                            <button onClick={() => { setDetailModal(p); setOpenActionId(null) }}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[#3c4043] hover:bg-[#f8f9fa] transition-colors">
                              <FileText size={14} className="text-[#80868b]" />
                              <span>Detail Lengkap</span>
                            </button>
                            <button onClick={() => { openRiwayat(p.id, p.nama); setOpenActionId(null) }}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[#3c4043] hover:bg-[#f8f9fa] transition-colors">
                              <CreditCard size={14} className="text-[#80868b]" />
                              <span>Riwayat Pembayaran</span>
                            </button>
                            <button onClick={() => { navigate(`/admin-cabang/pendaftar/${p.id}/invoice`); setOpenActionId(null) }}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[#3c4043] hover:bg-[#f8f9fa] transition-colors">
                              <Receipt size={14} className="text-[#80868b]" />
                              <span>Invoice</span>
                            </button>
                            {p.bukti_pembayaran && (
                              <button onClick={() => { setPreviewImg(`${APP_URL}/storage/${p.bukti_pembayaran}`); setOpenActionId(null) }}
                                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[#3c4043] hover:bg-[#f8f9fa] transition-colors">
                                <Eye size={14} className="text-[#80868b]" />
                                <span>Lihat Bukti Bayar</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        <div className="border-t border-[#dadce0] px-4 py-3 text-sm text-[#5f6368]">
          Menampilkan {pagedList.length} dari {filtered.length} pendaftar
        </div>
      </div>

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 border border-[#dadce0] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-[#5f6368]">
            <span>Per halaman</span>
            <select
              value={perPage}
              onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
              className="border border-[#dadce0] bg-white px-2 py-1.5 text-sm font-medium text-[#3c4043] outline-none transition focus:border-[#1a73e8]"
            >
              {[10, 25, 50, 100].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={safePage <= 1}
              className="border border-[#dadce0] bg-white p-1.5 text-[#5f6368] transition hover:bg-[#f8f9fa] disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="border border-[#dadce0] bg-white p-1.5 text-[#5f6368] transition hover:bg-[#f8f9fa] disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft size={16} />
            </button>
            {(() => {
              const pages: (number | '...')[] = []
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i)
              } else {
                pages.push(1)
                if (safePage > 3) pages.push('...')
                const start = Math.max(2, safePage - 1)
                const end = Math.min(totalPages - 1, safePage + 1)
                for (let i = start; i <= end; i++) pages.push(i)
                if (safePage < totalPages - 2) pages.push('...')
                pages.push(totalPages)
              }
              return pages.map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} className="px-1 text-sm text-[#9aa0a6]">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[32px] border px-2 py-1.5 text-sm font-medium transition ${p === safePage ? 'border-[#dadce0] bg-[#202124] text-white' : 'border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f8f9fa]'}`}
                  >
                    {p}
                  </button>
                )
              )
            })()}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="border border-[#dadce0] bg-white p-1.5 text-[#5f6368] transition hover:bg-[#f8f9fa] disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={safePage >= totalPages}
              className="border border-[#dadce0] bg-white p-1.5 text-[#5f6368] transition hover:bg-[#f8f9fa] disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Riwayat Pembayaran Modal */}
      {riwayatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/50 p-4" onClick={() => setRiwayatModal(null)}>
          <div className="w-full max-w-lg bg-white border border-[#dadce0]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#dadce0] px-5 py-3.5">
              <h2 className="text-sm font-semibold text-[#202124]">Riwayat Pembayaran — {riwayatModal.nama}</h2>
              <button onClick={() => setRiwayatModal(null)} className="p-1.5 hover:bg-[#f1f3f4] transition-colors">
                <X size={18} className="text-[#80868b]" />
              </button>
            </div>
            <div className="divide-y divide-[#e8eaed] max-h-80 overflow-y-auto">
              {riwayatLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader size={20} className="animate-spin text-[#80868b]" />
                </div>
              ) : riwayatData.length === 0 ? (
                <div className="py-10 text-center text-sm text-[#80868b]">Belum ada riwayat pembayaran</div>
              ) : (
                riwayatData.map((r: any, i: number) => (
                  <div key={r.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-[#202124]">Pembayaran {riwayatData.length - i}</p>
                      <p className="text-xs text-[#80868b]">
                        {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[#202124]">Rp {fmt(Number(r.jumlah))}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold ${
                        r.status === 'verified' ? 'bg-[#e6f4ea] text-[#137333]' :
                        r.status === 'ditolak' ? 'bg-[#fce8e6] text-[#c5221f]' :
                        'bg-[#fef7e0] text-[#b06000]'
                      }`}>
                        {r.status === 'verified' ? 'Lunas' : r.status === 'ditolak' ? 'Ditolak' : 'Pending'}
                      </span>
                      {r.bukti_pembayaran ? (
                        <a href={`${APP_URL}/storage/${r.bukti_pembayaran}`} target="_blank" rel="noreferrer"
                          className="border border-[#dadce0] p-1.5 text-[#80868b] hover:border-[#aecbfa] hover:text-[#1a73e8] transition-colors">
                          <Eye size={14} />
                        </a>
                      ) : (
                        <span className="border border-[#dadce0] p-1.5 text-[#9aa0a6]">
                          <Eye size={14} />
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-[#dadce0] px-5 py-3 text-center">
              <button onClick={() => setRiwayatModal(null)} className="text-sm text-[#5f6368] hover:text-[#3c4043]">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Bukti */}
      {previewImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPreviewImg(null)}>
          <div className="max-w-lg border border-[#dadce0] bg-white p-2" onClick={e => e.stopPropagation()}>
            <img src={previewImg} alt="Bukti Pembayaran" className="max-h-[70vh] max-w-full" />
            <div className="pb-1 pt-2 text-center">
              <button onClick={() => setPreviewImg(null)} className="text-sm text-[#5f6368] hover:text-[#3c4043]">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Lengkap Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/50 p-4" onClick={() => setDetailModal(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-[#dadce0]" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#dadce0] bg-white px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-[#202124]">Detail Pendaftar</h2>
                <p className="text-xs text-[#80868b]">{detailModal.no_registrasi || 'Belum ada no. registrasi'}</p>
              </div>
              <button onClick={() => setDetailModal(null)} className="p-1.5 hover:bg-[#f1f3f4] transition-colors">
                <X size={18} className="text-[#80868b]" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-5">
              {/* Status */}
              <div className="flex items-center gap-3">
                {(() => { const s = combinedStatus(detailModal); return (<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold ${s.bg}`}>{s.label}</span>) })()}
              </div>

              {/* Data Diri */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#80868b]">Data Diri</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border border-[#dadce0] bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Nama</p>
                    <p className="text-sm font-medium text-[#202124]">{detailModal.nama}</p>
                  </div>
                  <div className="border border-[#dadce0] bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Email</p>
                    <p className="text-sm font-medium text-[#202124]">{detailModal.email}</p>
                  </div>
                  <div className="border border-[#dadce0] bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">No. Registrasi</p>
                    <p className="text-sm font-medium text-[#202124] font-mono">{detailModal.no_registrasi || '-'}</p>
                  </div>
                  <div className="border border-[#dadce0] bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Tanggal Daftar</p>
                    <p className="text-sm font-medium text-[#202124]">{new Date(detailModal.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>

              {/* Kontak */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#80868b]">Kontak</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border border-[#dadce0] bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Telepon</p>
                    <p className="text-sm font-medium text-[#202124]">{detailModal.telepon || '-'}</p>
                  </div>
                  <div className="border border-[#dadce0] bg-[#f8f9fa] p-3 sm:col-span-2">
                    <p className="text-[11px] text-[#80868b]">Alamat</p>
                    <p className="text-sm font-medium text-[#202124]">{detailModal.alamat || '-'}</p>
                  </div>
                  <div className="border border-[#dadce0] bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Provinsi</p>
                    <p className="text-sm font-medium text-[#202124]">{detailModal.provinsi || '-'}</p>
                  </div>
                  <div className="border border-[#dadce0] bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Kabupaten</p>
                    <p className="text-sm font-medium text-[#202124]">{detailModal.kabupaten || '-'}</p>
                  </div>
                  <div className="border border-[#dadce0] bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Kecamatan</p>
                    <p className="text-sm font-medium text-[#202124]">{detailModal.kecamatan || '-'}</p>
                  </div>
                  <div className="border border-[#dadce0] bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Desa</p>
                    <p className="text-sm font-medium text-[#202124]">{detailModal.desa || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Program & Affiliate */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#80868b]">Program & Affiliate</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border border-[#dadce0] bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Program</p>
                    <p className="text-sm font-medium text-[#202124]">{detailModal.product?.nama || '-'}</p>
                  </div>
                  <div className="border border-[#dadce0] bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Batch</p>
                    <p className="text-sm font-medium text-[#202124]">{detailModal.batch?.nama_batch || '-'}</p>
                  </div>
                  <div className="border border-[#dadce0] bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Affiliate</p>
                    <p className="text-sm font-medium text-[#202124]">{detailModal.affiliate_link?.affiliate?.name || detailModal.affiliateLink?.affiliate?.name || '-'}</p>
                  </div>
                  <div className="border border-[#dadce0] bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Kupon</p>
                    <p className="text-sm font-medium text-[#202124]">{detailModal.coupon?.kode || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Pembayaran */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#80868b]">Pembayaran</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div className="border border-[#dadce0] bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Nominal</p>
                    <p className="text-sm font-bold text-[#202124]">
                      {(() => {
                        const amt = firstAmount(detailModal.detail?.[0])
                        if (amt > 0) return `Rp ${amt.toLocaleString('id-ID')}`
                        return detailModal.nominal ? `Rp ${Number(detailModal.nominal).toLocaleString('id-ID')}` : '-'
                      })()}
                    </p>
                  </div>
                  <div className="border border-[#dadce0] bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Diskon</p>
                    <p className="text-sm font-bold text-[#137333]">{detailModal.diskon ? `Rp ${Number(detailModal.diskon).toLocaleString('id-ID')}` : '-'}</p>
                  </div>
                  <div className="border border-[#dadce0] bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Bukti Bayar</p>
                    {detailModal.bukti_pembayaran ? (
                      <a href={`${APP_URL}/storage/${detailModal.bukti_pembayaran}`} target="_blank" rel="noreferrer"
                        className="text-sm font-medium text-[#1a73e8] hover:underline">Lihat Bukti</a>
                    ) : (
                      <p className="text-sm font-medium text-[#202124]">-</p>
                    )}
                  </div>
                </div>
                {detailModal.detail && detailModal.detail.length > 0 && (
                  <div className="border border-[#dadce0] overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="text-left text-xs text-[#5f6368]">
                        <tr>
                          <th className="text-xs font-medium text-[#5f6368] px-3 py-2">Kategori</th>
                          <th className="text-xs font-medium text-[#5f6368] px-3 py-2 text-right">Biaya</th>
                          <th className="text-xs font-medium text-[#5f6368] px-3 py-2 text-right">Dibayar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e8eaed]">
                        {detailModal.detail.map((d, i) => (
                          <tr key={i} className="bg-white">
                            <td className="px-3 py-2 text-[#3c4043]">{d.nama}</td>
                            <td className="px-3 py-2 text-right text-[#3c4043]">Rp {(() => { const tt = Number(d.total_transfer) || 0; const b = Number(d.biaya) || 0; return Number(tt > 0 ? tt : b).toLocaleString('id-ID') })()}</td>
                            <td className="px-3 py-2 text-right text-[#202124] font-semibold">Rp {Number(d.dibayar).toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 border-t border-[#dadce0] bg-white px-6 py-3 text-right">
              <button onClick={() => setDetailModal(null)}
                className="px-4 py-2 text-sm font-medium text-[#5f6368] hover:text-[#3c4043] transition-colors">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
