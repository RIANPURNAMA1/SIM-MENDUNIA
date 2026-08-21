import { useEffect, useState, useMemo } from 'react'
import { FileText, CreditCard, DollarSign, Handshake, Users, TrendingUp, Loader, BarChart3, CheckCircle, XCircle, Clock, Layers, UserCheck, UserPlus, BookOpen, UserX, GraduationCap, PauseCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { pendaftarApi, pembayaranApi, affiliateLinkApi } from '../../services/api'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title,
  Filler, Tooltip, Legend, ArcElement,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Filler, Tooltip, Legend, ArcElement)

interface PendaftarItem {
  id: number
  nama: string
  email: string
  nominal: number | null
  diskon: number | null
  status_pendaftaran: string
  status_pembayaran: string
  created_at: string
  product: { nama: string; harga: number } | null
}

interface PaymentItem {
  id: number
  pendaftar_id: number
  jumlah: number
  status: string
  created_at: string
  pendaftar: { nama: string } | null
}

interface AffiliateLink {
  id: number
  kode: string
  affiliate: { name: string } | null
  pendaftar_count: number
  product: { nama: string; komisi: number } | null
}

interface KandidatItem {
  status_kandidat: string
  is_cuti: boolean
  status_akademik: string
}

interface KandidatStats {
  totalKandidat: number
  kandidatAktif: number
  totalBatch: number
  batches?: { id: number; kandidat: KandidatItem[] }[]
}

