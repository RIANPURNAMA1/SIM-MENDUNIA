import { useEffect, useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Users, Send, Eye, CheckCircle, FileText, ClipboardList, ArrowRight, Briefcase, ShieldCheck, BarChart3, Award,
  Filter, ChevronDown, Check, LayoutGrid, User, MapPin,
  Utensils, Sprout, ChefHat, HeartPulse, Sparkles, Coffee, Car, Bed, Wrench, HardHat, Fish, BadgeCheck,
  RotateCcw, CalendarRange, ExternalLink, PhoneCall, Percent, TrendingUp, ListChecks, Loader2, AlertCircle, X,
} from 'lucide-react'
import api from '../../services/api'
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

interface BidangSSW {
  id: string
  nama: string
  icon: LucideIcon
  bg: string
  color: string
  laki: number
  perempuan: number
}

interface SertifikasiInfo {
  id: string
  nama: string
  icon: LucideIcon
  bg: string
  color: string
  lakiSudah: number
  lakiBelum: number
  perempuanSudah: number
  perempuanBelum: number
}

interface DashboardData {
  total: number
  byStatus: { status_formulir: string; count: number }[]
  byCabang: { nama_cabang: string | null; count: number }[]
  bySSWGender: { ssw: string; laki: number; perempuan: number; total: number }[]
  bySSWProgres: { ssw: string; progres: { status: string; count: number }[] }[]
  byCabangProgres: { nama_cabang: string | null; status_progres: string; count: number }[]
  jftByGender: { jenis_kelamin: string | null; has_jft: number; no_jft: number }[]
  sswByGender: { jenis_kelamin: string | null; has_ssw: number; no_ssw: number }[]
  interviewByCabang: { nama_cabang: string | null; interview_laki: number; interview_perempuan: number; jadwalkan_laki: number; jadwalkan_perempuan: number; lulus_laki: number; lulus_perempuan: number }[]
  interviewByGender: { jenis_kelamin: string | null; interview: number; lulus: number }[]
}

const sswMeta: { id: string; nama: string; icon: LucideIcon; bg: string; color: string }[] = [
  { id: 'pengolahan-makanan', nama: 'Pengolahan Makanan', icon: Utensils, bg: 'bg-emerald-50', color: 'text-emerald-600' },
  { id: 'pertanian', nama: 'Pertanian', icon: Sprout, bg: 'bg-green-50', color: 'text-green-600' },
  { id: 'gaishoku', nama: 'Gaishoku', icon: ChefHat, bg: 'bg-orange-50', color: 'text-orange-600' },
  { id: 'kaigo', nama: 'Kaigo (perawat)', icon: HeartPulse, bg: 'bg-rose-50', color: 'text-rose-600' },
  { id: 'building-cleaning', nama: 'Building Cleaning', icon: Sparkles, bg: 'bg-sky-50', color: 'text-sky-600' },
  { id: 'restoran', nama: 'Restoran', icon: Coffee, bg: 'bg-amber-50', color: 'text-amber-600' },
  { id: 'driver', nama: 'Driver', icon: Car, bg: 'bg-blue-50', color: 'text-blue-600' },
  { id: 'perhotelan', nama: 'Perhotelan', icon: Bed, bg: 'bg-purple-50', color: 'text-purple-600' },
  { id: 'perbaikan-mobil', nama: 'Perbaikan dan Perawatan Mobil', icon: Wrench, bg: 'bg-slate-100', color: 'text-slate-600' },
  { id: 'konstruksi', nama: 'Konstruksi', icon: HardHat, bg: 'bg-yellow-50', color: 'text-yellow-600' },
  { id: 'perikanan', nama: 'Perikanan', icon: Fish, bg: 'bg-cyan-50', color: 'text-cyan-600' },
]

const sertifikasiMeta = [
  { id: 'jft', nama: 'Sertifikat JFT', icon: BadgeCheck, bg: 'bg-blue-50', color: 'text-blue-600' },
  { id: 'ssw', nama: 'Sertifikat SSW', icon: Award, bg: 'bg-amber-50', color: 'text-amber-600' },
]

const FORM_STATUS_COLOR: Record<string, string> = {
  draft: '#94A3B8',
  submitted: '#0E6187',
  reviewed: '#F59E0B',
  approved: '#10B981',
  rejected: '#EF4444',
}

const STATUS_PROGRES_COLOR: Record<string, string> = {
  'Job Matching': '#0E6187',
  'Pending': '#94A3B8',
  'lamar ke perusahaan': '#0E6187',
  'Interview': '#F59E0B',
  'Jadwalkan Interview Ulang': '#F59E0B',
  'Lulus interview': '#10B981',
  'Gagal Interview': '#EF4444',
  'Pemberkasan': '#8B5CF6',
  'Berangkat': '#10B981',
  'Ditolak': '#EF4444',
}

