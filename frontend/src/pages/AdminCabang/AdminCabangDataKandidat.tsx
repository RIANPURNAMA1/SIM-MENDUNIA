import { useState, useEffect } from 'react'
import { UserPlus, Search, Users, CheckCircle, Clock, XCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { adminCabangApi } from '../../services/api'

interface Kandidat {
  id: number
  nama: string
  email: string
  telepon: string | null
  posisi: string
  status: string
  tanggalDaftar: string
  user_id: number | null
}

interface BatchGroup {
  id: number
  nama: string
  jumlahKandidat: number
  kandidat: Kandidat[]
}

export default function AdminCabangDataKandidat() {
  const [batches, setBatches] = useState<BatchGroup[]>([])
  const [totalKandidat, setTotalKandidat] = useState(0)
  const [kandidatAktif, setKandidatAktif] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [expandedBatches, setExpandedBatches] = useState<Record<number, boolean>>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = () => {
    setLoading(true)
    adminCabangApi.kandidat({ search: search || undefined })
      .then(res => {
        setBatches(res.data.batches || [])
        setTotalKandidat(res.data.totalKandidat || 0)
        setKandidatAktif(res.data.kandidatAktif || 0)

        const expanded: Record<number, boolean> = {}
        ;(res.data.batches || []).forEach((b: BatchGroup) => {
          expanded[b.id] = true
        })
        setExpandedBatches(expanded)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 300)
    return () => clearTimeout(timer)
  }, [search])

  const toggleBatch = (id: number) => {
    setExpandedBatches(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
      Pending: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
      Disetujui: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle },
      Ditolak: { bg: 'bg-red-50', text: 'text-red-600', icon: XCircle },
    }
    const s = map[status] || { bg: 'bg-slate-50', text: 'text-slate-600', icon: Clock }
    const Icon = s.icon
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.bg} ${s.text}`}>
        <Icon size={10} />
        {status}
      </span>
    )
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] border border-blue-100">
            <UserPlus size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Data Kandidat</h1>
            <p className="text-sm text-slate-500">Kandidat di cabang Anda</p>
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Kandidat</p>
          <p className="text-xl font-bold text-slate-800">{totalKandidat}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-emerald-600">Kandidat Aktif</p>
          <p className="text-xl font-bold text-emerald-700">{kandidatAktif}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Batch</p>
          <p className="text-xl font-bold text-slate-800">{batches.length}</p>
        </div>
      </div>

      <div className="mb-4 rounded-lg p-4 shadow-sm">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kandidat..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : batches.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Users size={24} />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-600">Tidak ada kandidat ditemukan</p>
        </div>
      ) : (
        <div className="space-y-2">
          {batches.map(batch => (
            <div key={batch.id} className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
              <button
                onClick={() => toggleBatch(batch.id)}
                className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  {expandedBatches[batch.id] ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{batch.nama}</p>
                    <p className="text-xs text-slate-500">{batch.jumlahKandidat} kandidat</p>
                  </div>
                </div>
              </button>

              {expandedBatches[batch.id] && (
                <div className="border-t border-slate-100">
                  <table className="w-full text-left text-sm">
                    <thead className="text-[10px] text-slate-500 uppercase bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 font-semibold">Nama</th>
                        <th className="px-4 py-2 font-semibold">Email</th>
                        <th className="px-4 py-2 font-semibold">Program</th>
                        <th className="px-4 py-2 font-semibold">Tanggal Daftar</th>
                        <th className="px-4 py-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batch.kandidat.map(k => (
                        <tr key={k.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(k.nama)}&background=e5e7eb&color=6b7280&size=24`}
                                className="h-6 w-6 rounded-full"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                              />
                              <span className="text-xs font-medium text-slate-800">{k.nama}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-xs text-slate-500">{k.email}</td>
                          <td className="px-4 py-2 text-xs text-slate-600">{k.posisi}</td>
                          <td className="px-4 py-2 text-xs text-slate-500">{k.tanggalDaftar}</td>
                          <td className="px-4 py-2">{statusBadge(k.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
