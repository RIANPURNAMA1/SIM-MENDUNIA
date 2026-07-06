import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import SiswaSidebar from '../components/SiswaSidebar'

export default function SiswaLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <SiswaSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile topbar with hamburger */}
      <div className="sticky top-0 z-20 flex items-center justify-between bg-white border-b border-[#dadde1] px-4 h-14 lg:hidden shadow-sm">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-[#f5f6f7] transition-colors"
        >
          <Menu size={22} className="text-[#1c1e21]" />
        </button>
        <div className="flex items-center gap-2">
          <img src="/logo-sm.png" alt="Mendunia" className="h-7 w-auto" />
          <span className="text-sm font-bold text-[#0D1F3C]">SIM Mendunia</span>
        </div>
        <div className="w-10" />
      </div>

      <div className="lg:ml-64 transition-all duration-300">
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
