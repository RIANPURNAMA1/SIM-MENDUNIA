import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutDashboard, Users, DollarSign, Clock, CheckCircle, Wallet,
  TrendingUp, ArrowRight, Handshake, FileText, CreditCard, ClipboardCheck,
} from 'lucide-react'
import { adminMutasiApi } from '../../services/api'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Filler, Tooltip, Legend,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Filler, Tooltip, Legend)

const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const BRAND = '#0E6187'

interface DashboardData {
  user: { name: string; email: string; role: string }
  stats: {
    total_pendaftar: number
    pendaftar_pending: number
    pendaftar_disetujui: number
    pendaftar_ditolak: number
    pembayaran_pending: number
    pendapatan_verified: number
    pendapatan_bulan_ini: number
    komisi_pending: number
    komisi_paid: number
    komisi_cair: number
  }
  recent_pendaftar: {
    id: number; nama: string; email: string; batch: string; program: string
    status_pendaftaran: string; status_pembayaran: string; created_at: string
  }[]
  recent_pembayaran: {
    id: number; jumlah: number; status: string; pendaftar: string; batch: string; created_at: string
  }[]
  charts: {
    rekap_pendaftar: { label: string; total: number }[]
    rekap_pendapatan: { label: string; total: number }[]
    rekap_komisi: { label: string; total: number }[]
  }
}

const statusColor: Record<string, string> = {
  disetujui: 'bg-[#e6f4ea] text-[#137333]',
  pending: 'bg-[#fef7e0] text-[#b06000]',
  ditolak: 'bg-[#fce8e6] text-[#a50e0e]',
}

