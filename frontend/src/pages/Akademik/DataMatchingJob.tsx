import { Users, Send, Eye, CheckCircle, FileText, ClipboardList, ArrowRight, Briefcase, ShieldCheck, BarChart3, Award } from 'lucide-react'
import { useState } from 'react'

const tabs = [
  { label: 'Verifikasi', icon: ShieldCheck },
  { label: 'Statistik', icon: BarChart3 },
  { label: 'Sertifikasi', icon: Award },
  { label: 'Job Order', icon: FileText },
  { label: 'Status Kandidat', icon: Users },
]

const stats = [
  { label: 'Total Kandidat', value: 365, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Terkirim', value: 28, icon: Send, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Direview', value: 0, icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Disetujui', value: 71, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
]

const quickActions = [
  {
    label: 'Formulir Draft',
    desc: '265 belum di submit',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    icon: FileText,
  },
  {
    label: 'Review Formulir Baru',
    desc: '28 menunggu review',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    icon: ClipboardList,
  },
  {
    label: 'Lihat Semua Kandidat',
    desc: 'Total 365 kandidat',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    icon: Users,
  },
]

export default function DataMatchingJob() {
  const [activeTab, setActiveTab] = useState('Verifikasi')
  const now = new Date()
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const dayName = days[now.getDay()]
  const dateStr = `${dayName}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-5 flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] text-white">
            <Briefcase size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Dashboard</h1>
            <p className="text-sm text-slate-500">Selamat datang, Admin Penempatan — {dateStr}</p>
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
        {tabs.map((t) => {
          const Icon = t.icon
          const isActive = activeTab === t.label
          return (
            <button
              key={t.label}
              onClick={() => setActiveTab(t.label)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition ${
                isActive
                  ? 'bg-[#0E6187] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{s.label}</span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.bg}`}>
                  <Icon size={16} className={s.color} />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-800">{s.value.toLocaleString('id-ID')}</div>
            </div>
          )
        })}
      </div>

      <div className="mt-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-600">Status Formulir</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {quickActions.map((a) => {
            const Icon = a.icon
            return (
              <a
                key={a.label}
                href="#"
                className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${a.bg}`}>
                  <Icon size={18} className={a.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${a.color}`}>{a.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{a.desc}</p>
                </div>
                <ArrowRight size={16} className={`shrink-0 ${a.color}`} />
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
