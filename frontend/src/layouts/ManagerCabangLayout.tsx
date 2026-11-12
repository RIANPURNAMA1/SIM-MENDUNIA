import { useState } from 'react'
import ManagerCabangSidebar from '../components/ManagerCabangSidebar'
import Header from '../components/Header'

interface ManagerCabangLayoutProps {
  children: React.ReactNode
}

export default function ManagerCabangLayout({ children }: ManagerCabangLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <ManagerCabangSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64 transition-all duration-300">
        <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <main>
          {children}
        </main>
      </div>
    </div>
  )
}
