import { useEffect, useRef, useState, type RefObject, type MutableRefObject } from 'react'
import { Link } from 'react-router-dom'
import { Chart, registerables } from 'chart.js'
import { FileText, HeartPulse, CalendarCheck, CalendarDays, Timer, Clock, ArrowRight } from 'lucide-react'
import LocationTracker from '../../components/LocationTracker'

Chart.register(...registerables)

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Pagi'
  if (h < 15) return 'Siang'
  if (h < 18) return 'Sore'
  return 'Malam'
}

function formatDate() {
  const d = new Date()
  return `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`
}

function formatTime() {
  return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const dummyStats = {
  totalKaryawan: 45,
  karyawanAktif: 42,
  hadirHariIni: 28,
  tepatWaktu: 22,
  terlambat: 6,
  tidakHadir: 8,
  izinCuti: 3,
  izinPending: 2,
}

const dummyBarData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
  hadir: [85, 92, 88, 95, 90, 87],
  terlambat: [12, 8, 10, 6, 9, 11],
  alpa: [5, 3, 4, 2, 3, 4],
  libur: [8, 10, 6, 12, 7, 9],
}

const dummyDonut = { hadir: 28, terlambat: 6, izin: 3, alpa: 8 }

const dummyRasio = {
  labels: ['Marketing', 'IT', 'HR', 'Finance', 'Operasional'],
  hadir: [92, 88, 95, 90, 85],
  terlambat: [8, 12, 5, 10, 15],
}

const dummyIzin = [
  { name: 'Lutfi Nurul Hasanah', date: '10 Feb 2026', cabang: 'Cabang Cianjur', status: 'SAKIT', avatar: null },
  { name: 'Ahmad Rizki', date: '09 Feb 2026', cabang: 'Cabang Bandung', status: 'IZIN', avatar: null },
  { name: 'Siti Aisyah', date: '08 Feb 2026', cabang: 'Pusat', status: 'SAKIT', avatar: null },
  { name: 'Dewi Lestari', date: '07 Feb 2026', cabang: 'Cabang Cianjur', status: 'IZIN', avatar: null },
]

const dummyLembur = [
  { name: 'Budi Santoso', jam: 3, date: '10 Feb', inisial: 'BS' },
  { name: 'Andi Pratama', jam: 2, date: '09 Feb', inisial: 'AP' },
  { name: 'Rina Wijaya', jam: 4, date: '08 Feb', inisial: 'RW' },
]

interface StatCardProps {
  icon: string
  iconColor: string
  label: string
  value: number
  unit: string
  valueColor?: string
  footer?: string
  progress?: number
  progressColor?: string
}

