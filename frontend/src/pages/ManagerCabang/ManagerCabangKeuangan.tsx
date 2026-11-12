import { useEffect, useState } from 'react'
import {
  Wallet, TrendingUp, TrendingDown, DollarSign, AlertCircle,
  Layers, Building2, Receipt, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import { managerCabangApi } from '../../services/api'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, Tooltip, Legend,
} from 'chart.js'
import type { ChartOptions } from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface Branch {
  id: number
  nama_cabang: string
  kode_cabang: string | null
}

interface KeuanganData {
  user: { name: string; email: string; role: string }
  branches: Branch[]
  summary: {
    total_tagihan: number
    total_terkumpul: number
    total_outstanding: number
    pendapatan_bulan_ini: number
    pendapatan_semua: number
    pengeluaran_bulan_ini: number
    pengeluaran_semua: number
    laba_bulan_ini: number
    laba_semua: number
    persentase_terkumpul: number
  }
  rekap_bulanan: { label: string; pendapatan: number; pengeluaran: number; laba: number }[]
  per_kategori: { nama: string; kode: string; total: number; jumlah: number }[]
  per_batch: { id: number; nama_batch: string; total_pendaftar: number; total_tagihan: number; total_terkumpul: number; total_outstanding: number }[]
  recent_pembayaran: { id: number; jumlah: number; pendaftar: string; batch: string; created_at: string }[]
  recent_pengeluaran: { id: number; nominal: number; kategori: string; keterangan: string | null; tanggal: string }[]
}

