import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Users, CheckCircle, Clock, UserX, Building2, Layers, TrendingUp, MapPin,
} from 'lucide-react'
import { adminPusatApi } from '../../services/api'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const BRAND = '#0E6187'
const COLORS = ['#0E6187', '#3b7ea6', '#5b95b5', '#7dacc4', '#9fc3d3', '#b8d3e0', '#d1e3ec', '#e5eef4', '#9ca3af', '#d1d5db']
const STATUS_COLORS = { disetujui: '#137333', pending: '#f9ab00', ditolak: '#d93025' }

interface BatchRow {
  batch_id: number | null
  nama_batch: string
  warna: string | null
  total: number
  disetujui: number
  pending: number
  ditolak: number
}

interface CabangRow {
  cabang_id: number | null
  cabang_nama: string
  total: number
  disetujui: number
  pending: number
  ditolak: number
  batches: BatchRow[]
}

interface DashboardData {
  user: { name: string; role: string }
  stats: {
    total_pendaftar: number
    pendaftar_disetujui: number
    pendaftar_pending: number
    pendaftar_ditolak: number
    total_cabang: number
    total_batch: number
  }
  per_cabang: CabangRow[]
  recent_pendaftar: { id: number; nama: string; batch: string; cabang: string; status: string; created_at: string }[]
}

const statusBadge: Record<string, string> = {
  disetujui: 'bg-[#e6f4ea] text-[#137333]',
  pending: 'bg-[#fef7e0] text-[#b06000]',
  ditolak: 'bg-[#fce8e6] text-[#a50e0e]',
}

