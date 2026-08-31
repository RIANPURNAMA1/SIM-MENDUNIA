import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ExternalLink, ChevronLeft, ArrowUpRight, ShieldCheck, KeyRound, Loader,
  LayoutDashboard, BookOpen, CalendarCheck, Wallet, User,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import api, { MIRAIGO_URL } from '../../services/api'

export default function MiraigoAccess() {
  const location = useLocation()
  const { user } = useAuth()
  const [loadingSSO, setLoadingSSO] = useState(false)
  const [errorSSO, setErrorSSO] = useState('')

  async function openMiraigo() {
    setErrorSSO('')
    setLoadingSSO(true)
    try {
      const res = await api.post('/miraigo/sso')
      const redirectUrl = res.data?.redirect_url || MIRAIGO_URL
      window.open(redirectUrl, '_blank', 'noopener,noreferrer')
    } catch {
      setErrorSSO('Gagal membuat sesi login ke Miraigo. Silakan coba lagi.')
      window.open(MIRAIGO_URL, '_blank', 'noopener,noreferrer')
    } finally {
      setLoadingSSO(false)
    }
  }

  const bottomNav = [
    { label: 'Dashboard', to: '/siswa-dashboard', icon: LayoutDashboard },
    { label: 'LMS', to: '/siswa-dashboard/lms', icon: BookOpen },
    { label: 'Absensi', to: '/siswa-dashboard/absensi', icon: CalendarCheck },
    { label: 'Pembayaran', to: '/siswa-dashboard/pembayaran', icon: Wallet },
    { label: 'Profil', to: '/siswa-dashboard/profil', icon: User },
  ]

  return (
    <div className="min-h-screen bg-[#f0f2f5] pb-24 lg:pb-8">
      {/* ============ Top App Bar ============ */}
      <header className="bg-[#0E6187] px-4 pb-6 pt-5 text-white">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between">
            <Link
              to="/siswa-dashboard"
              aria-label="Kembali ke dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
            >
              <ChevronLeft size={18} />
            </Link>
            <div className="flex items-center gap-2">
              <img src="/logo-sm1.png" alt="Kelas Mendunia" className="h-8 w-auto" />
            </div>
            <div className="w-9" />
          </div>
          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <ExternalLink size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Akses Miraigo</h1>
              <p className="mt-0.5 text-[13px] text-teal-100">Terhubung ke sistem Miraigo</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto -mt-4 max-w-lg space-y-4 px-4">
        {/* ============ Buka Sistem ============ */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm animate-fade-up">
          <div className="bg-gradient-to-br from-[#0E6187] to-[#0a4d6e] p-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
              <ExternalLink size={26} className="text-white" />
            </div>
            <h2 className="mt-3 text-lg font-bold text-white">Sistem Miraigo</h2>
            <p className="mt-1 text-[12px] text-teal-100">
              Data kandidat Anda juga tersinkron di sistem Miraigo. Klik tombol di bawah untuk membukanya.
            </p>
          </div>
          <div className="p-5">
            <button
              onClick={openMiraigo}
              disabled={loadingSSO}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0E6187] px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#0a4d6e] hover:shadow active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
            >
              {loadingSSO ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Menyiapkan sesi login...
                </>
              ) : (
                <>
                  Buka Sistem Miraigo
                  <ArrowUpRight size={17} />
                </>
              )}
            </button>
            {errorSSO && (
              <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-center text-[11px] text-red-600">
                {errorSSO}
              </p>
            )}
          </div>
        </div>

        {/* ============ Login Sekali ============ */}
        <div className="rounded-xl bg-white p-4 shadow-sm animate-fade-up">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <KeyRound size={18} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-800">Login Sekali (SSO)</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                Anda tidak perlu mendaftar atau login ulang di Miraigo. Akun yang sama dengan SIM Mendunia
                akan otomatis terhubung (single sign-on).
              </p>
            </div>
          </div>
        </div>

        {/* ============ Data Aman ============ */}
        <div className="rounded-xl bg-white p-4 shadow-sm animate-fade-up">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0E6187]/10 text-[#0E6187]">
              <ShieldCheck size={18} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-800">Data Kandidat Aman &amp; Terkini</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                Data yang tampil di Miraigo diambil langsung dari SIM Mendunia secara real-time
                (read-only), sehingga selalu sinkron dengan data terbaru Anda.
              </p>
            </div>
          </div>
        </div>

        {/* ============ Akun Tertaut ============ */}
        {user?.email && (
          <div className="rounded-xl bg-white p-4 shadow-sm animate-fade-up">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Akun Tertaut</h3>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0E6187]/10 text-[#0E6187]">
                <User size={18} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-800">{user.name}</p>
                <p className="truncate text-[12px] text-slate-500">{user.email}</p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Terhubung
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ============ Bottom Nav Bar ============ */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {bottomNav.map(nav => {
            const Icon = nav.icon
            const isActive = nav.to === location.pathname
            return (
              <Link
                key={nav.label}
                to={nav.to}
                className={`flex flex-col items-center gap-1 py-2.5 transition ${
                  isActive ? 'text-[#0E6187]' : 'text-slate-400'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                <span className="text-[10px] font-medium">{nav.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}