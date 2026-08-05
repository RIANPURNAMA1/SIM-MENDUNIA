import { Outlet } from 'react-router-dom'

export default function SiswaLayout() {
  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <main>
        <Outlet />
      </main>
    </div>
  )
}
