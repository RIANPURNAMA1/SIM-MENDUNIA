import { useState, useEffect } from 'react'
import {
  ListOrdered, Plus, Edit3, Trash2, X, Search, Hash, Tag, ArrowUpDown,
} from 'lucide-react'
import { kategoriPengeluaranApi } from '../../services/api'

interface Kategori {
  id: number
  nama: string
  kode: string
  urutan: number
}

export default function DataKategoriPengeluaran() {
  const [data, setData] = useState<Kategori[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Kategori | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteItem, setDeleteItem] = useState<Kategori | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState({ nama: '', kode: '', urutan: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchData = () => {
    setLoading(true)
    kategoriPengeluaranApi.list()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const filtered = data.filter(item =>
    item.nama.toLowerCase().includes(search.toLowerCase()) ||
    item.kode.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setEditItem(null)
    setForm({ nama: '', kode: '', urutan: String(data.length + 1) })
    setError('')
    setShowModal(true)
  }

  const openEdit = (item: Kategori) => {
    setEditItem(item)
    setForm({ nama: item.nama, kode: item.kode, urutan: String(item.urutan) })
    setError('')
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { nama: form.nama, kode: form.kode, urutan: parseInt(form.urutan) || 0 }
      if (editItem) {
        await kategoriPengeluaranApi.update(editItem.id, payload)
      } else {
        await kategoriPengeluaranApi.store(payload)
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
      await kategoriPengeluaranApi.destroy(deleteItem.id)
      setShowDelete(false)
      setDeleteItem(null)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Gagal menghapus')
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
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <ListOrdered size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Kategori Pengeluaran</h1>
            <p className="text-sm text-[#5f6368]">{data.length} total kategori</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-[#0E6187] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#084c63] focus:outline-none focus:border-[#188038]"
        >
          <Plus size={16} />
          Tambah Kategori
        </button>
      </div>

      <div className="mb-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#80868b]" />
            <input
              type="text"
              placeholder="Cari kategori..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-[#dadce0] bg-white py-2 pl-9 pr-3 text-sm text-[#3c4043] outline-none transition placeholder:text-[#80868b] focus:border-[#1a73e8]"
            />
          </div>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full border-collapse text-left text-sm text-[#3c4043]">
            <thead className="text-sm text-[#5f6368]">
              <tr>
                <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3">Kode</th>
                <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3">Nama</th>
                <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Urutan</th>
                <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex items-center gap-3">
                        <div className="h-3 bg-[#e8eaed] w-16 animate-pulse" />
                        <div className="h-3 bg-[#e8eaed] w-40 animate-pulse" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]">
                      <ListOrdered size={24} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-[#5f6368]">
                      {search ? 'Kategori tidak ditemukan' : 'Belum ada kategori pengeluaran'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className="bg-white transition hover:bg-[#f8f9fa]">
                    <td className="border-b border-[#e8eaed] px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#fef7e0] text-[#b06000] text-xs font-mono font-semibold">
                        <Hash size={11} />
                        {item.kode}
                      </span>
                    </td>
                    <td className="border-b border-[#e8eaed] px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Tag size={14} className="text-[#80868b]" />
                        <span className="text-sm font-medium text-[#202124]">{item.nama}</span>
                      </div>
                    </td>
                    <td className="border-b border-[#e8eaed] px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-[#5f6368]">
                        <ArrowUpDown size={12} />
                        {item.urutan}
                      </span>
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-10 p-3 sm:p-4" onClick={closeModal}>
          <div className="absolute inset-0 bg-[#202124]" />
          <div className="border border-[#dadce0] relative bg-white w-full max-w-md shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)]" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSave}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8eaed] sticky top-0 bg-white z-10">
                <div>
                  <h5 className="text-base font-medium text-[#202124] m-0">
                    {editItem ? 'Edit Kategori' : 'Tambah Kategori'}
                  </h5>
                  <span className="text-[11px] text-[#b06000] font-medium">
                    {editItem ? 'Perbarui data kategori pengeluaran' : 'Buat kategori pengeluaran baru'}
                  </span>
                </div>
                <button type="button" onClick={closeModal} className="p-1.5 hover:bg-[#f1f3f4] text-[#80868b]">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                {error && (
                  <div className="p-3 bg-[#fce8e6] border border-[#f28b82] text-sm text-[#c5221f]">{error}</div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-[#3c4043] mb-1">
                    Kode <span className="text-[#d93025]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={form.kode}
                    onChange={e => setForm({ ...form, kode: e.target.value.toUpperCase() })}
                    placeholder="Contoh: GAJI, SEWA, LISTRIK"
                    className="w-full px-3 py-2 text-sm border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-[#e37400] focus:border-[#e37400]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3c4043] mb-1">
                    Nama Kategori <span className="text-[#d93025]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={form.nama}
                    onChange={e => setForm({ ...form, nama: e.target.value })}
                    placeholder="Nama kategori pengeluaran"
                    className="w-full px-3 py-2 text-sm border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-[#e37400] focus:border-[#e37400]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3c4043] mb-1">
                    Urutan
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.urutan}
                    onChange={e => setForm({ ...form, urutan: e.target.value })}
                    placeholder="Urutan tampil"
                    className="w-full px-3 py-2 text-sm border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-[#e37400] focus:border-[#e37400]"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={closeModal} className="flex-1 py-2.5 text-sm font-medium border border-[#dadce0] text-[#5f6368] hover:bg-[#f8f9fa] transition-colors">
                    Batal
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 text-sm font-medium bg-[#b06000] text-white hover:bg-[#b06000] disabled:opacity-50 transition-colors">
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
          <div className="absolute inset-0 bg-[#202124]" />
          <div className="border border-[#dadce0] relative bg-white w-full max-w-sm shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] p-5 sm:p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-[#fce8e6] flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} className="text-[#d93025]" />
            </div>
            <h3 className="font-semibold text-[#202124] mb-1">Hapus Kategori</h3>
            <p className="text-sm text-[#5f6368] mb-5">
              Yakin ingin menghapus <strong>{deleteItem.kode} ({deleteItem.nama})</strong>?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-2 text-sm font-medium border border-[#dadce0] text-[#5f6368] hover:bg-[#f8f9fa] transition-colors">
                Batal
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2 text-sm font-medium bg-[#c5221f] text-white hover:bg-[#a50e0e] disabled:opacity-50 transition-colors">
                {deleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
