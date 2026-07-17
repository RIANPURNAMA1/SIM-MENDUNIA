import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, User, CalendarCheck, CreditCard, BookOpen, Award, LogOut, Lock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

interface SiswaSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const menu = [
  { to: '/siswa-dashboard', icon: LayoutDashboard, label: 'Dashboard', locked: false },
  { to: '/siswa-dashboard/data-diri', icon: User, label: 'Data Diri', locked: false },
  { to: '/siswa-dashboard/pembayaran', icon: CreditCard, label: 'Pembayaran', locked: false },
  { to: '/siswa-dashboard/absensi', icon: CalendarCheck, label: 'Absensi', locked: true },
  { to: '/siswa-dashboard/lms', icon: BookOpen, label: 'LMS', locked: true },
  { to: '/siswa-dashboard/nilai', icon: Award, label: 'Nilai', locked: true },
]

export default function SiswaSidebar({ isOpen, onClose }: SiswaSidebarProps) {
  const location = useLocation()
  const { logout } = useAuth()
  const [hasClass, setHasClass] = useState<boolean | null>(null)

  useEffect(() => {
    api.get('/siswa-dashboard').then(res => {
      setHasClass(res.data.has_class)
    }).catch(() => {
      setHasClass(false)
    })
  }, [])

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
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10 bg-white/5">
          <img src="/logo-sm.png" alt="SIM Mendunia" className="h-8 w-auto" />
          <div className="leading-tight">
            <p className="text-[10px] text-gray-400 tracking-wide">Sistem Informasi</p>
            <p className="font-semibold text-white text-sm tracking-wide">SIM Mendunia</p>
          </div>
        </div>

        <nav className="flex-1 px-2.5 py-3 space-y-0.5">
          {menu.map(item => {
            const active = location.pathname === item.to
            const isLocked = item.locked && hasClass === false

            if (isLocked) {
              return (
                <div
                  key={item.to}
                  className="relative group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 cursor-not-allowed select-none"
                >
                  <Lock size={18} />
                  <span>{item.label}</span>
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2.5 py-1 bg-gray-800 text-white text-[11px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg pointer-events-none z-50">
                    Belum ada kelas
                    <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-gray-800" />
                  </div>
                </div>
              )
            }

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
