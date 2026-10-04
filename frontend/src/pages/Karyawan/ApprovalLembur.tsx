import { useState, useEffect, useCallback } from 'react'
import { Clock, Search, RotateCcw, CheckCircle, XCircle, AlertTriangle, Image } from 'lucide-react'
import { lemburApi, APP_URL } from '../../services/api'
import type { Lembur, Pagination } from '../../types'

const statusColors: Record<string, string> = {
  PENDING: 'bg-[#fef7e0] text-[#b06000]',
  APPROVED: 'bg-[#ceead6] text-[#137333]',
  REJECTED: 'bg-[#f6d7d5] text-[#a50e0e]',
}

export default function ApprovalLemburPage() {
  const [data, setData] = useState<Lembur[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Lembur | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [approveAction, setApproveAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED')
  const [submitting, setSubmitting] = useState(false)
  const [showImage, setShowImage] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, per_page: 50 }
      if (search) params.search = search
      if (filterStatus) params.status = filterStatus
      const res = await lemburApi.list(params)
      setData(res.data.data)
      setPagination(res.data.pagination)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, search, filterStatus])

  useEffect(() => { fetchData() }, [fetchData])

  const resetFilter = () => {
    setSearch('')
    setFilterStatus('')
    setPage(1)
  }

  const openConfirm = (item: Lembur, action: 'APPROVED' | 'REJECTED') => {
    setSelected(item)
    setApproveAction(action)
    setShowConfirm(true)
  }

  const handleAction = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      await lemburApi.updateStatus(selected.id, { status: approveAction })
      setShowConfirm(false)
      setSelected(null)
      fetchData()
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Gagal memproses')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (t: string | null) => {
    if (!t) return '-'
    const d = new Date(t)
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatTime = (t: string | null) => {
    if (!t) return '-'
    const d = new Date(t)
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  const fotoUrl = (foto: string) => `${APP_URL}/uploads/lembur/${foto}`

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <Clock size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Approval Lembur</h1>
            <p className="text-sm text-[#5f6368]">Pengajuan lembur karyawan</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      {!loading && data.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {['PENDING', 'APPROVED', 'REJECTED'].map((s) => {
            const count = data.filter((d) => d.status === s).length
            if (count === 0) return null
            return (
              <span key={s} className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold ${statusColors[s] || 'bg-[#f1f3f4] text-[#5f6368]'}`}>
                {s}: {count}
              </span>
            )
          })}
        </div>
      )}

      {/* Filter */}
      <div className="mb-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#80868b]" />
            <input type="text" placeholder="Cari nama atau NIP..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full border border-[#dadce0] bg-white py-2 pl-9 pr-3 text-sm text-[#3c4043] outline-none transition placeholder:text-[#80868b] focus:border-[#1a73e8]" />
          </div>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
            className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]">
            <option value="">Semua Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Disetujui</option>
            <option value="REJECTED">Ditolak</option>
          </select>
          <button onClick={() => fetchData()}
            className="inline-flex items-center justify-center gap-2 bg-[#202124] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#3c4043]">
            <Search size={16} />
            Filter
          </button>
          <button onClick={resetFilter}
            className="inline-flex items-center justify-center gap-2 border border-[#dadce0] bg-white px-3 py-2 text-sm font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]">
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto border border-[#dadce0]">
        <table className="w-full min-w-full border-collapse text-left text-sm text-[#3c4043]">
          <thead className="text-sm text-[#5f6368]">
            <tr>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Karyawan</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Divisi</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Tanggal</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Mulai</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Selesai</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Keterangan</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Bukti</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Status</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="h-3 w-full bg-[#e8eaed]" />
                  </td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]">
                    <Clock size={24} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-[#5f6368]">Tidak ada data lembur</p>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="bg-white transition hover:bg-[#f8f9fa]">
                  <td className="border-b border-[#e8eaed] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(item.user?.name || '?')}&background=e5e7eb&color=6b7280&size=24`}
                        className="h-6 w-6 object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                      <span className="text-sm font-semibold text-[#202124]">{item.user?.name || '-'}</span>
                    </div>
                  </td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-xs text-[#5f6368]">{item.user?.divisi?.nama_divisi || '-'}</td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-xs text-[#5f6368]">{formatDate(item.created_at)}</td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-center text-xs font-medium">{formatTime(item.jam_masuk)}</td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-center text-xs font-medium">{formatTime(item.jam_keluar)}</td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-xs text-[#5f6368] max-w-[200px] truncate" title={item.keterangan}>{item.keterangan}</td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-center">
                    <button onClick={() => setShowImage(fotoUrl(item.foto))}
                      className="inline-flex items-center gap-1 border border-[#dadce0] bg-white px-2 py-1 text-[10px] font-medium text-[#5f6368] transition hover:border-[#e8f0fe] hover:bg-[#e8f0fe] hover:text-[#1a73e8]">
                      <Image size={12} /> Lihat
                    </button>
                  </td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-center">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 ${statusColors[item.status] || 'bg-[#f1f3f4] text-[#5f6368]'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-center">
                    {item.status === 'PENDING' ? (
                      <div className="flex justify-center gap-1">
                        <button onClick={() => openConfirm(item, 'APPROVED')}
                          className="border border-[#a8dab5] bg-white p-1.5 text-[#188038] transition hover:bg-[#e6f4ea] hover:text-[#137333]" title="Setujui">
                          <CheckCircle size={15} />
                        </button>
                        <button onClick={() => openConfirm(item, 'REJECTED')}
                          className="border border-[#f28b82] bg-white p-1.5 text-[#d93025] transition hover:bg-[#fce8e6] hover:text-[#c5221f]" title="Tolak">
                          <XCircle size={15} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#80868b]">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.last_page > 1 && (
        <div className="mt-4 flex flex-col gap-3 border border-[#dadce0] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#5f6368]">Halaman {pagination.current_page} dari {pagination.last_page} (total {pagination.total})</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}
              className="border border-[#dadce0] bg-white px-3 py-2 text-sm font-medium text-[#5f6368] transition disabled:cursor-not-allowed disabled:opacity-50">Sebelumnya</button>
            <button disabled={page >= pagination.last_page} onClick={() => setPage(page + 1)}
              className="border border-[#dadce0] bg-white px-3 py-2 text-sm font-medium text-[#5f6368] transition disabled:cursor-not-allowed disabled:opacity-50">Selanjutnya</button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirm && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowConfirm(false)}>
          <div className="absolute inset-0 bg-[#202124]" />
          <div className="border border-[#dadce0] relative bg-white w-full max-w-sm shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className={`w-12 h-12 flex items-center justify-center mx-auto mb-3 ${approveAction === 'APPROVED' ? 'bg-[#e6f4ea]' : 'bg-[#fce8e6]'}`}>
              <AlertTriangle size={24} className={approveAction === 'APPROVED' ? 'text-[#188038]' : 'text-[#d93025]'} />
            </div>
            <h3 className="font-semibold text-[#202124] mb-1 text-center">
              {approveAction === 'APPROVED' ? 'Setujui Lembur' : 'Tolak Lembur'}
            </h3>
            <p className="text-xs text-[#5f6368] mb-5 text-center">
              {selected.user?.name} - {formatDate(selected.created_at)}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 text-sm font-medium border border-[#dadce0] text-[#5f6368] hover:bg-[#f8f9fa] transition-colors">Batal</button>
              <button onClick={handleAction} disabled={submitting}
                className={`flex-1 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors ${approveAction === 'APPROVED' ? 'bg-[#0E6187] hover:bg-[#084c63]' : 'bg-[#d93025] hover:bg-[#c5221f]'}`}>
                {submitting ? 'Memproses...' : approveAction === 'APPROVED' ? 'Ya, Setujui' : 'Ya, Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {showImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202124]" onClick={() => setShowImage(null)}>
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <img src={showImage} alt="Bukti Lembur" className="border border-[#dadce0] w-full shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)]" />
            <button onClick={() => setShowImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white flex items-center justify-center text-[#5f6368] hover:text-[#202124]">
              <XCircle size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
