import { useState, useEffect, useRef } from 'react'
import {
  ListOrdered, Plus, Edit3, Trash2, X, Search, Hash, Tag, ArrowUpDown,
  ChevronDown, ChevronRight,
} from 'lucide-react'
import Swal from 'sweetalert2'
import api from '../../services/api'

interface Kategori {
  id: number
  nama: string
  kode: string
  deskripsi: string | null
  urutan: number
  parent_id: number | null
  children?: Kategori[]
}

export default function DataBiayaKategori() {
  const [data, setData] = useState<Kategori[]>([])
  const [flatData, setFlatData] = useState<Kategori[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Kategori | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteItem, setDeleteItem] = useState<Kategori | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState({ nama: '', kode: '', urutan: '', deskripsi: '', parent_id: '' })
  const [parentSearch, setParentSearch] = useState('')
  const [parentOpen, setParentOpen] = useState(false)
  const parentDropdownRef = useRef<HTMLDivElement>(null)
  const parentSearchInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [expandedParents, setExpandedParents] = useState<Record<number, boolean>>({})

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      api.get('/biaya-kategori'),
      api.get('/biaya-kategori-flat'),
    ]).then(([treeRes, flatRes]) => {
      setData(treeRes.data)
      setFlatData(flatRes.data)
      const expanded: Record<number, boolean> = {}
      treeRes.data.forEach((p: Kategori) => { expanded[p.id] = true })
      setExpandedParents(expanded)
    }).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const parentOptions = flatData.filter(k => !k.parent_id)
  const selectedParent = parentOptions.find(k => String(k.id) === form.parent_id) || null

  useEffect(() => {
    if (parentOpen) {
      setTimeout(() => parentSearchInputRef.current?.focus(), 50)
    }
  }, [parentOpen])

  useEffect(() => {
    if (!parentOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (parentDropdownRef.current && !parentDropdownRef.current.contains(e.target as Node)) {
        setParentOpen(false)
        setParentSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [parentOpen])

  const filtered = data.filter(item =>
    item.nama.toLowerCase().includes(search.toLowerCase()) ||
    item.kode.toLowerCase().includes(search.toLowerCase()) ||
    (item.children && item.children.some(c =>
      c.nama.toLowerCase().includes(search.toLowerCase()) ||
      c.kode.toLowerCase().includes(search.toLowerCase())
    ))
  )

  const openCreate = () => {
    setEditItem(null)
    setForm({ nama: '', kode: '', urutan: String(flatData.length + 1), deskripsi: '', parent_id: '' })
    setError('')
    setShowModal(true)
  }

  const openEdit = (item: Kategori) => {
    setEditItem(item)
    setForm({
      nama: item.nama,
      kode: item.kode,
      urutan: String(item.urutan),
      deskripsi: item.deskripsi || '',
      parent_id: item.parent_id ? String(item.parent_id) : '',
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload: Record<string, unknown> = {
        nama: form.nama,
        kode: form.kode,
        urutan: parseInt(form.urutan) || 0,
        deskripsi: form.deskripsi || null,
        parent_id: form.parent_id ? Number(form.parent_id) : null,
      }
      if (editItem) {
        await api.put(`/biaya-kategori/${editItem.id}`, payload)
      } else {
        await api.post('/biaya-kategori', payload)
      }
      setShowModal(false)
      fetchData()
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: editItem ? 'Kategori berhasil diperbarui.' : 'Kategori berhasil ditambahkan.',
        confirmButtonColor: '#0D1F3C',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      })
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    setDeleting(true)
    try {
      await api.delete(`/biaya-kategori/${deleteItem.id}`)
      setShowDelete(false)
      setDeleteItem(null)
      fetchData()
      Swal.fire({
        icon: 'success',
        title: 'Dihapus!',
        text: 'Kategori berhasil dihapus.',
        confirmButtonColor: '#0D1F3C',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      })
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: err.response?.data?.message || 'Gagal menghapus kategori.',
        confirmButtonColor: '#0D1F3C',
      })
    } finally {
      setDeleting(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setParentOpen(false)
    setParentSearch('')
    setError('')
  }

  function toggleParent(id: number) {
    setExpandedParents(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function renderChildRows(child: Kategori, depth: number) {
    return (
      <tr key={child.id} className="bg-white transition hover:bg-slate-50">
        <td className="border border-slate-200 px-4 py-3" style={{ paddingLeft: `${16 + depth * 24}px` }}>
          <div className="flex items-center gap-2">
            {depth > 0 && <span className="text-slate-300 text-xs">└</span>}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-mono font-semibold rounded-lg">
              <Hash size={11} />
              {child.kode}
            </span>
          </div>
        </td>
        <td className="border border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <Tag size={14} className="text-slate-300" />
            <span className="text-sm font-medium text-slate-800">{child.nama}</span>
            {child.deskripsi && (
              <span className="text-[10px] text-slate-400 truncate max-w-[200px]">{child.deskripsi}</span>
            )}
          </div>
        </td>
        <td className="border border-slate-200 px-4 py-3 text-center">
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <ArrowUpDown size={12} />
            {child.urutan}
          </span>
        </td>
        <td className="border border-slate-200 px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <button onClick={() => openEdit(child)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
              <Edit3 size={15} />
            </button>
            <button onClick={() => { setDeleteItem(child); setShowDelete(true) }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Hapus">
              <Trash2 size={15} />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  function renderParentRow(parent: Kategori) {
    const isExpanded = expandedParents[parent.id]
    const hasChildren = parent.children && parent.children.length > 0
    return (
      <>
        <tr key={parent.id} className="bg-slate-50/80 transition hover:bg-slate-100/60">
          <td className="border border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              {hasChildren ? (
                <button onClick={() => toggleParent(parent.id)} className="p-0.5 rounded hover:bg-slate-200 transition-colors">
                  {isExpanded ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                </button>
              ) : (
                <span className="w-5" />
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0D1F3C] text-white text-xs font-mono font-semibold rounded-lg">
                <Hash size={11} />
                {parent.kode}
              </span>
              {hasChildren && (
                <span className="text-[10px] font-medium text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-full">
                  {parent.children!.length} sub
                </span>
              )}
            </div>
          </td>
          <td className="border border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-slate-400" />
              <span className="text-sm font-bold text-slate-800">{parent.nama}</span>
              {parent.deskripsi && (
                <span className="text-[10px] text-slate-400 truncate max-w-[200px]">{parent.deskripsi}</span>
              )}
            </div>
          </td>
          <td className="border border-slate-200 px-4 py-3 text-center">
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <ArrowUpDown size={12} />
              {parent.urutan}
            </span>
          </td>
          <td className="border border-slate-200 px-4 py-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <button onClick={() => openEdit(parent)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                <Edit3 size={15} />
              </button>
              <button onClick={() => { setDeleteItem(parent); setShowDelete(true) }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Hapus">
                <Trash2 size={15} />
              </button>
            </div>
          </td>
        </tr>
        {hasChildren && isExpanded && parent.children!.map((child, idx) => renderChildRows(child, 1))}
      </>
    )
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] border border-blue-100">
            <ListOrdered size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Kategori Pembayaran</h1>
            <p className="text-sm text-slate-500">{flatData.length} total kategori</p>
          </div>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1">
          <Plus size={16} /> Tambah Kategori
        </button>
      </div>

      <div className="mb-4 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Cari kategori..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full border-collapse text-left text-sm text-slate-700">
            <thead className="text-sm text-slate-600">
              <tr>
                <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Kode</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Nama</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Urutan</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="border border-slate-200 px-4 py-20">
                    <div className="flex items-center justify-center">
                      <div className="relative w-14 h-14 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0D1F3C] animate-spin" />
                        <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
                      </div>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="border border-slate-200 px-6 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <ListOrdered size={24} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-600">
                      {search ? 'Kategori tidak ditemukan' : 'Belum ada kategori'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map(parent => renderParentRow(parent))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-10 p-3 sm:p-4" onClick={closeModal}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSave}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                <div>
                  <h5 className="font-bold text-gray-900 m-0">{editItem ? 'Edit Kategori' : 'Tambah Kategori'}</h5>
                  <span className="text-[11px] text-blue-600 font-medium">{editItem ? 'Perbarui data kategori' : 'Buat kategori baru'}</span>
                </div>
                <button type="button" onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Kode <span className="text-red-500">*</span></label>
                  <input type="text" required maxLength={50} value={form.kode}
                    onChange={e => setForm({ ...form, kode: e.target.value.toUpperCase() })}
                    placeholder="Contoh: LEVEL5, UJIAN, SERTIFIKAT"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Kategori <span className="text-red-500">*</span></label>
                  <input type="text" required maxLength={100} value={form.nama}
                    onChange={e => setForm({ ...form, nama: e.target.value })}
                    placeholder="Nama kategori pembayaran"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Deskripsi</label>
                  <textarea value={form.deskripsi} rows={2}
                    onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                    placeholder="Deskripsi kategori (opsional)"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div className="relative" ref={parentDropdownRef}>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Parent Kategori</label>
                  <div
                    onClick={() => { setParentOpen(!parentOpen); setParentSearch('') }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm border rounded-lg cursor-pointer transition ${parentOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200'} ${selectedParent ? 'text-gray-900' : 'text-gray-400'}`}
                  >
                    <span className="truncate">{selectedParent ? `${selectedParent.kode} — ${selectedParent.nama}` : '— Tidak ada (Parent) —'}</span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${parentOpen ? 'rotate-180' : ''}`} />
                  </div>
                  {parentOpen && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                      <div className="p-1.5">
                        <input
                          ref={parentSearchInputRef}
                          type="text"
                          placeholder="Cari kode atau nama..."
                          value={parentSearch}
                          onChange={e => setParentSearch(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto pb-1">
                        <button
                          type="button"
                          onClick={() => { setForm({ ...form, parent_id: '' }); setParentOpen(false) }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-slate-50 transition-colors"
                        >
                          — Tidak ada (Parent) —
                        </button>
                        {parentOptions
                          .filter(k =>
                            k.nama.toLowerCase().includes(parentSearch.toLowerCase()) ||
                            k.kode.toLowerCase().includes(parentSearch.toLowerCase())
                          )
                          .map(k => (
                            <button
                              key={k.id}
                              type="button"
                              onClick={() => { setForm({ ...form, parent_id: String(k.id) }); setParentOpen(false); setParentSearch('') }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${form.parent_id === String(k.id) ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                            >
                              <span className="font-mono text-xs font-semibold text-slate-500 mr-1.5">{k.kode}</span>
                              {k.nama}
                            </button>
                          ))}
                        {parentOptions.filter(k =>
                          k.nama.toLowerCase().includes(parentSearch.toLowerCase()) ||
                          k.kode.toLowerCase().includes(parentSearch.toLowerCase())
                        ).length === 0 && (
                          <p className="px-3 py-2 text-sm text-gray-400 text-center">Tidak ditemukan</p>
                        )}
                      </div>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">Pilih parent jika ini adalah sub-kategori</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Urutan</label>
                  <input type="number" min={0} value={form.urutan}
                    onChange={e => setForm({ ...form, urutan: e.target.value })}
                    placeholder="Urutan tampil"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={closeModal} className="flex-1 py-2.5 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Batal</button>
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                    {saving ? 'Menyimpan...' : editItem ? 'Simpan' : 'Tambah'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDelete && deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowDelete(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-xl p-5 sm:p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Hapus Kategori</h3>
            <p className="text-sm text-gray-500 mb-5">
              Yakin ingin menghapus <strong>{deleteItem.kode} ({deleteItem.nama})</strong>?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Batal</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                {deleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
