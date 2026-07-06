import { Users, Briefcase, BookOpen, UserCheck, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

const dashboards = [
  {
    id: 'akademik',
    title: 'Dashboard Akademik',
    description: 'Kelola data akademik siswa, guru, dan kelas',
    icon: BookOpen,
    path: '/dashboard-akademik',
  },
  {
    id: 'absensi',
    title: 'Dashboard Absensi Karyawan',
    description: 'Monitoring kehadiran, shift, dan lokasi absensi real-time',
    icon: UserCheck,
    path: '/dashboard-absensi',
  },
  {
    id: 'kandidat',
    title: 'Dashboard Kandidat',
    description: 'Kelola data kandidat, pendaftaran, pembayaran, dan affiliate',
    icon: FileText,
    path: '/dashboard-kandidat',
  },
  {
    id: 'karyawan',
    title: 'Dashboard Karyawan',
    description: 'Kelola database karyawan perusahaan',
    icon: Briefcase,
    path: '/karyawan',
  },
]

export default function DashboardHome() {
  return (
    <div className="px-3 sm:px-6 py-3 sm:py-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Pusat</h1>
        <p className="text-gray-500">Pilih dashboard yang ingin Anda akses</p>
      </div>

      {/* Dashboard Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dashboards.map((dash) => {
          const Icon = dash.icon
          return (
            <Link
              key={dash.id}
              to={dash.path}
              className="group"
            >
              <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-300 h-full cursor-pointer">
                {/* Icon */}
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
                  <Icon size={20} className="text-gray-700" />
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {dash.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {dash.description}
                </p>

                {/* Arrow */}
                <div className="flex items-center text-blue-600 font-medium text-sm group-hover:gap-2 gap-1 transition-all">
                  <span>Akses Sekarang</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>💡 Tip:</strong> Setiap dashboard memiliki fitur dan data yang berbeda. Gunakan menu navigasi di sidebar untuk akses cepat ke fitur tertentu.
        </p>
      </div>
    </div>
  )
}
