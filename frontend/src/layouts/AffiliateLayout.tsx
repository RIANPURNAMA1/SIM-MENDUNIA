import { useState } from 'react'
import { Menu } from 'lucide-react'
import AffiliateSidebar from '../components/AffiliateSidebar'

interface AffiliateLayoutProps {
  children: React.ReactNode
}

export default function AffiliateLayout({ children }: AffiliateLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <AffiliateSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile topbar with hamburger */}
      <div className="sticky top-0 z-20 flex items-center justify-between bg-white border-b border-slate-200 px-4 h-14 lg:hidden shadow-sm">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <Menu size={22} className="text-slate-700" />
        </button>
        <div className="flex items-center gap-2">
          <img src="/logo-sm.png" alt="Mendunia" className="h-7 w-auto" />
          <span className="text-sm font-bold text-[#0E6187]">SIM Mendunia</span>
        </div>
        <div className="w-10" />
      </div>

      <div className="lg:ml-64 transition-all duration-300">
        <main>
          {children}
        </main>
      </div>
    </div>
  )
}
