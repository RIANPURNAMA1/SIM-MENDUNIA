function fmt(n: number) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

import {
  FileText, Search, Receipt, CheckCircle, Clock, AlertCircle, RotateCcw,
  Loader, SlidersHorizontal, ChevronLeft, ChevronRight, MoreHorizontal,
} from 'lucide-react'
import { adminCabangApi, productApi } from '../../services/api'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import InvoiceModal from '../../components/InvoiceModal'

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

export default function AdminCabangTagihan() {
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterBatch, setFilterBatch] = useState('')
  const [filterProduct, setFilterProduct] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [batches, setBatches] = useState<BatchOption[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [kategoris, setKategoris] = useState<KategoriInfo[]>([])
  const [showBatchDropdown, setShowBatchDropdown] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [collapsedBatches, setCollapsedBatches] = useState<Set<number>>(new Set())
  const [groupsMeta, setGroupsMeta] = useState<BatchGroupMeta[]>([])
  const [candidates, setCandidates] = useState<Record<number, CandidatePage>>({})
  const [stats, setStats] = useState({ total: 0, paid: 0, outstanding: 0, count: 0 })
  const [batchPage, setBatchPage] = useState(1)
  const [batchTotalPages, setBatchTotalPages] = useState(1)
  const [batchTotal, setBatchTotal] = useState(0)
  const [openActionId, setOpenActionId] = useState<number | null>(null)
  const [invoiceId, setInvoiceId] = useState<number | null>(null)
  const actionRef = useRef<HTMLDivElement>(null)
  const batchPerPage = 5
  const candidatePerPage = 5
  const isFirstRender = useRef(true)

  useEffect(() => {
    Promise.all([
      adminCabangApi.biayaKategori(),
      adminCabangApi.batches(),
      productApi.list(),
    ]).then(([katRes, batchRes, prodRes]) => {
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
    }).catch(() => {})
    fetchGroups(1)
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

  const fetchCandidates = useCallback(async (batchId: number, page: number) => {
    setCandidates(prev => ({
      ...prev,
      [batchId]: { items: prev[batchId]?.items || [], page, totalPages: prev[batchId]?.totalPages || 1, total: prev[batchId]?.total || 0, loading: true },
    }))
    try {
      const res = await adminCabangApi.tagihanBatch(batchId, { ...filterParams(), page, per_page: candidatePerPage })
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

  const fetchGroups = useCallback(async (page: number) => {
    setLoading(true)
    try {
      const res = await adminCabangApi.tagihanGroups({ ...filterParams(), page, per_page: batchPerPage })
      const batches = res.data.batches || []
      setGroupsMeta(batches)
      setStats(res.data.stats || { total: 0, paid: 0, outstanding: 0, count: 0 })
      setBatchTotalPages(res.data.total_pages || 1)
      setBatchTotal(res.data.total || 0)
      await Promise.all(batches.map((b: BatchGroupMeta) => fetchCandidates(b.batch_id, 1)))
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

  const calcRow = (p: TagihanItem) => {
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

  const renderBatchTable = (group: BatchGroup) => {
    const { batchId, batchName, kategoriColumns, items } = group
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
              <p className="text-xs text-slate-500">{group.totalPendaftar} pendaftar</p>
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
            <table className="w-full min-w-[900px] border-collapse text-left text-sm text-slate-700">
              <thead className="bg-[#0e6187]">
                  <tr>
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
                  const { tagihan, dibayar, sisa } = calcRow(p)
                  return (
                    <tr key={p.id} className={`transition ${p.is_cuti ? 'bg-yellow-100 hover:bg-yellow-200/70' : p.status_kandidat === 'Mengundurkan Diri' ? 'bg-red-100 hover:bg-red-200/70' : 'bg-white hover:bg-slate-50'}`}>
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
                            </div>
                            <div className="text-xs text-slate-500 truncate">{p.email}</div>
                          </div>
                        </div>
                      </td>
                      {kategoriColumns.map(col => {
                        const k = col.kategori
                        const relevant = hasKategori(p, k.id)
                        if (!relevant) {
                          return (
                            <td key={k.id} className="border border-slate-200 px-4 py-3 text-right text-sm text-slate-300 min-w-[120px]">-</td>
                          )
                        }
                        const val = getDibayar(p, k.id)
                        const katDetail = p.detail?.find((d: DetailItem) => d.kategori_id === k.id)
                        const biayaKatRaw = katDetail?.biaya || 0
                        const isLunas = biayaKatRaw > 0 && val >= biayaKatRaw
                        return (
                          <td key={k.id} className="border border-slate-200 px-4 py-3 text-right whitespace-nowrap min-w-[120px]">
                            {val > 0 ? (
                              <span className={`text-sm font-semibold ${isLunas ? 'text-emerald-700' : 'text-orange-600'}`}>
                                {val.toLocaleString('id-ID')}
                              </span>
                            ) : (
                              <span className="text-sm text-slate-300">-</span>
                            )}
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
                              <button
                                onClick={() => { setOpenActionId(null); setInvoiceId(p.id) }}
                                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <FileText size={14} className="text-slate-400" />
                                <span>Lihat Invoice</span>
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
                  <td className="border border-slate-200 px-4 py-3" colSpan={kategoriColumns.length + 2}>
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
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] text-white">
            <Receipt size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Tagihan</h1>
            <p className="text-sm text-slate-500">Data tagihan pendaftaran cabang Anda</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium shadow-sm transition ${
              showFilter
                ? 'border-[#0E6187] bg-[#0E6187] text-white hover:bg-[#0E6187]/90'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal size={16} />
            Filter
          </button>
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
            onClick={() => { setSearch(''); setFilterStatus(''); setFilterBatch(''); setFilterProduct(''); setFilterDateFrom(''); setFilterDateTo(''); setCollapsedBatches(new Set()) }}
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

      <InvoiceModal pendaftarId={invoiceId} onClose={() => setInvoiceId(null)} />
    </div>
  )
}
