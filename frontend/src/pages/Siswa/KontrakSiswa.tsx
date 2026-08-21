import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  FileSignature, FileText, Download, Upload, Loader2,
  ChevronRight, LayoutDashboard, CheckCircle, Clock, Eye,
  BookOpen, CalendarCheck, Wallet, User,
} from 'lucide-react'
import Swal from 'sweetalert2'
import { kontrakApi, APP_URL } from '../../services/api'

interface KontrakItem {
  id: number
  judul: string
  cabang_nama: string | null
  file_kontrak: string
  keterangan: string | null
  created_at: string
  my_ttd?: {
    file_ttd: string
    uploaded_at: string
  } | null
}

export default function KontrakSiswa() {
  const [items, setItems] = useState<KontrakItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<number | null>(null)
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({})
  const location = useLocation()

  const bottomNav = [
    { label: 'Dashboard', to: '/siswa-dashboard', icon: LayoutDashboard },
    { label: 'LMS', to: '/siswa-dashboard/lms', icon: BookOpen },
    { label: 'Absensi', to: '/siswa-dashboard/absensi', icon: CalendarCheck },
    { label: 'Pembayaran', to: '/siswa-dashboard/pembayaran', icon: Wallet },
    { label: 'Profil', to: '/siswa-dashboard/profil', icon: User },
  ]

  const fetchData = () => {
    setLoading(true)
    kontrakApi.siswa()
      .then(res => setItems(res.data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const handleUpload = (k: KontrakItem) => {
    const input = fileRefs.current[k.id]
    if (!input) return
    input.click()
  }

  const onFilePicked = async (k: KontrakItem, file: File | null) => {
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    setUploadingId(k.id)
    try {
      await kontrakApi.uploadTtd(k.id, fd)
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Kontrak yang sudah ditandatangani berhasil diunggah.', confirmButtonColor: '#0E6187', timer: 2000, timerProgressBar: true, showConfirmButton: false })
      fetchData()
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err?.response?.data?.message || 'Gagal mengunggah kontrak.', confirmButtonColor: '#0E6187' })
    } finally {
      setUploadingId(null)
      if (fileRefs.current[k.id]) fileRefs.current[k.id]!.value = ''
    }
  }

  const fileUrl = (f: string) => `${APP_URL}/storage/${f}`

  const handleDownload = async (url: string, filename: string) => {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(link.href)
    } catch {
      window.open(url, '_blank')
    }
  }

  const downloadName = (f: string) => f.split('/').pop() || 'kontrak.pdf'

  return (
    <div className="min-h-screen bg-[#f0f2f5] pb-24">
      {/* Header */}
      <header className="bg-[#0E6187] px-4 pb-10 pt-5 text-white">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Kontrak</h1>
              <p className="mt-0.5 text-[13px] text-teal-100">Dokumen kontrak dari cabang kamu</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
              <FileSignature size={22} />
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <nav className="mx-auto -mt-6 mb-4 max-w-lg px-4" aria-label="Breadcrumb">
        <div className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs text-slate-500 shadow-sm">
          <Link to="/siswa-dashboard" className="flex items-center gap-1 transition-colors hover:text-[#0E6187]">
            <LayoutDashboard size={12} />
            <span>Dashboard</span>
          </Link>
          <ChevronRight size={11} className="text-slate-300" />
          <span className="font-medium text-slate-700">Kontrak</span>
        </div>
      </nav>

      <main className="mx-auto max-w-lg space-y-3 px-4">
        {loading ? (
          <div className="rounded-xl bg-white p-10 shadow-sm">
            <Loader2 size={28} className="mx-auto animate-spin text-[#0E6187]" />
            <p className="mt-3 text-center text-sm text-slate-500">Memuat kontrak...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <FileText size={26} />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-600">Belum ada kontrak</p>
            <p className="mt-1 text-xs text-slate-400">Kontrak akan muncul di sini setelah diunggah oleh admin cabang kamu.</p>
          </div>
        ) : (
          items.map(k => (
            <div key={k.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">{k.judul}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {new Date(k.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {k.cabang_nama ? ` · ${k.cabang_nama}` : ''}
                    </p>
                  </div>
                  {k.my_ttd ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                      <CheckCircle size={11} /> Terunggah
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                      <Clock size={11} /> Belum Ditandatangani
                    </span>
                  )}
                </div>
                {k.keterangan && <p className="mt-1.5 text-xs text-slate-500">{k.keterangan}</p>}
              </div>
              <div className="flex items-center gap-2 px-4 py-3">
                <a
                  href={fileUrl(k.file_kontrak)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <Eye size={13} /> Lihat Kontrak
                </a>
                <button
                  onClick={() => handleDownload(fileUrl(k.file_kontrak), downloadName(k.file_kontrak))}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <Download size={13} /> Unduh
                </button>
                <button
                  onClick={() => handleUpload(k)}
                  disabled={uploadingId === k.id}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white transition disabled:opacity-50 ${
                    k.my_ttd ? 'bg-slate-500 hover:bg-slate-600' : 'bg-[#0E6187] hover:bg-[#0a4f6e]'
                  }`}
                >
                  {uploadingId === k.id ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  {uploadingId === k.id ? 'Mengunggah...' : 'Upload TTD'}
                </button>
                <input
                  ref={el => { fileRefs.current[k.id] = el }}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  className="hidden"
                  onChange={e => onFilePicked(k, e.target.files?.[0] || null)}
                />
              </div>
              {k.my_ttd && (
                <div className="flex items-center justify-between border-t border-emerald-50 bg-emerald-50/50 px-4 py-2">
                  <span className="text-[11px] text-emerald-700">
                    Diunggah {k.my_ttd.uploaded_at ? new Date(k.my_ttd.uploaded_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  </span>
                  <a href={fileUrl(k.my_ttd.file_ttd)} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline">
                    <Download size={11} /> Lihat versi TTD
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </main>

      {/* Bottom Nav Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {bottomNav.map(nav => {
            const Icon = nav.icon
            const isActive = nav.to === location.pathname
            return (
              <Link
                key={nav.label}
                to={nav.to}
                className={`flex flex-col items-center gap-1 py-2.5 transition ${
                  isActive ? 'text-[#0E6187]' : 'text-slate-400'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                <span className="text-[10px] font-medium">{nav.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
