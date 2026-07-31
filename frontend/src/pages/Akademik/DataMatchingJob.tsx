import {
  Users, Send, Eye, CheckCircle, FileText, ClipboardList, ArrowRight, Briefcase, ShieldCheck, BarChart3, Award,
  Filter, ChevronDown, Check, LayoutGrid, User, MapPin,
  Utensils, Sprout, ChefHat, HeartPulse, Sparkles, Coffee, Car, Bed, Wrench, HardHat, Fish, BadgeCheck,
  RotateCcw, CalendarRange, ExternalLink, PhoneCall, Percent, TrendingUp, ListChecks,
} from 'lucide-react'
import { useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const tabs = [
  { label: 'Verifikasi', icon: ShieldCheck },
  { label: 'Statistik', icon: BarChart3 },
  { label: 'Sertifikasi', icon: Award },
  { label: 'Job Order', icon: FileText },
  { label: 'Status Kandidat', icon: Users },
]

const stats = [
  { label: 'Total Kandidat', value: 365, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Terkirim', value: 28, icon: Send, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Direview', value: 0, icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Disetujui', value: 71, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
]

const quickActions = [
  {
    label: 'Formulir Draft',
    desc: '265 belum di submit',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    icon: FileText,
  },
  {
    label: 'Review Formulir Baru',
    desc: '28 menunggu review',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    icon: ClipboardList,
  },
  {
    label: 'Lihat Semua Kandidat',
    desc: 'Total 365 kandidat',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    icon: Users,
  },
]

interface BidangSSW {
  id: string
  nama: string
  icon: React.ComponentType<{ size?: number | string; className?: string }>
  bg: string
  color: string
  laki: number
  perempuan: number
}

const sswBidang: BidangSSW[] = [
  { id: 'pengolahan-makanan', nama: 'Pengolahan Makanan', icon: Utensils, bg: 'bg-emerald-50', color: 'text-emerald-600', laki: 5, perempuan: 3 },
  { id: 'pertanian', nama: 'Pertanian', icon: Sprout, bg: 'bg-green-50', color: 'text-green-600', laki: 12, perempuan: 8 },
  { id: 'gaishoku', nama: 'Gaishoku', icon: ChefHat, bg: 'bg-orange-50', color: 'text-orange-600', laki: 0, perempuan: 0 },
  { id: 'kaigo', nama: 'Kaigo (perawat)', icon: HeartPulse, bg: 'bg-rose-50', color: 'text-rose-600', laki: 2, perempuan: 5 },
  { id: 'building-cleaning', nama: 'Building Cleaning', icon: Sparkles, bg: 'bg-sky-50', color: 'text-sky-600', laki: 0, perempuan: 1 },
  { id: 'restoran', nama: 'Restoran', icon: Coffee, bg: 'bg-amber-50', color: 'text-amber-600', laki: 0, perempuan: 0 },
  { id: 'driver', nama: 'Driver', icon: Car, bg: 'bg-blue-50', color: 'text-blue-600', laki: 0, perempuan: 0 },
  { id: 'perhotelan', nama: 'Perhotelan', icon: Bed, bg: 'bg-purple-50', color: 'text-purple-600', laki: 0, perempuan: 1 },
  { id: 'perbaikan-mobil', nama: 'Perbaikan dan Perawatan Mobil', icon: Wrench, bg: 'bg-slate-100', color: 'text-slate-600', laki: 1, perempuan: 0 },
  { id: 'konstruksi', nama: 'Konstruksi', icon: HardHat, bg: 'bg-yellow-50', color: 'text-yellow-600', laki: 0, perempuan: 1 },
  { id: 'perikanan', nama: 'Perikanan', icon: Fish, bg: 'bg-cyan-50', color: 'text-cyan-600', laki: 0, perempuan: 0 },
]

interface SertifikasiInfo {
  id: string
  nama: string
  icon: React.ComponentType<{ size?: number | string; className?: string }>
  bg: string
  color: string
  lakiSudah: number
  lakiBelum: number
  perempuanSudah: number
  perempuanBelum: number
}

const sertifikasiList: SertifikasiInfo[] = [
  { id: 'jft', nama: 'Sertifikat JFT', icon: BadgeCheck, bg: 'bg-blue-50', color: 'text-blue-600', lakiSudah: 185, lakiBelum: 22, perempuanSudah: 124, perempuanBelum: 7 },
  { id: 'ssw', nama: 'Sertifikat SSW', icon: Award, bg: 'bg-amber-50', color: 'text-amber-600', lakiSudah: 20, lakiBelum: 187, perempuanSudah: 20, perempuanBelum: 111 },
]

export default function DataMatchingJob() {
  const [activeTab, setActiveTab] = useState('Verifikasi')
  const [viewMode, setViewMode] = useState<'kartu' | 'grafik'>('kartu')
  const [filterBidang, setFilterBidang] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [genderFilter, setGenderFilter] = useState<'laki' | 'perempuan' | ''>('')
  const [sertifikasiView, setSertifikasiView] = useState<'kartu' | 'grafik'>('kartu')
  const [joFrom, setJoFrom] = useState('')
  const [joTo, setJoTo] = useState('')

  const jobMatchingStatus = [
    { label: 'Lamar ke Perusahaan', pct: 92, count: 69, laki: 35, perempuan: 33, color: '#0E6187' },
    { label: 'Interview', pct: 3, count: 2, laki: 1, perempuan: 1, color: '#F59E0B' },
    { label: 'Berangkat', pct: 1, count: 1, laki: 0, perempuan: 1, color: '#10B981' },
    { label: 'Belum Diproses', pct: 4, count: 3, laki: 3, perempuan: 0, color: '#94A3B8' },
  ]
  const now = new Date()
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const dayName = days[now.getDay()]
  const dateStr = `${dayName}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`

  const totalKandidat = sswBidang.reduce((sum, b) => sum + b.laki + b.perempuan, 0)
  const totalLaki = sswBidang.reduce((sum, b) => sum + b.laki, 0)
  const totalPerempuan = sswBidang.reduce((sum, b) => sum + b.perempuan, 0)

  const filteredBidang = filterBidang
    ? sswBidang.filter(b => b.id === filterBidang)
    : sswBidang

  const chartData = {
    labels: filteredBidang.map(b => b.nama),
    datasets: [
      {
        label: 'Laki-laki',
        data: filteredBidang.map(b => b.laki),
        backgroundColor: '#0E6187',
        borderRadius: 4,
        barPercentage: 0.7,
      },
      {
        label: 'Perempuan',
        data: filteredBidang.map(b => b.perempuan),
        backgroundColor: '#EC4899',
        borderRadius: 4,
        barPercentage: 0.7,
      },
    ],
  }

  const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { usePointStyle: true, boxWidth: 8, font: { size: 12 } },
      },
    },
    scales: {
      x: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } },
      y: { ticks: { font: { size: 12 } } },
    },
  }

  const renderStatistik = () => (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Statistik Kandidat per Bidang SSW</h2>
          <p className="mt-0.5 text-xs text-slate-500">Total Kandidat : {totalKandidat}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Filter size={14} />
              Filter
              {filterBidang && (
                <span className="rounded-full bg-[#0E6187] px-1.5 text-[10px] font-bold text-white">1</span>
              )}
              <ChevronDown size={14} />
            </button>
            {showFilter && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowFilter(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 max-h-56 w-56 overflow-y-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                  <button
                    onClick={() => { setFilterBidang(''); setShowFilter(false) }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-slate-700 transition hover:bg-slate-50"
                  >
                    Semua Bidang
                    {!filterBidang && <Check size={14} className="text-[#0E6187]" />}
                  </button>
                  {sswBidang.map(b => (
                    <button
                      key={b.id}
                      onClick={() => { setFilterBidang(b.id); setShowFilter(false) }}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-slate-700 transition hover:bg-slate-50"
                    >
                      <span className="truncate pr-2">{b.nama}</span>
                      {filterBidang === b.id && <Check size={14} className="shrink-0 text-[#0E6187]" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="flex overflow-hidden rounded-md border border-slate-300">
            <button
              onClick={() => setViewMode('kartu')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition ${
                viewMode === 'kartu' ? 'bg-[#0E6187] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <LayoutGrid size={14} />
              Kartu
            </button>
            <button
              onClick={() => setViewMode('grafik')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition ${
                viewMode === 'grafik' ? 'bg-[#0E6187] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BarChart3 size={14} />
              Grafik
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="text-xs text-slate-500">
          Laki-laki <b className="ml-1 text-slate-800">{totalLaki}</b>
        </span>
        <span className="text-xs text-slate-500">
          Perempuan <b className="ml-1 text-slate-800">{totalPerempuan}</b>
        </span>
        <span className="text-xs text-slate-500">
          Total <b className="ml-1 text-slate-800">{totalLaki + totalPerempuan}</b>
        </span>
      </div>

      {viewMode === 'kartu' ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBidang.map(b => {
            const Icon = b.icon
            return (
              <div
                key={b.id}
                className="group cursor-pointer rounded-lg border border-slate-200 p-4 transition hover:border-[#0E6187]/40 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${b.bg}`}>
                    <Icon size={18} className={b.color} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{b.nama}</p>
                    <p className="text-xs text-slate-500">{b.laki + b.perempuan} kandidat</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <User size={14} className="text-blue-600" />
                    <span className="font-bold text-slate-800">{b.laki}</span>
                    <span className="text-xs text-slate-500">Laki-laki</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User size={14} className="text-pink-500" />
                    <span className="font-bold text-slate-800">{b.perempuan}</span>
                    <span className="text-xs text-slate-500">Perempuan</span>
                  </div>
                </div>
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#0E6187]">
                    Klik untuk lihat detail progress
                    <ArrowRight size={12} className="transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-slate-200 p-4">
          <div className="h-[340px]">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      )}
    </div>
  )

  const totalSertifikasiKandidat = 338

  const getSertifikasiNumbers = (s: SertifikasiInfo) => {
    if (genderFilter === 'laki') {
      return { sudah: s.lakiSudah, belum: s.lakiBelum }
    }
    if (genderFilter === 'perempuan') {
      return { sudah: s.perempuanSudah, belum: s.perempuanBelum }
    }
    return { sudah: s.lakiSudah + s.perempuanSudah, belum: s.lakiBelum + s.perempuanBelum }
  }

  const renderGenderRows = (s: SertifikasiInfo) => {
    const rows = genderFilter === 'laki' || genderFilter === ''
      ? [{ label: 'Laki-laki', icon: 'text-blue-600', sudah: s.lakiSudah, belum: s.lakiBelum }]
      : []
    const perempuanRows = genderFilter === 'perempuan' || genderFilter === ''
      ? [{ label: 'Perempuan', icon: 'text-pink-500', sudah: s.perempuanSudah, belum: s.perempuanBelum }]
      : []
    return [...rows, ...perempuanRows]
  }

  const renderSertifikasi = () => (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Statistik Sertifikasi JFT &amp; SSW</h2>
          <p className="mt-0.5 text-xs text-slate-500">Total Kandidat : {totalSertifikasiKandidat}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setGenderFilter(genderFilter === 'laki' ? '' : 'laki')}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                genderFilter === 'laki'
                  ? 'border-[#0E6187] bg-[#0E6187] text-white'
                  : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <User size={13} />
              Laki-laki
            </button>
            <button
              onClick={() => setGenderFilter(genderFilter === 'perempuan' ? '' : 'perempuan')}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                genderFilter === 'perempuan'
                  ? 'border-[#0E6187] bg-[#0E6187] text-white'
                  : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <User size={13} />
              Perempuan
            </button>
          </div>
          <div className="flex overflow-hidden rounded-md border border-slate-300">
            <button
              onClick={() => setSertifikasiView('kartu')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition ${
                sertifikasiView === 'kartu' ? 'bg-[#0E6187] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <LayoutGrid size={14} />
              Kartu
            </button>
            <button
              onClick={() => setSertifikasiView('grafik')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition ${
                sertifikasiView === 'grafik' ? 'bg-[#0E6187] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BarChart3 size={14} />
              Grafik
            </button>
          </div>
        </div>
      </div>

      {sertifikasiView === 'kartu' ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {sertifikasiList.map(s => {
            const Icon = s.icon
            const { sudah, belum } = getSertifikasiNumbers(s)
            return (
              <div key={s.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}>
                    <Icon size={18} className={s.color} />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{s.nama}</p>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center">
                    <p className="text-2xl font-bold text-slate-800">{sudah}</p>
                    <p className="mt-1 text-[11px] font-medium text-slate-500">Sudah</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center">
                    <p className="text-2xl font-bold text-slate-800">{belum}</p>
                    <p className="mt-1 text-[11px] font-medium text-slate-500">Belum</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center">
                    <p className="text-2xl font-bold text-[#0E6187]">{sudah + belum}</p>
                    <p className="mt-1 text-[11px] font-medium text-slate-500">Total</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Per Gender</p>
                  <div className="mt-2 space-y-2">
                    {renderGenderRows(s).map(r => (
                      <div key={r.label} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                        <span className="inline-flex items-center gap-1.5 text-slate-600">
                          <User size={14} className={r.icon} />
                          {r.label}
                        </span>
                        <span className="text-xs text-slate-500">
                          Sudah: <b className="text-slate-800">{r.sudah}</b> · Belum: <b className="text-slate-800">{r.belum}</b>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {sertifikasiList.map(s => {
            const labels = genderFilter === 'laki' ? ['Laki-laki'] : genderFilter === 'perempuan' ? ['Perempuan'] : ['Laki-laki', 'Perempuan']
            const data = {
              labels,
              datasets: [
                {
                  label: 'Sudah',
                  data: labels.map(l => (l === 'Laki-laki' ? s.lakiSudah : s.perempuanSudah)),
                  backgroundColor: '#0E6187',
                  borderRadius: 4,
                  barPercentage: 0.6,
                },
                {
                  label: 'Belum',
                  data: labels.map(l => (l === 'Laki-laki' ? s.lakiBelum : s.perempuanBelum)),
                  backgroundColor: '#F59E0B',
                  borderRadius: 4,
                  barPercentage: 0.6,
                },
              ],
            }
            return (
              <div key={s.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}>
                    <s.icon size={18} className={s.color} />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{s.nama}</p>
                </div>
                <div className="mt-4 h-[220px]">
                  <Bar
                    data={data}
                    options={{
                      indexAxis: 'y' as const,
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'bottom' as const, labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 } } } },
                      scales: { x: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } } },
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  const renderStatusKandidat = () => (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Kandidat</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <Users size={16} className="text-blue-600" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-800">75</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Interview</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <PhoneCall size={16} className="text-amber-600" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-800">1</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Lulus Interview</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
              <CheckCircle size={16} className="text-emerald-600" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-800">0</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Persentase</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
              <Percent size={16} className="text-purple-600" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-800">0%</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">Status Progress Chart</h3>
          <p className="mt-0.5 text-xs text-slate-500">Distribusi status kandidat saat ini</p>
          <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative h-44 w-44 shrink-0">
              <Doughnut
                data={{
                  labels: jobMatchingStatus.map(s => s.label),
                  datasets: [
                    {
                      data: jobMatchingStatus.map(s => s.count),
                      backgroundColor: jobMatchingStatus.map(s => s.color),
                      borderWidth: 2,
                      borderColor: '#ffffff',
                      hoverOffset: 6,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  cutout: '62%',
                }}
              />
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-slate-800">75</span>
                <span className="text-[10px] font-medium text-slate-500">Kandidat</span>
              </div>
            </div>
            <div className="w-full space-y-2.5">
              {jobMatchingStatus.map(s => (
                <div key={s.label} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="flex-1 truncate text-slate-600">{s.label}</span>
                  <b className="text-slate-800">{s.count}</b>
                  <span className="w-10 text-right text-slate-500">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">Distribusi Status</h3>
          <p className="mt-0.5 text-xs text-slate-500">Interview &amp; Lulus Interview per Cabang</p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5 text-sm">
              <span className="text-slate-600">Interview</span>
              <b className="text-slate-800">1</b>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5 text-sm">
              <span className="text-slate-600">Jadwal Ulang</span>
              <b className="text-slate-800">0</b>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5 text-sm">
              <span className="text-slate-600">Lulus Interview</span>
              <b className="text-slate-800">0</b>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5 text-sm">
              <span className="text-slate-600">Total Interview</span>
              <b className="text-slate-800">1</b>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm">
              <span className="text-slate-600">Persentase Kelulusan</span>
              <b className="text-[#0E6187]">0%</b>
            </div>
          </div>
          <button className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            <ListChecks size={15} />
            Detail Semua Status
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-[#0E6187]" />
          <h3 className="text-sm font-semibold text-slate-800">Job Matching</h3>
        </div>
        <div className="space-y-4">
          {jobMatchingStatus.map(s => (
            <div key={s.label}>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-700">{s.label}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
                    <User size={11} className="text-blue-600" /> {s.laki}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
                    <User size={11} className="text-pink-500" /> {s.perempuan}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <b className="text-slate-800">{s.count}</b>
                  <span className="w-11 text-right text-xs font-semibold" style={{ color: s.color }}>{s.pct}%</span>
                </div>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full transition-all" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )

  const renderJobOrder = () => (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Mulai</label>
          <input
            type="date"
            value={joFrom}
            onChange={e => setJoFrom(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Selesai</label>
          <input
            type="date"
            value={joTo}
            onChange={e => setJoTo(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => {}}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#0E6187] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0a4a6a]"
        >
          <CalendarRange size={15} />
          Terapkan
        </button>
        <button
          onClick={() => { setJoFrom(''); setJoTo('') }}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <RotateCcw size={15} />
          Reset
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Job Order</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <FileText size={16} className="text-blue-600" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-800">80</div>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Job Order</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
              <ClipboardList size={16} className="text-emerald-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-2xl font-bold text-slate-800">73</span>
            <a
              href="#"
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Detail
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-slate-200 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Grafik Job Order</h3>
            <p className="mt-0.5 text-xs text-slate-500">Jumlah job order per bulan</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            <BarChart3 size={13} />
            Tahun 2026
          </span>
        </div>
        <div className="h-[300px]">
          <Bar
            data={{
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul'],
              datasets: [
                {
                  label: 'Job Order',
                  data: [8, 12, 10, 15, 11, 14, 10],
                  backgroundColor: '#0E6187',
                  borderRadius: 6,
                  barPercentage: 0.55,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: ctx => ` ${ctx.parsed.y} Job Order`,
                  },
                },
              },
              scales: {
                x: { grid: { display: false }, ticks: { font: { size: 12 } } },
                y: { beginAtZero: true, ticks: { stepSize: 2, precision: 0 }, grid: { color: '#f1f5f9' } },
              },
            }}
          />
        </div>
      </div>
    </div>
  )

  const renderVerifikasi = () => (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{s.label}</span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.bg}`}>
                  <Icon size={16} className={s.color} />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-800">{s.value.toLocaleString('id-ID')}</div>
            </div>
          )
        })}
      </div>

      <div className="mt-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-600">Status Formulir</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {quickActions.map((a) => {
            const Icon = a.icon
            return (
              <a
                key={a.label}
                href="#"
                className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${a.bg}`}>
                  <Icon size={18} className={a.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${a.color}`}>{a.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{a.desc}</p>
                </div>
                <ArrowRight size={16} className={`shrink-0 ${a.color}`} />
              </a>
            )
          })}
        </div>
      </div>
    </>
  )

  const renderPlaceholder = (label: string) => (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white py-16 text-center shadow-sm">
      <FileText size={32} className="text-slate-300" />
      <p className="mt-3 text-sm font-medium text-slate-500">Modul {label} sedang disiapkan</p>
    </div>
  )

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-5 flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] text-white">
            <Briefcase size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Dashboard</h1>
            <p className="text-sm text-slate-500">Selamat datang, Admin Penempatan — {dateStr}</p>
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
        {tabs.map((t) => {
          const Icon = t.icon
          const isActive = activeTab === t.label
          return (
            <button
              key={t.label}
              onClick={() => setActiveTab(t.label)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition ${
                isActive
                  ? 'bg-[#0E6187] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'Verifikasi' && renderVerifikasi()}
      {activeTab === 'Statistik' && (
        <>
          {renderStatistik()}
          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800">Progress Kandidat per Cabang</h2>
            <p className="mt-0.5 text-xs text-slate-500">Distribusi kandidat SSW berdasarkan cabang</p>
            <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-10 text-center">
              <MapPin size={28} className="text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">Belum ada data cabang</p>
            </div>
          </div>
        </>
      )}
      {activeTab === 'Sertifikasi' && renderSertifikasi()}
      {activeTab === 'Job Order' && renderJobOrder()}
      {activeTab === 'Status Kandidat' && renderStatusKandidat()}
      {!['Verifikasi', 'Statistik', 'Sertifikasi', 'Job Order', 'Status Kandidat'].includes(activeTab) && renderPlaceholder(activeTab)}
    </div>
  )
}
