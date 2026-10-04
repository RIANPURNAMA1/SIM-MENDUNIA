import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FileText, Eye, Trash2, RotateCcw, CreditCard, X, Loader, AlertTriangle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Users, MoreHorizontal, BadgeCheck, Ban, RefreshCw, Clock, CheckCircle2, Banknote, Upload, Receipt, LayoutDashboard, Landmark, UserRound } from 'lucide-react'
import { pendaftarApi, pendaftarApi as apiModule } from '../../services/api'
import api, { APP_URL } from '../../services/api'
import Swal from 'sweetalert2'

function fmt(n: number) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function firstAmount(detail?: { biaya: number; dibayar: number; kode_unik?: number; total_transfer?: number } | null): number {
  if (!detail) return 0
  const totalTransfer = Number(detail.total_transfer) || 0
  const biaya = Number(detail.biaya) || 0
  const kodeUnik = Number(detail.kode_unik) || 0
  return kodeUnik > 0 ? (totalTransfer > 0 ? totalTransfer : biaya) : biaya
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
  product: { nama: string } | null
  user: { id: number; name: string } | null
  batch: { id: number; nama_batch: string } | null
  affiliate_link?: { affiliate: { id: number; name: string; email: string } | null } | null
  coupon?: { kode: string } | null
  bank_pengirim?: string | null
  nama_pengirim?: string | null
  bank_asal?: string | null
  nama_rekening?: string | null
  detail?: { kategori_id: number; kode: string; nama: string; biaya: number; dibayar: number; kode_unik?: number; total_transfer?: number; tanggal_bayar?: string }[]
}

interface ConfirmModal {
  open: boolean
  title: string
  message: string
  type: 'approve' | 'reject' | 'delete'     
  id: number | null
}

