import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, CalendarCheck, Bot, Settings,
  ChevronDown, Bell, Mail, Timer, UserCog, LogOut,
  Building2, MapPin, CalendarPlus, List, ClipboardList,
  FileText, Clock, BarChart3, BookOpen, GraduationCap,
  Layers, Notebook, Presentation, UserPlus, User, Search,
  Briefcase, Zap, MessageCircle, CreditCard, Handshake, Package,
  ListOrdered, MessageSquare, Wallet,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { izinApi, lemburApi, APP_URL } from '../services/api'

interface HeaderProps {
  onToggleSidebar: () => void
}

const navItems: { label: string; icon: React.ReactNode; href?: string; children?: { label: string; icon: React.ReactNode; href: string }[] }[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={16} />, href: '/' },
  {
    label: 'Kandidat', icon: <UserPlus size={16} />,
    children: [
      { label: 'Data Kandidat', icon: <UserPlus size={14} />, href: '/data-kandidat' },
      { label: 'Pendaftar', icon: <ClipboardList size={14} />, href: '/pendaftar' },
      { label: 'Tagihan', icon: <FileText size={14} />, href: '/tagihan' },
      { label: 'Pembayaran', icon: <CreditCard size={14} />, href: '/pembayaran' },
      { label: 'Kategori Bayar', icon: <ListOrdered size={14} />, href: '/data-biaya-kategori' },
      { label: 'Notifikasi WA', icon: <MessageCircle size={14} />, href: '/notifikasi-wa' },
    ],
  },
  {
    label: 'Matching Job', icon: <Search size={16} />,
    children: [
      { label: 'Kandidat Matching Job', icon: <UserPlus size={14} />, href: '/data-matching-job' },
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
    label: 'Keuangan', icon: <Wallet size={16} />,
    children: [
      { label: 'Dashboard Keuangan', icon: <LayoutDashboard size={14} />, href: '/dashboard-keuangan' },
      { label: 'Tagihan', icon: <FileText size={14} />, href: '/tagihan' },
      { label: 'Pembayaran', icon: <CreditCard size={14} />, href: '/pembayaran' },
      { label: 'Rekap Per Batch', icon: <Layers size={14} />, href: '/rekap-per-batch' },
      { label: 'Kategori Pengeluaran', icon: <ListOrdered size={14} />, href: '/kategori-pengeluaran' },
      { label: 'Data Pengeluaran', icon: <Wallet size={14} />, href: '/pengeluaran' },
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
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [notifFilter, setNotifFilter] = useState<'all' | 'izin' | 'lembur'>('all')
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      izinApi.list({ status: 'PENDING', per_page: 10 }).catch(() => ({ data: { data: [] } })),
      lemburApi.list({ status: 'PENDING', per_page: 10 }).catch(() => ({ data: { data: [] } })),
    ]).then(([izinRes, lemburRes]) => {
      const izinList = (izinRes.data?.data || []).map((i: any) => ({
        id: `izin-${i.id}`,
        type: 'izin' as const,
        nama: i.user?.name || '-',
        jenis: i.jenis_izin,
        created_at: i.created_at,
        link: '/izin-cuti',
        icon: Mail,
        iconColor: i.jenis_izin === 'SAKIT' ? 'text-red-400' : i.jenis_izin === 'CUTI' ? 'text-blue-400' : 'text-teal-400',
      }))
      const lemburList = (lemburRes.data?.data || []).map((l: any) => ({
        id: `lembur-${l.id}`,
        type: 'lembur' as const,
        nama: l.user?.name || '-',
        jenis: 'LEMBUR',
        created_at: l.created_at,
        link: '/approval-lembur',
        icon: Timer,
        iconColor: 'text-green-400',
      }))
      const combined = [...izinList, ...lemburList].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setNotifications(combined)
    })
  }, [])

  const filteredNotif = notifications.filter(n => {
    if (notifFilter === 'all') return true
    if (notifFilter === 'izin') return n.type === 'izin'
    if (notifFilter === 'lembur') return n.type === 'lembur'
    return true
  })

  function timeAgo(dateStr: string) {
    const now = Date.now()
    const diff = now - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Baru saja'
    if (mins < 60) return `${mins} menit yang lalu`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} jam yang lalu`
    const days = Math.floor(hours / 24)
    return `${days} hari yang lalu`
  }

  const avatarUrl = user?.foto_profil
    ? `${APP_URL}/uploads/profil/${user.foto_profil}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=e5e7eb&color=6b7280&size=36`

  const isAccounting = user?.role === 'ACCOUNTING'
  const isAdminCabang = user?.role === 'ADMIN_CABANG'

  const filteredNavItems = isAdminCabang
    ? navItems.filter(
        (item) => item.label === 'Dashboard' || item.label === 'Keuangan',
      )
    : isAccounting
    ? navItems
        .filter(
          (item) =>
            item.label === 'Keuangan' ||
            item.label === 'Kandidat' ||
            item.label === 'Affiliate' ||
            item.label === 'Absensi',
        )
        .map((item) => {
          if (item.label === 'Kandidat' && item.children) {
            return {
              ...item,
              children: item.children.filter(
                (child) => child.label === 'Data Kandidat' || child.label === 'Pendaftar',
              ),
            }
          }
          if (item.label === 'Absensi' && item.children) {
            return {
              ...item,
              children: item.children.filter(
                (child) => child.label === 'Rekap Absensi',
              ),
            }
          }
          return item
        })
    : navItems

  const isActive = (href: string) => {
    if (href === '/') return path === '/'
    return path.startsWith(href)
  }

  const handleLogout = () => {
    window.location.href = `${APP_URL}/logout-app`
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
          {filteredNavItems.map((item) => {
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
            {notifications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{notifications.length}</span>
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="p-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500">Notifikasi Pengajuan</p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filteredNotif.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">Tidak ada pengajuan</div>
                ) : (
                  filteredNotif.map(n => {
                    const Icon = n.icon
                    return (
                      <Link key={n.id} to={n.link} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50">
                        <Icon size={20} className={`${n.iconColor} mt-0.5 shrink-0`} />
                        <div>
                          <p className="text-sm font-medium text-gray-700">{n.nama}: {n.jenis}</p>
                          <p className="text-xs text-gray-400">{timeAgo(n.created_at)}</p>
                        </div>
                      </Link>
                    )
                  })
                )}
              </div>
              <div className="p-2 border-t border-gray-100 flex justify-center gap-3 text-xs text-[#0D1F3C]">
                <button onClick={() => setNotifFilter('all')} className={`hover:underline ${notifFilter === 'all' ? 'font-bold' : ''}`}>Semua</button>
                <span className="text-gray-300">|</span>
                <button onClick={() => setNotifFilter('izin')} className={`hover:underline ${notifFilter === 'izin' ? 'font-bold' : ''}`}>Semua Izin</button>
                <span className="text-gray-300">|</span>
                <button onClick={() => setNotifFilter('lembur')} className={`hover:underline ${notifFilter === 'lembur' ? 'font-bold' : ''}`}>Semua Lembur</button>
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
            {user?.foto_profil ? (
              <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#eef1f6] flex items-center justify-center">
                <User size={16} className="text-[#8B90A0]" />
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-700 leading-tight">{user?.name || 'User'}</p>
              <p className="text-[10px] text-gray-400">{user?.role || '-'}</p>
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
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                >
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
