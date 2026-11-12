import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutDashboard, Users, DollarSign, Clock, CheckCircle, UserX,
  Layers, Wallet, TrendingUp, Activity, GraduationCap, Presentation,
  ClipboardCheck, Star, CalendarCheck, Building2,
} from 'lucide-react'
import { managerCabangApi } from '../../services/api'
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
const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const BRAND = '#0E6187'
const COLORS = ['#0E6187', '#3b7ea6', '#5b95b5', '#7dacc4', '#9fc3d3', '#b8d3e0', '#d1e3ec', '#e5eef4', '#9ca3af', '#d1d5db']

interface Branch {
  id: number
  nama_cabang: string
  kode_cabang: string | null
}

interface DashboardData {
  user: { name: string; email: string; role: string }
  branches: Branch[]
  stats: {
    total_pendaftar: number
    pendaftar_disetujui: number
    pendaftar_pending: number
    pendaftar_ditolak: number
    total_siswa_aktif: number
    total_tagihan: number
    total_terkumpul: number
    total_outstanding: number
    total_pengeluaran_bulan_ini: number
    total_pendapatan_bulan_ini: number
    total_sensei: number
    total_kelas: number
    total_kelas_aktif: number
    total_evaluasi: number
    avg_rating: number | null
    total_absensi_sensei: number
    hadir_sensei: number
    persentase_kehadiran_sensei: number
    total_absensi_kandidat: number
    hadir_kandidat: number
    persentase_kehadiran_kandidat: number
  }
  batches: { id: number; nama_batch: string; siswas_count: number; kelas_count: number }[]
  recent_pembayaran: { id: number; jumlah: number; pendaftar: string; batch: string; created_at: string }[]
  recent_pengeluaran: { id: number; nominal: number; kategori: string; keterangan: string | null; tanggal: string }[]
  recent_evaluasi: { id: number; siswa: string; level: string | null; rating: number; komentar: string | null; created_at: string }[]
  charts: {
    rekap_pendaftar: { label: string; total: number }[]
    rekap_pembayaran: { label: string; total: number }[]
    rekap_pengeluaran: { label: string; total: number }[]
    pengeluaran_per_kategori: { nama: string; kode: string; total: number; jumlah: number }[]
  }
}

const statusColor: Record<string, string> = {
  disetujui: 'bg-[#e6f4ea] text-[#137333]',
  pending: 'bg-[#fef7e0] text-[#b06000]',
  ditolak: 'bg-[#fce8e6] text-[#a50e0e]',
}

