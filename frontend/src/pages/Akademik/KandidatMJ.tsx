import { useState, useEffect, useMemo } from 'react'
import {
  Upload, Download, Sparkles, Filter, Trash2, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, User, Eye, X, RefreshCw, Loader2,
  UserRound, Phone, Mail, MapPin, GraduationCap, Briefcase, HeartPulse, Users, FileText, BadgeCheck, Plane, Stethoscope, Languages, Goal,
} from 'lucide-react'
import api from '../../services/api'

interface Kandidat {
  id: number
  nama_katakana: string | null
  nama_romaji: string | null
  tempat_lahir: string | null
  tanggal_lahir: string | null
  umur: number | null
  jenis_kelamin: string | null
  status_pernikahan: string | null
  jumlah_anak: number | null
  agama: string | null
  tinggi_badan: number | null
  berat_badan: number | null
  golongan_darah: string | null
  nomor_hp: string | null
  email_kontak: string | null
  alamat_lengkap: string | null
  pendidikan_terakhir: string | null
  level_jlpt: string | null
  level_jft: string | null
  sertifikat_ssw: string | null
  level_bahasa_jepang: string | null
  status_formulir: string | null
  status_progres: string | null
  status_keberangkatan: string | null
  nama_perusahaan: string | null
  bidang_ssw: string | null
  institusi: string | null
  created_at: string | null
  updated_at: string | null
  nama_cabang: string | null
  [key: string]: unknown
}

interface Pendidikan { jenjang?: string; nama_sekolah?: string; jurusan?: string; bulan_masuk?: string; tahun_masuk?: number; bulan_lulus?: string; tahun_lulus?: number }
interface Pengalaman { nama_perusahaan?: string; alamat_perusahaan?: string; posisi?: string; bulan_masuk?: string; tahun_masuk?: number; bulan_keluar?: string; tahun_keluar?: number; masih_bekerja?: number; deskripsi_pekerjaan?: string }
interface Keluarga { hubungan?: string; nama?: string; usia?: number; pekerjaan?: string; penghasilan?: string }
interface Dokumen { jenis_dokumen?: string; nama_file?: string; file_url?: string; mime_type?: string; ukuran_file?: number }

interface Pagination {
  total: number
  page: number
  limit: number
  total_pages: number
}

const avatarColors = ['bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-purple-100 text-purple-700', 'bg-rose-100 text-rose-700', 'bg-sky-100 text-sky-700']

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('')
}

function yesNo(v: unknown) {
  if (v === 1 || v === '1') return 'Ya'
  if (v === 0 || v === '0') return 'Tidak'
  return '-'
}

const STATUS_PROGRES_COLOR: Record<string, string> = {
  'berangkat': 'bg-emerald-50 text-emerald-700',
  'berangkat ke jepang': 'bg-emerald-50 text-emerald-700',
  'seleksi': 'bg-blue-50 text-blue-700',
  'interview': 'bg-blue-50 text-blue-700',
  'mensetsu': 'bg-blue-50 text-blue-700',
  'lamar ke perusahaan': 'bg-amber-50 text-amber-700',
  'belum diproses': 'bg-slate-100 text-slate-600',
}

