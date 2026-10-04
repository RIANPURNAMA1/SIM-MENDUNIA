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
  ChevronLeft, ChevronRight, ChevronDown, MoreHorizontal, LayoutDashboard,
  BadgeCheck, RefreshCw, CheckCircle2, Ban, Banknote, UserRound, Landmark,
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
  pendingCount: number
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
  pending_count?: number
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
  { val: 'waiting_payment', label: 'Menunggu Pembayaran', icon: Clock, iconColor: 'text-white', bg: 'bg-[#5f6368] hover:bg-[#3c4043] border-[#80868b]' },
  { val: 'confirmed', label: 'Menunggu Verifikasi', icon: BadgeCheck, iconColor: 'text-white', bg: 'bg-[#e37400] hover:bg-[#b06000] border-[#e37400]' },
  { val: 'proses', label: 'Proses', icon: RefreshCw, iconColor: 'text-white', bg: 'bg-[#0E6187] hover:bg-[#0a4d6b] border-[#1a73e8]' },
  { val: 'selesai', label: 'Pembayaran dikonfirmasi', icon: CheckCircle2, iconColor: 'text-white', bg: 'bg-[#137333] hover:bg-[#137333] border-[#137333]' },
  { val: 'batal', label: 'Batal', icon: Ban, iconColor: 'text-white', bg: 'bg-[#d93025] hover:bg-[#c5221f] border-[#d93025]' },
  { val: 'ditangguhkan', label: 'Ditangguhkan', icon: Banknote, iconColor: 'text-white', bg: 'bg-[#e37400] hover:bg-[#b06000] border-[#e37400]' },
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
            className={`flex items-center justify-between gap-2 border px-3 py-2.5 text-left text-sm font-medium transition ${opt.bg} ${isActive ? 'cursor-default opacity-100 ring-2 ring-offset-1 ring-[#1a73e8]' : 'cursor-pointer hover:brightness-95'}`}
          >
            <span className="flex items-center gap-2">
              <Icon size={15} className={opt.iconColor} />
              <span className="text-white">{opt.label}</span>
            </span>
            {isActive && (
              <span className="flex-none bg-white/25 px-1.5 py-0.5 text-[9px] font-bold text-white">
                saat ini
              </span>
            )}
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
  const [activeBatchId, setActiveBatchId] = useState<number | null>(null)
  const activeBatchRef = useRef<number | null>(null)
  const [groupsMeta, setGroupsMeta] = useState<BatchGroupMeta[]>([])
  const [candidates, setCandidates] = useState<Record<number, CandidatePage>>({})
  const [stats, setStats] = useState({ total: 0, paid: 0, outstanding: 0, count: 0 })
  const [batchTotal, setBatchTotal] = useState(0)
  const [uniqueCodeOp, setUniqueCodeOp] = useState<string>('add')
  const [openActionId, setOpenActionId] = useState<number | null>(null)
  const [selectedLunasIds, setSelectedLunasIds] = useState<Set<number>>(new Set())
  const [bulkLunasLoading, setBulkLunasLoading] = useState(false)
  const actionRef = useRef<HTMLDivElement>(null)
  const batchStripRef = useRef<HTMLDivElement | null>(null)
  const pendingRef = useRef<any[]>([])
  const fetchGroupsRef = useRef<(() => Promise<void>) | null>(null)
  const batchPerPage = 50
  const maxBatchPages = 10
  const candidatePerPage = 5
  const isFirstRender = useRef(true)

  const pendingCount = Object.keys(pendingChanges).length

  function fetchPendingPembayaran() {
    api.get('/pembayaran-pending').then(res => {
      const data = res.data.data || []
      pendingRef.current = data
      setPendingPembayaran(data)
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
    fetchGroups()
    fetchPendingPembayaran()

    const interval = setInterval(() => {
      api.get('/pembayaran-pending').then(res => {
        const newPending = res.data.data || []
        const changed = JSON.stringify(pendingRef.current) !== JSON.stringify(newPending)
        if (changed) {
          pendingRef.current = newPending
          setPendingPembayaran(newPending)
          fetchGroupsRef.current?.()
        }
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

  const selectBatch = useCallback((batchId: number | null) => {
    const next = activeBatchRef.current === batchId ? null : batchId
    activeBatchRef.current = next
    setActiveBatchId(next)
    setSelectedLunasIds(new Set())
    setOpenActionId(null)
    if (next === null) {
      setCandidates({})
    } else {
      fetchCandidates(next, 1)
    }
  }, [fetchCandidates])

  const fetchGroups = useCallback(async (params = filterParams()) => {
    setLoading(true)
    try {
      const allBatches: BatchGroupMeta[] = []
      let statsData = { total: 0, paid: 0, outstanding: 0, count: 0 }
      let totalBatches = 0
      let totalPages = 1
      let page = 1
      do {
        const res = await pendaftarApi.tagihanGroups({ ...params, page, per_page: batchPerPage })
        allBatches.push(...(res.data.batches || []))
        statsData = res.data.stats || statsData
        totalBatches = res.data.total || 0
        totalPages = Math.max(1, res.data.total_pages || 1)
        page += 1
      } while (page <= totalPages && page <= maxBatchPages)

      setGroupsMeta(allBatches)
      setStats(statsData)
      setBatchTotal(totalBatches || allBatches.length)
      const current = activeBatchRef.current
      const nextActive = current !== null && allBatches.some(b => b.batch_id === current) ? current : null
      if (activeBatchRef.current !== nextActive) {
        activeBatchRef.current = nextActive
        setActiveBatchId(nextActive)
        setSelectedLunasIds(new Set())
      }
      if (nextActive === null) {
        setCandidates({})
      } else {
        await fetchCandidates(nextActive, 1, params)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filterParams, fetchCandidates])

  useEffect(() => {
    fetchGroupsRef.current = fetchGroups
  }, [fetchGroups])

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    fetchGroups()
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
        pendingCount: meta.pending_count || 0,
      }
    })
  }, [groupsMeta, kategoris, candidates])

  const activeGroup = useMemo<BatchGroup | null>(
    () => renderGroups.find(g => g.batchId === activeBatchId) || null,
    [renderGroups, activeBatchId]
  )

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
      unpaid: { bg: 'bg-[#5f6368]', text: 'text-white', label: 'Belum Bayar', icon: AlertCircle },
      processing: { bg: 'bg-[#0E6187]', text: 'text-white', label: 'Proses', icon: Clock },
      partial: { bg: 'bg-[#e37400]', text: 'text-white', label: 'Belum Lunas', icon: Clock },
      verified: { bg: 'bg-[#137333]', text: 'text-white', label: 'Lunas', icon: CheckCircle },
    }
    const key = status === 'verified' && !isLunas ? 'partial' : status
    const s = map[key] || { bg: 'bg-[#f1f3f4]', text: 'text-[#5f6368]', label: status, icon: Clock }
    const Icon = s.icon
    return (
      <span className={`inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 text-[11px] font-semibold ${s.bg} ${s.text}`}>
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
      await fetchGroups()
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
    await fetchGroups()
  }, [fetchGroups])

  const scrollBatches = (dir: 1 | -1) => {
    const el = batchStripRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.max(180, el.clientWidth * 0.8), behavior: 'smooth' })
  }

  const renderBatchMenu = () => (
    <div className="mb-4 overflow-hidden border border-[#dadce0] bg-white ">
      <div className="flex items-center justify-between gap-3 border-b border-[#dadce0] bg-[#f8f9fa] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-none items-center justify-center bg-[#0E6187]">
            <Users size={15} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#202124]">Daftar Batch</h2>
            <p className="text-xs text-[#5f6368]">Pilih batch untuk melihat data tagihan kandidat</p>
          </div>
        </div>
        <div className="flex flex-none items-center gap-1.5">
          <button
            onClick={() => scrollBatches(-1)}
            title="Geser ke kiri"
            className="flex h-7 w-7 items-center justify-center border border-[#dadce0] bg-white text-[#5f6368] transition hover:bg-[#f8f9fa] hover:text-[#3c4043]"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="bg-[#0E6187]/10 px-2.5 py-1 text-xs font-semibold text-[#1a73e8] whitespace-nowrap">
            {renderGroups.length} batch
          </span>
          <button
            onClick={() => scrollBatches(1)}
            title="Geser ke kanan"
            className="flex h-7 w-7 items-center justify-center border border-[#dadce0] bg-white text-[#5f6368] transition hover:bg-[#f8f9fa] hover:text-[#3c4043]"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div ref={batchStripRef} className="flex snap-x snap-mandatory gap-2 overflow-x-auto p-2.5">
        {renderGroups.map(group => {
          const isActive = activeBatchId === group.batchId
          const color = group.batchWarna || '#0E6187'
          return (
            <button
              key={group.batchId}
              onClick={() => selectBatch(group.batchId)}
              className={`relative flex w-[170px] flex-none snap-start items-center justify-between gap-2 border p-2 text-left transition-all ${ isActive ? 'border-[#1a73e8] bg-[#0E6187]/5 ring-1 ring-[#1a73e8]/20' : 'border-[#dadce0] bg-white hover:border-[#dadce0] hover:bg-[#f8f9fa] hover:' }`}
            >
              {group.pendingCount > 0 && (
                <span
                  title={`${group.pendingCount} pembayaran menunggu verifikasi`}
                  className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center gap-0.5 bg-[#d93025] px-1 text-[10px] font-bold text-white ring-2 ring-white animate-pulse"
                >
                  <Bell size={10} />
                  {group.pendingCount}
                </span>
              )}
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="flex h-7 w-7 flex-none items-center justify-center"
                  style={{ backgroundColor: color }}
                >
                  <Receipt size={13} className="text-white" />
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-1">
                    <span className="truncate text-xs font-semibold text-[#202124]">{group.batchName}</span>
                    {group.hasPending && group.pendingCount === 0 && (
                      <span className="inline-flex items-center gap-0.5 bg-[#f6d7d5] px-1 py-0.5 text-[9px] font-bold text-[#c5221f]">
                        <Bell size={9} />
                        proses
                      </span>
                    )}
                    {isActive && (
                      <span className="inline-flex items-center gap-0.5 bg-[#0E6187]/10 px-1 py-0.5 text-[9px] font-bold text-[#1a73e8]">
                        <CheckCircle size={9} />
                        Aktif
                      </span>
                    )}
                  </span>
                  <span className="block text-[10px] text-[#5f6368]">{group.totalPendaftar} kandidat</span>
                </span>
              </span>

              <span className={`flex h-6 w-6 flex-none items-center justify-center border transition-colors ${ isActive ? 'border-[#1a73e8] bg-[#0E6187] text-white' : 'border-[#dadce0] bg-white text-[#80868b] hover:border-[#dadce0] hover:text-[#5f6368]' }`}>
                <ChevronRight size={12} />
              </span>
            </button>
          )
        })}
      </div>

      {activeBatchId === null && (
        <div className="flex items-center gap-3 border-t border-[#dadce0] bg-[#f8f9fa] px-4 py-3">
          <div className="flex h-8 w-8 flex-none items-center justify-center border border-[#dadce0] bg-white text-[#80868b]">
            <Search size={15} />
          </div>
          <p className="text-xs text-[#5f6368]">
            Belum ada batch dipilih. Klik salah satu batch di atas untuk menampilkan tabel data tagihan.
          </p>
        </div>
      )}
    </div>
  )

  const renderBatchTable = (group: BatchGroup) => {
    const { batchId, batchName, kategoris: kats, kategoriColumns, items } = group
    const isOpen = activeBatchId === batchId
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
      <div key={batchId} className="mb-6 overflow-hidden border border-[#dadce0] bg-white ">
        <button
          onClick={() => selectBatch(batchId)}
          className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${group.hasPending ? 'bg-[#fce8e6] hover:bg-[#f6d7d5]/60' : 'bg-white hover:bg-[#f8f9fa]'}`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 flex-none items-center justify-center" style={{ backgroundColor: group.batchWarna || '#0E6187' }}>
              <Receipt size={14} className="text-white" />
            </div>
            <div className="min-w-0 text-left">
              <h3 className="flex flex-wrap items-center gap-2 text-sm font-bold text-[#202124]">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: group.batchWarna || '#0E6187' }}>{batchName}</span>
                {group.hasPending && (
                  <span className="inline-flex items-center bg-[#f6d7d5] px-2 py-0.5 text-[10px] font-bold text-[#c5221f]">ada pengajuan</span>
                )}
              </h3>
              <p className="text-xs text-[#5f6368]">{group.totalPendaftar} kandidat</p>
            </div>
          </div>
          <div className="flex flex-none items-center gap-4">
            <div className="hidden items-center gap-4 text-xs sm:flex">
              <span className="text-[#5f6368]">Tagihan: <span className="font-bold text-[#3c4043]">Rp {fmt(groupTagihan)}</span></span>
              <span className="text-[#137333]">Dibayar: <span className="font-bold">Rp {fmt(groupDibayar)}</span></span>
              <span className="text-[#c5221f]">Sisa: <span className="font-bold">Rp {fmt(groupSisa)}</span></span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5f6368]">
              {isOpen ? 'Tutup' : 'Lihat Tagihan'}
              <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </span>
          </div>
        </button>

        {isOpen && (
          <div className="overflow-x-auto border-t border-[#dadce0]">
            {selectedLunasIds.size > 0 && (
              <div className="flex items-center gap-3 border-b border-[#dadce0] bg-[#e8f0fe]/50 px-4 py-2">
                <span className="text-xs font-medium text-[#5f6368]">{selectedLunasIds.size} pendaftar dipilih</span>
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
                }} disabled={bulkLunasLoading} className="bg-[#0E6187] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#084c63] disabled:opacity-50">
                  {bulkLunasLoading ? 'Memproses...' : 'Set Lunas'}
                </button>
                <button onClick={() => setSelectedLunasIds(new Set())} className="border border-[#dadce0] bg-white px-3 py-1.5 text-xs font-medium text-[#5f6368] transition hover:bg-[#f8f9fa]">
                  Batal Pilih
                </button>
              </div>
            )}
            <table className="w-full min-w-[900px] border-collapse text-left text-sm text-[#3c4043]">
              <thead className="">
                  <tr>
                    <th scope="col" className="text-xs font-medium text-[#5f6368] px-3 py-3 w-[40px] text-center">
                      <input type="checkbox" checked={pagedItems.length > 0 && pagedItems.every(p => selectedLunasIds.has(p.id))} onChange={() => {
                        if (pagedItems.every(p => selectedLunasIds.has(p.id))) {
                          setSelectedLunasIds(prev => { const n = new Set(prev); pagedItems.forEach(p => n.delete(p.id)); return n })
                        } else {
                          setSelectedLunasIds(prev => { const n = new Set(prev); pagedItems.forEach(p => n.add(p.id)); return n })
                        }
                      }} className="h-4 w-4 border-[#dadce0] bg-white text-[#1a73e8] focus:ring-0 cursor-pointer" />
                    </th>
                    <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 w-[220px]">Pendaftar</th>
                  {kategoriColumns.map(col => {
                    const k = col.kategori
                    return (
                      <th
                        key={k.id}
                        scope="col"
                        className="border border-[#dadce0] px-4 py-3 text-right font-medium text-[#3c4043] min-w-[120px] w-[130px]"
                      >
                        {k.nama}
                      </th>
                    )
                  })}
                  <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 w-[120px] text-right">Tagihan</th>
                  <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 w-[120px] text-right">Dibayar</th>
                  <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 w-[120px] text-right">Sisa</th>
                  <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 w-[110px] text-center">Status</th>
                    <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 w-[80px] text-center">Aksi</th>
                  </tr>
                </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={kategoriColumns.length + 6} className="border border-[#dadce0] px-4 py-8 text-center text-sm text-[#80868b]">
                      <div className="flex items-center justify-center gap-2">
                        <Loader size={16} className="animate-spin text-[#1a73e8]" />
                        Memuat data...
                      </div>
                    </td>
                  </tr>
                )}
                {!isLoading && pagedItems.map(p => {
                  const { tagihan, dibayar, sisa } = calcRow(p, kats)
                  return (
                    <tr key={p.id} className={`transition ${p.is_cuti ? 'bg-[#feefc3] hover:bg-[#fdd663]/70' : p.status_kandidat === 'Mengundurkan Diri' ? 'bg-[#f6d7d5] hover:bg-[#f6aea9]/70' : 'bg-white hover:bg-[#f8f9fa]'} ${selectedLunasIds.has(p.id) ? '!bg-[#e8f0fe]/50' : ''}`}>
                      <td className="border-b border-[#e8eaed] px-3 py-3 text-center">
                        <input type="checkbox" checked={selectedLunasIds.has(p.id)} onChange={() => {
                          setSelectedLunasIds(prev => { const n = new Set(prev); if (n.has(p.id)) n.delete(p.id); else n.add(p.id); return n })
                        }} className="h-4 w-4 border-[#dadce0] text-[#1a73e8] focus:ring-[#1a73e8] cursor-pointer" />
                      </td>
                      <td className="border-b border-[#e8eaed] px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=e5e7eb&color=6b7280&size=28`}
                            className="h-8 w-8 object-cover shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-[#202124] truncate flex items-center gap-1">
                              {p.nama}
                              {pendingPembayaran.some((pp: any) => pp.pendaftar_id === p.id) && (
                                <button
                                  onClick={() => { setSelectedPendingPendaftarId(p.id); setShowPendingModal(true) }}
                                  title="Ada pembayaran menunggu verifikasi"
                                  className="inline-flex items-center gap-1 bg-[#d93025] px-2 py-1 text-[11px] font-bold text-white transition-colors hover:bg-[#c5221f] shrink-0"
                                >
                                  <Bell size={12} className="animate-pulse" />
                                  {pendingPembayaran.filter((pp: any) => pp.pendaftar_id === p.id).length}
                                </button>
                              )}
                            </div>
                            <div className="text-xs text-[#5f6368] truncate">{p.email}</div>
                          </div>
                        </div>
                      </td>
                      {kategoriColumns.map(col => {
                        const k = col.kategori
                        const relevant = hasKategori(p, k.id)
                        const isUnpaid = p.status_pembayaran === 'unpaid'
                        if (!relevant) {
                          return (
                            <td key={k.id} className="border border-[#dadce0] px-4 py-3 text-right text-sm text-[#9aa0a6] min-w-[120px]">-</td>
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
                            <td key={k.id} className="border border-[#dadce0] px-4 py-3 text-right text-sm text-[#9aa0a6] min-w-[120px]">-</td>
                          )
                        }
                        return (
                          <td key={k.id} className="border border-[#dadce0] px-4 py-3 text-right whitespace-nowrap min-w-[120px]">
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
                              className={`w-full bg-transparent text-right text-sm outline-none transition ${isChanged ? 'font-semibold text-[#1a73e8]' : isLunas ? 'font-semibold text-[#137333]' : isPartial ? 'font-semibold text-[#b06000]' : 'text-[#5f6368]'} placeholder:text-[#9aa0a6] focus:bg-[#0E6187]/5 focus:px-1`}
                              placeholder="-"
                            />
                            {biayaKatRaw > 0 && (
                              <div className="text-[10px] text-[#80868b] mt-0.5">Rp {fmt(biayaKatRaw)}</div>
                            )}
                          </td>
                        )
                      })}
                      <td className="border-b border-[#e8eaed] px-4 py-3 text-right text-sm font-semibold text-[#202124] whitespace-nowrap">
                        Rp {fmt(tagihan)}
                      </td>
                      <td className="border-b border-[#e8eaed] px-4 py-3 text-right text-sm font-semibold text-[#137333] whitespace-nowrap">
                        Rp {fmt(dibayar)}
                      </td>
                      <td className="border-b border-[#e8eaed] px-4 py-3 text-right text-sm font-semibold text-[#c5221f] whitespace-nowrap">
                        {sisa > 0 ? `Rp ${fmt(sisa)}` : '-'}
                      </td>
                      <td className="border-b border-[#e8eaed] px-4 py-3 text-center whitespace-nowrap">
                        {statusBadge(p.status_pembayaran, dibayar, tagihan)}
                      </td>
                      <td className="border-b border-[#e8eaed] px-4 py-3 text-center">
                        <div className="relative flex justify-center" ref={openActionId === p.id ? actionRef : undefined}>
                          <button
                            onClick={() => setOpenActionId(openActionId === p.id ? null : p.id)}
                            className="border border-[#dadce0] bg-white p-1.5 text-[#5f6368] transition hover:border-[#dadce0] hover:bg-[#f8f9fa] hover:text-[#3c4043]"
                            title="Aksi"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          {openActionId === p.id && (
                            <div className="absolute right-0 top-full z-30 mt-1 w-52 border border-[#dadce0] bg-white py-1 shadow-[0_1px_3px_rgba(60,64,67,0.15)]">
                              <Link to={`/pendaftar/${p.id}/invoice`} onClick={() => setOpenActionId(null)}
                                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[#3c4043] hover:bg-[#f8f9fa] transition-colors">
                                <FileText size={14} className="text-[#80868b]" />
                                <span>Lihat Invoice</span>
                              </Link>
                              <div className="my-1 border-t border-[#e8eaed]" />
                              <p className="px-3 py-1 text-[10px] font-semibold r text-[#80868b]">Status</p>
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
                                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[#3c4043] hover:bg-[#f8f9fa] transition-colors"
                                  >
                                    {isLunas
                                      ? <XCircle size={14} className="text-[#ee675c]" />
                                      : <CheckCircle size={14} className="text-[#81c995]" />}
                                    <span>{isLunas ? 'Batalkan Lunas' : 'Set Lunas'}</span>
                                  </button>
                                )
                              })()}
                              <div className="my-1 border-t border-[#e8eaed]" />
                              <p className="px-3 py-1 text-[10px] font-semibold r text-[#80868b]">Pembayaran</p>
                              <button
                                onClick={async () => {
                                  setOpenActionId(null)
                                  try {
                                    const res = await api.get(`/pembayaran-item/${p.id}`)
                                    const items = res.data.items || []
                                    setModalBayar({ pendaftar: p, items, originalItems: items.map((i: KategoriItem) => ({...i})) })
                                  } catch (err) {
                                    console.error(err)
                                  }
                                }}
                                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[#3c4043] hover:bg-[#f8f9fa] transition-colors"
                              >
                                <DollarSign size={14} className="text-[#81c995]" />
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
                <tr className="bg-[#f8f9fa] font-semibold text-sm">
                  <td className="border-b border-[#e8eaed] px-4 py-3" colSpan={kategoriColumns.length + 1}>
                    <span className="text-[#5f6368]">Total {batchName}</span>
                  </td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-right text-[#202124]">Rp {fmt(groupTagihan)}</td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-right text-[#137333]">Rp {fmt(groupDibayar)}</td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-right text-[#c5221f]">{groupSisa > 0 ? `Rp ${fmt(groupSisa)}` : '-'}</td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-center text-[#5f6368]">{group.totalPendaftar} orang</td>
                </tr>
              </tfoot>
              )}
            </table>
            {!isLoading && totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[#dadce0] px-4 py-3">
                <span className="text-sm text-[#5f6368]">
                  Menampilkan {pagedItems.length} dari {cand?.total || pagedItems.length} pendaftar
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(safePage - 1)}
                    disabled={safePage <= 1}
                    className="border border-[#dadce0] bg-white p-1.5 text-[#5f6368] transition hover:bg-[#f8f9fa] disabled:opacity-30 disabled:pointer-events-none"
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
                        <span key={`e${i}`} className="px-1 text-sm text-[#80868b]">…</span>
                      ) : (
                        <button
                          key={pg}
                          onClick={() => setPage(pg)}
                          className={`min-w-[32px] border px-2 py-1 text-center text-sm transition ${ pg === safePage ? 'border-[#1a73e8] bg-[#0E6187] font-medium text-white' : 'border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f8f9fa]' }`}
                        >
                          {pg}
                        </button>
                      )
                    )
                  })()}
                  <button
                    onClick={() => setPage(safePage + 1)}
                    disabled={safePage >= totalPages}
                    className="border border-[#dadce0] bg-white p-1.5 text-[#5f6368] transition hover:bg-[#f8f9fa] disabled:opacity-30 disabled:pointer-events-none"
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
        <span className="font-medium text-[#3c4043]">Tagihan</span>
      </nav>

      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between ">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <Receipt size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Tagihan</h1>
            <p className="text-sm text-[#5f6368]">Kelola tagihan pendaftaran</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setSelectedPendingPendaftarId(null); setShowPendingModal(true) }}
            className={`relative inline-flex items-center gap-2 border px-3 py-2 text-sm font-medium transition ${pendingPembayaran.length > 0 ? 'border-[#f6aea9] bg-[#fce8e6] text-[#c5221f] hover:bg-[#f6d7d5]' : 'border-[#dadce0] bg-white text-[#3c4043] hover:bg-[#f8f9fa]'}`}
          >
            <Bell size={16} />
            <span>Verifikasi</span>
            {pendingPembayaran.length > 0 && (
              <span className="absolute -top-2 -right-2 inline-flex h-5 min-w-[20px] items-center justify-center bg-[#d93025] px-1 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                {new Set(pendingPembayaran.map((pp: any) => pp.pendaftar_id)).size}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowFilter(v => !v)}
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium transition ${showFilter ? 'bg-[#1a3a5c] text-white' : 'bg-[#0E6187] text-white hover:bg-[#1a3a5c]'}`}
          >
            <Search size={16} />
            Filter
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Tagihan', value: `Rp ${fmt(stats.total)}`, icon: Receipt },
          { label: 'Terkumpul', value: `Rp ${fmt(stats.paid)}`, icon: CheckCircle },
          { label: 'Outstanding', value: `Rp ${fmt(stats.outstanding)}`, icon: AlertCircle },
          { label: 'Total Kandidat', value: stats.count, icon: Users },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="flex min-w-0 items-center gap-3 border border-[#dadce0] bg-white p-3 sm:p-4">
              <div className="flex h-9 w-9 flex-none items-center justify-center bg-[#0E6187]/10 sm:h-10 sm:w-10">
                <Icon size={16} className="text-[#1a73e8]" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] text-[#5f6368] sm:text-xs">{stat.label}</p>
                <p className="break-words text-base font-bold leading-tight text-[#202124] sm:text-xl lg:text-2xl">{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filter */}
      {showFilter && (
      <div className="mb-4 border border-[#dadce0] bg-white p-4 ">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <div className="relative sm:col-span-2 md:col-span-3 lg:col-span-2">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#80868b]" />
            <input
              type="text"
              placeholder="Cari nama/email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-[#dadce0] bg-white py-2 pl-9 pr-3 text-sm text-[#3c4043] outline-none transition placeholder:text-[#80868b] focus:border-[#1a73e8] focus:border-[#1a73e8]"
            />
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="mm/dd/yyyy"
              value={filterDateFrom}
              onFocus={e => { e.target.type = 'date'; e.target.showPicker?.() }}
              onChange={e => { setFilterDateFrom(e.target.value); if (e.target.value) e.target.type = 'date'; else e.target.type = 'text' }}
              className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]"
            />
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="mm/dd/yyyy"
              value={filterDateTo}
              onFocus={e => { e.target.type = 'date'; e.target.showPicker?.() }}
              onChange={e => { setFilterDateTo(e.target.value); if (e.target.value) e.target.type = 'date'; else e.target.type = 'text' }}
              className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]"
            />
          </div>
          <div className="relative">
            <button onClick={() => setShowBatchDropdown(!showBatchDropdown)}
              className="flex items-center gap-2 w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]">
              {filterBatch ? (() => {
                const b = batches.find(x => String(x.id) === filterBatch)
                return <>
                  {b?.warna ? <span className="inline-block w-3 h-3 shrink-0" style={{ backgroundColor: b.warna }} /> : null}
                  <span className="truncate">{b?.nama_batch || filterBatch}</span>
                </>
              })() : <span className="text-[#5f6368]">Semua Batch</span>}
            </button>
            {showBatchDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowBatchDropdown(false)} />
                <div className="absolute top-full left-0 mt-1 w-full z-50 border border-[#dadce0] bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15)] max-h-48 overflow-y-auto">
                  <button onClick={() => { setFilterBatch(''); setShowBatchDropdown(false) }}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition hover:bg-[#f8f9fa] ${!filterBatch ? 'bg-[#e8f0fe] font-semibold' : ''}`}>
                    Semua Batch
                  </button>
                  {batches.map(b => (
                    <button key={b.id} onClick={() => { setFilterBatch(String(b.id)); setShowBatchDropdown(false) }}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition hover:bg-[#f8f9fa] ${String(b.id) === filterBatch ? 'bg-[#e8f0fe] font-semibold' : ''}`}>
                      {b.warna ? <span className="inline-block w-3 h-3 shrink-0" style={{ backgroundColor: b.warna }} /> : null}
                      {b.nama_batch}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)}
            className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]">
            <option value="">Semua Program</option>
            {products.map(p => (
              <option key={p.id} value={p.nama}>{p.nama}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]">
            <option value="">Semua Status</option>
            <option value="unpaid">Belum Bayar</option>
            <option value="processing">Proses</option>
            <option value="partial">Belum Lunas</option>
            <option value="verified">Lunas</option>
          </select>
          <button
            onClick={() => { setSearch(''); setFilterStatus(''); setFilterBatch(''); setFilterProduct(''); setFilterDateFrom(''); setFilterDateTo(''); setPendingChanges({}); activeBatchRef.current = null; setActiveBatchId(null); setCandidates({}); setSelectedLunasIds(new Set()) }}
            className="inline-flex items-center justify-center gap-2 border border-[#dadce0] bg-white px-3 py-2 text-sm font-medium text-[#3c4043] transition hover:bg-[#f8f9fa] w-full sm:w-auto"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>
      )}

      {/* Program Tables */}
      {loading && groupsMeta.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-[#1a73e8]/10 border-t-[#1a73e8] animate-spin" />
            <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
          </div>
        </div>
      ) : renderGroups.length === 0 ? (
        <div className="border border-[#dadce0] bg-white px-6 py-10 text-center ">
          <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]">
            <Receipt size={24} />
          </div>
          <p className="mt-3 text-sm font-medium text-[#5f6368]">Tidak ada tagihan ditemukan</p>
        </div>
      ) : (
        <>
          {renderBatchMenu()}
          {activeGroup ? renderBatchTable(activeGroup) : null}
        </>
      )}

      {/* Summary */}
      {!loading && renderGroups.length > 0 && (
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm text-[#5f6368]">
            {batchTotal} batch &middot; {stats.count} pendaftar
          </p>
          <div className="flex items-center gap-3 text-[10px] text-[#5f6368]">
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 bg-[#0E6187]" /> Lunas</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 bg-[#d93025]" /> Belum Lunas</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 bg-[#e8eaed]" /> Belum Bayar</span>
          </div>
        </div>
      )}

      {/* Floating save bar */}
      {pendingCount > 0 && (
        <div className="sticky bottom-4 z-40 mt-4 flex flex-col gap-3 border border-[#dadce0] bg-white px-4 py-3 shadow-[0_1px_3px_rgba(60,64,67,0.15)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#0E6187]/10">
              <AlertCircle size={17} className="text-[#1a73e8]" />
            </span>
            <p className="text-sm text-[#5f6368]">
              <span className="font-bold text-[#1a73e8]">{pendingCount}</span> perubahan belum disimpan
            </p>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setPendingChanges({})}
              className="border border-[#dadce0] bg-white px-4 py-2 text-xs font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]"
            >
              Batal
            </button>
            <button
              onClick={handleSaveInline}
              disabled={savingInline}
              className="inline-flex items-center gap-1.5 bg-[#0E6187] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#0a4f6e] disabled:opacity-50"
            >
              <Save size={14} />
              {savingInline ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      )}

      {/* Modal Bayar Manual */}
      {modalBayar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/50 px-3 py-6" onClick={() => setModalBayar(null)}>
          <div className="border border-[#dadce0] w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#dadce0] px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center bg-[#e6f4ea]">
                  <DollarSign size={18} className="text-[#137333]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#202124]">Input Pembayaran Manual</h3>
                  <p className="text-xs text-[#5f6368]">{modalBayar.pendaftar.nama}</p>
                </div>
              </div>
              <button onClick={() => setModalBayar(null)} className="p-1 text-[#80868b] hover:bg-[#f1f3f4] hover:text-[#5f6368]"><X size={17} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {modalBayar.items.map((item, i) => (
                <div key={item.kategori_id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-[#5f6368]">{item.nama}</label>
                    <p className="text-[10px] text-[#80868b]">Biaya: Rp {fmt(item.biaya)}</p>
                  </div>
                  <div className="relative w-36">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[#80868b]">Rp</span>
                    <input
                      type="text"
                      value={item.dibayar ? Number(item.dibayar).toLocaleString('id-ID') : ''}
                      onChange={e => {
                        const raw = e.target.value.replace(/\./g, '')
                        const newItems = [...modalBayar.items]
                        newItems[i] = { ...newItems[i], dibayar: raw === '' ? 0 : Number(raw.replace(/\D/g, '')) }
                        setModalBayar({ ...modalBayar, items: newItems })
                      }}
                      className="w-full border border-[#dadce0] bg-white py-2 pl-8 pr-3 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-[#dadce0] px-5 py-3">
              <p className="text-[11px] text-[#80868b]">Kosongi jika belum bayar</p>
              <div className="flex gap-2">
                <button onClick={() => setModalBayar(null)} className="border border-[#dadce0] bg-white px-4 py-2 text-xs font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]">Batal</button>
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
                      await fetchGroups()
                      setModalBayar(null)
                    } catch (err: any) {
                      const msg = err?.response?.data?.message || err?.message || 'Terjadi kesalahan'
                      Swal.fire({ icon: 'error', title: 'Gagal', text: msg })
                    } finally {
                      setSaving(false)
                    }
                  }}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 bg-[#0E6187] px-5 py-2 text-xs font-medium text-white transition hover:bg-[#084c63] disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/50 px-3 py-6" onClick={() => { setShowPendingModal(false); setSelectedPendingPendaftarId(null) }}>
          <div className="border border-[#dadce0] flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)]" onClick={e => e.stopPropagation()}>
            <div className="flex flex-none items-center justify-between gap-3 bg-[#0E6187] px-4 py-3.5 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 flex-none items-center justify-center bg-white/15">
                  <Bell size={19} className="text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white">Verifikasi Pembayaran</h3>
                  <p className="truncate text-xs text-white/75">
                    {filteredPembayaran.length} pembayaran menunggu verifikasi{filteredNama ? ` — ${filteredNama}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex flex-none items-center gap-2">
                <span className="inline-flex items-center gap-1 bg-[#f9ab00] px-2.5 py-1 text-xs font-bold text-white">
                  <Bell size={12} />
                  {filteredPembayaran.length}
                </span>
                <button
                  onClick={() => { setShowPendingModal(false); setSelectedPendingPendaftarId(null) }}
                  title="Tutup"
                  className="p-1.5 text-white/70 transition hover:bg-white/15 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            {filteredPembayaran.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center bg-[#e6f4ea] text-[#188038]">
                  <CheckCircle size={28} />
                </div>
                <p className="text-sm font-semibold text-[#3c4043]">Tidak ada pembayaran yang perlu diverifikasi</p>
                <p className="mt-1 text-xs text-[#5f6368]">Semua bukti pembayaran sudah diproses.</p>
              </div>
            ) : (
              <div className="flex-1 space-y-3 overflow-y-auto bg-[#f8f9fa] p-3 sm:p-4">
                {filteredPembayaran.map((pp: any) => (
                  <div key={pp.id} className="overflow-hidden border border-[#dadce0] bg-white ">
                    <div className="flex flex-col gap-3 border-b border-[#e8eaed] p-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(pp.pendaftar?.nama || '?')}&background=0E6187&color=ffffff&size=64`}
                          alt=""
                          className="h-11 w-11 flex-none object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#202124]">{pp.pendaftar?.nama}</p>
                          <p className="truncate text-xs text-[#5f6368]">{pp.pendaftar?.email}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <span className="bg-[#e8f0fe] px-2 py-0.5 text-[11px] font-semibold text-[#1967d2]">
                              {pp.kategori?.nama || pp.kategori?.kode || 'Tagihan'}
                            </span>
                            <span className="inline-flex items-center gap-1 bg-[#f8f9fa] px-2 py-0.5 text-[11px] font-medium text-[#5f6368]">
                              <Clock size={11} className="text-[#80868b]" />
                              {new Date(pp.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              {' · '}
                              {new Date(pp.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-none items-center justify-between gap-2 sm:flex-col sm:items-end">
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] font-semibold r text-[#80868b]">Nominal</p>
                          <p className="text-lg font-bold leading-tight text-[#137333]">
                            Rp {Number(pp.jumlah).toLocaleString('id-ID')}
                          </p>
                        </div>
                        {pp.bukti_pembayaran && pp.bukti_pembayaran !== 'manual' && pp.bukti_pembayaran !== 'auto' && (
                          <a
                            href={`${APP_URL}/storage/${pp.bukti_pembayaran}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 border border-[#1a73e8] bg-white px-3 py-1.5 text-xs font-semibold text-[#1a73e8] transition hover:bg-[#0a4d6b] hover:text-white"
                          >
                            <Eye size={14} /> Lihat Bukti
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 border-b border-[#e8eaed] p-4 sm:grid-cols-2">
                      <div className="flex items-center gap-2.5 border border-[#dadce0] bg-[#f8f9fa] px-3 py-2">
                        <UserRound size={14} className="flex-none text-[#80868b]" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold r text-[#80868b]">Nama Pengirim</p>
                          <p className="truncate text-xs font-semibold text-[#3c4043]">{pp.pendaftar?.nama_pengirim || pp.pendaftar?.nama_rekening || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 border border-[#dadce0] bg-[#f8f9fa] px-3 py-2">
                        <Landmark size={14} className="flex-none text-[#80868b]" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold r text-[#80868b]">Bank / Sumber</p>
                          <p className="truncate text-xs font-semibold text-[#3c4043]">{pp.pendaftar?.bank_pengirim || pp.pendaftar?.bank_asal || '-'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-bold text-[#3c4043]">Ubah Status Pembayaran</p>
                        <p className="text-[11px] text-[#80868b]">Status saat ini ditandai, klik aksi lain untuk mengubah</p>
                      </div>
                      <UbahStatusGrid pendaftarId={pp.pendaftar_id} pendaftar={pp.pendaftar} onChanged={refreshAll} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-none flex-col gap-2 border-t border-[#dadce0] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-[#5f6368]">Periksa bukti pembayaran sebelum mengubah status kandidat.</p>
              <button
                onClick={() => { setShowPendingModal(false); setSelectedPendingPendaftarId(null) }}
                className="inline-flex items-center justify-center bg-[#0E6187] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1a3a5c]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
        )
      })()}

    </div>
  )
}
