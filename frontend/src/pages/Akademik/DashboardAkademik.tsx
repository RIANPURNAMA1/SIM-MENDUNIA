import { useEffect, useState, useMemo } from 'react'
import { Users, BookOpen, Calendar, TrendingUp, GraduationCap, Loader, Layers, CheckCircle, Clock, Award, Medal, Target, BarChart, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { siswaApi, guruApi, kelasSenseiApi, absensiSiswaApi, penilaianApi } from '../../services/api'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Filler, Tooltip, Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

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

export default function DashboardAkademik() {
  const [siswa, setSiswa] = useState<SiswaItem[]>([])
  const [guru, setGuru] = useState<GuruItem[]>([])
  const [kelasSensei, setKelasSensei] = useState<KelasSensei[]>([])
  const [absensiHariIni, setAbsensiHariIni] = useState<any[]>([])
  const [rekap, setRekap] = useState<RekapData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      siswaApi.list({}),
      guruApi.list(),
      kelasSenseiApi.list({}),
      absensiSiswaApi.list({ tanggal: new Date().toISOString().split('T')[0] }),
      penilaianApi.rekap(),
    ]).then(([sRes, gRes, kRes, aRes, rRes]) => {
      const sData = sRes.data.data || sRes.data || []
      const gData = gRes.data.data || gRes.data || []
      const kData = kRes.data.data || kRes.data || []
      setSiswa(Array.isArray(sData) ? sData : [])
      setGuru(Array.isArray(gData) ? gData : [])
      setKelasSensei(Array.isArray(kData) ? kData : [])
      setAbsensiHariIni(Array.isArray(aRes.data.data) ? aRes.data.data : [])
      setRekap(rRes.data.data || null)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const siswaAktif = siswa.filter(s => s.status === 'AKTIF')
  const batchAktif = kelasSensei.filter(k => k.status === 'aktif' || k.status === 'AKTIF')
  const absensiHadir = absensiHariIni.filter(a => a.status === 'hadir')

  const batchTerbaru = [...kelasSensei]
    .sort((a, b) => (b.id || 0) - (a.id || 0))
    .slice(0, 5)

  const weeklyData = useMemo(() => {
    const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
    return days.map((day, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const total = absensiHariIni.length
      const hadir = absensiHariIni.filter(a => a.status === 'hadir').length
      return { day, total, hadir }
    })
  }, [absensiHariIni])

  const chartData = {
    labels: weeklyData.map(d => d.day),
    datasets: [
      {
        label: 'Total Absensi',
        data: weeklyData.map(d => d.total),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#6366f1',
        borderWidth: 2,
      },
      {
        label: 'Hadir',
        data: weeklyData.map(d => d.hadir),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#10b981',
        borderWidth: 2,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { usePointStyle: true, boxWidth: 8, padding: 16, font: { size: 11 } },
      },
      tooltip: {
        backgroundColor: '#0D1F3C',
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

  const stats = [
    { label: 'Total Siswa', value: siswa.length, icon: Users, color: 'bg-blue-500' },
    { label: 'Batch Aktif', value: batchAktif.length, icon: BookOpen, color: 'bg-purple-500' },
    { label: 'Guru', value: guru.length, icon: Users, color: 'bg-green-500' },
  ]

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <div className="flex items-center gap-3">
          <Loader size={20} className="animate-spin text-slate-400" />
          <span className="text-sm text-slate-500">Memuat data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 sm:px-6 py-3 sm:py-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Akademik</h1>
            <p className="text-sm text-gray-500">Pantau data akademik siswa dan guru</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-600">{stat.label}</span>
                <div className={`${stat.color} p-2.5 rounded-lg`}>
                  <Icon size={16} className="text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <p className="text-xs text-gray-400">Tahun 2026</p>
            </div>
          )
        })}
      </div>

      {/* Breakdown */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 shrink-0">
            <GraduationCap size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Siswa Aktif</p>
            <p className="text-xl font-bold text-gray-900">{siswaAktif.length}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 shrink-0">
            <CheckCircle size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Absensi Hadir (Hari Ini)</p>
            <p className="text-xl font-bold text-emerald-600">{absensiHadir.length}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-purple-50 shrink-0">
            <BookOpen size={20} className="text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Batch</p>
            <p className="text-xl font-bold text-gray-900">{kelasSensei.length}</p>
          </div>
        </div>
      </div>

      {/* Penilaian Summary Cards */}
      {rekap && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 shrink-0">
              <Award size={20} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Siswa Dinilai</p>
              <p className="text-xl font-bold text-gray-900">{rekap.statistik.total_siswa_dinilai}</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 shrink-0">
              <FileText size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Penilaian</p>
              <p className="text-xl font-bold text-blue-700">{rekap.statistik.total_assessments}</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 shrink-0">
              <Target size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Rata-rata Keseluruhan</p>
              <p className="text-xl font-bold text-emerald-700">{rekap.statistik.rata_rata_keseluruhan}</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-purple-50 shrink-0">
              <BarChart size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Batch Aktif Dinilai</p>
              <p className="text-xl font-bold text-gray-900">{rekap.per_batch.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                <TrendingUp size={18} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800">Grafik Absensi (Minggu Ini)</h2>
                <p className="text-xs text-gray-400">Total absensi & kehadiran siswa</p>
              </div>
            </div>
          </div>
          <div className="h-72 sm:h-80">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Per Batch Penilaian */}
      {rekap && rekap.per_batch.length > 0 && (
        <div className="mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
                  <Layers size={18} className="text-orange-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-800">Penilaian Per Batch</h2>
                  <p className="text-xs text-gray-400">Rata-rata nilai dan statistik per batch</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rekap.per_batch.map((b) => (
                <div key={b.batch_id} className="border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-white">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{b.nama_batch}</h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-medium">
                      {b.siswa_dinilai}/{b.total_siswa} siswa
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Rata-rata</p>
                      <p className="text-lg font-bold text-indigo-600">{b.rata_rata}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Penilaian</p>
                      <p className="text-lg font-bold text-gray-800">{b.total_assessments}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Siswa</p>
                      <p className="text-lg font-bold text-gray-800">{b.total_siswa}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Batch Terbaru */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Batch Terbaru</h2>
            <Link to="/kelas-sensei" className="text-xs text-blue-600 font-semibold hover:text-blue-700">Lihat Semua →</Link>
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
                    <span className={`text-xs font-medium ${k.status === 'aktif' || k.status === 'AKTIF' ? 'text-emerald-600' : 'text-slate-400'}`}>
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
            <Calendar size={20} />
            Absensi Hari Ini
          </h2>
          <div className="space-y-3">
            {absensiHariIni.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Belum ada absensi hari ini</p>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-800">Hadir</span>
                  </div>
                  <span className="text-lg font-bold text-emerald-700">{absensiHadir.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">Lainnya</span>
                  </div>
                  <span className="text-lg font-bold text-amber-700">{absensiHariIni.length - absensiHadir.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Total Absensi</span>
                  </div>
                  <span className="text-lg font-bold text-blue-700">{absensiHariIni.length}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      {rekap && rekap.leaderboard.length > 0 && (
        <div className="mt-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-50">
                <Medal size={18} className="text-yellow-600" />
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
                        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                          {idx + 1}
                        </div>
                      </td>
                      <td className="py-3 px-2 font-medium text-gray-900">{entry.nama}</td>
                      <td className="py-3 px-2 text-gray-600">{entry.batch}</td>
                      <td className="py-3 px-2 text-center text-gray-600">{entry.level}</td>
                      <td className="py-3 px-2 text-center text-gray-600">{entry.total_penilaian}</td>
                      <td className="py-3 px-2 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-indigo-600">
                          {entry.rata_rata}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
