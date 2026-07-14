import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users, DollarSign, Clock, CheckCircle, AlertCircle,
  Layers, UserX, Wallet, TrendingUp, Activity,
} from 'lucide-react'
import { adminCabangApi } from '../../services/api'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Filler, Tooltip, Legend,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Filler, Tooltip, Legend)

const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#14b8a6', '#6366f1']

interface DashboardData {
  user: { name: string; email: string; role: string }
  branches: number[]
  stats: {
    total_pendaftar: number
    pendaftar_disetujui: number
    pendaftar_pending: number
    pendaftar_ditolak: number
    total_tagihan: number
    total_terkumpul: number
    total_outstanding: number
    total_siswa_aktif: number
    total_pengeluaran_bulan_ini: number
  }
  batches: { id: number; nama_batch: string; siswas_count: number }[]
  recent_pendaftar: { id: number; nama: string; batch: string; program: string; status: string; created_at: string }[]
  recent_pembayaran: { id: number; jumlah: number; pendaftar: string; batch: string; created_at: string }[]
  charts: {
    rekap_pendaftar: { label: string; total: number }[]
    rekap_pembayaran: { label: string; total: number }[]
    rekap_pengeluaran: { label: string; total: number }[]
    pengeluaran_per_kategori: { nama: string; kode: string; total: number; jumlah: number }[]
  }
}

const statusColor: Record<string, string> = {
  disetujui: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  ditolak: 'bg-red-50 text-red-700',
}

