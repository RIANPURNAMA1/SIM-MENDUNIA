import { useState, useEffect, useCallback } from 'react'
import {
  Award, ChevronDown, ChevronRight,
  Calendar, BarChart3, Clock, MessageSquare, ArrowLeft, Star
} from 'lucide-react'
import api from '../../services/api'

interface Komponen {
  nama: string
  nilai: number
}

interface DailyEntry {
  tanggal: string
  rata_rata: number | null
  komponen: Komponen[]
}

interface LevelData {
  level: string
  rata_rata: number | null
  total_pertemuan: number
  total_nilai: number
  daily: DailyEntry[]
}

interface BatchInfo {
  id: number
  nama_batch: string
  tanggal_mulai: string | null
  tanggal_selesai: string | null
  levels: { level: string; tanggal_mulai: string | null; tanggal_selesai: string | null }[]
}

export default function SiswaNilai() {
  const [batches, setBatches] = useState<BatchInfo[]>([])
  const [selectedBatch, setSelectedBatch] = useState<BatchInfo | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [levels, setLevels] = useState<LevelData[]>([])
  const [overallAvg, setOverallAvg] = useState<number | null>(null)
  const [totalPenilaian, setTotalPenilaian] = useState(0)
  const [totalHari, setTotalHari] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null)
  const [evaluations, setEvaluations] = useState<Record<string, { evaluasi: string | null; user?: { name: string } }>>({})
  const [studentEvals, setStudentEvals] = useState<Record<string, { rating: number; komentar: string | null }>>({})
  const [evalRating, setEvalRating] = useState<Record<string, number>>({})
  const [evalKomentar, setEvalKomentar] = useState<Record<string, string>>({})
  const [savingEval, setSavingEval] = useState<string | null>(null)

  useEffect(() => {
    api.get('/siswa/siswa-batches').then((res: any) => {
      setBatches(res.data.batches || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const loadBatchDetail = useCallback((batch: BatchInfo, level?: string) => {
    setSelectedBatch(batch)
    setSelectedLevel(level || null)
    setLoadingDetail(true)
    setExpandedLevel(level || null)
    setLevels([])
    setOverallAvg(null)
    setTotalPenilaian(0)
    setTotalHari(0)
    setEvaluations({})

    api.get('/siswa/nilai-lms', { params: { batch_id: batch.id } }).then((res: any) => {
      setLevels(res.data.levels || [])
      setOverallAvg(res.data.summary?.overall_avg ?? null)
      setTotalPenilaian(res.data.summary?.total_penilaian ?? 0)
      setTotalHari(res.data.summary?.total_hari ?? 0)
    }).catch(() => {}).finally(() => setLoadingDetail(false))

    api.get('/siswa/evaluations', { params: { batch_id: batch.id } }).then((res: any) => {
      setEvaluations(res.data.evaluations || {})
    }).catch(() => {})
    api.get('/siswa/evaluasi-guru', { params: { batch_id: batch.id } }).then((res: any) => {
      const raw = res.data.evaluations || {}
      setStudentEvals(raw)
      const r: Record<string, number> = {}
      const k: Record<string, string> = {}
      for (const [lv, ev] of Object.entries(raw)) {
        r[lv] = (ev as any).rating || 0
        k[lv] = (ev as any).komentar || ''
      }
      setEvalRating(r)
      setEvalKomentar(k)
    }).catch(() => {})
  }, [])

  const goBack = () => {
    setSelectedBatch(null)
    setSelectedLevel(null)
    setLevels([])
    setOverallAvg(null)
    setTotalPenilaian(0)
    setTotalHari(0)
    setEvaluations({})
    setStudentEvals({})
    setEvalRating({})
    setEvalKomentar({})
    setExpandedLevel(null)
  }

  const getBarColor = (score: number | null) => {
    if (score === null) return 'bg-gray-200'
    if (score >= 80) return 'bg-[#0069b0]'
    if (score >= 60) return 'bg-gray-500'
    return 'bg-gray-400'
  }

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00')
    return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  const formatDateShort = (d: string) => {
    const date = new Date(d + 'T00:00:00')
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
  }

  const formatDateRange = (mulai: string | null, selesai: string | null) => {
    if (!mulai || !selesai) return null
    const m = new Date(mulai)
    const s = new Date(selesai)
    return `${m.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} – ${s.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }

  const saveStudentEval = async (level: string) => {
    if (!selectedBatch || !evalRating[level]) return
    setSavingEval(level)
    try {
      await api.post('/siswa/evaluasi-guru', {
        batch_id: selectedBatch.id,
        level,
        rating: evalRating[level],
        komentar: evalKomentar[level] || null,
      })
      setStudentEvals(prev => ({
        ...prev,
        [level]: { rating: evalRating[level], komentar: evalKomentar[level] || null }
      }))
    } catch { }
    setSavingEval(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] pb-24">
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <h1 className="text-sm font-bold text-gray-900">Penilaian</h1>
        </div>
        <div className="p-8 text-center">
          <div className="relative w-10 h-10 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-gray-200 border-t-[#0069b0] animate-spin" />
          </div>
          <p className="text-xs text-gray-400 mt-3">Memuat data...</p>
        </div>
      </div>
    )
  }

  // ─── BATCH LIST VIEW ───
  if (!selectedBatch) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] pb-24">
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-sm font-bold text-gray-900">Penilaian</h1>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">Hasil penilaian harian per level</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 pt-4 space-y-3">
          {batches.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-14 h-14 rounded-full border border-gray-200 bg-white flex items-center justify-center mx-auto mb-3">
                <BarChart3 size={22} className="text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-500">Belum ada penilaian</p>
              <p className="text-xs text-gray-400 mt-1">Penilaian akan muncul setelah sensei mengisi</p>
            </div>
          ) : (
            <div className="space-y-3">
            {batches.flatMap(batch =>
              batch.levels && batch.levels.length > 0
                ? batch.levels.map(lv => (
                    <button
                      key={`${batch.id}-${lv.level}`}
                      onClick={() => loadBatchDetail(batch, lv.level)}
                      className="w-full bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 hover:bg-gray-50/50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-gray-500">L{lv.level}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{batch.nama_batch}</p>
                          <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">Level {lv.level}</span>
                        </div>
                        {lv.tanggal_mulai && lv.tanggal_selesai && (
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {formatDateRange(lv.tanggal_mulai, lv.tanggal_selesai)}
                          </p>
                        )}
                      </div>
                      <ChevronRight size={16} className="text-gray-300 shrink-0" />
                    </button>
                  ))
                : [
                    <button
                      key={`batch-${batch.id}`}
                      onClick={() => loadBatchDetail(batch)}
                      className="w-full bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 hover:bg-gray-50/50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center shrink-0">
                        <Award size={18} className="text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{batch.nama_batch}</p>
                        {batch.tanggal_mulai && batch.tanggal_selesai && (
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {formatDateRange(batch.tanggal_mulai, batch.tanggal_selesai)}
                          </p>
                        )}
                      </div>
                      <ChevronRight size={16} className="text-gray-300 shrink-0" />
                    </button>
                  ]
            )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── BATCH DETAIL VIEW ───
  return (
    <div className="min-h-screen bg-[#F7F8FC] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button onClick={goBack} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 -ml-1 transition-colors">
            <ArrowLeft size={16} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-gray-900">Penilaian</h1>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">Hasil penilaian harian per level</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-4 space-y-4">

        {/* Batch Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center shrink-0">
            <Award size={18} className="text-gray-400" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-900">{selectedBatch.nama_batch}</h2>
            {selectedLevel && (
              <p className="text-[11px] text-[#0069b0] font-medium mt-0.5">Level {selectedLevel}</p>
            )}
            {selectedBatch.tanggal_mulai && selectedBatch.tanggal_selesai && (
              <p className="text-[11px] text-gray-400 mt-0.5">
                {formatDateRange(selectedBatch.tanggal_mulai, selectedBatch.tanggal_selesai)}
              </p>
            )}
          </div>
        </div>

        {loadingDetail ? (
          <div className="p-8 text-center">
            <div className="relative w-10 h-10 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-gray-200 border-t-[#0069b0] animate-spin" />
            </div>
            <p className="text-xs text-gray-400 mt-3">Memuat data...</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="grid grid-cols-3 divide-x divide-gray-100">
                <div className="text-center px-4">
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Pertemuan</p>
                  <p className="text-xl font-semibold text-gray-900">{totalHari}</p>
                </div>
                <div className="text-center px-4">
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Total Nilai</p>
                  <p className="text-xl font-semibold text-gray-900">{totalPenilaian}</p>
                </div>
                <div className="text-center px-4">
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Rata-rata</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {overallAvg !== null ? overallAvg : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Level List */}
            {(() => {
              const displayLevels = selectedLevel
                ? levels.filter(l => l.level === selectedLevel)
                : levels

              return displayLevels.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <div className="w-14 h-14 rounded-full border border-gray-200 bg-white flex items-center justify-center mx-auto mb-3">
                    <BarChart3 size={22} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">Belum ada penilaian</p>
                  <p className="text-xs text-gray-400 mt-1">Penilaian akan muncul setelah sensei mengisi</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayLevels.map(level => {
                    const isExpanded = expandedLevel === level.level
                    const componentNames = [...new Set(
                      level.daily.flatMap(d => d.komponen.map(k => k.nama))
                    )]

                  return (
                    <div key={level.level} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      {/* Level Header */}
                      <button
                        onClick={() => setExpandedLevel(isExpanded ? null : level.level)}
                        className="w-full p-4 text-left hover:bg-gray-50/50 transition-colors flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center shrink-0 bg-white">
                          <span className="text-sm font-semibold text-gray-600">{level.level}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Level {level.level}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                {level.total_pertemuan} pertemuan · {level.total_nilai} nilai
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">
                                {level.rata_rata !== null ? level.rata_rata : '-'}
                              </span>
                              <ChevronDown size={14} className={`text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                          {/* Progress */}
                          <div className="mt-2.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${getBarColor(level.rata_rata)}`}
                              style={{ width: `${level.rata_rata ?? 0}%` }}
                            />
                          </div>
                        </div>
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="border-t border-gray-100">
                          {/* Evaluasi Guru */}
                          {evaluations[level.level]?.evaluasi && (
                            <div className="p-4 border-b border-gray-100">
                              <div className="flex items-center gap-2 mb-2">
                                <MessageSquare size={12} className="text-[#0069b0]" />
                                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Evaluasi Sensei</p>
                              </div>
                              <div className="border border-gray-200 rounded-lg p-3 bg-white">
                                <p className="text-xs text-gray-600 leading-relaxed">{evaluations[level.level].evaluasi}</p>
                                {evaluations[level.level].user && (
                                  <p className="text-[10px] text-gray-400 mt-2">— {evaluations[level.level].user!.name}</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Beri Evaluasi untuk Sensei */}
                          <div className="p-4 border-b border-gray-100">
                            <div className="flex items-center gap-2 mb-3">
                              <Star size={12} className="text-amber-500" />
                              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {studentEvals[level.level] ? 'Evaluasi Anda' : 'Beri Evaluasi'}
                              </p>
                            </div>
                            {studentEvals[level.level] && !evalRating[level.level] ? (
                              <div className="border border-gray-200 rounded-lg p-3 bg-white">
                                <div className="flex items-center gap-1 mb-2">
                                  {[1,2,3,4,5].map(s => (
                                    <Star key={s} size={14} className={s <= studentEvals[level.level].rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                                  ))}
                                  <span className="text-xs text-gray-400 ml-1">{studentEvals[level.level].rating}/5</span>
                                </div>
                                {studentEvals[level.level].komentar && (
                                  <p className="text-xs text-gray-600">{studentEvals[level.level].komentar}</p>
                                )}
                                <button
                                  onClick={() => {
                                    setEvalRating(prev => ({ ...prev, [level.level]: studentEvals[level.level].rating }))
                                    setEvalKomentar(prev => ({ ...prev, [level.level]: studentEvals[level.level].komentar || '' }))
                                  }}
                                  className="text-[10px] text-[#0069b0] font-medium mt-2 hover:underline"
                                >
                                  Edit
                                </button>
                              </div>
                            ) : (
                              <div className="border border-gray-200 rounded-lg p-3 bg-white space-y-3">
                                <div className="flex items-center gap-1">
                                  {[1,2,3,4,5].map(s => (
                                    <button key={s} type="button" onClick={() => setEvalRating(prev => ({ ...prev, [level.level]: s }))}>
                                      <Star
                                        size={20}
                                        className={`transition-colors ${(evalRating[level.level] || 0) >= s ? 'text-amber-400 fill-amber-400' : 'text-gray-200 hover:text-amber-200'}`}
                                      />
                                    </button>
                                  ))}
                                </div>
                                <textarea
                                  value={evalKomentar[level.level] || ''}
                                  onChange={e => setEvalKomentar(prev => ({ ...prev, [level.level]: e.target.value }))}
                                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0] resize-none"
                                  rows={2}
                                  placeholder="Tulis komentar untuk sensei (opsional)..."
                                />
                                <button
                                  onClick={() => saveStudentEval(level.level)}
                                  disabled={!evalRating[level.level] || savingEval === level.level}
                                  className="w-full rounded-lg bg-[#42b72a] px-3 py-2 text-xs font-semibold text-white hover:bg-[#36a022] transition disabled:opacity-50"
                                >
                                  {savingEval === level.level ? 'Menyimpan...' : 'Kirim Evaluasi'}
                                </button>
                              </div>
                            )}
                          </div>

                          {level.daily.length > 0 && (
                            <div className="border-t border-gray-100">
                              {/* Per-day score cards */}
                              {level.daily.map((day, idx) => (
                                <div key={day.tanggal} className={`${idx > 0 ? 'border-t border-gray-100' : ''} p-4`}>
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <Clock size={12} className="text-gray-300" />
                                      <p className="text-[11px] font-bold text-gray-500">{formatDate(day.tanggal)}</p>
                                    </div>
                                    <span className="text-[11px] font-medium text-gray-500">
                                      Rata-rata: {day.rata_rata ?? '-'}
                                    </span>
                                  </div>

                                  {/* Component scores */}
                                  <div className="grid grid-cols-3 gap-2">
                                    {day.komponen.map(k => (
                                      <div key={k.nama} className="border border-gray-200 rounded-lg p-3 text-center bg-white">
                                        <p className="text-[10px] font-medium text-gray-400 truncate">{k.nama}</p>
                                        <p className="text-lg font-semibold text-gray-900 mt-0.5">{k.nilai}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}

                              {/* Summary Table */}
                              {componentNames.length > 0 && (
                                <div className="border-t border-gray-100 overflow-x-auto">
                                  <table className="w-full text-[11px]">
                                    <thead>
                                      <tr>
                                        <th className="text-left px-4 py-3 font-medium text-gray-400 border-b border-r border-gray-200 bg-gray-50">Tanggal</th>
                                        {componentNames.map(name => (
                                          <th key={name} className="text-center px-3 py-3 font-medium text-gray-400 border-b border-r border-gray-200 bg-gray-50">{name}</th>
                                        ))}
                                        <th className="text-center px-3 py-3 font-medium text-gray-400 border-b border-gray-200 bg-gray-50">Rata-rata</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {level.daily.map(day => (
                                        <tr key={day.tanggal}>
                                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap border-b border-r border-gray-200 bg-white">{formatDateShort(day.tanggal)}</td>
                                          {componentNames.map(name => {
                                            const comp = day.komponen.find(k => k.nama === name)
                                            return (
                                              <td key={name} className="text-center px-3 py-3 border-b border-r border-gray-200 bg-white">
                                                {comp ? (
                                                  <span className="font-semibold text-gray-900">{comp.nilai}</span>
                                                ) : (
                                                  <span className="text-gray-200">-</span>
                                                )}
                                              </td>
                                            )
                                          })}
                                          <td className="text-center px-3 py-3 border-b border-gray-200 bg-white">
                                            <span className="font-semibold text-gray-900">
                                              {day.rata_rata !== null ? day.rata_rata : '-'}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
                </div>
              )
            })()}
          </>
        )}
      </div>
    </div>
  )
}
