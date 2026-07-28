function fmt(n: number) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Layers, Receipt, CheckCircle, AlertCircle,
  RotateCcw, ChevronLeft, ChevronRight,
} from 'lucide-react'
import api from '../../services/api'
import { adminCabangApi } from '../../services/api'

interface KategoriInfo {
  id: number
  kode: string
  nama: string
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

interface RekapItem {
  id: number
  nama: string
  email: string
  batch: string
  product: { id: number; nama: string; kategori_items?: any[] } | null
  created_at?: string
  total_biaya: number
  total_dibayar: number
  total_sisa: number
  status_pembayaran: string
  status_pendaftaran: string
  detail: DetailItem[]
}

interface BatchRekap {
  batch_id: number
  batch: string
  kuota: number | null
  siswas_count: number
  total_biaya: number
  total_dibayar: number
  total_sisa: number
  kategoris: KategoriInfo[]
  items: RekapItem[]
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

export default function RekapBatch() {
  const location = useLocation()
  const isAdminCabang = location.pathname.startsWith('/admin-cabang')
  const [data, setData] = useState<BatchRekap[]>([])
  const [loading, setLoading] = useState(true)
  const [filterBatch, setFilterBatch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [kategoris, setKategoris] = useState<KategoriInfo[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [uniqueCodeOp, setUniqueCodeOp] = useState<string>('add')
  const [collapsedBatches, setCollapsedBatches] = useState<Set<number>>(new Set())
  const [batchPages, setBatchPages] = useState<Record<number, number>>({})
  const batchPerPage = 10

  useEffect(() => {
    const endpoint = isAdminCabang ? '/admin-cabang/rekap-per-batch' : '/rekap-per-batch'
    const kategoriEndpoint = isAdminCabang ? adminCabangApi.biayaKategori() : api.get('/biaya-kategori-flat')

    Promise.all([
      api.get(endpoint),
      kategoriEndpoint,
      api.get('/products'),
      api.get('/payment-settings'),
    ]).then(([res, katRes, prodRes, settingsRes]) => {
      const d: BatchRekap[] = res.data.data || []
      setData(d)
      setKategoris(katRes.data || [])
      setProducts(prodRes.data || [])
      setUniqueCodeOp(settingsRes.data?.unique_code_operation?.value ?? 'add')
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filteredBatches = useMemo(() => {
    return data
      .filter(b => !filterBatch || String(b.batch_id) === filterBatch)
      .map(b => {
        let items = b.items
        if (dateFrom || dateTo) {
          items = items.filter(item => {
            if (!item.created_at) return true
            if (dateFrom && item.created_at < dateFrom) return false
            if (dateTo && item.created_at > dateTo) return false
            return true
          })
        }
        return { ...b, items }
      })
      .filter(b => b.items.length > 0)
  }, [data, filterBatch, dateFrom, dateTo])

  const allItems = useMemo(() => {
    return filteredBatches.flatMap(b => b.items)
  }, [filteredBatches])

  const getBatchKategoriColumns = (batch: { items: RekapItem[] }): KategoriColumn[] => {
    const usedIds = new Set<number>()
    batch.items.forEach(p => {
      p.detail?.forEach(d => {
        if (d.biaya > 0) usedIds.add(d.kategori_id)
      })
    })

    const allProductIds = new Set<number>()
    batch.items.forEach(p => { if (p.product?.id) allProductIds.add(p.product.id) })
    const allKategoriItems: any[] = []
    allProductIds.forEach(pid => {
      const pr = products.find(p => p.id === pid)
      if (pr?.kategori_items) allKategoriItems.push(...pr.kategori_items)
    })

    const columns: KategoriColumn[] = []
    const matchedIds = new Set<number>()

    if (allKategoriItems.length > 0) {
      const walk = (items: any[], depth: number) => {
        for (const item of items) {
          const name = (item.name || '').toLowerCase()
          const kategori = kategoris.find(k =>
            k.nama.toLowerCase() === name || k.kode.toLowerCase() === name
          )
          if (kategori && usedIds.has(kategori.id) && !matchedIds.has(kategori.id)) {
            columns.push({ kategori, depth })
            matchedIds.add(kategori.id)
          }
          if (item.children?.length) {
            walk(item.children, depth + 1)
          }
        }
      }
      walk(allKategoriItems, 0)
    }

    for (const k of kategoris) {
      if (usedIds.has(k.id) && !matchedIds.has(k.id)) {
        columns.push({ kategori: k, depth: 0 })
        matchedIds.add(k.id)
      }
    }

    return columns
  }

  const calcRow = (p: RekapItem) => {
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
      tagihan = Number(p.total_biaya || 0)
      dibayar = Number(p.total_dibayar || 0)
    }
    const sisa = Math.max(0, tagihan - dibayar)
    return { tagihan, dibayar, sisa }
  }

  const hasKategori = (p: RekapItem, kategoriId: number): boolean => {
    return !!p.detail?.some(d => d.kategori_id === kategoriId && d.biaya > 0)
  }

  const statusBadge = (status: string, dibayar: number, tagihan: number) => {
    const isLunas = dibayar >= tagihan && tagihan > 0
    const map: Record<string, { bg: string; text: string; label: string }> = {
      unpaid: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Belum Bayar' },
      processing: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Proses' },
      partial: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Belum Lunas' },
      verified: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Lunas' },
    }
    const key = status === 'verified' && !isLunas ? 'partial' : status
    const s = map[key] || { bg: 'bg-slate-100', text: 'text-slate-600', label: status }
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.bg} ${s.text}`}>
        {s.label}
      </span>
    )
  }

  const toggleBatch = (bid: number) => {
    setCollapsedBatches(prev => {
      const next = new Set(prev)
      if (next.has(bid)) next.delete(bid)
      else next.add(bid)
      return next
    })
  }

  const grandStats = useMemo(() => {
    let total = 0
    let paid = 0
    for (const p of allItems) {
      const { tagihan, dibayar } = calcRow(p)
      total += tagihan
      paid += dibayar
    }
    return { total, paid, outstanding: Math.max(0, total - paid) }
  }, [allItems, uniqueCodeOp])

  const renderBatchTable = (batch: BatchRekap) => {
    const { batch_id, batch: batchName, items } = batch
    const kategoriColumns = getBatchKategoriColumns(batch)
    const isCollapsed = collapsedBatches.has(batch_id)
    const groupTagihan = items.reduce((sum, p) => sum + calcRow(p).tagihan, 0)
    const groupDibayar = items.reduce((sum, p) => sum + calcRow(p).dibayar, 0)
    const groupSisa = Math.max(0, groupTagihan - groupDibayar)

    const currentPage = batchPages[batch_id] || 1
    const totalPages = Math.max(1, Math.ceil(items.length / batchPerPage))
    const safePage = Math.min(currentPage, totalPages)
    const pagedItems = items.slice((safePage - 1) * batchPerPage, safePage * batchPerPage)

    const setPage = (page: number) => {
      setBatchPages(prev => ({ ...prev, [batch_id]: page }))
    }

    return (
      <div key={batch_id} className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <button
          onClick={() => toggleBatch(batch_id)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0E6187]">
              <Layers size={14} className="text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-slate-800">{batchName}</h3>
              <p className="text-xs text-slate-500">{items.length} pendaftar</p>
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
              <thead className="text-sm text-slate-600 bg-slate-50">
                <tr>
                  <th scope="col" className="border border-slate-200 px-4 py-3 font-medium w-[220px]">Pendaftar</th>
                  <th scope="col" className="border border-slate-200 px-4 py-3 font-medium w-[150px]">Program</th>
                  {kategoriColumns.map(col => {
                    const k = col.kategori
                    return (
                      <th key={k.id} scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium min-w-[120px]">
                        {k.nama}
                      </th>
                    )
                  })}
                  <th scope="col" className="border border-slate-200 px-4 py-3 text-right font-medium w-[120px]">Tagihan</th>
                  <th scope="col" className="border border-slate-200 px-4 py-3 text-right font-medium w-[120px]">Dibayar</th>
                  <th scope="col" className="border border-slate-200 px-4 py-3 text-right font-medium w-[120px]">Sisa</th>
                  <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium w-[110px]">Status</th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.map(p => {
                  const { tagihan, dibayar, sisa } = calcRow(p)
                  return (
                    <tr key={p.id} className="bg-white transition hover:bg-slate-50">
                      <td className="border border-slate-200 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=e5e7eb&color=6b7280&size=28`}
                            className="h-8 w-8 rounded-full object-cover shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{p.nama}</p>
                            <p className="text-xs text-slate-500 truncate">{p.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">{p.product?.nama || '-'}</td>
                      {kategoriColumns.map(col => {
                        const k = col.kategori
                        const relevant = hasKategori(p, k.id)
                        if (!relevant) {
                          return (
                            <td key={k.id} className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-300 min-w-[120px]">-</td>
                          )
                        }
                        const katDetail = p.detail?.find((d: DetailItem) => d.kategori_id === k.id)
                        const dibayar = katDetail?.dibayar || 0
                        const biayaRaw = katDetail?.biaya || 0
                        const biaya = uniqueCodeOp === 'subtract' && katDetail?.total_transfer ? Number(katDetail.total_transfer) : biayaRaw
                        const isLunas = biaya > 0 && dibayar >= biaya
                        const isPartial = dibayar > 0 && !isLunas
                        return (
                          <td key={k.id} className="border border-slate-200 px-4 py-3 text-center whitespace-nowrap min-w-[120px]">
                            <span className={`text-sm font-semibold ${isLunas ? 'text-emerald-700' : isPartial ? 'text-orange-600' : dibayar > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                              {dibayar > 0 ? `Rp ${fmt(dibayar)}` : '-'}
                            </span>
                            {biayaRaw > 0 && (
                              <div className="text-[10px] text-slate-400 mt-0.5">Rp {fmt(biayaRaw)}</div>
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
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-semibold text-sm">
                  <td className="border border-slate-200 px-4 py-3" colSpan={kategoriColumns.length + 2}>
                    <span className="text-slate-500">Total {batchName}</span>
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-right text-slate-800">Rp {fmt(groupTagihan)}</td>
                  <td className="border border-slate-200 px-4 py-3 text-right text-emerald-700">Rp {fmt(groupDibayar)}</td>
                  <td className="border border-slate-200 px-4 py-3 text-right text-red-600">{groupSisa > 0 ? `Rp ${fmt(groupSisa)}` : '-'}</td>
                  <td className="border border-slate-200 px-4 py-3 text-center text-slate-500">{items.length} orang</td>
                </tr>
              </tfoot>
            </table>
            {items.length > batchPerPage && (
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                <span className="text-sm text-slate-500">
                  Menampilkan {pagedItems.length} dari {items.length} pendaftar
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(safePage - 1)}
                    disabled={safePage <= 1}
                    className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="min-w-[32px] text-center text-sm font-medium text-slate-600">{safePage} / {totalPages}</span>
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
      <div className="mb-4 flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] text-white">
            <Layers size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Rekap Per Batch</h1>
            <p className="text-sm text-slate-500">Rincian pembayaran kandidat per kategori biaya</p>
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            <option value="">Semua Batch</option>
            {data.map(b => (
              <option key={b.batch_id} value={b.batch_id}>{b.batch}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            <span className="text-xs text-slate-400">s/d</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
          <button
            onClick={() => { setFilterBatch(''); setDateFrom(''); setDateTo(''); setCollapsedBatches(new Set()) }}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
            <Receipt size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Biaya</p>
            <p className="text-2xl font-bold text-slate-800">Rp {fmt(grandStats.total)}</p>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
            <CheckCircle size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-emerald-600">Terkumpul</p>
            <p className="text-2xl font-bold text-emerald-700">Rp {fmt(grandStats.paid)}</p>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
            <AlertCircle size={18} className="text-red-500" />
          </div>
          <div>
            <p className="text-xs text-red-600">Outstanding</p>
            <p className="text-2xl font-bold text-red-600">Rp {fmt(grandStats.outstanding)}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
            <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
          </div>
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Receipt size={24} />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-600">Tidak ada data ditemukan</p>
        </div>
      ) : (
        filteredBatches.map(batch => renderBatchTable(batch))
      )}

      {!loading && filteredBatches.length > 0 && (
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {filteredBatches.length} batch &middot; {allItems.length} kandidat
          </p>
          <div className="flex items-center gap-3 text-[10px] text-slate-500">
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600" /> Lunas</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Belum Lunas</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300" /> Belum Bayar</span>
          </div>
        </div>
      )}
    </div>
  )
}
