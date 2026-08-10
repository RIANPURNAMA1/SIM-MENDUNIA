import { Link, useLocation } from 'react-router-dom'
import {
  ClipboardList, ChevronLeft, Check, Building2, Wrench, Clock3,
  LayoutDashboard, Wallet, CalendarCheck, BookOpen, User,
} from 'lucide-react'

const progressSteps = [
  { label: 'Pending', done: true, active: false },
  { label: 'Lamar ke Perusahaan', done: true, active: false },
  { label: 'Interview', done: false, active: true },
  { label: 'Interview Ulang', done: false, active: false },
  { label: 'Lulus Interview', done: false, active: false },
  { label: 'Pemberkasan', done: false, active: false },
  { label: 'Berangkat', done: false, active: false },
]

const statusFormulir = [
  { label: 'Nama', value: 'Quasi incididunt qui' },
  { label: 'Email', value: 'rianprnma7@gmail.com' },
  { label: 'No. HP', value: 'Sint in dolor esse' },
  { label: 'Alamat', value: 'Ipsum eveniet asper' },
  { label: 'Pendidikan', value: 'Perguruan Tinggi' },
  { label: 'Bergabung', value: '7/5/2026' },
]

const infoProses = [
  { label: 'Status Progres', value: 'Interview', icon: Clock3 },
  { label: 'Perusahaan', value: 'AA', icon: Building2 },
  { label: 'Bidang SSW', value: 'Konstruksi', icon: Wrench },
]

export default function ProgressKandidat() {
  const location = useLocation()

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
              <ClipboardList size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Progress Kandidat</h1>
              <p className="mt-0.5 text-[13px] text-teal-100">Pantau proses job matching</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto -mt-4 max-w-lg space-y-4 px-4">
        {/* ============ Job Matching ============ */}
        <div className="rounded-xl bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Job Matching</h2>
            <span className="rounded-full bg-[#0E6187]/10 px-2.5 py-1 text-[11px] font-semibold text-[#0E6187]">
              Interview
            </span>
          </div>
          <ol className="space-y-0">
            {progressSteps.map((s, i) => (
              <li key={s.label} className="relative flex items-start gap-3 pb-5 last:pb-0">
                {i < progressSteps.length - 1 && (
                  <span
                    className={`absolute left-[11px] top-6 h-[calc(100%-8px)] w-0.5 ${
                      s.done ? 'bg-emerald-400' : 'bg-slate-200'
                    }`}
                  />
                )}
                <span
                  className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    s.done
                      ? 'bg-emerald-500 text-white'
                      : s.active
                        ? 'bg-[#0E6187] text-white ring-4 ring-[#0E6187]/15'
                        : 'border border-slate-300 bg-white text-slate-400'
                  }`}
                >
                  {s.done ? <Check size={13} strokeWidth={3} /> : i + 1}
                </span>
                <div className="pt-1">
                  <p
                    className={`text-sm font-medium ${
                      s.active ? 'font-bold text-[#0E6187]' : s.done ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </p>
                  {s.active && <p className="text-[11px] text-slate-400">Proses saat ini</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* ============ Status Formulir ============ */}
        <div className="rounded-xl bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Status Formulir</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Disetujui
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {statusFormulir.map(f => (
              <div key={f.label}>
                <p className="text-[11px] font-medium text-slate-400">{f.label}</p>
                <p className="mt-0.5 text-[13px] font-medium text-slate-700">{f.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ============ Informasi Proses ============ */}
        <div className="rounded-xl bg-white p-4 shadow-sm sm:p-5">
          <h2 className="mb-3 text-sm font-bold text-slate-800">Informasi Proses</h2>
          <div className="space-y-3">
            {infoProses.map(ip => {
              const Icon = ip.icon
              return (
                <div key={ip.label} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0E6187]/10 text-[#0E6187]">
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-400">{ip.label}</p>
                    <p className="text-sm font-bold text-slate-800">{ip.value}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
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