import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { absensiKaryawanApi, shiftJadwalApi } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import KaryawanBottomNav from '../../components/KaryawanBottomNav'

const monthNamesID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export default function JadwalKaryawan() {
  const { user } = useAuth()
  const now = new Date()
  const [bulan, setBulan] = useState(now.getMonth() + 1)
  const [tahun, setTahun] = useState(now.getFullYear())
  const [jadwalMap, setJadwalMap] = useState<Record<string, { shift: { nama_shift: string; jam_masuk: string; jam_pulang: string } | null }>>({})
  const [todayShift, setTodayShift] = useState<{ nama: string; jam_mulai: string; jam_selesai: string } | null>(null)
  const [defaultShift, setDefaultShift] = useState<{ nama_shift: string; jam_masuk: string; jam_pulang: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    Promise.all([
      absensiKaryawanApi.shiftSaya().catch(() => ({ data: { data: null } })),
      shiftJadwalApi.getJadwal(user.id, { bulan, tahun }).catch(() => ({ data: { jadwals: {}, default_shift: null } })),
    ]).then(([shiftRes, jadwalRes]) => {
      setTodayShift(shiftRes?.data?.data || null)
      const map: Record<string, { shift: { nama_shift: string; jam_masuk: string; jam_pulang: string } | null }> = {}
      const raw = jadwalRes?.data?.jadwals || {}
      Object.entries(raw).forEach(([date, entries]: [string, any]) => {
        const entry = Array.isArray(entries) ? entries[0] : entries
        map[date] = {
          shift: entry?.shift ? { nama_shift: entry.shift.nama_shift, jam_masuk: entry.shift.jam_masuk, jam_pulang: entry.shift.jam_pulang } : null,
        }
      })
      setJadwalMap(map)
      setDefaultShift(jadwalRes?.data?.default_shift || null)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [user?.id, bulan, tahun])

  const navigateMonth = (dir: number) => {
    const d = new Date(tahun, bulan - 1 + dir, 1)
    setBulan(d.getMonth() + 1)
    setTahun(d.getFullYear())
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
      <div className="h-[3px] bg-gradient-to-r from-[#0069b0] via-[#0069b0] to-[#0069b0]" />

      {/* Header */}
      <div className="bg-white px-5 py-3.5 border-b border-[#E5E7EF] flex items-center gap-3">
        <a href="/dashboard-karyawan" className="text-[#8B90A0] hover:text-[#14182B] transition-colors">
          <ChevronLeft size={20} />
        </a>
        <div>
          <h1 className="text-sm font-bold text-[#14182B]">Jadwal Shift</h1>
          <p className="text-[11px] text-[#8B90A0] font-medium">Jadwal kerja karyawan</p>
        </div>
      </div>

      <div className="px-4 pt-4 pb-4 space-y-4 max-w-lg mx-auto">
        {/* Today's Shift */}
        {todayShift && (
          <section className="bg-white rounded-xl border border-[#E5E7EF] p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase">Shift Hari Ini</h3>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Aktif</span>
            </div>
            <div className="flex items-center gap-3 pl-3 border-l-2 border-[#0069b0]">
              <div className="flex-1">
                <p className="text-sm font-bold text-[#14182B]">{todayShift.nama}</p>
                <p className="text-[11px] text-[#8B90A0] font-medium">Status aktif</p>
              </div>
              <p className="text-sm font-bold text-[#0069b0] tabular-nums">{todayShift.jam_mulai}–{todayShift.jam_selesai}</p>
            </div>
          </section>
        )}

        {/* Calendar */}
        <section className="bg-white rounded-xl border border-[#E5E7EF] p-5">
          {/* Month Nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigateMonth(-1)} className="p-1.5 rounded-lg hover:bg-[#F4F5F8] text-[#8B90A0] hover:text-[#14182B] transition-colors">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-bold text-[#14182B]">{monthNamesID[bulan - 1]} {tahun}</span>
            <button onClick={() => navigateMonth(1)} className="p-1.5 rounded-lg hover:bg-[#F4F5F8] text-[#8B90A0] hover:text-[#14182B] transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 text-center mb-2">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
              <span key={d} className="text-[10px] font-bold text-[#8B90A0] py-1">{d}</span>
            ))}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-3 border-[#0069b0]/20 border-t-[#0069b0] rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7 text-center">
              {calendarDays.map((day, i) => {
                if (day === null) return <div key={`e-${i}`} />
                const ds = dateStr(day)
                const isToday = ds === todayStr
                const entry = jadwalMap[ds]
                const shiftName = entry?.shift?.nama_shift || defaultShift?.nama_shift
                const isLibur = !entry?.shift
                return (
                  <div key={ds}
                    className={`relative py-1.5 text-sm rounded-lg ${
                      isToday ? 'bg-[#0069b0]/10 font-bold' : ''
                    }`}
                  >
                    <span className={isToday ? 'text-[#0069b0]' : 'text-[#4B5063]'}>{day}</span>
                    {shiftName && !isLibur ? (
                      <span className="block text-[7px] text-emerald-600 font-semibold truncate px-0.5 leading-tight">{shiftName}</span>
                    ) : isLibur && entry ? (
                      <span className="block text-[7px] text-red-400 font-semibold">Libur</span>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 text-[10px] text-[#8B90A0] font-medium">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Shift terjadwal</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#0069b0]/10 border border-[#0069b0]/30" /> Hari ini</span>
          </div>
        </section>

        {/* Default Shift Info */}
        {defaultShift && (
          <section className="bg-white rounded-xl border border-[#E5E7EF] p-5">
            <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase mb-3">Shift Default</h3>
            <div className="flex items-center gap-3 pl-3 border-l-2 border-[#8B90A0]">
              <div className="flex-1">
                <p className="text-sm font-bold text-[#14182B]">{defaultShift.nama_shift}</p>
                <p className="text-[11px] text-[#8B90A0] font-medium">Shift bawaan karyawan</p>
              </div>
              <p className="text-sm font-bold text-[#8B90A0] tabular-nums">
                {defaultShift.jam_masuk?.substring(0, 5)}–{defaultShift.jam_pulang?.substring(0, 5)}
              </p>
            </div>
          </section>
        )}

        {/* No Data */}
        {!loading && !todayShift && !defaultShift && Object.keys(jadwalMap).length === 0 && (
          <div className="text-center py-12">
            <Calendar size={28} className="mx-auto text-[#D5D8E3] mb-3" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-[#4B5063]">Tidak ada jadwal shift</p>
            <p className="text-xs text-[#8B90A0] mt-1">Belum ada jadwal untuk bulan ini</p>
          </div>
        )}
      </div>

      <KaryawanBottomNav activeTab="jadwal" absenStatus="belum" hasJadwal={!!todayShift} />
    </div>
  )
}
