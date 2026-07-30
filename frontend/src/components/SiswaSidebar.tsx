import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, User, CreditCard, X, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface SiswaSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const menu = [
  { to: '/siswa-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/siswa-dashboard/data-diri', icon: User, label: 'Data Diri' },
  { to: '/siswa-dashboard/pembayaran', icon: CreditCard, label: 'Pembayaran' },
]

export default function SiswaSidebar({ isOpen, onClose }: SiswaSidebarProps) {
  const location = useLocation()
  const { logout } = useAuth()

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        w-64 bg-[#0E6187] h-[100dvh] max-h-[100dvh] flex flex-col fixed left-0 top-0 z-40 overflow-hidden
        transition-transform duration-300 ease-in-out shadow-[8px_0_30px_rgba(0,0,0,0.15)]
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="relative flex items-center justify-center px-5 py-4 border-b border-white/10 bg-white/5 flex-shrink-0">
          <img src="/logo-sm1.png" alt="SIM Mendunia" className="h-14 w-auto" />
          <button
            onClick={onClose}
            aria-label="Tutup sidebar"
            className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto px-2.5 py-3 space-y-0.5">
          {menu.map(item => {
            const active = location.pathname === item.to

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => { if (onClose) onClose() }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${active ? 'bg-white/15 text-white font-medium shadow-sm' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            )
          })}
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
