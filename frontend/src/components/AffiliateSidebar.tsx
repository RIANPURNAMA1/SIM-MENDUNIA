import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Table, User, Package, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface AffiliateSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function AffiliateSidebar({ isOpen, onClose }: AffiliateSidebarProps) {
  const location = useLocation()
  const { logout } = useAuth()
  const activeDash = location.pathname === '/affiliate-dashboard' && !location.search.includes('tab=pendaftar')
  const activePendaftar = location.pathname === '/affiliate-dashboard' && location.search.includes('tab=pendaftar')
  const activeProfile = location.pathname === '/affiliate-profile'

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        w-64 bg-[#0E6187] h-screen flex flex-col fixed left-0 top-0 z-40
        transition-transform duration-300 ease-in-out shadow-[8px_0_30px_rgba(0,0,0,0.15)]
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="relative flex items-center justify-center px-5 py-4 border-b border-white/10 bg-white/5 flex-shrink-0">
          <img src="/logo-sm1.png" alt="SIM Mendunia" className="h-14 w-auto" />
        </div>

        <nav className="flex-1 px-2.5 py-3 space-y-0.5">
          <Link
            to="/affiliate-dashboard"
            onClick={() => { if (onClose) onClose() }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${activeDash ? 'bg-white/15 text-white font-medium shadow-sm' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/affiliate-programs"
            onClick={() => { if (onClose) onClose() }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${location.pathname === '/affiliate-programs' ? 'bg-white/15 text-white font-medium shadow-sm' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
          >
            <Package size={18} />
            <span>Program Saya</span>
          </Link>
          <Link
            to="/affiliate-dashboard?tab=pendaftar"
            onClick={() => { if (onClose) onClose() }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${activePendaftar ? 'bg-white/15 text-white font-medium shadow-sm' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
          >
            <Table size={18} />
            <span>Data Pendaftar</span>
          </Link>
          <Link
            to="/affiliate-profile"
            onClick={() => { if (onClose) onClose() }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${activeProfile ? 'bg-white/15 text-white font-medium shadow-sm' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
          >
            <User size={18} />
            <span>Profil Saya</span>
          </Link>
        </nav>

        <div className="border-t border-white/10 px-3 py-3 bg-white/5">
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
