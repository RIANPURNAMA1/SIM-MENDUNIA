function fmt(n: number) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function parseInput(v: string): number {
  const raw = v.replace(/\./g, '').replace(/\D/g, '')
  return raw === '' ? 0 : Number(raw)
}

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText, Search, Receipt, CheckCircle, Clock, AlertCircle, RotateCcw,
  DollarSign, X, Save, Bell, Eye, Loader, XCircle, Users,
  ChevronLeft, ChevronRight, MoreHorizontal, LayoutDashboard,
  BadgeCheck, RefreshCw, CheckCircle2, Ban, Banknote,
} from 'lucide-react'
import Swal from 'sweetalert2'
import api, { pendaftarApi, batchApi, productApi, APP_URL } from '../../services/api'

interface KategoriInfo {
  id: number
  kode: string
  nama: string
  parent_id: number | null
  children?: KategoriInfo[]
}

interface DetailItem {
  kategori_id: number
  kode: string
  nama: string
  biaya: number
  dibayar: number
  kode_unik?: number
  total_transfer?: number
}

interface TagihanItem {
  id: number
  nama: string
  email: string
  nominal: number | null
  diskon: number | null
  status_pendaftaran: string
  status_pembayaran: string
  status_kandidat: string | null
  is_cuti: boolean
  created_at: string
  product: { id: number; nama: string; harga: number; kategori_items?: { name: string; harga: number; komisi: number; children: any[] }[] } | null
  batch: { id: number; nama_batch: string; warna: string | null } | null
  detail?: DetailItem[]
}

interface KategoriItem {
  kategori_id: number
  kode: string
  nama: string
  biaya: number
  dibayar: number
}

interface BatchOption {
  id: number
  nama_batch: string
  warna: string | null
}

interface ProductOption {
  id: number
  nama: string
  kategori_items?: { name: string; harga: number; komisi: number; children: any[] }[]
}

interface KategoriColumn {
  kategori: KategoriInfo
  depth: number
}

interface BatchGroup {
  batchId: number
  batchName: string
  batchWarna: string | null
  kategoris: KategoriInfo[]
  kategoriColumns: KategoriColumn[]
  items: TagihanItem[]
  totalPendaftar: number
  totalTagihan: number
  totalDibayar: number
  totalSisa: number
  hasPending: boolean
}

interface BatchGroupMeta {
  batch_id: number
  nama_batch: string
  warna: string | null
  total_pendaftar: number
  total_tagihan: number
  total_dibayar: number
  total_sisa: number
  kategori_ids: number[]
  has_pending: boolean
}

interface CandidatePage {
  items: TagihanItem[]
  page: number
  totalPages: number
  total: number
  loading: boolean
}

const STATUS_MAP: Record<string, Record<string, string>> = {
  waiting_payment: { status_pembayaran: 'unpaid', status_pendaftaran: 'pending' },
  confirmed: { status_pembayaran: 'processing', status_pendaftaran: 'pending' },
  proses: { status_pembayaran: 'processing', status_pendaftaran: 'disetujui' },
  selesai: { status_pembayaran: 'verified', status_pendaftaran: 'disetujui' },
  batal: { status_pembayaran: 'ditolak', status_pendaftaran: 'ditolak' },
  ditangguhkan: { status_pembayaran: 'ditangguhkan', status_pendaftaran: 'pending' },
}

