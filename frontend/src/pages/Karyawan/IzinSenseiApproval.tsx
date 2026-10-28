import { useState, useEffect, useCallback } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle,
  FileText,
  RefreshCw,
  RotateCcw,
  Search,
  Users,
  XCircle,
} from 'lucide-react'
import { izinSenseiApi } from '../../services/api'

interface IzinSenseiItem {
  id: number
  jenis_izin: string
  tgl_mulai: string
  tgl_selesai: string
  alasan: string | null
  jadwal_terdampak: 'SEMUA' | 'TERTENTU'
  jadwal_tertentu: string[] | null
  mekanisme_pengganti: 'USUL' | 'ADMIN'
  nama_pengganti: string | null
  catatan_pengganti: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  catatan_admin: string | null
  created_at: string | null
  user?: { id: number; name: string; nip: string | null } | null
  kelas?: {
    id: number
    nama_kelas: string
    level: string | number
    batch_relasi?: { id: number; nama_batch: string } | null
  } | null
}

interface Pagination {
  current_page: number
  last_page: number
  total: number
}

const jenisLabels: Record<string, string> = {
  IZIN_PRIBADI: 'Izin pribadi',
  SAKIT: 'Sakit',
  URUSAN_KELUARGA: 'Urusan keluarga',
  DINAS_LEMBAGA: 'Dinas / lembaga',
  IZIN_MENDADAK: 'Izin mendadak',
}

