import { useState, useEffect, useCallback } from 'react'
import { Settings, Plus, Edit3, Trash2, X, AlertTriangle } from 'lucide-react'
import { userApi } from '../../services/api'

interface AdminUser {
  id: number
  name: string
  email: string
  role: string
  status: string
  last_login: string | null
}

export default function PengaturanPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'HR', status: 'AKTIF' })

  const [showDelete, setShowDelete] = useState(false)
  const [selected, setSelected] = useState<AdminUser | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await userApi.list({ role: 'HR,MANAGER', per_page: 100 })
      setUsers(res.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', email: '', password: '', role: 'HR', status: 'AKTIF' })
    setShowForm(true)
  }

  const openEdit = (u: AdminUser) => {
    setEditing(u)
    setForm({ name: u.name, email: u.email, password: '', role: u.role, status: u.status })
    setShowForm(true)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      if (editing) {
        const payload: Record<string, string> = { name: form.name, email: form.email, role: form.role, status: form.status }
        if (form.password) payload.password = form.password
        await userApi.update(editing.id, payload)
      } else {
        await userApi.store({ ...form, password: form.password })
      }
      setShowForm(false)
      fetchData()
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Gagal menyimpan')
    } finally {
      setSubmitting(false)
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
      alert(err?.response?.data?.message || err.message || 'Gagal menghapus')
    } finally {
      setDeleting(false)
    }
  }

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      HR: 'bg-[#e8f0fe] text-[#1967d2]',
      MANAGER: 'bg-[#fef7e0] text-[#b06000]',
    }
    return (
      <span className={`text-[10px] font-semibold px-2 py-0.5 ${colors[role] || 'bg-[#f1f3f4] text-[#5f6368]'}`}>
        {role}
      </span>
    )
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <Settings size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Pengaturan</h1>
            <p className="text-sm text-[#5f6368]">Manajemen Akun Admin (HR & MANAGER)</p>
          </div>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 bg-[#0E6187] px-4 py-2 text-sm font-medium text-white hover:bg-[#084c63] transition-colors">
          <Plus size={16} />
          Tambah Akun
        </button>
      </div>

      <div className="relative overflow-x-auto">
        <div className="overflow-x-auto border border-[#dadce0]">
          <table className="w-full min-w-full border-collapse text-left text-sm text-[#3c4043]">
            <thead className="text-sm text-[#5f6368]">
              <tr>
                <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Nama</th>
                <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Email</th>
                <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Role</th>
                <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Status</th>
                <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Terakhir Login</th>
                <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-[#e8eaed]" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-40 bg-[#e8eaed]" />
                          <div className="h-2.5 w-24 bg-[#f1f3f4]" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]">
                      <Settings size={24} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-[#5f6368]">Belum ada akun admin</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="bg-white transition hover:bg-[#f8f9fa]">
                    <td className="border-b border-[#e8eaed] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=e5e7eb&color=6b7280&size=28`}
                          className="h-8 w-8 object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                        <span className="font-semibold text-[#202124]">{u.name}</span>
                      </div>
                    </td>
                    <td className="border-b border-[#e8eaed] px-4 py-3 text-[#5f6368]">{u.email}</td>
                    <td className="border-b border-[#e8eaed] px-4 py-3 text-center">{roleBadge(u.role)}</td>
                    <td className="border-b border-[#e8eaed] px-4 py-3 text-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 ${u.status === 'AKTIF' ? 'bg-[#0E6187] text-white' : 'bg-[#fce8e6] text-[#a50e0e]'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="border-b border-[#e8eaed] px-4 py-3 text-xs text-[#5f6368]">
                      {u.last_login ? new Date(u.last_login).toLocaleString('id-ID') : 'Belum pernah'}
                    </td>
                    <td className="border-b border-[#e8eaed] px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(u)}
                          className="border border-[#dadce0] bg-white p-2 text-[#5f6368] transition hover:border-[#e8f0fe] hover:bg-[#e8f0fe] hover:text-[#1a73e8]"
                          title="Edit">
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => { setSelected(u); setShowDelete(true) }}
                          className="border border-[#dadce0] bg-white p-2 text-[#5f6368] transition hover:border-[#f28b82] hover:bg-[#fce8e6] hover:text-[#c5221f]"
                          title="Hapus">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-[#202124]" />
          <div className="border border-[#dadce0] relative bg-white w-full max-w-md shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#202124]">{editing ? 'Edit Akun Admin' : 'Tambah Akun Admin'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 text-[#80868b] hover:text-[#5f6368] hover:bg-[#f1f3f4]">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#5f6368] mb-1">Nama</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#1a73e8]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5f6368] mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#1a73e8]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5f6368] mb-1">
                  Password {editing ? '(kosongkan jika tidak diubah)' : ''}
                </label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#1a73e8]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5f6368] mb-1">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#1a73e8]">
                  <option value="HR">HR</option>
                  <option value="MANAGER">MANAGER</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5f6368] mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#1a73e8]">
                  <option value="AKTIF">AKTIF</option>
                  <option value="NONAKTIF">NONAKTIF</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2 text-sm font-medium border border-[#dadce0] text-[#5f6368] hover:bg-[#f8f9fa] transition-colors">
                Batal
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 py-2 text-sm font-medium bg-[#0E6187] text-white hover:bg-[#084c63] disabled:opacity-50 transition-colors">
                {submitting ? 'Menyimpan...' : editing ? 'Simpan' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDelete && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowDelete(false)}>
          <div className="absolute inset-0 bg-[#202124]" />
          <div className="border border-[#dadce0] relative bg-white w-full max-w-sm shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] p-5 sm:p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-[#fce8e6] flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} className="text-[#d93025]" />
            </div>
            <h3 className="font-semibold text-[#202124] mb-1">Hapus Akun</h3>
            <p className="text-sm text-[#5f6368] mb-5">
              Yakin ingin menghapus <strong>{selected.name}</strong>?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowDelete(false)}
                className="flex-1 py-2 text-sm font-medium border border-[#dadce0] text-[#5f6368] hover:bg-[#f8f9fa] transition-colors">
                Batal
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2 text-sm font-medium bg-[#d93025] text-white hover:bg-[#c5221f] disabled:opacity-50 transition-colors">
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}