export default function Dashboard() {
  const barRef: RefObject<HTMLCanvasElement | null> = useRef<HTMLCanvasElement | null>(null)
  const donutRef: RefObject<HTMLCanvasElement | null> = useRef<HTMLCanvasElement | null>(null)
  const rasioRef: RefObject<HTMLCanvasElement | null> = useRef<HTMLCanvasElement | null>(null)
  const barChartRef: MutableRefObject<Chart | null> = useRef<Chart | null>(null)
  const donutChartRef: MutableRefObject<Chart | null> = useRef<Chart | null>(null)
  const rasioChartRef: MutableRefObject<Chart | null> = useRef<Chart | null>(null)
  const [time, setTime] = useState<string>(formatTime())
  const [showFilter, setShowFilter] = useState<boolean>(false)

  useEffect(() => {
    const timer = setInterval(() => setTime(formatTime()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Bar Chart
  useEffect(() => {
    if (!barRef.current) return
    if (barChartRef.current) barChartRef.current.destroy()
    barChartRef.current = new Chart(barRef.current, {
      type: 'bar',
      data: {
        labels: dummyBarData.labels,
        datasets: [
          { label: 'Hadir', data: dummyBarData.hadir, backgroundColor: '#1877f2', borderRadius: 2 },
          { label: 'Terlambat', data: dummyBarData.terlambat, backgroundColor: '#f59e0b', borderRadius: 2 },
          { label: 'Alpa', data: dummyBarData.alpa, backgroundColor: '#e41e3f', borderRadius: 2 },
          { label: 'Libur', data: dummyBarData.libur, backgroundColor: '#10b981', borderRadius: 2 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: { beginAtZero: true, grid: { color: '#f0f2f5' }, ticks: { font: { size: 11 } } },
        },
      },
    })
    return () => { if (barChartRef.current) barChartRef.current.destroy() }
  }, [])

  // Donut Chart
  useEffect(() => {
    if (!donutRef.current) return
    if (donutChartRef.current) donutChartRef.current.destroy()
    donutChartRef.current = new Chart(donutRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Hadir', 'Terlambat', 'Izin', 'Alpa'],
        datasets: [{
          data: [dummyDonut.hadir, dummyDonut.terlambat, dummyDonut.izin, dummyDonut.alpa],
          backgroundColor: ['#1877f2', '#f59e0b', '#2e7d32', '#e41e3f'],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 10, usePointStyle: true, font: { size: 11 } },
          },
        },
      },
    })
    return () => { if (donutChartRef.current) donutChartRef.current.destroy() }
  }, [])

  // Rasio Chart
  useEffect(() => {
    if (!rasioRef.current) return
    if (rasioChartRef.current) rasioChartRef.current.destroy()
    rasioChartRef.current = new Chart(rasioRef.current, {
      type: 'line',
      data: {
        labels: dummyRasio.labels,
        datasets: [
          {
            label: 'Tepat Waktu',
            data: dummyRasio.hadir,
            borderColor: '#1877f2',
            backgroundColor: 'rgba(24, 119, 242, 0.08)',
            pointBackgroundColor: '#1877f2',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2.5,
            tension: 0.3,
            fill: true,
          },
          {
            label: 'Terlambat',
            data: dummyRasio.terlambat,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            pointBackgroundColor: '#f59e0b',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2.5,
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: { usePointStyle: true, padding: 16, font: { size: 11 } },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ctx.dataset.label + ': ' + ctx.raw + '%',
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: {
            beginAtZero: true, max: 100,
            grid: { color: '#f0f2f5' },
            ticks: { font: { size: 10 }, callback: (v: string | number) => v + '%' },
          },
        },
      },
    })
    return () => { if (rasioChartRef.current) rasioChartRef.current.destroy() }
  }, [])

  const ptg = (dummyStats.terlambat / (dummyStats.totalKaryawan || 1)) * 100

  return (
    <div className="px-3 sm:px-6 py-3 sm:py-4">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <img
              src="https://ui-avatars.com/api/?name=Admin&background=1877f2&color=fff&size=80"
              className="rounded-full border-2 border-white shadow-sm"
              style={{ width: 44, height: 44, objectFit: 'cover' }}
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { e.target.style.display = 'none' }}
            />
            <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
          </div>
          <div className="min-w-0">
            <h5 className="font-bold text-gray-900 text-base sm:text-lg m-0 truncate">
              Selamat {getGreeting()}, Admin
            </h5>
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              <span className="bg-blue-50 text-blue-600 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded whitespace-nowrap">
                <i className="ph ph-suitcase-simple me-1"></i>Administrator
              </span>
              <small className="text-gray-400 text-[10px] sm:text-[11px]">
                <i className="ph ph-calendar-blank me-1"></i>{formatDate()}
              </small>
            </div>
          </div>
        </div>
        <div className="hidden sm:block flex-shrink-0">
          <span className="bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-full shadow-sm text-xs font-medium">
            <i className="ph ph-clock me-1"></i>{time} WIB
          </span>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 mb-4">
        <div className="sm:hidden mb-2">
          <button
            type="button"
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center justify-between w-full text-sm text-gray-600 font-medium"
          >
            <span><i className="ph ph-funnel me-1"></i>Filter</span>
            <i className={`ph ph-caret-down text-sm transition-transform ${showFilter ? 'rotate-180' : ''}`}></i>
          </button>
        </div>
        <form className={`${showFilter ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-end gap-2`}>
          <div className="flex-1 min-w-0">
            <label className="text-gray-400 text-[10px] sm:text-[11px] font-semibold tracking-wide">DARI</label>
            <input type="date" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 sm:py-1.5 focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="text-gray-400 text-[10px] sm:text-[11px] font-semibold tracking-wide">SAMPAI</label>
            <input type="date" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 sm:py-1.5 focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="text-gray-400 text-[10px] sm:text-[11px] font-semibold tracking-wide">DIVISI</label>
            <select className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 sm:py-1.5 focus:outline-none focus:border-blue-500">
              <option>Semua Divisi</option>
              <option>Marketing</option>
              <option>IT</option>
              <option>HR</option>
              <option>Finance</option>
            </select>
          </div>
          <div className="flex-1 min-w-0">
            <label className="text-gray-400 text-[10px] sm:text-[11px] font-semibold tracking-wide">CABANG</label>
            <select className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 sm:py-1.5 focus:outline-none focus:border-blue-500">
              <option>Semua Cabang</option>
              <option>Cabang Cianjur</option>
              <option>Cabang Bandung</option>
              <option>Pusat</option>
            </select>
          </div>
          <div className="sm:min-w-0">
            <label className="text-gray-400 text-[10px] sm:text-[11px] font-semibold tracking-wide invisible hidden sm:block">_</label>
            <button type="submit" className="w-full sm:w-auto bg-blue-600 text-white text-xs font-medium px-4 py-2 sm:py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
              <i className="ph ph-funnel me-1"></i>Filter
            </button>
          </div>
        </form>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2 mb-4">
        <StatCard
          icon="ph-users"
          iconColor="#65676b"
          label="TOTAL KARYAWAN"
          value={dummyStats.totalKaryawan}
          unit="org"
          footer={`Aktif: ${dummyStats.karyawanAktif}`}
        />
        <StatCard
          icon="ph-check-circle"
          iconColor="#1877f2"
          label="HADIR HARI INI"
          value={dummyStats.hadirHariIni}
          unit="org"
          valueColor="#1877f2"
          footer={`Tepat waktu: ${dummyStats.tepatWaktu}`}
        />
        <StatCard
          icon="ph-clock"
          iconColor="#e67e22"
          label="TERLAMBAT"
          value={dummyStats.terlambat}
          unit="org"
          valueColor="#e67e22"
          progress={ptg}
          progressColor="bg-amber-500"
        />
        <StatCard
          icon="ph-x-circle"
          iconColor="#e41e3f"
          label="ALPA"
          value={dummyStats.tidakHadir}
          unit="org"
          valueColor="#e41e3f"
          footer="Perlu cek"
        />
        <StatCard
          icon="ph-file-text"
          iconColor="#2e7d32"
          label="IZIN / SAKIT"
          value={dummyStats.izinCuti}
          unit="org"
          footer={`Pending: ${dummyStats.izinPending}`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
            <div>
              <h6 className="font-semibold text-sm m-0">Tren Kehadiran Bulanan</h6>
              <small className="text-gray-400">6 bulan terakhir</small>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 text-[10px] sm:text-[11px]">
              <span><span className="rounded-full inline-block me-1 align-middle" style={{ width: 8, height: 8, background: '#1877f2' }}></span>Hadir</span>
              <span><span className="rounded-full inline-block me-1 align-middle" style={{ width: 8, height: 8, background: '#f59e0b' }}></span>Terlambat</span>
              <span><span className="rounded-full inline-block me-1 align-middle" style={{ width: 8, height: 8, background: '#e41e3f' }}></span>Alpa</span>
              <span><span className="rounded-full inline-block me-1 align-middle" style={{ width: 8, height: 8, background: '#10b981' }}></span>Libur</span>
            </div>
          </div>
          <div className="h-52 sm:h-64">
            <canvas ref={barRef}></canvas>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h6 className="font-semibold text-sm m-0">Komposisi Hari Ini</h6>
              <small className="text-gray-400">{formatDate()}</small>
            </div>
          </div>
          <div className="h-52 sm:h-64">
            <canvas ref={donutRef}></canvas>
          </div>
        </div>
      </div>

      {/* Rasio per Divisi */}
      <div className="bg-white border border-gray-200 rounded-xl mb-4">
        <div className="px-3 sm:px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h6 className="font-semibold text-sm m-0">Rasio Keterlambatan per Divisi</h6>
            <small className="text-gray-400">Persentase hadir vs terlambat</small>
          </div>
        </div>
        <div className="p-3 sm:p-4">
          <div className="h-44 sm:h-52">
            <canvas ref={rasioRef}></canvas>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white border border-gray-200 rounded-xl mb-4">
        <div className="px-3 sm:px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="min-w-0">
            <h6 className="font-semibold text-sm m-0">Sebaran Lokasi Absensi</h6>
            <small className="text-gray-400">Tracking real-time</small>
          </div>
        </div>
        <div className="p-3 sm:p-4" style={{ borderRadius: '0 0 8px 8px' }}>
          <LocationTracker 
            height="h-72 sm:h-[400px]"
            showLiveIndicator={true}
            autoRefresh={true}
            refreshInterval={30000}
          />
        </div>
      </div>

      {/* Izin & Lembur */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Izin */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <FileText size={16} className="text-amber-500" />
              </div>
              <div>
                <h6 className="font-semibold text-sm text-gray-900 m-0">Riwayat Izin & Sakit</h6>
                <p className="text-[11px] text-gray-400 m-0">Pengajuan terbaru</p>
              </div>
            </div>
            <span className="bg-amber-50 text-amber-600 text-xs font-semibold px-2.5 py-1 rounded-lg">{dummyIzin.length}</span>
          </div>
          <div className="divide-y divide-gray-50">
            {dummyIzin.map((item, i) => {
              const isSakit = item.status === 'SAKIT'
              return (
                <div key={i} className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-gray-50/80 transition-colors cursor-pointer">
                  <div className="relative flex-shrink-0">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=${isSakit ? 'ef4444' : '22c55e'}&color=fff&size=64`}
                      className="rounded-full"
                      style={{ width: 36, height: 36, objectFit: 'cover' }}
                    />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white ${isSakit ? 'bg-red-500' : 'bg-green-500'}`}>
                      {isSakit ? (
                        <HeartPulse size={8} className="text-white" />
                      ) : (
                        <CalendarCheck size={8} className="text-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 m-0 truncate">{item.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <CalendarDays size={11} className="text-gray-300" />
                      <span className="text-[11px] text-gray-400 truncate">{item.date} &middot; {item.cabang}</span>
                    </div>
                  </div>
                  <span className={`flex-shrink-0 text-[11px] font-bold px-3 py-1 rounded-full ${isSakit ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                    {item.status}
                  </span>
                </div>
              )
            })}
          </div>
          <Link to="/izin-cuti" className="flex items-center justify-center gap-1.5 py-3 text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 rounded-b-xl transition-colors border-t border-gray-100">
            Lihat Semua
            <ArrowRight size={12} />
          </Link>
        </div>
        {/* Lembur */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Timer size={16} className="text-blue-500" />
              </div>
              <div>
                <h6 className="font-semibold text-sm text-gray-900 m-0">Pengajuan Lembur</h6>
                <p className="text-[11px] text-gray-400 m-0">Menunggu persetujuan</p>
              </div>
            </div>
            <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-lg">{dummyLembur.length} request</span>
          </div>
          <div className="divide-y divide-gray-50">
            {dummyLembur.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-gray-50/80 transition-colors cursor-pointer">
                <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-sm">
                  {item.inisial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 m-0 truncate">{item.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock size={11} className="text-gray-300" />
                    <span className="text-[11px] text-gray-400">{item.jam} jam</span>
                    <span className="text-gray-200">·</span>
                    <CalendarDays size={11} className="text-gray-300" />
                    <span className="text-[11px] text-gray-400">{item.date}</span>
                  </div>
                </div>
                <Link to="/approval-lembur" className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-50 hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors">
                  <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
          <Link to="/approval-lembur" className="flex items-center justify-center gap-1.5 py-3 text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 rounded-b-xl transition-colors border-t border-gray-100">
            Lihat Semua
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, iconColor, label, value, unit, valueColor, footer, progress, progressColor }: StatCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-2.5 sm:p-3 transition-shadow hover:shadow-sm">
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
        <i className={icon} style={{ fontSize: 14, color: iconColor }}></i>
        <span className="text-gray-400 text-[10px] sm:text-[11px] font-semibold tracking-wide truncate">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl sm:text-2xl font-bold" style={{ color: valueColor || '#050505' }}>{value}</span>
        <small className="text-gray-400 text-[10px] sm:text-xs">{unit}</small>
      </div>
      {footer && <small className="text-gray-400 text-[10px] sm:text-[11px] truncate block">{footer}</small>}
      {progress !== undefined && (
        <div className="h-1 sm:h-1.5 bg-gray-100 rounded-full mt-1.5 sm:mt-2 overflow-hidden">
          <div className={`h-full rounded-full ${progressColor || 'bg-blue-500'}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
        </div>
      )}
    </div>
  )
}
