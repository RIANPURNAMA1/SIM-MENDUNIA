import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText, Upload, Trash2, Eye, ChevronRight, Download,
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
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-[#5f6368]" aria-label="Breadcrumb">
        <Link to="/" className="flex items-center gap-1 transition-colors hover:text-[#1a73e8]">
          <LayoutDashboard size={13} />
          <span>Beranda</span>
        </Link>
        <ChevronRight size={12} className="text-[#9aa0a6]" />
        <span className="font-medium text-[#3c4043]">Kontrak Kandidat</span>
      </nav>

      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <FileSignature size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Kontrak Kandidat</h1>
            <p className="text-sm text-[#5f6368]">Upload kontrak per cabang — tampil di dashboard siswa sesuai cabangnya</p>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      <form onSubmit={handleUpload} className="mb-4 border border-[#dadce0] bg-white p-4">
        <p className="mb-3 text-sm font-semibold text-[#3c4043]">Upload Kontrak Baru</p>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          <select
            value={form.cabang_id}
            onChange={e => setForm(f => ({ ...f, cabang_id: e.target.value }))}
            className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8]"
          >
            <option value="">Pilih Cabang *</option>
            {cabangs.map(c => <option key={c.id} value={c.id}>{c.nama_cabang}</option>)}
          </select>
          <input
            type="text"
            placeholder="Judul kontrak *"
            value={form.judul}
            onChange={e => setForm(f => ({ ...f, judul: e.target.value }))}
            className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8]"
          />
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="border border-[#dadce0] bg-white px-3 py-1.5 text-sm text-[#5f6368] outline-none file:mr-3 file:border-0 file:bg-[#0E6187]/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#1a73e8]"
          />
          <input
            type="text"
            placeholder="Keterangan (opsional)"
            value={form.keterangan}
            onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))}
            className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8]"
          />
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 bg-[#0E6187] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0a4f6e] disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            {saving ? 'Mengunggah...' : 'Upload Kontrak'}
          </button>
        </div>
      </form>

      {/* Filter */}
      <div className="mb-4 flex flex-col gap-3 border border-[#dadce0] bg-white p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#80868b]" />
          <input
            type="text"
            placeholder="Cari judul atau cabang..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-[#dadce0] bg-white py-2 pl-9 pr-3 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8]"
          />
        </div>
        <select
          value={filterCabang}
          onChange={e => setFilterCabang(e.target.value)}
          className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8]"
        >
          <option value="">Semua Cabang</option>
          {cabangs.map(c => <option key={c.id} value={c.id}>{c.nama_cabang}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-[#dadce0]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div className="rounded-full absolute inset-0 border-2 border-[#1a73e8]/10 border-t-[#1a73e8] animate-spin" />
              <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto max-h-[calc(100vh-420px)] overflow-y-auto">
              <table className="w-full min-w-[900px] border-collapse text-left text-sm text-black">
                <thead className="sticky top-0 z-20">
                  <tr>
                    <th className="text-xs font-medium text-[#5f6368] px-4 py-3 r">No</th>
                    <th className="text-xs font-medium text-[#5f6368] px-4 py-3 r">Tanggal</th>
                    <th className="text-xs font-medium text-[#5f6368] px-4 py-3 r">Judul</th>
                    <th className="text-xs font-medium text-[#5f6368] px-4 py-3 r">Cabang</th>
                    <th className="text-xs font-medium text-[#5f6368] px-4 py-3 r text-center">File Kontrak</th>
                    <th className="text-xs font-medium text-[#5f6368] px-4 py-3 r">Diunggah Oleh</th>
                    <th className="text-xs font-medium text-[#5f6368] px-4 py-3 r text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length > 0 ? (
                    items.map((k, idx) => (
                      <tr key={k.id} className="bg-white transition hover:brightness-[0.97] group">
                        <td className="border-b border-[#e8eaed] border-b border-b px-4 py-3 text-center text-xs font-normal text-black">{idx + 1}</td>
                        <td className="border-b border-[#e8eaed] border-b border-b px-4 py-3 text-xs font-normal text-black whitespace-nowrap">
                          {new Date(k.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="border-b border-[#e8eaed] border-b border-b px-4 py-3 max-w-[250px] overflow-hidden">
                          <div className={`font-semibold truncate ${k.file_kontrak_ttd ? 'text-[#137333]' : 'text-black'}`} title={k.judul}>{k.judul}</div>
                          {k.keterangan && (
                            <span className="truncate block text-xs font-normal text-[#5f6368]" title={k.keterangan}>{k.keterangan}</span>
                          )}
                        </td>
                        <td className="border-b border-[#e8eaed] border-b border-b px-4 py-3 text-xs font-normal text-black whitespace-nowrap">
                          {k.cabang_nama || <span className="text-[#80868b]">-</span>}
                        </td>
                        <td className="border-b border-[#e8eaed] border-b border-b px-4 py-3 text-center whitespace-nowrap">
                          {k.file_kontrak_ttd ? (
                            <a href={fileUrl(k.file_kontrak_ttd)} target="_blank" rel="noreferrer"
                              title={k.ttd_uploaded_at ? `Ditandatangani ${new Date(k.ttd_uploaded_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : undefined}
                              className="inline-flex items-center gap-1.5 border border-[#a8dab5] bg-[#e6f4ea] px-2.5 py-1 text-[11px] font-semibold text-[#137333] transition hover:bg-[#ceead6]">
                              <Download size={11} /> Sudah TTD
                            </a>
                          ) : (
                            <a href={fileUrl(k.file_kontrak)} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1.5 border border-[#fdd663] bg-[#fef7e0] px-2.5 py-1 text-[11px] font-semibold text-[#b06000] transition hover:bg-[#feefc3]">
                              <Eye size={11} /> Lihat PDF
                            </a>
                          )}
                        </td>
                        <td className="border-b border-[#e8eaed] border-b border-b px-4 py-3 text-xs font-normal text-black whitespace-nowrap">
                          {k.uploaded_by || <span className="text-[#80868b]">-</span>}
                        </td>
                        <td className="border-b border-[#e8eaed] border-b border-b px-4 py-3 text-right">
                          <button onClick={() => handleDelete(k)} title="Hapus"
                            className="border border-[#f6aea9] bg-[#fce8e6] p-1.5 text-[#d93025] transition hover:bg-[#f6d7d5]">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]">
                          <FileText size={24} />
                        </div>
                        <p className="mt-3 text-sm font-medium text-[#5f6368]">Tidak ada kontrak ditemukan</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[#dadce0] px-4 py-3 text-sm text-[#5f6368]">
              Menampilkan {items.length} kontrak
            </div>
          </>
        )}
      </div>
    </div>
  )
}
