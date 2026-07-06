import { useEffect, useState } from 'react'
import { Users, Search, Plus, RotateCcw, Eye, Edit3, Trash2, CheckCircle, X } from 'lucide-react'
import { pendaftarApi } from '../../services/api'

interface Kandidat {
  id: number
  nama: string
  email: string
  telepon: string
  posisi: string
  status: 'Pending' | 'Disetujui' | 'Ditolak'
  tanggalDaftar: string
  user_id: number | null
}

interface BatchGroup {
  id: number
  nama: string
  jumlahKandidat: number
  kandidat: Kandidat[]
}

export default function DataKandidat() {
  const [batches, setBatches] = useState<BatchGroup[]>([])
  const [totalBatch, setTotalBatch] = useState(0)
  const [totalKandidat, setTotalKandidat] = useState(0)
  const [kandidatAktif, setKandidatAktif] = useState(0)
  const [expandedBatch, setExpandedBatch] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  function fetchData(s?: string) {
    setLoading(true)
    const params = s ? { search: s } : undefined
    pendaftarApi.kandidat(params)
      .then(res => {
        setBatches(res.data.batches)
        setTotalBatch(res.data.totalBatch)
        setTotalKandidat(res.data.totalKandidat)
        setKandidatAktif(res.data.kandidatAktif)
        if (res.data.batches.length > 0) setExpandedBatch(res.data.batches[0].id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setSearch(val)
    if (val.length >= 2 || val.length === 0) fetchData(val)
  }

  function resetFilter() {
    setSearch('')
    fetchData()
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { dot: string; label: string }> = {
      Disetujui: { dot: 'bg-emerald-500', label: 'Disetujui' },
      Ditolak: { dot: 'bg-red-500', label: 'Ditolak' },
      Pending: { dot: 'bg-amber-500', label: 'Pending' },
    }
    const s = map[status] || { dot: 'bg-slate-300', label: status }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
        {s.label}
      </span>
    )
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] text-white border border-blue-100">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Data Kandidat</h1>
            <p className="text-sm text-slate-500">Kelola data kandidat per batch</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1">
            <Plus size={16} />
            Tambah Kandidat
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, email, atau program..."
              value={search}
              onChange={handleSearch}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => fetchData(search)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1"
          >
            <Search size={16} />
            Filter
          </button>
          <button
            onClick={resetFilter}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Batch Accordion */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0D1F3C] animate-spin" />
              <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
            </div>
          </div>
        ) : (
          batches.map((batch) => (
            <div key={batch.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              {/* Batch Header */}
              <button
                onClick={() => setExpandedBatch(expandedBatch === batch.id ? null : batch.id)}
                className="flex w-full items-center justify-between px-5 py-4 transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${batch.id === 0 ? 'bg-slate-100' : 'bg-blue-100'}`}>
                    <span className={`text-sm font-bold ${batch.id === 0 ? 'text-slate-500' : 'text-blue-600'}`}>
                      {batch.id === 0 ? '-' : batch.id}
                    </span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-slate-800">{batch.nama}</h3>
                    <p className="text-xs text-slate-500">{batch.jumlahKandidat} kandidat</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {batch.kandidat.length}
                  </span>
                  <span className={`transition ${expandedBatch === batch.id ? 'rotate-180' : ''}`}>▼</span>
                </div>
              </button>

              {/* Table */}
              {expandedBatch === batch.id && (
                <div className="border-t border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-full border-collapse text-left text-sm text-slate-700">
                      <thead className="text-sm text-slate-600">
                        <tr>
                          <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Kandidat</th>
                          <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Email</th>
                          <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Telepon</th>
                          <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Program</th>
                          <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Status</th>
                          <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Tanggal Daftar</th>
                          <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batch.kandidat.length > 0 ? (
                          batch.kandidat.map((k) => (
                            <tr key={k.id} className="bg-white transition hover:bg-slate-50">
                              <td className="border border-slate-200 px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(k.nama)}&background=e5e7eb&color=6b7280&size=28`}
                                    className="h-8 w-8 rounded-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                  />
                                  <div className="text-sm font-semibold text-slate-800">{k.nama}</div>
                                </div>
                              </td>
                              <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">{k.email}</td>
                              <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">{k.telepon || '-'}</td>
                              <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">{k.posisi}</td>
                              <td className="border border-slate-200 px-4 py-3 text-center">{statusBadge(k.status)}</td>
                              <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">{k.tanggalDaftar}</td>
                              <td className="border border-slate-200 px-4 py-3 text-center">
                                <div className="flex justify-center gap-1.5">
                                  <button className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600" title="Detail">
                                    <Eye size={15} />
                                  </button>
                                  <button className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600" title="Edit">
                                    <Edit3 size={15} />
                                  </button>
                                  <button className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600" title="Hapus">
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="border border-slate-200 px-6 py-10 text-center">
                              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                <Users size={24} />
                              </div>
                              <p className="mt-3 text-sm font-medium text-slate-600">Tidak ada kandidat</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Batch</p>
          <p className="text-3xl font-bold text-slate-800">{totalBatch}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Kandidat</p>
          <p className="text-3xl font-bold text-slate-800">{totalKandidat}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Kandidat Aktif</p>
          <p className="text-3xl font-bold text-slate-800">{kandidatAktif}</p>
        </div>
      </div>
    </div>
  )
}
