import { useState, useEffect, useMemo } from 'react'
import { Search, FileText, Eye, RotateCcw, CreditCard, X, Loader, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Users } from 'lucide-react'
import { adminCabangApi, APP_URL } from '../../services/api'

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
  affiliateLink: { affiliate: { name: string } | null } | null
  coupon?: { kode: string } | null
  detail?: { kategori_id: number; kode: string; nama: string; biaya: number; dibayar: number; kode_unik?: number; total_transfer?: number; tanggal_bayar?: string }[]
}

export default function AdminCabangPendaftaran() {
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

  useEffect(() => {
    fetchData()
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
            <p className="text-sm text-slate-500">Kelola pendaftaran cabang Anda</p>
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
        <table className="w-full min-w-full border-collapse text-left text-sm text-slate-700">
          <thead className="text-sm text-slate-600">
            <tr>
              <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Nama</th>
              <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">No. Registrasi</th>
              <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Tgl. Daftar</th>
              <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Program</th>
              <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Batch</th>
              <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Affiliate</th>
              <th scope="col" className="border border-slate-200 px-4 py-3 text-right font-medium">Nominal</th>
              <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Status</th>
              <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Bukti</th>
              <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Aksi</th>
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
                  <td className="border border-slate-200 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=e5e7eb&color=6b7280&size=28`}
                        className="h-8 w-8 rounded-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{p.nama}</div>
                        <div className="text-xs text-slate-500">{p.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-sm font-mono text-slate-700">
                    {p.no_registrasi || <span className="text-slate-300">-</span>}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                    {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">{p.product?.nama || '-'}</td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">{p.batch?.nama_batch || '-'}</td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">
                    {p.affiliateLink?.affiliate?.name || <span className="text-slate-300">-</span>}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-right text-sm font-medium text-slate-800">
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
                  <td className="border border-slate-200 px-4 py-3 text-center">
                    {(() => { const s = combinedStatus(p); return (<span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium shadow-sm ${s.bg}`}>{s.label}</span>) })()}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-center">
                    {p.bukti_pembayaran ? (
                      <button onClick={() => setPreviewImg(`${APP_URL}/storage/${p.bukti_pembayaran}`)}
                        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600">
                        <Eye size={15} />
                      </button>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-center">
                    <div className="flex justify-center gap-1.5">
                      <button onClick={() => setDetailModal(p)}
                        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600" title="Detail Lengkap">
                        <FileText size={15} />
                      </button>
                      <button onClick={() => openRiwayat(p.id, p.nama)}
                        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600" title="Riwayat Pembayaran">
                        <CreditCard size={15} />
                      </button>
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
                riwayatData.map((r: any, i: number) => (
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
                    <p className="text-sm font-medium text-gray-800">{detailModal.affiliateLink?.affiliate?.name || '-'}</p>
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