const STATUS_OPTIONS = [
  { val: 'waiting_payment', label: 'Menunggu Pembayaran', icon: Clock, iconColor: 'text-slate-500', bg: 'bg-slate-50 hover:bg-slate-100 border-slate-200' },
  { val: 'confirmed', label: 'Menunggu Verifikasi', icon: BadgeCheck, iconColor: 'text-amber-500', bg: 'bg-amber-50 hover:bg-amber-100 border-amber-200' },
  { val: 'proses', label: 'Proses', icon: RefreshCw, iconColor: 'text-blue-500', bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200' },
  { val: 'selesai', label: 'Pembayaran dikonfirmasi', icon: CheckCircle2, iconColor: 'text-emerald-500', bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200' },
  { val: 'batal', label: 'Batal', icon: Ban, iconColor: 'text-red-500', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
  { val: 'ditangguhkan', label: 'Ditangguhkan', icon: Banknote, iconColor: 'text-orange-500', bg: 'bg-orange-50 hover:bg-orange-100 border-orange-200' },
]

const STATUS_CONFIRM: Record<string, { title: string; text: string; confirmText: string; icon: 'warning' | 'info' | 'question' }> = {
  waiting_payment: { title: 'Ubah ke Menunggu Pembayaran?', text: 'Status pembayaran akan diubah menjadi "Menunggu Pembayaran".', confirmText: 'Ya, Ubah', icon: 'info' },
  confirmed: { title: 'Konfirmasi Pembayaran?', text: 'Bukti bayar akan ditandai sebagai "Menunggu Verifikasi".', confirmText: 'Ya, Verifikasi', icon: 'warning' },
  proses: { title: 'Mulai Proses?', text: 'Pendaftaran akan diproses lebih lanjut.', confirmText: 'Ya, Proses', icon: 'question' },
  selesai: { title: 'Konfirmasi Pembayaran?', text: 'Pembayaran akan ditandai sebagai "Pembayaran dikonfirmasi".', confirmText: 'Ya, Konfirmasi', icon: 'question' },
  batal: { title: 'Batalkan Pendaftaran?', text: 'Pendaftaran akan dibatalkan. Tindakan ini tidak dapat dibatalkan.', confirmText: 'Ya, Batalkan', icon: 'warning' },
  ditangguhkan: { title: 'Tangguhkan Pendaftaran?', text: 'Pendaftaran akan ditangguhkan (uang belum masuk).', confirmText: 'Ya, Tangguhkan', icon: 'warning' },
}

function combinedStatusLabel(p: any): string {
  if (p?.status_pembayaran === 'ditangguhkan') return 'Ditangguhkan'
  if (p?.status_pembayaran === 'verified') return 'Pembayaran dikonfirmasi'
  if (p?.status_pendaftaran === 'ditolak' || p?.status_pembayaran === 'ditolak') return 'Batal'
  if (p?.status_pembayaran === 'processing' && p?.status_pendaftaran === 'pending') return 'Menunggu Verifikasi'
  if (p?.status_pembayaran === 'unpaid') return 'Menunggu Pembayaran'
  return 'Proses'
}

function UbahStatusGrid({ pendaftarId, pendaftar, onChanged }: { pendaftarId: number; pendaftar: any; onChanged: () => void }) {
  const current = combinedStatusLabel(pendaftar)
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {STATUS_OPTIONS.map(opt => {
        const target = STATUS_MAP[opt.val]
        const msg = STATUS_CONFIRM[opt.val]
        const isActive = opt.label === current
        const Icon = opt.icon
        return (
          <button
            key={opt.val}
            type="button"
            disabled={isActive}
            onClick={async () => {
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
                await pendaftarApi.updateStatus(pendaftarId, target)
                Swal.close()
                Swal.fire({ icon: 'success', title: 'Status diperbarui', timer: 1200, showConfirmButton: false })
                onChanged()
              } catch {
                Swal.close()
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal memperbarui status' })
              }
            }}
            className={`flex items-center gap-2 rounded-sm border px-3 py-2.5 text-left text-sm font-medium transition ${opt.bg} ${isActive ? 'ring-2 ring-offset-1 ring-[#0E6187] opacity-100 cursor-default' : 'cursor-pointer'}`}
          >
            <Icon size={15} className={opt.iconColor} />
            <span className="text-gray-700">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default function Tagihan() {
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterBatch, setFilterBatch] = useState('')
  const [filterProduct, setFilterProduct] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [batches, setBatches] = useState<BatchOption[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [kategoris, setKategoris] = useState<KategoriInfo[]>([])
  const [modalBayar, setModalBayar] = useState<{
    pendaftar: TagihanItem
    items: KategoriItem[]
    originalItems: KategoriItem[]
  } | null>(null)
  const [saving, setSaving] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Record<string, number>>({})
  const [savingInline, setSavingInline] = useState(false)
  const [pendingPembayaran, setPendingPembayaran] = useState<any[]>([])
  const [showBatchDropdown, setShowBatchDropdown] = useState(false)
  const [showPendingModal, setShowPendingModal] = useState(false)
  const [selectedPendingPendaftarId, setSelectedPendingPendaftarId] = useState<number | null>(null)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [collapsedBatches, setCollapsedBatches] = useState<Set<number>>(new Set())
  const [groupsMeta, setGroupsMeta] = useState<BatchGroupMeta[]>([])
  const [candidates, setCandidates] = useState<Record<number, CandidatePage>>({})
  const [stats, setStats] = useState({ total: 0, paid: 0, outstanding: 0, count: 0 })
  const [batchPage, setBatchPage] = useState(1)
  const [batchTotalPages, setBatchTotalPages] = useState(1)
  const [batchTotal, setBatchTotal] = useState(0)
  const [uniqueCodeOp, setUniqueCodeOp] = useState<string>('add')
  const [openActionId, setOpenActionId] = useState<number | null>(null)
  const [selectedLunasIds, setSelectedLunasIds] = useState<Set<number>>(new Set())
  const [bulkLunasLoading, setBulkLunasLoading] = useState(false)
  const actionRef = useRef<HTMLDivElement>(null)
  const batchPerPage = 5
  const candidatePerPage = 5
  const isFirstRender = useRef(true)

  const pendingCount = Object.keys(pendingChanges).length

  function fetchPendingPembayaran() {
    api.get('/pembayaran-pending').then(res => {
      setPendingPembayaran(res.data.data || [])
    }).catch(() => {})
  }

  useEffect(() => {
    Promise.all([
      api.get('/biaya-kategori-flat'),
      batchApi.list(),
      productApi.list(),
      api.get('/payment-settings'),
    ]).then(([katRes, batchRes, prodRes, settingsRes]) => {
      setKategoris((() => {
        const all = katRes.data || []
        const childrenOf = new Map<number | null, KategoriInfo[]>()
        for (const k of all) {
          const pid = k.parent_id ?? null
          if (!childrenOf.has(pid)) childrenOf.set(pid, [])
          childrenOf.get(pid)!.push(k)
        }
        const sorted: KategoriInfo[] = []
        const walk = (parentId: number | null) => {
          const kids = childrenOf.get(parentId)
          if (!kids) return
          kids.sort((a, b) => a.id - b.id)
          for (const k of kids) {
            sorted.push(k)
            walk(k.id)
          }
        }
        walk(null)
        return sorted
      })())
      setBatches(batchRes.data?.data || batchRes.data || [])
      setProducts(prodRes.data || [])
      setUniqueCodeOp(settingsRes.data?.unique_code_operation?.value ?? 'add')
    }).catch(() => {})
    fetchGroups(1)
    fetchPendingPembayaran()

    const interval = setInterval(() => {
      api.get('/pembayaran-pending').then(res => {
        const newPending = res.data.data || []
        setPendingPembayaran(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(newPending)) {
            return newPending
          }
          return prev
        })
        if (newPending.length === 0) {
          setShowPendingModal(false)
          setSelectedPendingPendaftarId(null)
        }
      }).catch(() => {})
    }, 15000)

    return () => clearInterval(interval)
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

  const filterParams = useCallback(() => ({
    search: search.trim() || undefined,
    status: filterStatus || undefined,
    batch_id: filterBatch || undefined,
    product_id: filterProduct || undefined,
    date_from: filterDateFrom || undefined,
    date_to: filterDateTo || undefined,
  }), [search, filterStatus, filterBatch, filterProduct, filterDateFrom, filterDateTo])

  const fetchCandidates = useCallback(async (batchId: number, page: number, params = filterParams()) => {
    setCandidates(prev => ({
      ...prev,
      [batchId]: { items: prev[batchId]?.items || [], page, totalPages: prev[batchId]?.totalPages || 1, total: prev[batchId]?.total || 0, loading: true },
    }))
    try {
      const res = await pendaftarApi.tagihanBatch(batchId, { ...params, page, per_page: candidatePerPage })
      setCandidates(prev => ({
        ...prev,
        [batchId]: { items: res.data.kandidat || [], page: res.data.page || 1, totalPages: res.data.total_pages || 1, total: res.data.total || 0, loading: false },
      }))
    } catch (err) {
      console.error(err)
      setCandidates(prev => ({
        ...prev,
        [batchId]: { items: prev[batchId]?.items || [], page, totalPages: prev[batchId]?.totalPages || 1, total: prev[batchId]?.total || 0, loading: false },
      }))
    }
  }, [filterParams])

  const fetchGroups = useCallback(async (page: number, params = filterParams()) => {
    setLoading(true)
    try {
      const res = await pendaftarApi.tagihanGroups({ ...params, page, per_page: batchPerPage })
      const batches = res.data.batches || []
      setGroupsMeta(batches)
      setStats(res.data.stats || { total: 0, paid: 0, outstanding: 0, count: 0 })
      setBatchTotalPages(res.data.total_pages || 1)
      setBatchTotal(res.data.total || 0)
      await Promise.all(batches.map((b: BatchGroupMeta) => fetchCandidates(b.batch_id, 1, params)))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filterParams, fetchCandidates])

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    setBatchPage(1)
    fetchGroups(1)
  }, [filterParams])

  const renderGroups = useMemo<BatchGroup[]>(() => {
    return groupsMeta.map(meta => {
      const usedIds = new Set<number>(meta.kategori_ids || [])
      const columns: KategoriColumn[] = []
      const matchedIds = new Set<number>()

      for (const k of kategoris) {
        if (usedIds.has(k.id) && !matchedIds.has(k.id)) {
          columns.push({ kategori: k, depth: 0 })
          matchedIds.add(k.id)
        }
      }

      return {
        batchId: meta.batch_id,
        batchName: meta.nama_batch,
        batchWarna: meta.warna,
        kategoris: columns.map(c => c.kategori),
        kategoriColumns: columns,
        items: candidates[meta.batch_id]?.items || [],
        totalPendaftar: meta.total_pendaftar,
        totalTagihan: meta.total_tagihan,
        totalDibayar: meta.total_dibayar,
        totalSisa: meta.total_sisa,
        hasPending: meta.has_pending,
      }
    })
  }, [groupsMeta, kategoris, candidates])

  const goBatchPage = (page: number) => {
    if (page < 1 || page > batchTotalPages || page === batchPage) return
    setBatchPage(page)
    fetchGroups(page)
  }

  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = []
    const total = batchTotalPages
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i)
    } else {
      const current = batchPage
      pages.push(1)
      if (current > 3) pages.push('...')
      const start = Math.max(2, current - 1)
      const end = Math.min(total - 1, current + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (current < total - 2) pages.push('...')
      pages.push(total)
    }
    return pages
  }, [batchTotalPages, batchPage])

  const getDibayar = (p: TagihanItem, kategoriId: number): number => {
    const key = `${p.id}_${kategoriId}`
    if (key in pendingChanges) return pendingChanges[key]
    const d = p.detail?.find(d => d.kategori_id === kategoriId)
    return d?.dibayar || 0
  }

  const hasKategori = (p: TagihanItem, kategoriId: number): boolean => {
    return !!p.detail?.some(d => d.kategori_id === kategoriId && d.biaya > 0)
  }

  const statusBadge = (status: string, dibayar: number, tagihan: number) => {
    const isLunas = dibayar >= tagihan && tagihan > 0
    const map: Record<string, { bg: string; text: string; label: string; icon: typeof Clock }> = {
      unpaid: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Belum Bayar', icon: AlertCircle },
      processing: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Proses', icon: Clock },
      partial: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Belum Lunas', icon: Clock },
      verified: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Lunas', icon: CheckCircle },
    }
    const key = status === 'verified' && !isLunas ? 'partial' : status
    const s = map[key] || { bg: 'bg-slate-100', text: 'text-slate-600', label: status, icon: Clock }
    const Icon = s.icon
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.bg} ${s.text}`}>
        <Icon size={12} />
        {s.label}
      </span>
    )
  }

  const calcRow = (p: TagihanItem, kats: KategoriInfo[]) => {
    const details = p.detail || []
    let tagihan = 0
    let dibayar = 0
    for (const d of details) {
      const biaya = Number(d.biaya || 0)
      if (biaya <= 0) continue
      tagihan += biaya
      dibayar += Number(d.dibayar || 0)
    }
    if (details.length === 0) {
      const diskon = Number(p.diskon || 0)
      tagihan = Number(p.product?.harga || 0) - diskon
      dibayar = Number(p.nominal || 0)
    }
    const sisa = Math.max(0, tagihan - dibayar)
    return { tagihan, dibayar, sisa }
  }

  const handleSaveInline = async () => {
    if (pendingCount === 0) return
    setSavingInline(true)
    try {
      const grouped: Record<number, { kategori_id: number; jumlah: number }[]> = {}
      for (const [key, val] of Object.entries(pendingChanges)) {
        const [pid, kid] = key.split('_').map(Number)
        if (!grouped[pid]) grouped[pid] = []
        grouped[pid].push({ kategori_id: kid, jumlah: val })
      }
      await Promise.all(
        Object.entries(grouped).map(([pid, items]) =>
          api.post(`/pembayaran-item/${pid}`, { items })
        )
      )
      setPendingChanges({})
      await fetchGroups(batchPage)
    } catch (err) {
      console.error(err)
    } finally {
      setSavingInline(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, key: string, p: TagihanItem, kats: KategoriInfo[]) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const [, kid] = key.split('_').map(Number)
      const visibleKats = kats.filter(k => hasKategori(p, k.id))
      const katIndex = visibleKats.findIndex(k => k.id === kid)
      if (katIndex < visibleKats.length - 1) {
        const nextKey = `${p.id}_${visibleKats[katIndex + 1].id}`
        inputRefs.current[nextKey]?.focus()
      }
    }
  }

  const refreshAll = useCallback(async () => {
    const pendingRes = await api.get('/pembayaran-pending')
    const newPending = pendingRes.data.data || []
    setPendingPembayaran(newPending)
    if (newPending.length === 0) {
      setShowPendingModal(false)
      setSelectedPendingPendaftarId(null)
    }
    await fetchGroups(batchPage)
  }, [fetchGroups, batchPage])

  const renderBatchTable = (group: BatchGroup) => {
    const { batchId, batchName, kategoris: kats, kategoriColumns, items } = group
    const isCollapsed = collapsedBatches.has(batchId)
    const groupTagihan = group.totalTagihan
    const groupDibayar = group.totalDibayar
    const groupSisa = group.totalSisa
    const cand = candidates[batchId]
    const currentPage = cand?.page || 1
    const totalPages = Math.max(1, cand?.totalPages || 1)
    const safePage = Math.min(currentPage, totalPages)
    const pagedItems = items
    const isLoading = cand?.loading

    const setPage = (page: number) => {
      if (page < 1 || page > totalPages || page === safePage) return
      fetchCandidates(batchId, page)
    }

    return (
      <div key={batchId} className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <button
          onClick={() => setCollapsedBatches(prev => {
            const next = new Set(prev)
            if (next.has(batchId)) next.delete(batchId)
            else next.add(batchId)
            return next
          })}
          className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${group.hasPending ? 'bg-red-50 hover:bg-red-100/60' : 'bg-white hover:bg-slate-50'}`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: group.batchWarna || '#0E6187' }}>
              <Receipt size={14} className="text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-slate-800">
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: group.batchWarna || '#0E6187' }}>{batchName}</span>
                {group.hasPending && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">ada pengajuan</span>
                )}
              </h3>
              <p className="text-xs text-slate-500">{group.totalPendaftar} kandidat</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-4 text-xs">
              <span className="text-slate-500">Tagihan: <span className="font-bold text-slate-700">Rp {fmt(groupTagihan)}</span></span>
              <span className="text-emerald-600">Dibayar: <span className="font-bold">Rp {fmt(groupDibayar)}</span></span>
              <span className="text-red-600">Sisa: <span className="font-bold">Rp {fmt(groupSisa)}</span></span>
            </div>
            <span className="text-slate-400">{isCollapsed ? '▶' : '▼'}</span>
          </div>
        </button>

        {!isCollapsed && (
          <div className="overflow-x-auto border-t border-slate-200">
            {selectedLunasIds.size > 0 && (
              <div className="flex items-center gap-3 border-b border-slate-200 bg-blue-50/50 px-4 py-2">
                <span className="text-xs font-medium text-slate-600">{selectedLunasIds.size} pendaftar dipilih</span>
                <button onClick={async () => {
                  setBulkLunasLoading(true)
                  try {
                    await Promise.all([...selectedLunasIds].map(id => pendaftarApi.setLunas(id)))
                    setSelectedLunasIds(new Set())
                    await refreshAll()
                    Swal.fire({ icon: 'success', title: 'Berhasil!', text: `${selectedLunasIds.size} pendaftar di-set lunas`, confirmButtonColor: '#0E6187', timer: 2000, timerProgressBar: true, showConfirmButton: false })
                  } catch {
                    Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal mengubah status pembayaran', confirmButtonColor: '#0E6187' })
                  } finally {
                    setBulkLunasLoading(false)
                  }
                }} disabled={bulkLunasLoading} className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">
                  {bulkLunasLoading ? 'Memproses...' : 'Set Lunas'}
                </button>
                <button onClick={() => setSelectedLunasIds(new Set())} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
                  Batal Pilih
                </button>
              </div>
            )}
            <table className="w-full min-w-[900px] border-collapse text-left text-sm text-slate-700">
              <thead className="bg-[#0e6187]">
                  <tr>
                    <th scope="col" className="border border-slate-600 px-3 py-3 text-center font-medium text-white w-[40px]">
                      <input type="checkbox" checked={pagedItems.length > 0 && pagedItems.every(p => selectedLunasIds.has(p.id))} onChange={() => {
                        if (pagedItems.every(p => selectedLunasIds.has(p.id))) {
                          setSelectedLunasIds(prev => { const n = new Set(prev); pagedItems.forEach(p => n.delete(p.id)); return n })
                        } else {
                          setSelectedLunasIds(prev => { const n = new Set(prev); pagedItems.forEach(p => n.add(p.id)); return n })
                        }
                      }} className="h-4 w-4 rounded border-white/50 bg-white/20 text-white focus:ring-0 cursor-pointer" />
                    </th>
                    <th scope="col" className="border border-slate-600 px-4 py-3 font-medium text-white w-[220px]">Pendaftar</th>
                  {kategoriColumns.map(col => {
                    const k = col.kategori
                    return (
                      <th
                        key={k.id}
                        scope="col"
                        className="border border-slate-600 px-4 py-3 text-right font-medium text-white min-w-[120px] w-[130px]"
                      >
                        {k.nama}
                      </th>
                    )
                  })}
                  <th scope="col" className="border border-slate-600 px-4 py-3 text-right font-medium text-white w-[120px]">Tagihan</th>
                  <th scope="col" className="border border-slate-600 px-4 py-3 text-right font-medium text-white w-[120px]">Dibayar</th>
                  <th scope="col" className="border border-slate-600 px-4 py-3 text-right font-medium text-white w-[120px]">Sisa</th>
                  <th scope="col" className="border border-slate-600 px-4 py-3 text-center font-medium text-white w-[110px]">Status</th>
                    <th scope="col" className="border border-slate-600 px-4 py-3 text-center font-medium text-white w-[80px]">Aksi</th>
                  </tr>
                </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={kategoriColumns.length + 6} className="border border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader size={16} className="animate-spin text-[#0E6187]" />
                        Memuat data...
                      </div>
                    </td>
                  </tr>
                )}
                {!isLoading && pagedItems.map(p => {
                  const { tagihan, dibayar, sisa } = calcRow(p, kats)
                  return (
                    <tr key={p.id} className={`transition ${p.is_cuti ? 'bg-yellow-100 hover:bg-yellow-200/70' : p.status_kandidat === 'Mengundurkan Diri' ? 'bg-red-100 hover:bg-red-200/70' : 'bg-white hover:bg-slate-50'} ${selectedLunasIds.has(p.id) ? '!bg-blue-50/50' : ''}`}>
                      <td className="border border-slate-200 px-3 py-3 text-center">
                        <input type="checkbox" checked={selectedLunasIds.has(p.id)} onChange={() => {
                          setSelectedLunasIds(prev => { const n = new Set(prev); if (n.has(p.id)) n.delete(p.id); else n.add(p.id); return n })
                        }} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                      </td>
                      <td className="border border-slate-200 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=e5e7eb&color=6b7280&size=28`}
                            className="h-8 w-8 rounded-full object-cover shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-800 truncate flex items-center gap-1">
                              {p.nama}
                              {pendingPembayaran.some((pp: any) => pp.pendaftar_id === p.id) && (
                                <button
                                  onClick={() => { setSelectedPendingPendaftarId(p.id); setShowPendingModal(true) }}
                                  title="Ada pembayaran menunggu verifikasi"
                                  className="h-2 w-2 rounded-full bg-red-500 shrink-0"
                                />
                              )}
                            </div>
                            <div className="text-xs text-slate-500 truncate">{p.email}</div>
                          </div>
                        </div>
                      </td>
                      {kategoriColumns.map(col => {
                        const k = col.kategori
                        const relevant = hasKategori(p, k.id)
                        const isUnpaid = p.status_pembayaran === 'unpaid'
                        if (!relevant) {
                          return (
                            <td key={k.id} className="border border-slate-200 px-4 py-3 text-right text-sm text-slate-300 min-w-[120px]">-</td>
                          )
                        }
                        const key = `${p.id}_${k.id}`
                        const val = getDibayar(p, k.id)
                        const isChanged = key in pendingChanges
                        const katDetail = p.detail?.find((d: DetailItem) => d.kategori_id === k.id)
                        const biayaKatRaw = katDetail?.biaya || 0
                        const katTotalTransfer = Number(katDetail?.total_transfer) || 0
                        const biayaKat = uniqueCodeOp === 'subtract' && katTotalTransfer > 0 ? katTotalTransfer : biayaKatRaw
                        const isLunas = biayaKatRaw > 0 && val >= biayaKatRaw
                        const isPartial = val > 0 && !isLunas
                        if (isUnpaid) {
                          return (
                            <td key={k.id} className="border border-slate-200 px-4 py-3 text-right text-sm text-slate-300 min-w-[120px]">-</td>
                          )
                        }
                        return (
                          <td key={k.id} className="border border-slate-200 px-4 py-3 text-right whitespace-nowrap min-w-[120px]">
                            <input
                              ref={el => { inputRefs.current[key] = el }}
                              type="text"
                              value={val > 0 ? val.toLocaleString('id-ID') : ''}
                              title={val > 0 ? val.toLocaleString('id-ID') : ''}
                              onChange={e => {
                                const num = parseInput(e.target.value)
                                setPendingChanges(prev => {
                                  const next = { ...prev }
                                  if (num === (p.detail?.find(d => d.kategori_id === k.id)?.dibayar || 0)) {
                                    delete next[key]
                                  } else {
                                    next[key] = num
                                  }
                                  return next
                                })
                              }}
                              onKeyDown={e => handleKeyDown(e, key, p, kats)}
                              className={`w-full bg-transparent text-right text-sm outline-none transition ${isChanged ? 'font-semibold text-blue-700' : isLunas ? 'font-semibold text-emerald-700' : isPartial ? 'font-semibold text-orange-600' : 'text-slate-500'} placeholder:text-slate-300 focus:bg-blue-50 focus:rounded focus:px-1`}
                              placeholder="-"
                            />
                            {biayaKatRaw > 0 && (
                              <div className="text-[10px] text-slate-400 mt-0.5">Rp {fmt(biayaKatRaw)}</div>
                            )}
                          </td>
                        )
                      })}
                      <td className="border border-slate-200 px-4 py-3 text-right text-sm font-semibold text-slate-800 whitespace-nowrap">
                        Rp {fmt(tagihan)}
                      </td>
                      <td className="border border-slate-200 px-4 py-3 text-right text-sm font-semibold text-emerald-700 whitespace-nowrap">
                        Rp {fmt(dibayar)}
                      </td>
                      <td className="border border-slate-200 px-4 py-3 text-right text-sm font-semibold text-red-600 whitespace-nowrap">
                        {sisa > 0 ? `Rp ${fmt(sisa)}` : '-'}
                      </td>
                      <td className="border border-slate-200 px-4 py-3 text-center">
                        {statusBadge(p.status_pembayaran, dibayar, tagihan)}
                      </td>
                      <td className="border border-slate-200 px-4 py-3 text-center">
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
                              <Link to={`/pendaftar/${p.id}/invoice`} onClick={() => setOpenActionId(null)}
                                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                                <FileText size={14} className="text-slate-400" />
                                <span>Lihat Invoice</span>
                              </Link>
                              <div className="my-1 border-t border-slate-100" />
                              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Status</p>
                              {(() => {
                                const { tagihan, dibayar } = calcRow(p, kats)
                                const isLunas = dibayar >= tagihan && tagihan > 0
                                return (
                                  <button
                                    onClick={async () => {
                                      setOpenActionId(null)
                                      try {
                                        if (isLunas) {
                                          await pendaftarApi.batalLunas(p.id)
                                        } else {
                                          await pendaftarApi.setLunas(p.id)
                                        }
                                        refreshAll()
                                      } catch (err) {
                                        console.error(err)
                                        Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal mengubah status pembayaran', confirmButtonColor: '#0E6187' })
                                      }
                                    }}
                                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                  >
                                    {isLunas
                                      ? <XCircle size={14} className="text-red-400" />
                                      : <CheckCircle size={14} className="text-emerald-400" />}
                                    <span>{isLunas ? 'Batalkan Lunas' : 'Set Lunas'}</span>
                                  </button>
                                )
                              })()}
                              <div className="my-1 border-t border-slate-100" />
                              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Pembayaran</p>
                              <button
                                onClick={async () => {
                                  setOpenActionId(null)
                                  try {
                                    const res = await api.get(`/pembayaran-item/${p.id}`)
                                    const items = res.data.items || []
                                    setModalBayar({ pendaftar: p, items, originalItems: items.map(i => ({...i})) })
                                  } catch (err) {
                                    console.error(err)
                                  }
                                }}
                                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <DollarSign size={14} className="text-emerald-400" />
                                <span>Input Pembayaran</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {!isLoading && (
              <tfoot>
                <tr className="bg-slate-50 font-semibold text-sm">
                  <td className="border border-slate-200 px-4 py-3" colSpan={kategoriColumns.length + 1}>
                    <span className="text-slate-500">Total {batchName}</span>
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-right text-slate-800">Rp {fmt(groupTagihan)}</td>
                  <td className="border border-slate-200 px-4 py-3 text-right text-emerald-700">Rp {fmt(groupDibayar)}</td>
                  <td className="border border-slate-200 px-4 py-3 text-right text-red-600">{groupSisa > 0 ? `Rp ${fmt(groupSisa)}` : '-'}</td>
                  <td className="border border-slate-200 px-4 py-3 text-center text-slate-500">{group.totalPendaftar} orang</td>
                </tr>
              </tfoot>
              )}
            </table>
            {!isLoading && totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                <span className="text-sm text-slate-500">
                  Menampilkan {pagedItems.length} dari {cand?.total || pagedItems.length} pendaftar
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(safePage - 1)}
                    disabled={safePage <= 1}
                    className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {(() => {
                    const pages: (number | string)[] = []
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
                    return pages.map((pg: number | string, i: number) =>
                      typeof pg !== 'number' ? (
                        <span key={`e${i}`} className="px-1 text-sm text-slate-400">…</span>
                      ) : (
                        <button
                          key={pg}
                          onClick={() => setPage(pg)}
                          className={`min-w-[32px] rounded-md border px-2 py-1 text-center text-sm transition ${
                            pg === safePage
                              ? 'border-[#0E6187] bg-[#0E6187] font-medium text-white'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {pg}
                        </button>
                      )
                    )
                  })()}
                  <button
                    onClick={() => setPage(safePage + 1)}
                    disabled={safePage >= totalPages}
                    className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronRight size={16} />
                  </button>
          </div>
        </div>
      )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-slate-500" aria-label="Breadcrumb">
        <Link to="/" className="flex items-center gap-1 transition-colors hover:text-[#0E6187]">
          <LayoutDashboard size={13} />
          <span>Beranda</span>
        </Link>
        <ChevronRight size={12} className="text-slate-300" />
        <Link to="/pendaftar" className="transition-colors hover:text-[#0E6187]">
          Manage Kandidat
        </Link>
        <ChevronRight size={12} className="text-slate-300" />
        <span className="font-medium text-slate-700">Tagihan</span>
      </nav>

      {/* Header */}
      <div className="mb-4 flex flex-col gap-4  p-4  sm:flex-row sm:items-center sm:justify-between ">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] text-white">
            <Receipt size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Tagihan</h1>
            <p className="text-sm text-slate-500">Kelola tagihan pendaftaran</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setSelectedPendingPendaftarId(null); setShowPendingModal(true) }}
            className="relative inline-flex items-center gap-2 rounded-md bg-white border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <span>Verifikasi</span>
            {pendingPembayaran.length > 0 && (
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {new Set(pendingPembayaran.map((pp: any) => pp.pendaftar_id)).size}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowFilter(v => !v)}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium shadow-sm transition ${showFilter ? 'bg-[#1a3a5c] text-white' : 'bg-[#0E6187] text-white hover:bg-[#1a3a5c]'}`}
          >
            <Search size={16} />
            Filter
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-blue-50 sm:h-10 sm:w-10">
            <Receipt size={16} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 sm:text-xs">Total Tagihan</p>
            <p className="break-words text-base font-bold leading-tight text-slate-800 sm:text-xl lg:text-2xl">Rp {fmt(stats.total)}</p>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-emerald-50 sm:h-10 sm:w-10">
            <CheckCircle size={16} className="text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-emerald-600 sm:text-xs">Terkumpul</p>
            <p className="break-words text-base font-bold leading-tight text-emerald-700 sm:text-xl lg:text-2xl">Rp {fmt(stats.paid)}</p>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-red-50 sm:h-10 sm:w-10">
            <AlertCircle size={16} className="text-red-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-red-600 sm:text-xs">Outstanding</p>
            <p className="break-words text-base font-bold leading-tight text-red-600 sm:text-xl lg:text-2xl">Rp {fmt(stats.outstanding)}</p>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-amber-50 sm:h-10 sm:w-10">
            <Users size={16} className="text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 sm:text-xs">Total Kandidat</p>
            <p className="break-words text-base font-bold leading-tight text-slate-800 sm:text-xl lg:text-2xl">{stats.count}</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      {showFilter && (
      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <div className="relative sm:col-span-2 md:col-span-3 lg:col-span-2">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama/email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="mm/dd/yyyy"
              value={filterDateFrom}
              onFocus={e => { e.target.type = 'date'; e.target.showPicker?.() }}
              onChange={e => { setFilterDateFrom(e.target.value); if (e.target.value) e.target.type = 'date'; else e.target.type = 'text' }}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="mm/dd/yyyy"
              value={filterDateTo}
              onFocus={e => { e.target.type = 'date'; e.target.showPicker?.() }}
              onChange={e => { setFilterDateTo(e.target.value); if (e.target.value) e.target.type = 'date'; else e.target.type = 'text' }}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <button onClick={() => setShowBatchDropdown(!showBatchDropdown)}
              className="flex items-center gap-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
              {filterBatch ? (() => {
                const b = batches.find(x => String(x.id) === filterBatch)
                return <>
                  {b?.warna ? <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: b.warna }} /> : null}
                  <span className="truncate">{b?.nama_batch || filterBatch}</span>
                </>
              })() : <span className="text-slate-500">Semua Batch</span>}
            </button>
            {showBatchDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowBatchDropdown(false)} />
                <div className="absolute top-full left-0 mt-1 w-full z-50 rounded-md border border-slate-200 bg-white shadow-lg max-h-48 overflow-y-auto">
                  <button onClick={() => { setFilterBatch(''); setShowBatchDropdown(false) }}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition hover:bg-slate-50 ${!filterBatch ? 'bg-blue-50 font-semibold' : ''}`}>
                    Semua Batch
                  </button>
                  {batches.map(b => (
                    <button key={b.id} onClick={() => { setFilterBatch(String(b.id)); setShowBatchDropdown(false) }}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition hover:bg-slate-50 ${String(b.id) === filterBatch ? 'bg-blue-50 font-semibold' : ''}`}>
                      {b.warna ? <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: b.warna }} /> : null}
                      {b.nama_batch}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            <option value="">Semua Program</option>
            {products.map(p => (
              <option key={p.id} value={p.nama}>{p.nama}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            <option value="">Semua Status</option>
            <option value="unpaid">Belum Bayar</option>
            <option value="processing">Proses</option>
            <option value="partial">Belum Lunas</option>
            <option value="verified">Lunas</option>
          </select>
          <button
            onClick={() => { setSearch(''); setFilterStatus(''); setFilterBatch(''); setFilterProduct(''); setFilterDateFrom(''); setFilterDateTo(''); setPendingChanges({}); setCollapsedBatches(new Set()) }}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 w-full sm:w-auto"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>
      )}

      {/* Program Tables */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
            <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
          </div>
        </div>
      ) : renderGroups.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Receipt size={24} />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-600">Tidak ada tagihan ditemukan</p>
        </div>
      ) : (
        renderGroups.map(group => renderBatchTable(group))
      )}

      {/* Summary */}
      {!loading && renderGroups.length > 0 && (
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {batchTotal} batch &middot; {stats.count} pendaftar
          </p>
          <div className="flex items-center gap-3 text-[10px] text-slate-500">
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600" /> Lunas</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Belum Lunas</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300" /> Belum Bayar</span>
          </div>
        </div>
      )}

      {/* Batch list pagination */}
      {!loading && renderGroups.length > 0 && batchTotalPages > 1 && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <span className="text-sm text-slate-500">
            Halaman {batchPage} dari {batchTotalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goBatchPage(batchPage - 1)}
              disabled={batchPage <= 1}
              className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft size={16} />
            </button>
            {pageNumbers.map((pg: number | string, i: number) =>
              typeof pg !== 'number' ? (
                <span key={`e${i}`} className="px-1 text-sm text-slate-400">…</span>
              ) : (
                <button
                  key={pg}
                  onClick={() => goBatchPage(pg)}
                  className={`min-w-[32px] rounded-md border px-2 py-1 text-center text-sm transition ${
                    pg === batchPage
                      ? 'border-[#0E6187] bg-[#0E6187] font-medium text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pg}
                </button>
              )
            )}
            <button
              onClick={() => goBatchPage(batchPage + 1)}
              disabled={batchPage >= batchTotalPages}
              className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Floating save bar */}
      {pendingCount > 0 && (
        <div className="sticky bottom-4 z-40 mt-4 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 shadow-lg">
          <p className="text-xs text-blue-700">
            <span className="font-bold">{pendingCount}</span> perubahan belum disimpan
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPendingChanges({})}
              className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              onClick={handleSaveInline}
              disabled={savingInline}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={14} />
              {savingInline ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      )}

      {/* Modal Bayar Manual */}
      {modalBayar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 py-6" onClick={() => setModalBayar(null)}>
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                  <DollarSign size={18} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Input Pembayaran Manual</h3>
                  <p className="text-xs text-slate-500">{modalBayar.pendaftar.nama}</p>
                </div>
              </div>
              <button onClick={() => setModalBayar(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X size={17} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {modalBayar.items.map((item, i) => (
                <div key={item.kategori_id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-600">{item.nama}</label>
                    <p className="text-[10px] text-slate-400">Biaya: Rp {fmt(item.biaya)}</p>
                  </div>
                  <div className="relative w-36">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">Rp</span>
                    <input
                      type="text"
                      value={item.dibayar ? Number(item.dibayar).toLocaleString('id-ID') : ''}
                      onChange={e => {
                        const raw = e.target.value.replace(/\./g, '')
                        const newItems = [...modalBayar.items]
                        newItems[i] = { ...newItems[i], dibayar: raw === '' ? 0 : Number(raw.replace(/\D/g, '')) }
                        setModalBayar({ ...modalBayar, items: newItems })
                      }}
                      className="w-full rounded-md border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
              <p className="text-[11px] text-slate-400">Kosongi jika belum bayar</p>
              <div className="flex gap-2">
                <button onClick={() => setModalBayar(null)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50">Batal</button>
                <button
                  onClick={async () => {
                    if (!modalBayar) return
                    setSaving(true)
                    try {
                      const changed = modalBayar.items.filter((item, i) => {
                        const orig = modalBayar.originalItems[i]
                        return item.dibayar > 0 && item.dibayar !== orig?.dibayar
                      })
                      if (changed.length === 0) {
                        setModalBayar(null)
                        setSaving(false)
                        return
                      }
                      for (const item of changed) {
                        await pendaftarApi.bayarManual(modalBayar.pendaftar.id, {
                          jumlah: item.dibayar,
                          kategori_id: item.kategori_id,
                        })
                      }
                      await fetchGroups(batchPage)
                      setModalBayar(null)
                    } catch (err: any) {
                      const msg = err?.response?.data?.message || err?.message || 'Terjadi kesalahan'
                      Swal.fire({ icon: 'error', title: 'Gagal', text: msg })
                    } finally {
                      setSaving(false)
                    }
                  }}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Pembayaran'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Verifikasi */}
      {showPendingModal && (() => {
        const filteredPembayaran = selectedPendingPendaftarId
          ? pendingPembayaran.filter((pp: any) => pp.pendaftar_id === selectedPendingPendaftarId)
          : pendingPembayaran
        const filteredNama = selectedPendingPendaftarId
          ? filteredPembayaran[0]?.pendaftar?.nama || ''
          : ''
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 py-6" onClick={() => { setShowPendingModal(false); setSelectedPendingPendaftarId(null) }}>
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                  <Bell size={18} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Verifikasi Pembayaran</h3>
                  <p className="text-xs text-slate-500">{filteredPembayaran.length} pembayaran menunggu verifikasi{filteredNama ? ` — ${filteredNama}` : ''}</p>
                </div>
              </div>
              <button onClick={() => { setShowPendingModal(false); setSelectedPendingPendaftarId(null) }} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X size={17} /></button>
            </div>
            {filteredPembayaran.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 mb-3">
                  <CheckCircle size={24} />
                </div>
                <p className="text-sm font-medium text-slate-600">Tidak ada pembayaran yang perlu diverifikasi</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredPembayaran.map((pp: any) => (
                  <div key={pp.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800">{pp.pendaftar?.nama}</p>
                        <p className="text-xs text-slate-500">{pp.pendaftar?.email}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                            {pp.kategori?.kode || 'Tagihan'}
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            Rp {Number(pp.jumlah).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {new Date(pp.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {pp.bukti_pembayaran && pp.bukti_pembayaran !== 'manual' && pp.bukti_pembayaran !== 'auto' && (
                          <a
                            href={`${APP_URL}/storage/${pp.bukti_pembayaran}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                          >
                            <Eye size={12} /> Lihat Bukti
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Ubah Status</p>
                      <UbahStatusGrid pendaftarId={pp.pendaftar_id} pendaftar={pp.pendaftar} onChanged={refreshAll} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        )
      })()}

    </div>
  )
}
