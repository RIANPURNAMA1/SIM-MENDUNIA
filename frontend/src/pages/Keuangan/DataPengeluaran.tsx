import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Wallet, Plus, Search, Trash2, X, Eye, Edit3, Filter, FileText, Images, Camera, Upload, RotateCcw,
} from 'lucide-react'
import { pengeluaranApi, kategoriPengeluaranApi, APP_URL } from '../../services/api'
import api from '../../services/api'
import SearchableSelect from '../../components/SearchableSelect'

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

const bulanNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

export default function DataPengeluaran() {
  const [data, setData] = useState<PengeluaranItem[]>([])
  const [kategoris, setKategoris] = useState<Kategori[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const [filterKategori, setFilterKategori] = useState('')
  const [filterCabang, setFilterCabang] = useState('')
  const [filterMulai, setFilterMulai] = useState('')
  const [filterSampai, setFilterSampai] = useState('')
  const [search, setSearch] = useState('')
  const [cabangs, setCabangs] = useState<Cabang[]>([])

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

  const [showRekap, setShowRekap] = useState(false)
  const [rekapData, setRekapData] = useState<{ tahun: number; total_tahun: number; total_semua: number; rekap: RekapItem[] } | null>(null)
  const [rekapTahun, setRekapTahun] = useState(new Date().getFullYear())

  const [showCatatan, setShowCatatan] = useState(false)

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

  const fetchData = (p = page) => {
    setLoading(true)
    const params: Record<string, string | number | undefined> = { page: p, per_page: 15 }
    if (filterKategori) params.kategori_id = filterKategori
    if (filterCabang) params.cabang_id = filterCabang
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

  const fetchCabangs = () => {
    api.get('/cabang').then(res => setCabangs(res.data?.data || [])).catch(console.error)
  }

  useEffect(() => { fetchKategoris(); fetchCabangs() }, [])
  useEffect(() => { fetchData(1); setPage(1) }, [filterKategori, filterCabang, filterMulai, filterSampai, search])

  const openCreate = () => {
    setEditItem(null)
    setForm({ kategori_id: '', tanggal: new Date().toISOString().split('T')[0], nominal: '', keterangan: '', cabang_id: '' })
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
    if (!form.kategori_id) {
      setError('Kategori wajib dipilih')
      return
    }
    if (!form.tanggal || !form.nominal) {
      setError('Tanggal dan nominal wajib diisi')
      return
    }
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
      <div className="mb-4 flex flex-col gap-3 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <Wallet size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Data Pengeluaran</h1>
            <p className="text-sm text-[#5f6368]">{totalItems} total pengeluaran</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowCatatan(!showCatatan)}
            className="inline-flex items-center gap-2 bg-[#0E6187] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#084c63]"
          >
            {showCatatan ? <FileText size={16} /> : <Images size={16} />}
            {showCatatan ? 'Tabel' : 'Catatan'}
          </button>
          <button
            onClick={() => setShowRekap(true)}
            className="inline-flex items-center gap-2 bg-[#0E6187] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#084c63]"
          >
            <FileText size={16} />
            Rekap Bulanan
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-[#0E6187] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#084c63]"
          >
            <Plus size={16} />
            Input Pengeluaran
          </button>
        </div>
      </div>

      <div className="mb-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#80868b]" />
            <input
              type="text"
              placeholder="Cari keterangan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-[#dadce0] bg-white py-2 pl-9 pr-3 text-sm text-[#3c4043] outline-none transition placeholder:text-[#80868b] focus:border-[#1a73e8]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={14} className="text-[#80868b]" />
            <select
              value={filterKategori}
              onChange={e => setFilterKategori(e.target.value)}
              className="border border-[#dadce0] bg-white px-2 py-2 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8]"
            >
              <option value="">Semua Kategori</option>
              {kategoris.map(k => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
            {cabangs.length > 0 && (
              <select
                value={filterCabang}
                onChange={e => setFilterCabang(e.target.value)}
                className="border border-[#dadce0] bg-white px-2 py-2 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8]"
              >
                <option value="">Semua Cabang</option>
                {cabangs.map(c => (
                  <option key={c.id} value={c.id}>{c.nama_cabang}</option>
                ))}
              </select>
            )}
            <input
              type="date"
              value={filterMulai}
              onChange={e => setFilterMulai(e.target.value)}
              className="border border-[#dadce0] bg-white px-2 py-2 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8]"
              placeholder="Dari tanggal"
            />
            <span className="text-[#80868b] text-sm">-</span>
            <input
              type="date"
              value={filterSampai}
              onChange={e => setFilterSampai(e.target.value)}
              className="border border-[#dadce0] bg-white px-2 py-2 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8]"
              placeholder="Sampai tanggal"
            />
          </div>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        {!showCatatan ? (
        <table className="w-full min-w-full border-collapse text-left text-sm text-[#3c4043]">
          <thead className="text-sm text-[#5f6368]">
            <tr>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Tanggal</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Kategori</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Keterangan</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-right">Nominal</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Cabang</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Oleh</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="h-3 bg-[#e8eaed] w-full animate-pulse" />
                  </td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]">
                    <Wallet size={24} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-[#5f6368]">Belum ada pengeluaran</p>
                </td>
              </tr>
            ) : (
              data.map(item => (
                <tr key={item.id} className="bg-white transition hover:bg-[#f8f9fa]">
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-sm whitespace-nowrap">
                    {new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="border-b border-[#e8eaed] px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-1 bg-[#fef7e0] text-[#b06000] text-xs font-semibold">
                      {item.kategori?.kode}
                    </span>
                  </td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-sm max-w-[200px] truncate">
                    {item.keterangan || '-'}
                  </td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-right font-semibold text-[#c5221f] whitespace-nowrap">
                    {formatRupiah(item.nominal)}
                  </td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-sm text-[#5f6368]">
                    {item.cabang?.nama_cabang || '-'}
                  </td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-sm text-[#5f6368]">
                    {item.user?.name}
                  </td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => { setDetailItem(item); setShowDetail(true) }}
                        className="p-1.5 text-[#80868b] hover:text-[#1a73e8] hover:bg-[#e8f0fe] transition-colors"
                        title="Detail"
                      >
                        <Eye size={15} />
                      </button>
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
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-[#dadce0] overflow-hidden animate-pulse">
                <div className="h-40 bg-[#e8eaed]" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-[#e8eaed] w-1/3" />
                  <div className="h-4 bg-[#e8eaed] w-1/2" />
                  <div className="h-3 bg-[#e8eaed] w-2/3" />
                </div>
              </div>
            ))
          ) : data.length === 0 ? (
            <div className="col-span-full text-center py-10 text-sm text-[#80868b]">Belum ada catatan</div>
          ) : (
            data.map(item => (
              <div key={item.id} className="border border-[#dadce0] overflow-hidden hover: transition-shadow bg-white">
                {item.bukti ? (
                  item.bukti.endsWith('.pdf') ? (
                    <a href={`${APP_URL}/storage/${item.bukti}`} target="_blank" rel="noreferrer" className="block h-40 bg-[#f1f3f4] flex items-center justify-center">
                      <FileText size={32} className="text-[#80868b]" />
                    </a>
                  ) : (
                    <img
                      src={`${APP_URL}/storage/${item.bukti}`}
                      alt="Bukti"
                      className="w-full h-40 object-cover cursor-pointer"
                      onClick={() => { setDetailItem(item); setShowDetail(true) }}
                    />
                  )
                ) : (
                  <div className="h-40 bg-[#f1f3f4] flex items-center justify-center">
                    <Wallet size={32} className="text-[#80868b]" />
                  </div>
                )}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="inline-flex px-2 py-0.5 bg-[#fef7e0] text-[#b06000] text-[10px] font-semibold">
                      {item.kategori?.kode}
                    </span>
                    <span className="text-xs text-[#80868b]">
                      {new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#c5221f] mt-1">{formatRupiah(item.nominal)}</p>
                  <p className="text-xs text-[#5f6368] mt-1 truncate">{item.keterangan || 'Tanpa keterangan'}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#e8eaed]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-[#0E6187] flex items-center justify-center text-[10px] font-medium text-white">
                        {item.user?.name?.charAt(0)}
                      </div>
                      <span className="text-xs text-[#5f6368]">{item.user?.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1 text-[#80868b] hover:text-[#1a73e8] hover:bg-[#e8f0fe] transition-colors"
                        title="Edit"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => { setDeleteItem(item); setShowDelete(true) }}
                        className="p-1 text-[#80868b] hover:text-[#c5221f] hover:bg-[#fce8e6] transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-[#5f6368]">Halaman {page} dari {totalPages}</p>
          <div className="flex gap-1">
            <button
              onClick={() => { setPage(p => Math.max(1, p - 1)); fetchData(Math.max(1, page - 1)) }}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm border border-[#dadce0] text-[#5f6368] hover:bg-[#f8f9fa] disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); fetchData(Math.min(totalPages, page + 1)) }}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm border border-[#dadce0] text-[#5f6368] hover:bg-[#f8f9fa] disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-10 p-3 sm:p-4" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-[#202124]" />
          <div className="border border-[#dadce0] relative bg-white w-full max-w-md shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)]" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSave}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8eaed] sticky top-0 bg-white z-10">
                <div>
                  <h5 className="text-base font-medium text-[#202124] m-0">
                    {editItem ? 'Edit Pengeluaran' : 'Input Pengeluaran'}
                  </h5>
                  <span className="text-[11px] text-[#b06000] font-medium">
                    {editItem ? 'Perbarui data pengeluaran' : 'Catat pengeluaran baru'}
                  </span>
                </div>
                <button type="button" onClick={() => setShowForm(false)} className="p-1.5 hover:bg-[#f1f3f4] text-[#80868b]">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                {error && (
                  <div className="p-3 bg-[#fce8e6] border border-[#f28b82] text-sm text-[#c5221f]">{error}</div>
                )}
                {cabangs.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-[#3c4043] mb-1">Cabang</label>
                    <select
                      value={form.cabang_id}
                      onChange={e => setForm({ ...form, cabang_id: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-[#e37400] focus:border-[#e37400]"
                    >
                      <option value="">Pilih Cabang (Opsional)</option>
                      {cabangs.map(c => (
                        <option key={c.id} value={c.id}>{c.nama_cabang}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-[#3c4043] mb-1">
                    Kategori <span className="text-[#d93025]">*</span>
                  </label>
                  <SearchableSelect
                    value={form.kategori_id}
                    onChange={v => setForm({ ...form, kategori_id: v })}
                    options={kategoris.map(k => ({ id: k.id, label: `${k.nama} (${k.kode})` }))}
                    placeholder="Pilih Kategori"
                    searchPlaceholder="Cari kategori..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3c4043] mb-1">
                    Tanggal <span className="text-[#d93025]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.tanggal}
                    onChange={e => setForm({ ...form, tanggal: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-[#e37400] focus:border-[#e37400]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3c4043] mb-1">
                    Nominal (Rp) <span className="text-[#d93025]">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.nominal}
                    onChange={e => setForm({ ...form, nominal: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-[#e37400] focus:border-[#e37400]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3c4043] mb-1">Keterangan</label>
                  <textarea
                    value={form.keterangan}
                    onChange={e => setForm({ ...form, keterangan: e.target.value })}
                    placeholder="Keterangan pengeluaran..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-[#e37400] focus:border-[#e37400] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3c4043] mb-1">Bukti (opsional)</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCamera(true)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-[#1a73e8] bg-[#e8f0fe] text-[#1967d2] text-sm font-medium hover:bg-[#e8f0fe] transition-colors"
                    >
                      <Camera size={16} />
                      Ambil Foto
                    </button>
                    <label className="flex-1 flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-[#fdd663] bg-[#fef7e0] text-[#b06000] text-sm font-medium hover:bg-[#fef7e0] transition-colors cursor-pointer">
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
                        <img src={buktiPreview} alt="Preview" className="w-full max-h-40 object-contain border border-[#dadce0]" />
                      )}
                      {!buktiPreview && buktiFile && (
                        <div className="flex items-center gap-2 p-2 bg-[#f8f9fa] border border-[#dadce0]">
                          <FileText size={16} className="text-[#80868b]" />
                          <span className="text-xs text-[#5f6368] truncate">{buktiFile.name}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => { setBuktiFile(null); setBuktiPreview(null) }}
                        className="absolute top-1 right-1 p-1 bg-[#d93025] text-white hover:bg-[#c5221f] transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 text-sm font-medium border border-[#dadce0] text-[#5f6368] hover:bg-[#f8f9fa] transition-colors">
                    Batal
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 text-sm font-medium bg-[#0E6187] text-white hover:bg-[#084c63] disabled:opacity-50 transition-colors">
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
          <div className="absolute inset-0 bg-[#202124]" />
          <div className="border border-[#dadce0] relative bg-white w-full max-w-md shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] p-5 sm:p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-[#202124]">Detail Pengeluaran</h3>
              <button onClick={() => setShowDetail(false)} className="p-1.5 hover:bg-[#f1f3f4] text-[#80868b]">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#5f6368]">Tanggal</span>
                <span className="font-medium">{new Date(detailItem.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5f6368]">Kategori</span>
                <span className="font-medium px-2 py-0.5 bg-[#fef7e0] text-[#b06000] text-xs">{detailItem.kategori?.nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5f6368]">Nominal</span>
                <span className="font-medium text-[#c5221f]">{formatRupiah(detailItem.nominal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5f6368]">Cabang</span>
                <span className="font-medium">{detailItem.cabang?.nama_cabang || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5f6368]">Keterangan</span>
                <span className="font-medium text-right max-w-[200px]">{detailItem.keterangan || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5f6368]">Dicatat oleh</span>
                <span className="font-medium">{detailItem.user?.name}</span>
              </div>
              {detailItem.bukti && (
                <div className="pt-2 border-t border-[#e8eaed]">
                  <p className="text-[#5f6368] mb-2">Bukti:</p>
                  {detailItem.bukti.endsWith('.pdf') ? (
                    <a href={`${APP_URL}/storage/${detailItem.bukti}`} target="_blank" rel="noreferrer" className="text-[#1a73e8] underline text-sm">Lihat PDF</a>
                  ) : (
                    <img src={`${APP_URL}/storage/${detailItem.bukti}`} alt="Bukti" className="max-w-full border" />
                  )}
                </div>
              )}
            </div>
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
            <h3 className="font-semibold text-[#202124] mb-1">Hapus Pengeluaran</h3>
            <p className="text-sm text-[#5f6368] mb-2">
              Yakin ingin menghapus pengeluaran ini?
            </p>
            <p className="text-sm font-semibold text-[#c5221f] mb-5">
              {formatRupiah(deleteItem.nominal)} - {deleteItem.kategori?.nama}
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

      {showRekap && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-10 p-3 sm:p-4" onClick={() => setShowRekap(false)}>
          <div className="absolute inset-0 bg-[#202124]" />
          <div className="border border-[#dadce0] relative bg-white w-full max-w-lg shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8eaed]">
              <h5 className="text-base font-medium text-[#202124]">Rekap Pengeluaran</h5>
              <button onClick={() => setShowRekap(false)} className="p-1.5 hover:bg-[#f1f3f4] text-[#80868b]">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <label className="text-sm font-medium text-[#5f6368]">Tahun:</label>
                <select
                  value={rekapTahun}
                  onChange={e => setRekapTahun(Number(e.target.value))}
                  className="border border-[#dadce0] px-2 py-1.5 text-sm"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {rekapData && (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-[#fce8e6] p-3 text-center">
                      <p className="text-xs text-[#5f6368] mb-1">Total {rekapData.tahun}</p>
                      <p className="text-lg font-medium text-[#c5221f]">{formatRupiah(rekapData.total_tahun)}</p>
                    </div>
                    <div className="bg-[#f8f9fa] p-3 text-center">
                      <p className="text-xs text-[#5f6368] mb-1">Total Semua</p>
                      <p className="text-lg font-medium text-[#3c4043]">{formatRupiah(rekapData.total_semua)}</p>
                    </div>
                  </div>

                  {rekapData.rekap.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[#5f6368] border-b">
                          <th className="text-xs font-medium text-[#5f6368] pb-2">Bulan</th>
                          <th className="text-xs font-medium text-[#5f6368] pb-2 text-center">Jumlah</th>
                          <th className="text-xs font-medium text-[#5f6368] pb-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rekapData.rekap.map(r => (
                          <tr key={r.bulan} className="border-b border-[#e8eaed]">
                            <td className="py-2 font-medium">{r.nama_bulan}</td>
                            <td className="py-2 text-center text-[#5f6368]">{r.jumlah} transaksi</td>
                            <td className="py-2 text-right font-semibold text-[#c5221f]">{formatRupiah(r.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-sm text-center text-[#80868b] py-4">Tidak ada data pengeluaran tahun ini</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4" onClick={() => { stopCamera(); setShowCamera(false) }}>
          <div className="absolute inset-0 bg-[#202124]" />
          <div className="border border-[#dadce0] relative bg-black w-full max-w-sm shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 bg-[#202124]">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-white" />
                <h3 className="text-sm font-semibold text-white">Ambil Foto Bukti</h3>
              </div>
              <button onClick={() => { stopCamera(); setShowCamera(false) }} className="p-1 hover:bg-white/10 text-white">
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
                className="absolute top-3 right-3 p-2 bg-[#202124] text-white hover:bg-[#084c63] transition-colors backdrop-blur-sm"
                title="Ganti kamera"
              >
                <RotateCcw size={18} />
              </button>
              <div className="absolute bottom-3 left-3 px-2 py-1 bg-[#202124] text-white text-[10px] font-medium backdrop-blur-sm">
                {facingMode === 'environment' ? 'Kamera Belakang' : 'Kamera Depan'}
              </div>
            </div>
            <div className="flex items-center justify-center gap-6 py-4 bg-[#202124]">
              <button
                type="button"
                onClick={() => { stopCamera(); setShowCamera(false) }}
                className="px-4 py-2 bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                disabled={!cameraReady}
                className="w-14 h-14 bg-white border-4 border-[#bdc1c6] hover:border-[#81c995] disabled:opacity-40 transition-all flex items-center justify-center"
              >
                <div className="w-10 h-10 bg-[#0E6187]" />
              </button>
              <div className="w-16" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
