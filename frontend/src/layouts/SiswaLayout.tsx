import { Outlet } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'

export default function SiswaLayout() {
  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <main>
        <Outlet />
      </main>
      <ThemeToggle floating />
    </div>
  )
}
