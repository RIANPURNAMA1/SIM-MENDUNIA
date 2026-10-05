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

interface BatchSummary {
  id: number
  nama?: string
  warna?: string | null
  cabang_id?: number | null
  cabang_nama?: string
  jumlahKandidat?: number
  kandidat: KandidatItem[]
}

interface KandidatStats {
  totalKandidat: number
  kandidatAktif: number
  totalBatch: number
  batches?: BatchSummary[]
}

const BATCH_SEGMENTS = [
  { label: 'Kandidat Aktif', color: '#0E6187' },
  { label: 'Proses Belajar', color: '#188038' },
  { label: 'Calon Kandidat', color: '#0b8043' },
  { label: 'Lulus Pendidikan', color: '#188038' },
  { label: 'Mengundurkan Diri', color: '#d93025' },
  { label: 'Cuti', color: '#e37400' },
  { label: 'Lainnya', color: '#80868b' },
]

const stackTotalPlugin = {
  id: 'stackTotal',
  afterDatasetsDraw(chart: any) {
    const ctx = chart.ctx
    ctx.save()
    ctx.font = '600 11px system-ui, sans-serif'
    ctx.fillStyle = '#3c4043'
    ctx.textAlign = 'center'
    chart.getDatasetMeta(0).data.forEach((bar: any, i: number) => {
      let top = bar.y
      for (let d = 0; d < chart.data.datasets.length; d++) {
        const el = chart.getDatasetMeta(d).data[i]
        if (el && el.y < top) top = el.y
      }
      const total = chart.data.datasets.reduce((s: number, ds: any) => s + (Number(ds.data[i]) || 0), 0)
      if (total > 0) ctx.fillText(String(total), bar.x, top - 6)
    })
    ctx.restore()
  },
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
      backgroundColor: ['#0E6187', '#188038', '#0b8043', '#d93025', '#188038', '#e37400'],
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
        borderColor: '#188038',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#188038',
        borderWidth: 2,
      },
      {
        label: 'Ditolak',
        data: monthlyData.map(d => d.ditolak),
        borderColor: '#d93025',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#d93025',
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
        ticks: { font: { size: 10 }, color: '#80868b' },
      },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, font: { size: 10 }, color: '#80868b' },
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
    const colors = ['#0E6187', '#188038', '#e37400', '#d93025', '#8430ce', '#137333', '#a50e0e', '#0d652d']
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
        ticks: { stepSize: 1, font: { size: 10 }, color: '#80868b' },
        grid: { color: 'rgba(0,0,0,0.04)' },
      },
      y: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: '#80868b' },
      },
    },
  }

  const batchRows = useMemo(() => {
    const rows = (kandidatStats?.batches || []).map(b => {
      const list = b.kandidat || []
      const counts: Record<string, number> = {}
      BATCH_SEGMENTS.forEach(s => { counts[s.label] = 0 })
      list.forEach(k => {
        if (k.is_cuti) { counts['Cuti']++; return }
        const seg = BATCH_SEGMENTS.find(s => s.label === k.status_kandidat)
        if (seg && seg.label !== 'Cuti' && seg.label !== 'Lainnya') counts[seg.label]++
        else counts['Lainnya']++
      })
      return { nama: b.nama || `Batch #${b.id}`, warna: b.warna || null, cabang_id: b.cabang_id ?? null, cabang_nama: b.cabang_nama || 'Tanpa Cabang', total: list.length, counts }
    })
    return rows.sort((a, b) => b.total - a.total)
  }, [kandidatStats])

  const batchChartData = useMemo(() => ({
    labels: batchRows.map(r => r.nama),
    datasets: BATCH_SEGMENTS.map(s => ({
      label: s.label,
      data: batchRows.map(r => r.counts[s.label] || 0),
      backgroundColor: s.color + 'cc',
      borderColor: s.color,
      borderWidth: 1,
      borderRadius: 3,
      borderSkipped: false as const,
      barPercentage: 0.68,
      categoryPercentage: 0.78,
    })),
  }), [batchRows])

  const batchChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { usePointStyle: true, boxWidth: 8, padding: 12, font: { size: 11 } },
      },
      tooltip: {
        backgroundColor: '#0E6187',
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        footerFont: { size: 11, weight: 'bold' as const },
        footerColor: '#ffffff',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.parsed.y} kandidat`,
          footer: (items: any[]) => `Total: ${items.reduce((s, i) => s + (i.parsed.y || 0), 0)} kandidat`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { font: { size: 10 }, color: '#3c4043', maxRotation: 45, minRotation: 0, autoSkip: false },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: { stepSize: 1, precision: 0, font: { size: 10 }, color: '#80868b' },
        grid: { color: 'rgba(0,0,0,0.04)' },
        title: { display: true, text: 'Jumlah kandidat', font: { size: 10 }, color: '#80868b' },
      },
    },
  }

  const totalKandidatPerBatch = batchRows.reduce((s, r) => s + r.total, 0)
  const rataRataPerBatch = batchRows.length ? Math.round(totalKandidatPerBatch / batchRows.length) : 0

  // Groepeer batch-rijen per cabang (afdeling) voor de "Kandidat per Batch"-lijst.
  const batchGroupsByCabang = useMemo(() => {
    const order: string[] = []
    const map = new Map<string, typeof batchRows>()
    batchRows.forEach(r => {
      const key = r.cabang_nama || 'Tanpa Cabang'
      if (!map.has(key)) { map.set(key, []); order.push(key) }
      map.get(key)!.push(r)
    })
    return order.map(cabang => ({
      cabang,
      total: map.get(cabang)!.reduce((s, r) => s + r.total, 0),
      rows: map.get(cabang)!,
    })).sort((a, b) => b.total - a.total)
  }, [batchRows])

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
          <div className="absolute inset-0 rounded-full border-2 border-[#1a73e8] border-t-[#1a73e8] animate-spin" />
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
      pending: { bg: 'bg-[#fef7e0]', text: 'text-[#b06000]', label: 'Pending' },
      disetujui: { bg: 'bg-[#e6f4ea]', text: 'text-[#137333]', label: 'Disetujui' },
      ditolak: { bg: 'bg-[#fce8e6]', text: 'text-[#a50e0e]', label: 'Ditolak' },
      unpaid: { bg: 'bg-[#f1f3f4]', text: 'text-[#5f6368]', label: 'Belum Bayar' },
      processing: { bg: 'bg-[#e8f0fe]', text: 'text-[#1967d2]', label: 'Proses' },
      verified: { bg: 'bg-[#e6f4ea]', text: 'text-[#137333]', label: 'Lunas' },
    }
    const s = map[status] || { bg: 'bg-[#f1f3f4]', text: 'text-[#5f6368]', label: status }
    return (
      <span className={`text-xs font-medium px-2.5 py-1 ${s.bg} ${s.text}`}>
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
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-[#e8f0fe] text-[#1a73e8]">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Dashboard Kandidat</h1>
            <p className="text-sm text-[#5f6368]">Kelola kandidat, pendaftaran, pembayaran, dan affiliate</p>
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
            <div key={stat.label} className="flex min-w-0 items-center gap-3 border border-[#dadce0] bg-white p-3 sm:p-4">
              <div className="flex h-9 w-9 flex-none items-center justify-center bg-[#f1f3f4] sm:h-10 sm:w-10">
                <Icon size={16} className="text-[#1a73e8]" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] text-[#5f6368] sm:text-xs">{stat.label}</p>
                <p className="break-words text-base font-medium leading-tight text-[#202124] sm:text-xl lg:text-2xl">{stat.value}</p>
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
            <div key={idx} className="flex min-w-0 items-center gap-3 border border-[#dadce0] bg-white p-4">
              <div className="flex h-10 w-10 flex-none items-center justify-center bg-[#f1f3f4]">
                <Icon size={17} className="text-[#1a73e8]" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-[#5f6368]">{stat.label}</p>
                <p className="break-words text-xl font-medium leading-tight text-[#202124] lg:text-2xl">{stat.value}</p>
                <p className="mt-0.5 text-[11px] text-[#80868b]">Tahun 2026</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Chart Section */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-[#dadce0] bg-white p-4">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center bg-[#f8f9fa]">
              <BarChart3 size={18} className="text-[#1a73e8]" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-[#202124]">Grafik Pendaftaran</h2>
              <p className="text-xs text-[#80868b]">Tren pendaftaran 6 bulan terakhir</p>
            </div>
          </div>
          <div className="h-72 sm:h-80">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="border border-[#dadce0] bg-white p-4">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center bg-[#f1f3f4]">
              <TrendingUp size={18} className="text-[#137333]" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-[#202124]">Program Terlaris</h2>
              <p className="text-xs text-[#80868b]">Jumlah pendaftar per program</p>
            </div>
          </div>
          <div className="h-72 sm:h-80">
            {programChartData.labels.length > 0 ? (
              <Bar data={programChartData} options={programChartOptions} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[#80868b]">Belum ada data</div>
            )}
          </div>
        </div>
      </div>

      {/* Grafik Status Kandidat */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-[#dadce0] bg-white p-4">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center bg-[#f8f9fa]">
              <Users size={18} className="text-[#1a73e8]" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-[#202124]">Status Kandidat</h2>
              <p className="text-xs text-[#80868b]">Distribusi kandidat berdasarkan status</p>
            </div>
          </div>
          <div className="h-72 sm:h-80">
            <Doughnut data={statusChartData} options={statusChartOptions} />
          </div>
        </div>

        <div className="border border-[#dadce0] bg-white p-4">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center bg-[#f8f9fa]">
              <Layers size={18} className="text-[#1a73e8]" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-[#202124]">Rincian per Status</h2>
              <p className="text-xs text-[#80868b]">Jumlah kandidat tiap status</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {[
              { label: 'Kandidat Aktif', value: countStatus('Kandidat Aktif'), color: 'bg-[#0E6187]' },
              { label: 'Calon Kandidat', value: countStatus('Calon Kandidat'), color: 'bg-[#188038]' },
              { label: 'Proses Belajar', value: countStatus('Proses Belajar'), color: 'bg-[#0b8043]' },
              { label: 'Mengundurkan Diri', value: countStatus('Mengundurkan Diri'), color: 'bg-[#d93025]' },
              { label: 'Lulus Pendidikan', value: countStatus('Lulus Pendidikan'), color: 'bg-[#188038]' },
              { label: 'Cuti', value: cutiCount, color: 'bg-[#e37400]' },
            ].map(row => {
              const total = statusChartData.datasets[0].data.reduce((a: number, b: number) => a + b, 0) || 1
              const pct = Math.round(row.value / total * 100)
              return (
                <div key={row.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-[#5f6368]">
                      <span className={`inline-block h-2.5 w-2.5 ${row.color}`} />
                      {row.label}
                    </span>
                    <span className="font-medium text-[#3c4043]">{row.value} <span className="font-normal text-[#80868b]">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 overflow-hidden bg-[#f1f3f4]">
                    <div className={`h-full ${row.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Grafik Kandidat per Batch */}
      <div className="mb-6 border border-[#dadce0] bg-white p-4">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-[#f8f9fa]">
              <Layers size={18} className="text-[#1a73e8]" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-[#202124]">Kandidat per Batch</h2>
              <p className="text-xs text-[#80868b]">Komposisi kandidat tiap batch berdasarkan status</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: 'Total Batch', value: batchRows.length },
              { label: 'Total Kandidat', value: totalKandidatPerBatch },
              { label: 'Rata-rata/Batch', value: rataRataPerBatch },
            ].map(s => (
              <div key={s.label} className="border border-[#dadce0] bg-[#f8f9fa] px-3 py-1.5 text-center">
                <p className="text-[10px] text-[#80868b]">{s.label}</p>
                <p className="text-sm font-medium text-[#3c4043]">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {batchRows.length > 0 ? (
          <>
            <div className="h-72 sm:h-96">
              <Bar data={batchChartData} options={batchChartOptions} plugins={[stackTotalPlugin]} />
            </div>
            <div className="mt-4 border-t border-[#e8eaed] pt-3">
              {batchGroupsByCabang.map(g => (
                <div key={g.cabang} className="mb-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-[#202124]">{g.cabang}</span>
                    <span className="text-[10px] font-medium text-[#5f6368]">{g.total} kandidat</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {g.rows.map(r => (
                      <div key={r.nama} className="flex items-center gap-1.5 border border-[#dadce0] bg-white px-2.5 py-1 text-[11px]">
                        <span className="inline-block h-2.5 w-2.5" style={{ backgroundColor: r.warna || '#bdc1c6' }} />
                        <span className="text-[#5f6368]">{r.nama}</span>
                        <span className="font-medium text-[#202124]">{r.total}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-72 items-center justify-center text-sm text-[#80868b]">Belum ada data kandidat per batch</div>
        )}
      </div>

      {/* Breakdown Stats */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {breakdownStats.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="flex min-w-0 flex-col border border-[#dadce0] bg-white p-3 sm:p-4">
              <div className="mb-2 flex h-9 w-9 items-center justify-center bg-[#f1f3f4]">
                <Icon size={16} className="text-[#1a73e8]" />
              </div>
              <p className="truncate text-[11px] text-[#5f6368]">{s.label}</p>
              <p className="text-2xl font-medium leading-tight text-[#202124]">{s.value}</p>
            </div>
          )
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pendaftaran Terbaru */}
        <div className="border border-[#dadce0] bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-[#202124]">Pendaftaran Terbaru</h2>
            <Link to="/pendaftar" className="text-xs font-medium text-[#1a73e8] hover:underline">
              Lihat Semua →
            </Link>
          </div>
          <div className="space-y-3">
            {pendaftarTerbaru.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#80868b]">Belum ada pendaftaran</p>
            ) : (
              pendaftarTerbaru.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-[#f8f9fa] p-3">
                  <div>
                    <p className="text-sm font-medium text-[#202124]">{item.nama}</p>
                    <p className="text-xs text-[#5f6368]">
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
        <div className="border border-[#dadce0] bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-[#202124]">Tagihan Terbaru</h2>
            <Link to="/tagihan" className="text-xs font-medium text-[#1a73e8] hover:underline">
              Lihat Semua →
            </Link>
          </div>
          <div className="space-y-3">
            {tagihanData.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#80868b]">Belum ada tagihan</p>
            ) : (
              tagihanData.map((item) => {
                const harga = Number(item.product?.harga || 0)
                const diskon = Number(item.diskon || 0)
                const tagihan = harga - diskon
                const dibayar = Number(item.nominal || 0)
                const sisa = Math.max(0, tagihan - dibayar)
                return (
                  <div key={item.id} className="flex items-center justify-between bg-[#f8f9fa] p-3">
                    <div>
                      <p className="text-sm font-medium text-[#202124]">{item.nama}</p>
                      <p className="text-xs font-medium text-[#3c4043]">
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
        <div className="border border-[#dadce0] bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-[#202124]">Pembayaran Masuk</h2>
            <Link to="/pembayaran" className="text-xs font-medium text-[#1a73e8] hover:underline">
              Lihat Semua →
            </Link>
          </div>
          <div className="space-y-2">
            <div className="bg-[#f8f9fa] p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-[#5f6368]">Bulan Ini</span>
                <span className="text-base font-medium text-[#137333]">
                  Rp {totalPembayaranBulanIni.toLocaleString('id-ID')}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#5f6368]">
                {totalPembayaranBulanLalu > 0
                  ? `${pctChange >= 0 ? '+' : ''}${pctChange}% dari bulan sebelumnya`
                  : 'Belum ada data bulan lalu'}
              </p>
            </div>
            <div className="bg-[#f8f9fa] p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-[#5f6368]">Total Semua</span>
                <span className="text-base font-medium text-[#1a73e8]">
                  Rp {pendaftar.filter(p => p.status_pembayaran === 'verified').reduce((s, p) => s + Number(p.nominal || 0), 0).toLocaleString('id-ID')}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#5f6368]">{pendaftar.filter(p => p.status_pembayaran === 'verified').length} transaksi</p>
            </div>
          </div>
        </div>

        {/* Affiliate Aktif */}
        <div className="border border-[#dadce0] bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-[#202124]">Affiliate Aktif</h2>
            <Link to="/data-affiliate" className="text-xs font-medium text-[#1a73e8] hover:underline">
              Lihat Semua →
            </Link>
          </div>
          <div className="space-y-3">
            {affiliateAktif.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#80868b]">Belum ada affiliate</p>
            ) : (
              affiliateAktif.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-[#f8f9fa] p-3">
                  <div>
                    <p className="text-sm font-medium text-[#202124]">{item.affiliate?.name || '-'}</p>
                    <p className="text-xs text-[#5f6368]">{item.product?.nama || '-'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#202124]">{item.pendaftar_count} daftar</p>
                    <span className="text-xs font-medium text-[#137333]">Aktif</span>
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