export default function DashboardKandidat() {
  const [pendaftar, setPendaftar] = useState<PendaftarItem[]>([])
  const [pembayaran, setPembayaran] = useState<PaymentItem[]>([])
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([])
  const [kandidatStats, setKandidatStats] = useState<KandidatStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      pendaftarApi.list({}),
      pembayaranApi.list({}),
      affiliateLinkApi.list({}),
      pendaftarApi.kandidat({}),
    ]).then(([pRes, payRes, affRes, kandRes]) => {
      setPendaftar(pRes.data)
      setPembayaran(payRes.data)
      setAffiliateLinks(affRes.data)
      setKandidatStats({
        totalKandidat: kandRes.data.totalKandidat,
        kandidatAktif: kandRes.data.kandidatAktif,
        totalBatch: kandRes.data.totalBatch,
        batches: kandRes.data.batches || [],
      })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const pendaftarBaruBulanIni = pendaftar.filter(p => {
    const tgl = new Date(p.created_at)
    const now = new Date()
    return tgl.getMonth() === now.getMonth() && tgl.getFullYear() === now.getFullYear()
  })

  const totalPembayaranBulanIni = pendaftar
    .filter(p => {
      const tgl = new Date(p.created_at)
      const now = new Date()
      return tgl.getMonth() === now.getMonth() && tgl.getFullYear() === now.getFullYear()
        && p.status_pembayaran === 'verified'
    })
    .reduce((s, p) => s + Number(p.nominal || 0), 0)

  const totalPembayaranBulanLalu = pendaftar
    .filter(p => {
      const tgl = new Date(p.created_at)
      const now = new Date()
      const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
      const lastYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
      return tgl.getMonth() === lastMonth && tgl.getFullYear() === lastYear
        && p.status_pembayaran === 'verified'
    })
    .reduce((s, p) => s + Number(p.nominal || 0), 0)

  const pendaftarTerbaru = [...pendaftar]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const tagihanData = [...pendaftar]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const affiliateAktif = affiliateLinks.filter(l => l.affiliate)

  const allKandidat = useMemo(() => (kandidatStats?.batches || []).flatMap(b => b.kandidat || []), [kandidatStats])
  const countStatus = (s: string) => allKandidat.filter(k => k.status_kandidat === s).length
  const cutiCount = allKandidat.filter(k => k.is_cuti).length

  const statusChartData = {
    labels: ['Kandidat Aktif', 'Calon Kandidat', 'Proses Belajar', 'Mengundurkan Diri', 'Lulus Pendidikan', 'Cuti'],
    datasets: [{
      data: [
        countStatus('Kandidat Aktif'),
        countStatus('Calon Kandidat'),
        countStatus('Proses Belajar'),
        countStatus('Mengundurkan Diri'),
        countStatus('Lulus Pendidikan'),
        cutiCount,
      ],
      backgroundColor: ['#0E6187', '#14919c', '#7cc5d8', '#ef4444', '#10b981', '#f59e0b'],
      borderColor: '#ffffff',
      borderWidth: 2,
      hoverOffset: 6,
    }],
  }

  const statusChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { usePointStyle: true, boxWidth: 8, padding: 14, font: { size: 11 } },
      },
      tooltip: {
        backgroundColor: '#0E6187',
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => ` ${ctx.parsed} kandidat`,
        },
      },
    },
  }

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    const now = new Date()
    const result: { month: string; total: number; disetujui: number; ditolak: number; pending: number }[] = []

    for (let i = 5; i >= 0; i--) {
      const m = (now.getMonth() - i + 12) % 12
      const y = now.getFullYear() - (now.getMonth() - i < 0 ? 1 : 0)
      const monthStr = `${months[m]} ${y}`
      const items = pendaftar.filter(p => {
        const d = new Date(p.created_at)
        return d.getMonth() === m && d.getFullYear() === y
      })
      result.push({
        month: monthStr,
        total: items.length,
        disetujui: items.filter(p => p.status_pendaftaran === 'disetujui').length,
        ditolak: items.filter(p => p.status_pendaftaran === 'ditolak').length,
        pending: items.filter(p => p.status_pendaftaran === 'pending').length,
      })
    }
    return result
  }, [pendaftar])

  const chartData = {
    labels: monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'Total Pendaftar',
        data: monthlyData.map(d => d.total),
        borderColor: '#0E6187',
        backgroundColor: 'rgba(13, 31, 60, 0.12)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#0E6187',
        borderWidth: 2,
      },
      {
        label: 'Disetujui',
        data: monthlyData.map(d => d.disetujui),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#10b981',
        borderWidth: 2,
      },
      {
        label: 'Ditolak',
        data: monthlyData.map(d => d.ditolak),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#ef4444',
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
        backgroundColor: '#0E6187',
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: '#94a3b8' },
      },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, font: { size: 10 }, color: '#94a3b8' },
        grid: { color: 'rgba(0,0,0,0.04)' },
      },
    },
  }

  const programChartData = useMemo(() => {
    const countMap: Record<string, number> = {}
    pendaftar.forEach(p => {
      const nama = p.product?.nama || 'Tanpa Program'
      countMap[nama] = (countMap[nama] || 0) + 1
    })
    const sorted = Object.entries(countMap).sort((a, b) => b[1] - a[1])
    const colors = ['#0E6187', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6']
    return {
      labels: sorted.map(([name]) => name),
      datasets: [{
        label: 'Jumlah Pendaftar',
        data: sorted.map(([, count]) => count),
        backgroundColor: sorted.map((_, i) => colors[i % colors.length] + 'cc'),
        borderColor: sorted.map((_, i) => colors[i % colors.length]),
        borderWidth: 1.5,
        borderRadius: 6,
        barThickness: sorted.length > 6 ? 28 : 36,
      }],
    }
  }, [pendaftar])

  const programChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0E6187',
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => `${ctx.parsed.x} pendaftar`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { stepSize: 1, font: { size: 10 }, color: '#94a3b8' },
        grid: { color: 'rgba(0,0,0,0.04)' },
      },
      y: {
        grid: { display: false },
        ticks: { font: { size: 11, weight: 'bold' as const }, color: '#334155' },
      },
    },
  }

  const breakdownStats = [
    { label: 'Menunggu Pembayaran', value: pendaftar.filter(p => p.status_pembayaran === 'unpaid').length, icon: Clock },
    { label: 'Menunggu Verifikasi', value: pendaftar.filter(p => p.status_pembayaran === 'pending').length, icon: Clock },
    { label: 'Proses', value: pendaftar.filter(p => p.status_pembayaran === 'processing').length, icon: Loader },
    { label: 'Pembayaran Dikonfirmasi', value: pendaftar.filter(p => p.status_pembayaran === 'verified').length, icon: CheckCircle },
    { label: 'Batal', value: pendaftar.filter(p => p.status_pembayaran === 'refund').length, icon: XCircle },
    { label: 'Ditangguhkan', value: pendaftar.filter(p => p.status_pembayaran === 'ditangguhkan').length, icon: XCircle },
  ]

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

  const stats = [
    { label: 'Pendaftar Baru (Bulan Ini)', value: pendaftarBaruBulanIni.length, icon: FileText },
    { label: 'Pembayaran Masuk', value: `Rp ${(totalPembayaranBulanIni).toLocaleString('id-ID')}`, icon: DollarSign },
    { label: 'Affiliate Aktif', value: affiliateAktif.length, icon: Handshake },
    { label: 'Pembayaran Terverifikasi', value: pendaftar.filter(p => p.status_pembayaran === 'verified').length, icon: CheckCircle },
  ]

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' },
      disetujui: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Disetujui' },
      ditolak: { bg: 'bg-red-100', text: 'text-red-700', label: 'Ditolak' },
      unpaid: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Belum Bayar' },
      processing: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Proses' },
      verified: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Lunas' },
    }
    const s = map[status] || { bg: 'bg-slate-100', text: 'text-slate-600', label: status }
    return (
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
        {s.label}
      </span>
    )
  }

  const pctChange = totalPembayaranBulanLalu > 0
    ? Math.round((totalPembayaranBulanIni - totalPembayaranBulanLalu) / totalPembayaranBulanLalu * 100)
    : 0

  return (
    <div className="px-3 sm:px-6 py-3 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187]">
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Dashboard Kandidat</h1>
            <p className="text-sm text-slate-500">Kelola kandidat, pendaftaran, pembayaran, dan affiliate</p>
          </div>
        </div>
      </div>

      {/* Summary Kandidat */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Batch', value: kandidatStats?.totalBatch ?? 0, icon: Layers },
          { label: 'Total Kandidat', value: kandidatStats?.totalKandidat ?? 0, icon: Users },
          { label: 'Kandidat Aktif', value: kandidatStats?.kandidatAktif ?? 0, icon: UserCheck },
          { label: 'Calon Kandidat', value: countStatus('Calon Kandidat'), icon: UserPlus },
          { label: 'Proses Belajar', value: countStatus('Proses Belajar'), icon: BookOpen },
          { label: 'Mengundurkan Diri', value: countStatus('Mengundurkan Diri'), icon: UserX },
          { label: 'Lulus Pendidikan', value: countStatus('Lulus Pendidikan'), icon: GraduationCap },
          { label: 'Cuti', value: cutiCount, icon: PauseCircle },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
              <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-[#0E6187]/10 sm:h-10 sm:w-10">
                <Icon size={16} className="text-[#0E6187]" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] text-slate-500 sm:text-xs">{stat.label}</p>
                <p className="break-words text-base font-bold leading-tight text-slate-800 sm:text-xl lg:text-2xl">{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div key={idx} className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-[#0E6187]/10">
                <Icon size={17} className="text-[#0E6187]" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-slate-500">{stat.label}</p>
                <p className="break-words text-xl font-bold leading-tight text-slate-800 lg:text-2xl">{stat.value}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">Tahun 2026</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Chart Section */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0E6187]/5">
              <BarChart3 size={18} className="text-[#0E6187]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Grafik Pendaftaran</h2>
              <p className="text-xs text-slate-400">Tren pendaftaran 6 bulan terakhir</p>
            </div>
          </div>
          <div className="h-72 sm:h-80">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
              <TrendingUp size={18} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Program Terlaris</h2>
              <p className="text-xs text-slate-400">Jumlah pendaftar per program</p>
            </div>
          </div>
          <div className="h-72 sm:h-80">
            {programChartData.labels.length > 0 ? (
              <Bar data={programChartData} options={programChartOptions} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">Belum ada data</div>
            )}
          </div>
        </div>
      </div>

      {/* Grafik Status Kandidat */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0E6187]/5">
              <Users size={18} className="text-[#0E6187]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Status Kandidat</h2>
              <p className="text-xs text-slate-400">Distribusi kandidat berdasarkan status</p>
            </div>
          </div>
          <div className="h-72 sm:h-80">
            <Doughnut data={statusChartData} options={statusChartOptions} />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0E6187]/5">
              <Layers size={18} className="text-[#0E6187]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Rincian per Status</h2>
              <p className="text-xs text-slate-400">Jumlah kandidat tiap status</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {[
              { label: 'Kandidat Aktif', value: countStatus('Kandidat Aktif'), color: 'bg-[#0E6187]' },
              { label: 'Calon Kandidat', value: countStatus('Calon Kandidat'), color: 'bg-[#14919c]' },
              { label: 'Proses Belajar', value: countStatus('Proses Belajar'), color: 'bg-[#7cc5d8]' },
              { label: 'Mengundurkan Diri', value: countStatus('Mengundurkan Diri'), color: 'bg-red-500' },
              { label: 'Lulus Pendidikan', value: countStatus('Lulus Pendidikan'), color: 'bg-emerald-500' },
              { label: 'Cuti', value: cutiCount, color: 'bg-amber-500' },
            ].map(row => {
              const total = statusChartData.datasets[0].data.reduce((a: number, b: number) => a + b, 0) || 1
              const pct = Math.round(row.value / total * 100)
              return (
                <div key={row.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${row.color}`} />
                      {row.label}
                    </span>
                    <span className="font-semibold text-slate-700">{row.value} <span className="font-normal text-slate-400">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${row.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Breakdown Stats */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {breakdownStats.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="flex min-w-0 flex-col rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-[#0E6187]/10">
                <Icon size={16} className="text-[#0E6187]" />
              </div>
              <p className="truncate text-[11px] text-slate-500">{s.label}</p>
              <p className="text-xl font-bold leading-tight text-slate-800">{s.value}</p>
            </div>
          )
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pendaftaran Terbaru */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Pendaftaran Terbaru</h2>
            <Link to="/pendaftar" className="text-xs font-semibold text-[#0E6187] hover:underline">
              Lihat Semua →
            </Link>
          </div>
          <div className="space-y-3">
            {pendaftarTerbaru.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">Belum ada pendaftaran</p>
            ) : (
              pendaftarTerbaru.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.nama}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  {statusBadge(item.status_pendaftaran)}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tagihan */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Tagihan Terbaru</h2>
            <Link to="/tagihan" className="text-xs font-semibold text-[#0E6187] hover:underline">
              Lihat Semua →
            </Link>
          </div>
          <div className="space-y-3">
            {tagihanData.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">Belum ada tagihan</p>
            ) : (
              tagihanData.map((item) => {
                const harga = Number(item.product?.harga || 0)
                const diskon = Number(item.diskon || 0)
                const tagihan = harga - diskon
                const dibayar = Number(item.nominal || 0)
                const sisa = Math.max(0, tagihan - dibayar)
                return (
                  <div key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.nama}</p>
                      <p className="text-xs font-semibold text-slate-700">
                        {sisa > 0 ? `Rp ${sisa.toLocaleString('id-ID')}` : 'Lunas'}
                      </p>
                    </div>
                    {statusBadge(item.status_pembayaran)}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Pembayaran Masuk */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Pembayaran Masuk</h2>
            <Link to="/pembayaran" className="text-xs font-semibold text-[#0E6187] hover:underline">
              Lihat Semua →
            </Link>
          </div>
          <div className="space-y-2">
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Bulan Ini</span>
                <span className="text-base font-bold text-emerald-600">
                  Rp {totalPembayaranBulanIni.toLocaleString('id-ID')}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {totalPembayaranBulanLalu > 0
                  ? `${pctChange >= 0 ? '+' : ''}${pctChange}% dari bulan sebelumnya`
                  : 'Belum ada data bulan lalu'}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Total Semua</span>
                <span className="text-base font-bold text-[#0E6187]">
                  Rp {pendaftar.filter(p => p.status_pembayaran === 'verified').reduce((s, p) => s + Number(p.nominal || 0), 0).toLocaleString('id-ID')}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{pendaftar.filter(p => p.status_pembayaran === 'verified').length} transaksi</p>
            </div>
          </div>
        </div>

        {/* Affiliate Aktif */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Affiliate Aktif</h2>
            <Link to="/data-affiliate" className="text-xs font-semibold text-[#0E6187] hover:underline">
              Lihat Semua →
            </Link>
          </div>
          <div className="space-y-3">
            {affiliateAktif.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">Belum ada affiliate</p>
            ) : (
              affiliateAktif.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.affiliate?.name || '-'}</p>
                    <p className="text-xs text-slate-500">{item.product?.nama || '-'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">{item.pendaftar_count} daftar</p>
                    <span className="text-xs font-semibold text-emerald-600">Aktif</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