export default function AdminMutasiDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminMutasiApi.dashboard()
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6 py-8">
        <div className="relative flex h-14 w-14 items-center justify-center">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187]" />
          <img src="/logo-sm.png" alt="Mendunia" className="h-7 w-7" />
        </div>
      </div>
    )
  }

  if (!data) return null

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { color: '#f1f5f9' } },
      x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { display: false } },
    },
  }

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (v: string | number) => {
            const num = typeof v === 'string' ? parseFloat(v) : v
            if (num >= 1000000) return `${(num / 1000000).toFixed(0)}jt`
            if (num >= 1000) return `${(num / 1000).toFixed(0)}rb`
            return v
          },
          color: '#94a3b8', font: { size: 11 },
        },
        grid: { color: '#f1f5f9' },
      },
      x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { display: false } },
    },
  }

  const barPendaftar = {
    labels: data.charts.rekap_pendaftar.map(r => r.label),
    datasets: [{
      label: 'Pendaftar',
      data: data.charts.rekap_pendaftar.map(r => r.total),
      backgroundColor: BRAND,
      borderRadius: 6,
      barThickness: 28,
    }],
  }

  const linePendapatan = {
    labels: data.charts.rekap_pendapatan.map(r => r.label),
    datasets: [{
      label: 'Pendapatan',
      data: data.charts.rekap_pendapatan.map(r => r.total),
      borderColor: '#137333',
      backgroundColor: 'rgba(19,115,51,0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#137333',
    }],
  }

  const barKomisi = {
    labels: data.charts.rekap_komisi.map(r => r.label),
    datasets: [{
      label: 'Komisi',
      data: data.charts.rekap_komisi.map(r => r.total),
      backgroundColor: '#b06000',
      borderRadius: 6,
      barThickness: 28,
    }],
  }

  const quickLinks = [
    { label: 'Verifikasi Pendaftaran', desc: `${data.stats.pendaftar_pending} menunggu`, icon: Users, to: '/pendaftar', color: 'text-[#1a73e8] bg-[#e8f0fe]' },
    { label: 'Verifikasi Tagihan', desc: `${data.stats.pembayaran_pending} menunggu`, icon: FileText, to: '/tagihan', color: 'text-[#b06000] bg-[#fef7e0]' },
    { label: 'Data Keuangan Masuk', desc: `Rp ${fmt(data.stats.pendapatan_verified)}`, icon: CreditCard, to: '/pembayaran', color: 'text-[#137333] bg-[#e6f4ea]' },
    { label: 'Pencairan Komisi', desc: `Rp ${fmt(data.stats.komisi_pending)} pending`, icon: Handshake, to: '/admin-mutasi/komisi', color: 'text-[#8430ce] bg-[#f3e8fd]' },
  ]

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-[#e8f0fe] text-[#1a73e8]">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Dashboard Admin Mutasi</h1>
            <p className="text-sm text-[#5f6368]">Selamat datang, {data.user.name}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Clock, label: 'Pendaftaran Menunggu', value: data.stats.pendaftar_pending },
          { icon: ClipboardCheck, label: 'Tagihan Menunggu', value: data.stats.pembayaran_pending },
          { icon: DollarSign, label: 'Keuangan Masuk', value: `Rp ${fmt(data.stats.pendapatan_verified)}` },
          { icon: Handshake, label: 'Komisi Pending', value: `Rp ${fmt(data.stats.komisi_pending)}` },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="flex min-w-0 items-center gap-3 border border-[#dadce0] bg-white p-3 sm:p-4">
              <div className="flex h-9 w-9 flex-none items-center justify-center bg-[#f1f3f4] sm:h-10 sm:w-10">
                <Icon size={16} className="text-[#1a73e8]" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] text-[#5f6368] sm:text-xs">{s.label}</p>
                <p className="break-words text-base font-medium leading-tight text-[#202124] sm:text-xl lg:text-2xl">{s.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Secondary Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Users, label: 'Total Pendaftar', value: data.stats.total_pendaftar },
          { icon: CheckCircle, label: 'Disetujui', value: data.stats.pendaftar_disetujui },
          { icon: Wallet, label: 'Komisi Dibayar', value: `Rp ${fmt(data.stats.komisi_paid)}` },
          { icon: Wallet, label: 'Komisi Cair', value: `Rp ${fmt(data.stats.komisi_cair)}` },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="flex min-w-0 items-center gap-3 border border-[#dadce0] bg-white p-3 sm:p-4">
              <div className="flex h-9 w-9 flex-none items-center justify-center bg-[#f1f3f4] sm:h-10 sm:w-10">
                <Icon size={16} className="text-[#1a73e8]" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] text-[#5f6368] sm:text-xs">{s.label}</p>
                <p className="break-words text-base font-medium leading-tight text-[#202124] sm:text-xl lg:text-2xl">{s.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Links */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map(q => {
          const Icon = q.icon
          return (
            <Link key={q.to} to={q.to}
              className="group flex items-center gap-3 border border-[#dadce0] bg-white p-4 transition hover:border-[#1a73e8] hover:bg-[#f8fafc]">
              <div className={`flex h-10 w-10 flex-none items-center justify-center ${q.color}`}>
                <Icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#202124]">{q.label}</p>
                <p className="truncate text-xs text-[#5f6368]">{q.desc}</p>
              </div>
              <ArrowRight size={16} className="flex-none text-[#9aa0a6] transition group-hover:translate-x-0.5 group-hover:text-[#1a73e8]" />
            </Link>
          )
        })}
      </div>

      {/* Charts */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="border border-[#dadce0] bg-white p-4">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-[#f8f9fa]">
              <TrendingUp size={18} className="text-[#1a73e8]" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-[#202124]">Pendaftar per Bulan</h2>
              <p className="text-xs text-[#80868b]">Jumlah pendaftar per bulan</p>
            </div>
          </div>
          <div className="h-72 sm:h-80">
            <Bar data={barPendaftar} options={barOptions} />
          </div>
        </div>

        <div className="border border-[#dadce0] bg-white p-4">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-[#f8f9fa]">
              <DollarSign size={18} className="text-[#137333]" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-[#202124]">Keuangan Masuk per Bulan</h2>
              <p className="text-xs text-[#80868b]">Pembayaran terverifikasi per bulan</p>
            </div>
          </div>
          <div className="h-72 sm:h-80">
            <Line data={linePendapatan} options={lineOptions} />
          </div>
        </div>
      </div>

      <div className="mb-6 border border-[#dadce0] bg-white p-4">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center bg-[#f8f9fa]">
            <Handshake size={18} className="text-[#b06000]" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-[#202124]">Komisi Affiliate per Bulan</h2>
            <p className="text-xs text-[#80868b]">Nilai komisi yang tercatat per bulan</p>
          </div>
        </div>
        <div className="h-72 sm:h-80">
          <Bar data={barKomisi} options={barOptions} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="border border-[#dadce0] bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-[#202124]">Pendaftar Terbaru</h2>
            <Link to="/pendaftar" className="text-xs font-medium text-[#1a73e8] hover:underline">Lihat Semua →</Link>
          </div>
          <div className="space-y-3">
            {data.recent_pendaftar.length === 0
              ? <p className="py-6 text-center text-sm text-[#80868b]">Belum ada pendaftar</p>
              : data.recent_pendaftar.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-[#f8f9fa] p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#202124]">{p.nama || '-'}</p>
                    <p className="truncate text-xs text-[#5f6368]">{p.batch} - {p.program}</p>
                  </div>
                  <span className={`whitespace-nowrap px-2.5 py-1 text-xs font-medium ${statusColor[p.status_pendaftaran] || 'bg-[#f1f3f4] text-[#5f6368]'}`}>
                    {p.status_pendaftaran}
                  </span>
                </div>
              ))
            }
          </div>
        </div>

        <div className="border border-[#dadce0] bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-[#202124]">Pembayaran Terbaru</h2>
            <Link to="/tagihan" className="text-xs font-medium text-[#1a73e8] hover:underline">Lihat Semua →</Link>
          </div>
          <div className="space-y-3">
            {data.recent_pembayaran.length === 0
              ? <p className="py-6 text-center text-sm text-[#80868b]">Belum ada pembayaran</p>
              : data.recent_pembayaran.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-[#f8f9fa] p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#202124]">{p.pendaftar || '-'}</p>
                    <p className="truncate text-xs text-[#5f6368]">{p.batch}</p>
                  </div>
                  <span className="whitespace-nowrap text-sm font-medium text-[#137333]">Rp {fmt(p.jumlah)}</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}
