import { useState, useEffect } from 'react'
import { Search, RotateCcw, LogIn, Monitor, Globe, Clock, User } from 'lucide-react'
import api from '../services/api'

interface LoginLog {
  id: number
  ip_address: string
  user_agent: string
  browser: string
  platform: string
  login_at: string
  created_at: string
  user: {
    id: number
    name: string
    email: string
    role: string
  }
}

interface PaginationMeta {
  current_page: number
  last_page: number
  total: number
  per_page: number
}

export default function LogLogin() {
  const [data, setData] = useState<LoginLog[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  function fetchLogs(q: string, p: number) {
    setLoading(true)
    api.get('/login-logs', { params: { search: q, per_page: 50, page: p } })
      .then(res => {
        setData(res.data.data || [])
        setMeta({
          current_page: res.data.current_page,
          last_page: res.data.last_page,
          total: res.data.total,
          per_page: res.data.per_page,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchLogs(search, page)
  }, [page])

  function handleSearch() {
    setPage(1)
    fetchLogs(search, 1)
  }

  function handleReset() {
    setSearch('')
    setPage(1)
    fetchLogs('', 1)
  }

  const badgeRole = (role: string) => {
    const map: Record<string, string> = {
      HR: 'bg-purple-100 text-purple-700',
      MANAGER: 'bg-blue-100 text-blue-700',
      ADMIN: 'bg-slate-100 text-slate-700',
      ACCOUNTING: 'bg-emerald-100 text-emerald-700',
      KARYAWAN: 'bg-amber-100 text-amber-700',
      GURU: 'bg-cyan-100 text-cyan-700',
      KANDIDAT: 'bg-orange-100 text-orange-700',
      AFFILIATE: 'bg-pink-100 text-pink-700',
      ADMIN_CABANG: 'bg-indigo-100 text-indigo-700',
    }
    return map[role] || 'bg-slate-100 text-slate-600'
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] text-white">
            <LogIn size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Log Login</h1>
            <p className="text-sm text-slate-500">Monitor aktivitas login pengguna</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama/email/IP/browser..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button onClick={handleSearch}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0E6187] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#0a4d6e]">
            Cari
          </button>
          <button onClick={handleReset}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 w-full sm:w-auto">
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm text-slate-700">
            <thead className="bg-[#0e6187]">
              <tr>
                <th scope="col" className="border border-slate-600 px-4 py-3 font-medium text-white w-[200px]">
                  <div className="flex items-center gap-2"><User size={14} /> Pengguna</div>
                </th>
                <th scope="col" className="border border-slate-600 px-4 py-3 font-medium text-white w-[140px]">
                  <div className="flex items-center gap-2"><Globe size={14} /> IP Address</div>
                </th>
                <th scope="col" className="border border-slate-600 px-4 py-3 font-medium text-white w-[120px]">
                  <div className="flex items-center gap-2"><Monitor size={14} /> Browser</div>
                </th>
                <th scope="col" className="border border-slate-600 px-4 py-3 font-medium text-white w-[100px]">Platform</th>
                <th scope="col" className="border border-slate-600 px-4 py-3 font-medium text-white w-[170px]">
                  <div className="flex items-center gap-2"><Clock size={14} /> Waktu Login</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0E6187] border-t-transparent" />
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">Tidak ada data login</td>
                </tr>
              ) : (
                data.map((log, i) => (
                  <tr key={log.id} className={`bg-white transition hover:bg-slate-50 ${i % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                    <td className="border border-slate-200 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(log.user?.name || '?')}&background=e5e7eb&color=6b7280&size=28`}
                          className="h-8 w-8 rounded-full object-cover shrink-0"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-800 truncate">{log.user?.name}</div>
                          <div className="text-xs text-slate-500 truncate">{log.user?.email}</div>
                        </div>
                        <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeRole(log.user?.role)}`}>
                          {log.user?.role}
                        </span>
                      </div>
                    </td>
                    <td className="border border-slate-200 px-4 py-3 font-mono text-xs text-slate-600">{log.ip_address || '-'}</td>
                    <td className="border border-slate-200 px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">{log.browser || '-'}</span>
                      </div>
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">{log.platform || '-'}</td>
                    <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {log.login_at ? new Date(log.login_at).toLocaleString('id-ID', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                      }) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <span className="text-sm text-slate-500">
              Total {meta.total} data &middot; Halaman {meta.current_page} dari {meta.last_page}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none">
                &larr;
              </button>
              <span className="min-w-[32px] text-center text-sm font-medium text-slate-600">{meta.current_page}/{meta.last_page}</span>
              <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page >= meta.last_page}
                className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none">
                &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
