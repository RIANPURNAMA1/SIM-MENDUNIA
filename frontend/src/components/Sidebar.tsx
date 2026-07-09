import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import {
  LayoutDashboard, Users, Building2, MapPin, Timer, CalendarPlus, List,
  CalendarCheck, ClipboardList, FileText, Clock, Calendar, BarChart3,
  BookOpen, GraduationCap, Layers, Notebook, Bot, Settings, UserCog,
  MessageCircle, ChevronDown, LogOut, X, Presentation, UserPlus,
  Search, Briefcase, Zap, CreditCard, Handshake, Package, Tag, ListOrdered,
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
  LayoutDashboard, Users, Building2, MapPin, Timer, CalendarPlus, List,
  CalendarCheck, ClipboardList, FileText, Clock, Calendar, BarChart3,
  BookOpen, GraduationCap, Layers, Notebook, Bot, Settings, UserCog,
  MessageCircle, Presentation, UserPlus, Search, Briefcase, Zap, CreditCard, Handshake, Package, Tag, ListOrdered,
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    href: '/',
  },
  {
    label: 'Manajemen Kandidat',
    icon: 'UserPlus',
    children: [
      { label: 'Data Kandidat', icon: 'UserPlus', href: '/data-kandidat' },
      { label: 'Pendaftaran', icon: 'ClipboardList', href: '/pendaftar' },
      { label: 'Tagihan', icon: 'FileText', href: '/tagihan' },
      { label: 'Rekap Per Batch', icon: 'Layers', href: '/rekap-per-batch' },
      { label: 'Pembayaran', icon: 'CreditCard', href: '/pembayaran' },
      { label: 'Kategori Bayar', icon: 'ListOrdered', href: '/data-biaya-kategori' },
    ],
  },
  {
    label: 'Matching Job',
    icon: 'Search',
    children: [
      { label: 'Kandidat Matching Job', icon: 'UserPlus', href: '/data-matching-job' },
    ],
  },
  {
    label: 'Program & Affiliate',
    icon: 'Handshake',
    children: [
      { label: 'Affiliate Dashboard', icon: 'LayoutDashboard', href: '/affiliate-dashboard' },
      { label: 'Data Affiliate', icon: 'Handshake', href: '/data-affiliate' },
      { label: 'Program', icon: 'Package', href: '/data-product' },
      { label: 'Data Coupon', icon: 'CreditCard', href: '/data-coupon' },
    ],
  },
  {
    label: 'Akademik',
    icon: 'BookOpen',
    children: [
      { label: 'Data Guru', icon: 'Presentation', href: '/guru' },
      { label: 'Kelas Sensei', icon: 'BookOpen', href: '/kelas-sensei' },
      { label: 'Jadwal Level', icon: 'Calendar', href: '/jadwal-level' },
      { label: 'Data Siswa', icon: 'Users', href: '/siswa' },
      { label: 'Batch', icon: 'Layers', href: '/batches' },
      { label: 'Rekap Siswa', icon: 'BarChart3', href: '/rekap-siswa' },
      { label: 'Penilaian Siswa', icon: 'Notebook', href: '/penilaian' },
      { label: 'LMS', icon: 'BookOpen', href: '/lms' },
    ],
  },
  {

    
    label: 'Manajemen Absensi',
    icon: 'CalendarCheck',
    children: [
      { label: 'Kehadiran', icon: 'ClipboardList', href: '/data-kehadiran' },
      { label: 'Kehadiran Khusus', icon: 'Timer', href: '/data-kehadiran-khusus' },
      { label: 'Izin & Cuti', icon: 'FileText', href: '/izin-cuti' },
      { label: 'Approval Lembur', icon: 'Clock', href: '/approval-lembur' },
      { label: 'Hari Libur', icon: 'FileText', href: '/hari-libur' },
      { label: 'Rekap Absensi', icon: 'BarChart3', href: '/rekap-absensi' },
      { label: 'Rekap Jadwal Shift', icon: 'CalendarCheck', href: '/rekap-jadwal-shift' },
      { label: 'Monitoring Lokasi', icon: 'MapPin', href: '/monitoring-lokasi' },
      { label: 'Data Agenda', icon: 'Calendar', href: '/data-agenda' },
      { label: 'Kehadiran Sensei', icon: 'ClipboardList', href: '/data-kehadiran-sensei' },
      { label: 'Rekap Kehadiran Sensei', icon: 'BarChart3', href: '/rekap-kehadiran-sensei' },
      { label: 'Absensi Siswa', icon: 'ClipboardList', href: '/absensi-siswa' },
    ],
  },
  {
    label: 'HR & Operasional',
    icon: 'Briefcase',
    children: [
      { label: 'Data Karyawan', icon: 'Users', href: '/karyawan' },
      { label: 'Divisi', icon: 'Building2', href: '/divisi' },
      { label: 'Cabang / Lokasi', icon: 'MapPin', href: '/cabang' },
      { label: 'Shift Kerja', icon: 'Timer', href: '/shift' },
      { label: 'Jadwal Shift', icon: 'CalendarPlus', href: '/jadwal-shift' },
      { label: 'Daftar User', icon: 'List', href: '/daftar-user' },
      { label: 'Pengaturan Shift', icon: 'Settings', href: '/pengaturan-shift' },
      { label: 'Manajemen Akun', icon: 'UserCog', href: '/pengaturan' },
      { label: 'Profil Perusahaan', icon: 'Building2', href: '/pengaturan-perusahaan' },
    ],
  },
  {
    label: 'AI & Automasi',
    icon: 'Zap',
    children: [
      { label: 'AI Chat', icon: 'Bot', href: '/ai-chat' },
      { label: 'Notifikasi WA', icon: 'MessageCircle', href: '/pengaturan-wa' },
    ],
  },
]

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()
  const path = location.pathname
  const { user, logout } = useAuth()

  const isRestricted = user?.role === 'KANDIDAT' || user?.role === 'AFFILIATE'

  const filteredNavItems = isRestricted ? [] : navItems.map(item => {
    if (item.label === 'Program & Affiliate' && 'children' in item) {
      const group = item as NavGroup
      return {
        ...group,
        children: group.children.filter(child =>
          !(child.label === 'Affiliate Dashboard' && (user?.role === 'HR' || user?.role === 'MANAGER'))
        ),
      }
    }
    return item
  })

  const [pendingCount, setPendingCount] = useState(0)
const [tagihanCount, setTagihanCount] = useState(0)

  useEffect(() => {
    if (isRestricted) return
    const fetchPending = () => {
      api.get('/pendaftar/pending-count').then(res => {
        setPendingCount(res.data.count)
        setTagihanCount(res.data.tagihan ?? 0)
      }).catch(() => {})
    }
    fetchPending()
    const interval = setInterval(fetchPending, 30000)
    return () => clearInterval(interval)
  }, [isRestricted])

  const isActive = (href: string) => {
    if (href === '/') return path === '/'
    return path.startsWith(href)
  }

  const isGroupActive = (group: NavGroup) =>
    group.children.some((child) => isActive(child.href))

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    filteredNavItems.forEach((item) => {
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
        w-64 bg-[#0D1F3C] h-screen flex flex-col fixed left-0 top-0 z-40
        transition-transform duration-300 ease-in-out shadow-[8px_0_30px_rgba(0,0,0,0.15)]
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <img src="/logo-sm.png" alt="SIM Mendunia" className="h-8 w-auto" />
            <div className="leading-tight">
              <p className="text-[10px] text-gray-400 tracking-wide">Sistem Informasi</p>
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
          {filteredNavItems.map((item) => {
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