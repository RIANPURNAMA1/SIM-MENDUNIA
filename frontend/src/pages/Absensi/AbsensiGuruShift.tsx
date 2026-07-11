import { useState, useEffect, useCallback } from 'react'
import {
  Timer, Plus, Edit3, Trash2, X, AlertTriangle, Search, Clock, CheckCircle,
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

export default function AbsensiGuruShift() {
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
      {successMessage && (
        <div className="mb-4 animate-slide-down">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle size={18} className="text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-800">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="flex h-6 w-6 items-center justify-center rounded-full text-emerald-400 hover:bg-emerald-100 hover:text-emerald-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0069b0] border border-blue-100">
            <Timer size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Data Shift Guru</h1>
            <p className="text-sm text-slate-500">Master data shift kerja untuk absensi guru</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
        >
          <Plus size={16} />
          Tambah Shift
        </button>
      </div>

      <div className="mb-4 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Cari shift..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full border-collapse text-left text-sm text-slate-700">
            <thead className="text-sm text-slate-600">
              <tr>
                <th scope="col" className="border border-slate-200 px-4 py-3 font-medium w-12">No</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Nama Shift</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Jam Masuk</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Jam Pulang</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Total Jam</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Toleransi</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Status</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="border border-slate-200 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-3 bg-slate-200/70 rounded w-16 animate-pulse" />
                        <div className="h-3 bg-slate-200/70 rounded w-32 animate-pulse" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="border border-slate-200 px-6 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Timer size={24} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-600">
                      {search ? 'Shift tidak ditemukan' : 'Belum ada shift'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={item.id} className="bg-white transition hover:bg-slate-50">
                    <td className="border border-slate-200 px-4 py-3 text-sm text-slate-500">{idx + 1}</td>
                    <td className="border border-slate-200 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-300 shrink-0" />
                        <div>
                          <span className="text-sm font-medium text-slate-800">{item.nama_shift}</span>
                          {item.kode_shift && (
                            <small className="block text-xs text-slate-400">{item.kode_shift}</small>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center font-mono text-sm text-slate-700">
                      {item.jam_masuk}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center font-mono text-sm text-slate-700">
                      {item.jam_pulang}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-700">
                      {item.total_jam ?? '-'} Jam
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-500">
                      {item.toleransi} Menit
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${
                        item.status === 'AKTIF'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => { setDeleteItem(item); setShowDelete(true) }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-10 p-3 sm:p-4"
          onClick={closeModal}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-2xl w-full max-w-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSave}>
              <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-10 rounded-t-2xl"
                style={{ background: 'linear-gradient(135deg, #0069b0 0%, #004d7a 100%)' }}>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-blue-200" />
                  <div>
                    <h5 className="font-bold text-white m-0">
                      {editItem ? 'Edit Shift Guru' : 'Tambah Shift Guru'}
                    </h5>
                    <span className="text-[11px] text-blue-200 font-medium">
                      {editItem ? 'Perbarui data shift kerja guru' : 'Buat shift kerja baru untuk guru'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 whitespace-pre-line">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Kode Shift
                    </label>
                    <input
                      type="text"
                      maxLength={50}
                      value={form.kode_shift}
                      onChange={(e) => setForm({ ...form, kode_shift: e.target.value.toUpperCase() })}
                      placeholder="Contoh: PAGI, SIANG, MALAM"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Nama Shift <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={255}
                      value={form.nama_shift}
                      onChange={(e) => setForm({ ...form, nama_shift: e.target.value })}
                      placeholder="Nama shift"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Jam Masuk <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={form.jam_masuk}
                      onChange={(e) => setForm({ ...form, jam_masuk: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Jam Pulang <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={form.jam_pulang}
                      onChange={(e) => setForm({ ...form, jam_pulang: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Toleransi (menit) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={60}
                      value={form.toleransi}
                      onChange={(e) => setForm({ ...form, toleransi: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="AKTIF">Aktif</option>
                    <option value="NONAKTIF">Nonaktif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Keterangan
                  </label>
                  <textarea
                    rows={2}
                    value={form.keterangan}
                    onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                    placeholder="Keterangan tambahan (opsional)"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-100 mt-4 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-2.5 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <X size={14} className="inline mr-1" />
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-[#0069b0] text-white hover:bg-[#004d7a] disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {saving ? 'Menyimpan...' : editItem ? 'Simpan Perubahan' : 'Simpan Shift'}
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
          <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-xl p-5 sm:p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Hapus Shift</h3>
            <p className="text-sm text-gray-500 mb-5">
              Yakin ingin menghapus <strong>{deleteItem.nama_shift}</strong>?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
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