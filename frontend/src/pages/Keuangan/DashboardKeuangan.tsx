import { useEffect, useState } from 'react'
import {
  Wallet, TrendingDown, TrendingUp, Receipt, ArrowDown, ArrowUp, Calendar, Filter, X,
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

const BRAND = '#0E6187'

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
  '#0E6187', '#188038', '#e37400', '#8430ce', '#1967d2',
  '#d93025', '#137333', '#0b8043', '#174ea6', '#b06000',
]

export default function DashboardKeuangan() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchData = (start?: string, end?: string) => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (start) params.start_date = start
    if (end) params.end_date = end
    pengeluaranApi.dashboard(params)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  if (loading) {
    return (
      <div className="px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-[#dadce0] border-t-[#1a73e8] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-[#5f6368]">Memuat dashboard keuangan...</p>
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
        backgroundColor: BRAND,
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
        borderColor: BRAND,
        backgroundColor: 'rgba(14,97,135,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: BRAND,
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
          color: '#80868b',
          font: { size: 11 },
        },
        grid: { color: '#e8eaed' },
      },
      x: {
        ticks: { color: '#80868b', font: { size: 11 } },
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
          color: '#80868b',
          font: { size: 11 },
        },
        grid: { color: '#e8eaed' },
      },
      x: {
        ticks: { color: '#80868b', font: { size: 11 } },
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
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-[#e8f0fe] text-[#1a73e8]">
            <Wallet size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Dashboard Keuangan</h1>
            <p className="text-sm text-[#5f6368]">{bulanNames[new Date().getMonth()]} {new Date().getFullYear()}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex flex-wrap items-center gap-2 border border-[#dadce0] bg-white p-2">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-[#80868b]" />
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="border border-[#dadce0] px-2 py-1.5 text-xs text-[#3c4043] outline-none focus:border-[#1a73e8]" />
              <span className="text-xs text-[#80868b]">s/d</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="border border-[#dadce0] px-2 py-1.5 text-xs text-[#3c4043] outline-none focus:border-[#1a73e8]" />
            </div>
            <button onClick={() => fetchData(startDate, endDate)}
              className="inline-flex items-center gap-1 bg-[#0E6187] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#084c63]">
              <Filter size={12} />
              Filter
            </button>
            {(startDate || endDate) && (
              <button onClick={() => { setStartDate(''); setEndDate(''); fetchData() }}
                className="inline-flex items-center gap-1 border border-[#dadce0] px-2 py-1.5 text-xs text-[#5f6368] transition hover:bg-[#f8f9fa]">
                <X size={12} />
                Reset
              </button>
            )}
          </div>
          <Link
            to="/pengeluaran"
            className="inline-flex items-center justify-center gap-2 bg-[#0E6187] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#084c63]"
          >
            <Receipt size={16} />
            Lihat Semua Pengeluaran
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#dadce0] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#5f6368]">Pengeluaran Bulan Ini</span>
            <div className="w-8 h-8 bg-[#f1f3f4] flex items-center justify-center">
              <Wallet size={16} className="text-[#1a73e8]" />
            </div>
          </div>
          <p className="text-2xl font-medium text-[#202124]">{formatRupiah(data.total_bulan_ini)}</p>
          <div className="flex items-center gap-1 mt-2">
            {data.persentase_bulan_lalu > 0 ? (
              <ArrowUp size={14} className="text-[#d93025]" />
            ) : data.persentase_bulan_lalu < 0 ? (
              <ArrowDown size={14} className="text-[#188038]" />
            ) : null}
            <span className={`text-xs font-medium ${data.persentase_bulan_lalu > 0 ? 'text-[#d93025]' : data.persentase_bulan_lalu < 0 ? 'text-[#188038]' : 'text-[#80868b]'}`}>
              {data.persentase_bulan_lalu > 0 ? '+' : ''}{data.persentase_bulan_lalu}% dari bulan lalu
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#dadce0] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#5f6368]">Pendapatan Bulan Ini</span>
            <div className="w-8 h-8 bg-[#e6f4ea] flex items-center justify-center">
              <TrendingUp size={16} className="text-[#137333]" />
            </div>
          </div>
          <p className="text-2xl font-medium text-[#137333]">{formatRupiah(data.pendapatan_bulan_ini)}</p>
          <p className="text-xs text-[#80868b] mt-2">Dari pendaftar verified</p>
        </div>

        <div className="bg-white border border-[#dadce0] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#5f6368]">Laba Bulan Ini</span>
            <div className={`w-8 h-8 flex items-center justify-center ${data.laba_bulan_ini >= 0 ? 'bg-[#e8f0fe]' : 'bg-[#fce8e6]'}`}>
              {data.laba_bulan_ini >= 0 ? (
                <TrendingUp size={16} className="text-[#1a73e8]" />
              ) : (
                <TrendingDown size={16} className="text-[#c5221f]" />
              )}
            </div>
          </div>
          <p className={`text-2xl font-medium ${data.laba_bulan_ini >= 0 ? 'text-[#1a73e8]' : 'text-[#c5221f]'}`}>
            {formatRupiah(data.laba_bulan_ini)}
          </p>
          <p className="text-xs text-[#80868b] mt-2">Pendapatan - Pengeluaran</p>
        </div>

        <div className="bg-white border border-[#dadce0] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#5f6368]">Total Transaksi</span>
            <div className="w-8 h-8 bg-[#e8def8] flex items-center justify-center">
              <Receipt size={16} className="text-[#8430ce]" />
            </div>
          </div>
          <p className="text-2xl font-medium text-[#202124]">{data.jumlah_transaksi_bulan_ini}</p>
          <p className="text-xs text-[#80868b] mt-2">Transaksi bulan ini</p>
        </div>
      </div>

      {/* Charts Row 1: Bar + Doughnut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-[#dadce0] p-5">
          <h3 className="text-sm font-medium text-[#202124] mb-4">Pengeluaran Bulanan {new Date().getFullYear()}</h3>
          <div className="h-[280px]">
            <Bar data={barChartData} options={barOptions} />
          </div>
        </div>

        <div className="bg-white border border-[#dadce0] p-5">
          <h3 className="text-sm font-medium text-[#202124] mb-4">Berdasarkan Kategori</h3>
          {data.per_kategori.length > 0 ? (
            <>
              <div className="h-[220px] flex items-center justify-center">
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
              <div className="mt-3 space-y-2">
                {data.per_kategori.map((k, i) => (
                  <div key={k.kode} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-[#5f6368]">{k.nama}</span>
                    </div>
                    <span className="font-medium text-[#202124]">{formatRupiah(k.total)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-[#80868b]">
              Belum ada data kategori
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2: Line + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-[#dadce0] p-5">
          <h3 className="text-sm font-medium text-[#202124] mb-4">Tren Pengeluaran</h3>
          <div className="h-[240px]">
            <Line data={lineChartData} options={lineOptions} />
          </div>
        </div>

        <div className="bg-white border border-[#dadce0] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#202124]">Pengeluaran Terakhir</h3>
            <Link to="/pengeluaran" className="text-xs text-[#1a73e8] hover:underline font-medium">
              Lihat Semua
            </Link>
          </div>
          {data.recent.length > 0 ? (
            <div className="space-y-3">
              {data.recent.map(item => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-[#e8eaed] last:border-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex px-1.5 py-0.5 bg-[#f1f3f4] text-[#1a73e8] text-[10px] font-medium">
                        {item.kategori?.kode}
                      </span>
                      <span className="text-xs text-[#80868b]">
                        {new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <p className="text-xs text-[#5f6368] truncate mt-0.5">{item.keterangan || 'Tanpa keterangan'}</p>
                  </div>
                  <span className="text-xs font-medium text-[#c5221f] whitespace-nowrap ml-2">
                    -{formatRupiah(item.nominal)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-sm text-[#80868b]">
              Belum ada pengeluaran
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