export default function AdminCabangDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminCabangApi.dashboard()
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="px-6 py-8 flex items-center justify-center min-h-[50vh]">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0D1F3C] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  if (!data) return null

  const persentaseTagihan = data.stats.total_tagihan > 0
    ? Math.round((data.stats.total_terkumpul / data.stats.total_tagihan) * 100)
    : 0

  // === CHART CONFIGS ===

  const barPendaftar = {
    labels: data.charts.rekap_pendaftar.map(r => r.label),
    datasets: [{
      label: 'Pendaftar',
      data: data.charts.rekap_pendaftar.map(r => r.total),
      backgroundColor: '#3b82f6',
      borderRadius: 6,
      barThickness: 28,
    }],
  }

  const linePembayaran = {
    labels: data.charts.rekap_pembayaran.map(r => r.label),
    datasets: [{
      label: 'Pembayaran',
      data: data.charts.rekap_pembayaran.map(r => r.total),
      borderColor: '#10b981',
      backgroundColor: 'rgba(16,185,129,0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#10b981',
    }],
  }

  const barPengeluaran = {
    labels: data.charts.rekap_pengeluaran.map(r => r.label),
    datasets: [{
      label: 'Pengeluaran',
      data: data.charts.rekap_pengeluaran.map(r => r.total),
      backgroundColor: '#f97316',
      borderRadius: 6,
      barThickness: 28,
    }],
  }

  const doughnutKategori = {
    labels: data.charts.pengeluaran_per_kategori.map(k => k.nama),
    datasets: [{
      data: data.charts.pengeluaran_per_kategori.map(k => k.total),
      backgroundColor: COLORS.slice(0, data.charts.pengeluaran_per_kategori.length),
      borderWidth: 2,
      borderColor: '#ffffff',
    }],
  }

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

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { padding: 12, usePointStyle: true, pointStyle: 'circle', font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: number | null }) => ctx.parsed !== null ? formatRupiah(ctx.parsed) : '',
        },
      },
    },
    cutout: '65%',
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] border border-blue-100">
          <LayoutDashboard size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Dashboard Admin Cabang</h1>
          <p className="text-sm text-slate-500">Selamat datang, {data.user.name}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: <Users size={20} className="text-blue-600" />, bg: 'bg-blue-50', label: 'Total Pendaftar', value: data.stats.total_pendaftar, color: 'text-slate-800' },
          { icon: <CheckCircle size={20} className="text-emerald-600" />, bg: 'bg-emerald-50', label: 'Disetujui', value: data.stats.pendaftar_disetujui, color: 'text-emerald-700' },
          { icon: <Clock size={20} className="text-amber-600" />, bg: 'bg-amber-50', label: 'Pending', value: data.stats.pendaftar_pending, color: 'text-amber-700' },
          { icon: <UserX size={20} className="text-red-600" />, bg: 'bg-red-50', label: 'Ditolak', value: data.stats.pendaftar_ditolak, color: 'text-red-700' },
        ].map((s, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}>{s.icon}</div>
              <div>
                <p className="text-xs font-medium text-slate-500">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50"><Activity size={20} className="text-indigo-600" /></div>
            <div>
              <p className="text-xs font-medium text-slate-500">Siswa Aktif</p>
              <p className="text-xl font-bold text-indigo-700">{data.stats.total_siswa_aktif}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50"><Wallet size={20} className="text-rose-600" /></div>
            <div>
              <p className="text-xs font-medium text-slate-500">Pengeluaran Bulan Ini</p>
              <p className="text-xl font-bold text-rose-700">Rp {fmt(data.stats.total_pengeluaran_bulan_ini)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50"><AlertCircle size={20} className="text-red-600" /></div>
            <div>
              <p className="text-xs font-medium text-red-600">Outstanding</p>
              <p className="text-xl font-bold text-red-700">Rp {fmt(data.stats.total_outstanding)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* === CHARTS ROW 1 === */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Bar: Pendaftar per bulan */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-800">Pendaftar per Bulan</h3>
          </div>
          <div className="h-56">
            <Bar data={barPendaftar} options={barOptions} />
          </div>
        </div>

        {/* Line: Pembayaran per bulan */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={18} className="text-emerald-600" />
            <h3 className="text-sm font-semibold text-slate-800">Pembayaran per Bulan</h3>
          </div>
          <div className="h-56">
            <Line data={linePembayaran} options={lineOptions} />
          </div>
        </div>
      </div>

      {/* === CHARTS ROW 2 === */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Bar: Pengeluaran per bulan */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={18} className="text-orange-600" />
            <h3 className="text-sm font-semibold text-slate-800">Pengeluaran per Bulan</h3>
          </div>
          <div className="h-56">
            <Bar data={barPengeluaran} options={barOptions} />
          </div>
        </div>

        {/* Doughnut: Pengeluaran per kategori */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Layers size={18} className="text-purple-600" />
            <h3 className="text-sm font-semibold text-slate-800">Pengeluaran per Kategori</h3>
          </div>
          <div className="h-56">
            {data.charts.pengeluaran_per_kategori.length === 0
              ? <div className="flex items-center justify-center h-full text-xs text-slate-400">Belum ada data</div>
              : <Doughnut data={doughnutKategori} options={doughnutOptions} />
            }
          </div>
        </div>
      </div>

      {/* === REKAP KEUANGAN + BATCH === */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={18} className="text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-800">Rekap Keuangan</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Total Tagihan</span>
              <span className="text-sm font-bold text-slate-800">Rp {fmt(data.stats.total_tagihan)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-emerald-600">Terkumpul</span>
              <span className="text-sm font-bold text-emerald-700">Rp {fmt(data.stats.total_terkumpul)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-red-600">Outstanding</span>
              <span className="text-sm font-bold text-red-600">Rp {fmt(data.stats.total_outstanding)}</span>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-500">Persentase Terkumpul</span>
                <span className="text-xs font-bold text-emerald-600">{persentaseTagihan}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(persentaseTagihan, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Layers size={18} className="text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-800">Batch Aktif</h3>
          </div>
          {data.batches.length === 0
            ? <p className="text-xs text-slate-400">Tidak ada batch</p>
            : (
              <div className="space-y-2">
                {data.batches.slice(0, 5).map(b => (
                  <div key={b.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-medium text-slate-700">{b.nama_batch}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{b.siswas_count} siswa</span>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>

      {/* === RECENT ACTIVITY === */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-800">Pendaftar Terbaru</h3>
          </div>
          {data.recent_pendaftar.length === 0
            ? <p className="text-xs text-slate-400 py-4 text-center">Belum ada pendaftar</p>
            : (
              <div className="space-y-2">
                {data.recent_pendaftar.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{p.nama}</p>
                      <p className="text-[10px] text-slate-400">{p.batch} - {p.program}</p>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${statusColor[p.status] || 'bg-slate-50 text-slate-600'}`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={18} className="text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-800">Pembayaran Terbaru</h3>
          </div>
          {data.recent_pembayaran.length === 0
            ? <p className="text-xs text-slate-400 py-4 text-center">Belum ada pembayaran</p>
            : (
              <div className="space-y-2">
                {data.recent_pembayaran.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{p.pendaftar}</p>
                      <p className="text-[10px] text-slate-400">{p.batch}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 whitespace-nowrap">Rp {fmt(p.jumlah)}</span>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}
