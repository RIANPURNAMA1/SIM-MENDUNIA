import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  FileCheck2, Search, Plus, Pencil, Trash2, ExternalLink, Paperclip, Link2,
  Loader2, FolderCog, ArrowLeft, X, CheckCircle, XCircle, Clock, ListChecks,
  ChevronLeft, ChevronRight, Eye,
} from 'lucide-react'
import { quizReferenceApi } from '../../services/api'
import Swal from 'sweetalert2'
import type { Pagination } from '../../types'

interface RefCategory {
  id: number
  name: string
}

interface RefItem {
  id: number
  title: string
  description: string | null
  link: string | null
  file_name: string | null
  file_url: string | null
  file_size: number | null
  status: 'pending' | 'diproses' | 'selesai' | 'ditolak' | string
  note: string | null
  created_at: string
  user: { id: number; name: string } | null
  category: { id: number; name: string } | null
}

const STATUS_TABS = [
  { key: '', label: 'Semua' },
  { key: 'pending', label: 'Pending' },
  { key: 'diproses', label: 'Diproses' },
  { key: 'selesai', label: 'Selesai' },
  { key: 'ditolak', label: 'Ditolak' },
]

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600',
  diproses: 'bg-blue-50 text-blue-600',
  selesai: 'bg-emerald-50 text-emerald-600',
  ditolak: 'bg-red-50 text-red-600',
}

function fmtSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function stripHtml(html: string | null | undefined) {
  return (html ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

export default function QuizReferensi() {
  const location = useLocation()
  const navigate = useNavigate()
  const isAdminCabang = location.pathname.startsWith('/admin-cabang')
  const base = isAdminCabang ? '/admin-cabang/lms' : '/lms'

  const [refs, setRefs] = useState<RefItem[]>([])
  const [categories, setCategories] = useState<RefCategory[]>([])
  const [counts, setCounts] = useState({ pending: 0, diproses: 0, selesai: 0, ditolak: 0 })
  const [loading, setLoading] = useState(true)

  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination>({ current_page: 1, last_page: 1, total: 0, per_page: 10 })

  const [showCatModal, setShowCatModal] = useState(false)
  const [catForm, setCatForm] = useState({ name: '' })
  const [editingCat, setEditingCat] = useState<RefCategory | null>(null)
  const [savingCat, setSavingCat] = useState(false)
  const [viewRef, setViewRef] = useState<RefItem | null>(null)

  const load = (status = filter, q = search, p = page) => {
    setLoading(true)
    const params: Record<string, string | number> = { per_page: 10, page: p }
    if (status) params.status = status
    if (q) params.search = q
    quizReferenceApi.adminList(params).then(res => {
      setRefs(res.data.references || [])
      setCategories(res.data.categories || [])
      setCounts(res.data.counts || { pending: 0, diproses: 0, selesai: 0, ditolak: 0 })
      setPagination(res.data.pagination || { current_page: 1, last_page: 1, total: 0, per_page: 10 })
    }).catch(() => setRefs([])).finally(() => setLoading(false))
  }

  useEffect(() => { load('', '', 1) }, [])

  const selectTab = (key: string) => {
    setFilter(key)
    setPage(1)
    load(key, search, 1)
  }

  const applySearch = (q: string) => {
    setSearch(q)
    setPage(1)
    load(filter, q, 1)
  }

  const goPage = (p: number) => {
    setPage(p)
    load(filter, search, p)
  }

  const setStatus = async (ref: RefItem, status: string) => {
    let note: string | undefined
    if (status === 'ditolak') {
      const res = await Swal.fire({
        title: 'Tolak referensi ini?',
        input: 'textarea',
        inputPlaceholder: 'Catatan untuk sensei (alasan ditolak)...',
        inputValidator: v => (v && v.trim() ? undefined : 'Catatan wajib diisi'),
        showCancelButton: true,
        confirmButtonText: 'Ya, tolak',
        cancelButtonText: 'Batal',
      })
      if (!res.isConfirmed) return
      note = res.value?.trim()
    }
    try {
      await quizReferenceApi.adminUpdateStatus(ref.id, { status, note })
      load(filter, search)
      Swal.fire({ icon: 'success', title: 'Berhasil', text: status === 'diproses' ? 'Referensi sedang diproses' : 'Status diperbarui', timer: 1500, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal memperbarui status' })
    }
  }

  const handleDelete = async (ref: RefItem) => {
    const res = await Swal.fire({
      title: 'Hapus referensi ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
    })
    if (!res.isConfirmed) return
    try {
      await quizReferenceApi.adminDestroy(ref.id)
      load(filter, search)
      Swal.fire({ icon: 'success', title: 'Dihapus', timer: 1500, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menghapus' })
    }
  }

  const openEditCat = (c: RefCategory) => {
    setEditingCat(c)
    setCatForm({ name: c.name })
    setShowCatModal(true)
  }

  const saveCat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!catForm.name.trim()) return
    setSavingCat(true)
    try {
      if (editingCat) {
        await quizReferenceApi.adminCategoryUpdate(editingCat.id, { name: catForm.name.trim() })
      } else {
        await quizReferenceApi.adminCategoryStore({ name: catForm.name.trim() })
      }
      setShowCatModal(false)
      setEditingCat(null)
      setCatForm({ name: '' })
      load(filter, search)
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menyimpan kategori' })
    } finally {
      setSavingCat(false)
    }
  }

  const deleteCat = async (c: RefCategory) => {
    const res = await Swal.fire({
      title: `Hapus kategori "${c.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
    })
    if (!res.isConfirmed) return
    try {
      await quizReferenceApi.adminCategoryDestroy(c.id)
      load(filter, search)
      Swal.fire({ icon: 'success', title: 'Dihapus', timer: 1500, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menghapus kategori' })
    }
  }

  const statusBadge = (s: string) => (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLE[s] || 'bg-gray-100 text-gray-500'}`}>
      {s === 'pending' && <Clock size={11} />}
      {s === 'diproses' && <Loader2 size={11} className="animate-spin" />}
      {s === 'selesai' && <CheckCircle size={11} />}
      {s === 'ditolak' && <XCircle size={11} />}
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  )

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-5">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0E6187] text-white shadow-sm">
              <FileCheck2 size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Referensi Quiz</h1>
              <p className="text-sm text-slate-500">Referensi soal yang dikirim sensei. Buat soal quiz dari referensi berikut.</p>
            </div>
          </div>
          <button onClick={() => navigate(base)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 text-[12px]">
            <ArrowLeft size={15} /> Kembali
          </button>
        </div>

        {/* Kontrol */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {STATUS_TABS.map(t => (
                <button key={t.key} onClick={() => selectTab(t.key)}
                  className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${filter === t.key ? 'bg-[#0E6187] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {t.label}
                  {t.key === 'pending' && counts.pending > 0 && (
                    <span className="ml-1.5 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{counts.pending}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => applySearch(e.target.value)} placeholder="Cari judul / sensei / kategori..."
                  className="w-56 rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-[#0E6187] focus:outline-none" />
              </div>
              <button onClick={() => setShowCatModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0E6187] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#0a5475] transition">
                <FolderCog size={14} /> Kelola Kategori
              </button>
            </div>
          </div>
        </div>

        {/* Kategori aktif */}
        {categories.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 mb-3">Kategori Referensi</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <span key={c.id} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-[12px] font-semibold text-slate-700">
                  {c.name}
                  <button onClick={() => openEditCat(c)} className="text-slate-400 hover:text-[#0E6187] transition"><Pencil size={11} /></button>
                  <button onClick={() => deleteCat(c)} className="text-slate-400 hover:text-red-500 transition"><Trash2 size={11} /></button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tabel */}
        <div className="bg-white border-2 border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
              <Loader2 size={20} className="animate-spin" /> Memuat referensi...
            </div>
          ) : refs.length === 0 ? (
            <div className="p-14 text-center">
              <div className="w-14 h-14 mx-auto rounded-lg bg-[#0E6187]/10 flex items-center justify-center mb-3">
                <FileCheck2 size={26} className="text-[#0E6187]" />
              </div>
              <p className="text-slate-800 font-semibold">Belum ada referensi</p>
              <p className="text-slate-500 text-sm mt-1">Sensei yang mengirim referensi quiz akan tampil di sini</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-[#0E6187] text-white">
                  <tr>
                    <th className="w-10 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide border border-[#0E6187]">No</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide border border-[#0E6187]">Referensi</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide border border-[#0E6187]">Sensei</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide border border-[#0E6187]">Kategori</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide border border-[#0E6187]">Tanggal</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide border border-[#0E6187]">Status</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide border border-[#0E6187]">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {refs.map((r, i) => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-center font-semibold text-slate-400 border border-slate-100">{(pagination.current_page - 1) * pagination.per_page + i + 1}</td>
                      <td className="px-4 py-3 border border-slate-100">
                        <p className="font-semibold text-slate-800">{r.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {r.file_name ? (
                            <a href={r.file_url || '#'} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0E6187] hover:underline">
                              <Paperclip size={11} /> {r.file_name} <span className="text-slate-400">({fmtSize(r.file_size)})</span>
                            </a>
                          ) : null}
                          {r.file_name && r.link ? <span className="text-slate-300">•</span> : null}
                          {r.link ? (
                            <a href={r.link} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0E6187] hover:underline">
                              <Link2 size={11} /> Buka Link
                            </a>
                          ) : null}
                        </div>
                        {r.description && <p className="mt-1 text-[11px] text-slate-400 line-clamp-1">{stripHtml(r.description)}</p>}
                        {r.note && <p className="mt-1 text-[11px] font-medium text-rose-500">Catatan: {r.note}</p>}
                      </td>
                      <td className="px-4 py-3 border border-slate-100">
                        <p className="font-semibold text-slate-700">{r.user?.name || '-'}</p>
                      </td>
                      <td className="px-4 py-3 border border-slate-100">
                        {r.category ? (
                          <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{r.category.name}</span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Tanpa kategori</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-[12px] text-slate-500 border border-slate-100">
                        {new Date(r.created_at + (r.created_at.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-center border border-slate-100">{statusBadge(r.status)}</td>
                      <td className="px-4 py-3 border border-slate-100">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button onClick={() => setViewRef(r)} title="Lihat referensi"
                            className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-500 hover:bg-[#0E6187] hover:text-white transition">
                            <Eye size={12} />
                          </button>
                          {r.status === 'pending' && (
                            <button onClick={() => setStatus(r, 'diproses')}
                              className="rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-blue-500 transition">Proses</button>
                          )}
                          {r.status !== 'selesai' && r.status !== 'ditolak' && (
                            <button onClick={() => setStatus(r, 'selesai')}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 transition">Selesai</button>
                          )}
                          {r.status !== 'ditolak' && r.status !== 'selesai' && (
                            <button onClick={() => setStatus(r, 'ditolak')}
                              className="rounded-lg bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-200 transition">Tolak</button>
                          )}
                          {r.status === 'pending' && (
                            <button onClick={() => handleDelete(r)}
                              className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-500 hover:bg-red-100 hover:text-red-600 transition"><Trash2 size={12} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && pagination.last_page > 1 && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 px-4 py-2 text-xs text-slate-500">
              <span>Menampilkan {pagination.total === 0 ? 0 : (pagination.current_page - 1) * pagination.per_page + 1}-{Math.min(pagination.current_page * pagination.per_page, pagination.total)} dari {pagination.total} data</span>
              <div className="flex items-center gap-1">
                <button
                  disabled={pagination.current_page <= 1}
                  onClick={() => goPage(Math.max(1, pagination.current_page - 1))}
                  className="rounded border border-slate-300 p-1 text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                  .filter((p) => Math.abs(p - pagination.current_page) <= 2 || p === 1 || p === pagination.last_page)
                  .map((p, i, arr) => (
                    <span key={p} className="inline-flex items-center">
                      {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-slate-300">...</span>}
                      <button
                        onClick={() => goPage(p)}
                        className={`min-w-[24px] rounded px-1.5 py-0.5 text-center text-xs font-medium transition ${
                          p === pagination.current_page ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  disabled={pagination.current_page >= pagination.last_page}
                  onClick={() => goPage(Math.min(pagination.last_page, pagination.current_page + 1))}
                  className="rounded border border-slate-300 p-1 text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {refs.some(r => r.status === 'pending' || r.status === 'diproses') && (
          <div className="bg-gradient-to-r from-[#0E6187] to-[#0a5475] rounded-lg p-5 text-white flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold flex items-center gap-2"><ListChecks size={16} /> Buat soal dari referensi</p>
              <p className="text-sm text-white/80">Setelah mengunduh referensi, buat paket soal di Bank Paket Soal.</p>
            </div>
            <button onClick={() => navigate(`${base}/bank-paket-soal`)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-[12px] font-bold text-[#0E6187] hover:bg-slate-100 transition">
              <ExternalLink size={14} /> Buka Bank Paket Soal
            </button>
          </div>
        )}
      </div>

      {/* Modal Kategori */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCatModal(false)}>
          <div className="w-full max-w-sm mx-3 bg-white rounded-xl shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="text-sm font-bold text-gray-900">{editingCat ? 'Edit Kategori' : 'Tambah Kategori'}</h3>
              <button onClick={() => setShowCatModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={saveCat} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nama Kategori <span className="text-red-500">*</span></label>
                <input value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="cth: Kanji N5"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]" />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowCatModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition">
                  Batal
                </button>
                <button type="submit" disabled={savingCat || !catForm.name.trim()}
                  className="rounded-lg bg-[#0069b0] px-4 py-2 text-xs font-semibold text-white hover:bg-[#004d7a] transition disabled:opacity-50">
                  {savingCat ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Lihat Referensi */}
      {viewRef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setViewRef(null)}>
          <div className="w-full max-w-2xl mx-3 bg-white rounded-xl shadow-xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Eye size={16} /> Lihat Referensi</h3>
              <button onClick={() => setViewRef(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto p-5 space-y-4 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-base font-bold text-slate-800">{viewRef.title}</h4>
                {statusBadge(viewRef.status)}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>Sensei: <b className="text-slate-700">{viewRef.user?.name || '-'}</b></span>
                <span>Kategori: <b className="text-slate-700">{viewRef.category?.name || 'Tanpa kategori'}</b></span>
                <span>Tanggal: <b className="text-slate-700">{new Date(viewRef.created_at + (viewRef.created_at.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</b></span>
              </div>
              {(viewRef.file_url || viewRef.link) && (
                <div className="flex flex-wrap gap-2">
                  {viewRef.file_url && (
                    <a href={viewRef.file_url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-semibold text-[#0E6187] hover:border-[#0E6187] transition">
                      <Paperclip size={13} /> Download File
                    </a>
                  )}
                  {viewRef.link && (
                    <a href={viewRef.link} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-semibold text-[#0E6187] hover:border-[#0E6187] transition">
                      <Link2 size={13} /> Buka Link
                    </a>
                  )}
                </div>
              )}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">Isi Soal / Referensi</p>
                {viewRef.description ? (
                  <div className="blog-content rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"
                    dangerouslySetInnerHTML={{ __html: viewRef.description }} />
                ) : (
                  <p className="text-xs text-slate-400">Tidak ada teks referensi.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}