import { FileText, CreditCard, DollarSign, Handshake, Users, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function DashboardKandidat() {
  const stats = [
    { label: 'Total Kandidat', value: 156, icon: Users, color: 'bg-blue-500' },
    { label: 'Pendaftar Baru', value: 24, icon: FileText, color: 'bg-orange-500' },
    { label: 'Pembayaran Masuk', value: '₽84.5M', icon: DollarSign, color: 'bg-green-500' },
    { label: 'Affiliate Aktif', value: 18, icon: Handshake, color: 'bg-purple-500' },
  ]

  const pendaftaran = [
    { nama: 'Ahmad Rizkianto', status: 'Pending Review', tanggal: '3 Juli 2026' },
    { nama: 'Siti Nurhaliza', status: 'Disetujui', tanggal: '2 Juli 2026' },
    { nama: 'Budi Prasetyo', status: 'Ditolak', tanggal: '1 Juli 2026' },
    { nama: 'Rina Wijaya', status: 'Pending Review', tanggal: '30 Juni 2026' },
  ]

  const tagihan = [
    { nomor: 'INV-2026-001', jumlah: '₽2.5M', status: 'Lunas' },
    { nomor: 'INV-2026-002', jumlah: '₽1.8M', status: 'Proses' },
    { nomor: 'INV-2026-003', jumlah: '₽3.2M', status: 'Jatuh Tempo' },
  ]

  const affiliate = [
    { nama: 'PT. Sukses Maju', komisi: '₽5.2M', status: 'Aktif' },
    { nama: 'CV. Cipta Karya', komisi: '₽3.8M', status: 'Aktif' },
    { nama: 'Perseorangan (Adi Wijaya)', komisi: '₽2.1M', status: 'Aktif' },
  ]

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
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <p className="text-xs text-gray-400">Tahun 2026</p>
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
            {pendaftaran.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.nama}</p>
                  <p className="text-xs text-gray-500">{item.tanggal}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  item.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-700' :
                  item.status === 'Ditolak' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tagihan */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Tagihan</h2>
            <Link to="/tagihan" className="text-xs text-blue-600 font-semibold hover:text-blue-700">
              Lihat Semua →
            </Link>
          </div>
          <div className="space-y-3">
            {tagihan.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.nomor}</p>
                  <p className="text-sm font-semibold text-gray-800">{item.jumlah}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  item.status === 'Lunas' ? 'bg-emerald-100 text-emerald-700' :
                  item.status === 'Proses' ? 'bg-blue-100 text-blue-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pembayaran */}
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
                <span className="text-lg font-bold text-emerald-600">₽45.3M</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Target: ₽70M</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-700">Bulan Lalu</span>
                <span className="text-lg font-bold text-blue-600">₽39.2M</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">+15% dari bulan sebelumnya</p>
            </div>
          </div>
        </div>

        {/* Affiliate */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Affiliate Aktif</h2>
            <Link to="/data-affiliate" className="text-xs text-blue-600 font-semibold hover:text-blue-700">
              Lihat Semua →
            </Link>
          </div>
          <div className="space-y-3">
            {affiliate.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.nama}</p>
                  <p className="text-xs text-gray-500">Komisi</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{item.komisi}</p>
                  <span className="text-xs font-semibold text-emerald-600">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
