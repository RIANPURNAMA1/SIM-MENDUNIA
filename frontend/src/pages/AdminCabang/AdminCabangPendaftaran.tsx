import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Search, CheckCircle, Clock, XCircle, Eye, FileText, RotateCcw } from 'lucide-react'
import { adminCabangApi } from '../../services/api'

interface PendaftarItem {
  id: number
  nama: string
  email: string
  telepon: string | null
  nominal: number | null
  diskon: number | null
  status_pendaftaran: string
  status_pembayaran: string
  created_at: string
  product: { id: number; nama: string; harga: number } | null
  batch: { id: number; nama_batch: string } | null
  affiliateLink: { affiliate: { name: string } } | null
}

interface BatchOption {
  id: number
  nama_batch: string
}

export default function AdminCabangPendaftaran() {
  const [data, setData] = useState<PendaftarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterBatch, setFilterBatch] = useState('')
  const [batches, setBatches] = useState<BatchOption[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      adminCabangApi.pendaftar({
        search: search || undefined,
        status_pendaftaran: filterStatus || undefined,
        batch_id: filterBatch || undefined,
      }),
      adminCabangApi.batches(),
    ]).then(([pendaftarRes, batchRes]) => {
      setData(pendaftarRes.data || [])
      setBatches(batchRes.data?.data || batchRes.data || [])
    }).catch(() => {})
    .finally(() => setLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 300)
    return () => clearTimeout(timer)
  }, [search, filterStatus, filterBatch])

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
      pending: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
      disetujui: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle },
      ditolak: { bg: 'bg-red-50', text: 'text-red-600', icon: XCircle },
    }
    const s = map[status] || { bg: 'bg-slate-50', text: 'text-slate-600', icon: Clock }
    const Icon = s.icon
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.bg} ${s.text}`}>
        <Icon size={10} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const pembayaranBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      unpaid: { bg: 'bg-slate-100', text: 'text-slate-600' },
      processing: { bg: 'bg-blue-50', text: 'text-blue-700' },
      verified: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    }
    const s = map[status] || { bg: 'bg-slate-100', text: 'text-slate-600' }
    const label = status === 'unpaid' ? 'Belum Bayar' : status === 'processing' ? 'Proses' : 'Terverifikasi'
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.bg} ${s.text}`}>
        {label}
      </span>
    )
  }

  const handleApprove = async (id: number) => {
    if (!confirm('Setujui pendaftaran ini?')) return
    try {
      const { pendaftarApi } = await import('../../services/api')
      await pendaftarApi.approve(id)
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleReject = async (id: number) => {
    if (!confirm('Tolak pendaftaran ini?')) return
    try {
      const { pendaftarApi } = await import('../../services/api')
      await pendaftarApi.reject(id)
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] border border-blue-100">
            <ClipboardList size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Pendaftaran</h1>
            <p className="text-sm text-slate-500">Kelola pendaftaran cabang Anda</p>
          </div>
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
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="disetujui">Disetujui</option>
            <option value="ditolak">Ditolak</option>
          </select>
          <button
            onClick={() => { setSearch(''); setFilterStatus(''); setFilterBatch('') }}
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
              <th scope="col" className="border border-slate-200 px-3 py-2.5 font-semibold">Pendaftar</th>
              <th scope="col" className="border border-slate-200 px-3 py-2.5 font-semibold">Batch</th>
              <th scope="col" className="border border-slate-200 px-3 py-2.5 font-semibold">Program</th>
              <th scope="col" className="border border-slate-200 px-3 py-2.5 font-semibold">Affiliate</th>
              <th scope="col" className="border border-slate-200 px-3 py-2.5 text-right font-semibold">Tagihan</th>
              <th scope="col" className="border border-slate-200 px-3 py-2.5 text-center font-semibold">Status</th>
              <th scope="col" className="border border-slate-200 px-3 py-2.5 text-center font-semibold">Pembayaran</th>
              <th scope="col" className="border border-slate-200 px-3 py-2.5 text-center font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={8} className="border border-slate-200 px-4 py-3">
                    <div className="h-4 w-full rounded bg-slate-200/70" />
                  </td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={8} className="border border-slate-200 px-6 py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <ClipboardList size={24} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-600">Tidak ada pendaftaran</p>
                </td>
              </tr>
            ) : (
              data.map(p => (
                <tr key={p.id} className="bg-white transition hover:bg-slate-50">
                  <td className="border border-slate-200 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=e5e7eb&color=6b7280&size=24`}
                        className="h-6 w-6 rounded-full shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                      <div>
                        <div className="text-xs font-semibold text-slate-800">{p.nama}</div>
                        <div className="text-[10px] text-slate-500">{p.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="border border-slate-200 px-3 py-2 text-xs text-slate-600">{p.batch?.nama_batch || '-'}</td>
                  <td className="border border-slate-200 px-3 py-2 text-xs text-slate-600">{p.product?.nama || '-'}</td>
                  <td className="border border-slate-200 px-3 py-2 text-xs text-slate-500">
                    {p.affiliateLink?.affiliate?.name || '-'}
                  </td>
                  <td className="border border-slate-200 px-3 py-2 text-right text-xs font-semibold text-slate-800">
                    Rp {Number(p.product?.harga || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="border border-slate-200 px-3 py-2 text-center">
                    {statusBadge(p.status_pendaftaran)}
                  </td>
                  <td className="border border-slate-200 px-3 py-2 text-center">
                    {pembayaranBadge(p.status_pembayaran)}
                  </td>
                  <td className="border border-slate-200 px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Link
                        to={`/pendaftar/${p.id}/invoice`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <FileText size={10} />
                        Invoice
                      </Link>
                      {p.status_pendaftaran === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(p.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700 transition hover:bg-emerald-100"
                          >
                            <CheckCircle size={10} />
                            Setuju
                          </button>
                          <button
                            onClick={() => handleReject(p.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-medium text-red-600 transition hover:bg-red-100"
                          >
                            <XCircle size={10} />
                            Tolak
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
          Menampilkan {data.length} pendaftaran
        </div>
      </div>
    </div>
  )
}
