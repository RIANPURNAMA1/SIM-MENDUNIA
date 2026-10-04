import { useState, useEffect, useCallback } from 'react'
import { FileText, Plus, Trash2, AlertTriangle } from 'lucide-react'
import { hariLiburApi } from '../../services/api'
import type { HariLibur } from '../../types'

export default function HariLiburPage() {
  const [data, setData] = useState<HariLibur[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [tglMulai, setTglMulai] = useState('')
  const [tglSelesai, setTglSelesai] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selected, setSelected] = useState<HariLibur | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await hariLiburApi.list()
      setData(res.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const resetForm = () => {
    setTglMulai('')
    setTglSelesai('')
    setKeterangan('')
  }

  const handleStore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tglMulai || !tglSelesai || !keterangan) return
    setSubmitting(true)
    try {
      await hariLiburApi.store({ tgl_mulai: tglMulai, tgl_selesai: tglSelesai, keterangan })
      resetForm()
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
      await hariLiburApi.delete(selected.id)
      setShowDelete(false)
      setSelected(null)
      fetchData()
    } catch (err) {
      alert(err)
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (t: string) => {
    const d = new Date(t + 'T00:00:00')
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  const isWeekend = (t: string) => {
    const d = new Date(t + 'T00:00:00').getDay()
    return d === 0 || d === 6
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Hari Libur</h1>
            <p className="text-sm text-[#5f6368]">Kelola hari libur nasional & tanggal merah</p>
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="inline-flex items-center gap-2 bg-[#0E6187] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#084c63]">
          <Plus size={16} />
          Tambah Libur
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-4 border border-[#a8dab5] bg-[#e6f4ea] p-4">
          <form onSubmit={handleStore}>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#3c4043] mb-1">Tanggal Mulai</label>
                <input type="date" value={tglMulai} onChange={(e) => setTglMulai(e.target.value)} required
                  className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3c4043] mb-1">Tanggal Selesai</label>
                <input type="date" value={tglSelesai} onChange={(e) => setTglSelesai(e.target.value)} required
                  className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#3c4043] mb-1">Keterangan</label>
                <input type="text" value={keterangan} onChange={(e) => setKeterangan(e.target.value)} required
                  placeholder="Contoh: Hari Raya Idul Fitri"
                  className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]" />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button type="submit" disabled={submitting}
                className="bg-[#0E6187] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#084c63] disabled:opacity-50">
                {submitting ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="border border-[#dadce0] bg-white px-4 py-2 text-sm font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

   {/* List */}
<div className="border border-[#dadce0] overflow-hidden">
  {loading ? (
    <div className="p-8 text-center text-sm text-[#80868b]">Memuat data...</div>
  ) : data.length === 0 ? (
    <div className="p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b] mb-3">
        <FileText size={24} />
      </div>
      <p className="text-sm font-medium text-[#5f6368]">Belum ada hari libur</p>
      <p className="text-xs text-[#80868b] mt-1">Klik "Tambah Libur" untuk menambahkan</p>
    </div>
  ) : (
    <div className="divide-y divide-[#e8eaed]">
      {data.map((item) => (
        <div key={item.id} className="flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-[#f8f9fa] transition">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 ${isWeekend(item.tanggal) ? 'bg-[#d93025]' : 'bg-[#f9ab00]'}`} />
            <div>
              {/* PERBAIKAN DI SINI: Ubah keterangan menjadi item.keterangan */}
              <div className="text-sm font-semibold text-[#202124]">{item.keterangan || '-'}</div>
              <div className="text-xs text-[#5f6368]">{formatDate(item.tanggal)}</div>
            </div>
          </div>
          <button onClick={() => { setSelected(item); setShowDelete(true) }}
            className="p-1.5 text-[#80868b] hover:bg-[#fce8e6] hover:text-[#d93025] transition">
            <Trash2 size={15} />
          </button>
        </div>
      ))}
    </div>
  )}
</div>

      {/* Delete Confirmation */}
      {showDelete && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowDelete(false)}>
          <div className="absolute inset-0 bg-[#202124]" />
          <div className="border border-[#dadce0] relative bg-white w-full max-w-sm shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] p-5 sm:p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-[#fce8e6] flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} className="text-[#d93025]" />
            </div>
            <h3 className="font-semibold text-[#202124] mb-1">Hapus Hari Libur</h3>
            <p className="text-sm text-[#5f6368] mb-1">
              Hapus <strong>{selected.keterangan}</strong> ({formatDate(selected.tanggal)})?
            </p>
            <div className="flex gap-2 mt-5">
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
