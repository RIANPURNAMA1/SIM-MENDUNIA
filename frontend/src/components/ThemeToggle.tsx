import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

interface ThemeToggleProps {
  floating?: boolean
  className?: string
}

export default function ThemeToggle({ floating = false, className = '' }: ThemeToggleProps) {
  const { isDark, toggle } = useTheme()
  const label = isDark ? 'Mode terang' : 'Mode gelap'

  if (floating) {
    return (
      <button
        onClick={toggle}
        aria-label={label}
        title={label}
        className={`fixed bottom-5 right-5 z-[60] flex h-11 w-11 items-center justify-center rounded-full bg-[#0E6187] text-white shadow-lg transition hover:opacity-90 ${className}`}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      aria-label={label}
      title={label}
      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}
