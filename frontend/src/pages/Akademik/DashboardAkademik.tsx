import { useEffect, useState, useMemo } from 'react'
import { Users, BookOpen, Calendar, TrendingUp, GraduationCap, Layers, CheckCircle, Clock, Award, Medal, Target, BarChart, FileText, PieChart, ClipboardCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { siswaApi, guruApi, kelasSenseiApi, absensiSiswaApi, penilaianApi } from '../../services/api'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement,
  Filler, Tooltip, Legend,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend)

const toLocalDate = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface SiswaItem {
  id: number
  nama: string
  status: string
  kelas?: string
  batch?: string
  level?: string
  created_at: string
}

interface GuruItem {
  id: number
  nama: string
  status: string
}

interface KelasSensei {
  id: number
  nama_kelas: string
  status: string
  user?: { name: string }
  siswa_count?: number
}

interface PenilaianPerBatch {
  batch_id: number
  nama_batch: string
  total_siswa: number
  siswa_dinilai: number
  rata_rata: number
  total_assessments: number
}

interface LeaderboardEntry {
  siswa_id: number
  nama: string
  batch: string
  level: string
  rata_rata: number
  total_penilaian: number
}

interface RekapData {
  per_batch: PenilaianPerBatch[]
  leaderboard: LeaderboardEntry[]
  statistik: {
    total_siswa_dinilai: number
    total_assessments: number
    rata_rata_keseluruhan: number
  }
}

const STATUS_COLORS = ['#0E6187', '#38bdf8', '#f59e0b', '#10b981', '#94a3b8', '#818cf8', '#f43f5e']

