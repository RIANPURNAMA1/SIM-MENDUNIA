import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { adminCabangApi } from '../services/api'
import {
  LayoutDashboard, UserPlus, ClipboardList, FileText, Layers,
  ChevronDown, LogOut, X, Receipt, MapPin, Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NavChildItem {
  label: string
  icon: string
  href: string
}

interface NavGroup {
  label: string
  icon: string
  children: NavChildItem[]
}

type NavItem = NavChildItem | NavGroup

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard, UserPlus, ClipboardList, FileText, Layers,
  ChevronDown, LogOut, X, Receipt, MapPin, Wallet,
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    href: '/admin-cabang',
  },
  {
    label: 'Manajemen Kandidat',
    icon: 'UserPlus',
    children: [
      { label: 'Data Kandidat', icon: 'UserPlus', href: '/admin-cabang/kandidat' },
      { label: 'Pendaftaran', icon: 'ClipboardList', href: '/admin-cabang/pendaftar' },
      { label: 'Tagihan', icon: 'FileText', href: '/admin-cabang/tagihan' },
      { label: 'Rekap Per Batch', icon: 'Layers', href: '/admin-cabang/rekap-per-batch' },
    ],
  },
  {
    label: 'Keuangan',
    icon: 'Wallet',
    children: [
      { label: 'Kategori Pengeluaran', icon: 'FileText', href: '/admin-cabang/kategori-pengeluaran' },
      { label: 'Data Pengeluaran', icon: 'Wallet', href: '/admin-cabang/pengeluaran' },
    ],
  },
]

export default function AdminCabangSidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()
  const path = location.pathname
  const { user, logout } = useAuth()

  const [pendingCount, setPendingCount] = useState(0)
  const [tagihanCount, setTagihanCount] = useState(0)

  useEffect(() => {
    const fetchPending = () => {
      adminCabangApi.pendingCount().then(res => {
        setPendingCount(res.data.count)
        setTagihanCount(res.data.tagihan ?? 0)
      }).catch(() => {})
    }
    fetchPending()
    const interval = setInterval(fetchPending, 30000)
    return () => clearInterval(interval)
  }, [])

  const isActive = (href: string) => {
    if (href === '/admin-cabang') return path === '/admin-cabang'
    return path.startsWith(href)
  }

  const isGroupActive = (group: NavGroup) =>
    group.children.some((child) => isActive(child.href))

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    navItems.forEach((item) => {
      if ('children' in item && isGroupActive(item as NavGroup)) {
        initial[item.label] = true
      }
    })
    return initial
  })

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const handleNavClick = () => {
    if (onClose) onClose()
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        w-64 bg-[#0E6187] h-screen flex flex-col fixed left-0 top-0 z-40
        transition-transform duration-300 ease-in-out shadow-[8px_0_30px_rgba(0,0,0,0.15)]
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <img src="/logo-sm.png" alt="SIM Mendunia" className="h-8 w-auto" />
            <div className="leading-tight">
              <p className="text-[10px] text-gray-400 tracking-wide">Admin Cabang</p>
              <p className="font-semibold text-white text-sm tracking-wide">SIM Mendunia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
          {navItems.map((item) => {
            const hasChildren = 'children' in item && item.children.length > 0
            const isOpen = openGroups[item.label]

            const Icon = iconMap[item.icon]
            if (!hasChildren) {
              const child = item as NavChildItem
              const active = isActive(child.href)
              return (
                <Link
                  key={item.label}
                  to={child.href}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${active ? 'bg-white/15 text-white font-medium shadow-sm' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              )
            }

            const group = item as NavGroup
            const groupActive = isGroupActive(group)
            return (
              <div key={group.label}>
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${isOpen || groupActive ? 'text-white bg-white/10 shadow-sm' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} />
                    <span>{group.label}</span>
                  </div>
                  <ChevronDown size={14} className={`transition-transform ${isOpen || groupActive ? 'rotate-180' : ''}`} />
                </button>
                {(isOpen || groupActive) && (
                  <div className="ml-4 mr-1 mt-1 space-y-1 border-l border-white/10 pl-3 py-1">
                    {group.children.map((child) => {
                      const ChildIcon = iconMap[child.icon]
                      const active = isActive(child.href)
                      return (
                        <Link
                          key={child.label}
                          to={child.href}
                          onClick={handleNavClick}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${active ? 'bg-white/15 text-white font-medium' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                        >
                          <ChildIcon size={14} />
                          <span>{child.label}</span>
                          {child.label === 'Pendaftaran' && pendingCount > 0 && (
                            <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                              {pendingCount > 99 ? '99+' : pendingCount}
                            </span>
                          )}
                          {child.label === 'Tagihan' && tagihanCount > 0 && (
                            <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                              {tagihanCount > 99 ? '99+' : tagihanCount}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="border-t border-white/10 px-3 py-3 bg-white/5">
          <button
            onClick={() => { logout() }}
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
