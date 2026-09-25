import { useState, useEffect, useCallback, useRef } from 'react'
import {
  MapPin, Plus, Edit3, Trash2, X, AlertTriangle, Hash, Search, Globe, Map, Crosshair, CheckCircle, QrCode, Download, Printer, Link2, Unlink, RefreshCw,
} from 'lucide-react'
import { toCanvas } from 'qrcode'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import api, { cabangApi } from '../../services/api'
import type { Cabang } from '../../types'

interface TitikLokasi {
  label: string
  latitude: string
  longitude: string
  radius: string
}

interface CabangForm {
  kode_cabang: string
  nama_cabang: string
  status_pusat: string
  latitude: string
  longitude: string
  radius: string
  locations: TitikLokasi[]
  alamat: string
}

const emptyForm: CabangForm = {
  kode_cabang: '',
  nama_cabang: '',
  status_pusat: 'CABANG',
  latitude: '',
  longitude: '',
  radius: '100',
  locations: [],
  alamat: '',
}

export default function CabangPage() {
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
  const [qrItem, setQrItem] = useState<Cabang | null>(null)
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)
  const printContentRef = useRef<HTMLDivElement>(null)
  const [syncItem, setSyncItem] = useState<Cabang | null>(null)
  const [penempatanList, setPenempatanList] = useState<any[]>([])
  const [penempatanLoading, setPenempatanLoading] = useState(false)
  const [penempatanSearch, setPenempatanSearch] = useState('')
  const [syncing, setSyncing] = useState(false)

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

  useEffect(() => {
    if (qrItem && qrCanvasRef.current && qrItem.barcode) {
      toCanvas(qrCanvasRef.current, qrItem.barcode, {
        width: 200,
        margin: 2,
        color: { dark: '#1e293b', light: '#ffffff' },
      })
    }
  }, [qrItem])

  const handleDownloadQr = () => {
    if (!qrCanvasRef.current || !qrItem) return
    const link = document.createElement('a')
    link.download = `qrcode-${qrItem.kode_cabang || qrItem.id}.png`
    link.href = qrCanvasRef.current.toDataURL('image/png')
    link.click()
  }

  const handleDownloadPdf = async () => {
    if (!qrItem || !printContentRef.current) return
    const canvas = await html2canvas(printContentRef.current, {
      scale: 3,
      backgroundColor: '#ffffff',
    })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(`qrcode-${qrItem.kode_cabang || qrItem.id}.pdf`)
  }

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
      locations: (item.locations || []).map((loc) => ({
        label: loc.label || '',
        latitude: String(loc.latitude ?? ''),
        longitude: String(loc.longitude ?? ''),
        radius: String(loc.radius ?? ''),
      })),
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
      const locations = form.locations
        .filter((loc) => loc.latitude.trim() !== '' && loc.longitude.trim() !== '' && loc.radius.trim() !== '')
        .map((loc) => ({
          label: loc.label.trim() || null,
          latitude: parseFloat(loc.latitude),
          longitude: parseFloat(loc.longitude),
          radius: parseInt(loc.radius),
        }))
      const payload = {
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        radius: parseInt(form.radius),
        locations: locations.length > 0 ? locations : null,
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

  const addLocation = () => {
    setForm((prev) => ({
      ...prev,
      locations: [...prev.locations, { label: '', latitude: '', longitude: '', radius: '100' }],
    }))
  }

  const updateLocation = (idx: number, field: keyof TitikLokasi, value: string) => {
    setForm((prev) => ({
      ...prev,
      locations: prev.locations.map((loc, i) => (i === idx ? { ...loc, [field]: value } : loc)),
    }))
  }

  const removeLocation = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== idx),
    }))
  }

  const getCurrentLocationFor = (idx: number) => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          locations: prev.locations.map((loc, i) =>
            i === idx
              ? { ...loc, latitude: pos.coords.latitude.toString(), longitude: pos.coords.longitude.toString() }
              : loc,
          ),
        }))
      },
      () => {},
    )
  }

  const loadPenempatan = async () => {
    setPenempatanLoading(true)
    setPenempatanSearch('')
    setPenempatanList([])
    try {
      const res = await api.get('/penempatan/cabang')
      const list = Array.isArray(res.data?.data) ? res.data.data : []
      setPenempatanList(list)
    } catch {
      setPenempatanList([])
    } finally {
      setPenempatanLoading(false)
    }
  }

  const openSync = (item: Cabang) => {
    setSyncItem(item)
    loadPenempatan()
  }

  const handleSync = async (pc: any) => {
    if (!syncItem) return
    setSyncing(true)
    try {
      await cabangApi.syncPenempatan(syncItem.id, {
        penempatan_cabang_id: pc.id,
        penempatan_cabang_kode: pc.kode_cabang || pc.kode || pc.code || '',
        penempatan_cabang_nama: pc.nama_cabang,
      })
      showSuccess(`Cabang ${syncItem.nama_cabang} tersinkron dengan ${pc.nama_cabang}`)
      setSyncItem(null)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Gagal sinkronisasi')
    } finally {
      setSyncing(false)
    }
  }

  const handleUnlink = async (item: Cabang) => {
    if (!confirm(`Putus koneksi cabang ${item.nama_cabang} dari Sistem Penempatan?`)) return
    setSyncing(true)
    try {
      await cabangApi.syncPenempatan(item.id, { unlink: true })
      showSuccess(`Koneksi cabang ${item.nama_cabang} diputus`)
      setSyncItem(null)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Gagal memutus koneksi')
    } finally {
      setSyncing(false)
    }
  }

  const filteredPenempatan = penempatanList.filter((pc) => {
    const q = penempatanSearch.toLowerCase().trim()
    if (!q) return true
    return (
      (pc.nama_cabang || '').toLowerCase().includes(q) ||
      (pc.kode_cabang || pc.kode || pc.code || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      {/* Success Alert */}
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

      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] border border-blue-100">
            <MapPin size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Cabang / Lokasi</h1>
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

      {/* Filter */}
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

      {/* Table */}
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
                        <MapPin size={14} className="text-slate-300 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-slate-800 block truncate">{item.nama_cabang}</span>
                          {item.penempatan_cabang_nama ? (
                            <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                              <Link2 size={10} />
                              Penempatan: {item.penempatan_cabang_nama}{item.penempatan_cabang_kode ? ` (${item.penempatan_cabang_kode})` : ''}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5">
                              Belum tersinkron
                            </span>
                          )}
                        </div>
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
                      {item.locations && item.locations.length > 0 && (
                        <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-semibold">
                          +{item.locations.length} titik
                        </span>
                      )}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openSync(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Sinkronkan dengan Sistem Penempatan"
                        >
                          <RefreshCw size={15} />
                        </button>
                        <button
                          onClick={() => { setQrItem(item) }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Lihat QR"
                        >
                          <QrCode size={15} />
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
      </div>

      {/* QR Code Modal */}
      {qrItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setQrItem(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">QR Code Cabang</h3>
              <button onClick={() => setQrItem(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            {qrItem.barcode ? (
              <>
                {/* Print/PDF content */}
                <div ref={printContentRef} className="print-content px-5 py-5 text-center">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <img src="/logo-sm.png" alt="Logo" className="h-9 w-auto" />
                    <div className="text-left">
                      <h2 className="text-lg font-bold text-[#0E6187] tracking-wide leading-tight">ABSENSI MENDUNIA</h2>
                      <p className="text-[10px] text-slate-500">Sistem Informasi Absensi</p>
                    </div>
                  </div>
                  <hr className="border-slate-200 mb-4" />
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-1">QR Code Absensi</p>
                  <p className="text-base font-bold text-[#0E6187] mb-4">{qrItem.nama_cabang}</p>
                  <div className="flex justify-center mb-3">
                    <canvas ref={qrCanvasRef} className="rounded-xl border-2 border-slate-200" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono tracking-wider">{qrItem.barcode}</p>
                  <p className="text-[9px] text-slate-300 mt-4">Scan QR ini untuk melakukan absensi</p>
                </div>

                {/* Action buttons */}
                <div className="px-5 pb-5 flex flex-col gap-2">
                  <button
                    onClick={handleDownloadPdf}
                    className="w-full py-2.5 text-sm font-semibold rounded-xl bg-[#0E6187] text-white hover:bg-[#1a5e6f] transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    Download PDF
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDownloadQr}
                      className="flex-1 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download size={14} />
                      QR PNG
                    </button>
                    <button
                      onClick={() => { window.print() }}
                      className="flex-1 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Printer size={14} />
                      Cetak
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-10 text-center px-5">
                <QrCode size={48} className="text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Cabang ini belum memiliki barcode</p>
                <p className="text-xs text-slate-400 mt-1">Edit cabang untuk menghasilkan barcode secara otomatis</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
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
                    {editItem ? 'Perbarui data cabang' : 'Buat cabang baru'}
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

                <div className="border-t border-dashed border-gray-200 pt-3">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Titik Lokasi Absensi Lainnya
                  </label>
                  <p className="text-[11px] text-gray-400 mb-2">
                    Tambahkan koordinat lain agar absensi juga bisa dilakukan dari titik tersebut.
                  </p>
                  <div className="space-y-2">
                    {form.locations.length === 0 && (
                      <p className="text-[11px] text-gray-400">Belum ada titik lokasi tambahan.</p>
                    )}
                    {form.locations.map((loc, idx) => (
                      <div key={idx} className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500 uppercase">Titik {idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeLocation(idx)}
                            className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Hapus titik"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Latitude</label>
                            <input
                              type="number"
                              step="any"
                              value={loc.latitude}
                              onChange={(e) => updateLocation(idx, 'latitude', e.target.value)}
                              placeholder="-6.2088"
                              className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Longitude</label>
                            <input
                              type="number"
                              step="any"
                              value={loc.longitude}
                              onChange={(e) => updateLocation(idx, 'longitude', e.target.value)}
                              placeholder="106.8456"
                              className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Radius (m)</label>
                            <input
                              type="number"
                              value={loc.radius}
                              onChange={(e) => updateLocation(idx, 'radius', e.target.value)}
                              placeholder="100"
                              className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <input
                            type="text"
                            value={loc.label}
                            onChange={(e) => updateLocation(idx, 'label', e.target.value)}
                            placeholder="Nama titik (opsional), mis. Kantor Lapangan"
                            className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => getCurrentLocationFor(idx)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-600 hover:text-blue-700 transition-colors shrink-0"
                          >
                            <Crosshair size={12} />
                            Gunakan lokasi saat ini
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addLocation}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Plus size={14} />
                    Tambah titik lokasi
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

      {/* Delete Confirmation */}
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

      {/* Sync Penempatan Modal */}
      {syncItem && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-12 p-3 sm:p-4"
          onClick={() => setSyncItem(null)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
              <div>
                <h5 className="font-bold text-gray-900 m-0 flex items-center gap-2">
                  <RefreshCw size={16} className="text-emerald-600" />
                  Sinkronkan Cabang
                </h5>
                <span className="text-[11px] text-slate-500 font-medium">
                  {syncItem.kode_cabang ? `${syncItem.kode_cabang} · ` : ''}{syncItem.nama_cabang}
                </span>
              </div>
              <button
                onClick={() => setSyncItem(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 border-b border-gray-100 shrink-0">
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Cari cabang Sistem Penempatan..."
                  value={penempatanSearch}
                  onChange={(e) => setPenempatanSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Pilih cabang Sistem Penempatan yang sama dengan <strong>{syncItem.nama_cabang}</strong> untuk dikaitkan.
              </p>
              {syncItem.penempatan_cabang_nama && (
                <button
                  onClick={() => handleUnlink(syncItem)}
                  disabled={syncing}
                  className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                >
                  <Unlink size={12} /> Putus koneksi saat ini: {syncItem.penempatan_cabang_nama}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[160px]">
              {penempatanLoading ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <RefreshCw size={20} className="animate-spin text-emerald-600 mb-2" />
                  <p className="text-xs font-medium">Memuat cabang Sistem Penempatan...</p>
                </div>
              ) : filteredPenempatan.length === 0 ? (
                <div className="py-10 text-center">
                  <Globe size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-500">
                    {penempatanSearch ? 'Cabang tidak ditemukan' : 'Belum ada cabang di Sistem Penempatan'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Pastikan Sistem Penempatan dapat diakses.</p>
                </div>
              ) : (
                filteredPenempatan.map((pc) => {
                  const isLinked = syncItem.penempatan_cabang_id === pc.id
                  return (
                    <button
                      key={pc.id}
                      disabled={syncing}
                      onClick={() => handleSync(pc)}
                      className={`w-full text-left flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-all ${
                        isLinked
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40'
                      } disabled:opacity-60`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isLinked ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {isLinked ? <CheckCircle size={17} /> : <MapPin size={17} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {pc.nama_cabang}
                          {(pc.kode_cabang || pc.kode || pc.code) && (
                            <span className="ml-2 text-[10px] font-mono font-bold text-slate-400">
                              {pc.kode_cabang || pc.kode || pc.code}
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {[pc.tipe || pc.status_pusat || pc.status, pc.radius ? `${pc.radius}m` : null].filter(Boolean).join(' · ') || 'Cabang Sistem Penempatan'}
                        </p>
                      </div>
                      <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        isLinked ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {isLinked ? 'Terhubung' : 'Hubungkan'}
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
