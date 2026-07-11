import { useState, useEffect, useCallback } from 'react'
import {
  MapPin, Plus, Edit3, Trash2, X, AlertTriangle, Search, Hash, CheckCircle, Crosshair,
} from 'lucide-react'
import { cabangApi } from '../../services/api'
import type { Cabang } from '../../types'

interface CabangForm {
  kode_cabang: string
  nama_cabang: string
  status_pusat: string
  latitude: string
  longitude: string
  radius: string
  alamat: string
}

const emptyForm: CabangForm = {
  kode_cabang: '',
  nama_cabang: '',
  status_pusat: 'CABANG',
  latitude: '',
  longitude: '',
  radius: '100',
  alamat: '',
}

export default function AbsensiGuruCabang() {
  const [data, setData] = useState<Cabang[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Cabang | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteItem, setDeleteItem] = useState<Cabang | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState<CabangForm>(emptyForm)
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
      const res = await cabangApi.list()
      setData(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = data.filter((item) =>
    item.kode_cabang?.toLowerCase().includes(search.toLowerCase()) ||
    item.nama_cabang.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setEditItem(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  const openEdit = (item: Cabang) => {
    setEditItem(item)
    setForm({
      kode_cabang: item.kode_cabang || '',
      nama_cabang: item.nama_cabang,
      status_pusat: item.status_pusat || 'CABANG',
      latitude: String(item.latitude || ''),
      longitude: String(item.longitude || ''),
      radius: String(item.radius || '100'),
      alamat: item.alamat || '',
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
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        radius: parseInt(form.radius),
      }
      if (editItem) {
        await cabangApi.update(editItem.id, payload)
        showSuccess('Cabang berhasil diperbarui')
      } else {
        await cabangApi.create(payload)
        showSuccess('Cabang berhasil ditambahkan')
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
      await cabangApi.delete(deleteItem.id)
      showSuccess('Cabang berhasil dihapus')
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

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toString(),
          longitude: pos.coords.longitude.toString(),
        }))
      },
      () => {},
    )
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
            <MapPin size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Cabang / Lokasi Guru</h1>
            <p className="text-sm text-slate-500">{data.length} total cabang</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
        >
          <Plus size={16} />
          Tambah Cabang
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
              placeholder="Cari cabang..."
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
                <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Kode</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Nama Cabang</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Tipe</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Radius</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="border border-slate-200 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-3 bg-slate-200/70 rounded w-16 animate-pulse" />
                        <div className="h-3 bg-slate-200/70 rounded w-40 animate-pulse" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="border border-slate-200 px-6 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <MapPin size={24} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-600">
                      {search ? 'Cabang tidak ditemukan' : 'Belum ada cabang'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="bg-white transition hover:bg-slate-50">
                    <td className="border border-slate-200 px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-mono font-semibold rounded-lg">
                        <Hash size={11} />
                        {item.kode_cabang || '-'}
                      </span>
                    </td>
                    <td className="border border-slate-200 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-slate-300" />
                        <span className="text-sm font-medium text-slate-800">{item.nama_cabang}</span>
                      </div>
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${
                        item.status_pusat === 'PUSAT'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.status_pusat || 'CABANG'}
                      </span>
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-600">
                      {item.radius ? `${item.radius}m` : '-'}
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
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                <div>
                  <h5 className="font-bold text-gray-900 m-0">
                    {editItem ? 'Edit Cabang' : 'Tambah Cabang'}
                  </h5>
                  <span className="text-[11px] text-blue-600 font-medium">
                    {editItem ? 'Perbarui data cabang guru' : 'Buat cabang baru untuk guru'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Kode Cabang <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={form.kode_cabang}
                    onChange={(e) => setForm({ ...form, kode_cabang: e.target.value.toUpperCase() })}
                    placeholder="Contoh: JKT, BDG, SBY"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nama Cabang <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={form.nama_cabang}
                    onChange={(e) => setForm({ ...form, nama_cabang: e.target.value })}
                    placeholder="Nama lengkap cabang"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tipe <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.status_pusat}
                    onChange={(e) => setForm({ ...form, status_pusat: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="CABANG">Cabang</option>
                    <option value="PUSAT">Pusat</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Latitude <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={form.latitude}
                      onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                      placeholder="-6.2088"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Longitude <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={form.longitude}
                      onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                      placeholder="106.8456"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Radius (m) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={form.radius}
                      onChange={(e) => setForm({ ...form, radius: e.target.value })}
                      placeholder="100"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Crosshair size={12} />
                    Ambil lokasi saat ini
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Alamat
                  </label>
                  <textarea
                    rows={2}
                    value={form.alamat}
                    onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                    placeholder="Alamat lengkap cabang"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-2.5 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
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
          <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-xl p-5 sm:p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Hapus Cabang</h3>
            <p className="text-sm text-gray-500 mb-5">
              Yakin ingin menghapus <strong>{deleteItem.nama_cabang}</strong>?
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