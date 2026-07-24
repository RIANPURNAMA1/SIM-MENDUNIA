import { useState, useEffect, useMemo, useRef } from 'react'
import { Search, FileText, Eye, Trash2, RotateCcw, CreditCard, X, Loader, AlertTriangle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Users, MoreHorizontal, BadgeCheck, Ban, RefreshCw, Clock, CheckCircle2, Banknote, Upload } from 'lucide-react'
import { pendaftarApi, pendaftarApi as apiModule } from '../../services/api'
import api, { APP_URL } from '../../services/api'
import Swal from 'sweetalert2'

function fmt(n: number) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
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
  const [kategoriItems, setKategoriItems] = useState<Record<number, { kategori_id: number; biaya: number; dibayar: number }[]>>({})
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
    Promise.all([
      pendaftarApi.list({}),
      api.get('/biaya-kategori-flat'),
    ]).then(([res, katRes]) => {
      setData(res.data)
      setKategoris(katRes.data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }

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
    if (p.status_pembayaran === 'refund') return { bg: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Refund' }
    if (p.status_pembayaran === 'verified') return { bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Selesai' }
    if (p.status_pendaftaran === 'ditolak' || p.status_pembayaran === 'ditolak') return { bg: 'bg-red-100 text-red-700 border-red-200', label: 'Batal' }
    if (p.status_pembayaran === 'processing' && p.status_pendaftaran === 'pending') return { bg: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Pembayaran di Konfirmasi' }
    if (p.status_pembayaran === 'unpaid') return { bg: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Menunggu Pembayaran' }
    return { bg: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Proses' }
  }

  const filtered = useMemo(() => {
    return data.filter(p => {
      const matchSearch = !search || p.nama.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase())
      const cs = combinedStatus(p).label.toLowerCase()
      const matchStatus = !filterStatus || cs === filterStatus.toLowerCase()
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage = Math.min(page, totalPages)
  const pagedList = filtered.slice((safePage - 1) * perPage, safePage * perPage)

  const batchList = useMemo(() => {
    const set = new Set<string>()
    data.forEach(p => { if (p.batch?.nama_batch) set.add(p.batch.nama_batch) })
    return Array.from(set).sort()
  }, [data])

  const stats = useMemo(() => ({
    total: data.length,
    proses: data.filter(p => p.status_pembayaran === 'unpaid' || p.status_pembayaran === 'processing').length,
    selesai: data.filter(p => p.status_pembayaran === 'verified').length,
    batal: data.filter(p => p.status_pendaftaran === 'ditolak' && p.status_pembayaran !== 'refund').length,
    refund: data.filter(p => p.status_pembayaran === 'refund').length,
  }), [data])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] text-white border border-blue-100">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Pendaftaran</h1>
            <p className="text-sm text-slate-500">Kelola pendaftar dari link affiliate</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Proses', value: stats.proses },
          { label: 'Selesai', value: stats.selesai },
          { label: 'Batal', value: stats.batal },
          { label: 'Refund', value: stats.refund },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            <p className="text-lg font-bold text-slate-800">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="mb-4 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama/email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            <option value="">Semua Status</option>
            <option value="proses">Proses</option>
            <option value="selesai">Selesai</option>
            <option value="batal">Batal</option>
            <option value="refund">Refund</option>
          </select>
          <input type="date" value={filterDateFrom} onChange={e => { setFilterDateFrom(e.target.value); setPage(1) }}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          <input type="date" value={filterDateTo} onChange={e => { setFilterDateTo(e.target.value); setPage(1) }}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          <select value={filterBatch} onChange={e => { setFilterBatch(e.target.value); setPage(1) }}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            <option value="">Semua Batch</option>
            {batchList.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
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
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm text-black" style={{ tableLayout: 'fixed', minWidth: '900px' }}>
          <colgroup>
            <col className="w-[220px]" />
            <col className="w-[130px]" />
            <col className="w-[100px]" />
            <col className="w-[150px]" />
            <col className="w-[140px]" />
            <col className="w-[100px]" />
            <col className="w-[100px]" />
            <col className="w-[90px]" />
            <col className="w-[90px]" />
            <col className="w-[50px]" />
          </colgroup>
          <thead className="bg-[#0e6187]">
            <tr>
              <th scope="col" className="border border-slate-600 px-4 py-3 font-semibold text-white">Nama</th>
              <th scope="col" className="border border-slate-600 px-4 py-3 font-semibold text-white">No. Reg</th>
              <th scope="col" className="border border-slate-600 px-4 py-3 font-semibold text-white">Tgl. Daftar</th>
              <th scope="col" className="border border-slate-600 px-4 py-3 font-semibold text-white">Program</th>
              <th scope="col" className="border border-slate-600 px-4 py-3 font-semibold text-white">Batch</th>
              <th scope="col" className="border border-slate-600 px-4 py-3 font-semibold text-white">Affiliate</th>
              <th scope="col" className="border border-slate-600 px-4 py-3 text-right font-semibold text-white">Nominal</th>
              <th scope="col" className="border border-slate-600 px-4 py-3 text-right font-semibold text-white">Diskon</th>
              <th scope="col" className="border border-slate-600 px-4 py-3 text-center font-semibold text-white">Status</th>
              <th scope="col" className="border border-slate-600 px-4 py-3 text-center font-semibold text-white">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={10} className="border border-slate-200 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-200/70" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-40 rounded bg-slate-200/70" />
                        <div className="h-2.5 w-24 rounded bg-slate-100" />
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : pagedList.length === 0 ? (
              <tr>
                <td colSpan={10} className="border border-slate-200 px-6 py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Users size={24} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-600">Tidak ada pendaftar</p>
                </td>
              </tr>
            ) : (
              pagedList.map(p => (
                <tr key={p.id} className="bg-white transition hover:bg-slate-50">
                  <td className="border border-slate-200 px-3 py-3">
                    <button onClick={() => setDetailModal(p)} className="flex items-center gap-2 overflow-hidden text-left hover:opacity-80 transition-opacity cursor-pointer w-full">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=e5e7eb&color=6b7280&size=28`}
                        className="h-8 w-8 shrink-0 rounded-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-[#0E6187] hover:underline">{p.nama}</div>
                        <div className="truncate text-xs font-normal text-black">{p.email}</div>
                      </div>
                    </button>
                  </td>
                  <td className="border border-slate-200 px-3 py-3 text-sm font-mono font-normal text-black">
                    <span className="block truncate">{p.no_registrasi || <span className="text-gray-400">-</span>}</span>
                  </td>
                  <td className="border border-slate-200 px-3 py-3 text-sm font-normal text-black whitespace-nowrap">
                    {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="border border-slate-200 px-3 py-3 text-sm font-normal text-black">
                    <span className="block truncate" title={p.product?.nama || '-'}>{p.product?.nama || '-'}</span>
                  </td>
                  <td className="border border-slate-200 px-3 py-3 text-sm font-normal text-black">
                    <span className="block truncate" title={p.batch?.nama_batch || '-'}>{p.batch?.nama_batch || '-'}</span>
                  </td>
                  <td className="border border-slate-200 px-3 py-3 text-sm font-normal text-black">
                    <span className="block truncate">{p.affiliate_link?.affiliate?.name || <span className="text-gray-400">-</span>}</span>
                  </td>
                  <td className="border border-slate-200 px-3 py-3 text-right text-sm font-normal text-black whitespace-nowrap">
                    {(() => {
                      const firstCategory = p.detail?.[0]
                      if (firstCategory) {
                        if (firstCategory.dibayar > 0) return `Rp ${Number(firstCategory.total_transfer || firstCategory.dibayar).toLocaleString('id-ID')}`
                        return `Rp ${Number(firstCategory.biaya).toLocaleString('id-ID')}`
                      }
                      if (p.nominal) return `Rp ${Number(p.nominal).toLocaleString('id-ID')}`
                      return '-'
                    })()}
                  </td>
                  <td className="border border-slate-200 px-3 py-3 text-right text-sm font-normal text-black whitespace-nowrap">
                    {p.diskon ? `Rp ${Number(p.diskon).toLocaleString('id-ID')}` : <span className="text-gray-400">-</span>}
                  </td>
                  <td className="border border-slate-200 px-3 py-3 text-center">
                    {(() => { const s = combinedStatus(p); return (<span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium shadow-sm ${s.bg}`}>{s.label}</span>) })()}
                  </td>
                  <td className="border border-slate-200 px-2 py-3">
                    <div className="relative flex justify-center" ref={openActionId === p.id ? actionRef : undefined}>
                      <button
                        onClick={() => setOpenActionId(openActionId === p.id ? null : p.id)}
                        className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                        title="Aksi"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      {openActionId === p.id && (
                        <div className="absolute right-0 top-full z-30 mt-1 w-52 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                          <button onClick={() => { setDetailModal(p); setOpenActionId(null) }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                            <FileText size={14} className="text-slate-400" />
                            <span>Detail Lengkap</span>
                          </button>
                          <button onClick={() => { openRiwayat(p.id, p.nama); setOpenActionId(null) }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                            <CreditCard size={14} className="text-slate-400" />
                            <span>Riwayat Pembayaran</span>
                          </button>
                          {p.bukti_pembayaran && (
                            <button onClick={() => { setPreviewImg(`${APP_URL}/storage/${p.bukti_pembayaran}`); setOpenActionId(null) }}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                              <Eye size={14} className="text-slate-400" />
                              <span>Lihat Bukti Bayar</span>
                            </button>
                          )}
                          <div className="my-1 border-t border-slate-100" />
                          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Ubah Status</p>
                          {[
                            { val: 'waiting_payment', label: 'Menunggu Pembayaran', icon: Clock, iconColor: 'text-slate-400' },
                            { val: 'confirmed', label: 'Pembayaran dikonfirmasi', icon: BadgeCheck, iconColor: 'text-amber-400' },
                            { val: 'proses', label: 'Proses', icon: RefreshCw, iconColor: 'text-blue-400' },
                            { val: 'selesai', label: 'Selesai', icon: CheckCircle2, iconColor: 'text-emerald-400' },
                            { val: 'batal', label: 'Batal', icon: Ban, iconColor: 'text-red-400' },
                            { val: 'refund', label: 'Refund', icon: Banknote, iconColor: 'text-purple-400' },
                          ].map(opt => {
                            const statusMap: Record<string, Record<string, string>> = {
                              waiting_payment: { status_pembayaran: 'unpaid', status_pendaftaran: 'pending' },
                              confirmed: { status_pembayaran: 'processing', status_pendaftaran: 'pending' },
                              proses: { status_pembayaran: 'processing', status_pendaftaran: 'disetujui' },
                              selesai: { status_pembayaran: 'verified', status_pendaftaran: 'disetujui' },
                              batal: { status_pembayaran: 'ditolak', status_pendaftaran: 'ditolak' },
                              refund: { status_pembayaran: 'refund', status_pendaftaran: 'ditolak' },
                            }
                            const Icon = opt.icon
                            return (
                              <button key={opt.val}
                                onClick={async () => {
                                  setOpenActionId(null)
                                  const target = statusMap[opt.val]
                                  if (!target) return
                                  try {
                                    await pendaftarApi.updateStatus(p.id, target)
                                    setData(prev => prev.map(item => item.id === p.id ? { ...item, ...target } : item))
                                    Swal.fire({ icon: 'success', title: 'Berhasil', timer: 1200, showConfirmButton: false })
                                  } catch {
                                    Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal memperbarui status' })
                                  }
                                }}
                                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <Icon size={14} className={opt.iconColor} />
                                <span>{opt.label}</span>
                              </button>
                            )
                          })}
                          <div className="my-1 border-t border-slate-100" />
                          <button onClick={() => { handleDelete(p.id); setOpenActionId(null) }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors">
                            <Trash2 size={14} className="text-red-400" />
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
        <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
          Menampilkan {pagedList.length} dari {filtered.length} pendaftar
        </div>
      </div>

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>Per halaman</span>
            <select
              value={perPage}
              onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
              className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
              className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
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
                  <span key={`dots-${i}`} className="px-1 text-sm text-slate-300">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[32px] rounded-md border px-2 py-1.5 text-sm font-medium transition ${
                      p === safePage
                        ? 'border-slate-200 bg-slate-800 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              )
            })()}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={safePage >= totalPages}
              className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Riwayat Pembayaran Modal */}
      {riwayatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setRiwayatModal(null)}>
          <div className="w-full max-w-lg rounded-xl bg-white border border-gray-200 shadow-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-gray-800">Riwayat Pembayaran — {riwayatModal.nama}</h2>
              <button onClick={() => setRiwayatModal(null)} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors">
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {riwayatLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader size={20} className="animate-spin text-gray-400" />
                </div>
              ) : riwayatData.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">Belum ada riwayat pembayaran</div>
              ) : (
                riwayatData.map((r, i) => (
                  <div key={r.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Pembayaran {riwayatData.length - i}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-900">Rp {fmt(Number(r.jumlah))}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        r.status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                        r.status === 'ditolak' ? 'bg-red-100 text-red-600' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {r.status === 'verified' ? 'Lunas' : r.status === 'ditolak' ? 'Ditolak' : 'Pending'}
                      </span>
                      {r.bukti_pembayaran ? (
                        <a
                          href={`${APP_URL}/storage/${r.bukti_pembayaran}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:border-blue-200 hover:text-blue-600 transition-colors"
                        >
                          <Eye size={14} />
                        </a>
                      ) : (
                        <span className="rounded-lg border border-gray-200 p-1.5 text-gray-300">
                          <Eye size={14} />
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-gray-100 px-5 py-3 text-center">
              <button onClick={() => setRiwayatModal(null)} className="text-sm text-gray-500 hover:text-gray-700">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirm({ ...confirm, open: false })}>
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle size={24} className="text-amber-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">{confirm.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{confirm.message}</p>
            </div>
            <div className="mt-5 flex justify-center gap-3">
              <button onClick={() => setConfirm({ ...confirm, open: false })}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                Batal
              </button>
              <button onClick={executeConfirm}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
                  confirm.type === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  confirm.type === 'delete' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-slate-600 hover:bg-slate-700'
                }`}>
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Bukti */}
      {previewImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPreviewImg(null)}>
          <div className="max-w-lg rounded-xl bg-white p-2 shadow-xl" onClick={e => e.stopPropagation()}>
            <img src={previewImg} alt="Bukti Pembayaran" className="max-h-[70vh] max-w-full rounded-lg" />
            <div className="pb-1 pt-2 text-center">
              <button onClick={() => setPreviewImg(null)} className="text-sm text-slate-500 hover:text-slate-700">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bayar Pendaftaran */}
      {bayarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setBayarModal(null)}>
          <div className="w-full max-w-md rounded-xl bg-white border border-gray-200 shadow-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Bayar Pendaftaran</h2>
                <p className="text-xs text-gray-500">{bayarModal.nama}</p>
              </div>
              <button onClick={() => setBayarModal(null)} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {bayarError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{bayarError}</div>
            )}

            <form onSubmit={handleBayarSubmit} className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Kategori</span>
                  <span className="font-semibold text-gray-900">Pendaftaran</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Biaya</span>
                  <span className="font-semibold text-gray-900">Rp {bayarModal.biaya.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Pembayaran</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={bayarModal.biaya}
                  value={bayarJumlah}
                  onChange={e => setBayarJumlah(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0E6187] focus:border-[#0E6187] outline-none transition-colors text-sm"
                  placeholder="Masukkan jumlah"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Bukti Pembayaran</label>
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-white hover:border-[#0E6187] transition-colors">
                  {bayarBukti ? (
                    <div className="flex flex-col items-center">
                      <Upload className="w-6 h-6 text-[#0E6187]" />
                      <p className="text-xs text-gray-600 mt-1 font-medium">{bayarBukti.name}</p>
                      <p className="text-[10px] text-gray-400">Klik untuk ganti</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-6 h-6 text-gray-400" />
                      <p className="text-xs text-gray-500 mt-1 font-medium">Klik untuk upload</p>
                      <p className="text-[10px] text-gray-400">.JPG, .PNG, atau .PDF</p>
                    </div>
                  )}
                  <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={e => setBayarBukti(e.target.files?.[0] || null)} />
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setBayarModal(null)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50 transition-colors">Batal</button>
                <button type="submit" disabled={bayarSubmitting}
                  className="px-6 py-2.5 bg-[#0E6187] text-white rounded-md text-sm font-semibold hover:bg-[#1a5e6f] transition-colors disabled:opacity-70 inline-flex items-center gap-2">
                  {bayarSubmitting ? <><span className="animate-spin">&#9696;</span> Mengirim</> : 'Kirim Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Lengkap Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDetailModal(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white border border-gray-200 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Detail Pendaftar</h2>
                <p className="text-xs text-gray-400">{detailModal.no_registrasi || 'Belum ada no. registrasi'}</p>
              </div>
              <button onClick={() => setDetailModal(null)} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-5">
              {/* Status */}
              <div className="flex items-center gap-3">
                {(() => { const s = combinedStatus(detailModal); return (<span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium shadow-sm ${s.bg}`}>{s.label}</span>) })()}
              </div>

              {/* Data Diri */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Data Diri</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[11px] text-gray-400">Nama</p>
                    <p className="text-sm font-medium text-gray-800">{detailModal.nama}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[11px] text-gray-400">Email</p>
                    <p className="text-sm font-medium text-gray-800">{detailModal.email}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[11px] text-gray-400">No. Registrasi</p>
                    <p className="text-sm font-medium text-gray-800 font-mono">{detailModal.no_registrasi || '-'}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[11px] text-gray-400">Tanggal Daftar</p>
                    <p className="text-sm font-medium text-gray-800">{new Date(detailModal.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>

              {/* Kontak */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Kontak</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[11px] text-gray-400">Telepon</p>
                    <p className="text-sm font-medium text-gray-800">{detailModal.telepon || '-'}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3 sm:col-span-2">
                    <p className="text-[11px] text-gray-400">Alamat</p>
                    <p className="text-sm font-medium text-gray-800">{detailModal.alamat || '-'}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[11px] text-gray-400">Provinsi</p>
                    <p className="text-sm font-medium text-gray-800">{detailModal.provinsi || '-'}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[11px] text-gray-400">Kabupaten</p>
                    <p className="text-sm font-medium text-gray-800">{detailModal.kabupaten || '-'}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[11px] text-gray-400">Kecamatan</p>
                    <p className="text-sm font-medium text-gray-800">{detailModal.kecamatan || '-'}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[11px] text-gray-400">Desa</p>
                    <p className="text-sm font-medium text-gray-800">{detailModal.desa || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Program & Affiliate */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Program & Affiliate</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[11px] text-gray-400">Program</p>
                    <p className="text-sm font-medium text-gray-800">{detailModal.product?.nama || '-'}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[11px] text-gray-400">Batch</p>
                    <p className="text-sm font-medium text-gray-800">{detailModal.batch?.nama_batch || '-'}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[11px] text-gray-400">Affiliate</p>
                    <p className="text-sm font-medium text-gray-800">{detailModal.affiliate_link?.affiliate?.name || '-'}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[11px] text-gray-400">Kupon</p>
                    <p className="text-sm font-medium text-gray-800">{detailModal.coupon?.kode || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Pembayaran */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Pembayaran</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[11px] text-gray-400">Nominal</p>
                    <p className="text-sm font-bold text-gray-800">
                      {(() => {
                        const firstCategory = detailModal.detail?.[0]
                        if (firstCategory) {
                          return `Rp ${Number(firstCategory.total_transfer || firstCategory.dibayar || firstCategory.biaya).toLocaleString('id-ID')}`
                        }
                        return detailModal.nominal ? `Rp ${Number(detailModal.nominal).toLocaleString('id-ID')}` : '-'
                      })()}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[11px] text-gray-400">Diskon</p>
                    <p className="text-sm font-bold text-emerald-600">{detailModal.diskon ? `Rp ${Number(detailModal.diskon).toLocaleString('id-ID')}` : '-'}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[11px] text-gray-400">Bukti Bayar</p>
                    {detailModal.bukti_pembayaran ? (
                      <a href={`${APP_URL}/storage/${detailModal.bukti_pembayaran}`} target="_blank" rel="noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline">Lihat Bukti</a>
                    ) : (
                      <p className="text-sm font-medium text-gray-800">-</p>
                    )}
                  </div>
                </div>
                {detailModal.detail && detailModal.detail.length > 0 && (
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-left text-xs text-gray-500">
                        <tr>
                          <th className="px-3 py-2 font-medium">Kategori</th>
                          <th className="px-3 py-2 font-medium text-right">Biaya</th>
                          <th className="px-3 py-2 font-medium text-right">Dibayar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {detailModal.detail.map((d, i) => (
                          <tr key={i} className="bg-white">
                            <td className="px-3 py-2 text-gray-700">{d.nama}</td>
                            <td className="px-3 py-2 text-right text-gray-700">Rp {Number(d.total_transfer || d.biaya).toLocaleString('id-ID')}</td>
                            <td className="px-3 py-2 text-right text-gray-800 font-semibold">Rp {Number(d.dibayar).toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Ubah Status */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Ubah Status</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { val: 'waiting_payment', label: 'Menunggu Pembayaran', icon: Clock, iconColor: 'text-slate-500', bg: 'bg-slate-50 hover:bg-slate-100 border-slate-200' },
                    { val: 'confirmed', label: 'Pembayaran dikonfirmasi', icon: BadgeCheck, iconColor: 'text-amber-500', bg: 'bg-amber-50 hover:bg-amber-100 border-amber-200' },
                    { val: 'proses', label: 'Proses', icon: RefreshCw, iconColor: 'text-blue-500', bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200' },
                    { val: 'selesai', label: 'Selesai', icon: CheckCircle2, iconColor: 'text-emerald-500', bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200' },
                    { val: 'batal', label: 'Batal', icon: Ban, iconColor: 'text-red-500', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
                    { val: 'refund', label: 'Refund', icon: Banknote, iconColor: 'text-purple-500', bg: 'bg-purple-50 hover:bg-purple-100 border-purple-200' },
                  ].map(opt => {
                    const statusMap: Record<string, Record<string, string>> = {
                      waiting_payment: { status_pembayaran: 'unpaid', status_pendaftaran: 'pending' },
                      confirmed: { status_pembayaran: 'processing', status_pendaftaran: 'pending' },
                      proses: { status_pembayaran: 'processing', status_pendaftaran: 'disetujui' },
                      selesai: { status_pembayaran: 'verified', status_pendaftaran: 'disetujui' },
                      batal: { status_pembayaran: 'ditolak', status_pendaftaran: 'ditolak' },
                      refund: { status_pembayaran: 'refund', status_pendaftaran: 'ditolak' },
                    }
                    const current = combinedStatus(detailModal)
                    const isActive = (
                      (opt.val === 'waiting_payment' && current.label === 'Menunggu Pembayaran') ||
                      (opt.val === 'confirmed' && current.label === 'Pembayaran di Konfirmasi') ||
                      (opt.val === 'proses' && current.label === 'Proses') ||
                      (opt.val === 'selesai' && current.label === 'Selesai') ||
                      (opt.val === 'batal' && current.label === 'Batal') ||
                      (opt.val === 'refund' && current.label === 'Refund')
                    )
                    const confirmMessages: Record<string, { title: string; text: string; confirmText: string; icon: 'warning' | 'info' | 'question' }> = {
                      waiting_payment: { title: 'Ubah ke Menunggu Pembayaran?', text: `Status pembayaran ${detailModal.nama} akan diubah menjadi "Menunggu Pembayaran".`, confirmText: 'Ya, Ubah', icon: 'info' },
                      confirmed: { title: 'Konfirmasi Pembayaran?', text: `Pembayaran ${detailModal.nama} akan ditandai sebagai "Dikonfirmasi". Pastikan bukti pembayaran sudah diperiksa.`, confirmText: 'Ya, Konfirmasi', icon: 'warning' },
                      proses: { title: 'Mulai Proses?', text: `Pendaftaran ${detailModal.nama} akan diproses lebih lanjut.`, confirmText: 'Ya, Proses', icon: 'question' },
                      selesai: { title: 'Tandai Selesai?', text: `Pendaftaran ${detailModal.nama} akan ditandai sebagai "Selesai".`, confirmText: 'Ya, Selesai', icon: 'question' },
                      batal: { title: 'Batalkan Pendaftaran?', text: `Pendaftaran ${detailModal.nama} akan dibatalkan. Tindakan ini tidak dapat dibatalkan.`, confirmText: 'Ya, Batalkan', icon: 'warning' },
                      refund: { title: 'Proses Refund?', text: `Pembayaran ${detailModal.nama} akan dikembalikan (refund). Pastikan sudah sesuai kebijakan.`, confirmText: 'Ya, Refund', icon: 'warning' },
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
                            await pendaftarApi.updateStatus(detailModal.id, target)
                            setDetailModal(prev => prev ? { ...prev, ...target } : prev)
                            setData(prev => prev.map(item => item.id === detailModal.id ? { ...item, ...target } : item))
                            Swal.fire({ icon: 'success', title: 'Status diperbarui', timer: 1200, showConfirmButton: false })
                          } catch {
                            Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal memperbarui status' })
                          }
                        }}
                        disabled={isActive}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition ${opt.bg} ${isActive ? 'ring-2 ring-offset-1 ring-[#0E6187] opacity-100 cursor-default' : 'cursor-pointer'}`}
                      >
                        <Icon size={15} className={opt.iconColor} />
                        <span className="text-gray-700">{opt.label}</span>
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
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100"
                  >
                    <Trash2 size={15} />
                    <span>Hapus Pendaftar</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 border-t border-gray-100 bg-white px-6 py-3 text-right">
              <button onClick={() => setDetailModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}