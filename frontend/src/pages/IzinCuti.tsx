import { useState, useEffect, useCallback } from 'react'
import { FileText, Search, RotateCcw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { izinApi } from '../services/api'
import type { Izin, Pagination } from '../types'

const jenisColors: Record<string, string> = {
  SAKIT: 'bg-rose-100 text-rose-700',
  CUTI: 'bg-blue-100 text-blue-700',
  IZIN: 'bg-amber-100 text-amber-700',
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
}

export default function IzinCutiPage() {
  const [data, setData] = useState<Izin[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterJenis, setFilterJenis] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Izin | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')
  const [rejectNote, setRejectNote] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, per_page: 50 }
      if (search) params.search = search
      if (filterJenis) params.jenis_izin = filterJenis
      if (filterStatus) params.status = filterStatus
      const res = await izinApi.list(params)
      setData(res.data.data)
      setPagination(res.data.pagination)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, search, filterJenis, filterStatus])

  useEffect(() => { fetchData() }, [fetchData])

  const resetFilter = () => {
    setSearch('')
    setFilterJenis('')
    setFilterStatus('')
    setPage(1)
  }

  const openConfirm = (item: Izin, type: 'approve' | 'reject') => {
    setSelected(item)
    setActionType(type)
    setRejectNote('')
    setShowConfirm(true)
  }

  const handleAction = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      if (actionType === 'approve') {
        await izinApi.approve(selected.id)
      } else {
        await izinApi.reject(selected.id, { catatan: rejectNote || undefined })
      }
      setShowConfirm(false)
      setSelected(null)
      fetchData()
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Gagal memproses izin')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (t: string) => {
    const d = new Date(t + 'T00:00:00')
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const periodLabel = (item: Izin) => {
    if (item.tgl_mulai === item.tgl_selesai) return formatDate(item.tgl_mulai)
    return `${formatDate(item.tgl_mulai)} - ${formatDate(item.tgl_selesai)}`
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] border border-blue-100">
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Izin & Cuti</h1>
            <p className="text-sm text-slate-500">Pengajuan izin dan cuti karyawan</p>
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
              <span key={s} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusColors[s] || 'bg-slate-100 text-slate-600'}`}>
                {s}: {count}
              </span>
            )
          })}
        </div>
      )}

      {/* Filter */}
      <div className="mb-4 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Cari nama atau NIP..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
          <select value={filterJenis} onChange={(e) => { setFilterJenis(e.target.value); setPage(1) }}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            <option value="">Semua Jenis</option>
            <option value="SAKIT">Sakit</option>
            <option value="CUTI">Cuti</option>
            <option value="IZIN">Izin</option>
          </select>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            <option value="">Semua Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Disetujui</option>
            <option value="REJECTED">Ditolak</option>
          </select>
          <button onClick={() => fetchData()}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700">
            <Search size={16} />
            Filter
          </button>
          <button onClick={resetFilter}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-full border-collapse text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-sm text-slate-600">
            <tr>
              <th className="border border-slate-200 px-4 py-3 font-medium">Karyawan</th>
              <th className="border border-slate-200 px-4 py-3 font-medium text-center">Jenis</th>
              <th className="border border-slate-200 px-4 py-3 font-medium">Periode</th>
              <th className="border border-slate-200 px-4 py-3 font-medium">Alasan</th>
              <th className="border border-slate-200 px-4 py-3 font-medium text-center">Status</th>
              <th className="border border-slate-200 px-4 py-3 font-medium">Diproses Oleh</th>
              <th className="border border-slate-200 px-4 py-3 font-medium">Tanggal Pengajuan</th>
              <th className="border border-slate-200 px-4 py-3 font-medium text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={8} className="border border-slate-200 px-4 py-3">
                    <div className="h-3 w-full rounded bg-slate-200/70" />
                  </td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={8} className="border border-slate-200 px-6 py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <FileText size={24} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-600">Tidak ada data izin & cuti</p>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="bg-white transition hover:bg-slate-50">
                  <td className="border border-slate-200 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(item.user?.name || '?')}&background=e5e7eb&color=6b7280&size=24`}
                        className="h-6 w-6 rounded-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{item.user?.name || '-'}</div>
                        <div className="text-[10px] text-slate-400">{item.user?.nip || item.user?.divisi?.nama_divisi || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-center">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${jenisColors[item.jenis_izin] || 'bg-slate-100 text-slate-600'}`}>
                      {item.jenis_izin}
                    </span>
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-xs text-slate-600">{periodLabel(item)}</td>
                  <td className="border border-slate-200 px-4 py-3 text-xs text-slate-600 max-w-[200px] truncate" title={item.alasan || ''}>{item.alasan || '-'}</td>
                  <td className="border border-slate-200 px-4 py-3 text-center">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[item.status] || 'bg-slate-100 text-slate-600'}`}>
                      {item.status === 'APPROVED' ? 'DISETUJUI' : item.status === 'REJECTED' ? 'DITOLAK' : item.status}
                    </span>
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-xs text-slate-500">{item.approver?.name || '-'}</td>
                  <td className="border border-slate-200 px-4 py-3 text-xs text-slate-500">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-center">
                    {item.status === 'PENDING' ? (
                      <div className="flex justify-center gap-1">
                        <button onClick={() => openConfirm(item, 'approve')}
                          className="rounded-lg border border-emerald-200 bg-white p-1.5 text-emerald-500 transition hover:bg-emerald-50 hover:text-emerald-600" title="Setujui">
                          <CheckCircle size={15} />
                        </button>
                        <button onClick={() => openConfirm(item, 'reject')}
                          className="rounded-lg border border-red-200 bg-white p-1.5 text-red-500 transition hover:bg-red-50 hover:text-red-600" title="Tolak">
                          <XCircle size={15} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400">-</span>
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
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">Halaman {pagination.current_page} dari {pagination.last_page} (total {pagination.total})</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition disabled:cursor-not-allowed disabled:opacity-50">Sebelumnya</button>
            <button disabled={page >= pagination.last_page} onClick={() => setPage(page + 1)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition disabled:cursor-not-allowed disabled:opacity-50">Selanjutnya</button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirm && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowConfirm(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-xl p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${actionType === 'approve' ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <AlertTriangle size={24} className={actionType === 'approve' ? 'text-emerald-500' : 'text-red-500'} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1 text-center">
              {actionType === 'approve' ? 'Setujui Izin' : 'Tolak Izin'}
            </h3>
            <p className="text-xs text-gray-500 mb-3 text-center">
              {selected.user?.name} - {selected.jenis_izin} ({periodLabel(selected)})
            </p>
            {actionType === 'reject' && (
              <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Catatan penolakan (opsional)"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 mb-3 resize-none" rows={3} />
            )}
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Batal</button>
              <button onClick={handleAction} disabled={submitting}
                className={`flex-1 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-50 transition-colors ${actionType === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
                {submitting ? 'Memproses...' : actionType === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
