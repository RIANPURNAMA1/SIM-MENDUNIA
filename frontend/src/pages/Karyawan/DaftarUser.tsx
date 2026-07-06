import { useState, useEffect, useCallback } from 'react'
import { List, Search, Trash2, AlertTriangle, RotateCcw } from 'lucide-react'
import { userApi } from '../../services/api'
import type { Karyawan, Pagination } from '../../types'

export default function DaftarUserPage() {
  const [data, setData] = useState<Karyawan[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Karyawan | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, per_page: 50 }
      if (search) params.search = search
      if (filterRole) params.role = filterRole
      if (filterStatus) params.status = filterStatus
      const res = await userApi.list(params)
      setData(res.data.data)
      setPagination(res.data.pagination)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, search, filterRole, filterStatus])

  useEffect(() => { fetchData() }, [fetchData])

  const handleToggleStatus = async (item: Karyawan) => {
    setTogglingId(item.id)
    try {
      await userApi.toggleStatus(item.id)
      fetchData()
    } catch (err) {
      alert(err)
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!selected) return
    setDeleting(true)
    try {
      await userApi.delete(selected.id)
      setShowDelete(false)
      setSelected(null)
      fetchData()
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Gagal menghapus user')
    } finally {
      setDeleting(false)
    }
  }

  const resetFilter = () => {
    setSearch('')
    setFilterRole('')
    setFilterStatus('')
    setPage(1)
  }

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-700',
      HR: 'bg-blue-100 text-blue-700',
      MANAGER: 'bg-amber-100 text-amber-700',
      KARYAWAN: 'bg-emerald-100 text-emerald-700',
      GURU: 'bg-sky-100 text-sky-700',
      KANDIDAT: 'bg-rose-100 text-rose-700',
    }
    return (
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colors[role] || 'bg-slate-100 text-slate-600'}`}>
        {role}
      </span>
    )
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] border border-blue-100">
            <List size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Daftar User</h1>
            <p className="text-sm text-slate-500">Manajemen akun seluruh pengguna sistem</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text" placeholder="Cari nama, email, atau NIP..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setPage(1) }}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            <option value="">Semua Role</option>
            <option value="ADMIN">ADMIN</option>
            <option value="HR">HR</option>
            <option value="MANAGER">MANAGER</option>
            <option value="KARYAWAN">KARYAWAN</option>
            <option value="GURU">GURU</option>
            <option value="KANDIDAT">KANDIDAT</option>
          </select>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            <option value="">Semua Status</option>
            <option value="AKTIF">AKTIF</option>
            <option value="NONAKTIF">NONAKTIF</option>
          </select>
          <button onClick={resetFilter}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto">
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-full border-collapse text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-sm text-slate-600">
              <tr>
                <th className="border border-slate-200 px-4 py-3 font-medium">User</th>
                <th className="border border-slate-200 px-4 py-3 font-medium">Email</th>
                <th className="border border-slate-200 px-4 py-3 font-medium text-center">Role</th>
                <th className="border border-slate-200 px-4 py-3 font-medium">Divisi</th>
                <th className="border border-slate-200 px-4 py-3 font-medium text-center">Status</th>
                <th className="border border-slate-200 px-4 py-3 font-medium">Terakhir Login</th>
                <th className="border border-slate-200 px-4 py-3 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="border border-slate-200 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-200/70" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-40 rounded bg-slate-200/70" />
                          <div className="h-2.5 w-24 rounded bg-slate-100" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border border-slate-200 px-6 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <List size={24} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-600">Tidak ada data user</p>
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="bg-white transition hover:bg-slate-50">
                    <td className="border border-slate-200 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=e5e7eb&color=6b7280&size=28`}
                          className="h-8 w-8 rounded-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.nip || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">{item.email}</td>
                    <td className="border border-slate-200 px-4 py-3 text-center">{roleBadge(item.role)}</td>
                    <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">
                      {item.divisi?.nama_divisi || <span className="text-slate-400">-</span>}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      <label className="inline-flex cursor-pointer items-center gap-1.5">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          checked={item.status === 'AKTIF'}
                          onChange={() => handleToggleStatus(item)}
                          disabled={togglingId === item.id}
                        />
                        <span className={`text-[10px] font-semibold ${item.status === 'AKTIF' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {item.status}
                        </span>
                      </label>
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-xs text-slate-500">
                      {item.last_login ? new Date(item.last_login).toLocaleString('id-ID') : 'Belum pernah'}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      <button
                        onClick={() => { setSelected(item); setShowDelete(true) }}
                        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                        title="Hapus"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.last_page > 1 && (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Halaman {pagination.current_page} dari {pagination.last_page} (total {pagination.total} user)
          </p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition disabled:cursor-not-allowed disabled:opacity-50">
              Sebelumnya
            </button>
            <button disabled={page >= pagination.last_page} onClick={() => setPage(page + 1)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition disabled:cursor-not-allowed disabled:opacity-50">
              Selanjutnya
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDelete && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowDelete(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-xl p-5 sm:p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Hapus User</h3>
            <p className="text-sm text-gray-500 mb-1">
              Yakin ingin menghapus <strong>{selected.name}</strong>?
            </p>
            <p className="text-xs text-amber-600 mb-5">
              User dengan role MANAGER atau HR tidak dapat dihapus.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowDelete(false)}
                className="flex-1 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors">
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