export default function DataMatchingJob() {
  const [activeTab, setActiveTab] = useState('Verifikasi')
  const [viewMode, setViewMode] = useState<'kartu' | 'grafik'>('kartu')
  const [filterBidang, setFilterBidang] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [genderFilter, setGenderFilter] = useState<'laki' | 'perempuan' | ''>('')
  const [sertifikasiView, setSertifikasiView] = useState<'kartu' | 'grafik'>('kartu')
  const [joFrom, setJoFrom] = useState('')
  const [joTo, setJoTo] = useState('')

  const [dash, setDash] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [selectedSsw, setSelectedSsw] = useState<BidangSSW | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get('/penempatan/dashboard')
        const data = res.data
        if (!data?.success) {
          if (!cancelled) setError(data?.message || 'Gagal mengambil data dashboard')
        } else {
          if (!cancelled) setDash(data.data)
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.response?.data?.message || 'Gagal terhubung ke Sistem Penempatan')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [reloadKey])

  const byStatusCount = (s: string) => dash?.byStatus.find(x => x.status_formulir === s)?.count ?? 0
  const total = dash?.total ?? 0
  const submitted = byStatusCount('submitted')
  const reviewed = byStatusCount('reviewed')
  const approved = byStatusCount('approved')

  const stats = [
    { label: 'Total Kandidat', value: total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Terkirim', value: submitted, icon: Send, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Direview', value: reviewed, icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Disetujui', value: approved, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]

  const sswBidang: BidangSSW[] = useMemo(() => {
    return (dash?.bySSWGender ?? []).map(s => {
      const meta = sswMeta.find(m => m.nama.toLowerCase() === (s.ssw || '').toLowerCase())
      return {
        id: meta?.id ?? s.ssw,
        nama: s.ssw,
        icon: meta?.icon ?? Briefcase,
        bg: meta?.bg ?? 'bg-slate-50',
        color: meta?.color ?? 'text-slate-600',
        laki: s.laki ?? 0,
        perempuan: s.perempuan ?? 0,
      }
    })
  }, [dash])

  const jftGender = useMemo(() => {
    const map = new Map<string, { has: number; no: number }>()
    ;(dash?.jftByGender ?? []).forEach(g => {
      if (g.jenis_kelamin) map.set(g.jenis_kelamin, { has: g.has_jft ?? 0, no: g.no_jft ?? 0 })
    })
    return map
  }, [dash])

  const sswGender = useMemo(() => {
    const map = new Map<string, { has: number; no: number }>()
    ;(dash?.sswByGender ?? []).forEach(g => {
      if (g.jenis_kelamin) map.set(g.jenis_kelamin, { has: g.has_ssw ?? 0, no: g.no_ssw ?? 0 })
    })
    return map
  }, [dash])

  const sertifikasiList: SertifikasiInfo[] = useMemo(() => {
    return sertifikasiMeta.map(s => {
      const g = s.id === 'jft' ? jftGender : sswGender
      return {
        ...s,
        lakiSudah: g.get('Laki-laki')?.has ?? 0,
        lakiBelum: g.get('Laki-laki')?.no ?? 0,
        perempuanSudah: g.get('Perempuan')?.has ?? 0,
        perempuanBelum: g.get('Perempuan')?.no ?? 0,
      }
    })
  }, [jftGender, sswGender])

  const progresAgg = useMemo(() => {
    const agg: Record<string, number> = {}
    ;(dash?.bySSWProgres ?? []).forEach(p => {
      ;(p.progres ?? []).forEach(s => {
        agg[s.status] = (agg[s.status] || 0) + (s.count || 0)
      })
    })
    return agg
  }, [dash])

  const sswProgresMap = useMemo(() => {
    const map = new Map<string, { status: string; count: number }[]>()
    ;(dash?.bySSWProgres ?? []).forEach(p => {
      map.set(p.ssw, p.progres ?? [])
    })
    return map
  }, [dash])

  const progresTotal = Object.values(progresAgg).reduce((a, b) => a + b, 0)

  const jobMatchingStatus = Object.entries(progresAgg)
    .map(([label, count]) => ({
      label,
      count,
      pct: progresTotal > 0 ? Math.round((count / progresTotal) * 100) : 0,
      laki: null as number | null,
      perempuan: null as number | null,
      color: STATUS_PROGRES_COLOR[label] ?? '#0E6187',
    }))
    .sort((a, b) => b.count - a.count)

  const interviewByGender = dash?.interviewByGender ?? []
  const totalInterview = interviewByGender.reduce((a, g) => a + (g.interview || 0), 0)
  const totalLulus = interviewByGender.reduce((a, g) => a + (g.lulus || 0), 0)
  const interviewPct = totalInterview > 0 ? Math.round((totalLulus / totalInterview) * 100) : 0

  const interviewCabangAgg = (dash?.interviewByCabang ?? []).reduce(
    (acc, c) => {
      acc.interview += (c.interview_laki || 0) + (c.interview_perempuan || 0)
      acc.jadwalkan += (c.jadwalkan_laki || 0) + (c.jadwalkan_perempuan || 0)
      acc.lulus += (c.lulus_laki || 0) + (c.lulus_perempuan || 0)
      return acc
    },
    { interview: 0, jadwalkan: 0, lulus: 0 }
  )
  const distribusiTotal = interviewCabangAgg.interview + interviewCabangAgg.jadwalkan
  const distribusiPct = distribusiTotal > 0 ? Math.round((interviewCabangAgg.lulus / distribusiTotal) * 100) : 0

  const formStatusList = dash?.byStatus ?? []
  const formStatusTotal = formStatusList.reduce((a, s) => a + (s.count || 0), 0)

  const statusChartData = {
    labels: formStatusList.map(s => s.status_formulir),
    datasets: [
      {
        data: formStatusList.map(s => s.count),
        backgroundColor: formStatusList.map(s => FORM_STATUS_COLOR[s.status_formulir] ?? '#0E6187'),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 6,
      },
    ],
  }

  const statusChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const value = ctx.raw as number
            const pct = formStatusTotal > 0 ? Math.round((value / formStatusTotal) * 100) : 0
            return ` ${value} kandidat (${pct}%)`
          },
        },
      },
    },
    cutout: '62%',
  }

  const cabangData = (dash?.byCabang ?? [])
    .map(c => ({ nama: c.nama_cabang || 'Tanpa Cabang', count: c.count ?? 0 }))
    .sort((a, b) => b.count - a.count)

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
                onClick={() => setSelectedSsw(b)}
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

  const totalSertifikasiKandidat = total

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
          <div className="mt-2 text-2xl font-bold text-slate-800">{total}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Interview</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <PhoneCall size={16} className="text-amber-600" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-800">{totalInterview}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Lulus Interview</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
              <CheckCircle size={16} className="text-emerald-600" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-800">{totalLulus}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Persentase</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
              <Percent size={16} className="text-purple-600" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-800">{interviewPct}%</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">Status Progress Chart</h3>
          <p className="mt-0.5 text-xs text-slate-500">Distribusi status formulir kandidat saat ini</p>
          <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative h-44 w-44 shrink-0">
              <Doughnut
                data={{
                  labels: formStatusList.map(s => s.status_formulir),
                  datasets: [
                    {
                      data: formStatusList.map(s => s.count),
                      backgroundColor: formStatusList.map(s => FORM_STATUS_COLOR[s.status_formulir] ?? '#94A3B8'),
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
                <span className="text-xl font-bold text-slate-800">{formStatusTotal}</span>
                <span className="text-[10px] font-medium text-slate-500">Kandidat</span>
              </div>
            </div>
            <div className="w-full space-y-2.5">
              {formStatusList.map(s => (
                <div key={s.status_formulir} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: FORM_STATUS_COLOR[s.status_formulir] ?? '#94A3B8' }} />
                  <span className="flex-1 truncate text-slate-600">{s.status_formulir}</span>
                  <b className="text-slate-800">{s.count}</b>
                  <span className="w-10 text-right text-slate-500">
                    {formStatusTotal > 0 ? Math.round((s.count / formStatusTotal) * 100) : 0}%
                  </span>
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
              <b className="text-slate-800">{interviewCabangAgg.interview}</b>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5 text-sm">
              <span className="text-slate-600">Jadwal Ulang</span>
              <b className="text-slate-800">{interviewCabangAgg.jadwalkan}</b>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5 text-sm">
              <span className="text-slate-600">Lulus Interview</span>
              <b className="text-slate-800">{interviewCabangAgg.lulus}</b>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5 text-sm">
              <span className="text-slate-600">Total Interview</span>
              <b className="text-slate-800">{distribusiTotal}</b>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm">
              <span className="text-slate-600">Persentase Kelulusan</span>
              <b className="text-[#0E6187]">{distribusiPct}%</b>
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
                  {s.laki != null && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
                      <User size={11} className="text-blue-600" /> {s.laki}
                    </span>
                  )}
                  {s.perempuan != null && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
                      <User size={11} className="text-pink-500" /> {s.perempuan}
                    </span>
                  )}
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
      {formStatusList.length > 0 && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-[#0E6187]" />
            <h3 className="text-sm font-semibold text-slate-800">Distribusi Status Kandidat</h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">Persentase kandidat berdasarkan status formulir</p>
          <div className="mt-4 flex flex-col items-center sm:flex-row sm:items-center sm:justify-center gap-6">
            <div className="relative h-56 w-56 sm:h-64 sm:w-64 shrink-0">
              <Doughnut
                data={statusChartData}
                options={statusChartOptions}
              />
              {formStatusTotal > 0 && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-slate-800">{formStatusTotal}</span>
                  <span className="text-[10px] font-medium text-slate-500">Total</span>
                </div>
              )}
            </div>
            <div className="w-full space-y-2.5">
              {formStatusList.map(s => {
                const pct = formStatusTotal > 0 ? Math.round((s.count / formStatusTotal) * 100) : 0
                return (
                  <div key={s.status_formulir} className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: FORM_STATUS_COLOR[s.status_formulir] ?? '#0E6187' }} />
                    <span className="flex-1 capitalize text-slate-600">{s.status_formulir}</span>
                    <b className="text-slate-800">{s.count}</b>
                    <span className="w-10 text-right text-xs font-semibold" style={{ color: FORM_STATUS_COLOR[s.status_formulir] ?? '#0E6187' }}>{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )

  const renderPlaceholder = (label: string) => (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white py-16 text-center shadow-sm">
      <FileText size={32} className="text-slate-300" />
      <p className="mt-3 text-sm font-medium text-slate-500">Modul {label} sedang disiapkan</p>
    </div>
  )

  const renderProgressModal = () => {
    if (!selectedSsw) return null
    const SswIcon = selectedSsw.icon
    const progres = (sswProgresMap.get(selectedSsw.nama) ?? [])
      .filter(s => (s.count || 0) > 0)
    const totalProgres = progres.reduce((a, s) => a + (s.count || 0), 0)

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-slate-900/50" onClick={() => setSelectedSsw(null)} />
        <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-2xl">
          <div className="flex items-center justify-between rounded-t-xl border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${selectedSsw.bg}`}>
                <SswIcon size={18} className={selectedSsw.color} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Detail Progress — {selectedSsw.nama}</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {selectedSsw.laki + selectedSsw.perempuan} kandidat ({selectedSsw.laki} L · {selectedSsw.perempuan} P)
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedSsw(null)}
              className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto p-5">
            {progres.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <BarChart3 size={32} className="text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-500">Belum ada data progress untuk bidang ini</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <div className="relative h-44 w-44 shrink-0">
                  <Doughnut
                    data={{
                      labels: progres.map(s => s.status),
                      datasets: [
                        {
                          data: progres.map(s => s.count),
                          backgroundColor: progres.map(s => STATUS_PROGRES_COLOR[s.status] ?? '#0E6187'),
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
                    <span className="text-xl font-bold text-slate-800">{totalProgres}</span>
                    <span className="text-[10px] font-medium text-slate-500">Kandidat</span>
                  </div>
                </div>
                <div className="w-full space-y-2.5">
                  {progres.map(s => (
                    <div key={s.status} className="flex items-center gap-2 text-xs">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: STATUS_PROGRES_COLOR[s.status] ?? '#0E6187' }}
                      />
                      <span className="flex-1 truncate text-slate-600">{s.status}</span>
                      <b className="text-slate-800">{s.count}</b>
                      <span className="w-10 text-right text-slate-500">
                        {totalProgres > 0 ? Math.round((s.count / totalProgres) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

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
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 size={14} className="animate-spin text-[#0E6187]" />
            Memuat data dashboard...
          </div>
        )}
      </div>

      {error && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
          <button
            onClick={() => setReloadKey(k => k + 1)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
          >
            <RotateCcw size={13} />
            Muat Ulang
          </button>
        </div>
      )}

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
            <div className="mt-4">
              {cabangData.length > 0 ? (
                <div className="space-y-2">
                  {cabangData.map(c => (
                    <div key={c.nama} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5 text-sm">
                      <span className="flex items-center gap-2 text-slate-600">
                        <MapPin size={14} className="text-slate-400" />
                        {c.nama}
                      </span>
                      <b className="text-slate-800">{c.count}</b>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-10 text-center">
                  <MapPin size={28} className="text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">Belum ada data cabang</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      {activeTab === 'Sertifikasi' && renderSertifikasi()}
      {activeTab === 'Job Order' && renderJobOrder()}
      {activeTab === 'Status Kandidat' && renderStatusKandidat()}
      {!['Verifikasi', 'Statistik', 'Sertifikasi', 'Job Order', 'Status Kandidat'].includes(activeTab) && renderPlaceholder(activeTab)}

      {renderProgressModal()}
    </div>
  )
}
