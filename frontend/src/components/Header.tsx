import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, CalendarCheck, Bot, Settings,
  ChevronDown, Bell, Mail, Timer, UserCog, LogOut,
  Building2, MapPin, CalendarPlus, List, ClipboardList,
  FileText, Clock, BarChart3, BookOpen, GraduationCap,
  Layers, Notebook, Presentation, UserPlus, Search,
  Briefcase, Zap, MessageCircle, CreditCard, Handshake, Package,
} from 'lucide-react'
import { authApi } from '../services/api'

interface HeaderProps {
  onToggleSidebar: () => void
}

interface UserData {
  id: number
  name: string
  email: string
  role: string
  foto_profil: string | null
}

const navItems: { label: string; icon: React.ReactNode; href?: string; children?: { label: string; icon: React.ReactNode; href: string }[] }[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={16} />, href: '/' },
  {
    label: 'Kandidat', icon: <UserPlus size={16} />,
    children: [
      { label: 'Data Kandidat', icon: <UserPlus size={14} />, href: '/data-kandidat' },
      { label: 'Pendaftar', icon: <ClipboardList size={14} />, href: '/pendaftar' },
      { label: 'Data Matching Job', icon: <Search size={14} />, href: '/data-matching-job' },
      { label: 'Tagihan', icon: <FileText size={14} />, href: '/tagihan' },
      { label: 'Pembayaran', icon: <CreditCard size={14} />, href: '/pembayaran' },
    ],
  },
  {
    label: 'Affiliate', icon: <Handshake size={16} />,
    children: [
      { label: 'Data Affiliate', icon: <Handshake size={14} />, href: '/data-affiliate' },
      { label: 'Data Product', icon: <Package size={14} />, href: '/data-product' },
    ],
  },
  {
    label: 'Akademik', icon: <BookOpen size={16} />,
    children: [
      { label: 'Data Guru', icon: <Presentation size={14} />, href: '/guru' },
      { label: 'Kelas Sensei', icon: <BookOpen size={14} />, href: '/kelas-sensei' },
      { label: 'Jadwal Level', icon: <CalendarPlus size={14} />, href: '/jadwal-level' },
      { label: 'Data Siswa', icon: <Users size={14} />, href: '/siswa' },
      { label: 'Batch', icon: <Layers size={14} />, href: '/batches' },
      { label: 'Penilaian', icon: <Notebook size={14} />, href: '/penilaian' },
    ],
  },
  {
    label: 'Absensi', icon: <CalendarCheck size={16} />,
    children: [
      { label: 'Kehadiran', icon: <ClipboardList size={14} />, href: '/data-kehadiran' },
      { label: 'Izin & Cuti', icon: <FileText size={14} />, href: '/izin-cuti' },
      { label: 'Approval Lembur', icon: <Clock size={14} />, href: '/approval-lembur' },
      { label: 'Hari Libur', icon: <FileText size={14} />, href: '/hari-libur' },
      { label: 'Rekap Absensi', icon: <BarChart3 size={14} />, href: '/rekap-absensi' },
      { label: 'Monitoring Lokasi', icon: <MapPin size={14} />, href: '/monitoring-lokasi' },
      { label: 'Kehadiran Sensei', icon: <ClipboardList size={14} />, href: '/data-kehadiran-sensei' },
      { label: 'Absensi Siswa', icon: <ClipboardList size={14} />, href: '/absensi-siswa' },
    ],
  },
  {
    label: 'HR', icon: <Briefcase size={16} />,
    children: [
      { label: 'Data Karyawan', icon: <Users size={14} />, href: '/karyawan' },
      { label: 'Divisi', icon: <Building2 size={14} />, href: '/divisi' },
      { label: 'Cabang', icon: <MapPin size={14} />, href: '/cabang' },
      { label: 'Shift Kerja', icon: <Timer size={14} />, href: '/shift' },
      { label: 'Jadwal Shift', icon: <CalendarPlus size={14} />, href: '/jadwal-shift' },
      { label: 'Daftar User', icon: <List size={14} />, href: '/daftar-user' },
    ],
  },
  {
    label: 'Automasi', icon: <Zap size={16} />,
    children: [
      { label: 'AI Chat', icon: <Bot size={14} />, href: '/ai-chat' },
      { label: 'Notifikasi WA', icon: <MessageCircle size={14} />, href: '/pengaturan-wa' },
      { label: 'Pengaturan Shift', icon: <Timer size={14} />, href: '/pengaturan-shift' },
      { label: 'Manajemen Akun', icon: <UserCog size={14} />, href: '/pengaturan' },
    ],
  },
]

export default function Header({ onToggleSidebar }: HeaderProps) {
  const location = useLocation()
  const path = location.pathname
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)

  useEffect(() => {
    authApi.user()
      .then((res) => setUser(res.data))
      .catch(() => {
        setUser({ id: 0, name: 'Admin', email: '', role: 'ADMIN', foto_profil: null })
      })
  }, [])

  const avatarUrl = user?.foto_profil
    ? `http://localhost:8000/uploads/profil/${user.foto_profil}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=e5e7eb&color=6b7280&size=36`

  const isActive = (href: string) => {
    if (href === '/') return path === '/'
    return path.startsWith(href)
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>

        <Link to="/" className="flex items-center gap-2 lg:hidden">
          <img src="/logo-sm.png" alt="SIM Mendunia" className="h-7 w-auto" />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            if (item.href) {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    active ? 'bg-[#0D1F3C] text-white font-medium' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              )
            }

            if (item.children) {
              const groupActive = item.children.some((c) => isActive(c.href))
              return (
                <div key={item.label} className="relative group">
                  <button className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    groupActive ? 'bg-[#0D1F3C] text-white font-medium' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}>
                    {item.icon}
                    <span>{item.label}</span>
                    <ChevronDown size={12} />
                  </button>
                  <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.label}
                          to={child.href}
                          className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                            isActive(child.href) ? 'bg-[#0D1F3C]/10 text-[#0D1F3C] font-medium' : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {child.icon}
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )
            }

            return null
          })}
        </nav>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 relative"
          >
            <Bell size={20} />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">3</span>
          </button>
          {showNotif && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="p-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500">Notifikasi Pengajuan</p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <Link to="/izin-cuti" className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50">
                  <Mail size={20} className="text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Lutfi Nurul Hasanah: SAKIT</p>
                    <p className="text-xs text-gray-400">2 jam yang lalu</p>
                  </div>
                </Link>
                <Link to="/approval-lembur" className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50">
                  <Timer size={20} className="text-green-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Budi Santoso: LEMBUR</p>
                    <p className="text-xs text-gray-400">5 jam yang lalu</p>
                  </div>
                </Link>
              </div>
              <div className="p-2 border-t border-gray-100 flex justify-center gap-3 text-xs text-[#0D1F3C]">
                <Link to="/izin-cuti" className="hover:underline">Semua Izin</Link>
                <span className="text-gray-300">|</span>
                <Link to="/approval-lembur" className="hover:underline">Semua Lembur</Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=e5e7eb&color=6b7280&size=36` }} />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-700 leading-tight">{user?.name || 'Admin'}</p>
              <p className="text-[10px] text-gray-400">{user?.role || 'ADMIN'}</p>
            </div>
            <ChevronDown size={12} className="text-gray-400 hidden sm:block" />
          </button>
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="py-1">
                <Link to="/pengaturan" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                  <UserCog size={16} />Manajemen Akun
                </Link>
                <hr className="my-1 border-gray-100" />
                <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50">
                  <LogOut size={16} />Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}