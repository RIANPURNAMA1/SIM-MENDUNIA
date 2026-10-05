import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, RotateCcw, LogIn, Monitor, Globe, Clock, User, LayoutDashboard, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, ShieldCheck, Users, Laptop } from 'lucide-react'
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

const ROLE_STYLE: Record<string, string> = {
  HR: 'bg-[#5f6368]',
  MANAGER: 'bg-[#0E6187]',
  ADMIN: 'bg-[#202124]',
  ACCOUNTING: 'bg-[#137333]',
  KARYAWAN: 'bg-[#b06000]',
  GURU: 'bg-[#1a73e8]',
  KANDIDAT: 'bg-[#d93025]',
  AFFILIATE: 'bg-[#8430ce]',
  ADMIN_CABANG: 'bg-[#0b8043]',
}

export default function LogLogin() {
  const [data, setData] = useState<LoginLog[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const searchRef = useRef(search)
  searchRef.current = search
  const navigate = useNavigate()

  const fetchLogs = useCallback((q: string, p: number, pp: number) => {
    setLoading(true)
    api.get('/login-logs', { params: { search: q, per_page: pp, page: p } })
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
  }, [])

  useEffect(() => {
    fetchLogs(searchRef.current, page, perPage)
  }, [page, perPage, fetchLogs])

  function handleSearch() {
    setPage(1)
    fetchLogs(search, 1, perPage)
  }

  function handleReset() {
    setSearch('')
    setPage(1)
    fetchLogs('', 1, perPage)
  }

  const totalPages = Math.max(1, Math.ceil((meta?.total ?? 0) / perPage))
  const safePage = Math.min(page, totalPages)

  const stats = useMemo(() => {
    const users = new Set<number>()
    const platforms = new Set<string>()
    data.forEach(l => {
      if (l.user?.id) users.add(l.user.id)
      if (l.platform) platforms.add(l.platform)
    })
    const last = data.length > 0 ? data[0].login_at || data[0].created_at : null
    return {
      total: meta?.total ?? 0,
      users: users.size,
      platforms: platforms.size,
      last,
    }
  }, [data, meta])

  const fmtWaktu = (v: string) =>
    new Date(v).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })

  if (loading && data.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#1a73e8]/10 border-t-[#1a73e8] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-[#5f6368]" aria-label="Breadcrumb">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 transition-colors hover:text-[#1a73e8]"
        >
          <LayoutDashboard size={13} />
          <span>Beranda</span>
        </button>
        <ChevronRight size={12} className="text-[#9aa0a6]" />
        <span className="font-medium text-[#3c4043]">Log Login</span>
      </nav>

      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <LogIn size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Log Login</h1>
            <p className="text-sm text-[#5f6368]">Monitor aktivitas login pengguna</p>
          </div>
        </div>
        {stats.last && (
          <div className="flex items-center gap-2 border border-[#dadce0] bg-[#f8f9fa] px-3 py-2 text-xs text-[#5f6368]">
            <Clock size={14} />
            <span>Login terakhir: <span className="font-medium text-[#202124]">{fmtWaktu(stats.last)}</span></span>
          </div>
        )}
      </div>

      {/* Ringkasan */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {([
          { label: 'Total Log', value: stats.total.toLocaleString('id-ID'), icon: LogIn, chip: 'bg-[#0E6187]', hint: 'seluruh riwayat' },
          { label: 'Pengguna Login', value: stats.users.toLocaleString('id-ID'), icon: Users, chip: 'bg-[#1a73e8]', hint: 'pada halaman ini' },
          { label: 'Platform Terpakai', value: stats.platforms.toLocaleString('id-ID'), icon: Laptop, chip: 'bg-[#137333]', hint: 'pada halaman ini' },
        ] as const).map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="border border-[#dadce0] bg-white p-3">
              <div className="flex items-center gap-2">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center text-white ${s.chip}`}>
                  <Icon size={16} />
                </span>
                <div className="min-w-0">
                  <p className="min-w-0 truncate text-[11px] font-semibold text-[#5f6368]">{s.label}</p>
                  <p className="truncate text-[10px] text-[#80868b]">{s.hint}</p>
                </div>
              </div>
              <p className="mt-2 text-xl font-bold text-[#202124]">{s.value}</p>
            </div>
          )
        })}
      </div>

      {/* Filter */}
      <div className="mb-4 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#80868b]" />
            <input
              type="text"
              placeholder="Cari nama/email/IP/browser/platform..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
              className="w-full border border-[#dadce0] bg-white py-2 pl-9 pr-3 text-sm text-[#3c4043] outline-none transition placeholder:text-[#80868b] focus:border-[#1a73e8] focus:border-[#1a73e8]"
            />
          </div>
          <button onClick={handleSearch}
            className="inline-flex items-center justify-center gap-2 bg-[#0E6187] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#084c63]">
            Cari
          </button>
          <button onClick={handleReset}
            className="inline-flex items-center justify-center gap-2 border border-[#dadce0] bg-white px-3 py-2 text-sm font-medium text-[#3c4043] transition hover:bg-[#f8f9fa] focus:outline-none focus:border-[#1a73e8]">
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-[#dadce0] bg-white">
        <table className="w-full border-collapse text-left text-sm text-black" style={{ tableLayout: 'fixed', minWidth: '880px' }}>
          <colgroup>
            <col className="w-[240px]" />
            <col className="w-[130px]" />
            <col className="w-[110px]" />
            <col className="w-[160px]" />
            <col className="w-[130px]" />
            <col className="w-[180px]" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3">
                <div className="flex items-center gap-1.5"><User size={13} /> Pengguna</div>
              </th>
              <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3">
                <div className="flex items-center gap-1.5"><ShieldCheck size={13} /> Role</div>
              </th>
              <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3">
                <div className="flex items-center gap-1.5"><Globe size={13} /> IP Address</div>
              </th>
              <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3">
                <div className="flex items-center gap-1.5"><Monitor size={13} /> Browser</div>
              </th>
              <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3">Platform</th>
              <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3">
                <div className="flex items-center gap-1.5"><Clock size={13} /> Waktu Login</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-[#e8eaed]/70" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-40 bg-[#e8eaed]/70" />
                        <div className="h-2.5 w-24 bg-[#f1f3f4]" />
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]">
                    <LogIn size={24} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-[#5f6368]">Tidak ada data login</p>
                </td>
              </tr>
            ) : (
              data.map(log => (
                <tr key={log.id} className="bg-white transition hover:bg-[#f8f9fa]">
                  <td className="border-b border-[#e8eaed] px-3 py-3">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(log.user?.name || '?')}&background=e5e7eb&color=6b7280&size=28`}
                        className="h-8 w-8 shrink-0 object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-[#202124]">{log.user?.name || '-'}</div>
                        <div className="truncate text-xs font-normal text-black">{log.user?.email || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-3">
                    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 text-[11px] font-semibold text-white ${ROLE_STYLE[log.user?.role || ''] || 'bg-[#80868b]'}`} title={log.user?.role || '-'}>
                      <span className="w-1.5 h-1.5 bg-white/90 shrink-0" />
                      {log.user?.role || '-'}
                    </span>
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-3 font-mono text-xs font-normal text-black">
                    <span className="block truncate">{log.ip_address || '-'}</span>
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-3 text-sm font-normal text-black">
                    <span className="block truncate" title={log.browser || '-'}>{log.browser || '-'}</span>
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-3 text-sm font-normal text-black">
                    <span className="block truncate" title={log.platform || '-'}>{log.platform || '-'}</span>
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-3 text-sm font-normal text-black whitespace-nowrap">
                    {log.login_at || log.created_at ? fmtWaktu(log.login_at || log.created_at) : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="border-t border-[#dadce0] px-4 py-3 text-sm text-[#5f6368]">
          Menampilkan {data.length} dari {meta?.total ?? 0} log login
        </div>
      </div>

      {/* Pagination */}
      {!loading && (meta?.total ?? 0) > 0 && (
        <div className="mt-4 flex flex-col gap-3 border border-[#dadce0] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-[#5f6368]">
            <span>Per halaman</span>
            <select
              value={perPage}
              onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
              className="border border-[#dadce0] bg-white px-2 py-1.5 text-sm font-medium text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]"
            >
              {[10, 25, 50, 100].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={safePage <= 1}
              className="border border-[#dadce0] bg-white p-1.5 text-[#5f6368] transition hover:bg-[#f8f9fa] disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="border border-[#dadce0] bg-white p-1.5 text-[#5f6368] transition hover:bg-[#f8f9fa] disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft size={16} />
            </button>
            {(() => {
              const pages: (number | '...')[] = []
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i)
              } else {
                pages.push(1)
                if (safePage > 3) pages.push('...')
                const start = Math.max(2, safePage - 1)
                const end = Math.min(totalPages - 1, safePage + 1)
                for (let i = start; i <= end; i++) pages.push(i)
                if (safePage < totalPages - 2) pages.push('...')
                pages.push(totalPages)
              }
              return pages.map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} className="px-1 text-sm text-[#9aa0a6]">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[32px] border px-2 py-1.5 text-sm font-medium transition ${ p === safePage ? 'border-[#dadce0] bg-[#202124] text-white' : 'border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f8f9fa]' }`}
                  >
                    {p}
                  </button>
                )
              )
            })()}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="border border-[#dadce0] bg-white p-1.5 text-[#5f6368] transition hover:bg-[#f8f9fa] disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={safePage >= totalPages}
              className="border border-[#dadce0] bg-white p-1.5 text-[#5f6368] transition hover:bg-[#f8f9fa] disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}