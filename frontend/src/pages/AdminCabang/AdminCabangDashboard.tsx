import { useState, useEffect } from 'react'
import { LayoutDashboard, Users, DollarSign, Clock, CheckCircle, AlertCircle, Layers } from 'lucide-react'
import { adminCabangApi } from '../../services/api'

function fmt(n: number) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

interface DashboardData {
  user: { name: string; email: string; role: string }
  branches: number[]
  stats: {
    total_pendaftar: number
    pendaftar_disetujui: number
    pendaftar_pending: number
    total_tagihan: number
    total_terkumpul: number
    total_outstanding: number
  }
  batches: {
    id: number
    nama_batch: string
    siswas_count: number
  }[]
}

export default function AdminCabangDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminCabangApi.dashboard()
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="px-6 py-8 flex items-center justify-center min-h-[50vh]">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0D1F3C] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] border border-blue-100">
          <LayoutDashboard size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Dashboard Admin Cabang</h1>
          <p className="text-sm text-slate-500">Selamat datang, {data.user.name}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Pendaftar</p>
              <p className="text-xl font-bold text-slate-800">{data.stats.total_pendaftar}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <CheckCircle size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-600">Disetujui</p>
              <p className="text-xl font-bold text-emerald-700">{data.stats.pendaftar_disetujui}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Clock size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-amber-600">Pending</p>
              <p className="text-xl font-bold text-amber-700">{data.stats.pendaftar_pending}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
              <AlertCircle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-red-600">Outstanding</p>
              <p className="text-xl font-bold text-red-700">Rp {fmt(data.stats.total_outstanding)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={18} className="text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-800">Rekap Keuangan</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Total Tagihan</span>
              <span className="text-sm font-bold text-slate-800">Rp {fmt(data.stats.total_tagihan)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-emerald-600">Terkumpul</span>
              <span className="text-sm font-bold text-emerald-700">Rp {fmt(data.stats.total_terkumpul)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-red-600">Outstanding</span>
              <span className="text-sm font-bold text-red-600">Rp {fmt(data.stats.total_outstanding)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Layers size={18} className="text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-800">Batch Aktif</h3>
          </div>
          {data.batches.length === 0 ? (
            <p className="text-xs text-slate-400">Tidak ada batch</p>
          ) : (
            <div className="space-y-2">
              {data.batches.slice(0, 5).map(b => (
                <div key={b.id} className="flex justify-between items-center">
                  <span className="text-xs text-slate-600">{b.nama_batch}</span>
                  <span className="text-xs font-medium text-slate-500">{b.siswas_count} siswa</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
