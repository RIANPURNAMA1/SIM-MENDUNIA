import { useState, useMemo } from 'react'
import {
  Upload, Download, Sparkles, Filter, Trash2, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, User, Eye,
} from 'lucide-react'

interface KandidatMJ {
  id: number
  nama: string
  pendidikan: string
  cabang: string
  jk: string
  umur: string
  bidangSsw: string
  status: string
  statusMendunia: string
}

const sampleNames = [
  'Indriyani', 'Risma', 'Adelvis Widyatama', 'PEBRI YANSAH', 'putri ratna sari', 'RAMDAN', 'Hilman Fuadi',
  'Istikomah solihatun', 'Irna', 'NENDI PURNAMA',
]

const namePool = [
  'Ahmad Fauzi', 'Siti Rahayu', 'Budi Santoso', 'Dewi Anggraini', 'Eko Prasetyo', 'Fitri Handayani',
  'Gilang Ramadhan', 'Hana Safitri', 'Iwan Setiawan', 'Joko Susilo', 'Kartika Sari', 'Lukman Hakim',
  'Maya Puspita', 'Nurul Aini', 'Oki Firmansyah', 'Putri Wulandari', 'Rudi Hartono', 'Sari Dewi',
  'Taufik Hidayat', 'Umi Kulsum', 'Vina Novita', 'Wahyu Nugroho', 'Yuni Astuti', 'Zainal Abidin',
  'Andi Saputra', 'Bella Putri', 'Candra Wijaya', 'Dian Lestari', 'Eka Yuliana', 'Fajar Sidik',
  'Gita Permata', 'Hendra Gunawan', 'Intan Permatasari', 'Jajang Nurjaman', 'Kiki Amelia', 'Laila Fitriani',
  'Miftahul Jannah', 'Nadia Rahma', 'Oman Sudrajat', 'Puji Lestari',
]

const buildItems = (): KandidatMJ[] => {
  const items: KandidatMJ[] = []
  const total = 377
  for (let i = 0; i < total; i++) {
    const nama = i < sampleNames.length ? sampleNames[i] : namePool[i % namePool.length]
    const jkCycle = ['Perempuan', 'Laki-laki', 'Perempuan', 'Laki-laki', 'Laki-laki']
    const umurPool = ['18', '22', '16', '20', '19', '24', '21', '23', '17', '25']
    items.push({
      id: i + 1,
      nama,
      pendidikan: i % 2 === 0 ? 'SMA/SMK' : (i % 3 === 0 ? '-' : 'SMA/SMK'),
      cabang: '-',
      jk: jkCycle[i % jkCycle.length],
      umur: umurPool[i % umurPool.length],
      bidangSsw: '-',
      status: 'Direview',
      statusMendunia: '-',
    })
  }
  return items
}

const allItems = buildItems()

const avatarColors = ['bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-purple-100 text-purple-700', 'bg-rose-100 text-rose-700', 'bg-sky-100 text-sky-700']

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('')
}

export default function KandidatMJ() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [cabangFilter, setCabangFilter] = useState('')
  const [screening, setScreening] = useState('Semua')
  const [showScreening, setShowScreening] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const cabangs = useMemo(() => {
    const set = new Set<string>()
    allItems.forEach(i => { if (i.cabang) set.add(i.cabang) })
    return Array.from(set)
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return allItems.filter(i => {
      if (q && !i.nama.toLowerCase().includes(q) && !i.status.toLowerCase().includes(q)) return false
      if (statusFilter && i.status !== statusFilter) return false
      if (cabangFilter && i.cabang !== cabangFilter) return false
      return true
    })
  }, [search, statusFilter, cabangFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * perPage, safePage * perPage)
  const from = filtered.length === 0 ? 0 : (safePage - 1) * perPage + 1
  const to = Math.min(safePage * perPage, filtered.length)

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

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] text-white">
            <User size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Data Kandidat</h1>
            <p className="text-sm text-slate-500">Kelola semua data kandidat</p>
          </div>
        </div>
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
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Cari..."
                className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500"
            >
              <option value="">Semua Status</option>
              <option value="Direview">Direview</option>
            </select>
            <select
              value={cabangFilter}
              onChange={e => { setCabangFilter(e.target.value); setPage(1) }}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500"
            >
              <option value="">Semua Cabang</option>
              {cabangs.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="border-b border-slate-200 px-4 py-2.5">
          <p className="text-sm font-semibold text-slate-700">
            Kandidat <span className="font-normal text-slate-500">{filtered.length} item</span>
          </p>
        </div>

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
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Status di Mendunia</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((k, idx) => (
                <tr key={k.id} className="border-b border-slate-100 transition hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{(safePage - 1) * perPage + idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColors[k.id % avatarColors.length]}`}>
                        {initials(k.nama) || <User size={16} />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{k.nama}</p>
                        <p className="text-xs text-slate-500">{k.pendidikan}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{k.cabang || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{k.jk}</td>
                  <td className="px-4 py-3 text-slate-600">{k.umur}</td>
                  <td className="px-4 py-3 text-slate-600">{k.bidangSsw || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                      {k.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{k.statusMendunia || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
                      <Eye size={13} />
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-500">
                    Tidak ada data kandidat
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row">
          <p className="text-xs text-slate-500">
            {filtered.length === 0 ? '0 item' : `${from}–${to} dari ${filtered.length}`}
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
    </div>
  )
}