export default function DashboardAkademik() {
  const [siswa, setSiswa] = useState<SiswaItem[]>([])
  const [guru, setGuru] = useState<GuruItem[]>([])
  const [kelasSensei, setKelasSensei] = useState<KelasSensei[]>([])
  const [absensiMinggu, setAbsensiMinggu] = useState<any[]>([])
  const [rekap, setRekap] = useState<RekapData | null>(null)
  const [loading, setLoading] = useState(true)

  const todayStr = toLocalDate(new Date())
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 6)
  const weekAgoStr = toLocalDate(weekAgo)

  useEffect(() => {
    Promise.all([
      siswaApi.list({}),
      guruApi.list(),
      kelasSenseiApi.list({}),
      absensiSiswaApi.list({ date_from: weekAgoStr, date_to: todayStr }),
      penilaianApi.rekap(),
    ]).then(([sRes, gRes, kRes, aRes, rRes]) => {
      const sData = sRes.data.data || sRes.data || []
      const gData = gRes.data.data || gRes.data || []
      const kData = kRes.data.data || kRes.data || []
      setSiswa(Array.isArray(sData) ? sData : [])
      setGuru(Array.isArray(gData) ? gData : [])
      setKelasSensei(Array.isArray(kData) ? kData : [])
      setAbsensiMinggu(Array.isArray(aRes.data.data) ? aRes.data.data : [])
      setRekap(rRes.data.data || null)
    }).catch(() => {}).finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const siswaAktif = siswa.filter(s => s.status === 'AKTIF')
  const batchAktif = kelasSensei.filter(k => k.status === 'aktif' || k.status === 'AKTIF')
  const absensiHariIni = absensiMinggu.filter(a => a.tanggal === todayStr)
  const absensiHadir = absensiHariIni.filter(a => a.status === 'hadir')
  const tahun = new Date().getFullYear()

  const penilaianPerBatch = rekap?.per_batch || []
  const belumDinilai = penilaianPerBatch.reduce((s, b) => s + Math.max(0, b.total_siswa - b.siswa_dinilai), 0)
  const rataTertinggi = penilaianPerBatch.length ? Math.max(...penilaianPerBatch.map(b => b.rata_rata)) : 0

  const batchTerbaru = [...kelasSensei]
    .sort((a, b) => (b.id || 0) - (a.id || 0))
    .slice(0, 5)

  const weeklyData = useMemo(() => {
    const days: { label: string; date: string }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push({ label: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][d.getDay()], date: toLocalDate(d) })
    }
    return days.map(({ label, date }) => {
      const dayAbs = absensiMinggu.filter(a => a.tanggal === date)
      return { day: label, total: dayAbs.length, hadir: dayAbs.filter(a => a.status === 'hadir').length }
    })
  }, [absensiMinggu])

  const levelDist = useMemo(() => {
    const map = new Map<string, number>()
    siswa.forEach(s => {
      const lv = s.level && s.level.trim() ? s.level : 'Tanpa Level'
      map.set(lv, (map.get(lv) || 0) + 1)
    })
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [siswa])

  const statusDist = useMemo(() => {
    const map = new Map<string, number>()
    siswa.forEach(s => {
      const st = s.status && s.status.trim() ? s.status : 'Tanpa Status'
      map.set(st, (map.get(st) || 0) + 1)
    })
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 7)
  }, [siswa])

  const lineChartData = {
    labels: weeklyData.map(d => d.day),
    datasets: [
      {
        label: 'Total Absensi',
        data: weeklyData.map(d => d.total),
        borderColor: '#0E6187',
        backgroundColor: 'rgba(14, 97, 135, 0.12)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#0E6187',
        borderWidth: 2,
      },
      {
        label: 'Hadir',
        data: weeklyData.map(d => d.hadir),
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.18)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#38bdf8',
        borderWidth: 2,
      },
    ],
  }

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { usePointStyle: true, boxWidth: 8, padding: 16, font: { size: 11 } },
      },
      tooltip: {
        backgroundColor: '#0E6187',
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#94a3b8' } },
      y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 }, color: '#94a3b8' }, grid: { color: 'rgba(0,0,0,0.04)' } },
    },
  }

  const levelChartData = {
    labels: levelDist.map(d => d[0]),
    datasets: [
      {
        label: 'Jumlah Siswa',
        data: levelDist.map(d => d[1]),
        backgroundColor: '#0E6187',
        hoverBackgroundColor: '#0a4a66',
        borderRadius: 6,
        maxBarThickness: 42,
      },
    ],
  }

  const statusChartData = {
    labels: statusDist.map(d => d[0]),
    datasets: [
      {
        data: statusDist.map(d => d[1]),
        backgroundColor: statusDist.map((_, i) => STATUS_COLORS[i % STATUS_COLORS.length]),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  }

  const rataChartData = {
    labels: penilaianPerBatch.map(b => b.nama_batch),
    datasets: [
      {
        label: 'Rata-rata Nilai',
        data: penilaianPerBatch.map(b => b.rata_rata),
        backgroundColor: penilaianPerBatch.map((_, i) => STATUS_COLORS[i % STATUS_COLORS.length]),
        borderRadius: 6,
        maxBarThickness: 48,
      },
    ],
  }

  const barOptions = (max?: number) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0E6187',
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#94a3b8' } },
      y: { beginAtZero: true, max, ticks: { stepSize: 1, font: { size: 10 }, color: '#94a3b8' }, grid: { color: 'rgba(0,0,0,0.04)' } },
    },
  })

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { usePointStyle: true, boxWidth: 8, padding: 12, font: { size: 10 } },
      },
      tooltip: {
        backgroundColor: '#0E6187',
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 8,
      },
    },
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 sm:px-6 py-3 sm:py-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-gradient-to-br from-[#0E6187] to-[#0a4a66] rounded-xl flex items-center justify-center text-white shadow-sm">
          <BookOpen size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard Akademik</h1>
          <p className="text-sm text-gray-500">Pantau data akademik siswa dan guru</p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-600">Total Siswa</span>
            <div className="bg-[#0E6187] p-2.5 rounded-lg">
              <Users size={16} className="text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{siswa.length}</div>
          <p className="text-xs text-gray-400">Tahun {tahun}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-600">Batch Aktif</span>
            <div className="bg-[#0E6187]/80 p-2.5 rounded-lg">
              <BookOpen size={16} className="text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{batchAktif.length}</div>
          <p className="text-xs text-gray-400">Dari {kelasSensei.length} batch total</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-600">Guru</span>
            <div className="bg-[#0E6187]/60 p-2.5 rounded-lg">
              <GraduationCap size={16} className="text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{guru.length}</div>
          <p className="text-xs text-gray-400">Tahun {tahun}</p>
        </div>
      </div>

      {/* Breakdown Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0E6187]/10 shrink-0">
            <Users size={20} className="text-[#0E6187]" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Siswa Aktif</p>
            <p className="text-xl font-bold text-gray-900">{siswaAktif.length}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0E6187]/10 shrink-0">
            <CheckCircle size={20} className="text-[#0E6187]" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Absensi Hadir (Hari Ini)</p>
            <p className="text-xl font-bold text-[#0E6187]">{absensiHadir.length}</p>
            <p className="text-[10px] text-gray-400">dari {absensiHariIni.length} absensi</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0E6187]/10 shrink-0">
            <Layers size={20} className="text-[#0E6187]" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Batch</p>
            <p className="text-xl font-bold text-gray-900">{kelasSensei.length}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0E6187]/10 shrink-0">
            <Award size={20} className="text-[#0E6187]" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Siswa Dinilai</p>
            <p className="text-xl font-bold text-gray-900">{rekap?.statistik.total_siswa_dinilai ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Breakdown Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0E6187]/10 shrink-0">
            <FileText size={20} className="text-[#0E6187]" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Penilaian</p>
            <p className="text-xl font-bold text-[#0E6187]">{rekap?.statistik.total_assessments ?? 0}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0E6187]/10 shrink-0">
            <Target size={20} className="text-[#0E6187]" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Rata-rata Keseluruhan</p>
            <p className="text-xl font-bold text-[#0E6187]">{rekap?.statistik.rata_rata_keseluruhan ?? 0}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0E6187]/10 shrink-0">
            <BarChart size={20} className="text-[#0E6187]" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Rata-rata Tertinggi</p>
            <p className="text-xl font-bold text-gray-900">{rataTertinggi}</p>
          </div>
        </div>
      </div>

      {/* Breakdown Row 3 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0E6187]/10 shrink-0">
            <PieChart size={20} className="text-[#0E6187]" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Level Terbanyak</p>
            <p className="text-lg font-bold text-gray-900 truncate">{levelDist[0]?.[0] || '-'}</p>
            <p className="text-[10px] text-gray-400">{levelDist[0]?.[1] ?? 0} siswa</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0E6187]/10 shrink-0">
            <ClipboardCheck size={20} className="text-[#0E6187]" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Belum Dinilai</p>
            <p className="text-xl font-bold text-gray-900">{belumDinilai}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0E6187]/10 shrink-0">
            <Clock size={20} className="text-[#0E6187]" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Kehadiran Hari Ini</p>
            <p className="text-xl font-bold text-[#0E6187]">
              {absensiHariIni.length ? Math.round((absensiHadir.length / absensiHariIni.length) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Charts Row 1: Absensi minggu + Distribusi Level */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0E6187]/10">
              <TrendingUp size={18} className="text-[#0E6187]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">Grafik Absensi (7 Hari Terakhir)</h2>
              <p className="text-xs text-gray-400">Total absensi & kehadiran siswa per hari</p>
            </div>
          </div>
          <div className="h-72">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0E6187]/10">
              <Layers size={18} className="text-[#0E6187]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">Distribusi Siswa per Level</h2>
              <p className="text-xs text-gray-400">Jumlah siswa pada tiap level/batch</p>
            </div>
          </div>
          {levelDist.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-16">Belum ada data level</p>
          ) : (
            <div className="h-72">
              <Bar data={levelChartData} options={barOptions()} />
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2: Status + Rata-rata per batch */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0E6187]/10">
              <PieChart size={18} className="text-[#0E6187]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">Status Siswa</h2>
              <p className="text-xs text-gray-400">Komposisi status kandidat</p>
            </div>
          </div>
          {statusDist.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-16">Belum ada data</p>
          ) : (
            <div className="h-72">
              <Doughnut data={statusChartData} options={doughnutOptions} />
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0E6187]/10">
              <Award size={18} className="text-[#0E6187]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">Rata-rata Nilai per Batch</h2>
              <p className="text-xs text-gray-400">Perbandingan rata-rata penilaian antar batch</p>
            </div>
          </div>
          {penilaianPerBatch.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-16">Belum ada penilaian</p>
          ) : (
            <div className="h-72">
              <Bar data={rataChartData} options={barOptions(10)} />
            </div>
          )}
        </div>
      </div>

      {/* Progres Penilaian per Batch */}
      {penilaianPerBatch.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0E6187]/10">
                <ClipboardCheck size={18} className="text-[#0E6187]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800">Progres Penilaian per Batch</h2>
                <p className="text-xs text-gray-400">Kelengkapan penilaian siswa tiap batch</p>
              </div>
            </div>
            <Link to="/guru" className="text-xs text-[#0E6187] font-semibold hover:opacity-80">Kelola Penilaian →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {penilaianPerBatch.map((b) => {
              const progress = b.total_siswa ? Math.round((b.siswa_dinilai / b.total_siswa) * 100) : 0
              const sisa = Math.max(0, b.total_siswa - b.siswa_dinilai)
              return (
                <div key={b.batch_id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-900 text-sm truncate">{b.nama_batch}</p>
                    <span className="shrink-0 ml-1 rounded-full bg-[#0E6187]/10 px-2 py-0.5 text-[11px] font-bold text-[#0E6187]">{b.rata_rata}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{b.siswa_dinilai} dari {b.total_siswa} siswa dinilai</p>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0E6187] rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] font-semibold text-[#0E6187]">{progress}%</span>
                    <span className="text-[10px] text-gray-400">{sisa > 0 ? `Belum dinilai: ${sisa}` : 'Lengkap ✓'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Batch Terbaru + Absensi Hari Ini */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Batch Terbaru */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Batch Terbaru</h2>
            <Link to="/kelas-sensei" className="text-xs text-[#0E6187] font-semibold hover:opacity-80">Lihat Semua →</Link>
          </div>
          <div className="space-y-3">
            {batchTerbaru.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Belum ada batch</p>
            ) : (
              batchTerbaru.map((k) => (
                <div key={k.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{k.nama_kelas}</p>
                    <p className="text-xs text-gray-500">{k.user?.name || '-'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{k.siswa_count || '-'}</p>
                    <span className={`text-xs font-medium ${k.status === 'aktif' || k.status === 'AKTIF' ? 'text-[#0E6187]' : 'text-slate-400'}`}>
                      {k.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Absensi Hari Ini */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-[#0E6187]" />
            Absensi Hari Ini
          </h2>
          <div className="space-y-3">
            {absensiHariIni.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Belum ada absensi hari ini</p>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 bg-[#0E6187]/5 border border-[#0E6187]/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-[#0E6187]" />
                    <span className="text-sm font-medium text-[#0E6187]">Hadir</span>
                  </div>
                  <span className="text-lg font-bold text-[#0E6187]">{absensiHadir.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Lainnya</span>
                  </div>
                  <span className="text-lg font-bold text-gray-600">{absensiHariIni.length - absensiHadir.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#0E6187]/10 border border-[#0E6187]/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-[#0E6187]" />
                    <span className="text-sm font-medium text-[#0E6187]">Total Absensi</span>
                  </div>
                  <span className="text-lg font-bold text-[#0E6187]">{absensiHariIni.length}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      {rekap && rekap.leaderboard.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0E6187]/10">
              <Medal size={18} className="text-[#0E6187]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">Leaderboard Nilai Tertinggi Kandidat</h2>
              <p className="text-xs text-gray-400">20 kandidat dengan rata-rata penilaian terbaik</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-semibold text-gray-600">#</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-600">Nama Kandidat</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-600">Batch</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-600">Level</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-600">Total Penilaian</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-600">Rata-rata</th>
                </tr>
              </thead>
              <tbody>
                {rekap.leaderboard.map((entry, idx) => (
                  <tr key={entry.siswa_id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#0E6187]/10 text-xs font-bold text-[#0E6187]">
                        {idx + 1}
                      </div>
                    </td>
                    <td className="py-3 px-2 font-medium text-gray-900">{entry.nama}</td>
                    <td className="py-3 px-2 text-gray-600">{entry.batch}</td>
                    <td className="py-3 px-2 text-center text-gray-600">{entry.level}</td>
                    <td className="py-3 px-2 text-center text-gray-600">{entry.total_penilaian}</td>
                    <td className="py-3 px-2 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-[#0E6187]">
                        {entry.rata_rata}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}