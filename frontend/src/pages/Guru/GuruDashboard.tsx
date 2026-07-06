import { useState, useEffect } from 'react'
import { BookOpen, Calendar, CheckCircle, Clock, User, X, GraduationCap, Users, ArrowRight } from 'lucide-react'
import api from '../../services/api'

interface GuruData {
  id: number
  nama: string
  nip: string | null
  mata_pelajaran: string | null
  no_hp: string | null
  status: string
}

interface KelasAktif {
  id: number
  nama_kelas: string
  level: number
  batch_relasi: { id: number; nama_batch: string } | null
  absensi: {
    id: number
    jam_masuk: string | null
    jam_keluar: string | null
    status: string
  }[]
}

interface RiwayatSensei {
  id: number
  tanggal: string
  jam_masuk: string | null
  jam_keluar: string | null
  status: string
  kelas_sensei: { nama_kelas: string; level: number }
}

interface DashboardData {
  guru: GuruData | null
  user: { id: number; name: string; email: string; foto_profil: string | null }
  kelas_aktif: KelasAktif[]
  total_kelas: number
  kehadiran_bulan_ini: number
  riwayat_sensei: RiwayatSensei[]
}

const cardClass = 'bg-white border border-gray-200 rounded-lg shadow-sm'
const labelClass = 'block text-sm font-medium text-gray-700 mb-1'
const statusColors: Record<string, string> = {
  HADIR: 'bg-emerald-100 text-emerald-700',
  TERLAMBAT: 'bg-amber-100 text-amber-700',
  'PULANG LEBIH AWAL': 'bg-orange-100 text-orange-700',
  ALPA: 'bg-red-100 text-red-600',
  LIBUR: 'bg-blue-100 text-blue-700',
  'TIDAK ABSEN PULANG': 'bg-red-100 text-red-600',
}

function StatusBadge({ status }: { status: string }) {
  const color = statusColors[status] || 'bg-gray-100 text-gray-600'
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>{status}</span>
}

export default function GuruDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/guru-dashboard').then(res => {
      setData(res.data)
      setLoading(false)
    }).catch(err => {
      console.error('Guru dashboard API error:', err)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0D1F3C] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-8 h-8" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <p className="text-sm text-gray-500">Gagal memuat data</p>
      </div>
    )
  }

  const { guru, user, kelas_aktif, total_kelas, kehadiran_bulan_ini, riwayat_sensei } = data

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <div className="px-3 py-4 sm:px-6 sm:py-5 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] text-white">
            <GraduationCap size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Dashboard Guru</h1>
            <p className="text-sm text-gray-500">Selamat datang, {user.name}</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className={`${cardClass} p-5 mb-5`}>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eef1f6] text-gray-400 shrink-0">
              <User size={32} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-gray-900">{guru?.nama || user.name}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                {guru?.nip && <span>NIP: {guru.nip}</span>}
                {guru?.mata_pelajaran && <span>Mapel: {guru.mata_pelajaran}</span>}
                {guru?.no_hp && <span>Telp: {guru.no_hp}</span>}
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  guru?.status === 'AKTIF' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}>{guru?.status || 'NONAKTIF'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div className={cardClass}>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2.5 bg-blue-50 text-blue-600">
                  <BookOpen size={20} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Total Kelas</p>
                  <p className="text-xl font-bold text-gray-900">{total_kelas}</p>
                </div>
              </div>
            </div>
          </div>
          <div className={cardClass}>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2.5 bg-emerald-50 text-emerald-600">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Kehadiran Bulan Ini</p>
                  <p className="text-xl font-bold text-gray-900">{kehadiran_bulan_ini}</p>
                </div>
              </div>
            </div>
          </div>
          <div className={cardClass}>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2.5 bg-purple-50 text-purple-600">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Kelas Hari Ini</p>
                  <p className="text-xl font-bold text-gray-900">{kelas_aktif.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* Today's Classes */}
          <div className={cardClass}>
            <div className="border-b border-gray-200 px-5 py-3.5">
              <h2 className="text-xs font-bold text-[#0D1F3C] uppercase tracking-wider">Kelas Hari Ini</h2>
            </div>
            {kelas_aktif.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">Tidak ada kelas hari ini</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {kelas_aktif.map(kelas => {
                  const absen = kelas.absensi?.[0]
                  return (
                    <div key={kelas.id} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-gray-900">{kelas.nama_kelas}</p>
                        <span className="text-[11px] font-medium text-gray-400">Level {kelas.level}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">{kelas.batch_relasi?.nama_batch || '-'}</p>
                        {absen ? (
                          <StatusBadge status={absen.status} />
                        ) : (
                          <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500">BELUM ABSEN</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent Attendance */}
          <div className={cardClass}>
            <div className="border-b border-gray-200 px-5 py-3.5">
              <h2 className="text-xs font-bold text-[#0D1F3C] uppercase tracking-wider">Riwayat Kehadiran</h2>
            </div>
            {riwayat_sensei.length === 0 ? (
              <div className="p-8 text-center">
                <Clock size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">Belum ada riwayat kehadiran</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[320px] overflow-y-auto">
                {riwayat_sensei.map(item => (
                  <div key={item.id} className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.kelas_sensei?.nama_kelas}</p>
                        <p className="text-xs text-gray-400">
                          {item.tanggal}
                          {item.jam_masuk && ` | ${item.jam_masuk}`}
                          {item.jam_keluar && ` - ${item.jam_keluar}`}
                        </p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className={cardClass}>
          <div className="border-b border-gray-200 px-5 py-3.5">
            <h2 className="text-xs font-bold text-[#0D1F3C] uppercase tracking-wider">Menu Cepat</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5">
            {[
              { label: 'Absensi Saya', icon: Clock, href: '/dashboard-karyawan', color: 'text-blue-600 bg-blue-50' },
              { label: 'Kelas Saya', icon: BookOpen, href: '/kelas-sensei', color: 'text-purple-600 bg-purple-50' },
              { label: 'Riwayat', icon: Calendar, href: '/riwayat-absensi-karyawan', color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Profil', icon: User, href: '/profil-karyawan', color: 'text-gray-600 bg-gray-100' },
            ].map(menu => (
              <a key={menu.label} href={menu.href}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:border-[#0D1F3C] hover:shadow-sm transition-all group">
                <div className={`rounded-lg p-2 ${menu.color}`}>
                  <menu.icon size={18} />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-[#0D1F3C]">{menu.label}</span>
                <ArrowRight size={14} className="ml-auto text-gray-300 group-hover:text-[#0D1F3C]" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