export default function ManagerCabangKeuangan() {
  const [data, setData] = useState<KeuanganData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    managerCabangApi.keuangan()
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
      <div className="px-6 py-8">
        <div className="border border-[#dadce0] bg-white p-8 text-center text-sm text-[#80868b]">
          Gagal memuat data keuangan. Pastikan akun Manager Cabang sudah memiliki cabang yang ditugaskan.
        </div>
      </div>
    )
  }

  const s = data.summary

  const chart = {
    labels: data.rekap_bulanan.map(r => r.label),
    datasets: [
      {
        label: 'Pendapatan',
        data: data.rekap_bulanan.map(r => r.pendapatan),
        backgroundColor: '#0E6187',
        borderRadius: 6,
      },
      {
        label: 'Pengeluaran',
        data: data.rekap_bulanan.map(r => r.pengeluaran),
        backgroundColor: '#b06000',
        borderRadius: 6,
      },
    ],
  }

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { usePointStyle: true, pointStyle: 'circle', font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: Rp ${fmt(ctx.parsed.y ?? 0)}`,
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
          color: '#94a3b8', font: { size: 11 },
        },
        grid: { color: '#f1f5f9' },
      },
      x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { display: false } },
    },
  }

  const summaryCards = [
    { icon: Receipt, label: 'Total Tagihan', value: s.total_tagihan, tone: 'text-[#202124]' },
    { icon: DollarSign, label: 'Terkumpul', value: s.total_terkumpul, tone: 'text-[#137333]' },
    { icon: AlertCircle, label: 'Outstanding', value: s.total_outstanding, tone: 'text-[#b06000]' },
    { icon: TrendingUp, label: 'Pendapatan Bulan Ini', value: s.pendapatan_bulan_ini, tone: 'text-[#137333]' },
    { icon: TrendingDown, label: 'Pengeluaran Bulan Ini', value: s.pengeluaran_bulan_ini, tone: 'text-[#a50e0e]' },
    { icon: Wallet, label: 'Laba Bulan Ini', value: s.laba_bulan_ini, tone: s.laba_bulan_ini >= 0 ? 'text-[#137333]' : 'text-[#a50e0e]' },
    { icon: DollarSign, label: 'Pendapatan Keseluruhan', value: s.pendapatan_semua, tone: 'text-[#202124]' },
    { icon: Wallet, label: 'Laba Keseluruhan', value: s.laba_semua, tone: s.laba_semua >= 0 ? 'text-[#137333]' : 'text-[#a50e0e]' },
  ]

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-[#e8f0fe] text-[#1a73e8]">
            <Wallet size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Monitoring Keuangan Cabang</h1>
            <p className="text-sm text-[#5f6368]">Ringkasan tagihan, pendapatan, dan pengeluaran cabang</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data.branches.length === 0 ? (
            <span className="inline-flex items-center gap-1.5 border border-[#dadce0] bg-[#f8f9fa] px-3 py-1.5 text-xs font-medium text-[#5f6368]">
              <Building2 size={14} /> Belum ada cabang
            </span>
          ) : (
            data.branches.map(branch => (
              <span key={branch.id} className="inline-flex items-center gap-1.5 border border-[#dadce0] bg-[#f8f9fa] px-3 py-1.5 text-xs font-medium text-[#5f6368]">
                <Building2 size={14} className="text-[#1a73e8]" />
                {branch.nama_cabang}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summaryCards.map((c, i) => {
          const Icon = c.icon
          return (
            <div key={i} className="flex min-w-0 items-center gap-3 border border-[#dadce0] bg-white p-3 sm:p-4">
              <div className="flex h-9 w-9 flex-none items-center justify-center bg-[#f1f3f4] sm:h-10 sm:w-10">
                <Icon size={16} className="text-[#1a73e8]" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] text-[#5f6368] sm:text-xs">{c.label}</p>
                <p className={`break-words text-sm font-medium leading-tight sm:text-lg ${c.tone}`}>Rp {fmt(c.value)}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Progress terkumpul */}
      <div className="mb-6 border border-[#dadce0] bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-[#202124]">Persentase Tagihan Terkumpul</h2>
          <span className="text-sm font-medium text-[#1a73e8]">{s.persentase_terkumpul}%</span>
        </div>
        <div className="h-2.5 w-full bg-[#f1f3f4]">
          <div className="h-2.5 bg-[#1a73e8] transition-all duration-500" style={{ width: `${Math.min(s.persentase_terkumpul, 100)}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-xs text-[#5f6368]">
          <span>Terkumpul: Rp {fmt(s.total_terkumpul)}</span>
          <span>Tagihan: Rp {fmt(s.total_tagihan)}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6 border border-[#dadce0] bg-white p-4">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center bg-[#f8f9fa]">
            <TrendingUp size={18} className="text-[#1a73e8]" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-[#202124]">Pendapatan vs Pengeluaran</h2>
            <p className="text-xs text-[#80868b]">Rekap 6 bulan terakhir</p>
          </div>
        </div>
        <div className="h-72 sm:h-80">
          <Bar data={chart} options={chartOptions} />
        </div>
      </div>

      {/* Rekap bulanan */}
      <div className="mb-6 border border-[#dadce0] bg-white">
        <div className="border-b border-[#dadce0] p-4">
          <h2 className="text-sm font-medium text-[#202124]">Rekap Bulanan</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f8f9fa] text-left text-xs uppercase tracking-wide text-[#5f6368]">
              <tr>
                <th className="px-4 py-3 font-medium">Bulan</th>
                <th className="px-4 py-3 text-right font-medium">Pendapatan</th>
                <th className="px-4 py-3 text-right font-medium">Pengeluaran</th>
                <th className="px-4 py-3 text-right font-medium">Laba</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f3f4]">
              {data.rekap_bulanan.map((row, i) => (
                <tr key={i} className="hover:bg-[#f8f9fa]">
                  <td className="px-4 py-3 text-[#202124]">{row.label}</td>
                  <td className="px-4 py-3 text-right text-[#137333]">Rp {fmt(row.pendapatan)}</td>
                  <td className="px-4 py-3 text-right text-[#a50e0e]">Rp {fmt(row.pengeluaran)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${row.laba >= 0 ? 'text-[#137333]' : 'text-[#a50e0e]'}`}>
                    <span className="inline-flex items-center gap-1">
                      {row.laba >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      Rp {fmt(row.laba)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per batch */}
      <div className="mb-6 border border-[#dadce0] bg-white">
        <div className="flex items-center gap-2 border-b border-[#dadce0] p-4">
          <Layers size={16} className="text-[#1a73e8]" />
          <h2 className="text-sm font-medium text-[#202124]">Keuangan per Batch</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f8f9fa] text-left text-xs uppercase tracking-wide text-[#5f6368]">
              <tr>
                <th className="px-4 py-3 font-medium">Batch</th>
                <th className="px-4 py-3 text-right font-medium">Kandidat</th>
                <th className="px-4 py-3 text-right font-medium">Tagihan</th>
                <th className="px-4 py-3 text-right font-medium">Terkumpul</th>
                <th className="px-4 py-3 text-right font-medium">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f3f4]">
              {data.per_batch.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[#80868b]">Belum ada data batch</td>
                </tr>
              ) : data.per_batch.map(row => (
                <tr key={row.id} className="hover:bg-[#f8f9fa]">
                  <td className="px-4 py-3 font-medium text-[#202124]">{row.nama_batch}</td>
                  <td className="px-4 py-3 text-right text-[#5f6368]">{row.total_pendaftar}</td>
                  <td className="px-4 py-3 text-right text-[#202124]">Rp {fmt(row.total_tagihan)}</td>
                  <td className="px-4 py-3 text-right text-[#137333]">Rp {fmt(row.total_terkumpul)}</td>
                  <td className="px-4 py-3 text-right text-[#b06000]">Rp {fmt(row.total_outstanding)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per kategori + recent */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="border border-[#dadce0] bg-white">
          <div className="flex items-center gap-2 border-b border-[#dadce0] p-4">
            <Layers size={16} className="text-[#b06000]" />
            <h2 className="text-sm font-medium text-[#202124]">Pengeluaran per Kategori</h2>
          </div>
          <div className="p-4">
            {data.per_kategori.length === 0
              ? <p className="py-6 text-center text-sm text-[#80868b]">Belum ada pengeluaran bulan ini</p>
              : (
                <div className="space-y-2">
                  {data.per_kategori.map((k, i) => (
                    <div key={i} className="flex items-center justify-between bg-[#f8f9fa] p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#202124]">{k.nama}</p>
                        <p className="text-xs text-[#5f6368]">{k.jumlah} transaksi</p>
                      </div>
                      <span className="ml-3 whitespace-nowrap text-sm font-medium text-[#a50e0e]">Rp {fmt(k.total)}</span>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        </div>

        <div className="border border-[#dadce0] bg-white">
          <div className="flex items-center gap-2 border-b border-[#dadce0] p-4">
            <DollarSign size={16} className="text-[#137333]" />
            <h2 className="text-sm font-medium text-[#202124]">Pembayaran Terbaru</h2>
          </div>
          <div className="space-y-3 p-4">
            {data.recent_pembayaran.length === 0
              ? <p className="py-6 text-center text-sm text-[#80868b]">Belum ada pembayaran</p>
              : data.recent_pembayaran.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-[#f8f9fa] p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#202124]">{p.pendaftar || '-'}</p>
                    <p className="truncate text-xs text-[#5f6368]">{p.batch} · {formatDate(p.created_at)}</p>
                  </div>
                  <span className="ml-3 whitespace-nowrap text-sm font-medium text-[#137333]">Rp {fmt(p.jumlah)}</span>
                </div>
              ))
            }
          </div>
        </div>

        <div className="border border-[#dadce0] bg-white">
          <div className="flex items-center gap-2 border-b border-[#dadce0] p-4">
            <Wallet size={16} className="text-[#a50e0e]" />
            <h2 className="text-sm font-medium text-[#202124]">Pengeluaran Terbaru</h2>
          </div>
          <div className="space-y-3 p-4">
            {data.recent_pengeluaran.length === 0
              ? <p className="py-6 text-center text-sm text-[#80868b]">Belum ada pengeluaran</p>
              : data.recent_pengeluaran.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-[#f8f9fa] p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#202124]">{p.kategori}</p>
                    <p className="truncate text-xs text-[#5f6368]">{p.keterangan || '-'} · {formatDate(p.tanggal)}</p>
                  </div>
                  <span className="ml-3 whitespace-nowrap text-sm font-medium text-[#a50e0e]">Rp {fmt(p.nominal)}</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}
