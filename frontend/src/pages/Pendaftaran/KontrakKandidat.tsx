import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText, Upload, Trash2, Eye, ChevronRight,
  LayoutDashboard, Loader2, FileSignature, Search,
} from 'lucide-react'
import Swal from 'sweetalert2'
import { kontrakApi, cabangApi, APP_URL } from '../../services/api'

interface KontrakItem {
  id: number
  judul: string
  cabang_id: number
  cabang_nama: string | null
  file_kontrak: string
  file_kontrak_ttd: string | null
  ttd_uploaded_at: string | null
  keterangan: string | null
  uploaded_by: string | null
  ttd_count?: number
  ttds?: Array<{
    id: number
    pendaftar_nama: string | null
    no_registrasi: string | null
    file_ttd: string
    uploaded_at: string
  }>
  created_at: string
}

export default function KontrakKandidat() {
  const [items, setItems] = useState<KontrakItem[]>([])
  const [cabangs, setCabangs] = useState<Array<{ id: number; nama_cabang: string }>>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCabang, setFilterCabang] = useState('')
  const [form, setForm] = useState({ cabang_id: '', judul: '', keterangan: '' })
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    Promise.all([
      kontrakApi.list({ search: search || undefined, cabang_id: filterCabang || undefined }),
      cabangApi.list().catch(() => ({ data: [] })),
    ])
      .then(([res, cabRes]) => {
        setItems(res.data)
        const raw = Array.isArray(cabRes.data) ? cabRes.data : cabRes.data?.data || []
        setCabangs(raw.map((c: any) => ({ id: c.id, nama_cabang: c.nama_cabang })))
      })
      .finally(() => setLoading(false))
  }, [search, filterCabang])

  useEffect(() => { fetchData() }, [fetchData])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.cabang_id || !form.judul.trim() || !file) {
      Swal.fire({ icon: 'warning', title: 'Lengkapi Data', text: 'Pilih cabang, isi judul, dan pilih file PDF kontrak.', confirmButtonColor: '#0E6187' })
      return
    }
    const fd = new FormData()
    fd.append('cabang_id', form.cabang_id)
    fd.append('judul', form.judul)
    fd.append('keterangan', form.keterangan)
    fd.append('file', file)
    setSaving(true)
    try {
      await kontrakApi.store(fd)
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Kontrak berhasil diunggah.', confirmButtonColor: '#0E6187', timer: 2000, timerProgressBar: true, showConfirmButton: false })
      setForm({ cabang_id: '', judul: '', keterangan: '' })
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      fetchData()
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err?.response?.data?.message || 'Gagal mengunggah kontrak.', confirmButtonColor: '#0E6187' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (k: KontrakItem) => {
    Swal.fire({
      title: 'Hapus Kontrak?',
      text: `"${k.judul}" (${k.cabang_nama}) akan dihapus permanen.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await kontrakApi.destroy(k.id)
          Swal.fire({ icon: 'success', title: 'Terhapus!', timer: 1500, showConfirmButton: false })
          fetchData()
        } catch {
          Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menghapus kontrak.', confirmButtonColor: '#0E6187' })
        }
      }
    })
  }

  const fileUrl = (f: string) => `${APP_URL}/storage/${f}`

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-slate-500" aria-label="Breadcrumb">
        <Link to="/" className="flex items-center gap-1 transition-colors hover:text-[#0E6187]">
          <LayoutDashboard size={13} />
          <span>Beranda</span>
        </Link>
        <ChevronRight size={12} className="text-slate-300" />
        <span className="font-medium text-slate-700">Kontrak Kandidat</span>
      </nav>

      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-100 bg-[#0E6187]">
            <FileSignature size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Kontrak Kandidat</h1>
            <p className="text-sm text-slate-500">Upload kontrak per cabang — tampil di dashboard siswa sesuai cabangnya</p>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      <form onSubmit={handleUpload} className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-slate-700">Upload Kontrak Baru</p>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          <select
            value={form.cabang_id}
            onChange={e => setForm(f => ({ ...f, cabang_id: e.target.value }))}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#0E6187] focus:ring-1 focus:ring-[#0E6187]"
          >
            <option value="">Pilih Cabang *</option>
            {cabangs.map(c => <option key={c.id} value={c.id}>{c.nama_cabang}</option>)}
          </select>
          <input
            type="text"
            placeholder="Judul kontrak *"
            value={form.judul}
            onChange={e => setForm(f => ({ ...f, judul: e.target.value }))}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#0E6187] focus:ring-1 focus:ring-[#0E6187]"
          />
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 outline-none file:mr-3 file:rounded-md file:border-0 file:bg-[#0E6187]/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#0E6187]"
          />
          <input
            type="text"
            placeholder="Keterangan (opsional)"
            value={form.keterangan}
            onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#0E6187] focus:ring-1 focus:ring-[#0E6187]"
          />
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0E6187] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0a4f6e] disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            {saving ? 'Mengunggah...' : 'Upload Kontrak'}
          </button>
        </div>
      </form>

      {/* Filter */}
      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari judul atau cabang..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-[#0E6187] focus:ring-1 focus:ring-[#0E6187]"
          />
        </div>
        <select
          value={filterCabang}
          onChange={e => setFilterCabang(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#0E6187] focus:ring-1 focus:ring-[#0E6187]"
        >
          <option value="">Semua Cabang</option>
          {cabangs.map(c => <option key={c.id} value={c.id}>{c.nama_cabang}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">No</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Judul</th>
              <th className="px-4 py-3">Cabang</th>
              <th className="px-4 py-3">File Kontrak</th>
              <th className="px-4 py-3">Diunggah Oleh</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center"><Loader2 size={28} className="mx-auto animate-spin text-[#0E6187]" /></td></tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <FileText size={24} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-600">Belum ada kontrak diunggah</p>
                </td>
              </tr>
            ) : (
              items.map((k, idx) => (
                <tr key={k.id} className="border-b border-slate-100 transition hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                    {new Date(k.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{k.judul}</p>
                    {k.keterangan && <p className="text-xs text-slate-400">{k.keterangan}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{k.cabang_nama || '-'}</td>
                  <td className="px-4 py-3">
                    <a href={fileUrl(k.file_kontrak)} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
                      <Eye size={13} /> Lihat PDF
                    </a>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{k.uploaded_by || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(k)} title="Hapus"
                      className="rounded-md border border-red-200 bg-red-50 p-1.5 text-red-500 transition hover:bg-red-100">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
