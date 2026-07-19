import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Wallet, Plus, Search, Trash2, X, Eye, Edit3, Filter, FileText, Camera, Upload, Image as ImageIcon, RotateCcw,
} from 'lucide-react'
import { pengeluaranApi, kategoriPengeluaranApi, adminCabangApi, APP_URL } from '../../services/api'

interface Kategori {
  id: number
  nama: string
  kode: string
}

interface Cabang {
  id: number
  nama_cabang: string
}

interface PengeluaranItem {
  id: number
  tanggal: string
  nominal: number
  keterangan: string | null
  bukti: string | null
  kategori: Kategori
  user: { id: number; name: string }
  cabang: Cabang | null
  created_at: string
}

interface RekapItem {
  bulan: number
  nama_bulan: string
  total: number
  jumlah: number
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

export default function AdminCabangPengeluaran() {
  const [data, setData] = useState<PengeluaranItem[]>([])
  const [kategoris, setKategoris] = useState<Kategori[]>([])
  const [branches, setBranches] = useState<Cabang[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const [filterKategori, setFilterKategori] = useState('')
  const [filterMulai, setFilterMulai] = useState('')
  const [filterSampai, setFilterSampai] = useState('')
  const [search, setSearch] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<PengeluaranItem | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteItem, setDeleteItem] = useState<PengeluaranItem | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [detailItem, setDetailItem] = useState<PengeluaranItem | null>(null)

  const [form, setForm] = useState({ kategori_id: '', tanggal: '', nominal: '', keterangan: '', cabang_id: '' })
  const [buktiFile, setBuktiFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const [showCamera, setShowCamera] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [buktiPreview, setBuktiPreview] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = useCallback(async (facing?: 'environment' | 'user') => {
    const mode = facing || facingMode
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCameraReady(true)
      }
    } catch {
      setError('Tidak dapat mengakses kamera')
      setShowCamera(false)
    }
  }, [facingMode])

