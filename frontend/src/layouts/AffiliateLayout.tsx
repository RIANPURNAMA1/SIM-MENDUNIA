import { useState } from 'react'
import AffiliateSidebar from '../components/AffiliateSidebar'

interface AffiliateLayoutProps {
  children: React.ReactNode
}

export default function AffiliateLayout({ children }: AffiliateLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <AffiliateSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64 transition-all duration-300">
        <main>
          {children}
        </main>
      </div>
    </div>
  )
}
