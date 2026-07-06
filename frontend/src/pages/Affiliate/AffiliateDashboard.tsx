import { useState, useEffect } from 'react'
import { Link2, Eye, Users, CheckCircle, Clock, DollarSign, Copy, CheckCircle as CheckIcon, Wallet, Banknote } from 'lucide-react'
import { affiliateDashboardApi } from '../../services/api'

interface DashboardData {
  stats: {
    total_links: number
    total_views: number
    total_pendaftar: number
    pending: number
    disetujui: number
    komisi_pending: number
    komisi_paid: number
  }
  links: {
    id: number
    kode: string
    nama_link: string | null
    views: number
    pendaftar_count: number
    product: { nama: string; harga: number }
  }[]
  pendaftar: {
    id: number
    nama: string
    email: string
    nominal: number
    status_pendaftaran: string
    status_pembayaran: string
    created_at: string
    product: { nama: string }
  }[]
}

export default function AffiliateDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [copied, setCopied] = useState<number | null>(null)

  useEffect(() => {
    affiliateDashboardApi.index().then(res => setData(res.data))
  }, [])

  function copyLink(kode: string, id: number) {
    navigator.clipboard.writeText(`http://localhost:5173/daftar/${kode}`)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    )
  }

  const { stats, links, pendaftar } = data

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] text-white border border-blue-100">
            <Link2 size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Dashboard Affiliate</h1>
            <p className="text-sm text-slate-500">Pantau performa link affiliate Anda</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Link', value: stats.total_links, icon: Link2, color: 'text-blue-600 bg-blue-50' },
          { label: 'Total Views', value: stats.total_views, icon: Eye, color: 'text-purple-600 bg-purple-50' },
          { label: 'Total Pendaftar', value: stats.total_pendaftar, icon: Users, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600 bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2.5 ${s.color}`}>
                <s.icon size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">{s.label}</p>
                <p className="text-xl font-bold text-slate-800">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Komisi */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          { label: 'Komisi Pending', value: stats.komisi_pending, icon: Wallet, color: 'text-amber-600 bg-amber-50' },
          { label: 'Komisi Dibayar', value: stats.komisi_paid, icon: Banknote, color: 'text-green-600 bg-green-50' },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2.5 ${s.color}`}>
                <s.icon size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">{s.label}</p>
                <p className="text-xl font-bold text-slate-800">Rp {Number(s.value).toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Links + Pendaftar */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-slate-800">Link Saya</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {links.map(link => (
              <div key={link.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{link.nama_link || link.kode}</p>
                  <p className="text-xs text-slate-400">{link.product?.nama} - Rp {Number(link.product?.harga || 0).toLocaleString('id-ID')}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Eye size={12} /> {link.views}</span>
                    <span className="flex items-center gap-1"><Users size={12} /> {link.pendaftar_count}</span>
                  </div>
                </div>
                <button onClick={() => copyLink(link.kode, link.id)}
                  className="shrink-0 flex items-center gap-1 rounded-lg p-2 text-xs font-medium text-blue-600 transition hover:bg-blue-50">
                  {copied === link.id ? <><CheckIcon size={14} className="text-emerald-500" /> Tersalin</> : <><Copy size={14} /> Salin</>}
                </button>
              </div>
            ))}
            {links.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-slate-400">Belum ada link</div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-slate-800">Pendaftar Terbaru</h2>
          </div>
          <div className="max-h-[400px] divide-y divide-slate-100 overflow-y-auto">
            {pendaftar.map(p => (
              <div key={p.id} className="px-5 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{p.nama}</p>
                    <p className="text-xs text-slate-400">{p.product?.nama}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    p.status_pendaftaran === 'disetujui' ? 'bg-emerald-100 text-emerald-700' :
                    p.status_pendaftaran === 'ditolak' ? 'bg-red-100 text-red-600' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {p.status_pendaftaran}
                  </span>
                </div>
                {p.nominal > 0 && (
                  <p className="mt-1 text-xs text-slate-500">Rp {Number(p.nominal).toLocaleString('id-ID')}</p>
                )}
              </div>
            ))}
            {pendaftar.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-slate-400">Belum ada pendaftar</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
