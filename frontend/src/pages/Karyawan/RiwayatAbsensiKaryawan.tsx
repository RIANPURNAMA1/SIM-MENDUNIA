import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { absensiKaryawanApi } from '../../services/api'
import KaryawanBottomNav from '../../components/KaryawanBottomNav'

const dayAbbr = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB']
const fullDayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const monthNamesID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

interface RiwayatItem {
  id: any
  tanggal: string
  jam_masuk: string | null
  jam_keluar: string | null
  status: string
  role?: string | null
  shift?: { nama: string } | null
}

export default function RiwayatAbsensiKaryawan() {
  const now = new Date()
  const [riwayat, setRiwayat] = useState<RiwayatItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Semua')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [bulan, setBulan] = useState(now.getMonth() + 1)
  const [tahun, setTahun] = useState(now.getFullYear())

  useEffect(() => {
    setLoading(true)
    absensiKaryawanApi.riwayat({ limit: 50, bulan, tahun })
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data?.data || []
        setRiwayat(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [bulan, tahun])

  const datesWithData = new Set(riwayat.map(r => r.tanggal))

  const filtered = (() => {
    let items = riwayat
    if (selectedDate) {
      items = items.filter(r => r.tanggal === selectedDate)
    }
    if (filter === 'Semua') return items
    return items.filter(r => {
      const st = r.status?.toLowerCase()
      if (filter === 'Hadir') return st === 'hadir'
      if (filter === 'Terlambat') return st === 'terlambat'
      if (filter === 'Alpa') return st === 'alpa'
      if (filter === 'Karyawan') return r.role === 'KARYAWAN'
      if (filter === 'Sensei') return r.role === 'SENSEI'
      return true
    })
  })()

  const navigateMonth = (dir: number) => {
    const d = new Date(tahun, bulan - 1 + dir, 1)
    setBulan(d.getMonth() + 1)
    setTahun(d.getFullYear())
    setSelectedDate(null)
  }

  const firstDay = new Date(tahun, bulan - 1, 1).getDay()
  const daysInMonth = new Date(tahun, bulan, 0).getDate()
  const todayStr = new Date().toISOString().slice(0, 10)

  const calendarDays: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) calendarDays.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d)

  const dateStr = (day: number) => {
    const m = String(bulan).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    return `${tahun}-${m}-${dd}`
  }

  return (
    <div className="min-h-screen bg-[#F4F5F8] pb-24">
      {/* Top Bar */}
      <div className="bg-white px-4 py-4 border-b border-[#E5E7EF] flex items-center gap-3 sticky top-0 z-10">
        <a href="/dashboard-karyawan" className="text-[#8B90A0] hover:text-[#14182B] transition-colors">
          <ChevronLeft size={20} />
        </a>
        <h1 className="text-base font-bold text-[#14182B]">Riwayat Absensi</h1>
        <span className="text-xs text-[#8B90A0] font-medium ml-auto">{monthNamesID[bulan - 1]} {tahun}</span>
      </div>

      {/* Calendar */}
      <div className="bg-white border-b border-[#E5E7EF]">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-3">
          {/* Month Nav */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => navigateMonth(-1)} className="p-1.5 rounded-lg hover:bg-[#F4F5F8] text-[#8B90A0] hover:text-[#14182B] transition-colors">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-bold text-[#14182B]">{monthNamesID[bulan - 1]} {tahun}</span>
            <button onClick={() => navigateMonth(1)} className="p-1.5 rounded-lg hover:bg-[#F4F5F8] text-[#8B90A0] hover:text-[#14182B] transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 text-center mb-1">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
              <span key={d} className="text-[10px] font-bold text-[#8B90A0] py-1">{d}</span>
            ))}
          </div>

          {/* Date Grid */}
          <div className="grid grid-cols-7 text-center">
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />
              const ds = dateStr(day)
              const isToday = ds === todayStr
              const hasData = datesWithData.has(ds)
              const isSelected = ds === selectedDate
              return (
                <button key={ds}
                  onClick={() => setSelectedDate(isSelected ? null : ds)}
                  className={`relative py-1.5 text-sm rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-[#0069b0] text-white font-bold'
                      : isToday
                        ? 'bg-[#0069b0]/10 text-[#0069b0] font-bold'
                        : 'text-[#4B5063] hover:bg-[#F4F5F8]'
                  }`}
                >
                  {day}
                  {hasData && (
                    <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-[#0069b0]'
                    }`} />
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-2.5 text-[10px] text-[#8B90A0] font-medium">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#0069b0]" /> Ada absensi</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#0069b0]/10 border border-[#0069b0]/30" /> Hari ini</span>
          </div>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="bg-white px-4 py-3 border-b border-[#E5E7EF] flex gap-1.5 overflow-x-auto scrollbar-none">
        {['Semua', 'Karyawan', 'Sensei', 'Hadir', 'Terlambat', 'Alpa'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors ${
              filter === f
                ? 'bg-[#0069b0] text-white'
                : 'bg-[#F4F5F8] text-[#6B7280] hover:bg-[#E5E7EF]'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="px-4 pt-4 max-w-lg mx-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#0069b0]/20 border-t-[#0069b0] rounded-full animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="bg-white rounded-xl border border-[#E5E7EF] overflow-hidden">
            {filtered.map(r => {
              const d = new Date(r.tanggal)
              const dayIdx = d.getDay()
              const tgl = d.getDate()
              const status = r.status === 'hadir' ? 'HADIR' : r.status === 'libur' ? 'LIBUR' : r.status === 'izin' ? 'IZIN' : r.status?.toUpperCase() || '—'
              const statusStyle =
                status === 'HADIR' ? 'bg-[#DCFCE7] text-[#15803D]' :
                status === 'LIBUR' ? 'bg-[#F0F1F5] text-[#6B7280]' :
                status === 'IZIN' ? 'bg-[#FEF3C7] text-[#B45309]' :
                'bg-[#FEE2E2] text-[#B91C1C]'
              return (
                <div key={r.id} className="flex items-start gap-3 px-4 py-3.5 border-t border-[#F0F1F5] first:border-t-0">
                  <div className="flex flex-col items-center w-10 flex-none">
                    <span className="text-[10px] font-bold text-[#8B90A0] tracking-wider">{dayAbbr[dayIdx]}</span>
                    <span className="text-lg font-bold text-[#14182B] -mt-0.5">{tgl}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-bold text-[#6B7280] bg-[#F0F1F5] px-1.5 py-0.5 rounded-sm tracking-wide">{r.role || 'KARYAWAN'}</span>
                      <span className="text-xs font-semibold text-[#14182B] truncate">{r.shift?.nama || 'Dateng Pagi'}</span>
                    </div>
                    <p className="text-[11px] text-[#8B90A0] font-medium">{fullDayNames[dayIdx]}, {tgl} {monthNamesID[d.getMonth()]}</p>
                    <div className="flex items-center gap-2 mt-1 tabular-nums">
                      <span className="text-xs font-semibold text-[#14182B]">{r.jam_masuk ? r.jam_masuk.slice(0, 8) : '—'}</span>
                      <span className="text-[10px] text-[#C5C8D4]">—</span>
                      <span className="text-xs font-semibold text-[#14182B]">{r.jam_keluar ? r.jam_keluar.slice(0, 8) : '—'}</span>
                    </div>
                  </div>
                  <span className={`shrink-0 px-2 py-1 rounded-md text-[10px] font-bold self-center ${statusStyle}`}>{status}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm font-semibold text-[#4B5063]">
              {selectedDate ? 'Tidak ada absensi pada tanggal ini' : 'Belum ada riwayat absensi'}
            </p>
          </div>
        )}
      </div>
      <KaryawanBottomNav activeTab="laporan" onAbsenClick={() => window.location.href = '/dashboard-karyawan'} />
    </div>
  )
}
