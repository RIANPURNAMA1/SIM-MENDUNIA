import { useEffect, useState, useRef } from 'react'
import { Users, Search, RotateCcw, Eye, Edit3, Power, PowerOff, CalendarOff, Calendar, Receipt, Check, X, Plus, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal, FileText, Download, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import { pendaftarApi, batchApi } from '../../services/api'
import * as XLSX from 'xlsx'

interface Kandidat {
  id: number
  nama: string
  email: string
  telepon: string
  nik: string
  no_registrasi: string
  batch_id: number | null
  batch_nama: string
  batch_warna: string | null
  real_batch: string
  jenis_kelamin: string
  tempat_lahir: string
  tanggal_lahir: string
  alamat: string
  desa: string
  kecamatan: string
  kabupaten: string
  provinsi: string
  pendidikan_terakhir: string
  tahun_lulus: string
  tinggi_badan: string
  berat_badan: string
  goldar: string
  ukuran_baju: string
  status_pernikahan: string
  no_hp: string
  nama_ortu: string
  no_hp_ortu: string
  status: string
  status_akademik: string
  is_cuti: boolean
  cuti_sejak: string | null
  level_status_keluar: boolean
  tanggalDaftar: string
  user_id: number | null
  keterangan: string
  password_plain: string | null
}

interface BatchOption {
  id: number
  nama: string
  warna: string | null
}

type EditableField = keyof Pick<Kandidat,
  'nik' | 'nama' | 'real_batch' | 'jenis_kelamin' | 'tempat_lahir' | 'tanggal_lahir' |
  'alamat' | 'desa' | 'kecamatan' | 'kabupaten' | 'provinsi' | 'pendidikan_terakhir' |
  'tahun_lulus' | 'tinggi_badan' | 'berat_badan' | 'goldar' | 'ukuran_baju' |
  'status_pernikahan' | 'email' | 'no_hp' | 'nama_ortu' | 'no_hp_ortu' | 'keterangan'
>

const inputCls = "w-full min-w-[70px] px-1.5 py-0.5 border border-blue-400 rounded bg-blue-50 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
const selectCls = "w-full min-w-[70px] px-1 py-0.5 border border-blue-400 rounded bg-blue-50 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-blue-500 appearance-none"

export default function DataKandidat() {
  const batchColors = [
    { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700 border-blue-200' },
    { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
    { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700 border-purple-200' },
    { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700 border-rose-200' },
    { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
    { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700 border-orange-200' },
    { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', badge: 'bg-teal-100 text-teal-700 border-teal-200' },
    { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', badge: 'bg-pink-100 text-pink-700 border-pink-200' },
    { bg: 'bg-lime-50', border: 'border-lime-200', text: 'text-lime-700', badge: 'bg-lime-100 text-lime-700 border-lime-200' },
    { bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', text: 'text-fuchsia-700', badge: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200' },
  ]
  const [batchColorMap, setBatchColorMap] = useState<Record<string, number>>({})
  const getBatchColor = (batchNama: string) => {
    const idx = batchColorMap[batchNama] ?? 0
    return batchColors[idx % batchColors.length]
  }
  const hexToRgba = (hex: string, alpha: number) => {
    const h = hex.replace('#', '')
    const r = parseInt(h.substring(0, 2), 16)
    const g = parseInt(h.substring(2, 4), 16)
    const b = parseInt(h.substring(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
  }

  const [kandidatList, setKandidatList] = useState<Kandidat[]>([])
  const [batchOptions, setBatchOptions] = useState<BatchOption[]>([])
  const [totalBatch, setTotalBatch] = useState(0)
  const [totalKandidat, setTotalKandidat] = useState(0)
  const [kandidatAktif, setKandidatAktif] = useState(0)
  const [search, setSearch] = useState('')
  const [filterBatch, setFilterBatch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<Kandidat>>({})
  const [saving, setSaving] = useState(false)
  const [detailKandidat, setDetailKandidat] = useState<Kandidat | null>(null)
  const [showTambah, setShowTambah] = useState(false)
  const [tambahLoading, setTambahLoading] = useState(false)
  const [tambahSuccess, setTambahSuccess] = useState<{ noReg: string; password: string } | null>(null)
  const [tambahError, setTambahError] = useState('')
  const [tambahErrors, setTambahErrors] = useState<Record<string, string>>({})
  const [tambahForm, setTambahForm] = useState({
    nama: '', email: '', telepon: '', nik: '', batch_id: '',
    real_batch: '', jenis_kelamin: '', tempat_lahir: '', tanggal_lahir: '',
    alamat: '', desa: '', kecamatan: '', kabupaten: '', provinsi: '',
    pendidikan_terakhir: '', tahun_lulus: '', tinggi_badan: '', berat_badan: '',
    goldar: '', ukuran_baju: '', status_pernikahan: '', no_hp: '',
    nama_ortu: '', no_hp_ortu: '', keterangan: '',
  })
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [togglingCutiId, setTogglingCutiId] = useState<number | null>(null)
  const [openActionId, setOpenActionId] = useState<number | null>(null)
  const actionRef = useRef<HTMLDivElement>(null)
  const [showImport, setShowImport] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importData, setImportData] = useState<Record<string, unknown>[]>([])
  const [importHeaders, setImportHeaders] = useState<string[]>([])
  const [importBatchId, setImportBatchId] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number; created: { nama: string; email: string; no_registrasi: string; password: string }[]; errors: { row: number; message: string }[] } | null>(null)
  const [importMapping, setImportMapping] = useState<Record<string, string>>({})
  const importFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchData()
    batchApi.list().then(res => {
      const raw = res.data.data || res.data.batches || res.data || []
      const all = raw.map((b: { id: number; nama_batch: string; warna?: string | null }) => ({ id: b.id, nama: b.nama_batch, warna: b.warna ?? null }))
      setBatchOptions(prev => {
        const merged = new Map<string, { id: number; nama: string; warna: string | null }>()
        for (const b of all) merged.set(b.nama, b)
        for (const b of prev) if (!merged.has(b.nama)) merged.set(b.nama, b)
        return [...merged.values()]
      })
    }).catch(() => {})
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (actionRef.current && !actionRef.current.contains(e.target as Node)) {
        setOpenActionId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function fetchData(s?: string) {
    setLoading(true)
    const params: Record<string, string> = {}
    if (s) params.search = s
    if (filterBatch) params.batch_id = filterBatch
    pendaftarApi.kandidat(params)
      .then(res => {
        const allKandidat: Kandidat[] = []
        const seen = new Set<number>()
        const batches: BatchOption[] = []
        for (const b of res.data.batches) {
          batches.push({ id: b.id, nama: b.nama, warna: b.warna ?? null })
          for (const k of b.kandidat) {
            if (!seen.has(k.id)) {
              seen.add(k.id)
              allKandidat.push(k)
            }
          }
        }
        setKandidatList(allKandidat)
        setBatchOptions(prev => {
          const merged = new Map<string, { id: number; nama: string; warna: string | null }>()
          for (const b of batches) merged.set(b.nama, b)
          for (const b of prev) if (!merged.has(b.nama)) merged.set(b.nama, b)
          return [...merged.values()]
        })
        const colorMap: Record<string, number> = {}
        batches.forEach((b, i) => { colorMap[b.nama] = i })
        setBatchColorMap(colorMap)
        setTotalBatch(res.data.totalBatch)
        setTotalKandidat(res.data.totalKandidat)
        setKandidatAktif(res.data.kandidatAktif)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setSearch(val)
    setPage(1)
    if (val.length >= 2 || val.length === 0) fetchData(val)
  }

  function handleFilterBatch(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    setFilterBatch(val)
    setPage(1)
    fetchData(search)
  }

  function resetFilter() {
    setSearch('')
    setFilterBatch('')
    setPage(1)
    fetchData()
  }

  async function handleToggleStatus(id: number) {
    setTogglingId(id)
    try {
      await pendaftarApi.toggleKandidatStatus(id)
      fetchData(search)
    } catch {
      alert('Gagal mengubah status kandidat')
    } finally {
      setTogglingId(null)
    }
  }

  async function handleToggleCuti(id: number) {
    setTogglingCutiId(id)
    try {
      await pendaftarApi.toggleKandidatCuti(id)
      fetchData(search)
    } catch {
      alert('Gagal mengubah status cuti')
    } finally {
      setTogglingCutiId(null)
    }
  }

  function startEdit(k: Kandidat) {
    setEditingId(k.id)
    setEditForm({ ...k })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm({})
  }

  async function saveEdit() {
    if (!editingId) return
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(editForm as Record<string, unknown>)) {
        if (v === '' || v === undefined) payload[k] = null
        else payload[k] = v
      }
      await pendaftarApi.updateKandidat(editingId, payload)
      setKandidatList(prev => prev.map(k => k.id === editingId ? { ...k, ...editForm } as Kandidat : k))
      setEditingId(null)
      setEditForm({})
    } catch (err) {
      alert('Gagal menyimpan data')
    } finally {
      setSaving(false)
    }
  }

  function updateField(field: EditableField, value: string) {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  function updateTambahField(field: string, value: string) {
    setTambahForm(prev => ({ ...prev, [field]: value }))
    if (tambahErrors[field]) {
      setTambahErrors(prev => { const n = { ...prev }; delete n[field]; return n })
    }
  }

  function validateTambahForm(): Record<string, string> {
    const e: Record<string, string> = {}
    const f = tambahForm

    if (!f.nama.trim()) e.nama = 'Nama lengkap wajib diisi.'
    else if (f.nama.length > 255) e.nama = 'Nama maksimal 255 karakter.'

    if (!f.email.trim()) e.email = 'Email wajib diisi.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Format email tidak valid.'

    if (f.nik.length > 50) e.nik = 'NIK maksimal 50 karakter.'
    if (f.telepon.length > 20) e.telepon = 'No. telepon maksimal 20 karakter.'
    if (f.no_hp.length > 20) e.no_hp = 'No. HP maksimal 20 karakter.'
    if (f.tempat_lahir.length > 255) e.tempat_lahir = 'Tempat lahir maksimal 255 karakter.'
    if (f.desa.length > 255) e.desa = 'Nama desa maksimal 255 karakter.'
    if (f.kecamatan.length > 255) e.kecamatan = 'Nama kecamatan maksimal 255 karakter.'
    if (f.kabupaten.length > 255) e.kabupaten = 'Nama kabupaten maksimal 255 karakter.'
    if (f.provinsi.length > 255) e.provinsi = 'Nama provinsi maksimal 255 karakter.'
    if (f.pendidikan_terakhir.length > 100) e.pendidikan_terakhir = 'Pendidikan terakhir maksimal 100 karakter.'
    if (f.tahun_lulus.length > 4) e.tahun_lulus = 'Tahun lulus maksimal 4 karakter.'
    else if (f.tahun_lulus !== '' && !/^\d{4}$/.test(f.tahun_lulus)) e.tahun_lulus = 'Tahun lulus harus 4 digit angka.'
    if (f.tinggi_badan !== '' && isNaN(Number(f.tinggi_badan))) e.tinggi_badan = 'Tinggi badan harus berupa angka.'
    if (f.berat_badan !== '' && isNaN(Number(f.berat_badan))) e.berat_badan = 'Berat badan harus berupa angka.'
    if (f.nama_ortu.length > 255) e.nama_ortu = 'Nama orang tua maksimal 255 karakter.'
    if (f.no_hp_ortu.length > 20) e.no_hp_ortu = 'No. tlp orang tua maksimal 20 karakter.'
    if (f.real_batch.length > 255) e.real_batch = 'Real batch maksimal 255 karakter.'
    if (f.keterangan.length > 500) e.keterangan = 'Keterangan maksimal 500 karakter.'

    return e
  }

  async function handleTambahSubmit(e: React.FormEvent) {
    e.preventDefault()
    const clientErrors = validateTambahForm()
    if (Object.keys(clientErrors).length > 0) {
      setTambahErrors(clientErrors)
      setTambahError('Mohon lengkapi semua field yang ditandai.')
      return
    }
    setTambahErrors({})
    setTambahLoading(true)
    setTambahError('')
    try {
      const payload: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(tambahForm)) {
        if (v !== '' && v !== null && v !== undefined) payload[k] = v
      }
      if (payload.batch_id) payload.batch_id = Number(payload.batch_id)
      if (payload.tinggi_badan) payload.tinggi_badan = Number(payload.tinggi_badan)
      if (payload.berat_badan) payload.berat_badan = Number(payload.berat_badan)
      const res = await pendaftarApi.createKandidat(payload)
      setTambahSuccess({ noReg: res.data.no_registrasi, password: res.data.password })
      setTambahError('')
      setTambahErrors({})
      setTambahForm({
        nama: '', email: '', telepon: '', nik: '', batch_id: '',
        real_batch: '', jenis_kelamin: '', tempat_lahir: '', tanggal_lahir: '',
        alamat: '', desa: '', kecamatan: '', kabupaten: '', provinsi: '',
        pendidikan_terakhir: '', tahun_lulus: '', tinggi_badan: '', berat_badan: '',
        goldar: '', ukuran_baju: '', status_pernikahan: '', no_hp: '',
        nama_ortu: '', no_hp_ortu: '', keterangan: '',
      })
      fetchData()
    } catch (err: unknown) {
      let detail = 'Terjadi kesalahan saat menyimpan data.'
      const fieldErrors: Record<string, string> = {}
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
        if (axErr.response?.data?.errors) {
          const errs = axErr.response.data.errors
          for (const [field, msgs] of Object.entries(errs)) {
            const translated: Record<string, string> = {
              nama: 'Nama', email: 'Email', nik: 'NIK', telepon: 'No. telepon',
              no_hp: 'No. HP', batch_id: 'Batch', jenis_kelamin: 'Jenis kelamin',
              tempat_lahir: 'Tempat lahir', tanggal_lahir: 'Tanggal lahir',
              alamat: 'Alamat', desa: 'Desa', kecamatan: 'Kecamatan',
              kabupaten: 'Kab./Kota', provinsi: 'Provinsi',
              pendidikan_terakhir: 'Pendidikan terakhir', tahun_lulus: 'Tahun lulus',
              tinggi_badan: 'Tinggi badan', berat_badan: 'Berat badan',
              goldar: 'Golongan darah', ukuran_baju: 'Ukuran baju',
              status_pernikahan: 'Status nikah', nama_ortu: 'Nama orang tua',
              no_hp_ortu: 'No. tlp orang tua', keterangan: 'Keterangan',
              real_batch: 'Real batch',
            }
            const label = translated[field] || field
            fieldErrors[field] = `${label}: ${msgs[0]}`
          }
          detail = Object.values(fieldErrors).join('\n')
        } else if (axErr.response?.data?.message) {
          detail = axErr.response.data.message
          if (axErr.response.data.debug) {
            detail += '\n[' + axErr.response.data.debug + ']'
          }
        }
      }
      setTambahErrors(fieldErrors)
      setTambahError(detail)
    } finally {
      setTambahLoading(false)
    }
  }

  async function handlePindahBatch(kandidatId: number, newBatchId: string) {
    const id = newBatchId ? Number(newBatchId) : null
    try {
      await pendaftarApi.updateKandidat(kandidatId, { batch_id: id })
      setKandidatList(prev => prev.map(k =>
        k.id === kandidatId
          ? { ...k, batch_id: id, batch_nama: batchOptions.find(b => b.id === id)?.nama || '-', batch_warna: batchOptions.find(b => b.id === id)?.warna ?? null }
          : k
      ))
    } catch {
      alert('Gagal mengubah batch')
    }
  }

  const filteredList = filterBatch
    ? kandidatList.filter(k => k.batch_nama === batchOptions.find(b => String(b.id) === filterBatch)?.nama)
    : kandidatList

  const totalPages = Math.max(1, Math.ceil(filteredList.length / perPage))
  const safePage = Math.min(page, totalPages)
  const pagedList = filteredList.slice((safePage - 1) * perPage, safePage * perPage)

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      Disetujui: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'Disetujui' },
      Ditolak: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', label: 'Ditolak' },
      Pending: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'Pending' },
    }
    const s = map[status] || { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-600', label: status }
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${s.bg} ${s.text}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${status === 'Disetujui' ? 'bg-emerald-500' : status === 'Ditolak' ? 'bg-red-500' : 'bg-amber-500'}`} />
        {s.label}
      </span>
    )
  }

  function CellEdit({ field, type }: { field: EditableField; type?: 'text' | 'select' | 'number' | 'date' }) {
    const val = editForm[field] ?? ''
    if (type === 'select') {
      const opts: Record<string, string[]> = {
        jenis_kelamin: ['L', 'P'],
        goldar: ['A', 'B', 'AB', 'O'],
        ukuran_baju: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        status_pernikahan: ['Belum Nikah', 'Nikah', 'Cerai'],
        pendidikan_terakhir: ['SD/Sederajat', 'SMP/Sederajat', 'SMA/Sederajat', 'D1-D3', 'S1', 'S2'],
      }
      return (
        <select className={selectCls} value={val} onChange={e => updateField(field, e.target.value)}>
          <option value="">-</option>
          {(opts[field] || []).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )
    }
    return (
      <input
        type={type || 'text'}
        className={inputCls}
        value={val}
        onChange={e => updateField(field, e.target.value)}
      />
    )
  }

  function exportCSV() {
    const headers = [
      'No', 'NIK', 'No. Registrasi', 'Nama Kandidat', 'Batch', 'Real Batch',
      'Jenis Kelamin', 'Tempat Lahir', 'Tanggal Lahir', 'Alamat', 'Desa',
      'Kecamatan', 'Kab./Kota', 'Provinsi', 'Pendidikan Terakhir', 'Tahun Lulus',
      'Tinggi Badan', 'Berat Badan', 'Golongan Darah', 'Ukuran Baju',
      'Status Nikah', 'E-mail', 'No. Tlp', 'Nama Orang Tua', 'No. Tlp Orang Tua',
      'Status', 'Keterangan'
    ]
    const rows = filteredList.map((k, i) => [
      i + 1, k.nik, k.no_registrasi, k.nama, k.batch_nama, k.real_batch,
      k.jenis_kelamin, k.tempat_lahir, k.tanggal_lahir, k.alamat, k.desa,
      k.kecamatan, k.kabupaten, k.provinsi, k.pendidikan_terakhir, k.tahun_lulus,
      k.tinggi_badan, k.berat_badan, k.goldar, k.ukuran_baju,
      k.status_pernikahan, k.email, k.no_hp, k.nama_ortu, k.no_hp_ortu,
      k.status, k.keterangan
    ])
    const bom = '\uFEFF'
    const csvContent = bom + [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `data-kandidat-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  function exportExcel() {
    const headers = [
      'No', 'NIK', 'No. Registrasi', 'Nama Kandidat', 'Batch', 'Real Batch',
      'Jenis Kelamin', 'Tempat Lahir', 'Tanggal Lahir', 'Alamat', 'Desa',
      'Kecamatan', 'Kab./Kota', 'Provinsi', 'Pendidikan Terakhir', 'Tahun Lulus',
      'Tinggi Badan', 'Berat Badan', 'Golongan Darah', 'Ukuran Baju',
      'Status Nikah', 'E-mail', 'No. Tlp', 'Nama Orang Tua', 'No. Tlp Orang Tua',
      'Status', 'Keterangan'
    ]
    const rows = filteredList.map((k, i) => [
      i + 1, k.nik, k.no_registrasi, k.nama, k.batch_nama, k.real_batch,
      k.jenis_kelamin, k.tempat_lahir, k.tanggal_lahir, k.alamat, k.desa,
      k.kecamatan, k.kabupaten, k.provinsi, k.pendidikan_terakhir, k.tahun_lulus,
      k.tinggi_badan, k.berat_badan, k.goldar, k.ukuran_baju,
      k.status_pernikahan, k.email, k.no_hp, k.nama_ortu, k.no_hp_ortu,
      k.status, k.keterangan
    ])
    const cellStyle = ' style="mso-number-format:\'@\'"'
    const tableRows = [
      `<tr>${headers.map(h => `<th style="background:#0E6187;color:white;font-weight:bold;padding:6px 10px;border:1px solid #ccc">${h}</th>`).join('')}</tr>`,
      ...rows.map((r, i) => `<tr>${r.map(v => `<td${cellStyle} style="padding:4px 10px;border:1px solid #ccc;background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">${String(v ?? '')}</td>`).join('')}</tr>`)
    ]
    const htmlTable = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Data Kandidat</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>${tableRows.join('')}</table></body></html>`
    const blob = new Blob([htmlTable], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `data-kandidat-${new Date().toISOString().slice(0, 10)}.xls`
    link.click()
    URL.revokeObjectURL(url)
  }

  const fieldOptions: { value: string; label: string }[] = [
    { value: '', label: '— Lewati —' },
    { value: 'nik', label: 'NIK' },
    { value: 'nama', label: 'Nama Kandidat' },
    { value: 'email', label: 'E-mail' },
    { value: 'telepon', label: 'No. Telepon' },
    { value: 'real_batch', label: 'Real Batch' },
    { value: 'jenis_kelamin', label: 'Jenis Kelamin (L/P)' },
    { value: 'tempat_lahir', label: 'Tempat Lahir' },
    { value: 'tanggal_lahir', label: 'Tanggal Lahir' },
    { value: 'alamat', label: 'Alamat' },
    { value: 'desa', label: 'Desa' },
    { value: 'kecamatan', label: 'Kecamatan' },
    { value: 'kabupaten', label: 'Kab./Kota' },
    { value: 'provinsi', label: 'Provinsi' },
    { value: 'pendidikan_terakhir', label: 'Pendidikan Terakhir' },
    { value: 'tahun_lulus', label: 'Tahun Lulus' },
    { value: 'tinggi_badan', label: 'Tinggi Badan' },
    { value: 'berat_badan', label: 'Berat Badan' },
    { value: 'goldar', label: 'Golongan Darah' },
    { value: 'ukuran_baju', label: 'Ukuran Baju' },
    { value: 'status_pernikahan', label: 'Status Nikah' },
    { value: 'no_hp', label: 'No. HP' },
    { value: 'nama_ortu', label: 'Nama Orang Tua' },
    { value: 'no_hp_ortu', label: 'No. HP Orang Tua' },
    { value: 'keterangan', label: 'Keterangan' },
  ]

  const autoMapHeaders = (headers: string[]): Record<string, string> => {
    const mapping: Record<string, string> = {}
    const normalizedFields: Record<string, string> = {
      'nik': 'nik', 'no_ktp': 'nik', 'no. ktp': 'nik',
      'nama': 'nama', 'nama lengkap': 'nama', 'nama kandidat': 'nama',
      'email': 'email', 'e-mail': 'email', 'alamat email': 'email',
      'no. handphone': 'no_hp', 'no hp': 'no_hp', 'no. hp': 'no_hp', 'handphone': 'no_hp', 'phone': 'no_hp', 'telepon': 'telepon', 'no. telepon': 'telepon', 'no telp': 'telepon', 'telp': 'telepon',
      'real batch': 'real_batch', 'real_batch': 'real_batch',
      'jk': 'jenis_kelamin', 'jenis kelamin': 'jenis_kelamin', 'jenis_kelamin': 'jenis_kelamin', 'kelamin': 'jenis_kelamin', 'sex': 'jenis_kelamin',
      'tempat tanggal lahir': 'tempat_lahir', 'tempat lahir': 'tempat_lahir', 'tempat_lahir': 'tempat_lahir', 'tempat': 'tempat_lahir',
      'tanggal lahir': 'tanggal_lahir', 'tanggal_lahir': 'tanggal_lahir', 'tgl lahir': 'tanggal_lahir', 'tgl_lahir': 'tanggal_lahir', 'date of birth': 'tanggal_lahir', 'dob': 'tanggal_lahir',
      'alamat': 'alamat', 'address': 'alamat', 'street': 'alamat',
      'desa': 'desa', 'kelurahan': 'desa', 'village': 'desa',
      'kecamatan': 'kecamatan', 'district': 'kecamatan',
      'kabupaten / kota': 'kabupaten', 'kab./kota': 'kabupaten', 'kabupaten': 'kabupaten', 'kota': 'kabupaten', 'kab/kota': 'kabupaten', 'kab. / kota': 'kabupaten',
      'provinsi': 'provinsi', 'province': 'provinsi',
      'pend. terakhir': 'pendidikan_terakhir', 'pendidikan terakhir': 'pendidikan_terakhir', 'pendidikan_terakhir': 'pendidikan_terakhir', 'pendidikan': 'pendidikan_terakhir', 'education': 'pendidikan_terakhir',
      'tahun lulus': 'tahun_lulus', 'tahun_lulus': 'tahun_lulus', 'year': 'tahun_lulus',
      'tb': 'tinggi_badan', 'tinggi badan': 'tinggi_badan', 'tinggi_badan': 'tinggi_badan', 'height': 'tinggi_badan', 'tinggi': 'tinggi_badan',
      'bb': 'berat_badan', 'berat badan': 'berat_badan', 'berat_badan': 'berat_badan', 'weight': 'berat_badan', 'berat': 'berat_badan',
      'goldar': 'goldar', 'golongan darah': 'goldar', 'golongan_darah': 'goldar', 'blood': 'goldar', 'gol darah': 'goldar',
      'uk. baju': 'ukuran_baju', 'ukuran baju': 'ukuran_baju', 'ukuran_baju': 'ukuran_baju', 'baju': 'ukuran_baju', 'size': 'ukuran_baju',
      'status nikah': 'status_pernikahan', 'status pernikahan': 'status_pernikahan', 'status_pernikahan': 'status_pernikahan', 'marital': 'status_pernikahan', 'status menikah': 'status_pernikahan',
      'no. tlp orang tua/wali': 'no_hp_ortu', 'no. tlp orang tua': 'no_hp_ortu', 'no tlp ortu': 'no_hp_ortu', 'no. tlp ortu': 'no_hp_ortu', 'no hp ortu': 'no_hp_ortu', 'no. hp ortu': 'no_hp_ortu', 'no_hp_ortu': 'no_hp_ortu', 'no hp orang tua': 'no_hp_ortu', 'telepon orang tua': 'no_hp_ortu',
      'nama ortu': 'nama_ortu', 'nama orang tua / wali': 'nama_ortu', 'nama orang tua': 'nama_ortu', 'nama_ortu': 'nama_ortu', 'nama orangtua': 'nama_ortu', 'orang tua': 'nama_ortu',
      'ket.': 'keterangan', 'keterangan': 'keterangan', 'catatan': 'keterangan', 'note': 'keterangan', 'remarks': 'keterangan',
    }
    headers.forEach(h => {
      const normalized = h.toLowerCase().trim()
      if (normalizedFields[normalized]) {
        mapping[h] = normalizedFields[normalized]
      } else {
        mapping[h] = ''
      }
    })
    return mapping
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportFile(file)
    setImportResult(null)
    const reader = new FileReader()
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
      if (raw.length === 0) return
      const hdrs = Object.keys(raw[0])
      setImportHeaders(hdrs)
      setImportData(raw)
      setImportMapping(autoMapHeaders(hdrs))
    }
    reader.readAsArrayBuffer(file)
  }

  function parseTanggalLahir(val: string): { tempat: string; tanggal: string } {
    const v = (val || '').trim()
    if (!v) return { tempat: '', tanggal: '' }
    const bulanMap: Record<string, string> = {
      januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
      juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12',
      jan: '01', feb: '02', mar: '03', apr: '04', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    }
    const re = /(\d{1,2})\s+(\w+)\s+(\d{4})/i
    const m = v.match(re)
    if (m) {
      const day = m[1].padStart(2, '0')
      const mon = bulanMap[m[2].toLowerCase()] || '01'
      const year = m[3]
      const tempat = v.slice(0, v.indexOf(m[0])).replace(/[,]+\s*$/, '').trim()
      return { tempat, tanggal: `${year}-${mon}-${day}` }
    }
    return { tempat: v, tanggal: '' }
  }

  async function handleImportSubmit() {
    if (!importBatchId || importData.length === 0) return
    setImportLoading(true)
    try {
      const mappedData = importData.map(row => {
        const out: Record<string, unknown> = {}
        importHeaders.forEach(h => {
          const field = importMapping[h]
          if (field) out[field] = row[h] ?? ''
        })
        if (out.tempat_lahir && !out.tanggal_lahir) {
          const parsed = parseTanggalLahir(String(out.tempat_lahir))
          out.tempat_lahir = parsed.tempat
          out.tanggal_lahir = parsed.tanggal
        }
        return out
      }).filter(r => r.nama && r.email)

      const headerLabels = new Set([
        'no', 'nik', 'no. registrasi', 'nama kandidat', 'batch', 'jk', 'jenis kelamin',
        'tempat tanggal lahir', 'tempat lahir', 'alamat', 'desa', 'kecamatan',
        'kabupaten / kota', 'kab./kota', 'provinsi', 'no. handphone', 'no. hp',
        'pend. terakhir', 'pendidikan terakhir', 'tahun lulus', 'tb', 'bb',
        'goldar', 'golongan darah', 'ukuran baju', 'uk. baju', 'status pernikahan',
        'status nikah', 'e-mail', 'email', 'nama orang tua / wali', 'nama orang tua',
        'no. tlp orang tua/wali', 'no. tlp ortu', 'pre-mcu', 'ket.', 'keterangan',
      ])
      const validJK = new Set(['L', 'P', 'Laki-laki', 'Perempuan', 'laki-laki', 'perempuan'])
      const validGoldar = new Set(['A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
      const validUkuran = new Set(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'])
      const validNikah = new Set(['Belum Nikah', 'Belum Menikah', 'Nikah', 'Cerai', 'Cerai Hidup', 'Cerai Mati'])

      const cleanData = mappedData.filter((r, idx) => {
        const nama = String(r.nama || '').trim().toLowerCase()
        if (headerLabels.has(nama)) return false
        if (r.jenis_kelamin && !validJK.has(String(r.jenis_kelamin).trim())) {
          r.jenis_kelamin = ''
        }
        if (r.goldar) {
          const g = String(r.goldar).trim().toUpperCase()
          r.goldar = validGoldar.has(g) ? g.replace('+', '').replace('-', '') : ''
        }
        if (r.ukuran_baju) {
          const u = String(r.ukuran_baju).trim().toUpperCase()
          r.ukuran_baju = validUkuran.has(u) ? u : ''
        }
        if (r.status_pernikahan) {
          const s = String(r.status_pernikahan).trim()
          const found = [...validNikah].find(v => v.toLowerCase() === s.toLowerCase())
          r.status_pernikahan = found || ''
        }
        if (r.nik) {
          const nik = String(r.nik).replace(/\D/g, '')
          r.nik = nik.slice(0, 50)
        }
        if (r.no_hp) r.no_hp = String(r.no_hp).replace(/[^0-9+\-\s]/g, '').trim().slice(0, 20)
        if (r.no_hp_ortu) r.no_hp_ortu = String(r.no_hp_ortu).replace(/[^0-9+\-\s;]/g, '').replace(/;'/g, '').trim().slice(0, 20)
        if (r.tahun_lulus) r.tahun_lulus = String(r.tahun_lulus).replace(/\D/g, '').slice(0, 4)
        if (r.tinggi_badan) r.tinggi_badan = String(r.tinggi_badan).replace(/[^\d.]/g, '')
        if (r.berat_badan) r.berat_badan = String(r.berat_badan).replace(/[^\d.]/g, '')
        return true
      })
      const skippedCount = mappedData.length - cleanData.length
      if (cleanData.length === 0) {
        setImportResult({ success: 0, failed: importData.length, created: [], errors: [{ row: 0, message: 'Tidak ada data valid (nama dan email wajib ada)' }] })
        return
      }
      const res = await pendaftarApi.importKandidat({ batch_id: Number(importBatchId), data: cleanData })
      const result = res.data
      if (skippedCount > 0) {
        result.errors = [{ row: 0, message: `${skippedCount} baris dilewati (header/korup)` }, ...(result.errors || [])]
      }
      setImportResult(result)
      fetchData()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: { row: number; message: string }[] } } }
      setImportResult({
        success: 0,
        failed: importData.length,
        created: [],
        errors: axiosErr.response?.data?.errors || [{ row: 0, message: axiosErr.response?.data?.message || 'Gagal mengimport data' }],
      })
    } finally {
      setImportLoading(false)
    }
  }

  function resetImport() {
    setShowImport(false)
    setImportFile(null)
    setImportData([])
    setImportHeaders([])
    setImportBatchId('')
    setImportLoading(false)
    setImportResult(null)
    setImportMapping({})
    if (importFileRef.current) importFileRef.current.value = ''
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] text-white">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Data Kandidat</h1>
            <p className="text-sm text-slate-500">Kelola data kandidat per batch</p>
          </div>
        </div>
        <button
          onClick={() => { setShowTambah(true); setTambahSuccess(null); setTambahError(''); setTambahErrors({}) }}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
        >
          <Plus size={16} />
          Tambah Data
        </button>
      </div>

      {/* Summary */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-4 transition hover:shadow-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-blue-100">
            <Users size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Total Batch</p>
            <p className="text-2xl font-bold text-slate-800">{totalBatch}</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-4 transition hover:shadow-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100">
            <Users size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Total Kandidat</p>
            <p className="text-2xl font-bold text-slate-800">{totalKandidat}</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-4 transition hover:shadow-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-amber-100">
            <Users size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Kandidat Aktif</p>
            <p className="text-2xl font-bold text-slate-800">{kandidatAktif}</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, email, atau NIK..."
              value={search}
              onChange={handleSearch}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="relative">
            <select
              value={filterBatch}
              onChange={handleFilterBatch}
              className="appearance-none rounded-lg border border-slate-300 bg-slate-50 px-8 py-2.5 pr-8 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Semua Batch</option>
              {batchOptions.map(b => (
                <option key={b.id} value={b.id}>{b.nama}</option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
          <button
            onClick={() => fetchData(search)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0E6187] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#1a3a5c]"
          >
            <Search size={16} />
            Filter
          </button>
          <button
            onClick={resetFilter}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-800"
          >
            <RotateCcw size={16} />
            Reset
          </button>
          <div className="relative group">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-800"
            >
              <Download size={16} />
              Export
            </button>
            <div className="absolute right-0 top-full z-30 mt-1 hidden w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg group-hover:block">
              <button onClick={exportCSV} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                <Download size={14} className="text-slate-400" />
                Export CSV
              </button>
              <button onClick={exportExcel} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                <Download size={14} className="text-slate-400" />
                Export Excel
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-800"
          >
            <Upload size={16} />
            Import
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
              <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto max-h-[calc(100vh-260px)] overflow-y-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[3200px] border-collapse text-left text-sm text-black">
                <thead className="sticky top-0 z-20">
                  <tr className="bg-[#0e6187]">
                    <th scope="col" className="border border-slate-600 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-white w-[40px]">No</th>
                    <th scope="col" className="border border-slate-600 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white w-[170px]">NIK</th>
                    <th scope="col" className="border border-slate-600 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white w-[160px]">No. Registrasi</th>
                    <th scope="col" className="border border-slate-600 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white w-[200px]">Nama Kandidat</th>
                    <th scope="col" className="border border-slate-600 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white w-[140px]">Batch</th>
                    <th scope="col" className="border border-slate-600 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white w-[120px]">Real Batch</th>
                    <th scope="col" className="border border-slate-600 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-white w-[40px]">JK</th>
                    <th scope="col" className="border border-slate-600 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white w-[220px]">Tempat, Tanggal Lahir</th>
                    <th scope="col" className="border border-slate-600 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white w-[250px]">Alamat</th>
                    <th scope="col" className="border border-slate-600 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white w-[140px]">Desa</th>
                    <th scope="col" className="border border-slate-600 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white w-[140px]">Kecamatan</th>
                    <th scope="col" className="border border-slate-600 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white w-[140px]">Kab./Kota</th>
                    <th scope="col" className="border border-slate-600 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white w-[140px]">Provinsi</th>
                    <th scope="col" className="border border-slate-600 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white w-[130px]">Pend. Terakhir</th>
                    <th scope="col" className="border border-slate-600 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-white w-[80px]">Tahun Lulus</th>
                    <th scope="col" className="border border-slate-600 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-white w-[50px]">TB</th>
                    <th scope="col" className="border border-slate-600 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-white w-[50px]">BB</th>
                    <th scope="col" className="border border-slate-600 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-white w-[60px]">Goldar</th>
                    <th scope="col" className="border border-slate-600 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-white w-[70px]">Uk. Baju</th>
                    <th scope="col" className="border border-slate-600 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white w-[110px]">Status Nikah</th>
                    <th scope="col" className="border border-slate-600 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white w-[220px]">E-mail</th>
                    <th scope="col" className="border border-slate-600 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white w-[150px]">No. Tlp</th>
                    <th scope="col" className="border border-slate-600 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white w-[180px]">Nama Orang Tua/Wali</th>
                    <th scope="col" className="border border-slate-600 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white w-[150px]">No. Tlp Orang Tua</th>
                    <th scope="col" className="border border-slate-600 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-white w-[80px]">Status</th>
                    <th scope="col" className="border border-slate-600 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white w-[180px]">Ket.</th>
                    <th scope="col" className="sticky right-0 z-30 border border-slate-600 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-white bg-[#0e6187] shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] w-[80px]">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedList.length > 0 ? (
                    pagedList.map((k, idx) => {
                      const isEditing = editingId === k.id
                      const rowNum = (safePage - 1) * perPage + idx + 1
                      const bc = getBatchColor(k.batch_nama)
                      const batchBg = k.batch_warna ? hexToRgba(k.batch_warna, 0.08) : undefined
                      const batchBadgeBg = k.batch_warna || '#3b82f6'
                      return (
                        <tr key={k.id} className={`${isEditing ? 'bg-blue-50/50' : k.level_status_keluar ? 'bg-red-200' : k.is_cuti ? 'bg-yellow-300' : k.status_akademik === 'NONAKTIF' ? 'bg-red-200' : ''} transition hover:brightness-[0.97] group`} style={(!isEditing && !k.level_status_keluar && !k.is_cuti && k.status_akademik !== 'NONAKTIF' && batchBg) ? { backgroundColor: batchBg } : undefined}>
                          <td className="border border-slate-200 px-4 py-3 text-center text-xs font-semibold text-black">{rowNum}</td>
                          <td className="border border-slate-200 px-4 py-3 text-xs font-mono font-semibold text-black whitespace-nowrap">
                            {isEditing ? <CellEdit field="nik" /> : k.nik || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs font-mono font-semibold text-black whitespace-nowrap">
                            {k.no_registrasi || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 max-w-[200px] overflow-hidden">
                            {isEditing ? <CellEdit field="nama" /> : (
                              <div className="flex items-center gap-2 min-w-0">
                                <img
                                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(k.nama)}&background=e5e7eb&color=6b7280&size=24`}
                                  className="h-6 w-6 rounded-full object-cover flex-none"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                />
                                <div className="min-w-0">
                                  <div className={`font-bold truncate ${k.level_status_keluar ? 'text-red-600' : k.status_akademik === 'NONAKTIF' ? 'text-red-600' : 'text-black'}`}>{k.nama}</div>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold whitespace-nowrap leading-none text-white" style={{ backgroundColor: batchBadgeBg, borderColor: batchBadgeBg }}>
                              {k.batch_nama || '-'}
                              <select
                                value={String(k.batch_id ?? '')}
                                onChange={e => handlePindahBatch(k.id, e.target.value)}
                                className="cursor-pointer rounded border border-slate-300 bg-white p-0.5 text-[9px] text-slate-400 outline-none transition hover:border-slate-400 hover:text-slate-600"
                                title="Pindah Batch"
                              >
                                <option value="">-</option>
                                {batchOptions.map(b => (
                                  <option key={b.id} value={b.id}>{b.nama}</option>
                                ))}
                              </select>
                            </span>
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs font-semibold text-black whitespace-nowrap">
                            {isEditing ? <CellEdit field="real_batch" /> : k.real_batch || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs font-semibold text-black text-center">
                            {isEditing ? <CellEdit field="jenis_kelamin" type="select" /> : (k.jenis_kelamin === 'L' ? 'L' : k.jenis_kelamin === 'P' ? 'P' : '-')}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs font-semibold text-black whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex gap-1">
                                <CellEdit field="tempat_lahir" />
                                <CellEdit field="tanggal_lahir" type="date" />
                              </div>
                            ) : (k.tempat_lahir !== '-' && k.tanggal_lahir !== '-' ? `${k.tempat_lahir}, ${k.tanggal_lahir}` : '-')}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs font-semibold text-black max-w-[250px]">
                            {isEditing ? <CellEdit field="alamat" /> : <span className="truncate block" title={k.alamat}>{k.alamat || '-'}</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs font-semibold text-black whitespace-nowrap">
                            {isEditing ? <CellEdit field="desa" /> : k.desa || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs font-semibold text-black whitespace-nowrap">
                            {isEditing ? <CellEdit field="kecamatan" /> : k.kecamatan || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs font-semibold text-black whitespace-nowrap">
                            {isEditing ? <CellEdit field="kabupaten" /> : k.kabupaten || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs font-semibold text-black whitespace-nowrap">
                            {isEditing ? <CellEdit field="provinsi" /> : k.provinsi || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs font-semibold text-black whitespace-nowrap">
                            {isEditing ? <CellEdit field="pendidikan_terakhir" type="select" /> : k.pendidikan_terakhir || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs font-semibold text-black text-center">
                            {isEditing ? <CellEdit field="tahun_lulus" /> : k.tahun_lulus || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs font-semibold text-black text-center">
                            {isEditing ? <CellEdit field="tinggi_badan" type="number" /> : (k.tinggi_badan || <span className="text-gray-400">-</span>)}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs font-semibold text-black text-center">
                            {isEditing ? <CellEdit field="berat_badan" type="number" /> : (k.berat_badan || <span className="text-gray-400">-</span>)}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs font-semibold text-black text-center">
                            {isEditing ? <CellEdit field="goldar" type="select" /> : k.goldar || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs font-semibold text-black text-center">
                            {isEditing ? <CellEdit field="ukuran_baju" type="select" /> : k.ukuran_baju || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs font-semibold text-black">
                            {isEditing ? <CellEdit field="status_pernikahan" type="select" /> : k.status_pernikahan || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs font-mono font-semibold text-black whitespace-nowrap">
                            {isEditing ? <CellEdit field="email" /> : k.email}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs font-mono font-semibold text-black whitespace-nowrap">
                            {isEditing ? <CellEdit field="no_hp" /> : k.no_hp || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs font-semibold text-black">
                            {isEditing ? <CellEdit field="nama_ortu" /> : k.nama_ortu || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs font-mono font-semibold text-black whitespace-nowrap">
                            {isEditing ? <CellEdit field="no_hp_ortu" /> : k.no_hp_ortu || <span className="text-gray-400">-</span>}
                          </td>
                           <td className="border border-slate-200 px-4 py-3">
                             <div className="flex flex-col items-center gap-1">
                               {statusBadge(k.status)}
                               {k.status_akademik && (
                                 <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${k.status_akademik === 'AKTIF' ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-red-200 bg-red-50 text-red-500'}`}>
                                   <span className={`h-1 w-1 rounded-full ${k.status_akademik === 'AKTIF' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                   {k.status_akademik}
                                 </span>
                               )}
                               {k.is_cuti ? (
                                 <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                                   <span className="h-1 w-1 rounded-full bg-amber-500" />
                                   CUTI{k.cuti_sejak ? ` ${k.cuti_sejak}` : ''}
                                 </span>
                               ) : null}
                             </div>
                           </td>
                           <td className="border border-slate-200 px-4 py-3 text-xs font-semibold text-black max-w-[180px]">
                            {isEditing ? <CellEdit field="keterangan" /> : (
                              <div className="flex flex-col gap-1">
                                {k.level_status_keluar ? <span className="inline-block w-fit rounded bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">KELUAR</span> : null}
                                {k.status_akademik === 'NONAKTIF' ? <span className="inline-block w-fit rounded bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">NONAKTIF</span> : null}
                                {k.is_cuti ? <span className="inline-block w-fit rounded bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-black">CUTI</span> : null}
                                {k.keterangan && k.keterangan !== '-' && String(k.keterangan) !== '0' ? <span className="truncate block" title={k.keterangan}>{k.keterangan}</span> : <span className="text-gray-400">-</span>}
                              </div>
                            )}
                           </td>
                          <td className={`sticky right-0 z-10 border border-slate-200 px-3 py-3 text-center shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] ${isEditing ? 'bg-blue-50/50' : 'bg-white'}`}>
                            {isEditing ? (
                              <div className="flex justify-center gap-1">
                                <button onClick={saveEdit} disabled={saving}
                                  className="rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50" title="Simpan">
                                  <Check size={14} />
                                </button>
                                <button onClick={cancelEdit}
                                  className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-500 transition hover:bg-red-100" title="Batal">
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <div className="relative flex justify-center" ref={openActionId === k.id ? actionRef : undefined}>
                                <button
                                  onClick={() => setOpenActionId(openActionId === k.id ? null : k.id)}
                                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                                  title="Aksi"
                                >
                                  <MoreHorizontal size={16} />
                                </button>
                                {openActionId === k.id && (
                                  <div className="absolute right-0 top-full z-30 mt-1 w-52 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                                    <button onClick={() => { setDetailKandidat(k); setOpenActionId(null) }}
                                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                                      <Eye size={14} className="text-slate-400" />
                                      <span>Detail Lengkap</span>
                                    </button>
                                    <button onClick={() => { startEdit(k); setOpenActionId(null) }}
                                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                                      <Edit3 size={14} className="text-slate-400" />
                                      <span>Edit Data</span>
                                    </button>
                                    <Link to={`/pendaftar/${k.id}/invoice`} onClick={() => setOpenActionId(null)}
                                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                                      <Receipt size={14} className="text-slate-400" />
                                      <span>Lihat Invoice</span>
                                    </Link>
                                    <div className="my-1 border-t border-slate-100" />
                                    <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Aksi</p>
                                    <button onClick={() => { handleToggleStatus(k.id); setOpenActionId(null) }}
                                      disabled={togglingId === k.id}
                                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50">
                                      {k.status_akademik === 'NONAKTIF'
                                        ? <Power size={14} className="text-emerald-400" />
                                        : <PowerOff size={14} className="text-amber-400" />}
                                      <span>{k.status_akademik === 'NONAKTIF' ? 'Aktifkan' : 'Nonaktifkan'}</span>
                                    </button>
                                    <button onClick={() => { handleToggleCuti(k.id); setOpenActionId(null) }}
                                      disabled={togglingCutiId === k.id}
                                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50">
                                      {k.is_cuti
                                        ? <Calendar size={14} className="text-amber-400" />
                                        : <CalendarOff size={14} className="text-slate-400" />}
                                      <span>{k.is_cuti ? 'Aktifkan dari Cuti' : 'Cuti'}</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={27} className="border border-slate-200 px-6 py-10 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <Users size={24} />
                        </div>
                        <p className="mt-3 text-sm font-medium text-slate-600">Tidak ada kandidat ditemukan</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
              Menampilkan {pagedList.length} dari {filteredList.length} kandidat
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredList.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="text-xs font-medium">Per halaman</span>
            <div className="relative">
              <select
                value={perPage}
                onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                className="appearance-none rounded-lg border border-slate-200 bg-slate-50 px-7 py-1.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              >
                {[10, 25, 50, 100].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={safePage <= 1}
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 shadow-sm transition hover:bg-slate-50 hover:text-slate-600 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronsLeft size={15} />
            </button>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 shadow-sm transition hover:bg-slate-50 hover:text-slate-600 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft size={15} />
            </button>
            {(() => {
              const pages: (number | '...')[] = []
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i)
              } else {
                pages.push(1)
                if (safePage > 3) pages.push('...')
                const start = Math.max(2, safePage - 1)
                const end = Math.min(totalPages - 1, safePage + 1)
                for (let i = start; i <= end; i++) pages.push(i)
                if (safePage < totalPages - 2) pages.push('...')
                pages.push(totalPages)
              }
              return pages.map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} className="px-1.5 text-sm text-slate-300">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[34px] rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                      p === safePage
                        ? 'border-[#0E6187] bg-[#0E6187] text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                )
              )
            })()}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 shadow-sm transition hover:bg-slate-50 hover:text-slate-600 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight size={15} />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={safePage >= totalPages}
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 shadow-sm transition hover:bg-slate-50 hover:text-slate-600 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronsRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal — Simple & Wide */}
      {detailKandidat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetailKandidat(null)}>
          <div className="w-full max-w-5xl rounded-xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#0E6187] flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{detailKandidat.nama?.charAt(0)?.toUpperCase()}</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">{detailKandidat.nama}</h2>
                  <p className="text-xs text-slate-500">{detailKandidat.email}</p>
                </div>
                <span className="ml-2">{statusBadge(detailKandidat.status)}</span>
                {detailKandidat.status_akademik && (
                  <span className={`ml-1 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${detailKandidat.status_akademik === 'AKTIF' ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-red-200 bg-red-50 text-red-500'}`}>
                    {detailKandidat.status_akademik}
                  </span>
                )}
                {detailKandidat.is_cuti ? (
                  <span className="ml-1 inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                    CUTI{detailKandidat.cuti_sejak ? ` ${detailKandidat.cuti_sejak}` : ''}
                  </span>
                ) : null}
              </div>
              <button onClick={() => setDetailKandidat(null)} className="rounded-lg p-1.5 hover:bg-slate-100 transition"><X size={18} className="text-slate-400" /></button>
            </div>

            {/* Body — 3 Column Grid */}
            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
              {/* Data Akun Kandidat */}
              {detailKandidat.password_plain ? (
                <div className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-2">Data Akun Kandidat (Email + Password untuk login)</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <div className="flex gap-2">
                      <span className="font-semibold text-slate-700">No. Reg</span>
                      <span className="text-slate-500">:</span>
                      <span className="font-mono text-slate-900">{detailKandidat.no_registrasi}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-semibold text-slate-700">Password</span>
                      <span className="text-slate-500">:</span>
                      <span className="font-mono font-bold text-red-600">{detailKandidat.password_plain}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-semibold text-slate-700">Nama</span>
                      <span className="text-slate-500">:</span>
                      <span className="text-slate-900">{detailKandidat.nama}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-semibold text-slate-700">Email</span>
                      <span className="text-slate-500">:</span>
                      <span className="text-slate-900">{detailKandidat.email}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Data Akun Kandidat</h3>
                  <p className="text-xs text-slate-400">Password tidak tersedia (akun dibuat sebelum fitur ini diaktifkan)</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-x-8 gap-y-3">
                <InfoItem label="NIK" value={detailKandidat.nik} />
                <InfoItem label="No. Registrasi" value={detailKandidat.no_registrasi} mono />
                <InfoItem label="Batch" value={detailKandidat.batch_nama} />
                <InfoItem label="Real Batch" value={detailKandidat.real_batch} />
                <InfoItem label="Jenis Kelamin" value={detailKandidat.jenis_kelamin === 'L' ? 'Laki-laki' : detailKandidat.jenis_kelamin === 'P' ? 'Perempuan' : null} />
                <InfoItem label="Tempat, Tanggal Lahir" value={detailKandidat.tempat_lahir !== '-' && detailKandidat.tanggal_lahir !== '-' ? `${detailKandidat.tempat_lahir}, ${detailKandidat.tanggal_lahir}` : null} />
                <InfoItem label="No. HP" value={detailKandidat.no_hp} />
                <InfoItem label="Email" value={detailKandidat.email} />
                <InfoItem label="Pendidikan Terakhir" value={detailKandidat.pendidikan_terakhir} />
                <InfoItem label="Tahun Lulus" value={detailKandidat.tahun_lulus} />
                <InfoItem label="Tinggi Badan" value={detailKandidat.tinggi_badan ? `${detailKandidat.tinggi_badan} cm` : null} />
                <InfoItem label="Berat Badan" value={detailKandidat.berat_badan ? `${detailKandidat.berat_badan} kg` : null} />
                <InfoItem label="Golongan Darah" value={detailKandidat.goldar} />
                <InfoItem label="Ukuran Baju" value={detailKandidat.ukuran_baju} />
                <InfoItem label="Status Nikah" value={detailKandidat.status_pernikahan} />
                <InfoItem label="Alamat" value={detailKandidat.alamat} />
                <InfoItem label="Desa" value={detailKandidat.desa} />
                <InfoItem label="Kecamatan" value={detailKandidat.kecamatan} />
                <InfoItem label="Kab./Kota" value={detailKandidat.kabupaten} />
                <InfoItem label="Provinsi" value={detailKandidat.provinsi} />
                <InfoItem label="Nama Orang Tua" value={detailKandidat.nama_ortu} />
                <InfoItem label="No. HP Orang Tua" value={detailKandidat.no_hp_ortu} />
                {detailKandidat.keterangan && detailKandidat.keterangan !== '-' && (
                  <div className="col-span-3">
                    <InfoItem label="Keterangan" value={detailKandidat.keterangan} />
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 border-t border-slate-200 px-6 py-3.5">
              <button onClick={() => { setDetailKandidat(null); startEdit(detailKandidat); }}
                className="flex items-center gap-2 rounded-lg bg-[#0E6187] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a3a5c]">
                <Edit3 size={14} /> Edit Data
              </button>
              <Link to={`/pendaftar/${detailKandidat.id}/invoice`}
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                <Receipt size={14} /> Lihat Invoice
              </Link>
              <button onClick={() => setDetailKandidat(null)}
                className="ml-auto rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tambah Data Modal */}
      {showTambah && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10 pb-10" onClick={() => { setShowTambah(false); setTambahSuccess(null) }}>
          <div className="w-full max-w-4xl rounded-xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <Plus size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Tambah Data Kandidat</h2>
                  <p className="text-xs text-slate-500">Lengkapi data kandidat baru</p>
                </div>
              </div>
              <button onClick={() => { setShowTambah(false); setTambahSuccess(null) }} className="rounded-lg p-1.5 hover:bg-slate-100 transition">
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            {tambahSuccess ? (
              <div className="px-6 py-10 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <Check size={32} className="text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Kandidat Berhasil Ditambahkan!</h3>
                <p className="text-sm text-slate-500 mb-6">Data kandidat baru telah tersimpan di sistem.</p>
                <div className="mx-auto mb-6 max-w-sm rounded-lg border border-slate-200 bg-slate-50 p-4 text-left">
                  <div className="mb-3">
                    <p className="text-xs text-slate-400">No. Registrasi</p>
                    <p className="text-sm font-mono font-bold text-slate-800">{tambahSuccess.noReg}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Password Akun</p>
                    <p className="text-sm font-mono font-bold text-red-600">{tambahSuccess.password}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-4">Simpan informasi di atas, password hanya ditampilkan sekali.</p>
                <div className="flex justify-center gap-3">
                  <button onClick={() => { setShowTambah(false); setTambahSuccess(null) }}
                    className="rounded-lg bg-[#0E6187] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#1a3a5c]">
                    Tutup
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleTambahSubmit} autoComplete="off" className="px-6 py-5 max-h-[70vh] overflow-y-auto">
                {tambahError && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <p className="font-semibold mb-1">Gagal menyimpan:</p>
                    <pre className="whitespace-pre-wrap text-xs">{tambahError}</pre>
                  </div>
                )}
                {/* Data Diri */}
                <h3 className="mb-3 text-sm font-bold text-slate-700 uppercase tracking-wide">Data Diri</h3>
                <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <FormField label="Nama Lengkap *" value={tambahForm.nama} onChange={v => updateTambahField('nama', v)} placeholder="Nama lengkap" maxLength={255} error={tambahErrors.nama} />
                  <FormField label="Email *" value={tambahForm.email} onChange={v => updateTambahField('email', v)} type="email" placeholder="email@contoh.com" error={tambahErrors.email} />
                  <FormField label="NIK" value={tambahForm.nik} onChange={v => updateTambahField('nik', v)} placeholder="Nomor NIK (maks. 50)" maxLength={50} error={tambahErrors.nik} />
                  <FormField label="No. Telepon" value={tambahForm.telepon} onChange={v => updateTambahField('telepon', v)} placeholder="No. telepon (maks. 20)" maxLength={20} error={tambahErrors.telepon} />
                  <FormField label="No. HP" value={tambahForm.no_hp} onChange={v => updateTambahField('no_hp', v)} placeholder="No. HP (maks. 20)" maxLength={20} error={tambahErrors.no_hp} />
                  <FormSelect label="Jenis Kelamin" value={tambahForm.jenis_kelamin} onChange={v => updateTambahField('jenis_kelamin', v)}
                    options={[{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]} error={tambahErrors.jenis_kelamin} />
                  <FormField label="Tempat Lahir" value={tambahForm.tempat_lahir} onChange={v => updateTambahField('tempat_lahir', v)} placeholder="Kota kelahiran (maks. 255)" maxLength={255} error={tambahErrors.tempat_lahir} />
                  <FormField label="Tanggal Lahir" value={tambahForm.tanggal_lahir} onChange={v => updateTambahField('tanggal_lahir', v)} type="date" error={tambahErrors.tanggal_lahir} />
                  <FormSelect label="Status Nikah" value={tambahForm.status_pernikahan} onChange={v => updateTambahField('status_pernikahan', v)}
                    options={[{ value: 'Belum Nikah', label: 'Belum Nikah' }, { value: 'Nikah', label: 'Nikah' }, { value: 'Cerai', label: 'Cerai' }]} error={tambahErrors.status_pernikahan} />
                </div>

                {/* Alamat */}
                <h3 className="mb-3 text-sm font-bold text-slate-700 uppercase tracking-wide">Alamat</h3>
                <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="sm:col-span-2 lg:col-span-3">
                    <FormField label="Alamat" value={tambahForm.alamat} onChange={v => updateTambahField('alamat', v)} placeholder="Alamat lengkap" error={tambahErrors.alamat} />
                  </div>
                  <FormField label="Desa" value={tambahForm.desa} onChange={v => updateTambahField('desa', v)} placeholder="Nama desa (maks. 255)" maxLength={255} error={tambahErrors.desa} />
                  <FormField label="Kecamatan" value={tambahForm.kecamatan} onChange={v => updateTambahField('kecamatan', v)} placeholder="Nama kecamatan (maks. 255)" maxLength={255} error={tambahErrors.kecamatan} />
                  <FormField label="Kab./Kota" value={tambahForm.kabupaten} onChange={v => updateTambahField('kabupaten', v)} placeholder="Nama kabupaten/kota (maks. 255)" maxLength={255} error={tambahErrors.kabupaten} />
                  <FormField label="Provinsi" value={tambahForm.provinsi} onChange={v => updateTambahField('provinsi', v)} placeholder="Nama provinsi (maks. 255)" maxLength={255} error={tambahErrors.provinsi} />
                </div>

                {/* Pendidikan & Fisik */}
                <h3 className="mb-3 text-sm font-bold text-slate-700 uppercase tracking-wide">Pendidikan & Data Fisik</h3>
                <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <FormSelect label="Pendidikan Terakhir" value={tambahForm.pendidikan_terakhir} onChange={v => updateTambahField('pendidikan_terakhir', v)}
                    options={[{ value: 'SD/Sederajat', label: 'SD/Sederajat' }, { value: 'SMP/Sederajat', label: 'SMP/Sederajat' }, { value: 'SMA/Sederajat', label: 'SMA/Sederajat' }, { value: 'D1-D3', label: 'D1-D3' }, { value: 'S1', label: 'S1' }, { value: 'S2', label: 'S2' }]} error={tambahErrors.pendidikan_terakhir} />
                  <FormField label="Tahun Lulus" value={tambahForm.tahun_lulus} onChange={v => updateTambahField('tahun_lulus', v)} placeholder="Contoh: 2023 (4 digit)" maxLength={4} error={tambahErrors.tahun_lulus} />
                  <FormField label="Tinggi Badan (cm)" value={tambahForm.tinggi_badan} onChange={v => updateTambahField('tinggi_badan', v)} type="number" placeholder="cm" error={tambahErrors.tinggi_badan} />
                  <FormField label="Berat Badan (kg)" value={tambahForm.berat_badan} onChange={v => updateTambahField('berat_badan', v)} type="number" placeholder="kg" error={tambahErrors.berat_badan} />
                  <FormSelect label="Golongan Darah" value={tambahForm.goldar} onChange={v => updateTambahField('goldar', v)}
                    options={[{ value: 'A', label: 'A' }, { value: 'B', label: 'B' }, { value: 'AB', label: 'AB' }, { value: 'O', label: 'O' }]} error={tambahErrors.goldar} />
                  <FormSelect label="Ukuran Baju" value={tambahForm.ukuran_baju} onChange={v => updateTambahField('ukuran_baju', v)}
                    options={[{ value: 'XS', label: 'XS' }, { value: 'S', label: 'S' }, { value: 'M', label: 'M' }, { value: 'L', label: 'L' }, { value: 'XL', label: 'XL' }, { value: 'XXL', label: 'XXL' }]} error={tambahErrors.ukuran_baju} />
                </div>

                {/* Keluarga & Lainnya */}
                <h3 className="mb-3 text-sm font-bold text-slate-700 uppercase tracking-wide">Keluarga & Lainnya</h3>
                <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <FormField label="Nama Orang Tua/Wali" value={tambahForm.nama_ortu} onChange={v => updateTambahField('nama_ortu', v)} placeholder="Nama orang tua (maks. 255)" maxLength={255} error={tambahErrors.nama_ortu} />
                  <FormField label="No. Tlp Orang Tua" value={tambahForm.no_hp_ortu} onChange={v => updateTambahField('no_hp_ortu', v)} placeholder="No. tlp orang tua (maks. 20)" maxLength={20} error={tambahErrors.no_hp_ortu} />
                  <FormSelect label="Batch" value={tambahForm.batch_id} onChange={v => updateTambahField('batch_id', v)}
                    options={batchOptions.map(b => ({ value: String(b.id), label: b.nama }))} error={tambahErrors.batch_id} />
                  <FormField label="Real Batch" value={tambahForm.real_batch} onChange={v => updateTambahField('real_batch', v)} placeholder="Real batch (maks. 255)" maxLength={255} error={tambahErrors.real_batch} />
                  <div className="sm:col-span-2 lg:col-span-3">
                    <FormField label="Keterangan" value={tambahForm.keterangan} onChange={v => updateTambahField('keterangan', v)} placeholder="Keterangan tambahan (maks. 500)" maxLength={500} error={tambahErrors.keterangan} />
                  </div>
                </div>
              </form>
            )}

            {/* Footer */}
            {!tambahSuccess && (
              <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-3.5">
                <button type="button" onClick={() => { setShowTambah(false); setTambahSuccess(null) }}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Batal
                </button>
                <button type="submit" onClick={handleTambahSubmit} disabled={tambahLoading || !tambahForm.nama || !tambahForm.email}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  {tambahLoading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  {tambahLoading ? 'Menyimpan...' : 'Simpan Kandidat'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10 pb-10" onClick={resetImport}>
          <div className="w-full max-w-5xl rounded-xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] text-white">
                  <Upload size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Import Data Kandidat</h2>
                  <p className="text-xs text-slate-500">Upload file CSV atau Excel (.xlsx, .xls)</p>
                </div>
              </div>
              <button onClick={resetImport} className="rounded-lg p-1.5 hover:bg-slate-100 transition">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <div className="px-6 py-5">
              {!importResult ? (
                <>
                  <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-medium text-slate-600">Pilih File</label>
                      <input
                        ref={importFileRef}
                        type="file"
                        accept=".csv,.xls,.xlsx"
                        onChange={handleImportFile}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-[#0E6187] file:px-3 file:py-1 file:text-xs file:font-medium file:text-white hover:file:bg-[#1a3a5c]"
                      />
                    </div>
                    <div className="sm:w-60">
                      <label className="mb-1 block text-xs font-medium text-slate-600">Batch Tujuan</label>
                      <select
                        value={importBatchId}
                        onChange={e => setImportBatchId(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="">Pilih Batch...</option>
                        {batchOptions.map(b => (
                          <option key={b.id} value={b.id}>{b.nama}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={handleImportSubmit}
                      disabled={!importBatchId || importData.length === 0 || importLoading}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#0E6187] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#1a3a5c] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {importLoading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                      {importLoading ? 'Mengimport...' : `Import ${importData.length} Data`}
                    </button>
                  </div>

                  {importData.length > 0 && (
                    <div className="mb-5">
                      <p className="mb-2 text-xs font-medium text-slate-600">Pemetaan Kolom ({importData.length} baris terdeteksi)</p>
                      <p className="mb-3 text-[11px] text-slate-400">Kolom dengan nama yang cocok akan otomatis dipetakan. Sesuaikan jika perlu. Kolom yang dipilih "- Lewati -" tidak akan diimport.</p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {importHeaders.map(h => (
                          <div key={h} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
                            <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-700" title={h}>{h}</span>
                            <svg className="h-3 w-3 flex-shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            <select
                              value={importMapping[h] || ''}
                              onChange={e => setImportMapping(prev => ({ ...prev, [h]: e.target.value }))}
                              className="w-[130px] rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[11px] text-slate-700 outline-none focus:border-blue-400"
                            >
                              {fieldOptions.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {importData.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium text-slate-600">Preview Data (5 baris pertama)</p>
                      <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="w-full min-w-[600px] border-collapse text-left text-xs text-slate-700">
                          <thead>
                            <tr className="bg-slate-50">
                              {importHeaders.filter(h => importMapping[h]).map(h => (
                                <th key={h} className="border border-slate-200 px-3 py-2 font-semibold text-slate-600">{h}<br/><span className="font-normal text-slate-400">→ {fieldOptions.find(f => f.value === importMapping[h])?.label || importMapping[h]}</span></th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {importData.slice(0, 5).map((row, i) => (
                              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                {importHeaders.filter(h => importMapping[h]).map(h => (
                                  <td key={h} className="border border-slate-200 px-3 py-2">{String(row[h] ?? '')}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-6 text-center">
                  {importResult.success > 0 && importResult.failed === 0 ? (
                    <>
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                        <Check size={32} className="text-emerald-600" />
                      </div>
                      <h3 className="mb-2 text-lg font-bold text-slate-900">Import Berhasil!</h3>
                      <p className="text-sm text-slate-600">{importResult.success} data kandidat berhasil diimport.</p>
                    </>
                  ) : (
                    <>
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                        <FileText size={32} className="text-amber-600" />
                      </div>
                      <h3 className="mb-2 text-lg font-bold text-slate-900">Import Selesai</h3>
                      <p className="text-sm text-slate-600 mb-4">
                        <span className="font-semibold text-emerald-600">{importResult.success} berhasil</span> dan{' '}
                        <span className="font-semibold text-red-600">{importResult.failed} gagal</span>
                      </p>
                      {importResult.errors.length > 0 && (
                        <div className="mx-auto max-w-lg text-left">
                          <p className="mb-2 text-xs font-medium text-slate-500">Detail Error:</p>
                          <div className="max-h-48 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3">
                            {importResult.errors.map((err, i) => (
                              <p key={i} className="mb-1 text-xs text-red-600">
                                {err.row > 0 ? `Baris ${err.row}: ` : ''}{err.message}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {importResult.created.length > 0 && (
                    <div className="mx-auto mt-4 max-w-2xl text-left">
                      <p className="mb-2 text-xs font-medium text-slate-600">Data Akun Kandidat (Email + Password untuk login):</p>
                      <div className="max-h-64 overflow-y-auto rounded-lg border border-emerald-200 bg-emerald-50">
                        <table className="w-full border-collapse text-left text-xs">
                          <thead className="sticky top-0 bg-emerald-100">
                            <tr>
                              <th className="border-b border-emerald-200 px-3 py-2 font-semibold text-emerald-800">No. Reg</th>
                              <th className="border-b border-emerald-200 px-3 py-2 font-semibold text-emerald-800">Nama</th>
                              <th className="border-b border-emerald-200 px-3 py-2 font-semibold text-emerald-800">Email</th>
                              <th className="border-b border-emerald-200 px-3 py-2 font-semibold text-emerald-800">Password</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importResult.created.map((c, i) => (
                              <tr key={i} className={i % 2 === 0 ? 'bg-emerald-50' : 'bg-white'}>
                                <td className="border-b border-emerald-100 px-3 py-1.5 font-mono text-[11px] text-slate-700">{c.no_registrasi}</td>
                                <td className="border-b border-emerald-100 px-3 py-1.5 text-slate-700">{c.nama}</td>
                                <td className="border-b border-emerald-100 px-3 py-1.5 text-slate-700">{c.email}</td>
                                <td className="border-b border-emerald-100 px-3 py-1.5 font-mono font-bold text-slate-900">{c.password}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="mt-2 text-[11px] text-amber-600">Simpan data ini! Password hanya ditampilkan sekali ini saja.</p>
                    </div>
                  )}

                  <button onClick={resetImport} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-800 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-900">
                    Tutup
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoItem({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className={`text-sm font-medium ${mono ? 'font-mono' : ''} ${value && value !== '-' ? 'text-slate-800' : 'text-slate-300'}`}>
        {value && value !== '-' ? value : '-'}
      </p>
    </div>
  )
}

function FormField({ label, value, onChange, type, placeholder, error, maxLength }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; error?: string; maxLength?: number }) {
  const hasError = !!error
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      <input
        type={type || 'text'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 ${
          hasError
            ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
            : 'border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
        }`}
      />
      {hasError && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  )
}

function FormSelect({ label, value, onChange, options, error }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; error?: string }) {
  const hasError = !!error
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-700 outline-none transition ${
          hasError
            ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
            : 'border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
        }`}
      >
        <option value="">Pilih...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hasError && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  )
}