  const switchCamera = useCallback(() => {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    startCamera(next)
  }, [facingMode, startCamera])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraReady(false)
  }, [])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `bukti_${Date.now()}.jpg`, { type: 'image/jpeg' })
        setBuktiFile(file)
        setBuktiPreview(URL.createObjectURL(blob))
      }
      stopCamera()
      setShowCamera(false)
    }, 'image/jpeg', 0.9)
  }, [stopCamera])

  useEffect(() => {
    if (showCamera) startCamera()
    return () => stopCamera()
  }, [showCamera, startCamera, stopCamera])

  const [showRekap, setShowRekap] = useState(false)
  const [rekapData, setRekapData] = useState<{ tahun: number; total_tahun: number; total_semua: number; rekap: RekapItem[] } | null>(null)
  const [rekapTahun, setRekapTahun] = useState(new Date().getFullYear())

  const fetchData = (p = page) => {
    setLoading(true)
    const params: Record<string, string | number | undefined> = { page: p, per_page: 15 }
    if (filterKategori) params.kategori_id = filterKategori
    if (filterMulai) params.tanggal_mulai = filterMulai
    if (filterSampai) params.tanggal_sampai = filterSampai
    if (search) params.search = search
    pengeluaranApi.list(params)
      .then(res => {
        setData(res.data.data)
        setTotalPages(res.data.last_page)
        setTotalItems(res.data.total)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const fetchKategoris = () => {
    kategoriPengeluaranApi.list().then(res => setKategoris(res.data)).catch(console.error)
  }

  const fetchBranches = () => {
    adminCabangApi.myBranches().then(res => {
      const b = res.data?.data || res.data || []
      setBranches(Array.isArray(b) ? b : [])
    }).catch(console.error)
  }

  useEffect(() => { fetchKategoris(); fetchBranches() }, [])
  useEffect(() => { fetchData(1); setPage(1) }, [filterKategori, filterMulai, filterSampai, search])

  const openCreate = () => {
    setEditItem(null)
    const defaultCabang = branches.length === 1 ? String(branches[0].id) : ''
    setForm({ kategori_id: '', tanggal: new Date().toISOString().split('T')[0], nominal: '', keterangan: '', cabang_id: defaultCabang })
    setBuktiFile(null)
    setBuktiPreview(null)
    setError('')
    setShowForm(true)
  }

  const openEdit = (item: PengeluaranItem) => {
    setEditItem(item)
    setForm({
      kategori_id: String(item.kategori_id),
      tanggal: item.tanggal,
      nominal: String(item.nominal),
      keterangan: item.keterangan || '',
      cabang_id: item.cabang ? String(item.cabang.id) : '',
    })
    setBuktiFile(null)
    setBuktiPreview(item.bukti ? `${APP_URL}/storage/${item.bukti}` : null)
    setError('')
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('kategori_id', form.kategori_id)
      fd.append('tanggal', form.tanggal)
      fd.append('nominal', form.nominal)
      if (form.keterangan) fd.append('keterangan', form.keterangan)
      if (form.cabang_id) fd.append('cabang_id', form.cabang_id)
      if (buktiFile) fd.append('bukti', buktiFile)

      if (editItem) {
        await pengeluaranApi.update(editItem.id, fd)
      } else {
        await pengeluaranApi.store(fd)
      }
      setShowForm(false)
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
      await pengeluaranApi.destroy(deleteItem.id)
      setShowDelete(false)
      setDeleteItem(null)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus')
    } finally {
      setDeleting(false)
    }
  }

  const fetchRekap = () => {
    pengeluaranApi.rekap(rekapTahun).then(res => setRekapData(res.data)).catch(console.error)
  }

  useEffect(() => { if (showRekap) fetchRekap() }, [showRekap, rekapTahun])

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-3 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] border border-blue-100">
            <Wallet size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Data Pengeluaran</h1>
            <p className="text-sm text-slate-500">{totalItems} total pengeluaran</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowRekap(true)}
            className="inline-flex items-center gap-2 rounded-md bg-[#0D1F3C] px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#162d54]"
          >
            <FileText size={16} />
            Rekap Bulanan
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus size={16} />
            Input Pengeluaran
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari keterangan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={filterKategori}
              onChange={e => setFilterKategori(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Semua Kategori</option>
              {kategoris.map(k => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
            <input
              type="date"
              value={filterMulai}
              onChange={e => setFilterMulai(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-slate-400 text-sm">-</span>
            <input
              type="date"
              value={filterSampai}
              onChange={e => setFilterSampai(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <table className="w-full min-w-full border-collapse text-left text-sm text-slate-700">
          <thead className="text-sm text-slate-600">
            <tr>
              <th className="border border-slate-200 px-4 py-3 font-medium">Tanggal</th>
              <th className="border border-slate-200 px-4 py-3 font-medium">Kategori</th>
              <th className="border border-slate-200 px-4 py-3 font-medium">Keterangan</th>
              <th className="border border-slate-200 px-4 py-3 text-right font-medium">Nominal</th>
              <th className="border border-slate-200 px-4 py-3 font-medium">Cabang</th>
              <th className="border border-slate-200 px-4 py-3 text-center font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="border border-slate-200 px-4 py-3">
                    <div className="h-3 bg-slate-200/70 rounded w-full animate-pulse" />
                  </td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={6} className="border border-slate-200 px-6 py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Wallet size={24} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-600">Belum ada pengeluaran</p>
                </td>
              </tr>
            ) : (
              data.map(item => (
                <tr key={item.id} className="bg-white transition hover:bg-slate-50">
                  <td className="border border-slate-200 px-4 py-3 text-sm whitespace-nowrap">
                    {new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="border border-slate-200 px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-1 bg-orange-50 text-orange-700 text-xs font-semibold rounded-lg">
                      {item.kategori?.kode}
                    </span>
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-sm max-w-[200px] truncate">
                    {item.keterangan || '-'}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-right font-semibold text-red-600 whitespace-nowrap">
                    {formatRupiah(item.nominal)}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-slate-500">
                    {item.cabang?.nama_cabang || '-'}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => { setDetailItem(item); setShowDetail(true) }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Detail"
                      >
                        <Eye size={15} />
                      </button>
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

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">Halaman {page} dari {totalPages}</p>
          <div className="flex gap-1">
            <button
              onClick={() => { setPage(p => Math.max(1, p - 1)); fetchData(Math.max(1, page - 1)) }}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); fetchData(Math.min(totalPages, page + 1)) }}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-10 p-3 sm:p-4" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSave}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                <div>
                  <h5 className="font-bold text-gray-900 m-0">
                    {editItem ? 'Edit Pengeluaran' : 'Input Pengeluaran'}
                  </h5>
                  <span className="text-[11px] text-orange-600 font-medium">
                    {editItem ? 'Perbarui data pengeluaran' : 'Catat pengeluaran baru'}
                  </span>
                </div>
                <button type="button" onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
                )}
                {branches.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Cabang <span className="text-red-500">*</span>
                    </label>
                    {branches.length === 1 ? (
                      <input type="hidden" value={form.cabang_id} />
                    ) : (
                      <select
                        required
                        value={form.cabang_id}
                        onChange={e => setForm({ ...form, cabang_id: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      >
                        <option value="">Pilih Cabang</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.nama_cabang}</option>
                        ))}
                      </select>
                    )}
                    {branches.length === 1 && (
                      <p className="text-xs text-slate-500 mt-1">{branches[0].nama_cabang}</p>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={form.kategori_id}
                    onChange={e => setForm({ ...form, kategori_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    <option value="">Pilih Kategori</option>
                    {kategoris.map(k => (
                      <option key={k.id} value={k.id}>{k.nama} ({k.kode})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tanggal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.tanggal}
                    onChange={e => setForm({ ...form, tanggal: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nominal (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.nominal}
                    onChange={e => setForm({ ...form, nominal: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Keterangan</label>
                  <textarea
                    value={form.keterangan}
                    onChange={e => setForm({ ...form, keterangan: e.target.value })}
                    placeholder="Keterangan pengeluaran..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Bukti (opsional)</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCamera(true)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
                    >
                      <Camera size={16} />
                      Ambil Foto
                    </button>
                    <label className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-orange-300 bg-orange-50 text-orange-700 text-sm font-medium hover:bg-orange-100 transition-colors cursor-pointer">
                      <Upload size={16} />
                      Pilih File
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={e => {
                          const f = e.target.files?.[0] || null
                          setBuktiFile(f)
                          if (f && f.type.startsWith('image/')) {
                            setBuktiPreview(URL.createObjectURL(f))
                          } else {
                            setBuktiPreview(null)
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {(buktiPreview || buktiFile) && (
                    <div className="mt-2 relative">
                      {buktiPreview && (
                        <img src={buktiPreview} alt="Preview" className="w-full max-h-40 object-contain rounded-lg border border-slate-200" />
                      )}
                      {!buktiPreview && buktiFile && (
                        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                          <FileText size={16} className="text-slate-400" />
                          <span className="text-xs text-slate-600 truncate">{buktiFile.name}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => { setBuktiFile(null); setBuktiPreview(null) }}
                        className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                    Batal
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                    {saving ? 'Menyimpan...' : editItem ? 'Simpan' : 'Catat'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail && detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowDetail(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl p-5 sm:p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Detail Pengeluaran</h3>
              <button onClick={() => setShowDetail(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal</span>
                <span className="font-medium">{new Date(detailItem.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kategori</span>
                <span className="font-medium px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-xs">{detailItem.kategori?.nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nominal</span>
                <span className="font-bold text-red-600">{formatRupiah(detailItem.nominal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cabang</span>
                <span className="font-medium">{detailItem.cabang?.nama_cabang || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Keterangan</span>
                <span className="font-medium text-right max-w-[200px]">{detailItem.keterangan || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dicatat oleh</span>
                <span className="font-medium">{detailItem.user?.name}</span>
              </div>
              {detailItem.bukti && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-slate-500 mb-2">Bukti:</p>
                  {detailItem.bukti.endsWith('.pdf') ? (
                    <a href={`${APP_URL}/storage/${detailItem.bukti}`} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">Lihat PDF</a>
                  ) : (
                    <img src={`${APP_URL}/storage/${detailItem.bukti}`} alt="Bukti" className="max-w-full rounded-lg border" />
                  )}
                </div>
              )}
            </div>
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
            <h3 className="font-semibold text-gray-900 mb-1">Hapus Pengeluaran</h3>
            <p className="text-sm text-gray-500 mb-2">Yakin ingin menghapus pengeluaran ini?</p>
            <p className="text-sm font-semibold text-red-600 mb-5">
              {formatRupiah(deleteItem.nominal)} - {deleteItem.kategori?.nama}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                {deleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRekap && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-10 p-3 sm:p-4" onClick={() => setShowRekap(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h5 className="font-bold text-gray-900">Rekap Pengeluaran</h5>
              <button onClick={() => setShowRekap(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <label className="text-sm font-medium text-slate-600">Tahun:</label>
                <select
                  value={rekapTahun}
                  onChange={e => setRekapTahun(Number(e.target.value))}
                  className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {rekapData && (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-lg bg-red-50 p-3 text-center">
                      <p className="text-xs text-slate-500 mb-1">Total {rekapData.tahun}</p>
                      <p className="text-lg font-bold text-red-600">{formatRupiah(rekapData.total_tahun)}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3 text-center">
                      <p className="text-xs text-slate-500 mb-1">Total Semua</p>
                      <p className="text-lg font-bold text-slate-700">{formatRupiah(rekapData.total_semua)}</p>
                    </div>
                  </div>

                  {rekapData.rekap.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500 border-b">
                          <th className="pb-2 font-medium">Bulan</th>
                          <th className="pb-2 font-medium text-center">Jumlah</th>
                          <th className="pb-2 font-medium text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rekapData.rekap.map((r, i) => (
                          <tr key={i} className="border-b border-slate-100">
                            <td className="py-2 font-medium">{r.nama_bulan}</td>
                            <td className="py-2 text-center text-slate-500">{r.jumlah} transaksi</td>
                            <td className="py-2 text-right font-semibold text-red-600">{formatRupiah(r.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-sm text-center text-slate-400 py-4">Tidak ada data pengeluaran tahun ini</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4" onClick={() => { stopCamera(); setShowCamera(false) }}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-black rounded-2xl w-full max-w-sm shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-white" />
                <h3 className="text-sm font-semibold text-white">Ambil Foto Bukti</h3>
              </div>
              <button onClick={() => { stopCamera(); setShowCamera(false) }} className="p-1 rounded-lg hover:bg-white/10 text-white">
                <X size={18} />
              </button>
            </div>
            <div className="relative bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-[4/3] object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
              <button
                type="button"
                onClick={switchCamera}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
                title="Ganti kamera"
              >
                <RotateCcw size={18} />
              </button>
              <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/50 text-white text-[10px] font-medium backdrop-blur-sm">
                {facingMode === 'environment' ? 'Kamera Belakang' : 'Kamera Depan'}
              </div>
            </div>
            <div className="flex items-center justify-center gap-6 py-4 bg-slate-900">
              <button
                type="button"
                onClick={() => { stopCamera(); setShowCamera(false) }}
                className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                disabled={!cameraReady}
                className="w-14 h-14 rounded-full bg-white border-4 border-slate-400 hover:border-emerald-400 disabled:opacity-40 transition-all flex items-center justify-center"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500" />
              </button>
              <div className="w-16" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
