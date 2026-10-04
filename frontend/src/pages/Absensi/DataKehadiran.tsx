import { useState, useEffect, useCallback, useMemo } from 'react'
import { CalendarCheck, Search, RotateCcw, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertTriangle } from 'lucide-react'
import { kehadiranApi, APP_URL } from '../../services/api'
import type { Absensi, Divisi, Cabang } from '../../types'

const MONTHS_IND = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const statusColors: Record<string, string> = {
  HADIR: 'bg-[#ceead6] text-[#137333]',
  TERLAMBAT: 'bg-[#fef7e0] text-[#b06000]',
  IZIN: 'bg-[#e8f0fe] text-[#1967d2]',
  ALPA: 'bg-[#f6d7d5] text-[#a50e0e]',
  'PULANG LEBIH AWAL': 'bg-[#fef7e0] text-[#b06000]',
  'TIDAK ABSEN PULANG': 'bg-[#f6d7d5] text-[#a50e0e]',
  LIBUR: 'bg-[#f1f3f4] text-[#5f6368]',
}

interface VirtualUser {
  id: number
  name: string
  nip: string | null
  divisi: { nama_divisi: string } | null
}

function isWeekend(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  return day === 0 || day === 6
}

function isLibur(dateStr: string): boolean {
  if (isWeekend(dateStr)) return true
  return HARI_LIBUR.has(dateStr)
}

const HARI_LIBUR = new Set<string>()

