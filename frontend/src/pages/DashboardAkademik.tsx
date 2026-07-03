import { BarChart3, Users, BookOpen, Calendar, TrendingUp } from 'lucide-react'

export default function DashboardAkademik() {
  const stats = [
    { label: 'Total Siswa', value: 150, icon: Users, color: 'bg-blue-500' },
    { label: 'Kelas Aktif', value: 12, icon: BookOpen, color: 'bg-purple-500' },
    { label: 'Guru', value: 24, icon: Users, color: 'bg-green-500' },
    { label: 'Mata Pelajaran', value: 18, icon: BookOpen, color: 'bg-orange-500' },
  ]

  return (
    <div className="px-3 sm:px-6 py-3 sm:py-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Akademik</h1>
            <p className="text-sm text-gray-500">Pantau data akademik siswa dan guru</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Kelas Terbaru */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Kelas Terbaru</h2>
          <div className="space-y-3">
            {[
              { nama: 'Kelas 10A', guru: 'Pak Budi', siswa: 35, status: 'Aktif' },
              { nama: 'Kelas 10B', guru: 'Bu Siti', siswa: 32, status: 'Aktif' },
              { nama: 'Kelas 11A', guru: 'Pak Ahmad', siswa: 38, status: 'Aktif' },
            ].map((kelas, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{kelas.nama}</p>
                  <p className="text-xs text-gray-500">{kelas.guru}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{kelas.siswa}</p>
                  <p className="text-xs text-emerald-600 font-medium">{kelas.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Jadwal Hari Ini */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={20} />
            Jadwal Hari Ini
          </h2>
          <div className="space-y-2">
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-semibold text-blue-900">08:00 - 09:30</p>
              <p className="text-sm font-medium text-blue-800">Matematika (Kelas 10A)</p>
            </div>
            <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-xs font-semibold text-purple-900">09:45 - 11:15</p>
              <p className="text-sm font-medium text-purple-800">Bahasa Inggris (Kelas 10B)</p>
            </div>
            <div className="p-2.5 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs font-semibold text-green-900">13:00 - 14:30</p>
              <p className="text-sm font-medium text-green-800">IPA (Kelas 11A)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
