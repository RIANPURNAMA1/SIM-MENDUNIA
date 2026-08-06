import ThemeToggle from '../components/ThemeToggle'

export default function GuruLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content">
      {children}
      <ThemeToggle floating />
    </main>
  )
}