function dateRangeArr(start: string, end: string) {
  const dates: string[] = []
  const cur = new Date(start + 'T00:00:00')
  const endD = new Date(end + 'T00:00:00')
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  while (cur <= endD && cur <= today) {
    dates.push(cur.toISOString().split('T')[0])
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

export default function DataKehadiranPage() {
  const [realData, setRealData] = useState<Absensi[]>([])
  const [users, setUsers] = useState<VirtualUser[]>([])
  const [listCabang, setListCabang] = useState<Cabang[]>([])
  const [listDivisi, setListDivisi] = useState<Divisi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Absensi | null>(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(50)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { start_date: startDate, end_date: endDate }
      if (filterCabang) params.cabang_id = filterCabang
      if (filterDivisi) params.divisi_id = filterDivisi
      if (filterStatus) params.status = filterStatus
      if (search) params.search = search
      const res = await kehadiranApi.list(params)
      const apiData = res.data
      if (apiData.status === 'error') {
        setError(apiData.message || 'Terjadi kesalahan server')
      } else {
        setError('')
        if (apiData.hari_libur) {
          HARI_LIBUR.clear()
          apiData.hari_libur.forEach((d: string) => HARI_LIBUR.add(d))
        }
        setRealData(apiData.data || [])
        setUsers(apiData.users || [])
        setListCabang(apiData.list_cabang || [])
        setListDivisi(apiData.list_divisi || [])
      }
    } catch (err) {
      console.error(err)
      setError('Gagal mengambil data kehadiran')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, filterCabang, filterDivisi, filterStatus, search])

  useEffect(() => { fetchData() }, [fetchData])

  const dates = useMemo(() => dateRangeArr(startDate, endDate), [startDate, endDate])

  const data = useMemo(() => {
    const result: any[] = [...realData]
    if (!filterStatus) {
      const realKeys = new Set(result.map((r: any) => `${r.user_id}_${(r.tanggal || '').split('T')[0]}`))
      let vId = 0
      for (const u of users) {
        for (const d of dates) {
          if (realKeys.has(`${u.id}_${d}`)) continue
          const libur = isLibur(d)
          result.push({
            id: `virtual_${vId++}`,
            user_id: u.id,
            shift_id: null,
            cabang_id: null,
            izin_id: null,
            tanggal: d,
            jam_masuk: null,
            jam_keluar: null,
            lat_masuk: null,
            long_masuk: null,
            lat_pulang: null,
            long_pulang: null,
            status: libur ? 'LIBUR' : 'ALPA',
            foto_masuk: null,
            foto_pulang: null,
            keterangan: libur ? 'Libur otomatis (Weekend/Nasional)' : 'Tidak melakukan absensi seharian',
            user: {
              id: u.id,
              name: u.name,
              nip: u.nip,
              shift: null,
              divisi: u.divisi,
            },
            shift: null,
            cabang: null,
          })
        }
      }
      result.sort((a: any, b: any) => {
        const da = (a.tanggal || '').split('T')[0]
        const db = (b.tanggal || '').split('T')[0]
        if (da > db) return -1
        if (da < db) return 1
        const ja = a.jam_masuk || ''
        const jb = b.jam_masuk || ''
        return ja < jb ? -1 : ja > jb ? 1 : 0
      })
    }
    return result
  }, [realData, users, dates, filterStatus])

  const totalPages = Math.max(1, Math.ceil(data.length / perPage))
  const safePage = Math.min(page, totalPages)
  const pagedList = data.slice((safePage - 1) * perPage, safePage * perPage)

  const resetFilter = () => {
    const d = new Date()
    const sd = new Date(d.getFullYear(), d.getMonth(), 1)
    const ed = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    setStartDate(sd.toISOString().split('T')[0])
    setEndDate(ed.toISOString().split('T')[0])
    setFilterCabang('')
    setFilterDivisi('')
    setFilterStatus('')
    setSearch('')
    setPage(1)
  }

  const openStatusModal = (item: Absensi) => {
    setSelected(item)
    setNewStatus(item.status)
    setShowStatusModal(true)
  }

  const handleUpdateStatus = async () => {
    if (!selected || !newStatus) return
    setSubmitting(true)
    try {
      const payload: Parameters<typeof kehadiranApi.updateStatus>[0] = { id: selected.id, status: newStatus }
      if (typeof selected.id === 'string' && selected.id.startsWith('virtual_')) {
        payload.user_id = selected.user_id
        payload.tanggal = selected.tanggal
        payload.shift_id = selected.shift_id
      }
      await kehadiranApi.updateStatus(payload)
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
            <CalendarCheck size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Data Kehadiran</h1>
            <p className="text-sm text-[#5f6368]">Riwayat kehadiran karyawan - {monthLabel()}</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-[#5f6368] shrink-0">Dari</span>
            <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
              className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]" />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-[#5f6368] shrink-0">Sampai</span>
            <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
              className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]" />
          </div>
          <select value={filterCabang} onChange={(e) => { setFilterCabang(e.target.value); setPage(1) }}
            className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]">
            <option value="">Semua Cabang</option>
            {listCabang.map((c) => (
              <option key={c.id} value={c.id}>{c.nama_cabang}</option>
            ))}
          </select>
          <select value={filterDivisi} onChange={(e) => { setFilterDivisi(e.target.value); setPage(1) }}
            className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]">
            <option value="">Semua Divisi</option>
            {listDivisi.map((d) => (
              <option key={d.id} value={d.id}>{d.nama_divisi}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
            className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]">
            <option value="">Semua Status</option>
            <option value="HADIR">Hadir</option>
            <option value="TERLAMBAT">Terlambat</option>
            <option value="IZIN">Izin</option>
            <option value="ALPA">Alpa</option>
            <option value="PULANG LEBIH AWAL">Pulang Lebih Awal</option>
            <option value="TIDAK ABSEN PULANG">Tidak Absen Pulang</option>
            <option value="LIBUR">Libur</option>
          </select>
          <div className="relative w-full md:flex-1 md:w-auto min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#80868b]" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Cari nama atau NIP..."
              className="w-full border border-[#dadce0] bg-white py-2 pl-9 pr-3 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]" />
          </div>
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

      {/* Error */}
      {error && (
        <div className="mb-4 border border-[#f28b82] bg-[#fce8e6] px-4 py-3 text-sm text-[#a50e0e]">
          {error}
        </div>
      )}

      {/* Summary */}
      {!loading && data.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {['HADIR', 'TERLAMBAT', 'IZIN', 'ALPA', 'PULANG LEBIH AWAL', 'TIDAK ABSEN PULANG', 'LIBUR'].map((s) => {
            const count = data.filter((d) => d.status === s).length
            if (count === 0) return null
            return (
              <span key={s} className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold ${statusColors[s] || 'bg-[#f1f3f4] text-[#5f6368]'}`}>
                {s.replace(/_/g, ' ')}: {count}
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
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Shift</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Cabang</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Masuk</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Pulang</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Foto Masuk</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Foto Pulang</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Lokasi</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Status</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={11} className="px-6 py-12 text-center">
                    <div className="h-3 w-full #e8eaed-\[#e8eaed\]" />
                  </td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]">
                    <CalendarCheck size={24} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-[#5f6368]">Tidak ada data kehadiran</p>
                  <p className="text-xs text-[#80868b]">Coba ubah rentang tanggal atau filter</p>
                </td>
              </tr>
            ) : (
              pagedList.map((item) => (
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
                        <div className="text-[10px] text-[#80868b]">{item.user?.nip || item.user?.divisi?.nama_divisi || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-xs text-[#5f6368]">{item.shift?.nama_shift || item.user?.shift?.nama_shift || '-'}</td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-xs text-[#5f6368]">{item.cabang?.nama_cabang || '-'}</td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-center text-xs font-medium">{formatTime(item.jam_masuk)}</td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-center text-xs font-medium">{formatTime(item.jam_keluar)}</td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-center">
                    {item.foto_masuk ? (
                      <a href={`${APP_URL}/storage/${item.foto_masuk}`} target="_blank" rel="noopener noreferrer">
                        <img src={`${APP_URL}/storage/${item.foto_masuk}`} alt="foto masuk" className="mx-auto h-8 w-8 object-cover border border-[#dadce0] hover:ring-2 hover:ring-[#1a73e8]" />
                      </a>
                    ) : <span className="text-[10px] text-[#9aa0a6]">—</span>}
                  </td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-center">
                    {item.foto_pulang ? (
                      <a href={`${APP_URL}/storage/${item.foto_pulang}`} target="_blank" rel="noopener noreferrer">
                        <img src={`${APP_URL}/storage/${item.foto_pulang}`} alt="foto pulang" className="mx-auto h-8 w-8 object-cover border border-[#dadce0] hover:ring-2 hover:ring-[#1a73e8]" />
                      </a>
                    ) : <span className="text-[10px] text-[#9aa0a6]">—</span>}
                  </td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-center">
                    {item.lat_masuk && item.long_masuk ? (
                      <a href={`https://www.google.com/maps?q=${item.lat_masuk},${item.long_masuk}`} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-[#1a73e8] hover:underline whitespace-nowrap"
                        title={`Klik untuk buka Google Maps\nMasuk: ${item.lat_masuk}, ${item.long_masuk}${item.lat_pulang ? `\nPulang: ${item.lat_pulang}, ${item.long_pulang}` : ''}`}>
                        📍 {item.cabang?.nama_cabang || 'Lihat Peta'}
                      </a>
                    ) : <span className="text-[10px] text-[#9aa0a6]">—</span>}
                  </td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-center">
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 ${statusColors[item.status] || 'bg-[#f1f3f4] text-[#5f6368]'}`}>
                      {item.status?.replace(/_/g, ' ')}
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

      {/* Pagination */}
      {!loading && data.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 border border-[#dadce0] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-[#5f6368]">
            <span>Per halaman</span>
            <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}
              className="border border-[#dadce0] bg-white px-2 py-1.5 text-sm font-medium text-[#3c4043] outline-none transition focus:border-[#1a73e8]">
              {[25, 50, 100, 200].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span>Menampilkan {pagedList.length} dari {data.length} data</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={safePage <= 1}
              className="border border-[#dadce0] bg-white p-1.5 text-[#5f6368] transition hover:bg-[#f8f9fa] disabled:opacity-30 disabled:pointer-events-none">
              <ChevronsLeft size={16} />
            </button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
              className="border border-[#dadce0] bg-white p-1.5 text-[#5f6368] transition hover:bg-[#f8f9fa] disabled:opacity-30 disabled:pointer-events-none">
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
                  <span key={`dots-${i}`} className="px-1 text-sm text-[#9aa0a6]">...</span>
                ) : (
                  <button key={p} onClick={() => setPage(p)}
                    className={`min-w-[32px] border px-2 py-1.5 text-sm font-medium transition ${ p === safePage ? 'border-[#dadce0] bg-[#202124] text-white' : 'border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f8f9fa]' }`}>
                    {p}
                  </button>
                )
              )
            })()}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
              className="border border-[#dadce0] bg-white p-1.5 text-[#5f6368] transition hover:bg-[#f8f9fa] disabled:opacity-30 disabled:pointer-events-none">
              <ChevronRight size={16} />
            </button>
            <button onClick={() => setPage(totalPages)} disabled={safePage >= totalPages}
              className="border border-[#dadce0] bg-white p-1.5 text-[#5f6368] transition hover:bg-[#f8f9fa] disabled:opacity-30 disabled:pointer-events-none">
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowStatusModal(false)}>
          <div className="absolute inset-0 #202124-\[#202124\]" />
          <div className="border border-[#dadce0] relative bg-white w-full max-w-sm shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-[#e8f0fe] flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} className="text-[#1a73e8]" />
            </div>
            <h3 className="font-semibold text-[#202124] mb-1 text-center">Ubah Status Kehadiran</h3>
            <p className="text-xs text-[#5f6368] mb-4 text-center">
              {selected.user?.name} - {formatDate(selected.tanggal)}
            </p>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] mb-4">
              <option value="HADIR">Hadir</option>
              <option value="TERLAMBAT">Terlambat</option>
              <option value="IZIN">Izin</option>
              <option value="ALPA">Alpa</option>
              <option value="PULANG LEBIH AWAL">Pulang Lebih Awal</option>
              <option value="LIBUR">Libur</option>
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