export default function Pendaftar() {
  const [data, setData] = useState<PendaftarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  const [serverStats, setServerStats] = useState<Record<string, number> | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('') 
  const [filterBatch, setFilterBatch] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [previewImg, setPreviewImg] = useState<string | null>(null)
  const [riwayatModal, setRiwayatModal] = useState<{ id: number; nama: string } | null>(null)
  const [riwayatData, setRiwayatData] = useState<any[]>([])
  const [riwayatLoading, setRiwayatLoading] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmModal>({ open: false, title: '', message: '', type: 'approve', id: null })
  const [detailModal, setDetailModal] = useState<PendaftarItem | null>(null)
  const [bayarModal, setBayarModal] = useState<{ pendaftarId: number; nama: string; biaya: number } | null>(null)
  const [bayarJumlah, setBayarJumlah] = useState('')
  const [bayarBukti, setBayarBukti] = useState<File | null>(null)
  const [bayarSubmitting, setBayarSubmitting] = useState(false)
  const [bayarError, setBayarError] = useState('')
  const [kategoris, setKategoris] = useState<{ id: number; kode: string; nama: string; urutan: number }[]>([])
  const [batchOptions, setBatchOptions] = useState<{ id: number; nama_batch: string; warna: string | null }[]>([])
  const [showBatchDropdown, setShowBatchDropdown] = useState(false)
  const navigate = useNavigate()
  const batchOptionsRef = useRef(batchOptions)
  const [kategoriItems, setKategoriItems] = useState<Record<number, { kategori_id: number; biaya: number; dibayar: number }[]>>({})
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [openActionId, setOpenActionId] = useState<number | null>(null)
  const actionRef = useRef<HTMLDivElement>(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    const params: Record<string, string> = { per_page: String(perPage), page: String(page) }
    if (search) params.search = search
    if (filterStatus) {
      const statusMap: Record<string, { pembayaran?: string; pendaftaran?: string }> = {
        'menunggu pembayaran': { pembayaran: 'unpaid' },
        'menunggu verifikasi': { pembayaran: 'processing', pendaftaran: 'pending' },
        'proses': { pembayaran: 'processing', pendaftaran: 'disetujui' },
        'pembayaran dikonfirmasi': { pembayaran: 'verified' },
        'batal': { pendaftaran: 'ditolak' },
        'ditangguhkan': { pembayaran: 'ditangguhkan' },
      }
      const st = statusMap[filterStatus.toLowerCase()]
      if (st?.pembayaran) params.status_pembayaran = st.pembayaran
      if (st?.pendaftaran) params.status_pendaftaran = st.pendaftaran
    }
    if (filterBatch) {
      const b = batchOptionsRef.current.find(x => x.nama_batch === filterBatch)
      if (b) params.batch_id = String(b.id)
    }
    if (filterDateFrom) params.date_from = filterDateFrom
    if (filterDateTo) params.date_to = filterDateTo

    Promise.all([
      pendaftarApi.list(params),
      api.get('/biaya-kategori-flat'),
      api.get('/batches'),
    ]).then(([res, katRes, batchRes]) => {
      const serverData = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      const pagination = res.data?.pagination
      setData(serverData)
      setTotalItems(pagination?.total ?? serverData.length)
      setServerStats(res.data?.stats || null)
      setKategoris(katRes.data || [])
      const loadedBatches = batchRes.data?.data || batchRes.data || []
      setBatchOptions(loadedBatches)
      batchOptionsRef.current = loadedBatches
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [perPage, page, search, filterStatus, filterBatch, filterDateFrom, filterDateTo])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    function onFocus() {
      fetchData()
    }
    function onVisibility() {
      if (document.visibilityState === 'visible') fetchData()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [fetchData])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (actionRef.current && !actionRef.current.contains(e.target as Node)) {
        setOpenActionId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function openBayar(p: PendaftarItem) {
    const daftarKat = [...kategoris].sort((a, b) => a.urutan - b.urutan)[0]
    if (!daftarKat) return
    api.get(`/pembayaran-item/${p.id}`).then(res => {
      const items = res.data.items || []
      const daftarItem = items.find((i: any) => i.kategori_id === daftarKat.id)
      const biaya = daftarItem?.biaya || 0
      const dibayar = daftarItem?.dibayar || 0
      const sisa = biaya - dibayar
      setBayarModal({ pendaftarId: p.id, nama: p.nama, biaya: sisa > 0 ? sisa : biaya })
      setBayarJumlah(String(sisa > 0 ? sisa : biaya))
      setBayarBukti(null)
      setBayarError('')
    }).catch(() => {
      setBayarModal({ pendaftarId: p.id, nama: p.nama, biaya: 0 })
      setBayarJumlah('')
      setBayarBukti(null)
      setBayarError('')
    })
  }

  async function handleBayarSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!bayarModal) return
    if (!bayarJumlah || Number(bayarJumlah) <= 0) { setBayarError('Masukkan jumlah'); return }
    if (!bayarBukti) { setBayarError('Upload bukti pembayaran'); return }
    const daftarKat = [...kategoris].sort((a, b) => a.urutan - b.urutan)[0]
    if (!daftarKat) return
    setBayarSubmitting(true)
    setBayarError('')
    try {
      const fd = new FormData()
      fd.append('jumlah', bayarJumlah)
      fd.append('kategori_id', String(daftarKat.id))
      fd.append('bukti_pembayaran', bayarBukti)
      await api.post(`/pendaftar/${bayarModal.pendaftarId}/bayar`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setBayarModal(null)
      fetchData()
    } catch (err: any) {
      setBayarError(err.response?.data?.message || 'Gagal mengirim pembayaran')
    } finally {
      setBayarSubmitting(false)
    }
  }

  function handleApprove(id: number) {
    setConfirm({ open: true, title: 'Setujui Pendaftar', message: 'Setujui pendaftar ini?', type: 'approve', id })
  }

  function handleReject(id: number) {
    setConfirm({ open: true, title: 'Tolak Pendaftar', message: 'Tolak pendaftar ini?', type: 'reject', id })
  }

  function handleVerifyPayment(id: number) {
    pendaftarApi.verifyPayment(id).then(fetchData)
  }

  function handleDelete(id: number) {
    setConfirm({ open: true, title: 'Hapus Pendaftar', message: 'Yakin ingin menghapus pendaftar ini?', type: 'delete', id })
  }

  function executeConfirm() {
    if (!confirm.id) return
    const action = pendaftarApi.destroy(confirm.id)
    action.then(() => {
      Swal.fire({ icon: 'success', title: 'Pendaftar dihapus', confirmButtonColor: '#0E6187', timer: 2000, timerProgressBar: true, showConfirmButton: false })
    }).finally(() => {
      fetchData()
      setConfirm({ open: false, title: '', message: '', type: 'approve', id: null })
    })
  }

  function openRiwayat(id: number, nama: string) {
    setRiwayatModal({ id, nama })
    setRiwayatLoading(true)
    pendaftarApi.riwayatPembayaran(id).then(res => {
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

  function combinedStatus(p: PendaftarItem) {
    if (p.status_pembayaran === 'ditangguhkan') return { bg: 'bg-[#e37400] text-white', label: 'Ditangguhkan' }
    if (p.status_pembayaran === 'verified') return { bg: 'bg-[#137333] text-white', label: 'Pembayaran Dikonfirmasi' }
    if (p.status_pendaftaran === 'ditolak' || p.status_pembayaran === 'ditolak') return { bg: 'bg-[#c5221f] text-white', label: 'Batal' }
    if (p.status_pembayaran === 'processing' && p.status_pendaftaran === 'pending') return { bg: 'bg-[#e37400] text-white', label: 'Menunggu Verifikasi' }
    if (p.status_pembayaran === 'unpaid') return { bg: 'bg-[#9aa0a6] text-white', label: 'Menunggu Pembayaran' }
    return { bg: 'bg-[#0E6187] text-white', label: 'Proses' }
  }

  const filtered = useMemo(() => data, [data])

  const totalPages = Math.max(1, Math.ceil(totalItems / perPage))
  const safePage = Math.min(page, totalPages)
  const pagedList = filtered

  const stats = useMemo(() => {
    const fallback = {
      total: data.length,
      menungguPembayaran: 0,
      pembayaranDiKonfirmasi: 0,
      proses: 0,
      selesai: 0,
      batal: 0,
      ditangguhkan: 0,
      pendingVerifikasi: 0,
    }
    return ({
      ...fallback,
      total: serverStats?.total ?? data.length,
      menungguPembayaran: serverStats?.menungguPembayaran ?? 0,
      pembayaranDiKonfirmasi: serverStats?.pembayaranDiKonfirmasi ?? 0,
      proses: serverStats?.proses ?? 0,
      selesai: serverStats?.selesai ?? 0,
      batal: serverStats?.batal ?? 0,
      ditangguhkan: serverStats?.ditangguhkan ?? 0,
      pendingVerifikasi: serverStats?.pendingVerifikasi ?? 0,
    })
  }, [data, serverStats])

  if (loading && data.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#1a73e8]/10 border-t-[#1a73e8] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-[#5f6368]" aria-label="Breadcrumb">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 transition-colors hover:text-[#1a73e8]"
        >
          <LayoutDashboard size={13} />
          <span>Beranda</span>
        </button>
        <ChevronRight size={12} className="text-[#9aa0a6]" />
        <button
          onClick={() => navigate('/pendaftar')}
          className="transition-colors hover:text-[#1a73e8]"
        >
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
            <p className="text-sm text-[#5f6368]">Kelola pendaftar dari link affiliate</p>
          </div>
        </div>
      </div>

      {/* Status filter buttons */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {([
          { key: '', label: 'Pendaftar', icon: Users, chip: 'bg-[#0E6187]', count: stats.total, badgeValue: 0, badge: false as boolean },
          { key: 'menunggu pembayaran', label: 'Menunggu Bayar', icon: Clock, chip: 'bg-[#5f6368]', count: stats.menungguPembayaran, badgeValue: 0, badge: false },
          { key: 'menunggu verifikasi', label: 'Verifikasi', icon: BadgeCheck, chip: 'bg-[#e37400]', count: stats.pendingVerifikasi, badgeValue: stats.pendingVerifikasi, badge: true },
          { key: 'proses', label: 'Proses', icon: RefreshCw, chip: 'bg-[#0E6187]', count: stats.proses, badgeValue: 0, badge: false },
          { key: 'pembayaran dikonfirmasi', label: 'Dikonfirmasi', icon: CheckCircle2, chip: 'bg-[#137333]', count: stats.selesai, badgeValue: 0, badge: false },
          { key: 'batal', label: 'Batal', icon: Ban, chip: 'bg-[#d93025]', count: stats.batal, badgeValue: 0, badge: false },
          { key: 'ditangguhkan', label: 'Ditangguhkan', icon: Banknote, chip: 'bg-[#e37400]', count: stats.ditangguhkan, badgeValue: 0, badge: false },
        ] as const).map(s => {
          const Icon = s.icon
          const active = (filterStatus || '') === s.key
          return (
            <button key={s.key || 'all'} onClick={() => { setFilterStatus(s.key); setPage(1) }}
              className={`relative border bg-white p-3 text-left transition ${active ? 'border-[#1a73e8] ring-2 ring-[#1a73e8]/15' : 'border-[#dadce0] hover:border-[#dadce0] hover:'}`}>
              {s.badge && (s.badgeValue || 0) > 0 && (
                <span className="absolute -top-2 -right-2 inline-flex h-5 min-w-[20px] items-center justify-center bg-[#d93025] px-1 text-[10px] font-bold text-white ">
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
              className="w-full border border-[#dadce0] bg-white py-2 pl-9 pr-3 text-sm text-[#3c4043] outline-none transition placeholder:text-[#80868b] focus:border-[#1a73e8] focus:border-[#1a73e8]"
            />
          </div>
           <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
             className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]">
             <option value="">Semua Status</option>
             <option value="menunggu pembayaran">Menunggu Pembayaran</option>
              <option value="menunggu verifikasi">Menunggu Verifikasi</option>
              <option value="proses">Proses</option>
              <option value="pembayaran dikonfirmasi">Pembayaran dikonfirmasi</option>
              <option value="batal">Batal</option>
              <option value="ditangguhkan">Ditangguhkan</option>
           </select>
          <input type="date" value={filterDateFrom} onChange={e => { setFilterDateFrom(e.target.value); setPage(1) }}
            className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]" />
          <input type="date" value={filterDateTo} onChange={e => { setFilterDateTo(e.target.value); setPage(1) }}
            className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]" />
          <div className="relative">
            <button onClick={() => setShowBatchDropdown(!showBatchDropdown)}
              className="flex items-center gap-2 border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]">
              {filterBatch ? (() => {
                const b = batchOptions.find(x => x.nama_batch === filterBatch)
                return <>
                  {b?.warna ? <span className="inline-block w-3 h-3 shrink-0" style={{ backgroundColor: b.warna }} /> : null}
                  <span className="truncate">{b?.nama_batch || filterBatch}</span>
                </>
              })() : <span className="text-[#5f6368]">Semua Batch</span>}
            </button>
            {showBatchDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowBatchDropdown(false)} />
                <div className="absolute top-full left-0 mt-1 z-50 border border-[#dadce0] bg-white max-h-48 overflow-y-auto min-w-[180px]">
                  <button onClick={() => { setFilterBatch(''); setShowBatchDropdown(false); setPage(1) }}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition hover:bg-[#f8f9fa] ${!filterBatch ? 'bg-[#e8f0fe] font-semibold' : ''}`}>
                    Semua Batch
                  </button>
                  {batchOptions.map(b => (
                    <button key={b.id} onClick={() => { setFilterBatch(b.nama_batch); setShowBatchDropdown(false); setPage(1) }}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition hover:bg-[#f8f9fa] ${b.nama_batch === filterBatch ? 'bg-[#e8f0fe] font-semibold' : ''}`}>
                      {b.warna ? <span className="inline-block w-3 h-3 shrink-0" style={{ backgroundColor: b.warna }} /> : null}
                      {b.nama_batch}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
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
          <thead className="">
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
              pagedList.map(p => (
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
                    {p.batch?.nama_batch ? (() => {
                      const warna = batchOptions.find(b => b.id === p.batch?.id)?.warna || '#3b82f6'
                      return (
                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-white whitespace-nowrap"
                          style={{ backgroundColor: warna }} title={p.batch?.nama_batch}>
                          {p.batch.nama_batch}
                        </span>
                      )
                    })() : <span className="text-[#80868b]">-</span>}
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-3 text-sm font-normal text-black">
                    <span className="block truncate">{p.affiliate_link?.affiliate?.name || <span className="text-[#80868b]">-</span>}</span>
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-3 text-right text-sm font-normal text-black whitespace-nowrap">
                    {(() => {
                      const firstCategory = p.detail?.[0]
                      const amt = firstAmount(firstCategory)
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
                          <button onClick={() => { navigate(`/pendaftar/${p.id}/invoice`); setOpenActionId(null) }}
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
                          <div className="my-1 border-t border-[#e8eaed]" />
                          <button onClick={() => { handleDelete(p.id); setOpenActionId(null) }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[#c5221f] hover:bg-[#fce8e6] transition-colors">
                            <Trash2 size={14} className="text-[#ee675c]" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="border-t border-[#dadce0] px-4 py-3 text-sm text-[#5f6368]">
          Menampilkan {pagedList.length} dari {totalItems} pendaftar
        </div>
      </div>

      {/* Pagination */}
      {!loading && totalItems > 0 && (
        <div className="mt-4 flex flex-col gap-3 border border-[#dadce0] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-[#5f6368]">
            <span>Per halaman</span>
            <select
              value={perPage}
              onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
              className="border border-[#dadce0] bg-white px-2 py-1.5 text-sm font-medium text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]"
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
                    className={`min-w-[32px] border px-2 py-1.5 text-sm font-medium transition ${ p === safePage ? 'border-[#dadce0] bg-[#202124] text-white' : 'border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f8f9fa]' }`}
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
            <div className="flex items-center justify-between border-b border-[#e8eaed] px-5 py-3.5">
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
                riwayatData.map((r, i) => (
                  <div key={r.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-[#202124]">
                        Pembayaran {riwayatData.length - i}
                      </p>
                      <p className="text-xs text-[#80868b]">
                        {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[#202124]">Rp {fmt(Number(r.jumlah))}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold ${ r.status === 'verified' ? 'bg-[#ceead6] text-[#137333]' : r.status === 'ditolak' ? 'bg-[#f6d7d5] text-[#c5221f]' : 'bg-[#feefc3] text-[#b06000]' }`}>
                        {r.status === 'verified' ? 'Lunas' : r.status === 'ditolak' ? 'Ditolak' : 'Pending'}
                      </span>
                      {r.bukti_pembayaran ? (
                        <a
                          href={`${APP_URL}/storage/${r.bukti_pembayaran}`}
                          target="_blank"
                          rel="noreferrer"
                          className="border border-[#dadce0] p-1.5 text-[#80868b] hover:border-[#aecbfa] hover:text-[#1a73e8] transition-colors"
                        >
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
            <div className="border-t border-[#e8eaed] px-5 py-3 text-center">
              <button onClick={() => setRiwayatModal(null)} className="text-sm text-[#5f6368] hover:text-[#3c4043]">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/50 p-4" onClick={() => setConfirm({ ...confirm, open: false })}>
          <div className="w-full max-w-sm border border-[#dadce0] bg-white p-6 shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)]" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center bg-[#feefc3]">
                <AlertTriangle size={24} className="text-[#b06000]" />
              </div>
              <h3 className="text-base font-semibold text-[#202124]">{confirm.title}</h3>
              <p className="mt-1 text-sm text-[#5f6368]">{confirm.message}</p>
            </div>
            <div className="mt-5 flex justify-center gap-3">
              <button onClick={() => setConfirm({ ...confirm, open: false })}
                className="border border-[#dadce0] bg-white px-4 py-2 text-sm font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]">
                Batal
              </button>
              <button onClick={executeConfirm}
                className={`px-4 py-2 text-sm font-medium text-white transition ${ confirm.type === 'approve' ? 'bg-[#0E6187] hover:bg-[#084c63]' : confirm.type === 'delete' ? 'bg-[#c5221f] hover:bg-[#a50e0e]' : 'bg-[#5f6368] hover:bg-[#3c4043]' }`}>
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Bukti */}
      {previewImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/50 p-4" onClick={() => setPreviewImg(null)}>
          <div className="max-w-lg border border-[#dadce0] bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)]" onClick={e => e.stopPropagation()}>
            <img src={previewImg} alt="Bukti Pembayaran" className="max-h-[70vh] max-w-full" />
            <div className="pb-1 pt-2 text-center">
              <button onClick={() => setPreviewImg(null)} className="text-sm text-[#5f6368] hover:text-[#3c4043]">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bayar Pendaftaran */}
      {bayarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/50 p-4" onClick={() => setBayarModal(null)}>
          <div className="w-full max-w-md bg-white border border-[#dadce0] p-6" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#202124]">Bayar Pendaftaran</h2>
                <p className="text-xs text-[#5f6368]">{bayarModal.nama}</p>
              </div>
              <button onClick={() => setBayarModal(null)} className="p-1.5 hover:bg-[#f1f3f4] transition-colors">
                <X size={20} className="text-[#5f6368]" />
              </button>
            </div>

            {bayarError && (
              <div className="mb-4 p-3 bg-[#fce8e6] border border-[#f6aea9] text-sm text-[#c5221f]">{bayarError}</div>
            )}

            <form onSubmit={handleBayarSubmit} className="space-y-4">
              <div className="bg-[#f8f9fa] p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#5f6368]">Kategori</span>
                  <span className="font-semibold text-[#202124]">Pendaftaran</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#5f6368]">Biaya</span>
                  <span className="font-semibold text-[#202124]">Rp {bayarModal.biaya.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3c4043] mb-1">Jumlah Pembayaran</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={bayarModal.biaya}
                  value={bayarJumlah}
                  onChange={e => setBayarJumlah(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#dadce0] focus:border-[#1a73e8] focus:border-[#1a73e8] outline-none transition-colors text-sm"
                  placeholder="Masukkan jumlah"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3c4043] mb-1">Upload Bukti Pembayaran</label>
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-[#dadce0] cursor-pointer bg-[#f8f9fa] hover:bg-white hover:border-[#1a73e8] transition-colors">
                  {bayarBukti ? (
                    <div className="flex flex-col items-center">
                      <Upload className="w-6 h-6 text-[#1a73e8]" />
                      <p className="text-xs text-[#5f6368] mt-1 font-medium">{bayarBukti.name}</p>
                      <p className="text-[10px] text-[#80868b]">Klik untuk ganti</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-6 h-6 text-[#80868b]" />
                      <p className="text-xs text-[#5f6368] mt-1 font-medium">Klik untuk upload</p>
                      <p className="text-[10px] text-[#80868b]">.JPG, .PNG, atau .PDF</p>
                    </div>
                  )}
                  <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={e => setBayarBukti(e.target.files?.[0] || null)} />
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setBayarModal(null)}
                  className="px-5 py-2.5 border border-[#dadce0] text-[#3c4043] text-sm font-semibold hover:bg-[#f8f9fa] transition-colors">Batal</button>
                <button type="submit" disabled={bayarSubmitting}
                  className="px-6 py-2.5 bg-[#0E6187] text-white text-sm font-semibold hover:bg-[#1a5e6f] transition-colors disabled:opacity-70 inline-flex items-center gap-2">
                  {bayarSubmitting ? <><span className="animate-spin">&#9696;</span> Mengirim</> : 'Kirim Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Lengkap Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/50 p-4" onClick={() => setDetailModal(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-[#dadce0]" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e8eaed] bg-white px-6 py-4">
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
                {(() => { const s = combinedStatus(detailModal); return (<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${s.bg}`}><span className="w-1.5 h-1.5 bg-white/90 shrink-0" />{s.label}</span>) })()}
              </div>

              {/* Data Diri */}
              <div>
                <h3 className="mb-2 text-xs font-semibold r text-[#80868b]">Data Diri</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Nama</p>
                    <p className="text-sm font-medium text-[#202124]">{detailModal.nama}</p>
                  </div>
                  <div className="bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Email</p>
                    <p className="text-sm font-medium text-[#202124]">{detailModal.email}</p>
                  </div>
                  <div className="bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">No. Registrasi</p>
                    <p className="text-sm font-medium text-[#202124] font-mono">{detailModal.no_registrasi || '-'}</p>
                  </div>
                  <div className="bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Tanggal Daftar</p>
                    <p className="text-sm font-medium text-[#202124]">{new Date(detailModal.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>

              {/* Kontak */}
              <div>
                <h3 className="mb-2 text-xs font-semibold r text-[#80868b]">Kontak</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Telepon</p>
                    <p className="text-sm font-medium text-[#202124]">{detailModal.telepon || '-'}</p>
                  </div>
                  <div className="bg-[#f8f9fa] p-3 sm:col-span-2">
                    <p className="text-[11px] text-[#80868b]">Alamat</p>
                    <p className="text-sm font-medium text-[#202124]">{detailModal.alamat || '-'}</p>
                  </div>
                  <div className="bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Provinsi</p>
                    <p className="text-sm font-medium text-[#202124]">{detailModal.provinsi || '-'}</p>
                  </div>
                  <div className="bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Kabupaten</p>
                    <p className="text-sm font-medium text-[#202124]">{detailModal.kabupaten || '-'}</p>
                  </div>
                  <div className="bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Kecamatan</p>
                    <p className="text-sm font-medium text-[#202124]">{detailModal.kecamatan || '-'}</p>
                  </div>
                  <div className="bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Desa</p>
                    <p className="text-sm font-medium text-[#202124]">{detailModal.desa || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Program & Affiliate */}
              <div>
                <h3 className="mb-2 text-xs font-semibold r text-[#80868b]">Program & Affiliate</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Program</p>
                    <p className="text-sm font-medium text-[#202124]">{detailModal.product?.nama || '-'}</p>
                  </div>
                  <div className="bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Batch</p>
                    <p className="text-sm font-medium text-[#202124]">{detailModal.batch?.nama_batch || '-'}</p>
                  </div>
                  <div className="bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Affiliate</p>
                    <p className="text-sm font-medium text-[#202124]">{detailModal.affiliate_link?.affiliate?.name || '-'}</p>
                  </div>
                  <div className="bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Kupon</p>
                    <p className="text-sm font-medium text-[#202124]">{detailModal.coupon?.kode || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Pembayaran */}
              <div>
                <h3 className="mb-2 text-xs font-semibold r text-[#80868b]">Pembayaran</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div className="bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Nominal</p>
                    <p className="text-sm font-bold text-[#202124]">
                      {(() => {
                        const firstCategory = detailModal.detail?.[0]
                        const amt = firstAmount(firstCategory)
                        if (amt > 0) return `Rp ${amt.toLocaleString('id-ID')}`
                        return detailModal.nominal ? `Rp ${Number(detailModal.nominal).toLocaleString('id-ID')}` : '-'
                      })()}
                    </p>
                  </div>
                  <div className="bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Diskon</p>
                    <p className="text-sm font-bold text-[#137333]">{detailModal.diskon ? `Rp ${Number(detailModal.diskon).toLocaleString('id-ID')}` : '-'}</p>
                  </div>
                  <div className="bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Bukti Bayar</p>
                    {detailModal.bukti_pembayaran ? (
                      <a href={`${APP_URL}/storage/${detailModal.bukti_pembayaran}`} target="_blank" rel="noreferrer"
                        className="text-sm font-medium text-[#1a73e8] hover:underline">Lihat Bukti</a>
                    ) : (
                      <p className="text-sm font-medium text-[#202124]">-</p>
                    )}
                  </div>
                  <div className="bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Nama Pengirim</p>
                    <p className="text-sm font-medium text-[#202124]">{detailModal.nama_pengirim || detailModal.nama_rekening || '-'}</p>
                  </div>
                  <div className="bg-[#f8f9fa] p-3">
                    <p className="text-[11px] text-[#80868b]">Bank Pengirim</p>
                    <p className="text-sm font-medium text-[#202124]">{detailModal.bank_pengirim || detailModal.bank_asal || '-'}</p>
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

              {/* Ubah Status */}
              <div>
                <h3 className="mb-3 text-xs font-semibold r text-[#80868b]">Ubah Status</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { val: 'waiting_payment', label: 'Menunggu Pembayaran', icon: Clock, iconColor: 'text-white', bg: 'bg-[#5f6368] hover:bg-[#3c4043] border-[#80868b]' },
                    { val: 'confirmed', label: 'Menunggu Verifikasi', icon: BadgeCheck, iconColor: 'text-white', bg: 'bg-[#e37400] hover:bg-[#b06000] border-[#e37400]' },
                    { val: 'proses', label: 'Proses', icon: RefreshCw, iconColor: 'text-white', bg: 'bg-[#0E6187] hover:bg-[#0a4d6b] border-[#1a73e8]' },
                    { val: 'selesai', label: 'Pembayaran dikonfirmasi', icon: CheckCircle2, iconColor: 'text-white', bg: 'bg-[#137333] hover:bg-[#137333] border-[#137333]' },
                    { val: 'batal', label: 'Batal', icon: Ban, iconColor: 'text-white', bg: 'bg-[#d93025] hover:bg-[#c5221f] border-[#d93025]' },
                    { val: 'ditangguhkan', label: 'Ditangguhkan', icon: Banknote, iconColor: 'text-white', bg: 'bg-[#e37400] hover:bg-[#b06000] border-[#e37400]' },
                  ].map(opt => {
                    const statusMap: Record<string, Record<string, string>> = {
                      waiting_payment: { status_pembayaran: 'unpaid', status_pendaftaran: 'pending' },
                      confirmed: { status_pembayaran: 'processing', status_pendaftaran: 'pending' },
                      proses: { status_pembayaran: 'processing', status_pendaftaran: 'disetujui' },
                      selesai: { status_pembayaran: 'verified', status_pendaftaran: 'disetujui' },
                      batal: { status_pembayaran: 'ditolak', status_pendaftaran: 'ditolak' },
                      ditangguhkan: { status_pembayaran: 'ditangguhkan', status_pendaftaran: 'pending' },
                    }
                    const current = combinedStatus(detailModal)
                    const isActive = (
                      (opt.val === 'waiting_payment' && current.label === 'Menunggu Pembayaran') ||
                      (opt.val === 'confirmed' && current.label === 'Menunggu Verifikasi') ||
                      (opt.val === 'proses' && current.label === 'Proses') ||
                      (opt.val === 'selesai' && current.label === 'Pembayaran dikonfirmasi') ||
                      (opt.val === 'batal' && current.label === 'Batal') ||
                      (opt.val === 'ditangguhkan' && current.label === 'Ditangguhkan')
                    )
                    const confirmMessages: Record<string, { title: string; text: string; confirmText: string; icon: 'warning' | 'info' | 'question' }> = {
                      waiting_payment: { title: 'Ubah ke Menunggu Pembayaran?', text: `Status pembayaran ${detailModal.nama} akan diubah menjadi "Menunggu Pembayaran".`, confirmText: 'Ya, Ubah', icon: 'info' },
                      confirmed: { title: 'Konfirmasi Pembayaran?', text: `Bukti bayar ${detailModal.nama} akan ditandai sebagai "Menunggu Verifikasi".`, confirmText: 'Ya, Verifikasi', icon: 'warning' },
                      proses: { title: 'Mulai Proses?', text: `Pendaftaran ${detailModal.nama} akan diproses lebih lanjut.`, confirmText: 'Ya, Proses', icon: 'question' },
                      selesai: { title: 'Konfirmasi Pembayaran?', text: `Pembayaran ${detailModal.nama} akan ditandai sebagai "Pembayaran dikonfirmasi".`, confirmText: 'Ya, Konfirmasi', icon: 'question' },
                      batal: { title: 'Batalkan Pendaftaran?', text: `Pendaftaran ${detailModal.nama} akan dibatalkan. Tindakan ini tidak dapat dibatalkan.`, confirmText: 'Ya, Batalkan', icon: 'warning' },
                      ditangguhkan: { title: 'Tangguhkan Pendaftaran?', text: `Pendaftaran ${detailModal.nama} akan ditangguhkan (uang belum masuk).`, confirmText: 'Ya, Tangguhkan', icon: 'warning' },
                    }
                    const Icon = opt.icon
                    return (
                      <button key={opt.val}
                        onClick={async () => {
                          const target = statusMap[opt.val]
                          const msg = confirmMessages[opt.val]
                          if (!target || !msg) return
                          const result = await Swal.fire({
                            icon: msg.icon,
                            title: msg.title,
                            text: msg.text,
                            showCancelButton: true,
                            confirmButtonColor: '#0E6187',
                            cancelButtonColor: '#6b7280',
                            confirmButtonText: msg.confirmText,
                            cancelButtonText: 'Batal',
                          })
                          if (!result.isConfirmed) return
                          try {
                            Swal.fire({
                              title: 'Menyimpan...',
                              text: 'Mohon tunggu, sedang memperbarui status.',
                              allowOutsideClick: false,
                              didOpen: () => Swal.showLoading(),
                            })
                            await pendaftarApi.updateStatus(detailModal.id, target)
                            setDetailModal(prev => prev ? { ...prev, ...target } : prev)
                            setData(prev => prev.map(item => item.id === detailModal.id ? { ...item, ...target } : item))
                            Swal.close()
                            Swal.fire({ icon: 'success', title: 'Status diperbarui', timer: 1200, showConfirmButton: false })
                          } catch {
                            Swal.close()
                            Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal memperbarui status' })
                          }
                        }}
                        disabled={isActive}
                        className={`flex items-center gap-2 border px-3 py-2.5 text-left text-sm font-medium transition ${opt.bg} ${isActive ? 'ring-2 ring-offset-1 ring-[#1a73e8] opacity-100 cursor-default' : 'cursor-pointer'}`}
                      >
                        <Icon size={15} className={opt.iconColor} />
                        <span className="text-white">{opt.label}</span>
                      </button>
                    )
                  })}
                </div>
                <div className="mt-3">
                  <button
                    onClick={async () => {
                      const result = await Swal.fire({
                        icon: 'warning',
                        title: 'Hapus Pendaftar?',
                        text: `Data ${detailModal.nama} akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`,
                        showCancelButton: true,
                        confirmButtonColor: '#dc2626',
                        cancelButtonColor: '#6b7280',
                        confirmButtonText: 'Ya, Hapus',
                        cancelButtonText: 'Batal',
                      })
                      if (!result.isConfirmed) return
                      const id = detailModal.id
                      setDetailModal(null)
                      handleDelete(id)
                    }}
                    className="flex w-full items-center justify-center gap-2 border border-[#f6aea9] bg-[#fce8e6] px-3 py-2.5 text-sm font-medium text-[#c5221f] transition hover:bg-[#f6d7d5]"
                  >
                    <Trash2 size={15} />
                    <span>Hapus Pendaftar</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 border-t border-[#e8eaed] bg-white px-6 py-3 text-right">
              <button onClick={() => setDetailModal(null)}
                className="px-4 py-2 text-sm font-medium text-[#5f6368] hover:text-[#202124] transition-colors">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}