const dateFmt = (s: string) => {
  if (!s) return '-'
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminPusatDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminPusatApi.dashboard()
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="px-6 py-8 flex items-center justify-center min-h-[50vh]">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="px-6 py-16 text-center text-sm text-[#80868b]">
        Gagal memuat data dashboard.
      </div>
    )
  }

  const cabangLabels = data.per_cabang.map(c => c.cabang_nama)
  const allBatches = data.per_cabang
    .flatMap(c => c.batches)
    .sort((a, b) => b.total - a.total)

  const doughnutCabang = {
    labels: cabangLabels,
    datasets: [{
      data: data.per_cabang.map(c => c.total),
      backgroundColor: COLORS.slice(0, data.per_cabang.length),
      borderWidth: 2,
      borderColor: '#ffffff',
    }],
  }

  const barBatch = {
    labels: allBatches.map(b => b.nama_batch),
    datasets: [
      { label: 'Disetujui', data: allBatches.map(b => b.disetujui), backgroundColor: STATUS_COLORS.disetujui, borderRadius: 4 },
      { label: 'Pending', data: allBatches.map(b => b.pending), backgroundColor: STATUS_COLORS.pending, borderRadius: 4 },
      { label: 'Ditolak', data: allBatches.map(b => b.ditolak), backgroundColor: STATUS_COLORS.ditolak, borderRadius: 4 },
    ],
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { padding: 12, usePointStyle: true, pointStyle: 'circle', font: { size: 11 } } },
    },
    cutout: '62%',
  }

  const stackedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { padding: 12, usePointStyle: true, pointStyle: 'circle', font: { size: 11 } } },
    },
    scales: {
      x: { stacked: true, ticks: { color: '#94a3b8', font: { size: 10 }, maxRotation: 45, minRotation: 0 }, grid: { display: false } },
      y: { stacked: true, beginAtZero: true, ticks: { color: '#94a3b8', font: { size: 11 }, precision: 0 }, grid: { color: '#f1f5f9' } },
    },
  }

  const cards = [
    { icon: Users, label: 'Total Pendaftar', value: data.stats.total_pendaftar },
    { icon: CheckCircle, label: 'Disetujui (Masuk)', value: data.stats.pendaftar_disetujui, color: 'text-[#137333]' },
    { icon: Clock, label: 'Pending', value: data.stats.pendaftar_pending, color: 'text-[#b06000]' },
    { icon: UserX, label: 'Ditolak', value: data.stats.pendaftar_ditolak, color: 'text-[#a50e0e]' },
    { icon: Building2, label: 'Total Cabang', value: data.stats.total_cabang },
    { icon: Layers, label: 'Total Batch', value: data.stats.total_batch },
  ]

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3 border-b border-[#dadce0] pb-4">
        <div className="flex h-10 w-10 items-center justify-center bg-[#e8f0fe] text-[#1a73e8]">
          <LayoutDashboard size={20} />
        </div>
        <div>
          <h1 className="text-xl font-medium text-[#202124]">Dashboard Admin Pusat</h1>
          <p className="text-sm text-[#5f6368]">Rekap pendaftar per cabang & per batch · Selamat datang, {data.user.name}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="flex min-w-0 items-center gap-3 border border-[#dadce0] bg-white p-3 sm:p-4">
              <div className="flex h-9 w-9 flex-none items-center justify-center bg-[#f1f3f4] sm:h-10 sm:w-10">
                <Icon size={16} className={s.color || 'text-[#1a73e8]'} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] text-[#5f6368] sm:text-xs">{s.label}</p>
                <p className="break-words text-base font-medium leading-tight text-[#202124] sm:text-xl">{s.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="border border-[#dadce0] bg-white p-4">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center bg-[#f8f9fa]">
              <MapPin size={18} className="text-[#1a73e8]" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-[#202124]">Pendaftar per Cabang</h2>
              <p className="text-xs text-[#80868b]">Distribusi jumlah pendaftar tiap cabang</p>
            </div>
          </div>
          <div className="h-72 sm:h-80">
            {data.per_cabang.length === 0
              ? <div className="flex h-full items-center justify-center text-sm text-[#80868b]">Belum ada data</div>
              : <Doughnut data={doughnutCabang} options={doughnutOptions} />
            }
          </div>
        </div>

        <div className="border border-[#dadce0] bg-white p-4">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center bg-[#f8f9fa]">
              <TrendingUp size={18} className="text-[#137333]" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-[#202124]">Pendaftar per Batch</h2>
              <p className="text-xs text-[#80868b]">Jumlah pendaftar tiap batch berdasarkan status</p>
            </div>
          </div>
          <div className="h-72 sm:h-80">
            {allBatches.length === 0
              ? <div className="flex h-full items-center justify-center text-sm text-[#80868b]">Belum ada data</div>
              : <Bar data={barBatch} options={stackedBarOptions} />
            }
          </div>
        </div>
      </div>

      {/* Rekap per Cabang */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-medium text-[#202124]">Rekap per Cabang &amp; Batch</h2>
        {data.per_cabang.length === 0 ? (
          <div className="border border-[#dadce0] bg-white p-8 text-center text-sm text-[#80868b]">Belum ada data pendaftar</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {data.per_cabang.map(c => (
              <div key={String(c.cabang_id)} className="border border-[#dadce0] bg-white">
                <div className="flex items-center justify-between border-b border-[#e8eaed] px-4 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 size={16} className="text-[#1a73e8] shrink-0" />
                    <span className="truncate text-sm font-medium text-[#202124]">{c.cabang_nama}</span>
                  </div>
                  <span className="text-xs font-medium text-[#5f6368] whitespace-nowrap ml-2">{c.total} pendaftar</span>
                </div>
                <div className="flex flex-wrap gap-2 px-4 py-2.5 border-b border-[#e8eaed]">
                  <span className={`px-2 py-0.5 text-[11px] font-medium ${statusBadge.disetujui}`}>{c.disetujui} disetujui</span>
                  <span className={`px-2 py-0.5 text-[11px] font-medium ${statusBadge.pending}`}>{c.pending} pending</span>
                  <span className={`px-2 py-0.5 text-[11px] font-medium ${statusBadge.ditolak}`}>{c.ditolak} ditolak</span>
                </div>
                <div className="divide-y divide-[#f1f3f4]">
                  {c.batches.map(b => (
                    <div key={String(b.batch_id)} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: b.warna || BRAND }} />
                        <span className="truncate text-xs text-[#3c4043]">{b.nama_batch}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2 text-[11px] font-medium">
                        <span className="text-[#5f6368]">{b.total}</span>
                        <span className="text-[#137333]">{b.disetujui}</span>
                        <span className="text-[#b06000]">{b.pending}</span>
                        <span className="text-[#a50e0e]">{b.ditolak}</span>
                      </div>
                    </div>
                  ))}
                  {c.batches.length === 0 && (
                    <div className="px-4 py-2.5 text-xs text-[#80868b]">Tanpa batch</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pendaftar Terbaru */}
      <div className="border border-[#dadce0] bg-white p-4">
        <h2 className="mb-4 text-sm font-medium text-[#202124]">Pendaftar Terbaru</h2>
        {data.recent_pendaftar.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#80868b]">Belum ada pendaftar</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-[#80868b]">
                  <th className="py-2 pr-3 font-medium">Nama</th>
                  <th className="py-2 pr-3 font-medium">Cabang</th>
                  <th className="py-2 pr-3 font-medium">Batch</th>
                  <th className="py-2 pr-3 font-medium">Tanggal</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f4]">
                {data.recent_pendaftar.map(p => (
                  <tr key={p.id}>
                    <td className="py-2.5 pr-3 font-medium text-[#202124]">{p.nama || '-'}</td>
                    <td className="py-2.5 pr-3 text-[#5f6368]">{p.cabang}</td>
                    <td className="py-2.5 pr-3 text-[#5f6368]">{p.batch}</td>
                    <td className="py-2.5 pr-3 text-[#5f6368] whitespace-nowrap">{dateFmt(p.created_at)}</td>
                    <td className="py-2.5">
                      <span className={`inline-block px-2 py-0.5 text-[11px] font-medium capitalize ${statusBadge[p.status] || 'bg-[#f1f3f4] text-[#5f6368]'}`}>
                        {p.status || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