export default function KandidatMJ() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [cabangFilter, setCabangFilter] = useState('')
  const [progresFilter, setProgresFilter] = useState('')
  const [screening, setScreening] = useState('Semua')
  const [showScreening, setShowScreening] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const [items, setItems] = useState<Kandidat[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [detail, setDetail] = useState<Kandidat | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailFoto, setDetailFoto] = useState<string | null>(null)

  const fetchData = async (resetPage = false) => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, unknown> = {
        page: resetPage ? 1 : page,
        limit: perPage,
      }
      if (search.trim()) params.search = search.trim()
      if (statusFilter) params.status = statusFilter
      if (cabangFilter) params.cabang_id = cabangFilter
      if (progresFilter) params.status_progres = progresFilter

      const res = await api.get('/penempatan/kandidat', { params })
      const data = res.data
      if (!data?.success) {
        setError(data?.message || 'Gagal mengambil data kandidat')
        setItems([])
        setPagination(null)
        return
      }
      setItems(data.data || [])
      setPagination(data.pagination || null)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal terhubung ke Sistem Penempatan')
      setItems([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }

  const openDetail = async (id: number) => {
    setDetailLoading(true)
    setDetailFoto(null)
    setDetail(null)
    try {
      const res = await api.get(`/penempatan/kandidat/${id}`)
      if (res.data?.success) {
        setDetail(res.data.data)
        const doc: Dokumen[] = res.data.data?.dokumen || []
        const foto = doc.find(x => (x.jenis_dokumen || '').toLowerCase() === 'pas_foto')
        if (foto?.file_url) setDetailFoto(foto.file_url)
      } else {
        setDetail({ id, nama_romaji: null, nama_katakana: null, nama_cabang: null, status_progres: null, status_formulir: null })
      }
    } catch (err: any) {
      setDetail({ id, nama_romaji: err?.response?.data?.message || 'Gagal memuat detail', nama_katakana: null, nama_cabang: null, status_progres: null, status_formulir: null })
    } finally {
      setDetailLoading(false)
    }
  }

  const totalItems = pagination?.total ?? 0
  const totalPages = pagination?.total_pages ?? Math.max(1, Math.ceil(items.length / perPage))
  const safePage = Math.min(page, totalPages)
  const from = totalItems === 0 ? 0 : (safePage - 1) * perPage + 1
  const to = Math.min(safePage * perPage, totalItems)

  const cabangs = useMemo(() => {
    const set = new Set<string>()
    items.forEach(i => { if (i.nama_cabang) set.add(i.nama_cabang) })
    return Array.from(set)
  }, [items])

  const statuses = useMemo(() => {
    const set = new Set<string>()
    items.forEach(i => { if (i.status_progres) set.add(i.status_progres) })
    return Array.from(set)
  }, [items])

  const pageNumbers = useMemo(() => {
    const pages: (number | '...')[] = []
    const add = (p: number) => { if (p >= 1 && p <= totalPages && !pages.includes(p)) pages.push(p) }
    add(1)
    if (totalPages > 1) add(2)
    if (safePage > 3) pages.push('...')
    for (let p = Math.max(3, safePage - 1); p <= Math.min(totalPages - 2, safePage + 1); p++) add(p)
    if (safePage < totalPages - 2) pages.push('...')
    if (totalPages > 2) add(totalPages - 1)
    add(totalPages)
    return pages
  }, [safePage, totalPages])

  const setPageSafe = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)))

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage])

  const applyFilters = () => {
    setPage(1)
    fetchData(true)
  }

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('')
    setCabangFilter('')
    setProgresFilter('')
    setPage(1)
    fetchData(true)
  }

  const d = detail || ({} as Record<string, any>)
  const pendidikan: Pendidikan[] = Array.isArray(d.pendidikan) ? d.pendidikan : []
  const pengalaman: Pengalaman[] = Array.isArray(d.pengalaman) ? d.pengalaman : []
  const keluarga: Keluarga[] = Array.isArray(d.keluarga) ? d.keluarga : []
  const dokumen: Dokumen[] = Array.isArray(d.dokumen) ? d.dokumen : []

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] text-white">
            <User size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Data Kandidat</h1>
            <p className="text-sm text-slate-500">Data dari Sistem Penempatan (job.mendunia.id)</p>
          </div>
        </div>
        <button
          onClick={() => fetchData()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Muat Ulang
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-md bg-[#0E6187] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#0a4a6a]">
              <Upload size={14} />
              Import
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50">
              <Download size={14} />
              Export
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-amber-600">
              <Sparkles size={14} />
              Import AI
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50">
              <Filter size={14} />
              Filter
            </button>
            <div className="relative">
              <button
                onClick={() => setShowScreening(!showScreening)}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Search size={14} />
                Screening {screening}
                <ChevronsRight size={12} className="-rotate-90" />
              </button>
              {showScreening && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowScreening(false)} />
                  <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                    {['Semua', 'Direview'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => { setScreening(opt); setShowScreening(false) }}
                        className={`block w-full px-3 py-2 text-left text-xs transition hover:bg-slate-50 ${screening === opt ? 'bg-blue-50 font-semibold text-[#0E6187]' : 'text-slate-700'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100">
              <Trash2 size={14} />
              Data Dihapus
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') applyFilters() }}
                placeholder="Cari nama (Romaji/Katakana)..."
                className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500"
            >
              <option value="">Semua Status Formulir</option>
              {['Lengkap', 'Draft', 'Menunggu', 'Terverifikasi'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={progresFilter}
              onChange={e => setProgresFilter(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500"
            >
              <option value="">Semua Progres</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={cabangFilter}
              onChange={e => setCabangFilter(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500"
            >
              <option value="">Semua Cabang</option>
              {cabangs.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button
              onClick={applyFilters}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#0E6187] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#0a4a6a]"
            >
              Terapkan
            </button>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <X size={13} />
              Reset
            </button>
          </div>
        </div>

        <div className="border-b border-slate-200 px-4 py-2.5">
          <p className="text-sm font-semibold text-slate-700">
            Kandidat <span className="font-normal text-slate-500">{loading ? 'memuat...' : `${totalItems} item`}</span>
          </p>
        </div>

        {error && (
          <div className="mx-4 mt-4 flex items-center justify-between gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={() => { setError(''); fetchData() }} className="text-xs font-medium text-red-500 hover:text-red-700">
              Coba lagi
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Kandidat</th>
                <th className="px-4 py-3">Cabang</th>
                <th className="px-4 py-3">JK</th>
                <th className="px-4 py-3">Umur</th>
                <th className="px-4 py-3">Bidang SSW</th>
                <th className="px-4 py-3">Progres</th>
                <th className="px-4 py-3">Status Formulir</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <Loader2 className="mx-auto animate-spin text-[#0E6187]" size={28} />
                  </td>
                </tr>
              )}
              {!loading && items.map((k, idx) => (
                <tr key={k.id} className="border-b border-slate-100 transition hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{(safePage - 1) * perPage + idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold ${avatarColors[k.id % avatarColors.length]}`}>
                        {k.foto_url ? (
                          <img src={k.foto_url} alt={k.nama_romaji || ''} className="h-full w-full object-cover" onError={e => { e.currentTarget.style.display = 'none' }} />
                        ) : (
                          (initials(k.nama_romaji || '') || <User size={16} />)
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{k.nama_romaji || '-'}</p>
                        <p className="text-xs text-slate-500">{k.pendidikan_terakhir || '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{k.nama_cabang || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{k.jenis_kelamin || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{k.umur ?? '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{k.bidang_ssw || k.sertifikat_ssw || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_PROGRES_COLOR[(k.status_progres || '').toLowerCase()] || 'bg-amber-50 text-amber-700'}`}>
                      {k.status_progres || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      (k.status_formulir || '').toLowerCase() === 'lengkap' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {k.status_formulir || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openDetail(k.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      <Eye size={13} />
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-500">
                    {error ? 'Gagal memuat data' : 'Tidak ada data kandidat'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row">
          <p className="text-xs text-slate-500">
            {totalItems === 0 ? '0 item' : `${from}–${to} dari ${totalItems}`}
          </p>
          <div className="flex items-center gap-1">
            <span className="mr-2 text-xs text-slate-500">Baris:</span>
            <select
              value={perPage}
              onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
              className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none"
            >
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPageSafe(1)}
              disabled={safePage === 1}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronsLeft size={14} />
            </button>
            <button
              onClick={() => setPageSafe(safePage - 1)}
              disabled={safePage === 1}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            {pageNumbers.map((p, i) =>
              p === '...' ? (
                <span key={`e${i}`} className="px-1 text-xs text-slate-400">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPageSafe(p)}
                  className={`flex h-7 w-7 items-center justify-center rounded-md border text-xs font-medium transition ${
                    p === safePage
                      ? 'border-[#0E6187] bg-[#0E6187] text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => setPageSafe(safePage + 1)}
              disabled={safePage === totalPages}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => setPageSafe(totalPages)}
              disabled={safePage === totalPages}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ===== Modal Detail Kandidat ===== */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <div className="fixed inset-0 bg-black/60" onClick={() => setDetail(null)} />
          <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-gradient-to-r from-[#0E6187] to-[#0a4a6a] px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white/20 text-lg font-bold">
                    {detailFoto ? (
                      <img src={detailFoto} alt={d.nama_romaji || ''} className="h-full w-full object-cover" />
                    ) : (
                      (initials(d.nama_romaji || '') || <UserRound size={20} />)
                    )}
                  </div>
                <div>
                  <h2 className="text-base font-semibold">{d.nama_romaji || d.nama_katakana || 'Kandidat'}</h2>
                  <p className="text-xs text-white/80">
                    {d.nama_cabang || '-'} {d.jenis_kelamin ? `· ${d.jenis_kelamin}` : ''} {d.umur ? `· ${d.umur} th` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetail(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {detailLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="animate-spin text-[#0E6187]" size={28} />
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Status */}
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_PROGRES_COLOR[(d.status_progres || '').toLowerCase()] || 'bg-amber-50 text-amber-700'}`}>
                      Progres: {d.status_progres || '-'}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${(d.status_formulir || '').toLowerCase() === 'lengkap' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      Formulir: {d.status_formulir || '-'}
                    </span>
                    {d.status_keberangkatan && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        <Plane size={12} /> {d.status_keberangkatan}
                      </span>
                    )}
                    {d.nama_perusahaan && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                        <Briefcase size={12} /> {d.nama_perusahaan}
                      </span>
                    )}
                  </div>

                  {/* Data Diri */}
                  <DetailSection icon={UserRound} title="Data Diri" accent="text-[#0E6187] bg-[#0E6187]/10">
                    <Grid>
                      <Info label="Nama Katakana" value={d.nama_katakana} />
                      <Info label="Nama Romaji" value={d.nama_romaji} />
                      <Info label="Tempat Lahir" value={d.tempat_lahir} />
                      <Info label="Tanggal Lahir" value={formatDate(d.tanggal_lahir)} />
                      <Info label="Umur" value={d.umur != null ? `${d.umur} th` : null} />
                      <Info label="Jenis Kelamin" value={d.jenis_kelamin} />
                      <Info label="Status Pernikahan" value={d.status_pernikahan} />
                      <Info label="Jumlah Anak" value={d.jumlah_anak} />
                      <Info label="Agama" value={d.agama} />
                      <Info label="Tinggi Badan" value={d.tinggi_badan != null ? `${d.tinggi_badan} cm` : null} />
                      <Info label="Berat Badan" value={d.berat_badan != null ? `${d.berat_badan} kg` : null} />
                      <Info label="Golongan Darah" value={d.golongan_darah} />
                      <Info label="Ukuran Baju" value={d.ukuran_baju} />
                      <Info label="Lingkar Pinggang" value={d.lingkar_pinggang != null ? `${d.lingkar_pinggang} cm` : null} />
                      <Info label="Panjang Telapak Kaki" value={d.panjang_telapak_kaki != null ? `${d.panjang_telapak_kaki} cm` : null} />
                      <Info label="SIM" value={d.sim_dimiliki} />
                    </Grid>
                  </DetailSection>

                  {/* Kontak & Alamat */}
                  <DetailSection icon={MapPin} title="Kontak & Alamat" accent="text-blue-600 bg-blue-50">
                    <Grid>
                      <Info icon={Phone} label="Nomor HP" value={d.nomor_hp} />
                      <Info icon={Mail} label="Email" value={d.email_kontak} />
                      <Info label="Nama Orang Tua / Wali" value={d.kontak_ortu_nama} />
                      <Info label="No. HP Orang Tua" value={d.kontak_ortu_hp} />
                      <Info label="Alamat Lengkap" value={d.alamat_lengkap} wide />
                    </Grid>
                  </DetailSection>

                  {/* Kesehatan */}
                  <DetailSection icon={HeartPulse} title="Kesehatan" accent="text-rose-600 bg-rose-50">
                    <Grid>
                      <Info label="Sudah Vaksin" value={yesNo(d.sudah_vaksin)} />
                      <Info label="Kondisi Kesehatan" value={d.kondisi_kesehatan} />
                      <Info label="Penglihatan Kanan" value={d.penglihatan_kanan} />
                      <Info label="Penglihatan Kiri" value={d.penglihatan_kiri} />
                      <Info label="Berkacamata" value={yesNo(d.berkacamata)} />
                      <Info label="Lensa Kontak" value={yesNo(d.lensa_kontak)} />
                      <Info label="Buta Warna" value={yesNo(d.buta_warna)} />
                      <Info label="Bertato" value={yesNo(d.bertato)} />
                      <Info label="Merokok" value={yesNo(d.merokok)} />
                      <Info label="Minum Alkohol" value={yesNo(d.minum_alkohol)} />
                      <Info label="Riwayat Penyakit / Cedera" value={d.riwayat_penyakit} wide />
                    </Grid>
                  </DetailSection>

                  {/* Pendidikan */}
                  <DetailSection icon={GraduationCap} title="Pendidikan" accent="text-emerald-600 bg-emerald-50">
                    {pendidikan.length === 0 ? (
                      <EmptyText />
                    ) : (
                      <div className="space-y-3">
                        {pendidikan.map((p, i) => (
                          <div key={i} className="rounded-lg border border-slate-200 p-3">
                            <p className="text-sm font-semibold text-slate-800">{p.nama_sekolah || '-'}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {[p.jenjang, p.jurusan].filter(Boolean).join(' · ') || '-'}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {p.bulan_masuk || '-'} {p.tahun_masuk ?? ''} – {p.bulan_lulus || '-'} {p.tahun_lulus ?? ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </DetailSection>

                  {/* Pengalaman */}
                  <DetailSection icon={Briefcase} title="Pengalaman Kerja" accent="text-amber-600 bg-amber-50">
                    {pengalaman.length === 0 ? (
                      <EmptyText />
                    ) : (
                      <div className="space-y-3">
                        {pengalaman.map((p, i) => (
                          <div key={i} className="rounded-lg border border-slate-200 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-800">{p.nama_perusahaan || '-'}</p>
                              {p.masih_bekerja ? (
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Masih bekerja</span>
                              ) : null}
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {[p.posisi, p.alamat_perusahaan].filter(Boolean).join(' · ') || '-'}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {p.bulan_masuk || '-'} {p.tahun_masuk ?? ''} – {p.bulan_keluar || '-'} {p.tahun_keluar ?? ''}
                            </p>
                            {p.deskripsi_pekerjaan && (
                              <p className="mt-2 text-xs leading-relaxed text-slate-600">{p.deskripsi_pekerjaan}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </DetailSection>

                  {/* Kemampuan & Sertifikasi */}
                  <DetailSection icon={Languages} title="Kemampuan Bahasa & Sertifikasi" accent="text-violet-600 bg-violet-50">
                    <Grid>
                      <Info label="Level JLPT" value={d.level_jlpt} />
                      <Info label="Level JFT" value={d.level_jft} />
                      <Info label="Lama Belajar Jepang" value={d.lama_belajar_jepang} />
                      <Info label="Level Bahasa Jepang" value={d.level_bahasa_jepang} />
                      <Info label="Sertifikat SSW" value={d.sertifikat_ssw} />
                      <Info label="Bidang SSW" value={d.bidang_ssw} />
                      <Info label="ID Prometric" value={d.id_prometric} />
                      <Info label="Password Prometric" value={d.password_prometric} />
                    </Grid>
                  </DetailSection>

                  {/* Informasi Jepang */}
                  <DetailSection icon={Plane} title="Informasi Jepang" accent="text-sky-600 bg-sky-50">
                    <Grid>
                      <Info label="Pernah ke Jepang" value={yesNo(d.pernah_ke_jepang)} />
                      <Info label="Keluarga di Jepang" value={yesNo(d.keluarga_di_jepang)} />
                      <Info label="Kenalan di Jepang" value={yesNo(d.kenalan_di_jepang)} />
                    </Grid>
                  </DetailSection>

                  {/* Keluarga */}
                  <DetailSection icon={Users} title="Keluarga" accent="text-teal-600 bg-teal-50">
                    {keluarga.length === 0 ? (
                      <EmptyText />
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {keluarga.map((k, i) => (
                          <div key={i} className="rounded-lg border border-slate-200 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k.hubungan || '-'}</p>
                            <p className="mt-1 text-sm font-medium text-slate-800">{k.nama || '-'}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {k.usia ? `${k.usia} th` : ''} {k.pekerjaan ? `· ${k.pekerjaan}` : ''}
                            </p>
                            {k.penghasilan && <p className="mt-1 text-xs text-slate-500">Penghasilan: {k.penghasilan}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </DetailSection>

                  {/* Motivasi */}
                  <DetailSection icon={Goal} title="Motivasi & Tujuan" accent="text-orange-600 bg-orange-50">
                    <Grid>
                      <Info label="Tujuan ke Jepang" value={d.tujuan_ke_jepang} wide />
                      <Info label="Alasan ke Jepang" value={d.alasan_ke_jepang} wide />
                      <Info label="Cita-cita Setelah Jepang" value={d.cita_cita_setelah_jepang} wide />
                      <Info label="Rencana Pengiriman Uang" value={d.rencana_pengiriman_uang != null ? `${d.rencana_pengiriman_uang} jt/bln` : null} />
                      <Info label="Kelebihan Diri" value={d.kelebihan_diri} wide />
                      <Info label="Kekurangan Diri" value={d.kekurangan_diri} wide />
                      <Info label="Hobi" value={d.hobi} />
                      <Info label="Keahlian" value={d.keahlian} />
                      <Info label="Lama Tinggal di Jepang" value={d.lama_tinggal_jepang} />
                      <Info label="Lama Kerja di Perusahaan" value={d.lama_kerja_perusahaan} />
                      <Info label="Rencana Pulang" value={d.rencana_pulang} />
                      <Info label="Sumber Biaya" value={d.sumber_biaya} />
                      <Info label="Biaya Disiapkan" value={d.biaya_disiapkan} />
                      <Info label="Penghasilan Keluarga" value={d.penghasilan_keluarga != null ? `${d.penghasilan_keluarga} jt/bln` : null} />
                      <Info label="Bersedia Shift" value={yesNo(d.bersedia_shift)} />
                      <Info label="Bersedia Lembur" value={yesNo(d.bersedia_lembur)} />
                      <Info label="Bersedia Kerja Hari Libur" value={yesNo(d.bersedia_hari_libur)} />
                    </Grid>
                  </DetailSection>

                  {/* Progres Keberangkatan */}
                  <DetailSection icon={Plane} title="Progres Keberangkatan" accent="text-indigo-600 bg-indigo-50">
                    <Grid>
                      <Info label="Tgl Setsumeikai" value={formatDate(d.tgl_setsumeikai)} />
                      <Info label="Tgl Mensetsu 1" value={formatDate(d.tgl_mensetsu_1)} />
                      <Info label="Tgl Mensetsu 2" value={formatDate(d.tgl_mensetsu_2)} />
                      <Info label="Catatan Mensetsu" value={d.catatan_mensetsu} wide />
                      <Info label="Biaya Pemberkasan" value={d.biaya_pemberkasan} />
                      <Info label="Adm Tahap 1" value={formatDate(d.adm_tahap_1)} />
                      <Info label="Adm Tahap 2" value={formatDate(d.adm_tahap_2)} />
                      <Info label="Dokumen Dikirim" value={formatDate(d.dokumen_dikirim)} />
                      <Info label="Terbit Kontrak" value={formatDate(d.terbit_kontrak)} />
                      <Info label="Kontrak Dikirim TSK" value={formatDate(d.kontrak_dikirim_tsk)} />
                      <Info label="Terbit Paspor" value={formatDate(d.terbit_paspor)} />
                      <Info label="Masuk Imigrasi" value={formatDate(d.masuk_imigrasi)} />
                      <Info label="COE Terbit" value={formatDate(d.coe_terbit)} />
                      <Info label="EKTLKN Pembuatan" value={formatDate(d.ektkln_pembuatan)} />
                      <Info label="Dokumen Dikirim 2" value={formatDate(d.dokumen_dikirim_2)} />
                      <Info label="Visa" value={formatDate(d.visa)} />
                      <Info label="Jadwal Penerbangan" value={formatDate(d.jadwal_penerbangan)} />
                    </Grid>
                  </DetailSection>

                  {/* Dokumen */}
                  <DetailSection icon={FileText} title="Dokumen" accent="text-cyan-600 bg-cyan-50">
                    {dokumen.length === 0 ? (
                      <EmptyText />
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {dokumen.map((doc, i) => (
                          <div key={i} className="rounded-lg border border-slate-200 p-3">
                            <div className="flex items-center gap-2">
                              <FileText size={14} className="shrink-0 text-[#0E6187]" />
                              <p className="truncate text-xs font-semibold text-slate-700">
                                {(doc.jenis_dokumen || '').replace(/_/g, ' ') || '-'}
                              </p>
                            </div>
                            <p className="mt-1 truncate text-xs text-slate-500">{doc.nama_file || '-'}</p>
                            {doc.file_url && (
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#0E6187] transition hover:bg-slate-50"
                              >
                                Lihat
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </DetailSection>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailSection({ icon: Icon, title, accent, children }: { icon: any; title: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${accent.split(' ')[1]}`}>
          <Icon size={14} className={accent.split(' ')[0]} />
        </span>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>
}

function Info({ label, value, wide, icon: Icon }: { label: string; value?: unknown; wide?: boolean; icon?: any }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-0.5 flex items-center gap-1.5">
        {Icon && <Icon size={13} className="shrink-0 text-slate-400" />}
        <p className="text-sm text-slate-700 break-words">{value == null || value === '' ? '-' : String(value)}</p>
      </div>
    </div>
  )
}

function EmptyText() {
  return <p className="rounded-md border border-dashed border-slate-200 py-4 text-center text-xs text-slate-400">Tidak ada data</p>
}

function formatDate(v: unknown) {
  if (!v) return null
  const str = String(v)
  const d = new Date(str)
  if (isNaN(d.getTime())) return str
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
