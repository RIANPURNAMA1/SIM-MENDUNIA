import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import {
  ClipboardCheck, Search, RotateCcw, ChevronDown, ChevronRight,
  Star, MessageSquare, Filter
} from 'lucide-react'
import api, { adminCabangApi } from '../../services/api'

interface Evaluation {
  id: number
  siswa_nama: string
  batch_nama: string
  level: string
  rating: number
  komentar: string | null
  scores: Record<string, number> | null
  text_responses: Record<string, string> | null
  created_at: string
}

interface BatchInfo {
  batch_id: number
  nama_batch: string
  level: string
  kelas_sensei_id: number
}

interface LevelBreakdown {
  level: string
  avg_rating: number | null
  count: number
}

interface InstrukturData {
  user_id: number
  nama: string
  total_kelas: number
  total_evaluasi: number
  avg_rating: number | null
  batches: BatchInfo[]
  evaluations: Evaluation[]
  level_breakdown: LevelBreakdown[]
}

interface Filters {
  batches: { id: number; nama_batch: string }[]
  levels: string[]
  gurus: { id: number; name: string }[]
}

const SCORE_LABELS: Record<string, string> = {
  penguasaan_materi_0: 'Menguasai materi dengan baik',
  penguasaan_materi_1: 'Penjelasan mudah dipahami',
  penguasaan_materi_2: 'Menjawab pertanyaan dengan baik',
  penguasaan_materi_3: 'Materi sesuai topik level',
  metode_mengajar_0: 'Mengajar menarik dan tidak membosankan',
  metode_mengajar_1: 'Memberikan contoh yang membantu',
  metode_mengajar_2: 'Kecepatan penyampaian sesuai',
  metode_mengajar_3: 'Memberi kesempatan berlatih',
  komunikasi_0: 'Berkomunikasi sopan dan profesional',
  komunikasi_1: 'Mendorong kandidat aktif',
  komunikasi_2: 'Memberi perhatian kepada seluruh kandidat',
  komunikasi_3: 'Menciptakan suasana nyaman',
  kedisiplinan_0: 'Hadir tepat waktu',
  kedisiplinan_1: 'Mempersiapkan kelas dengan baik',
  kedisiplinan_2: 'Menyelesaikan materi sesuai jadwal',
  kedisiplinan_3: 'Memberikan umpan balik yang membantu',
}

const SECTION_NAMES: Record<string, string> = {
  penguasaan_materi: 'Penguasaan Materi',
  metode_mengajar: 'Metode Mengajar',
  komunikasi: 'Komunikasi & Interaksi',
  kedisiplinan: 'Kedisiplinan & Tanggung Jawab',
}

function ratingBadge(rating: number | null) {
  if (rating === null) return <span className="text-xs text-gray-400">-</span>
  const color = rating >= 4 ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : rating >= 3 ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-red-50 text-red-600 border-red-200'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${color}`}>
      <Star size={11} className="fill-current" />
      {rating.toFixed(1)}
    </span>
  )
}

