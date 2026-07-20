import { useEffect, useState } from 'react'
import {
  Wallet, TrendingDown, TrendingUp, Receipt, ArrowDown, ArrowUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { pengeluaranApi } from '../../services/api'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Filler, Tooltip, Legend,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Filler, Tooltip, Legend)

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

interface DashboardData {
  total_bulan_ini: number
  total_bulan_lalu: number
  total_semua: number
  jumlah_transaksi_bulan_ini: number
  persentase_bulan_lalu: number
  pendapatan_bulan_ini: number
  laba_bulan_ini: number
  rekap_bulanan: { bulan: number; label: string; total: number; jumlah: number }[]
  per_kategori: { nama: string; kode: string; total: number; jumlah: number }[]
  recent: {
    id: number; tanggal: string; nominal: number; keterangan: string | null
    kategori: { nama: string; kode: string }; user: { name: string }
  }[]
}

const COLORS = [
  '#f97316', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6',
  '#f59e0b', '#06b6d4', '#ec4899', '#14b8a6', '#6366f1',
]

export default function DashboardKeuangan() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    pengeluaranApi.dashboard()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-500">Memuat dashboard keuangan...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const barChartData = {
    labels: data.rekap_bulanan.map(r => r.label),
    datasets: [
      {
        label: 'Pengeluaran',
        data: data.rekap_bulanan.map(r => r.total),
        backgroundColor: '#f97316',
        borderRadius: 6,
        barThickness: 28,
      },
    ],
  }

  const lineChartData = {
    labels: data.rekap_bulanan.map(r => r.label),
    datasets: [
      {
        label: 'Pengeluaran',
        data: data.rekap_bulanan.map(r => r.total),
        borderColor: '#f97316',
        backgroundColor: 'rgba(249,115,22,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#f97316',
      },
    ],
  }

  const doughnutData = {
    labels: data.per_kategori.map(k => k.nama),
    datasets: [
      {
        data: data.per_kategori.map(k => k.total),
        backgroundColor: COLORS.slice(0, data.per_kategori.length),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { y: number | null } }) => ctx.parsed.y !== null ? formatRupiah(ctx.parsed.y) : '',
        },
      },
    },
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
          color: '#94a3b8',
          font: { size: 11 },
        },
        grid: { color: '#f1f5f9' },
      },
      x: {
        ticks: { color: '#94a3b8', font: { size: 11 } },
        grid: { display: false },
      },
    },
  }

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { y: number | null } }) => ctx.parsed.y !== null ? formatRupiah(ctx.parsed.y) : '',
        },
      },
    },
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
          color: '#94a3b8',
          font: { size: 11 },
        },
        grid: { color: '#f1f5f9' },
      },
      x: {
        ticks: { color: '#94a3b8', font: { size: 11 } },
        grid: { display: false },
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: number; label: string }) => `${ctx.label}: ${formatRupiah(ctx.parsed)}`,
        },
      },
    },
  }

  const bulanNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] border border-blue-100">
            <Wallet size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Dashboard Keuangan</h1>
            <p className="text-sm text-slate-500">{bulanNames[new Date().getMonth()]} {new Date().getFullYear()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to="/pengeluaran"
            className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-orange-700"
          >
            <Receipt size={16} />
            Lihat Semua Pengeluaran
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pengeluaran Bulan Ini</span>
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <Wallet size={16} className="text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatRupiah(data.total_bulan_ini)}</p>
          <div className="flex items-center gap-1 mt-2">
            {data.persentase_bulan_lalu > 0 ? (
              <ArrowUp size={14} className="text-red-500" />
            ) : data.persentase_bulan_lalu < 0 ? (
              <ArrowDown size={14} className="text-green-500" />
            ) : null}
            <span className={`text-xs font-medium ${data.persentase_bulan_lalu > 0 ? 'text-red-500' : data.persentase_bulan_lalu < 0 ? 'text-green-500' : 'text-slate-400'}`}>
              {data.persentase_bulan_lalu > 0 ? '+' : ''}{data.persentase_bulan_lalu}% dari bulan lalu
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pendapatan Bulan Ini</span>
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatRupiah(data.pendapatan_bulan_ini)}</p>
          <p className="text-xs text-slate-400 mt-2">Dari pendaftar verified</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Laba Bulan Ini</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${data.laba_bulan_ini >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
              {data.laba_bulan_ini >= 0 ? (
                <TrendingUp size={16} className="text-blue-600" />
              ) : (
                <TrendingDown size={16} className="text-red-600" />
              )}
            </div>
          </div>
          <p className={`text-2xl font-bold ${data.laba_bulan_ini >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatRupiah(data.laba_bulan_ini)}
          </p>
          <p className="text-xs text-slate-400 mt-2">Pendapatan - Pengeluaran</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Transaksi</span>
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <Receipt size={16} className="text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{data.jumlah_transaksi_bulan_ini}</p>
          <p className="text-xs text-slate-400 mt-2">Transaksi bulan ini</p>
        </div>
      </div>

      {/* Charts Row 1: Bar + Doughnut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Pengeluaran Bulanan {new Date().getFullYear()}</h3>
          <div className="h-[280px]">
            <Bar data={barChartData} options={barOptions} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Berdasarkan Kategori</h3>
          {data.per_kategori.length > 0 ? (
            <>
              <div className="h-[220px] flex items-center justify-center">
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
              <div className="mt-3 space-y-2">
                {data.per_kategori.map((k, i) => (
                  <div key={k.kode} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-600">{k.nama}</span>
                    </div>
                    <span className="font-medium text-slate-800">{formatRupiah(k.total)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-slate-400">
              Belum ada data kategori
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2: Line + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Tren Pengeluaran</h3>
          <div className="h-[240px]">
            <Line data={lineChartData} options={lineOptions} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Pengeluaran Terakhir</h3>
            <Link to="/pengeluaran" className="text-xs text-orange-600 hover:underline font-medium">
              Lihat Semua
            </Link>
          </div>
          {data.recent.length > 0 ? (
            <div className="space-y-3">
              {data.recent.map(item => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex px-1.5 py-0.5 bg-orange-50 text-orange-700 text-[10px] font-semibold rounded">
                        {item.kategori?.kode}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{item.keterangan || 'Tanpa keterangan'}</p>
                  </div>
                  <span className="text-xs font-semibold text-red-600 whitespace-nowrap ml-2">
                    -{formatRupiah(item.nominal)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-sm text-slate-400">
              Belum ada pengeluaran
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