const jenisColors: Record<string, string> = {
  IZIN_PRIBADI: 'bg-[#e8f0fe] text-[#1967d2]',
  SAKIT: 'bg-[#f6d7d5] text-[#a50e0e]',
  URUSAN_KELUARGA: 'bg-[#fef7e0] text-[#b06000]',
  DINAS_LEMBAGA: 'bg-[#e6f4ea] text-[#137333]',
  IZIN_MENDADAK: 'bg-[#f3e8fd] text-[#8430ce]',
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-[#fef7e0] text-[#b06000]',
  APPROVED: 'bg-[#ceead6] text-[#137333]',
  REJECTED: 'bg-[#f6d7d5] text-[#a50e0e]',
}

const formatDate = (value: string) => {
  if (!value) return '-'
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const periodLabel = (item: IzinSenseiItem) =>
  item.tgl_mulai === item.tgl_selesai
    ? formatDate(item.tgl_mulai)
    : `${formatDate(item.tgl_mulai)} - ${formatDate(item.tgl_selesai)}`

export default function IzinSenseiApproval() {
  const [data, setData] = useState<IzinSenseiItem[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterJenis, setFilterJenis] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<IzinSenseiItem | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')
  const [rejectNote, setRejectNote] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const params: Record<string, string | number> = { page, per_page: 50 }
      if (search) params.search = search
      if (filterJenis) params.jenis_izin = filterJenis
      if (filterStatus) params.status = filterStatus
      const res = await izinSenseiApi.list(params)
      setData(res.data.data ?? [])
      setPagination({
        current_page: res.data.current_page ?? 1,
        last_page: res.data.last_page ?? 1,
        total: res.data.total ?? 0,
      })
    } catch (error) {
      const e = error as { response?: { status?: number; data?: { message?: string } } }
      setErrorMsg(
        e?.response?.data?.message
          ?? (e?.response?.status ? `Gagal memuat data (HTTP ${e.response.status}).` : 'Gagal terhubung ke server.')
      )
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

  const openConfirm = (item: IzinSenseiItem, type: 'approve' | 'reject') => {
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
        await izinSenseiApi.approve(selected.id)
      } else {
        await izinSenseiApi.reject(selected.id, { catatan_admin: rejectNote || undefined })
      }
      setShowConfirm(false)
      setSelected(null)
      fetchData()
    } catch (error) {
      const e = error as { response?: { data?: { message?: string } }; message?: string }
      alert(e?.response?.data?.message || e.message || 'Gagal memproses izin sensei')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {!loading && data.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {['PENDING', 'APPROVED', 'REJECTED'].map(status => {
            const count = data.filter(item => item.status === status).length
            if (count === 0) return null
            return (
              <span key={status} className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold ${statusColors[status] || 'bg-[#f1f3f4] text-[#5f6368]'}`}>
                {status}: {count}
              </span>
            )
          })}
        </div>
      )}

      <div className="mb-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#80868b]" />
            <input
              type="text"
              placeholder="Cari nama sensei, NIP, atau pengganti..."
              value={search}
              onChange={event => { setSearch(event.target.value); setPage(1) }}
              className="w-full border border-[#dadce0] bg-white py-2 pl-9 pr-3 text-sm text-[#3c4043] outline-none transition placeholder:text-[#80868b] focus:border-[#1a73e8]"
            />
          </div>
          <select
            value={filterJenis}
            onChange={event => { setFilterJenis(event.target.value); setPage(1) }}
            className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]"
          >
            <option value="">Semua Jenis</option>
            {Object.entries(jenisLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={event => { setFilterStatus(event.target.value); setPage(1) }}
            className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]"
          >
            <option value="">Semua Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Disetujui</option>
            <option value="REJECTED">Ditolak</option>
          </select>
          <button
            onClick={() => fetchData()}
            className="inline-flex items-center justify-center gap-2 bg-[#202124] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#3c4043]"
          >
            <Search size={16} /> Filter
          </button>
          <button
            onClick={resetFilter}
            className="inline-flex items-center justify-center gap-2 border border-[#dadce0] bg-white px-3 py-2 text-sm font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]"
          >
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </div>

      <div className="relative overflow-x-auto border border-[#dadce0]">
        <table className="w-full min-w-full border-collapse text-left text-sm text-[#3c4043]">
          <thead className="text-sm text-[#5f6368]">
            <tr>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Sensei</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Jenis</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Kelas / Batch</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Periode</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Jadwal</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Pengganti</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Alasan</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Status</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Diajukan</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="h-3 w-full bg-[#e8eaed]" />
                  </td>
                </tr>
              ))
            ) : errorMsg ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#fce8e6] text-[#d93025]">
                    <AlertTriangle size={24} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[#c5221f]">Gagal memuat data izin sensei</p>
                  <p className="mt-1 text-xs text-[#5f6368]">{errorMsg}</p>
                  <button
                    onClick={() => fetchData()}
                    className="mt-3 inline-flex items-center gap-1.5 bg-[#202124] px-4 py-2 text-[11px] font-bold text-white transition hover:bg-[#3c4043]"
                  >
                    <RefreshCw size={13} /> Coba lagi
                  </button>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]">
                    <FileText size={24} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-[#5f6368]">
                    {search || filterJenis || filterStatus
                      ? 'Tidak ada data yang cocok dengan filter'
                      : 'Tidak ada pengajuan izin sensei'}
                  </p>
                  {(search || filterJenis || filterStatus) && (
                    <button
                      onClick={resetFilter}
                      className="mt-3 inline-flex items-center gap-1.5 bg-[#202124] px-4 py-2 text-[11px] font-bold text-white transition hover:bg-[#3c4043]"
                    >
                      <RotateCcw size={13} /> Reset filter
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              data.map(item => (
                <tr key={item.id} className="bg-white transition hover:bg-[#f8f9fa]">
                  <td className="border-b border-[#e8eaed] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(item.user?.name || '?')}&background=e5e7eb&color=6b7280&size=24`}
                        className="h-6 w-6 object-cover"
                        onError={event => { (event.target as HTMLImageElement).style.display = 'none' }}
                      />
                      <div>
                        <div className="text-sm font-semibold text-[#202124]">{item.user?.name || '-'}</div>
                        <div className="text-[10px] text-[#80868b]">{item.user?.nip || 'Sensei'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-center">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 ${jenisColors[item.jenis_izin] || 'bg-[#f1f3f4] text-[#5f6368]'}`}>
                      {jenisLabels[item.jenis_izin] || item.jenis_izin}
                    </span>
                  </td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-xs text-[#5f6368]">
                    <div className="font-medium text-[#202124]">
                      {item.kelas?.batch_relasi?.nama_batch || item.kelas?.nama_kelas || '-'}
                    </div>
                    <div className="text-[10px] text-[#80868b]">Level {item.kelas?.level ?? '-'}</div>
                  </td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-xs text-[#5f6368] whitespace-nowrap">{periodLabel(item)}</td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-xs text-[#5f6368]">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#f1f3f4] text-[10px] font-semibold text-[#5f6368]"
                      title={(item.jadwal_tertentu ?? []).map(formatDate).join(', ')}
                    >
                      <CalendarDays size={11} />
                      {item.jadwal_terdampak === 'SEMUA'
                        ? 'Semua jadwal'
                        : `${item.jadwal_tertentu?.length ?? 0} jadwal`}
                    </span>
                  </td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-xs text-[#5f6368]">
                    {item.mekanisme_pengganti === 'USUL' ? (
                      <span className="inline-flex items-center gap-1 font-medium text-[#202124]">
                        <Users size={12} className="text-[#80868b]" />
                        {item.nama_pengganti || '-'}
                      </span>
                    ) : (
                      <span className="text-[#80868b]">Dicarikan admin</span>
                    )}
                  </td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-xs text-[#5f6368] max-w-[180px] truncate" title={item.alasan || ''}>
                    {item.alasan || '-'}
                  </td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-center">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 ${statusColors[item.status] || 'bg-[#f1f3f4] text-[#5f6368]'}`}>
                      {item.status === 'APPROVED' ? 'DISETUJUI' : item.status === 'REJECTED' ? 'DITOLAK' : item.status}
                    </span>
                    {item.catatan_admin && (
                      <p className="mt-1 text-[9px] text-[#80868b] max-w-[120px] truncate" title={item.catatan_admin}>{item.catatan_admin}</p>
                    )}
                  </td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-xs text-[#5f6368] whitespace-nowrap">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'}
                  </td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-center">
                    {item.status === 'PENDING' ? (
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => openConfirm(item, 'approve')}
                          className="border border-[#a8dab5] bg-white p-1.5 text-[#188038] transition hover:bg-[#e6f4ea] hover:text-[#137333]"
                          title="Setujui"
                        >
                          <CheckCircle size={15} />
                        </button>
                        <button
                          onClick={() => openConfirm(item, 'reject')}
                          className="border border-[#f28b82] bg-white p-1.5 text-[#d93025] transition hover:bg-[#fce8e6] hover:text-[#c5221f]"
                          title="Tolak"
                        >
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

      {pagination && pagination.last_page > 1 && (
        <div className="mt-4 flex flex-col gap-3 border border-[#dadce0] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#5f6368]">
            Halaman {pagination.current_page} dari {pagination.last_page} (total {pagination.total})
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="border border-[#dadce0] bg-white px-3 py-2 text-sm font-medium text-[#5f6368] transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <button
              disabled={page >= pagination.last_page}
              onClick={() => setPage(page + 1)}
              className="border border-[#dadce0] bg-white px-3 py-2 text-sm font-medium text-[#5f6368] transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}

      {showConfirm && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowConfirm(false)}>
          <div className="absolute inset-0 bg-[#202124]/40" />
          <div
            className="relative w-full max-w-md border border-[#dadce0] bg-white p-5 shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] sm:p-6"
            onClick={event => event.stopPropagation()}
          >
            <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center ${actionType === 'approve' ? 'bg-[#e6f4ea]' : 'bg-[#fce8e6]'}`}>
              <AlertTriangle size={24} className={actionType === 'approve' ? 'text-[#188038]' : 'text-[#d93025]'} />
            </div>
            <h3 className="mb-1 text-center font-semibold text-[#202124]">
              {actionType === 'approve' ? 'Setujui Izin Sensei' : 'Tolak Izin Sensei'}
            </h3>
            <p className="mb-1 text-center text-xs font-semibold text-[#3c4043]">
              {selected.user?.name} - {jenisLabels[selected.jenis_izin] || selected.jenis_izin}
            </p>
            <p className="mb-3 text-center text-[11px] text-[#5f6368]">
              {periodLabel(selected)} · {selected.kelas?.batch_relasi?.nama_batch || selected.kelas?.nama_kelas || '-'} · Level {selected.kelas?.level ?? '-'}
            </p>
            <div className="mb-3 space-y-1 border border-[#e8eaed] bg-[#f8f9fa] px-3 py-2 text-[11px] text-[#5f6368]">
              <p>
                <span className="font-semibold text-[#3c4043]">Jadwal:</span>{' '}
                {selected.jadwal_terdampak === 'SEMUA'
                  ? 'Semua jadwal pada tanggal tersebut'
                  : (selected.jadwal_tertentu ?? []).map(formatDate).join(', ') || '-'}
              </p>
              <p>
                <span className="font-semibold text-[#3c4043]">Pengganti:</span>{' '}
                {selected.mekanisme_pengganti === 'USUL'
                  ? selected.nama_pengganti || '-'
                  : 'Dicarikan admin / koordinator'}
              </p>
              {selected.catatan_pengganti && (
                <p>
                  <span className="font-semibold text-[#3c4043]">Catatan pengganti:</span> {selected.catatan_pengganti}
                </p>
              )}
            </div>
            {actionType === 'reject' && (
              <textarea
                value={rejectNote}
                onChange={event => setRejectNote(event.target.value)}
                placeholder="Catatan penolakan (opsional)"
                className="mb-3 w-full resize-none border border-[#dadce0] px-3 py-2 text-sm focus:border-[#1a73e8] focus:outline-none"
                rows={3}
              />
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 border border-[#dadce0] py-2 text-sm font-medium text-[#5f6368] transition-colors hover:bg-[#f8f9fa]"
              >
                Batal
              </button>
              <button
                onClick={handleAction}
                disabled={submitting}
                className={`flex-1 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${actionType === 'approve' ? 'bg-[#0E6187] hover:bg-[#084c63]' : 'bg-[#d93025] hover:bg-[#c5221f]'}`}
              >
                {submitting ? 'Memproses...' : actionType === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