export default function ManagerCabangDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    managerCabangApi.dashboard()
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
          Gagal memuat data dashboard. Pastikan akun Manager Cabang sudah memiliki cabang yang ditugaskan.
        </div>
      </div>
    )
  }

  const stats = data.stats
  const persentaseTagihan = stats.total_tagihan > 0
    ? Math.round((stats.total_terkumpul / stats.total_tagihan) * 100)
    : 0

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

  const linePembayaran = {
    labels: data.charts.rekap_pembayaran.map(r => r.label),
    datasets: [{
      label: 'Pembayaran',
      data: data.charts.rekap_pembayaran.map(r => r.total),
      borderColor: BRAND,
      backgroundColor: 'rgba(14,97,135,0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: BRAND,
    }],
  }

  const barPengeluaran = {
    labels: data.charts.rekap_pengeluaran.map(r => r.label),
    datasets: [{
      label: 'Pengeluaran',
      data: data.charts.rekap_pengeluaran.map(r => r.total),
      backgroundColor: BRAND,
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

  const primaryStats = [
    { icon: Users, label: 'Total Pendaftar', value: stats.total_pendaftar },
    { icon: CheckCircle, label: 'Disetujui', value: stats.pendaftar_disetujui },
    { icon: Clock, label: 'Pending', value: stats.pendaftar_pending },
    { icon: UserX, label: 'Ditolak', value: stats.pendaftar_ditolak },
  ]

  const secondaryStats = [
    { icon: Activity, label: 'Siswa Aktif', value: stats.total_siswa_aktif },
    { icon: GraduationCap, label: 'Sensei', value: stats.total_sensei },
    { icon: Presentation, label: 'Kelas Aktif', value: `${stats.total_kelas_aktif}/${stats.total_kelas}` },
    { icon: ClipboardCheck, label: 'Evaluasi', value: stats.total_evaluasi },
    { icon: Star, label: 'Rating Rata-rata', value: stats.avg_rating ?? '-' },
    { icon: CalendarCheck, label: 'Kehadiran Sensei', value: `${stats.persentase_kehadiran_sensei}%` },
    { icon: CalendarCheck, label: 'Kehadiran Kandidat', value: `${stats.persentase_kehadiran_kandidat}%` },
    { icon: DollarSign, label: 'Pendapatan Bulan Ini', value: `Rp ${fmt(stats.total_pendapatan_bulan_ini)}` },
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
            <h1 className="text-xl font-medium text-[#202124]">Dashboard Manager Cabang</h1>
            <p className="text-sm text-[#5f6368]">Selamat datang, {data.user.name}</p>
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

      {/* Stats Cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {primaryStats.map((s, i) => {
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
        {secondaryStats.map((s, i) => {
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

      {/* === CHARTS ROW 1 === */}
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
              <h2 className="text-sm font-medium text-[#202124]">Pembayaran per Bulan</h2>
              <p className="text-xs text-[#80868b]">Nilai pembayaran masuk per bulan</p>
            </div>
          </div>
          <div className="h-72 sm:h-80">
            <Line data={linePembayaran} options={lineOptions} />
          </div>
        </div>
      </div>

      {/* === CHARTS ROW 2 === */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="border border-[#dadce0] bg-white p-4">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-[#f8f9fa]">
              <Wallet size={18} className="text-[#8430ce]" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-[#202124]">Pengeluaran per Bulan</h2>
              <p className="text-xs text-[#80868b]">Pengeluaran operasional per bulan</p>
            </div>
          </div>
          <div className="h-72 sm:h-80">
            <Bar data={barPengeluaran} options={barOptions} />
          </div>
        </div>

        <div className="border border-[#dadce0] bg-white p-4">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-[#f8f9fa]">
              <Layers size={18} className="text-[#b06000]" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-[#202124]">Pengeluaran per Kategori</h2>
              <p className="text-xs text-[#80868b]">Distribusi pengeluaran per kategori</p>
            </div>
          </div>
          <div className="h-72 sm:h-80">
            {data.charts.pengeluaran_per_kategori.length === 0
              ? <div className="flex h-full items-center justify-center text-sm text-[#80868b]">Belum ada data</div>
              : <Doughnut data={doughnutKategori} options={doughnutOptions} />
            }
          </div>
        </div>
      </div>

      {/* === REKAP KEUANGAN + BATCH === */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="border border-[#dadce0] bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-[#202124]">Rekap Keuangan</h2>
            <Link to="/manager-cabang/keuangan" className="text-xs font-medium text-[#1a73e8] hover:underline">
              Detail →
            </Link>
          </div>
          <div className="space-y-2">
            <div className="bg-[#f8f9fa] p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#5f6368]">Total Tagihan</span>
                <span className="text-sm font-medium text-[#202124]">Rp {fmt(stats.total_tagihan)}</span>
              </div>
            </div>
            <div className="bg-[#f8f9fa] p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#5f6368]">Terkumpul</span>
                <span className="text-sm font-medium text-[#137333]">Rp {fmt(stats.total_terkumpul)}</span>
              </div>
            </div>
            <div className="bg-[#f8f9fa] p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#5f6368]">Outstanding</span>
                <span className="text-sm font-medium text-[#b06000]">Rp {fmt(stats.total_outstanding)}</span>
              </div>
            </div>
            <div className="bg-[#f8f9fa] p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#5f6368]">Pengeluaran Bulan Ini</span>
                <span className="text-sm font-medium text-[#a50e0e]">Rp {fmt(stats.total_pengeluaran_bulan_ini)}</span>
              </div>
            </div>
            <div className="pt-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-[#5f6368]">Persentase Terkumpul</span>
                <span className="text-xs font-medium text-[#1a73e8]">{persentaseTagihan}%</span>
              </div>
              <div className="h-2 w-full bg-[#f1f3f4]">
                <div className="h-2 bg-[#1a73e8] transition-all duration-500" style={{ width: `${Math.min(persentaseTagihan, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="border border-[#dadce0] bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-[#202124]">Batch Cabang</h2>
            <span className="text-xs text-[#80868b]">{data.batches.length} batch</span>
          </div>
          {data.batches.length === 0
            ? <p className="py-6 text-center text-sm text-[#80868b]">Tidak ada batch</p>
            : (
              <div className="space-y-2">
                {data.batches.slice(0, 6).map(b => (
                  <div key={b.id} className="flex items-center justify-between bg-[#f8f9fa] p-3">
                    <span className="truncate text-sm font-medium text-[#202124]">{b.nama_batch}</span>
                    <span className="ml-3 whitespace-nowrap text-xs font-medium text-[#5f6368]">
                      {b.siswas_count} siswa · {b.kelas_count} kelas
                    </span>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>

      {/* === RECENT ACTIVITY === */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="border border-[#dadce0] bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-[#202124]">Pembayaran Terbaru</h2>
            <Link to="/manager-cabang/keuangan" className="text-xs font-medium text-[#1a73e8] hover:underline">
              Lihat →
            </Link>
          </div>
          <div className="space-y-3">
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

        <div className="border border-[#dadce0] bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-[#202124]">Pengeluaran Terbaru</h2>
            <Link to="/manager-cabang/keuangan" className="text-xs font-medium text-[#1a73e8] hover:underline">
              Lihat →
            </Link>
          </div>
          <div className="space-y-3">
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

        <div className="border border-[#dadce0] bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-[#202124]">Evaluasi Terbaru</h2>
            <Link to="/manager-cabang/evaluasi-instruktur" className="text-xs font-medium text-[#1a73e8] hover:underline">
              Lihat →
            </Link>
          </div>
          <div className="space-y-3">
            {data.recent_evaluasi.length === 0
              ? <p className="py-6 text-center text-sm text-[#80868b]">Belum ada evaluasi</p>
              : data.recent_evaluasi.map(e => (
                <div key={e.id} className="bg-[#f8f9fa] p-3">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium text-[#202124]">{e.siswa}</p>
                    <span className="ml-2 flex items-center gap-1 whitespace-nowrap text-xs font-medium text-[#b06000]">
                      <Star size={12} className="fill-[#fbbc04] text-[#fbbc04]" /> {e.rating}
                    </span>
                  </div>
                  <p className="truncate text-xs text-[#5f6368]">{e.level || '-'} · {formatDate(e.created_at)}</p>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}
