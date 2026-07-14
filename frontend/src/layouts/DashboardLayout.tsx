import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64 transition-all duration-300">
        <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
