import { useState, useEffect, useCallback } from 'react'
import { Clock, Search, RotateCcw, ChevronDown, AlertTriangle } from 'lucide-react'
import { kehadiranKhususApi } from '../../services/api'
import type { AbsensiKhusus, Divisi, Cabang } from '../../types'

const MONTHS_IND = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const statusColors: Record<string, string> = {
  BERJALAN: 'bg-[#ceead6] text-[#137333]',
  DITUNDA: 'bg-[#fef7e0] text-[#b06000]',
  SELESAI: 'bg-[#e8f0fe] text-[#1967d2]',
}

export default function DataKehadiranKhususPage() {
  const [data, setData] = useState<AbsensiKhusus[]>([])
  const [listCabang, setListCabang] = useState<Cabang[]>([])
  const [listDivisi, setListDivisi] = useState<Divisi[]>([])
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(now.getFullYear(), now.getMonth(), 1)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return d.toISOString().split('T')[0]
  })
  const [filterCabang, setFilterCabang] = useState('')
  const [filterDivisi, setFilterDivisi] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected] = useState<AbsensiKhusus | null>(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { start_date: startDate, end_date: endDate }
      if (filterCabang) params.cabang_id = filterCabang
      if (filterDivisi) params.divisi_id = filterDivisi
      if (filterStatus) params.status = filterStatus
      const res = await kehadiranKhususApi.list(params)
      setData(res.data.data)
      setListCabang(res.data.list_cabang || [])
      setListDivisi(res.data.list_divisi || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, filterCabang, filterDivisi, filterStatus])

  useEffect(() => { fetchData() }, [fetchData])

  const resetFilter = () => {
    const d = new Date()
    const sd = new Date(d.getFullYear(), d.getMonth(), 1)
    const ed = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    setStartDate(sd.toISOString().split('T')[0])
    setEndDate(ed.toISOString().split('T')[0])
    setFilterCabang('')
    setFilterDivisi('')
    setFilterStatus('')
  }

  const openStatusModal = (item: AbsensiKhusus) => {
    setSelected(item)
    setNewStatus(item.status)
    setShowStatusModal(true)
  }

  const handleUpdateStatus = async () => {
    if (!selected || !newStatus) return
    setSubmitting(true)
    try {
      await kehadiranKhususApi.updateStatus({ id: selected.id, status: newStatus })
      setShowStatusModal(false)
      setSelected(null)
      fetchData()
    } catch (err) {
      alert(err)
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (t: string | null) => {
    if (!t) return '-'
    return t.substring(0, 5)
  }

  const formatDate = (t: string) => {
    const raw = typeof t === 'string' ? t.split('T')[0] : String(t)
    const d = new Date(raw + 'T00:00:00')
    return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatDuration = (totalDetik: number | null) => {
    if (!totalDetik) return '-'
    const jam = Math.floor(totalDetik / 3600)
    const menit = Math.floor((totalDetik % 3600) / 60)
    return `${jam}j ${menit}m`
  }

  const monthLabel = () => {
    const m = startDate ? new Date(startDate + 'T00:00:00').getMonth() : now.getMonth()
    const y = startDate ? new Date(startDate + 'T00:00:00').getFullYear() : now.getFullYear()
    return `${MONTHS_IND[m]} ${y}`
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <Clock size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Data Kehadiran Khusus</h1>
            <p className="text-sm text-[#5f6368]">Riwayat absensi tugas khusus karyawan - {monthLabel()}</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#5f6368] shrink-0">Dari</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#5f6368] shrink-0">Sampai</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]" />
          </div>
          <select value={filterCabang} onChange={(e) => setFilterCabang(e.target.value)}
            className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]">
            <option value="">Semua Cabang</option>
            {listCabang.map((c) => (
              <option key={c.id} value={c.id}>{c.nama_cabang}</option>
            ))}
          </select>
          <select value={filterDivisi} onChange={(e) => setFilterDivisi(e.target.value)}
            className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]">
            <option value="">Semua Divisi</option>
            {listDivisi.map((d) => (
              <option key={d.id} value={d.id}>{d.nama_divisi}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]">
            <option value="">Semua Status</option>
            <option value="BERJALAN">Berjalan</option>
            <option value="DITUNDA">Ditunda</option>
            <option value="SELESAI">Selesai</option>
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

      {/* Summary */}
      {!loading && data.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {['BERJALAN', 'DITUNDA', 'SELESAI'].map((s) => {
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

      {/* Table */}
      <div className="relative overflow-x-auto border border-[#dadce0]">
        <table className="w-full min-w-full border-collapse text-left text-sm text-[#3c4043]">
          <thead className="text-sm text-[#5f6368]">
            <tr>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Tanggal</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Karyawan</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Divisi</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Mulai</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Selesai</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Durasi</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Status</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="h-3 w-full #e8eaed-\[#e8eaed\]" />
                  </td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]">
                    <Clock size={24} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-[#5f6368]">Tidak ada data kehadiran khusus</p>
                  <p className="text-xs text-[#80868b]">Coba ubah rentang tanggal atau filter</p>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="bg-white transition hover:bg-[#f8f9fa]">
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-xs font-medium text-[#3c4043]">{formatDate(item.tanggal)}</td>
                  <td className="border-b border-[#e8eaed] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(item.user?.name || '?')}&background=e5e7eb&color=6b7280&size=24`}
                        className="h-6 w-6 object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                      <div>
                        <div className="text-sm font-semibold text-[#202124]">{item.user?.name || '-'}</div>
                        <div className="text-[10px] text-[#80868b]">{item.user?.nip || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-xs text-[#5f6368]">{item.user?.divisi?.nama_divisi || '-'}</td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-center text-xs font-medium">{formatTime(item.jam_masuk)}</td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-center text-xs font-medium">{formatTime(item.jam_keluar)}</td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-center text-xs font-medium">{formatDuration(item.total_detik)}</td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-center">
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 ${statusColors[item.status] || 'bg-[#f1f3f4] text-[#5f6368]'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-center">
                    <button onClick={() => openStatusModal(item)}
                      className="inline-flex items-center gap-1 border border-[#dadce0] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#5f6368] transition hover:border-[#e8f0fe] hover:bg-[#e8f0fe] hover:text-[#1a73e8]">
                      <ChevronDown size={12} /> Ubah Status
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Update Status Modal */}
      {showStatusModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowStatusModal(false)}>
          <div className="absolute inset-0 #202124-\[#202124\]" />
          <div className="border border-[#dadce0] relative bg-white w-full max-w-sm shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-[#e8f0fe] flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} className="text-[#1a73e8]" />
            </div>
            <h3 className="font-semibold text-[#202124] mb-1 text-center">Ubah Status Kehadiran Khusus</h3>
            <p className="text-xs text-[#5f6368] mb-4 text-center">
              {selected.user?.name} - {formatDate(selected.tanggal)}
            </p>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] mb-4">
              <option value="BERJALAN">Berjalan</option>
              <option value="DITUNDA">Ditunda</option>
              <option value="SELESAI">Selesai</option>
            </select>
            <div className="flex gap-2">
              <button onClick={() => setShowStatusModal(false)}
                className="flex-1 py-2 text-sm font-medium border border-[#dadce0] text-[#5f6368] hover:bg-[#f8f9fa] transition-colors">
                Batal
              </button>
              <button onClick={handleUpdateStatus} disabled={submitting || newStatus === selected.status}
                className="flex-1 py-2 text-sm font-medium bg-[#0E6187] text-white hover:bg-[#202124] disabled:opacity-50 transition-colors">
                {submitting ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
