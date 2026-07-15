import { useEffect, useState } from 'react'
import { Users, Search, RotateCcw, Eye, Edit3, Power, PowerOff, CalendarOff, Calendar, Receipt, Check, X, Plus, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { pendaftarApi } from '../../services/api'

interface Kandidat {
  id: number
  nama: string
  email: string
  telepon: string
  nik: string
  no_registrasi: string
  batch_id: number | null
  batch_nama: string
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
  tanggalDaftar: string
  user_id: number | null
  keterangan: string
}

interface BatchOption {
  id: number
  nama: string
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

  useEffect(() => {
    fetchData()
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
          batches.push({ id: b.id, nama: b.nama })
          for (const k of b.kandidat) {
            if (!seen.has(k.id)) {
              seen.add(k.id)
              allKandidat.push(k)
            }
          }
        }
        setKandidatList(allKandidat)
        setBatchOptions(batches)
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
          ? { ...k, batch_id: id, batch_nama: batchOptions.find(b => b.id === id)?.nama || '-' }
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
    const map: Record<string, { dot: string; label: string }> = {
      Disetujui: { dot: 'bg-emerald-500', label: 'Disetujui' },
      Ditolak: { dot: 'bg-red-500', label: 'Ditolak' },
      Pending: { dot: 'bg-amber-500', label: 'Pending' },
    }
    const s = map[status] || { dot: 'bg-slate-300', label: status }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
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

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] text-white">
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
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
            <Users size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Batch</p>
            <p className="text-2xl font-bold text-slate-800">{totalBatch}</p>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
            <Users size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Kandidat</p>
            <p className="text-2xl font-bold text-slate-800">{totalKandidat}</p>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
            <Users size={18} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Kandidat Aktif</p>
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
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterBatch}
            onChange={handleFilterBatch}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Semua Batch</option>
            {batchOptions.map(b => (
              <option key={b.id} value={b.id}>{b.nama}</option>
            ))}
          </select>
          <button
            onClick={() => fetchData(search)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700"
          >
            <Search size={16} />
            Filter
          </button>
          <button
            onClick={resetFilter}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0D1F3C] animate-spin" />
              <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto max-h-[calc(100vh-260px)] overflow-y-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[3200px] border-collapse text-left text-sm text-slate-700">
                <thead className="text-sm text-slate-600 sticky top-0 z-20 bg-slate-50">
                  <tr>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium w-[40px]">No</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 font-medium w-[170px]">NIK</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 font-medium w-[160px]">No. Registrasi</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 font-medium w-[200px]">Nama Kandidat</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 font-medium w-[140px]">Batch</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 font-medium w-[120px]">Real Batch</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium w-[40px]">JK</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 font-medium w-[220px]">Tempat, Tanggal Lahir</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 font-medium w-[250px]">Alamat</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 font-medium w-[140px]">Desa</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 font-medium w-[140px]">Kecamatan</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 font-medium w-[140px]">Kab./Kota</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 font-medium w-[140px]">Provinsi</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 font-medium w-[130px]">Pend. Terakhir</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium w-[80px]">Tahun Lulus</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium w-[50px]">TB</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium w-[50px]">BB</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium w-[60px]">Goldar</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium w-[70px]">Uk. Baju</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 font-medium w-[110px]">Status Nikah</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 font-medium w-[220px]">E-mail</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 font-medium w-[150px]">No. Tlp</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 font-medium w-[180px]">Nama Orang Tua/Wali</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 font-medium w-[150px]">No. Tlp Orang Tua</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium w-[80px]">Status</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 font-medium w-[180px]">Ket.</th>
                    <th scope="col" className="sticky right-0 z-30 border border-slate-200 bg-slate-50 px-4 py-3 text-center font-medium shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] w-[80px]">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedList.length > 0 ? (
                    pagedList.map((k, idx) => {
                      const isEditing = editingId === k.id
                      const rowNum = (safePage - 1) * perPage + idx + 1
                      return (
                        <tr key={k.id} className={`${isEditing ? 'bg-blue-50/50' : k.is_cuti ? 'bg-amber-50' : k.status_akademik === 'NONAKTIF' ? 'bg-red-50' : 'bg-white'} transition hover:bg-slate-50`}>
                          <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-500">{rowNum}</td>
                          <td className="border border-slate-200 px-4 py-3 text-sm font-mono text-slate-700 whitespace-nowrap">
                            {isEditing ? <CellEdit field="nik" /> : k.nik || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-sm font-mono text-slate-700 whitespace-nowrap">
                            {k.no_registrasi || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 max-w-[200px] overflow-hidden">
                            {isEditing ? <CellEdit field="nama" /> : (
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(k.nama)}&background=e5e7eb&color=6b7280&size=28`}
                                  className="h-8 w-8 rounded-full object-cover flex-none"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                />
                                <div className="min-w-0">
                                  <div className={`text-sm font-semibold truncate ${k.status_akademik === 'NONAKTIF' ? 'text-red-500' : 'text-slate-800'}`}>{k.nama}</div>
                                  <div className="text-xs text-slate-500 truncate">{k.email}</div>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">
                            {isEditing ? (
                              <select
                                value={String(k.batch_id ?? '')}
                                onChange={e => handlePindahBatch(k.id, e.target.value)}
                                className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-sm text-slate-700 outline-none cursor-pointer transition hover:border-blue-300 hover:bg-blue-50 focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                              >
                                <option value="">-</option>
                                {batchOptions.map(b => (
                                  <option key={b.id} value={b.id}>{b.nama}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="inline-block rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-sm font-medium text-slate-700">
                                {batchOptions.find(b => String(b.id) === String(k.batch_id))?.nama || <span className="text-slate-300">-</span>}
                              </span>
                            )}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                            {isEditing ? <CellEdit field="real_batch" /> : k.real_batch || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600 text-center">
                            {isEditing ? <CellEdit field="jenis_kelamin" type="select" /> : (k.jenis_kelamin === 'L' ? 'L' : k.jenis_kelamin === 'P' ? 'P' : '-')}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex gap-1">
                                <CellEdit field="tempat_lahir" />
                                <CellEdit field="tanggal_lahir" type="date" />
                              </div>
                            ) : (k.tempat_lahir !== '-' && k.tanggal_lahir !== '-' ? `${k.tempat_lahir}, ${k.tanggal_lahir}` : '-')}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600 max-w-[250px]">
                            {isEditing ? <CellEdit field="alamat" /> : <span className="truncate block" title={k.alamat}>{k.alamat || '-'}</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                            {isEditing ? <CellEdit field="desa" /> : k.desa || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                            {isEditing ? <CellEdit field="kecamatan" /> : k.kecamatan || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                            {isEditing ? <CellEdit field="kabupaten" /> : k.kabupaten || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                            {isEditing ? <CellEdit field="provinsi" /> : k.provinsi || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                            {isEditing ? <CellEdit field="pendidikan_terakhir" type="select" /> : k.pendidikan_terakhir || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600 text-center">
                            {isEditing ? <CellEdit field="tahun_lulus" /> : k.tahun_lulus || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600 text-center">
                            {isEditing ? <CellEdit field="tinggi_badan" type="number" /> : (k.tinggi_badan || <span className="text-slate-300">-</span>)}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600 text-center">
                            {isEditing ? <CellEdit field="berat_badan" type="number" /> : (k.berat_badan || <span className="text-slate-300">-</span>)}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600 text-center">
                            {isEditing ? <CellEdit field="goldar" type="select" /> : k.goldar || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600 text-center">
                            {isEditing ? <CellEdit field="ukuran_baju" type="select" /> : k.ukuran_baju || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">
                            {isEditing ? <CellEdit field="status_pernikahan" type="select" /> : k.status_pernikahan || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-sm font-mono text-slate-700 whitespace-nowrap">
                            {isEditing ? <CellEdit field="email" /> : k.email}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-sm font-mono text-slate-700 whitespace-nowrap">
                            {isEditing ? <CellEdit field="no_hp" /> : k.no_hp || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">
                            {isEditing ? <CellEdit field="nama_ortu" /> : k.nama_ortu || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-sm font-mono text-slate-700 whitespace-nowrap">
                            {isEditing ? <CellEdit field="no_hp_ortu" /> : k.no_hp_ortu || <span className="text-slate-300">-</span>}
                          </td>
                           <td className="border border-slate-200 px-4 py-3 text-center">
                             {statusBadge(k.status)}
                             {k.status_akademik && (
                               <span className={`mt-1 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${k.status_akademik === 'AKTIF' ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-red-200 bg-red-50 text-red-500'}`}>
                                 {k.status_akademik}
                               </span>
                             )}
                             {k.is_cuti ? (
                               <span className="mt-1 inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                                 CUTI{k.cuti_sejak ? ` ${k.cuti_sejak}` : ''}
                               </span>
                             ) : null}
                           </td>
                          <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600 max-w-[180px]">
                            {isEditing ? <CellEdit field="keterangan" /> : <span className="truncate block" title={k.keterangan}>{k.keterangan || <span className="text-slate-300">-</span>}</span>}
                          </td>
                          <td className={`sticky right-0 z-10 border border-slate-200 px-4 py-3 text-center shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] ${isEditing ? 'bg-blue-50/50' : 'bg-white'}`}>
                            <div className="flex justify-center gap-1.5">
                              {isEditing ? (
                                <>
                                  <button onClick={saveEdit} disabled={saving}
                                    className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50" title="Simpan">
                                    <Check size={15} />
                                  </button>
                                  <button onClick={cancelEdit}
                                    className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 transition hover:bg-red-100" title="Batal">
                                    <X size={15} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => setDetailKandidat(k)}
                                    className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-600 transition hover:bg-emerald-100" title="Detail">
                                    <Eye size={15} />
                                  </button>
                                  <button onClick={() => startEdit(k)}
                                    className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-600 transition hover:bg-emerald-100" title="Edit">
                                    <Edit3 size={15} />
                                  </button>
                                  <button onClick={() => handleToggleStatus(k.id)} disabled={togglingId === k.id}
                                    className={`rounded-lg border p-2 transition ${k.status_akademik === 'NONAKTIF' ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'} disabled:opacity-50`}
                                    title={k.status_akademik === 'NONAKTIF' ? 'Aktifkan' : 'Nonaktifkan'}>
                                    {togglingId === k.id ? <Loader2 size={15} className="animate-spin" /> : (k.status_akademik === 'NONAKTIF' ? <Power size={15} /> : <PowerOff size={15} />)}
                                  </button>
                                  <button onClick={() => handleToggleCuti(k.id)} disabled={togglingCutiId === k.id}
                                    className={`rounded-lg border p-2 transition ${k.is_cuti ? 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100' : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'} disabled:opacity-50`}
                                    title={k.is_cuti ? 'Aktifkan dari Cuti' : 'Cuti'}>
                                    {togglingCutiId === k.id ? <Loader2 size={15} className="animate-spin" /> : (k.is_cuti ? <Calendar size={15} /> : <CalendarOff size={15} />)}
                                  </button>
                                  <Link to={`/pendaftar/${k.id}/invoice`}
                                    className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-600 transition hover:bg-emerald-100" title="Invoice">
                                    <Receipt size={15} />
                                  </Link>
                                </>
                              )}
                            </div>
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
            <span>Per halaman</span>
            <select
              value={perPage}
              onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
              className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {[10, 25, 50, 100].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={safePage <= 1}
              className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft size={16} />
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
                  <span key={`dots-${i}`} className="px-1 text-sm text-slate-300">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[32px] rounded-md border px-2 py-1.5 text-sm font-medium transition ${
                      p === safePage
                        ? 'border-slate-200 bg-slate-800 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
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
              className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={safePage >= totalPages}
              className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronsRight size={16} />
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
                <div className="h-10 w-10 rounded-full bg-[#0D1F3C] flex items-center justify-center">
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
                className="flex items-center gap-2 rounded-lg bg-[#0D1F3C] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a3a5c]">
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
                    className="rounded-lg bg-[#0D1F3C] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#1a3a5c]">
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
