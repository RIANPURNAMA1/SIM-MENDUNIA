import { useState } from 'react'
import AdminCabangSidebar from '../components/AdminCabangSidebar'
import Header from '../components/Header'

interface AdminCabangLayoutProps {
  children: React.ReactNode
}

export default function AdminCabangLayout({ children }: AdminCabangLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminCabangSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64 transition-all duration-300">
        <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <main>
          {children}
        </main>
      </div>
    </div>
  )
}