export default function EvaluasiInstruktur() {
  const location = useLocation()
  const isAdminCabang = location.pathname.startsWith('/admin-cabang')
  const [data, setData] = useState<InstrukturData[]>([])
  const [filters, setFilters] = useState<Filters>({ batches: [], levels: [], gurus: [] })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterBatch, setFilterBatch] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [filterGuru, setFilterGuru] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [expandedEvalId, setExpandedEvalId] = useState<number | null>(null)

  const fetchData = () => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (filterBatch) params.batch_id = filterBatch
    if (filterLevel) params.level = filterLevel
    if (filterGuru) params.guru_id = filterGuru
    const request = isAdminCabang
      ? adminCabangApi.evaluasiInstruktur(params)
      : api.get('/evaluasi-instruktur', { params })
    request
      .then(res => {
        setData(res.data.data || [])
        setFilters(res.data.filters || { batches: [], levels: [], gurus: [] })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const filtered = useMemo(() => {
    if (!search) return data
    return data.filter(d => d.nama.toLowerCase().includes(search.toLowerCase()))
  }, [data, search])

  const stats = useMemo(() => ({
    totalInstruktur: data.length,
    totalEvaluasi: data.reduce((s, d) => s + d.total_evaluasi, 0),
    avgAll: data.filter(d => d.avg_rating !== null).length > 0
      ? data.filter(d => d.avg_rating !== null).reduce((s, d) => s + d.avg_rating!, 0) / data.filter(d => d.avg_rating !== null).length
      : null,
  }), [data])

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] border border-blue-100">
            <ClipboardCheck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Evaluasi Instruktur</h1>
            <p className="text-sm text-slate-500">Ringkasan evaluasi kandidat terhadap instruktur</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Instruktur</p>
          <p className="text-lg font-bold text-slate-800">{stats.totalInstruktur}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Evaluasi</p>
          <p className="text-lg font-bold text-slate-800">{stats.totalEvaluasi}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Rata-rata Rating</p>
          <p className="text-lg font-bold text-[#0E6187]">
            {stats.avgAll !== null ? stats.avgAll.toFixed(1) : '-'}
            {stats.avgAll !== null && <span className="text-xs font-normal text-slate-400 ml-1">/5</span>}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama instruktur..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterBatch}
            onChange={e => setFilterBatch(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Semua Batch</option>
            {filters.batches.map(b => (
              <option key={b.id} value={b.id}>{b.nama_batch}</option>
            ))}
          </select>
          <select
            value={filterLevel}
            onChange={e => setFilterLevel(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Semua Level</option>
            {filters.levels.map(l => (
              <option key={l} value={l}>Level {l}</option>
            ))}
          </select>
          <select
            value={filterGuru}
            onChange={e => setFilterGuru(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Semua Instruktur</option>
            {filters.gurus.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <button
            onClick={() => { setSearch(''); setFilterBatch(''); setFilterLevel(''); setFilterGuru('') }}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RotateCcw size={16} />
            Reset
          </button>
          <button
            onClick={fetchData}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0E6187] px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#005a96]"
          >
            <Filter size={16} />
            Filter
          </button>
        </div>
      </div>

      {/* Instruktur Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
            <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <ClipboardCheck size={24} />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-600">Belum ada evaluasi instruktur</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(inst => (
            <div key={inst.user_id} className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Instructor Header */}
              <button
                onClick={() => setExpandedId(expandedId === inst.user_id ? null : inst.user_id)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50/50 transition-colors"
              >
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(inst.nama)}&background=0E6187&color=fff&size=40`}
                  className="h-10 w-10 rounded-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-800">{inst.nama}</p>
                    {ratingBadge(inst.avg_rating)}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500">{inst.total_kelas} kelas</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">{inst.total_evaluasi} evaluasi</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Level badges */}
                  <div className="hidden sm:flex items-center gap-1">
                    {inst.level_breakdown.slice(0, 4).map(lb => (
                      <span key={lb.level} className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                        L{lb.level}
                      </span>
                    ))}
                  </div>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${expandedId === inst.user_id ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Expanded Detail */}
              {expandedId === inst.user_id && (
                <div className="border-t border-slate-100 p-4 space-y-4">
                  {/* Level Breakdown */}
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Rata-rata per Level</p>
                    <div className="flex flex-wrap gap-2">
                      {inst.level_breakdown.map(lb => (
                        <div key={lb.level} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                          <span className="text-xs font-bold text-[#0E6187]">L{lb.level}</span>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(v => (
                              <Star key={v} size={10} className={lb.avg_rating !== null && lb.avg_rating >= v ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                            ))}
                          </div>
                          <span className="text-xs font-semibold text-slate-700">{lb.avg_rating !== null ? lb.avg_rating.toFixed(1) : '-'}</span>
                          <span className="text-[10px] text-slate-400">({lb.count})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Batches */}
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Kelas yang Diampu</p>
                    <div className="flex flex-wrap gap-2">
                      {inst.batches.map((b, i) => (
                        <span key={i} className="inline-flex items-center rounded-full bg-[#0E6187]/10 px-2.5 py-1 text-[11px] font-semibold text-[#0E6187]">
                          {b.nama_batch} — Level {b.level}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Evaluations List */}
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Detail Evaluasi Kandidat ({inst.evaluations.length})</p>
                    {inst.evaluations.length === 0 ? (
                      <p className="text-xs text-slate-400">Belum ada evaluasi</p>
                    ) : (
                      <div className="space-y-2">
                        {inst.evaluations.map(ev => (
                          <div key={ev.id} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                            <button
                              onClick={() => setExpandedEvalId(expandedEvalId === ev.id ? null : ev.id)}
                              className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50/50 transition-colors"
                            >
                              <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(ev.siswa_nama)}&background=e5e7eb&color=6b7280&size=28`}
                                className="h-7 w-7 rounded-full object-cover"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-800">{ev.siswa_nama}</p>
                                <p className="text-[10px] text-slate-400">{ev.batch_nama} — Level {ev.level}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                {[1,2,3,4,5].map(v => (
                                  <Star key={v} size={10} className={ev.rating >= v ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                                ))}
                                <span className="text-xs font-bold text-slate-700 ml-1">{ev.rating}</span>
                              </div>
                              <ChevronRight size={14} className={`text-slate-300 transition-transform ${expandedEvalId === ev.id ? 'rotate-90' : ''}`} />
                            </button>

                            {expandedEvalId === ev.id && (
                              <div className="border-t border-slate-100 p-3 space-y-3">
                                {/* Scores */}
                                {ev.scores && Object.keys(ev.scores).length > 0 && (
                                  <div className="space-y-2">
                                    {Object.entries(SECTION_NAMES).map(([sectionKey, sectionName]) => {
                                      const sectionScores = Object.entries(ev.scores!)
                                        .filter(([k]) => k.startsWith(sectionKey))
                                      if (sectionScores.length === 0) return null
                                      const sectionAvg = sectionScores.reduce((s, [, v]) => s + v, 0) / sectionScores.length
                                      return (
                                        <div key={sectionKey}>
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="text-[11px] font-semibold text-slate-700">{sectionName}</span>
                                            <span className="text-[11px] font-bold text-[#0E6187]">{sectionAvg.toFixed(1)}</span>
                                          </div>
                                          <div className="space-y-1">
                                            {sectionScores.map(([sk, sv]) => (
                                              <div key={sk} className="flex items-center justify-between text-[11px]">
                                                <span className="text-slate-500">{SCORE_LABELS[sk] || sk}</span>
                                                <div className="flex items-center gap-1">
                                                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#0E6187] rounded-full" style={{ width: `${(sv / 5) * 100}%` }} />
                                                  </div>
                                                  <span className="font-semibold text-slate-600 w-4 text-right">{sv}</span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}

                                {/* Text Responses */}
                                {ev.text_responses && Object.keys(ev.text_responses).length > 0 && (
                                  <div className="space-y-2 mt-2 pt-2 border-t border-slate-100">
                                    {Object.entries(ev.text_responses).map(([key, val]) => (
                                      <div key={key}>
                                        <p className="text-[11px] font-semibold text-slate-600 capitalize">{key.replace(/_/g, ' ')}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{val}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Komentar */}
                                {ev.komentar && (
                                  <div className="mt-2 pt-2 border-t border-slate-100">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <MessageSquare size={11} className="text-slate-400" />
                                      <p className="text-[11px] font-semibold text-slate-600">Komentar</p>
                                    </div>
                                    <p className="text-xs text-slate-500">{ev.komentar}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
