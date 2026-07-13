function fmt(n: number) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function parseInput(v: string): number {
  const raw = v.replace(/\./g, '').replace(/\D/g, '')
  return raw === '' ? 0 : Number(raw)
}

import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Search, Receipt, CheckCircle, Clock, AlertCircle, RotateCcw, DollarSign, X, Save, Bell, Eye, Check, Loader, XCircle } from 'lucide-react'
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
}

interface TagihanItem {
  id: number
  nama: string
  email: string
  nominal: number | null
  diskon: number | null
  status_pendaftaran: string
  status_pembayaran: string
  created_at: string
  product: { nama: string; harga: number } | null
  batch: { id: number; nama_batch: string } | null
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
}

interface ProductOption {
  id: number
  nama: string
}

export default function AdminCabangTagihan() {
  const [data, setData] = useState<TagihanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterBatch, setFilterBatch] = useState('')
  const [filterProduct, setFilterProduct] = useState('')
  const [batches, setBatches] = useState<BatchOption[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [kategoris, setKategoris] = useState<KategoriInfo[]>([])
  const [modalBayar, setModalBayar] = useState<{
    pendaftar: TagihanItem
    items: KategoriItem[]
  } | null>(null)
  const [saving, setSaving] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Record<string, number>>({})
  const [savingInline, setSavingInline] = useState(false)
  const [pendingPembayaran, setPendingPembayaran] = useState<any[]>([])
  const [showPendingModal, setShowPendingModal] = useState(false)
  const [verifyingId, setVerifyingId] = useState<number | null>(null)
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [confirmRejectId, setConfirmRejectId] = useState<number | null>(null)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const pendingCount = Object.keys(pendingChanges).length

  function fetchPendingPembayaran() {
    adminCabangApi.pendingPembayaran().then(res => {
      setPendingPembayaran(res.data.data || [])
    }).catch(() => {})
  }

  useEffect(() => {
    Promise.all([
      adminCabangApi.tagihan(),
      adminCabangApi.biayaKategori(),
      adminCabangApi.batches(),
    ]).then(([tagihanRes, katRes, batchRes]) => {
      setData(tagihanRes.data.data || [])
      setKategoris(katRes.data || [])
      setBatches(batchRes.data?.data || batchRes.data || [])

      const uniqueProducts = new Map<number, ProductOption>()
      const items = tagihanRes.data.data || []
      items.forEach((p: TagihanItem) => {
        if (p.product && !uniqueProducts.has(p.product.nama as any)) {
          uniqueProducts.set(p.product.nama as any, { id: p.product.nama as any, nama: p.product.nama })
        }
      })
      setProducts(Array.from(uniqueProducts.values()))
      setLoading(false)
    }).catch(() => setLoading(false))
    fetchPendingPembayaran()
  }, [])

  const filtered = useMemo(() => {
    const result = data.filter(p => {
      const matchSearch = !search || p.nama.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase())
      const matchStatus = !filterStatus || p.status_pembayaran === filterStatus
      const matchBatch = !filterBatch || String(p.batch?.id) === filterBatch
      const matchProduct = !filterProduct || String(p.product?.nama) === filterProduct
      return matchSearch && matchStatus && matchBatch && matchProduct
    })
    return result.sort((a, b) => {
      const aHasPending = pendingPembayaran.some((pp: any) => pp.pendaftar_id === a.id) ? 0 : 1
      const bHasPending = pendingPembayaran.some((pp: any) => pp.pendaftar_id === b.id) ? 0 : 1
      return aHasPending - bHasPending
    })
  }, [data, search, filterStatus, filterBatch, filterProduct, pendingPembayaran])

  const stats = useMemo(() => {
    const total = data.reduce((sum, p) => {
      const biayaTotal = p.detail?.reduce((s: number, d: DetailItem) => s + (d.biaya || 0), 0) || Number(p.product?.harga || 0)
      return sum + biayaTotal - Number(p.diskon || 0)
    }, 0)
    const paid = data.reduce((sum, p) => {
      const paidFromDetail = p.detail?.reduce((s: number, d: DetailItem) => s + (d.dibayar || 0), 0) || Number(p.nominal || 0)
      return sum + paidFromDetail
    }, 0)
    return {
      total: total,
      paid: paid,
      outstanding: total - paid,
      count: data.length,
    }
  }, [data])

  const getDibayar = (p: TagihanItem, kategoriId: number): number => {
    const key = `${p.id}_${kategoriId}`
    if (key in pendingChanges) return pendingChanges[key]
    const d = p.detail?.find(d => d.kategori_id === kategoriId)
    return d?.dibayar || 0
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
          adminCabangApi.savePembayaranItem(Number(pid), items)
        )
      )
      setPendingChanges({})
      const res = await adminCabangApi.tagihan()
      setData(res.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setSavingInline(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, key: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const [pid, kid] = key.split('_').map(Number)
      const katIndex = kategoris.findIndex(k => k.id === kid)
      if (katIndex < kategoris.length - 1) {
        const nextKey = `${pid}_${kategoris[katIndex + 1].id}`
        inputRefs.current[nextKey]?.focus()
      } else {
        const rowIndex = filtered.findIndex(p => p.id === pid)
        if (rowIndex < filtered.length - 1) {
          const nextPid = filtered[rowIndex + 1].id
          const nextKey = `${nextPid}_${kategoris[0].id}`
          inputRefs.current[nextKey]?.focus()
        }
      }
    }
  }

  async function handleVerifyPembayaran(id: number) {
    setVerifyingId(id)
    try {
      await adminCabangApi.verifyPayment(id)
      await Promise.all([
        adminCabangApi.tagihan().then(res => setData(res.data.data || [])),
        adminCabangApi.pendingPembayaran().then(res => setPendingPembayaran(res.data.data || [])),
      ])
    } catch (err) {
      console.error(err)
    } finally {
      setVerifyingId(null)
    }
  }

  async function handleRejectPembayaran(pembayaranId: number) {
    setRejectingId(pembayaranId)
    setConfirmRejectId(null)
    try {
      await adminCabangApi.rejectPayment(pembayaranId)
      await Promise.all([
        adminCabangApi.tagihan().then(res => setData(res.data.data || [])),
        adminCabangApi.pendingPembayaran().then(res => setPendingPembayaran(res.data.data || [])),
      ])
    } catch (err) {
      console.error(err)
    } finally {
      setRejectingId(null)
    }
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] border border-blue-100">
            <Receipt size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Tagihan</h1>
            <p className="text-sm text-slate-500">Kelola tagihan pendaftaran cabang Anda</p>
          </div>
        </div>
        <button
          onClick={() => setShowPendingModal(true)}
          className="relative inline-flex items-center gap-2 rounded-md bg-white border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <span>Verifikasi</span>
          {pendingPembayaran.length > 0 && (
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {new Set(pendingPembayaran.map((pp: any) => pp.pendaftar_id)).size}
            </span>
          )}
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Tagihan</p>
          <p className="text-lg font-bold text-slate-800">Rp {fmt(stats.total)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-emerald-600">Terkumpul</p>
          <p className="text-lg font-bold text-emerald-700">Rp {fmt(stats.paid)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-red-600">Outstanding</p>
          <p className="text-lg font-bold text-red-600">Rp {fmt(stats.outstanding)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Pendaftar</p>
          <p className="text-lg font-bold text-slate-800">{stats.count}</p>
        </div>
      </div>

      <div className="mb-4 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama/email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            <option value="">Semua Batch</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.nama_batch}</option>
            ))}
          </select>
          <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            <option value="">Semua Program</option>
            {products.map(p => (
              <option key={p.id} value={p.nama}>{p.nama}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            <option value="">Semua Status</option>
            <option value="unpaid">Belum Bayar</option>
            <option value="processing">Proses</option>
            <option value="partial">Belum Lunas</option>
            <option value="verified">Lunas</option>
          </select>
          <button
            onClick={() => { setSearch(''); setFilterStatus(''); setFilterBatch(''); setFilterProduct(''); setPendingChanges({}) }}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-full border-collapse text-left text-sm text-slate-700">
          <thead className="text-[10px] text-slate-600 uppercase tracking-wide">
            <tr>
              <th scope="col" className="border border-slate-200 px-2 py-2.5 font-semibold min-w-[150px]">Pendaftar</th>
              <th scope="col" className="border border-slate-200 px-2 py-2.5 font-semibold">Batch</th>
              <th scope="col" className="border border-slate-200 px-2 py-2.5 font-semibold">Program</th>
              {kategoris.map(k => (
                <th key={k.id} scope="col" className="border border-slate-200 px-1 py-2.5 text-right font-semibold min-w-[60px]">{k.kode}</th>
              ))}
              <th scope="col" className="border border-slate-200 px-2 py-2.5 text-right font-semibold min-w-[75px]">Tagihan</th>
              <th scope="col" className="border border-slate-200 px-2 py-2.5 text-right font-semibold min-w-[75px]">Dibayar</th>
              <th scope="col" className="border border-slate-200 px-2 py-2.5 text-right font-semibold min-w-[75px]">Sisa</th>
              <th scope="col" className="border border-slate-200 px-2 py-2.5 text-center font-semibold">Status</th>
              <th scope="col" className="border border-slate-200 px-2 py-2.5 text-center font-semibold">Invoice</th>
              <th scope="col" className="border border-slate-200 px-2 py-2.5 text-center font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={10 + kategoris.length} className="border border-slate-200 px-4 py-3">
                    <div className="h-4 w-full rounded bg-slate-200/70" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={10 + kategoris.length} className="border border-slate-200 px-6 py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Receipt size={24} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-600">Tidak ada tagihan</p>
                </td>
              </tr>
            ) : (
              filtered.map(p => {
                const diskon = Number(p.diskon || 0)
                const biayaFromDetail = kategoris.reduce((sum, k) => {
                  const d = p.detail?.find((dd: DetailItem) => dd.kategori_id === k.id)
                  return sum + (d?.biaya || 0)
                }, 0)
                const tagihan = biayaFromDetail || Number(p.product?.harga || 0) - diskon
                const totalPaidFromDetail = kategoris.reduce((sum, k) => sum + getDibayar(p, k.id), 0)
                const dibayar = totalPaidFromDetail || Number(p.nominal || 0)
                const sisa = Math.max(0, tagihan - dibayar)
                return (
                  <tr key={p.id} className="bg-white transition hover:bg-slate-50">
                    <td className="border border-slate-200 px-2 py-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=e5e7eb&color=6b7280&size=24`}
                          className="h-6 w-6 rounded-full object-cover shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                        <div>
                          <div className="text-xs font-semibold text-slate-800 truncate flex items-center gap-1">
                            {p.nama}
                            {pendingPembayaran.some((pp: any) => pp.pendaftar_id === p.id) && (
                              <button
                                onClick={() => setShowPendingModal(true)}
                                title="Ada pembayaran menunggu verifikasi"
                                className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0"
                              />
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">{p.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="border border-slate-200 px-2 py-2 text-xs text-slate-600">{p.batch?.nama_batch || '-'}</td>
                    <td className="border border-slate-200 px-2 py-2 text-xs text-slate-600">{p.product?.nama || '-'}</td>
                    {kategoris.map(k => {
                      const key = `${p.id}_${k.id}`
                      const val = getDibayar(p, k.id)
                      const isChanged = key in pendingChanges
                      return (
                        <td key={k.id} className="border border-slate-200 px-1 py-2 text-right">
                          <input
                            ref={el => { inputRefs.current[key] = el }}
                            type="text"
                            value={val > 0 ? val.toLocaleString('id-ID') : ''}
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
                            onKeyDown={e => handleKeyDown(e, key)}
                            className={`w-full bg-transparent text-right text-xs outline-none transition ${isChanged ? 'font-semibold text-blue-700' : val > 0 ? 'font-semibold text-emerald-700' : 'text-slate-400'} placeholder:text-slate-300 focus:bg-blue-50 focus:rounded focus:px-1`}
                            placeholder="-"
                          />
                        </td>
                      )
                    })}
                    <td className="border border-slate-200 px-2 py-2 text-right text-xs font-semibold text-slate-800">
                      Rp {fmt(tagihan)}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 text-right text-xs font-semibold text-emerald-700">
                      Rp {fmt(dibayar)}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 text-right text-xs font-semibold text-red-600">
                      {sisa > 0 ? `Rp ${fmt(sisa)}` : '-'}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 text-center">
                      {statusBadge(p.status_pembayaran, dibayar, tagihan)}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 text-center">
                      <Link
                        to={`/pendaftar/${p.id}/invoice`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <FileText size={11} />
                        Invoice
                      </Link>
                    </td>
                    <td className="border border-slate-200 px-2 py-2 text-center">
                      <button
                        onClick={async () => {
                          try {
                            const res = await adminCabangApi.pembayaranItem(p.id)
                            setModalBayar({ pendaftar: p, items: (res.data.items || []) })
                          } catch (err) {
                            console.error(err)
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <DollarSign size={11} />
                        Bayar
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
          Menampilkan {filtered.length} dari {data.length} tagihan
        </div>
      </div>

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
                      const items = modalBayar.items.map(i => ({
                        kategori_id: i.kategori_id,
                        jumlah: i.dibayar || 0,
                      }))
                      await adminCabangApi.savePembayaranItem(modalBayar.pendaftar.id, items)
                      const res = await adminCabangApi.tagihan()
                      setData(res.data.data || [])
                      setModalBayar(null)
                    } catch (err) {
                      console.error(err)
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

      {showPendingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 py-6" onClick={() => setShowPendingModal(false)}>
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                  <Bell size={18} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Verifikasi Pembayaran</h3>
                  <p className="text-xs text-slate-500">{pendingPembayaran.length} pembayaran menunggu verifikasi</p>
                </div>
              </div>
              <button onClick={() => setShowPendingModal(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X size={17} /></button>
            </div>

            {pendingPembayaran.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 mb-3">
                  <CheckCircle size={24} />
                </div>
                <p className="text-sm font-medium text-slate-600">Tidak ada pembayaran yang perlu diverifikasi</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingPembayaran.map((pp: any) => (
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
                            href={`http://localhost:8000/storage/${pp.bukti_pembayaran}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                          >
                            <Eye size={12} /> Lihat Bukti
                          </a>
                        )}
                        <button
                          onClick={() => handleVerifyPembayaran(pp.pendaftar_id)}
                          disabled={verifyingId === pp.pendaftar_id || rejectingId === pp.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {verifyingId === pp.pendaftar_id ? (
                            <><Loader size={12} className="animate-spin" /> Verifying</>
                          ) : (
                            <><Check size={12} /> Verifikasi</>
                          )}
                        </button>
                        <button
                          onClick={() => setConfirmRejectId(pp.id)}
                          disabled={verifyingId === pp.pendaftar_id || rejectingId === pp.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-[10px] font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                        >
                          <XCircle size={12} /> Tolak
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {confirmRejectId !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmRejectId(null)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <AlertCircle size={24} className="text-red-500" />
            </div>
            <h3 className="text-center text-sm font-bold text-slate-800">Tolak Pembayaran?</h3>
            <p className="mt-2 text-center text-xs text-slate-500">
              Pembayaran ini akan ditolak dan dihapus. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmRejectId(null)}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={() => handleRejectPembayaran(confirmRejectId)}
                disabled={rejectingId === confirmRejectId}
                className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {rejectingId === confirmRejectId ? 'Menolak...' : 'Ya, Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
