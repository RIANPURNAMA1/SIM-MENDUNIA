import { TrendingUp, Users, Briefcase, CheckCircle2 } from 'lucide-react'

export default function DashboardManagement() {
  const stats = [
    { label: 'Total Proyek', value: 28, icon: Briefcase, color: 'bg-indigo-500' },
    { label: 'Selesai', value: 18, icon: CheckCircle2, color: 'bg-green-500' },
    { label: 'Dalam Proses', value: 7, icon: TrendingUp, color: 'bg-orange-500' },
    { label: 'Tim', value: 45, icon: Users, color: 'bg-pink-500' },
  ]

  const projects = [
    { nama: 'Sistem Inventory', progress: 85, status: 'Berlangsung' },
    { nama: 'Mobile App', progress: 60, status: 'Berlangsung' },
    { nama: 'Website Redesign', progress: 100, status: 'Selesai' },
    { nama: 'API Integration', progress: 45, status: 'Berlangsung' },
  ]

  return (
    <div className="px-3 sm:px-6 py-3 sm:py-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white">
            <TrendingUp size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Management</h1>
            <p className="text-sm text-gray-500">Kelola proyek dan tim dengan efisien</p>
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
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-gray-400 mt-1">Tahun 2026</p>
            </div>
          )
        })}
      </div>

      {/* Projects */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Proyek Aktif</h2>
        <div className="space-y-4">
          {projects.map((proj, idx) => (
            <div key={idx} className="border-b border-gray-100 pb-4 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{proj.nama}</h3>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  proj.status === 'Selesai' 
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {proj.status}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition"
                  style={{ width: `${proj.progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{proj.progress}% Selesai</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
