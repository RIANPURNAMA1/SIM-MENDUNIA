import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, ChevronDown, Bell, Mail, Timer, User, UserCog, LogOut,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { izinApi, lemburApi, APP_URL } from '../services/api'

interface HeaderProps {
  onToggleSidebar: () => void
}

const navItems: { label: string; icon: React.ReactNode; href?: string }[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={16} />, href: '/' },
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

  const filteredNavItems = navItems

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
          {filteredNavItems.map((item) => (
            <Link
              key={item.label}
              to={item.href!}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                isActive(item.href!) ? 'bg-[#0E6187] text-white font-medium' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
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
              <div className="p-2 border-t border-gray-100 flex justify-center gap-3 text-xs text-[#0E6187]">
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
