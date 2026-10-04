import { useState, useEffect, useCallback } from 'react'
import {
  Timer, Plus, Edit3, Trash2, X, AlertTriangle, Hash, Search, Clock, CheckCircle,
} from 'lucide-react'
import { shiftApi } from '../../services/api'
import type { Shift } from '../../types'

interface ShiftForm {
  kode_shift: string
  nama_shift: string
  jam_masuk: string
  jam_pulang: string
  toleransi: string
  status: string
  keterangan: string
}

const emptyForm: ShiftForm = {
  kode_shift: '',
  nama_shift: '',
  jam_masuk: '',
  jam_pulang: '',
  toleransi: '15',
  status: 'AKTIF',
  keterangan: '',
}

export default function ShiftPage() {
  const [data, setData] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Shift | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteItem, setDeleteItem] = useState<Shift | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState<ShiftForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const showSuccess = useCallback((msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(null), 3500)
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await shiftApi.list()
      setData(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = data.filter((item) =>
    item.kode_shift?.toLowerCase().includes(search.toLowerCase()) ||
    item.nama_shift.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setEditItem(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  const openEdit = (item: Shift) => {
    setEditItem(item)
    setForm({
      kode_shift: item.kode_shift || '',
      nama_shift: item.nama_shift,
      jam_masuk: item.jam_masuk,
      jam_pulang: item.jam_pulang,
      toleransi: String(item.toleransi || '15'),
      status: item.status || 'AKTIF',
      keterangan: item.keterangan || '',
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        toleransi: parseInt(form.toleransi),
      }
      if (editItem) {
        await shiftApi.update(editItem.id, payload)
        showSuccess('Shift berhasil diperbarui')
      } else {
        await shiftApi.create(payload)
        showSuccess('Shift berhasil ditambahkan')
      }
      setShowModal(false)
      fetchData()
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Gagal menyimpan'
      const errors = err.response?.data?.errors
      if (errors) {
        setError(Object.values(errors).flat().join('\n'))
      } else {
        setError(msg)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    setDeleting(true)
    try {
      await shiftApi.delete(deleteItem.id)
      showSuccess('Shift berhasil dihapus')
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
      {/* Success Alert */}
      {successMessage && (
        <div className="mb-4 animate-slide-down">
          <div className="flex items-center gap-3 border border-[#a8dab5] bg-[#e6f4ea] px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
              <CheckCircle size={18} className="text-[#137333]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#0d652d]">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="flex h-6 w-6 items-center justify-center text-[#81c995] hover:bg-[#084c63] hover:text-[#137333] transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <Timer size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Data Shift</h1>
            <p className="text-sm text-[#5f6368]">Master data seluruh shift kerja</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-[#0E6187] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#084c63] focus:outline-none focus:border-[#188038]"
        >
          <Plus size={16} />
          Tambah Shift
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
              placeholder="Cari shift..."
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
                <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 w-12">No</th>
                <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3">Nama Shift</th>
                <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Jam Masuk</th>
                <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Jam Pulang</th>
                <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Total Jam</th>
                <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Toleransi</th>
                <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Status</th>
                <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex items-center gap-3">
                        <div className="h-3 bg-[#e8eaed] w-16 animate-pulse" />
                        <div className="h-3 bg-[#e8eaed] w-32 animate-pulse" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]">
                      <Timer size={24} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-[#5f6368]">
                      {search ? 'Shift tidak ditemukan' : 'Belum ada shift'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={item.id} className="bg-white transition hover:bg-[#f8f9fa]">
                    <td className="border-b border-[#e8eaed] border-b px-4 py-3 text-sm text-[#5f6368]">{idx + 1}</td>
                    <td className="border-b border-[#e8eaed] border-b px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-[#80868b] shrink-0" />
                        <div>
                          <span className="text-sm font-medium text-[#202124]">{item.nama_shift}</span>
                          {item.kode_shift && (
                            <small className="block text-xs text-[#80868b]">{item.kode_shift}</small>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-[#e8eaed] border-b px-4 py-3 text-center font-mono text-sm text-[#3c4043]">
                      {item.jam_masuk}
                    </td>
                    <td className="border-b border-[#e8eaed] border-b px-4 py-3 text-center font-mono text-sm text-[#3c4043]">
                      {item.jam_pulang}
                    </td>
                    <td className="border-b border-[#e8eaed] border-b px-4 py-3 text-center text-sm font-medium text-[#3c4043]">
                      {item.total_jam ?? '-'} Jam
                    </td>
                    <td className="border-b border-[#e8eaed] border-b px-4 py-3 text-center text-sm text-[#5f6368]">
                      {item.toleransi} Menit
                    </td>
                    <td className="border-b border-[#e8eaed] border-b px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold ${ item.status === 'AKTIF' ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-[#f1f3f4] text-[#5f6368]' }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="border-b border-[#e8eaed] border-b px-4 py-3 text-center">
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
            className="border border-[#dadce0] relative bg-white w-full max-w-lg shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSave}>
              <div className="flex items-center justify-between bg-white px-5 py-4 border-b border-[#dadce0] sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-[#5f6368]" />
                  <div>
                    <h5 className="font-medium text-[#202124] text-base m-0">
                      {editItem ? 'Edit Shift Kerja' : 'Tambah Shift Kerja'}
                    </h5>
                    <span className="text-xs text-[#5f6368]">
                      {editItem ? 'Perbarui data shift kerja' : 'Buat shift kerja baru'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1.5 hover:bg-[#f1f3f4] text-[#5f6368] hover:text-[#202124] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {error && (
                  <div className="p-3 bg-[#fce8e6] border border-[#f28b82] text-sm text-[#c5221f] whitespace-pre-line">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#3c4043] mb-1">
                      Kode Shift
                    </label>
                    <input
                      type="text"
                      maxLength={50}
                      value={form.kode_shift}
                      onChange={(e) => setForm({ ...form, kode_shift: e.target.value.toUpperCase() })}
                      placeholder="Contoh: PAGI, SIANG, MALAM"
                      className="w-full px-3 py-2 text-sm border border-[#dadce0] focus:outline-none focus:border-[#1a73e8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#3c4043] mb-1">
                      Nama Shift <span className="text-[#d93025]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={255}
                      value={form.nama_shift}
                      onChange={(e) => setForm({ ...form, nama_shift: e.target.value })}
                      placeholder="Nama shift"
                      className="w-full px-3 py-2 text-sm border border-[#dadce0] focus:outline-none focus:border-[#1a73e8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#3c4043] mb-1">
                      Jam Masuk <span className="text-[#d93025]">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={form.jam_masuk}
                      onChange={(e) => setForm({ ...form, jam_masuk: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#dadce0] focus:outline-none focus:border-[#1a73e8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#3c4043] mb-1">
                      Jam Pulang <span className="text-[#d93025]">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={form.jam_pulang}
                      onChange={(e) => setForm({ ...form, jam_pulang: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#dadce0] focus:outline-none focus:border-[#1a73e8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#3c4043] mb-1">
                      Toleransi (menit) <span className="text-[#d93025]">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={60}
                      value={form.toleransi}
                      onChange={(e) => setForm({ ...form, toleransi: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#dadce0] focus:outline-none focus:border-[#1a73e8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3c4043] mb-1">
                    Status <span className="text-[#d93025]">*</span>
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#dadce0] focus:outline-none focus:border-[#1a73e8]"
                  >
                    <option value="AKTIF">Aktif</option>
                    <option value="NONAKTIF">Nonaktif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3c4043] mb-1">
                    Keterangan
                  </label>
                  <textarea
                    rows={2}
                    value={form.keterangan}
                    onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                    placeholder="Keterangan tambahan (opsional)"
                    className="w-full px-3 py-2 text-sm border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t border-[#e8eaed] mt-4 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-2.5 text-sm font-medium border border-[#dadce0] text-[#5f6368] hover:bg-[#f8f9fa] transition-colors"
                  >
                    <X size={14} className="inline mr-1" />
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 text-sm font-medium bg-[#0E6187] text-white hover:bg-[#084c63] disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Menyimpan...' : editItem ? 'Simpan Perubahan' : 'Simpan Shift'}
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
            <h3 className="font-semibold text-[#202124] mb-1">Hapus Shift</h3>
            <p className="text-sm text-[#5f6368] mb-5">
              Yakin ingin menghapus <strong>{deleteItem.nama_shift}</strong>?
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
