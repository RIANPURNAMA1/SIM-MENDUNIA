import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, BookOpen, CalendarDays, CheckCircle2, History,
  MapPin, RefreshCw, Search, X,
} from 'lucide-react'
import { pertemuanApi, PertemuanKelasParams } from '../../services/api'
import PertemuanCards, { PertemuanKelasItem } from '../../components/PertemuanCards'

interface Ringkasan {
  jumlah_kelas: number
  total_pertemuan: number
  total_terisi: number
  persen_terisi: number
}

const STATUS_TABS: { value: string; label: string }[] = [
  { value: '', label: 'Semua' },
  { value: 'aktif', label: 'Aktif' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'dibatalkan', label: 'Dibatalkan' },
]

function StatCard({ icon, label, value, hint, tone }: {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
  tone: string
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tone}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-lg font-black text-slate-800 leading-tight tabular-nums">{value}</p>
        {hint && <p className="text-[10px] text-slate-400 truncate">{hint}</p>}
      </div>
    </div>
  )
}

export default function PertemuanAdmin() {
  const [items, setItems] = useState<PertemuanKelasItem[]>([])
  const [ringkasan, setRingkasan] = useState<Ringkasan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState<PertemuanKelasParams['sort']>('terbaru')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await pertemuanApi.adminKelas({ q: debounced, status, sort })
      setItems(res.data.kelas || [])
      setRingkasan(res.data.ringkasan || null)
    } catch (e: any) {
      setItems([])
      setRingkasan(null)
      setError(e?.response?.data?.message || 'Gagal memuat daftar pertemuan. Coba muat ulang halaman.')
    } finally {
      setLoading(false)
    }
  }, [debounced, status, sort])

  useEffect(() => { load() }, [load])

  const hasFilter = !!(debounced || status || sort !== 'terbaru')
  const resetFilter = () => { setSearch(''); setDebounced(''); setStatus(''); setSort('terbaru') }

  const ringkasanTersedia = useMemo(() => {
    if (loading) return 'Memuat…'
    if (!ringkasan) return '–'
    return `${ringkasan.jumlah_kelas} kelas · ${ringkasan.total_terisi}/${ringkasan.total_pertemuan} pertemuan terisi`
  }, [loading, ringkasan])

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-[#0E6187]/10 flex items-center justify-center">
              <History size={18} className="text-[#0E6187]" />
            </span>
            Riwayat Pertemuan Kelas
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pantau isian materi, foto bukti, latihan &amp; ulangan di tiap pertemuan seluruh kelas.
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Muat Ulang
        </button>
      </div>

      {ringkasan && !error && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <StatCard
            icon={<BookOpen size={17} className="text-[#0E6187]" />} tone="bg-[#0E6187]/10"
            label="Kelas" value={String(ringkasan.jumlah_kelas)}
            hint={hasFilter ? 'sesuai filter' : 'seluruh cabang'} />
          <StatCard
            icon={<CalendarDays size={17} className="text-blue-500" />} tone="bg-blue-50"
            label="Total Pertemuan" value={String(ringkasan.total_pertemuan)}
            hint="hari kerja, diluar libur" />
          <StatCard
            icon={<CheckCircle2 size={17} className="text-emerald-500" />} tone="bg-emerald-50"
            label="Sudah Terisi" value={String(ringkasan.total_terisi)}
            hint={`sisa ${Math.max(0, ringkasan.total_pertemuan - ringkasan.total_terisi)} belum diisi`} />
          <StatCard
            icon={<MapPin size={17} className="text-amber-500" />} tone="bg-amber-50"
            label="Kelengkapan" value={`${ringkasan.persen_terisi}%`}
            hint="riwayat pertemuan terisi" />
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama kelas, batch, atau sensei…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-9 pr-8 py-2.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0E6187]/30 focus:border-[#0E6187] transition" />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400">
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 shrink-0">
            {STATUS_TABS.map(t => (
              <button key={t.value} onClick={() => setStatus(t.value)}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold whitespace-nowrap transition ${
                  status === t.value ? 'bg-white text-[#0E6187] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0E6187]/30 shrink-0">
            <option value="terbaru">Terbaru</option>
            <option value="terlama">Terlama</option>
            <option value="nama">Nama A-Z</option>
          </select>
          {hasFilter && (
            <button onClick={resetFilter}
              className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-2 text-[11px] font-bold text-slate-500 hover:bg-slate-50 transition">
              Reset
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
          <AlertTriangle size={30} className="mx-auto text-amber-500 mb-2" />
          <p className="text-sm font-bold text-amber-800">{error}</p>
          <button onClick={load}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-[11px] font-bold text-white hover:bg-amber-600 transition">
            <RefreshCw size={12} /> Coba Lagi
          </button>
        </div>
      ) : (
        <>
          <p className="text-[11px] text-slate-400 font-medium mb-3">{ringkasanTersedia}</p>
          <PertemuanCards items={items} basePath="/pertemuan" loading={loading}
            emptyText={hasFilter ? 'Tidak ada kelas yang cocok dengan filter.' : 'Belum ada kelas.'} />
        </>
      )}
    </div>
  )
}
