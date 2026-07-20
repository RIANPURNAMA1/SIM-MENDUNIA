import { useEffect, useState } from 'react'
import { Users, Search, RotateCcw, Eye, Edit3, Receipt, Check, X } from 'lucide-react'
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
    if (val.length >= 2 || val.length === 0) {
      clearTimeout((window as Record<string, ReturnType<typeof setTimeout>>)._kandidatTimer)
      ;(window as Record<string, ReturnType<typeof setTimeout>>)._kandidatTimer = setTimeout(() => fetchData(val), 300)
    }
  }

  function resetFilter() {
    setSearch('')
    setFilterBatch('')
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
      await adminCabangApi.updateKandidat(editingId, editForm as Record<string, unknown>)
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
            onChange={e => setFilterBatch(e.target.value)}
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

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
              <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[3200px] border-collapse text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-sm text-slate-600 uppercase tracking-wide sticky top-0">
                <tr>
                  <th className="border border-slate-200 px-4 py-3 text-center font-semibold w-[40px]">No</th>
                  <th className="border border-slate-200 px-4 py-3 font-semibold w-[170px]">NIK</th>
                  <th className="border border-slate-200 px-4 py-3 font-semibold w-[160px]">No. Registrasi</th>
                  <th className="border border-slate-200 px-4 py-3 font-semibold w-[200px]">Nama Kandidat</th>
                  <th className="border border-slate-200 px-4 py-3 font-semibold w-[100px]">Batch</th>
                  <th className="border border-slate-200 px-4 py-3 font-semibold w-[100px]">Real Batch</th>
                  <th className="border border-slate-200 px-4 py-3 text-center font-semibold w-[40px]">JK</th>
                  <th className="border border-slate-200 px-4 py-3 font-semibold w-[220px]">Tempat, Tanggal Lahir</th>
                  <th className="border border-slate-200 px-4 py-3 font-semibold w-[250px]">Alamat</th>
                  <th className="border border-slate-200 px-4 py-3 font-semibold w-[140px]">Desa</th>
                  <th className="border border-slate-200 px-4 py-3 font-semibold w-[140px]">Kecamatan</th>
                  <th className="border border-slate-200 px-4 py-3 font-semibold w-[140px]">Kab./Kota</th>
                  <th className="border border-slate-200 px-4 py-3 font-semibold w-[140px]">Provinsi</th>
                  <th className="border border-slate-200 px-4 py-3 font-semibold w-[130px]">Pend. Terakhir</th>
                  <th className="border border-slate-200 px-4 py-3 text-center font-semibold w-[80px]">Tahun Lulus</th>
                  <th className="border border-slate-200 px-4 py-3 text-center font-semibold w-[50px]">TB</th>
                  <th className="border border-slate-200 px-4 py-3 text-center font-semibold w-[50px]">BB</th>
                  <th className="border border-slate-200 px-4 py-3 text-center font-semibold w-[60px]">Goldar</th>
                  <th className="border border-slate-200 px-4 py-3 text-center font-semibold w-[70px]">Uk. Baju</th>
                  <th className="border border-slate-200 px-4 py-3 font-semibold w-[110px]">Status Nikah</th>
                  <th className="border border-slate-200 px-4 py-3 font-semibold w-[220px]">E-mail</th>
                  <th className="border border-slate-200 px-4 py-3 font-semibold w-[150px]">No. Tlp</th>
                  <th className="border border-slate-200 px-4 py-3 font-semibold w-[180px]">Nama Orang Tua/Wali</th>
                  <th className="border border-slate-200 px-4 py-3 font-semibold w-[150px]">No. Tlp Orang Tua</th>
                  <th className="border border-slate-200 px-4 py-3 text-center font-semibold w-[80px]">Status</th>
                  <th className="border border-slate-200 px-4 py-3 font-semibold w-[180px]">Ket.</th>
                  <th className="sticky right-0 z-10 border border-slate-200 bg-slate-50 px-4 py-3 text-center font-semibold shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] w-[80px]">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length > 0 ? (
                  filteredList.map((k, idx) => {
                    const isEditing = editingId === k.id
                    return (
                      <tr key={k.id} className={`${isEditing ? 'bg-blue-50/50' : 'bg-white'} transition hover:bg-slate-50`}>
                        <td className="border border-slate-200 px-4 py-3 text-center font-medium text-slate-500">{idx + 1}</td>
                        <td className="border border-slate-200 px-4 py-3 whitespace-nowrap">
                          {isEditing ? <CellEdit field="nik" /> : k.nik || '-'}
                        </td>
                        <td className="border border-slate-200 px-4 py-3 whitespace-nowrap font-mono">{k.no_registrasi || '-'}</td>
                        <td className="border border-slate-200 px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                          {isEditing ? <CellEdit field="nama" /> : k.nama}
                        </td>
                        <td className="border border-slate-200 px-4 py-3 whitespace-nowrap">
                          <select
                            value={String(k.batch_id ?? '')}
                            onChange={e => handlePindahBatch(k.id, e.target.value)}
                            className="w-full bg-transparent text-xs text-slate-700 outline-none cursor-pointer"
                          >
                            <option value="">-</option>
                            {batchOptions.map(b => (
                              <option key={b.id} value={b.id}>{b.nama}</option>
                            ))}
                          </select>
                        </td>
                        <td className="border border-slate-200 px-4 py-3 whitespace-nowrap">
                          {isEditing ? <CellEdit field="real_batch" /> : k.real_batch || '-'}
                        </td>
                        <td className="border border-slate-200 px-4 py-3 text-center">
                          {isEditing ? <CellEdit field="jenis_kelamin" type="select" /> : (k.jenis_kelamin === 'L' ? 'L' : k.jenis_kelamin === 'P' ? 'P' : '-')}
                        </td>
                        <td className="border border-slate-200 px-4 py-3 whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex gap-1">
                              <CellEdit field="tempat_lahir" />
                              <CellEdit field="tanggal_lahir" type="date" />
                            </div>
                          ) : (k.tempat_lahir !== '-' && k.tanggal_lahir !== '-' ? `${k.tempat_lahir}, ${k.tanggal_lahir}` : '-')}
                        </td>
                        <td className="border border-slate-200 px-4 py-3 max-w-[250px]">
                          {isEditing ? <CellEdit field="alamat" /> : <span className="truncate block" title={k.alamat}>{k.alamat || '-'}</span>}
                        </td>
                        <td className="border border-slate-200 px-4 py-3 whitespace-nowrap">
                          {isEditing ? <CellEdit field="desa" /> : k.desa || '-'}
                        </td>
                        <td className="border border-slate-200 px-4 py-3 whitespace-nowrap">
                          {isEditing ? <CellEdit field="kecamatan" /> : k.kecamatan || '-'}
                        </td>
                        <td className="border border-slate-200 px-4 py-3 whitespace-nowrap">
                          {isEditing ? <CellEdit field="kabupaten" /> : k.kabupaten || '-'}
                        </td>
                        <td className="border border-slate-200 px-4 py-3 whitespace-nowrap">
                          {isEditing ? <CellEdit field="provinsi" /> : k.provinsi || '-'}
                        </td>
                        <td className="border border-slate-200 px-4 py-3 whitespace-nowrap">
                          {isEditing ? <CellEdit field="pendidikan_terakhir" type="select" /> : k.pendidikan_terakhir || '-'}
                        </td>
                        <td className="border border-slate-200 px-4 py-3 text-center whitespace-nowrap">
                          {isEditing ? <CellEdit field="tahun_lulus" /> : k.tahun_lulus || '-'}
                        </td>
                        <td className="border border-slate-200 px-4 py-3 text-center">
                          {isEditing ? <CellEdit field="tinggi_badan" type="number" /> : k.tinggi_badan || '-'}
                        </td>
                        <td className="border border-slate-200 px-4 py-3 text-center">
                          {isEditing ? <CellEdit field="berat_badan" type="number" /> : k.berat_badan || '-'}
                        </td>
                        <td className="border border-slate-200 px-4 py-3 text-center">
                          {isEditing ? <CellEdit field="goldar" type="select" /> : k.goldar || '-'}
                        </td>
                        <td className="border border-slate-200 px-4 py-3 text-center">
                          {isEditing ? <CellEdit field="ukuran_baju" type="select" /> : k.ukuran_baju || '-'}
                        </td>
                        <td className="border border-slate-200 px-4 py-3">
                          {isEditing ? <CellEdit field="status_pernikahan" type="select" /> : k.status_pernikahan || '-'}
                        </td>
                        <td className="border border-slate-200 px-4 py-3 whitespace-nowrap">
                          {isEditing ? <CellEdit field="email" /> : k.email}
                        </td>
                        <td className="border border-slate-200 px-4 py-3 whitespace-nowrap">
                          {isEditing ? <CellEdit field="no_hp" /> : k.no_hp || '-'}
                        </td>
                        <td className="border border-slate-200 px-4 py-3">
                          {isEditing ? <CellEdit field="nama_ortu" /> : k.nama_ortu || '-'}
                        </td>
                        <td className="border border-slate-200 px-4 py-3 whitespace-nowrap">
                          {isEditing ? <CellEdit field="no_hp_ortu" /> : k.no_hp_ortu || '-'}
                        </td>
                        <td className="border border-slate-200 px-4 py-3 text-center">{statusBadge(k.status)}</td>
                        <td className="border border-slate-200 px-4 py-3 max-w-[180px]">
                          {isEditing ? <CellEdit field="keterangan" /> : <span className="truncate block" title={k.keterangan}>{k.keterangan || '-'}</span>}
                        </td>
                        <td className={`sticky right-0 z-10 border border-slate-200 px-4 py-3 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] ${isEditing ? 'bg-blue-50/50' : 'bg-white'}`}>
                          <div className="flex justify-center gap-1">
                            {isEditing ? (
                              <>
                                <button onClick={saveEdit} disabled={saving}
                                  className="rounded-md border border-emerald-300 bg-emerald-50 p-1.5 text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50" title="Simpan">
                                  <Check size={13} />
                                </button>
                                <button onClick={cancelEdit}
                                  className="rounded-md border border-red-300 bg-red-50 p-1.5 text-red-600 transition hover:bg-red-100" title="Batal">
                                  <X size={13} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => setDetailKandidat(k)}
                                  className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600" title="Detail">
                                  <Eye size={13} />
                                </button>
                                <button onClick={() => startEdit(k)}
                                  className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600" title="Edit">
                                  <Edit3 size={13} />
                                </button>
                                <Link to={`/pendaftar/${k.id}/invoice`}
                                  className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600" title="Invoice">
                                  <Receipt size={13} />
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
        )}
      </div>

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
