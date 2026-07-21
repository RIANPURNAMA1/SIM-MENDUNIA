import { useEffect, useState } from 'react'
import { Users, Search, RotateCcw, Eye, Edit3, Receipt, Check, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { adminCabangApi } from '../../services/api'

interface Kandidat {
  id: number
  nik: string
  no_registrasi: string
  nama: string
  batch_nama: string
  batch_id: number
  real_batch: string
  jenis_kelamin: string
  ttl: string
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
  email: string
  no_hp: string
  nama_ortu: string
  no_hp_ortu: string
  status: string
  keterangan: string
  program: string
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

export default function AdminCabangDataKandidat() {
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
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  useEffect(() => { fetchData() }, [])

  function fetchData(s?: string) {
    setLoading(true)
    const params: Record<string, string> = {}
    if (s) params.search = s
    if (filterBatch) params.batch_id = filterBatch
    adminCabangApi.kandidat(params)
      .then(res => {
        setKandidatList(res.data.kandidat || [])
        setBatchOptions(res.data.batchOptions || [])
        setTotalBatch(res.data.totalBatch || 0)
        setTotalKandidat(res.data.totalKandidat || 0)
        setKandidatAktif(res.data.kandidatAktif || 0)
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
    setFilterBatch(e.target.value)
    setPage(1)
    fetchData(search)
  }

  function resetFilter() {
    setSearch('')
    setFilterBatch('')
    setPage(1)
    fetchData()
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
      await adminCabangApi.updateKandidat(editingId, payload)
      setKandidatList(prev => prev.map(k => k.id === editingId ? { ...k, ...editForm } as Kandidat : k))
      setEditingId(null)
      setEditForm({})
    } catch {
      alert('Gagal menyimpan data')
    } finally {
      setSaving(false)
    }
  }

  function updateField(field: EditableField, value: string) {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  async function handlePindahBatch(kandidatId: number, newBatchId: string) {
    const id = newBatchId ? Number(newBatchId) : null
    try {
      await adminCabangApi.updateKandidat(kandidatId, { batch_id: id })
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
    ? kandidatList.filter(k => String(k.batch_id) === filterBatch)
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
              <table className="w-full min-w-[3200px] border-collapse text-left text-sm text-slate-700">
                <thead className="sticky top-0 z-20">
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100">
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[40px]">No</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[170px]">NIK</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[160px]">No. Registrasi</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[200px]">Nama Kandidat</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[140px]">Batch</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[120px]">Real Batch</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[40px]">JK</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[220px]">Tempat, Tanggal Lahir</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[250px]">Alamat</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[140px]">Desa</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[140px]">Kecamatan</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[140px]">Kab./Kota</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[140px]">Provinsi</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[130px]">Pend. Terakhir</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[80px]">Tahun Lulus</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[50px]">TB</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[50px]">BB</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[60px]">Goldar</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[70px]">Uk. Baju</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[110px]">Status Nikah</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[220px]">E-mail</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[150px]">No. Tlp</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[180px]">Nama Orang Tua/Wali</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[150px]">No. Tlp Orang Tua</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[80px]">Status</th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[180px]">Ket.</th>
                    <th scope="col" className="sticky right-0 z-30 border border-slate-200 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-gradient-to-l from-slate-50 to-slate-100 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] w-[80px]">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedList.length > 0 ? (
                    pagedList.map((k, idx) => {
                      const isEditing = editingId === k.id
                      const rowNum = (safePage - 1) * perPage + idx + 1
                      return (
                        <tr key={k.id} className={`${isEditing ? 'bg-blue-50/50' : 'bg-white'} transition hover:bg-slate-50 group`}>
                          <td className="border border-slate-200 px-4 py-3 text-center text-xs text-slate-500">{rowNum}</td>
                          <td className="border border-slate-200 px-4 py-3 text-xs font-mono text-slate-700 whitespace-nowrap">
                            {isEditing ? <CellEdit field="nik" /> : k.nik || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs font-mono text-slate-700 whitespace-nowrap">
                            {k.no_registrasi || <span className="text-slate-300">-</span>}
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
                                  <div className="font-semibold text-slate-800 truncate">{k.nama}</div>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-slate-100 to-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 whitespace-nowrap leading-none">
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
                          <td className="border border-slate-200 px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                            {isEditing ? <CellEdit field="real_batch" /> : k.real_batch || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs text-slate-600 text-center">
                            {isEditing ? <CellEdit field="jenis_kelamin" type="select" /> : (k.jenis_kelamin === 'L' ? 'L' : k.jenis_kelamin === 'P' ? 'P' : '-')}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex gap-1">
                                <CellEdit field="tempat_lahir" />
                                <CellEdit field="tanggal_lahir" type="date" />
                              </div>
                            ) : (k.tempat_lahir !== '-' && k.tanggal_lahir !== '-' ? `${k.tempat_lahir}, ${k.tanggal_lahir}` : '-')}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs text-slate-600 max-w-[250px]">
                            {isEditing ? <CellEdit field="alamat" /> : <span className="truncate block" title={k.alamat}>{k.alamat || '-'}</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                            {isEditing ? <CellEdit field="desa" /> : k.desa || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                            {isEditing ? <CellEdit field="kecamatan" /> : k.kecamatan || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                            {isEditing ? <CellEdit field="kabupaten" /> : k.kabupaten || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                            {isEditing ? <CellEdit field="provinsi" /> : k.provinsi || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                            {isEditing ? <CellEdit field="pendidikan_terakhir" type="select" /> : k.pendidikan_terakhir || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs text-slate-600 text-center">
                            {isEditing ? <CellEdit field="tahun_lulus" /> : k.tahun_lulus || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs text-slate-600 text-center">
                            {isEditing ? <CellEdit field="tinggi_badan" type="number" /> : (k.tinggi_badan || <span className="text-slate-300">-</span>)}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs text-slate-600 text-center">
                            {isEditing ? <CellEdit field="berat_badan" type="number" /> : (k.berat_badan || <span className="text-slate-300">-</span>)}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs text-slate-600 text-center">
                            {isEditing ? <CellEdit field="goldar" type="select" /> : k.goldar || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs text-slate-600 text-center">
                            {isEditing ? <CellEdit field="ukuran_baju" type="select" /> : k.ukuran_baju || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs text-slate-600">
                            {isEditing ? <CellEdit field="status_pernikahan" type="select" /> : k.status_pernikahan || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs font-mono text-slate-700 whitespace-nowrap">
                            {isEditing ? <CellEdit field="email" /> : k.email}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs font-mono text-slate-700 whitespace-nowrap">
                            {isEditing ? <CellEdit field="no_hp" /> : k.no_hp || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs text-slate-600">
                            {isEditing ? <CellEdit field="nama_ortu" /> : k.nama_ortu || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs font-mono text-slate-700 whitespace-nowrap">
                            {isEditing ? <CellEdit field="no_hp_ortu" /> : k.no_hp_ortu || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border border-slate-200 px-4 py-3">
                            <div className="flex flex-col items-center gap-1">
                              {statusBadge(k.status)}
                            </div>
                          </td>
                          <td className="border border-slate-200 px-4 py-3 text-xs text-slate-600 max-w-[180px]">
                            {isEditing ? <CellEdit field="keterangan" /> : <span className="truncate block" title={k.keterangan}>{k.keterangan || <span className="text-slate-300">-</span>}</span>}
                          </td>
                          <td className={`sticky right-0 z-10 border border-slate-200 px-3 py-3 text-center shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] ${isEditing ? 'bg-blue-50/50' : 'bg-white'}`}>
                            <div className="flex justify-center gap-1">
                              {isEditing ? (
                                <>
                                  <button onClick={saveEdit} disabled={saving}
                                    className="rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50" title="Simpan">
                                    <Check size={14} />
                                  </button>
                                  <button onClick={cancelEdit}
                                    className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-500 transition hover:bg-red-100" title="Batal">
                                    <X size={14} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => setDetailKandidat(k)}
                                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600 group-hover:border-slate-300" title="Detail">
                                    <Eye size={14} />
                                  </button>
                                  <button onClick={() => startEdit(k)}
                                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 group-hover:border-slate-300" title="Edit">
                                    <Edit3 size={14} />
                                  </button>
                                  <Link to={`/admin-cabang/pendaftar/${k.id}/invoice`}
                                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600 group-hover:border-slate-300" title="Invoice">
                                    <Receipt size={14} />
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

      {/* Detail Modal */}
      {detailKandidat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetailKandidat(null)}>
          <div className="w-full max-w-5xl rounded-xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
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
              </div>
              <button onClick={() => setDetailKandidat(null)} className="rounded-lg p-1.5 hover:bg-slate-100 transition"><X size={18} className="text-slate-400" /></button>
            </div>

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
                <InfoItem label="Tinggi Badan" value={detailKandidat.tinggi_badan !== '-' ? `${detailKandidat.tinggi_badan} cm` : null} />
                <InfoItem label="Berat Badan" value={detailKandidat.berat_badan !== '-' ? `${detailKandidat.berat_badan} kg` : null} />
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

            <div className="flex items-center gap-3 border-t border-slate-200 px-6 py-3.5">
              <button onClick={() => { setDetailKandidat(null); startEdit(detailKandidat); }}
                className="flex items-center gap-2 rounded-lg bg-[#0E6187] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a3a5c]">
                <Edit3 size={14} /> Edit Data
              </button>
              <Link to={`/admin-cabang/pendaftar/${detailKandidat.id}/invoice`}
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
