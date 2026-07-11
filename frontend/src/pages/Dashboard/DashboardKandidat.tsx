import { useEffect, useState, useMemo } from 'react'
import { FileText, CreditCard, DollarSign, Handshake, Users, TrendingUp, Loader, BarChart3, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { pendaftarApi, pembayaranApi, affiliateLinkApi } from '../../services/api'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Filler, Tooltip, Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

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

interface KandidatStats {
  totalKandidat: number
  kandidatAktif: number
  totalBatch: number
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
        borderColor: '#0D1F3C',
        backgroundColor: 'rgba(13, 31, 60, 0.12)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#0D1F3C',
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
        backgroundColor: '#0D1F3C',
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

  const breakdownStats = [
    { label: 'Total Pendaftar', value: pendaftar.length, icon: Users, color: 'text-[#0D1F3C]', bg: 'bg-[#0D1F3C]/5' },
    { label: 'Disetujui', value: pendaftar.filter(p => p.status_pendaftaran === 'disetujui').length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending', value: pendaftar.filter(p => p.status_pendaftaran === 'pending').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Ditolak', value: pendaftar.filter(p => p.status_pendaftaran === 'ditolak').length, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
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

  const stats = [
    { label: 'Total Kandidat', value: kandidatStats?.totalKandidat ?? 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Pendaftar Baru (Bulan Ini)', value: pendaftarBaruBulanIni.length, icon: FileText, color: 'bg-orange-500' },
    { label: 'Pembayaran Masuk', value: `Rp ${(totalPembayaranBulanIni).toLocaleString('id-ID')}`, icon: DollarSign, color: 'bg-green-500' },
    { label: 'Affiliate Aktif', value: affiliateAktif.length, icon: Handshake, color: 'bg-purple-500' },
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
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Kandidat</h1>
            <p className="text-sm text-gray-500">Kelola kandidat, pendaftaran, pembayaran, dan affiliate</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div
              key={idx}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-600">{stat.label}</span>
                <div className={`${stat.color} p-2.5 rounded-lg`}>
                  <Icon size={16} className="text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1 truncate">{stat.value}</div>
              <p className="text-xs text-gray-400">Tahun 2026</p>
            </div>
          )
        })}
      </div>

      {/* Chart Section */}
      <div className="mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0D1F3C]/5">
                <BarChart3 size={18} className="text-[#0D1F3C]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800">Grafik Pendaftaran</h2>
                <p className="text-xs text-gray-400">Tren pendaftaran 6 bulan terakhir</p>
              </div>
            </div>
          </div>
          <div className="h-72 sm:h-80">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Breakdown Stats */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {breakdownStats.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
              <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${s.bg} shrink-0`}>
                <Icon size={20} className={s.color} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pendaftaran Terbaru */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pendaftaran Terbaru</h2>
            <Link to="/pendaftar" className="text-xs text-blue-600 font-semibold hover:text-blue-700">
              Lihat Semua →
            </Link>
          </div>
          <div className="space-y-3">
            {pendaftarTerbaru.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Belum ada pendaftaran</p>
            ) : (
              pendaftarTerbaru.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.nama}</p>
                    <p className="text-xs text-gray-500">
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
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Tagihan Terbaru</h2>
            <Link to="/tagihan" className="text-xs text-blue-600 font-semibold hover:text-blue-700">
              Lihat Semua →
            </Link>
          </div>
          <div className="space-y-3">
            {tagihanData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Belum ada tagihan</p>
            ) : (
              tagihanData.map((item) => {
                const harga = Number(item.product?.harga || 0)
                const diskon = Number(item.diskon || 0)
                const tagihan = harga - diskon
                const dibayar = Number(item.nominal || 0)
                const sisa = Math.max(0, tagihan - dibayar)
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.nama}</p>
                      <p className="text-sm font-semibold text-gray-800">
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
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pembayaran Masuk</h2>
            <Link to="/pembayaran" className="text-xs text-blue-600 font-semibold hover:text-blue-700">
              Lihat Semua →
            </Link>
          </div>
          <div className="space-y-2">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-700">Bulan Ini</span>
                <span className="text-lg font-bold text-emerald-600">
                  Rp {totalPembayaranBulanIni.toLocaleString('id-ID')}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {totalPembayaranBulanLalu > 0
                  ? `${pctChange >= 0 ? '+' : ''}${pctChange}% dari bulan sebelumnya`
                  : 'Belum ada data bulan lalu'}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-700">Total Semua</span>
                <span className="text-lg font-bold text-blue-600">
                  Rp {pendaftar.filter(p => p.status_pembayaran === 'verified').reduce((s, p) => s + Number(p.nominal || 0), 0).toLocaleString('id-ID')}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{pendaftar.filter(p => p.status_pembayaran === 'verified').length} transaksi</p>
            </div>
          </div>
        </div>

        {/* Affiliate Aktif */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Affiliate Aktif</h2>
            <Link to="/data-affiliate" className="text-xs text-blue-600 font-semibold hover:text-blue-700">
              Lihat Semua →
            </Link>
          </div>
          <div className="space-y-3">
            {affiliateAktif.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Belum ada affiliate</p>
            ) : (
              affiliateAktif.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.affiliate?.name || '-'}</p>
                    <p className="text-xs text-gray-500">{item.product?.nama || '-'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{item.pendaftar_count} daftar</p>
                    <span className="text-xs font-semibold text-emerald-600">Aktif</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Batch</p>
          <p className="text-2xl font-bold text-gray-900">{kandidatStats?.totalBatch ?? 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Kandidat</p>
          <p className="text-2xl font-bold text-gray-900">{kandidatStats?.totalKandidat ?? 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Kandidat Aktif</p>
          <p className="text-2xl font-bold text-emerald-600">{kandidatStats?.kandidatAktif ?? 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Pembayaran Terverifikasi</p>
          <p className="text-2xl font-bold text-blue-600">{pendaftar.filter(p => p.status_pembayaran === 'verified').length}</p>
        </div>
      </div>
    </div>
  )
}
