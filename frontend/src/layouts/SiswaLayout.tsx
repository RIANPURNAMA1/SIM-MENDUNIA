import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import SiswaSidebar from '../components/SiswaSidebar'

export default function SiswaLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <SiswaSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64 transition-all duration-300">
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
