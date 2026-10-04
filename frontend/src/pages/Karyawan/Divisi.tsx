import { useState, useEffect } from 'react'
import {
  Building2, Plus, Edit3, Trash2, X, AlertTriangle, Hash, Tag, Search,
} from 'lucide-react'
import { divisiApi } from '../../services/api'
import type { Divisi } from '../../types'

interface DivisiForm {
  kode_divisi: string
  nama_divisi: string
}

export default function DivisiPage() {
  const [data, setData] = useState<Divisi[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Divisi | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteItem, setDeleteItem] = useState<Divisi | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState<DivisiForm>({ kode_divisi: '', nama_divisi: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await divisiApi.list()
      setData(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = data.filter((item) =>
    item.kode_divisi.toLowerCase().includes(search.toLowerCase()) ||
    item.nama_divisi.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setEditItem(null)
    setForm({ kode_divisi: '', nama_divisi: '' })
    setError('')
    setShowModal(true)
  }

  const openEdit = (item: Divisi) => {
    setEditItem(item)
    setForm({ kode_divisi: item.kode_divisi, nama_divisi: item.nama_divisi })
    setError('')
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editItem) {
        await divisiApi.update(editItem.id, form)
      } else {
        await divisiApi.create(form)
      }
      setShowModal(false)
      fetchData()
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
      await divisiApi.delete(deleteItem.id)
      setShowDelete(false)
      setDeleteItem(null)
      fetchData()
    } catch (err) {
      alert(err)
    } finally {
      setDeleting(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setError('')
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <Building2 size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Divisi</h1>
            <p className="text-sm text-[#5f6368]">{data.length} total divisi</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-[#0E6187] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#084c63] focus:outline-none focus:border-[#188038]"
        >
          <Plus size={16} />
          Tambah Divisi
        </button>
      </div>

      {/* Filter */}
      <div className="mb-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#80868b]"
            />
            <input
              type="text"
              placeholder="Cari divisi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-[#dadce0] bg-white py-2 pl-9 pr-3 text-sm text-[#3c4043] outline-none transition placeholder:text-[#80868b] focus:border-[#1a73e8]"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full border-collapse text-left text-sm text-[#3c4043]">
            <thead className="text-sm text-[#5f6368]">
              <tr>
                <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3">
                  Kode
                </th>
                <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3">
                  Nama Divisi
                </th>
                <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={3} className="px-6 py-12 text-center">
                      <div className="flex items-center gap-3">
                        <div className="h-3 bg-[#e8eaed] w-16 animate-pulse" />
                        <div className="h-3 bg-[#e8eaed] w-40 animate-pulse" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]">
                      <Building2 size={24} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-[#5f6368]">
                      {search ? 'Divisi tidak ditemukan' : 'Belum ada divisi'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="bg-white transition hover:bg-[#f8f9fa]">
                    <td className="border-b border-[#e8eaed] px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#e8f0fe] text-[#1967d2] text-xs font-mono font-semibold">
                        <Hash size={11} />
                        {item.kode_divisi}
                      </span>
                    </td>
                    <td className="border-b border-[#e8eaed] px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Tag size={14} className="text-[#80868b]" />
                        <span className="text-sm font-medium text-[#202124]">{item.nama_divisi}</span>
                      </div>
                    </td>
                    <td className="border-b border-[#e8eaed] px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 text-[#80868b] hover:text-[#1a73e8] hover:bg-[#e8f0fe] transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => { setDeleteItem(item); setShowDelete(true) }}
                          className="p-1.5 text-[#80868b] hover:text-[#c5221f] hover:bg-[#fce8e6] transition-colors"
                          title="Hapus"
                        >
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-10 p-3 sm:p-4"
          onClick={closeModal}
        >
          <div className="absolute inset-0 bg-[#202124]" />
          <div
            className="border border-[#dadce0] relative bg-white w-full max-w-md shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSave}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8eaed] sticky top-0 bg-white z-10">
                <div>
                  <h5 className="text-base font-medium text-[#202124] m-0">
                    {editItem ? 'Edit Divisi' : 'Tambah Divisi'}
                  </h5>
                  <span className="text-[11px] text-[#1a73e8] font-medium">
                    {editItem ? 'Perbarui data divisi' : 'Buat divisi baru'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1.5 hover:bg-[#f1f3f4] text-[#80868b]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {error && (
                  <div className="p-3 bg-[#fce8e6] border border-[#f28b82] text-sm text-[#c5221f]">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-[#3c4043] mb-1">
                    Kode Divisi <span className="text-[#d93025]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={form.kode_divisi}
                    onChange={(e) => setForm({ ...form, kode_divisi: e.target.value.toUpperCase() })}
                    placeholder="Contoh: IT, HRD, MKT"
                    className="w-full px-3 py-2 text-sm border border-[#dadce0] focus:outline-none focus:border-[#1a73e8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3c4043] mb-1">
                    Nama Divisi <span className="text-[#d93025]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={form.nama_divisi}
                    onChange={(e) => setForm({ ...form, nama_divisi: e.target.value })}
                    placeholder="Nama lengkap divisi"
                    className="w-full px-3 py-2 text-sm border border-[#dadce0] focus:outline-none focus:border-[#1a73e8]"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-2.5 text-sm font-medium border border-[#dadce0] text-[#5f6368] hover:bg-[#f8f9fa] transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 text-sm font-medium bg-[#0E6187] text-white hover:bg-[#084c63] disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Menyimpan...' : editItem ? 'Simpan' : 'Tambah'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDelete && deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowDelete(false)}>
          <div className="absolute inset-0 bg-[#202124]" />
          <div className="border border-[#dadce0] relative bg-white w-full max-w-sm shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] p-5 sm:p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-[#fce8e6] flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} className="text-[#d93025]" />
            </div>
            <h3 className="font-semibold text-[#202124] mb-1">Hapus Divisi</h3>
            <p className="text-sm text-[#5f6368] mb-5">
              Yakin ingin menghapus <strong>{deleteItem.nama_divisi}</strong>?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 py-2 text-sm font-medium border border-[#dadce0] text-[#5f6368] hover:bg-[#f8f9fa] transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 text-sm font-medium bg-[#c5221f] text-white hover:bg-[#a50e0e] disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
